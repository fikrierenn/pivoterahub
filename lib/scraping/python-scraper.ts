import { spawn } from 'child_process';
import path from 'path';

export interface ScrapedVideoData {
  platform: 'instagram' | 'tiktok' | 'youtube';
  title?: string;
  description: string;
  hashtags: string[];
  published_at: string;
  duration_sec?: number;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves?: number;
  };
  author: {
    username: string;
    follower_count?: number;
    verified?: boolean;
  };
  video_url?: string;
  thumbnail_url?: string;
  engagement_rate?: number;
}

export async function scrapeVideoWithPython(url: string): Promise<ScrapedVideoData> {
  return new Promise((resolve, reject) => {
    // Python script'inin yolu
    const scriptPath = path.join(process.cwd(), 'scripts', 'video_scraper.py');
    
    console.log('🐍 Running Python video scraper:', scriptPath);
    
    // Python script'ini spawn ile çalıştır
    const pythonProcess = spawn('python', [scriptPath, url], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('Python stderr:', data.toString());
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python video scraper exited with code: ${code}`);
      console.log('Python stdout:', stdout);

      if (code === 0 && stdout.trim()) {
        try {
          // Python script'inin JSON output'unu parse et
          const result = JSON.parse(stdout.trim());
          
          if (result.error) {
            console.error('Python scraper error:', result.error);
            reject(new Error('Veri cekilemedi'));
            return;
          }

          // Sadece gerçek veriler varsa engagement rate hesapla
          if (result.metrics && result.metrics.views > 0) {
            const totalEngagement = result.metrics.likes + result.metrics.comments + 
                                   (result.metrics.shares || 0) + (result.metrics.saves || 0);
            result.engagement_rate = (totalEngagement / result.metrics.views) * 100;
          }

          console.log('✅ Python video scraper completed successfully');
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse Python output:', parseError);
          console.error('Raw output:', stdout);
          reject(new Error('Veri cekilemedi'));
        }
      } else {
        console.error('Python video scraper failed:', stderr);
        reject(new Error('Veri cekilemedi'));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python video scraper process:', error);
      reject(error);
    });

    // Timeout (30 saniye)
    setTimeout(() => {
      pythonProcess.kill();
      console.error('Python video scraper timeout');
      reject(new Error('Python scraper timeout'));
    }, 30000);
  });
}

// Platform detection utility
export function detectPlatform(url: string): 'instagram' | 'tiktok' | 'youtube' | null {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return null;
}
