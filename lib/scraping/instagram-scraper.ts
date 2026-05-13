import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options as ChromeOptions, ServiceBuilder } from 'selenium-webdriver/chrome';

interface InstagramProfile {
  username: string;
  followers: number;
  following: number;
  posts: number;
  bio: string;
  isVerified: boolean;
  isPrivate: boolean;
  recentPosts: InstagramPost[];
}

interface InstagramPost {
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  hashtags: string[];
}

export class InstagramScraper {
  private driver: WebDriver | null = null;

  async initialize() {
    const options = new ChromeOptions();
    options.addArguments('--headless'); // Headless mode geri aç
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    
    // Advanced bot detection bypass
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--disable-web-security');
    options.addArguments('--disable-features=VizDisplayCompositor');
    options.addArguments('--disable-extensions');
    options.addArguments('--disable-plugins');
    options.addArguments('--disable-images'); // Hızlandırmak için
    options.addArguments('--disable-javascript'); // JS'i devre dışı bırak
    options.addArguments('--disable-css'); // CSS'i devre dışı bırak
    
    // Realistic user agent
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    options.addArguments(`--user-agent=${randomUA}`);
    
    // Bot detection bypass
    options.excludeSwitches(['enable-automation']);
    options.addArguments('--disable-blink-features=AutomationControlled');
    
    // Proxy support (opsiyonel - şimdilik kapalı)
    // options.addArguments('--proxy-server=http://proxy-server:port');
    
    // Chrome driver path'ini belirt
    const path = require('path');
    const chromedriverPath = path.join(process.cwd(), 'node_modules', 'chromedriver', 'lib', 'chromedriver', 'chromedriver.exe');
    
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(new ServiceBuilder(chromedriverPath))
      .build();
  }

  async scrapeProfile(username: string): Promise<InstagramProfile | null> {
    if (!this.driver) {
      throw new Error('Scraper not initialized');
    }

    try {
      // Instagram profiline git
      const profileUrl = `https://www.instagram.com/${username.replace('@', '')}/`;
      console.log(`Scraping Instagram profile: ${profileUrl}`);
      await this.driver.get(profileUrl);

      // Sayfanın yüklenmesini bekle - birden fazla selector dene
      console.log('Waiting for page to load...');
      
      const pageSelectors = ['article', 'main', 'section', 'div[role="main"]', 'header'];
      let pageLoaded = false;
      
      for (const selector of pageSelectors) {
        try {
          await this.driver.wait(until.elementLocated(By.css(selector)), 5000);
          console.log(`Page loaded with selector: ${selector}`);
          pageLoaded = true;
          break;
        } catch (e) {
          console.log(`Selector ${selector} not found, trying next...`);
          continue;
        }
      }
      
      if (!pageLoaded) {
        console.log('Page load timeout, but continuing...');
      }
      
      // Biraz daha bekle - sayfa tamamen yüklensin
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('Extracting profile data...');

      // Profil bilgilerini çek
      const profile: InstagramProfile = {
        username,
        followers: await this.getFollowerCount(),
        following: await this.getFollowingCount(),
        posts: await this.getPostCount(),
        bio: await this.getBio(),
        isVerified: await this.isVerified(),
        isPrivate: await this.isPrivate(),
        recentPosts: await this.getRecentPosts()
      };

      return profile;
    } catch (error) {
      console.error(`Error scraping ${username}:`, error);
      return null;
    }
  }

  private async getFollowerCount(): Promise<number> {
    try {
      // Birden fazla selector dene
      const selectors = [
        "//a[contains(@href, '/followers/')]/span",
        "//a[contains(@href, '/followers/')]/span/span",
        "//span[contains(text(), 'followers')]/../span[1]",
        "//div[contains(text(), 'followers')]",
        "//span[contains(text(), 'followers')]"
      ];

      for (const selector of selectors) {
        try {
          const element = await this.driver!.findElement(By.xpath(selector));
          const text = await element.getText();
          console.log(`Follower selector: ${selector}, text: ${text}`);
          
          if (text && (text.includes('K') || text.includes('M') || /^\d+$/.test(text.replace(/,/g, '')))) {
            return this.parseCount(text);
          }
        } catch (e) {
          continue;
        }
      }

      // CSS selectors da dene
      const cssSelectors = [
        'a[href*="/followers/"] span',
        'header section ul li:nth-child(2) span',
        'header section ul li span'
      ];

      for (const selector of cssSelectors) {
        try {
          const elements = await this.driver!.findElements(By.css(selector));
          for (const element of elements) {
            const text = await element.getText();
            if (text && (text.includes('K') || text.includes('M') || /^\d+$/.test(text.replace(/,/g, '')))) {
              console.log(`Follower CSS selector: ${selector}, text: ${text}`);
              return this.parseCount(text);
            }
          }
        } catch (e) {
          continue;
        }
      }

      console.log('Follower count not found');
      return 0;
    } catch (error) {
      console.error('Error getting follower count:', error);
      return 0;
    }
  }

