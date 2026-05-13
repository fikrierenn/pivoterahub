import { spawn } from 'child_process';
import path from 'path';

export interface PythonInstagramProfile {
  username: string;
  followers: number;
  following: number;
  posts: number;
  bio: string;
  is_verified: boolean;
  is_private: boolean;
}

export class PythonInstagramScraper {
  
  async scrapeProfile(username: string): Promise<PythonInstagramProfile | null> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'instaloader_scraper.py');
      const cleanUsername = username.replace('@', '');
      
      console.log(`Running Instaloader scraper for: ${cleanUsername}`);
      
      // Python script'ini çalıştır
      const pythonProcess = spawn('python', [scriptPath, cleanUsername], {
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
        console.log(`Python process exited with code: ${code}`);
        console.log('Python stdout:', stdout);
        
        if (code === 0 && stdout.trim()) {
          try {
            const result = JSON.parse(stdout.trim());
            
            if (result.error) {
              console.error('Python scraper error:', result.error);
              resolve(null);
            } else {
              // Python response'unu TypeScript interface'ine map et
              const profile: PythonInstagramProfile = {
                username: result.username || username,
                followers: result.followers || 0,
                following: result.following || 0,
                posts: result.posts || 0,
                bio: result.bio || '',
                is_verified: result.is_verified || false,
                is_private: result.is_private || false
              };
              
              console.log('Python scraper success:', profile);
              resolve(profile);
            }
          } catch (parseError) {
            console.error('Failed to parse Python output:', parseError);
            console.error('Raw output:', stdout);
            resolve(null);
          }
        } else {
          console.error('Python scraper failed:', stderr);
          resolve(null);
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        reject(error);
      });
      
      // Timeout (2 dakika)
      setTimeout(() => {
        pythonProcess.kill();
        console.error('Python scraper timeout');
        resolve(null);
      }, 120000);
    });
  }
  
  async checkPythonDependencies(): Promise<boolean> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python', ['-c', 'import instaloader; print("OK")'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let success = false;
      
      pythonProcess.stdout.on('data', (data) => {
        if (data.toString().includes('OK')) {
          success = true;
        }
      });
      
      pythonProcess.on('close', () => {
        resolve(success);
      });
      
      pythonProcess.on('error', () => {
        resolve(false);
      });
    });
  }
}

// Test fonksiyonu
export async function testPythonScraper(username: string) {
  const scraper = new PythonInstagramScraper();
  
  console.log('Checking Python dependencies...');
  const depsOk = await scraper.checkPythonDependencies();
  
  if (!depsOk) {
    console.error('Python dependencies not installed. Run: pip install instaloader');
    return null;
  }
  
  console.log('Dependencies OK, starting scrape...');
  return await scraper.scrapeProfile(username);
}