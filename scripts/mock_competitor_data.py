#!/usr/bin/env python3
"""
Mock competitor data for testing
"""

import json
import sys
from datetime import datetime

def generate_mock_data(usernames):
    """Mock rakip verisi üret"""
    
    mock_profiles = {
        'istanbultarla': {
            'username': 'istanbultarla',
            'full_name': 'ARSA TARLA OFİSİ',
            'followers': 48667,
            'following': 47,
            'posts': 172,
            'bio': '🧑GAYRIMENKUL DANIŞMANI \n👨‍💻ORHAN KABAN\n🏡ARSA - TARLA -  KÖY EVİ - MEYVE BAHÇESİ - ÇİFTLİK 🤝SATILIK HER BÜTÇEYE UYGUN ARAZİLERİMİZ MEVCUTTUR.\n🇹🇷TÜRKİYE',
            'is_verified': True,
            'is_private': False,
            'external_url': '',
            'engagement_rate': 1.79,
            'category': 'Arsa/Arazi',
            'recent_posts': {
                'avg_likes': 448,
                'avg_comments': 11,
                'posting_frequency': 'Monthly or less',
                'content_types': {'video_ratio': 100.0, 'photo_ratio': 0.0},
                'recent_posts_count': 12,
                'engagement_rate': 0.95
            },
            'avg_likes': 448,
            'avg_comments': 11,
            'posting_frequency': 'Monthly or less',
            'content_types': {'video_ratio': 100.0, 'photo_ratio': 0.0}
        },
        'araziland': {
            'username': 'araziland',
            'full_name': 'Araziland | Arazi, Arsa ve Tarla Yatırımı',
            'followers': 27769,
            'following': 3,
            'posts': 55,
            'bio': '🌱 "Toprak Yanıltmaz; Araziland Kazandırır"',
            'is_verified': False,
            'is_private': False,
            'external_url': '',
            'engagement_rate': 4.51,
            'category': 'Yatırım',
            'recent_posts': {
                'avg_likes': 42,
                'avg_comments': 2,
                'posting_frequency': 'Monthly or less',
                'content_types': {'video_ratio': 66.7, 'photo_ratio': 33.3},
                'recent_posts_count': 12,
                'engagement_rate': 0.16
            },
            'avg_likes': 42,
            'avg_comments': 2,
            'posting_frequency': 'Monthly or less',
            'content_types': {'video_ratio': 66.7, 'photo_ratio': 33.3}
        },
        'rahman.kececi': {
            'username': 'rahman.kececi',
            'full_name': 'Rahman Kececi | Emlak Uzmanı',
            'followers': 15420,
            'following': 890,
            'posts': 234,
            'bio': '🏠 Emlak Danışmanı\n📍 İstanbul\n💼 15 Yıl Deneyim\n📞 Hemen Ara',
            'is_verified': False,
            'is_private': False,
            'external_url': '',
            'engagement_rate': 2.3,
            'category': 'Emlak',
            'recent_posts': {
                'avg_likes': 89,
                'avg_comments': 5,
                'posting_frequency': 'Weekly',
                'content_types': {'video_ratio': 40.0, 'photo_ratio': 60.0},
                'recent_posts_count': 12,
                'engagement_rate': 0.61
            },
            'avg_likes': 89,
            'avg_comments': 5,
            'posting_frequency': 'Weekly',
            'content_types': {'video_ratio': 40.0, 'photo_ratio': 60.0}
        }
    }
    
    competitors = []
    for username in usernames:
        clean_username = username.replace('@', '').strip()
        if clean_username in mock_profiles:
            competitors.append(mock_profiles[clean_username])
        else:
            # Generic mock data
            competitors.append({
                'username': clean_username,
                'full_name': f'{clean_username.title()} Profile',
                'followers': 10000,
                'following': 500,
                'posts': 100,
                'bio': f'Mock bio for {clean_username}',
                'is_verified': False,
                'is_private': False,
                'engagement_rate': 2.0,
                'category': 'Other',
                'avg_likes': 50,
                'avg_comments': 3,
                'posting_frequency': 'Weekly',
                'content_types': {'video_ratio': 50.0, 'photo_ratio': 50.0}
            })
    
    return {
        'competitors': competitors,
        'total_scraped': len(competitors),
        'total_failed': 0,
        'duration_seconds': 1.0,
        'timestamp': datetime.now().isoformat(),
        'note': 'Mock data - Instagram rate limited'
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: python mock_competitor_data.py <username1> [username2] ...", file=sys.stderr)
        sys.exit(1)
    
    usernames = sys.argv[1:]
    result = generate_mock_data(usernames)
    print(json.dumps(result))

if __name__ == "__main__":
    main()