  private async getFollowingCount(): Promise<number> {
    try {
      const element = await this.driver!.findElement(
        By.xpath("//a[contains(@href, '/following/')]/span")
      );
      const text = await element.getText();
      return this.parseCount(text);
    } catch {
      return 0;
    }
  }

  private async getPostCount(): Promise<number> {
    try {
      const elements = await this.driver!.findElements(
        By.css('article div div div span')
      );
      
      for (const element of elements) {
        const text = await element.getText();
        if (text.includes('post')) {
          return this.parseCount(text.split(' ')[0]);
        }
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private async getBio(): Promise<string> {
    try {
      // Birden fazla selector dene
      const selectors = [
        'article header section div div span', // Yeni Instagram yapısı
        'article header section div span', // Alternatif
        'header section div div span', // Daha genel
        'article header section div', // Eski selector
        '[data-testid="user-bio"]', // Test ID varsa
        'div[dir="auto"] span' // Bio text için
      ];

      for (const selector of selectors) {
        try {
          const elements = await this.driver!.findElements(By.css(selector));
          
          for (const element of elements) {
            const text = await element.getText();
            // Bio olabilecek text'i kontrol et (boş değil ve çok kısa değil)
            if (text && text.length > 5 && !text.includes('posts') && !text.includes('followers')) {
              console.log(`Bio found with selector: ${selector}, text: ${text.substring(0, 100)}...`);
              return text;
            }
          }
        } catch (e) {
          // Bu selector çalışmadı, devam et
          continue;
        }
      }

      console.log('Bio not found with any selector');
      return '';
    } catch (error) {
      console.error('Error getting bio:', error);
      return '';
    }
  }

  private async isVerified(): Promise<boolean> {
    try {
      await this.driver!.findElement(By.css('[aria-label="Verified"]'));
      return true;
    } catch {
      return false;
    }
  }

  private async isPrivate(): Promise<boolean> {
    try {
      const text = await this.driver!.getPageSource();
      return text.includes('This account is private');
    } catch {
      return false;
    }
  }

  private async getRecentPosts(): Promise<InstagramPost[]> {
    try {
      // Son 6 postu al
      const postElements = await this.driver!.findElements(
        By.css('article div div div div a')
      );

      const posts: InstagramPost[] = [];
      
      for (let i = 0; i < Math.min(6, postElements.length); i++) {
        try {
          const post = postElements[i];
          const href = await post.getAttribute('href');
          
          // Post detaylarını al (basit versiyon)
          const img = await post.findElement(By.css('img'));
          const imageUrl = await img.getAttribute('src');
          
          posts.push({
            imageUrl,
            caption: '', // Detay sayfasından alınabilir
            likes: 0,
            comments: 0,
            timestamp: '',
            hashtags: []
          });
        } catch (error) {
          console.error('Error getting post:', error);
        }
      }

      return posts;
    } catch {
      return [];
    }
  }

  private parseCount(text: string): number {
    if (!text) return 0;
    
    const cleanText = text.replace(/,/g, '').toLowerCase();
    
    if (cleanText.includes('k')) {
      return Math.floor(parseFloat(cleanText) * 1000);
    } else if (cleanText.includes('m')) {
      return Math.floor(parseFloat(cleanText) * 1000000);
    } else {
      return parseInt(cleanText) || 0;
    }
  }

  async close() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }
}

// Kullanım örneği
export async function scrapeCompetitors(usernames: string[]): Promise<InstagramProfile[]> {
  const scraper = new InstagramScraper();
  await scraper.initialize();

  const profiles: InstagramProfile[] = [];
  
  for (const username of usernames) {
    const profile = await scraper.scrapeProfile(username);
    if (profile) {
      profiles.push(profile);
    }
    
    // Rate limiting - 2 saniye bekle
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  await scraper.close();
  return profiles;
}