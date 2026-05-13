#!/usr/bin/env python3
"""
Competitor Scraper (Multi-Profile)
Kullanim: python competitor_scraper.py <username1> <username2> ...
Output: JSON { "competitors": [...], "total_scraped": N, "total_failed": N }
"""

import sys
import json
import time
import random
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

class InstagramScraper:
    def __init__(self):
        self.driver = None

    def setup_driver(self):
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
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
        """Tekil profil scraping islemleri"""
        try:
            url = f"https://www.instagram.com/{username.replace('@', '')}/"
            sys.stderr.write(f"Analyzing: {username}\n")

            self.driver.get(url)
            time.sleep(random.uniform(5, 8))

            current_url = self.driver.current_url
            if 'login' in current_url.lower():
                sys.stderr.write(f"Login wall hit for {username}\n")
                return None

            profile_data = {
                'username': username,
                'followers': self.get_count('a[href*="/followers/"] span') or self.get_count('header ul li:nth-child(2) span'),
                'following': self.get_count('a[href*="/following/"] span') or self.get_count('header ul li:nth-child(3) span'),
                'posts': self.get_count('header ul li:first-child span'),
                'bio': self.get_bio(),
                'is_verified': self.check_exists('[aria-label*="Verified"]'),
                'is_private': 'This account is private' in self.driver.page_source
            }
            return profile_data

        except Exception as e:
            sys.stderr.write(f"Error scraping {username}: {str(e)}\n")
            return None

    def get_count(self, selector):
        try:
            elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
            for el in elements:
                txt = el.get_attribute('title') or el.text
                return self.parse_count(txt)
        except:
            return 0
        return 0

    def get_bio(self):
        try:
            selectors = ['div[data-testid="user-bio"]', 'header section div:nth-last-child(2)', 'h1 + div']
            for sel in selectors:
                els = self.driver.find_elements(By.CSS_SELECTOR, sel)
                if els:
                    return els[0].text
        except:
            pass
        return ""

    def check_exists(self, selector):
        return len(self.driver.find_elements(By.CSS_SELECTOR, selector)) > 0

    def parse_count(self, text):
        if not text:
            return 0
        text = text.replace(',', '').replace('.', '').lower()
        try:
            if 'k' in text:
                return int(float(text.replace('k', '')) * 1000)
            if 'm' in text:
                return int(float(text.replace('m', '')) * 1000000)
            return int(text)
        except:
            return 0

    def close(self):
        if self.driver:
            self.driver.quit()


def main():
    usernames = sys.argv[1:]

    if not usernames:
        print(json.dumps({"competitors": [], "total_scraped": 0, "total_failed": 0}))
        sys.exit(0)

    scraper = InstagramScraper()
    results = []
    failed = 0

    try:
        if not scraper.setup_driver():
            raise Exception("Driver init failed")

        for user in usernames:
            data = scraper.scrape_profile(user)
            if data:
                results.append(data)
            else:
                failed += 1

        final_output = {
            "competitors": results,
            "total_scraped": len(results),
            "total_failed": failed
        }

        print(json.dumps(final_output))

    except Exception as e:
        sys.stderr.write(f"Fatal Error: {str(e)}\n")
        print(json.dumps({"competitors": [], "error": str(e)}))

    finally:
        scraper.close()


if __name__ == "__main__":
    main()