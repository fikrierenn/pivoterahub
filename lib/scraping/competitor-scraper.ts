import { spawn } from 'child_process';
import path from 'path';

export interface CompetitorData {
  username: string;
  full_name?: string;
  followers: number;
  following: number;
  posts: number;
  bio: string;
  is_verified: boolean;
  is_private: boolean;
  engagement_rate?: number;
  /** Scrape başarısızsa Python tarafından doldurulur. Varsa diğer alanlar default değerlerde. */
  error?: string;
  recent_posts?: {
    avg_likes: number;
    avg_comments: number;
    posting_frequency: string;
    content_types: {
      video_ratio: number;
      photo_ratio: number;
    };
  };
}

export interface CompetitorScrapingResult {
  competitors: CompetitorData[];
  total_scraped: number;
  total_failed: number;
}

export class CompetitorScraper {
  async scrapeCompetitors(usernames: string[]): Promise<CompetitorScrapingResult> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'competitor_scraper.py');
      const cleanUsernames = usernames.map(u => u.replace('@', '').trim()).filter(u => u);

      if (cleanUsernames.length === 0) {
        return resolve({ competitors: [], total_scraped: 0, total_failed: 0 });
      }

      console.log(`🐍 Python Scraper Başlatılıyor: ${cleanUsernames.join(', ')}`);

      const pythonProcess = spawn('python', [scriptPath, ...cleanUsernames]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log('[Python Log]:', data.toString().trim());
      });

      pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);

        if (code === 0 && stdout.trim()) {
          try {
            const result = JSON.parse(stdout.trim());

            if (result.competitors) {
              resolve(result);
            } else {
              reject(new Error('Python bozuk veri döndürdü'));
            }
          } catch (e) {
            console.error('JSON Parse Hatası:', e);
            console.error('Python Çıktısı:', stdout);
            reject(new Error('Veri okunamadı (JSON hatası)'));
          }
        } else {
          reject(new Error(`Scraping başarısız. Code: ${code}, Error: ${stderr}`));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(new Error(`Python başlatılamadı: ${err.message}`));
      });

      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Zaman aşımı (Timeout)'));
      }, 300000);
    });
  }

  /**
   * Virgül, satır sonu veya boşluk ile ayrılmış rakip listesini username dizisine çevirir.
   * Instagram URL'lerinden (`instagram.com/foo` veya `@foo`) sadece username'i çıkarır.
   */
  extractCompetitorUsernames(input: string): string[] {
    if (!input) return [];
    return input
      .split(/[\s,;\n]+/)
      .map((raw) => raw.trim())
      .filter(Boolean)
      .map((raw) => {
        // URL ise son segmenti al
        const urlMatch = raw.match(/instagram\.com\/([^/?#]+)/i);
        if (urlMatch) return urlMatch[1];
        // @username veya plain
        return raw.replace(/^@/, '');
      })
      .filter((u) => u && !u.includes('/'))
      .slice(0, 10); // güvenlik üst sınırı
  }

  /**
   * scrapeCompetitors başarısız olursa minimal mock data ile devam eder.
   * Production'a geçildiğinde mock kısmı kaldırılacak — şu an Instagram rate limit
   * nedeniyle CI ve dev'de scrape sürekli fail oluyor.
   */
  async scrapeCompetitorsWithFallback(usernames: string[]): Promise<CompetitorScrapingResult> {
    try {
      return await this.scrapeCompetitors(usernames);
    } catch (err) {
      console.warn('[CompetitorScraper] gerçek scrape başarısız, mock fallback:', err);
      const competitors: CompetitorData[] = usernames.map((u) => ({
        username: u,
        followers: 0,
        following: 0,
        posts: 0,
        bio: '',
        is_verified: false,
        is_private: false,
        error: err instanceof Error ? err.message : 'scrape failed',
      }));
      return { competitors, total_scraped: 0, total_failed: usernames.length };
    }
  }
}