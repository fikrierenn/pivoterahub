#!/usr/bin/env python3
"""
Instagram Profile Scraper
Kullanim: python instagram_scraper.py <username>
"""

import sys
import json
import time
import random
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

class InstagramScraper:
    def __init__(self):
        self.driver = None

    def setup_driver(self):
        """Chrome driver'ini bot detection bypass ile kur"""
        try:
            options = Options()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1920,1080')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)

            user_agents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
            options.add_argument(f'--user-agent={random.choice(user_agents)}')

            chrome_driver_path = os.path.join(os.getcwd(), 'node_modules', 'chromedriver', 'lib', 'chromedriver', 'chromedriver.exe')

            if os.path.exists(chrome_driver_path):
                service = Service(chrome_driver_path)
                self.driver = webdriver.Chrome(service=service, options=options)
            else:
                self.driver = webdriver.Chrome(options=options)

            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            return True

        except Exception as e:
            sys.stderr.write(f"Driver setup error: {e}\n")
            return False

    def scrape_profile(self, username):
        """Instagram profilini scrape et"""
        try:
            url = f"https://www.instagram.com/{username.replace('@', '')}/"
            sys.stderr.write(f"Scraping: {url}\n")

            self.driver.get(url)
            time.sleep(random.uniform(8, 12))

            page_source = self.driver.page_source
            sys.stderr.write(f"Page source length: {len(page_source)}\n")

            title = self.driver.title
            sys.stderr.write(f"Page title: {title}\n")

            current_url = self.driver.current_url
            sys.stderr.write(f"Current URL: {current_url}\n")

            if 'login' in current_url.lower() or 'accounts/login' in current_url:
                sys.stderr.write("Redirected to login page - Instagram blocking\n")
                return None

            profile_data = {
                'username': username,
                'followers': self.get_followers(),
                'following': self.get_following(),
                'posts': self.get_posts_count(),
                'bio': self.get_bio(),
                'is_verified': self.is_verified(),
                'is_private': self.is_private()
            }

            sys.stderr.write(f"Scraped data: {profile_data}\n")
            return profile_data

        except Exception as e:
            sys.stderr.write(f"Scraping error: {e}\n")
            return None

    def get_followers(self):
        selectors = [
            'a[href*="/followers/"] span',
            'header section ul li:nth-child(2) span',
            'span[title]'
        ]

        for selector in selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for element in elements:
                    text = element.get_attribute('title') or element.text
                    if text and ('K' in text or 'M' in text or text.replace(',', '').isdigit()):
                        return self.parse_count(text)
            except:
                continue

        return 0

    def get_following(self):
        selectors = [
            'a[href*="/following/"] span',
            'header section ul li:nth-child(3) span'
        ]

        for selector in selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for element in elements:
                    text = element.text
                    if text and ('K' in text or 'M' in text or text.replace(',', '').isdigit()):
                        return self.parse_count(text)
            except:
                continue

        return 0

    def get_posts_count(self):
        selectors = [
            'header section ul li:first-child span',
            'div[data-testid="user-posts-count"]'
        ]

        for selector in selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for element in elements:
                    text = element.text
                    if text and ('K' in text or 'M' in text or text.replace(',', '').isdigit()):
                        return self.parse_count(text)
            except:
                continue

        return 0

    def get_bio(self):
        selectors = [
            'header section div div span',
            'div[data-testid="user-bio"]',
            'header section div span',
            'article header section div div span'
        ]

        for selector in selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for element in elements:
                    text = element.text.strip()
                    if (
                        text and len(text) > 10 and
                        'posts' not in text.lower() and
                        'followers' not in text.lower() and
                        'following' not in text.lower()
                    ):
                        return text
            except:
                continue

        return ""

    def is_verified(self):
        try:
            self.driver.find_element(By.CSS_SELECTOR, '[aria-label*="Verified"]')
            return True
        except:
            return False

    def is_private(self):
        try:
            page_source = self.driver.page_source
            return 'This account is private' in page_source
        except:
            return False

    def parse_count(self, text):
        if not text:
            return 0

        clean_text = text.replace(',', '').replace('.', '').lower()

        try:
            if 'k' in clean_text:
                return int(float(clean_text.replace('k', '')) * 1000)
            elif 'm' in clean_text:
                return int(float(clean_text.replace('m', '')) * 1000000)
            else:
                return int(clean_text)
        except:
            return 0

    def close(self):
        if self.driver:
            self.driver.quit()


def main():
    if len(sys.argv) != 2:
        sys.stderr.write("Usage: python instagram_scraper.py <username>\n")
        sys.exit(1)

    username = sys.argv[1]
    scraper = InstagramScraper()

    try:
        if not scraper.setup_driver():
            print(json.dumps({"error": "Failed to setup driver"}))
            sys.exit(1)

        profile_data = scraper.scrape_profile(username)

        if profile_data:
            print(json.dumps(profile_data))
        else:
            print(json.dumps({"error": "Failed to scrape profile"}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

    finally:
        scraper.close()


if __name__ == "__main__":
    main()