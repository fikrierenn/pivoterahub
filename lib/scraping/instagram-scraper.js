import { Builder, By, until } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
export class InstagramScraper {
    constructor() {
        this.driver = null;
    }
    async initialize() {
        const options = new ChromeOptions();
        options.addArguments('--headless'); // Arka planda çalış
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');
        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    }
    async scrapeProfile(username) {
        if (!this.driver) {
            throw new Error('Scraper not initialized');
        }
        try {
            // Instagram profiline git
            const profileUrl = `https://www.instagram.com/${username.replace('@', '')}/`;
            await this.driver.get(profileUrl);
            // Sayfanın yüklenmesini bekle
            await this.driver.wait(until.elementLocated(By.css('article')), 10000);
            // Profil bilgilerini çek
            const profile = {
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
        }
        catch (error) {
            console.error(`Error scraping ${username}:`, error);
            return null;
        }
    }
    async getFollowerCount() {
        try {
            const element = await this.driver.findElement(By.xpath("//a[contains(@href, '/followers/')]/span"));
            const text = await element.getText();
            return this.parseCount(text);
        }
        catch {
            return 0;
        }
    }
    async getFollowingCount() {
        try {
            const element = await this.driver.findElement(By.xpath("//a[contains(@href, '/following/')]/span"));
            const text = await element.getText();
            return this.parseCount(text);
        }
        catch {
            return 0;
        }
    }
    async getPostCount() {
        try {
            const elements = await this.driver.findElements(By.css('article div div div span'));
            for (const element of elements) {
                const text = await element.getText();
                if (text.includes('post')) {
                    return this.parseCount(text.split(' ')[0]);
                }
            }
            return 0;
        }
        catch {
            return 0;
        }
    }
    async getBio() {
        try {
            const element = await this.driver.findElement(By.css('article header section div'));
            return await element.getText();
        }
        catch {
            return '';
        }
    }
    async isVerified() {
        try {
            await this.driver.findElement(By.css('[aria-label="Verified"]'));
            return true;
        }
        catch {
            return false;
        }
    }
    async isPrivate() {
        try {
            const text = await this.driver.getPageSource();
            return text.includes('This account is private');
        }
        catch {
            return false;
        }
    }
    async getRecentPosts() {
        try {
            // Son 6 postu al
            const postElements = await this.driver.findElements(By.css('article div div div div a'));
            const posts = [];
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
                }
                catch (error) {
                    console.error('Error getting post:', error);
                }
            }
            return posts;
        }
        catch {
            return [];
        }
    }
    parseCount(text) {
        if (!text)
            return 0;
        const cleanText = text.replace(/,/g, '').toLowerCase();
        if (cleanText.includes('k')) {
            return Math.floor(parseFloat(cleanText) * 1000);
        }
        else if (cleanText.includes('m')) {
            return Math.floor(parseFloat(cleanText) * 1000000);
        }
        else {
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
export async function scrapeCompetitors(usernames) {
    const scraper = new InstagramScraper();
    await scraper.initialize();
    const profiles = [];
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
