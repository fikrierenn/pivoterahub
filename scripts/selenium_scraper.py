#!/usr/bin/env python3
"""
Selenium Instagram Scraper - Browser simulation ile rate limiting bypass
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import time
import random
import sys

def create_driver():
    """Chrome driver oluştur"""
    options = Options()
    options.add_argument('--headless')  # Headless mode
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    try:
        driver = webdriver.Chrome(options=options)
        return driver
    except Exception as e:
        print(f"Chrome driver error: {e}", file=sys.stderr)
        return None

def scrape_profile_selenium(username):
    """Selenium ile profil scrape et"""
    driver = create_driver()
    if not driver:
        return None
    
    try:
        url = f"https://www.instagram.com/{username}/"
        print(f"Loading: {url}", file=sys.stderr)
        
        driver.get(url)
        
        # Sayfanın yüklenmesini bekle
        time.sleep(random.uniform(3, 6))
        
        # Profil bilgilerini çek
        try:
            # Takipçi sayısı
            followers_elem = driver.find_element(By.XPATH, "//a[contains(@href, '/followers/')]/span")
            followers_text = followers_elem.get_attribute('title') or followers_elem.text
            followers = parse_number(followers_text)
            
            # Takip sayısı  
            following_elem = driver.find_element(By.XPATH, "//a[contains(@href, '/following/')]/span")
            following_text = following_elem.text
            following = parse_number(following_text)
            
            # Gönderi sayısı
            posts_elem = driver.find_element(By.XPATH, "//div[contains(text(), 'posts')]/../span")
            posts_text = posts_elem.text
            posts = parse_number(posts_text)
            
            # Bio
            try:
                bio_elem = driver.find_element(By.XPATH, "//div[@data-testid='user-bio']")
                bio = bio_elem.text
            except:
                bio = ""
            
            # Doğrulanma durumu
            try:
                driver.find_element(By.XPATH, "//div[@data-testid='verified-icon']")
                is_verified = True
            except:
                is_verified = False
            
            return {
                'username': username,
                'followers': followers,
                'following': following,
                'posts': posts,
                'bio': bio,
                'is_verified': is_verified,
                'is_private': False  # Public profil varsayımı
            }
            
        except Exception as e:
            print(f"Profile parsing error: {e}", file=sys.stderr)
            return None
            
    except Exception as e:
        print(f"Selenium error: {e}", file=sys.stderr)
        return None
    finally:
        driver.quit()

def parse_number(text):
    """Sayı parse et (1.2K -> 1200)"""
    if not text:
        return 0
    
    text = text.replace(',', '').replace('.', '')
    
    if 'K' in text:
        return int(float(text.replace('K', '')) * 1000)
    elif 'M' in text:
        return int(float(text.replace('M', '')) * 1000000)
    else:
        try:
            return int(text)
        except:
            return 0

def main():
    if len(sys.argv) < 2:
        print("Usage: python selenium_scraper.py <username>", file=sys.stderr)
        sys.exit(1)
    
    username = sys.argv[1].replace('@', '').strip()
    
    print(f"Scraping {username} with Selenium...", file=sys.stderr)
    
    profile = scrape_profile_selenium(username)
    
    if profile:
        print(json.dumps(profile))
    else:
        print(json.dumps({"error": f"Failed to scrape {username}"}))

if __name__ == "__main__":
    main()