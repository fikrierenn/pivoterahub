#!/usr/bin/env python3
"""
Instagram Profile Scraper using Instaloader
Kullanım: python instaloader_scraper.py <username>
"""

import sys
import json
import instaloader
from instaloader import Profile

def scrape_profile(username):
    """Instagram profilini instaloader ile scrape et"""
    try:
        # Instaloader instance oluştur
        L = instaloader.Instaloader()
        
        # User-agent ayarla
        L.context._session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
        # Profili yükle
        clean_username = username.replace('@', '')
        print(f"Loading profile: {clean_username}", file=sys.stderr)
        
        profile = Profile.from_username(L.context, clean_username)
        
        # Profil verilerini çıkar
        profile_data = {
            'username': profile.username,
            'followers': profile.followers,
            'following': profile.followees,
            'posts': profile.mediacount,
            'bio': profile.biography or '',
            'is_verified': profile.is_verified,
            'is_private': profile.is_private,
            'full_name': profile.full_name or '',
            'external_url': profile.external_url or ''
        }
        
        print(f"Successfully scraped: {profile_data}", file=sys.stderr)
        return profile_data
        
    except instaloader.exceptions.ProfileNotExistsException:
        print(f"Profile {username} does not exist", file=sys.stderr)
        return {"error": "Profile not found"}
        
    except instaloader.exceptions.LoginRequiredException:
        print("Login required - Instagram blocking anonymous access", file=sys.stderr)
        return {"error": "Login required"}
        
    except instaloader.exceptions.ConnectionException as e:
        print(f"Connection error: {e}", file=sys.stderr)
        return {"error": f"Connection error: {str(e)}"}
        
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return {"error": f"Unexpected error: {str(e)}"}

def main():
    if len(sys.argv) != 2:
        print("Usage: python instaloader_scraper.py <username>", file=sys.stderr)
        sys.exit(1)
    
    username = sys.argv[1]
    result = scrape_profile(username)
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()