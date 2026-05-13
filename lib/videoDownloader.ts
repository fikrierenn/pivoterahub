// Video URL'den indirme — yt-dlp wrapper.
// SSRF koruması: sadece whitelist'teki public domain'ler, internal IP'ler bloklanır.

import ytdlp from 'yt-dlp-exec';
import path from 'path';
import { promises as fs } from 'fs';
import { createTempDir } from './ffmpeg';
import { logger } from './logger';

const ALLOWED_HOSTS = [
  'youtube.com',
  'youtu.be',
  'm.youtube.com',
  'www.youtube.com',
  'instagram.com',
  'www.instagram.com',
  'tiktok.com',
  'www.tiktok.com',
  'vm.tiktok.com',
  'facebook.com',
  'www.facebook.com',
  'fb.watch',
  'twitter.com',
  'x.com',
];

// Internal IP aralıkları — SSRF koruması
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

export class InvalidVideoUrlError extends Error {
  constructor(public reason: string) {
    super(`Geçersiz video URL: ${reason}`);
  }
}

/**
 * URL'nin güvenli olduğunu doğrular: whitelist host + internal IP olmamak.
 */
export function validateVideoUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new InvalidVideoUrlError('parse hatası');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new InvalidVideoUrlError(`desteklenmeyen protokol: ${url.protocol}`);
  }
  const host = url.hostname.toLowerCase();
  if (PRIVATE_IP_PATTERNS.some((p) => p.test(host))) {
    throw new InvalidVideoUrlError('internal IP yasak (SSRF koruması)');
  }
  if (!ALLOWED_HOSTS.some((h) => host === h || host.endsWith('.' + h))) {
    throw new InvalidVideoUrlError(`whitelist dışı host: ${host}`);
  }
  return url;
}

export interface DownloadResult {
  filePath: string;
  fileName: string;
  sizeBytes: number;
  durationSec: number | null;
  title: string;
  cleanup: () => Promise<void>;
}

export interface VideoMetadata {
  title: string;
  duration: number | null;
  uploader: string | null;
  view_count: number | null;
  description: string | null;
  thumbnail: string | null;
  url: string;
}

/**
 * Sadece metadata çek — indirme yapma.
 */
export async function fetchVideoMetadata(rawUrl: string): Promise<VideoMetadata> {
  const url = validateVideoUrl(rawUrl);
  const start = Date.now();

  const info = await ytdlp(url.toString(), {
    dumpSingleJson: true,
    noWarnings: true,
    noCheckCertificate: process.env.NODE_ENV === 'development',
    addHeader: 'referer:youtube.com',
    skipDownload: true,
  });

  logger.info('video metadata fetched', { host: url.hostname, ms: Date.now() - start });

  const i = info as Record<string, unknown>;
  return {
    title: typeof i.title === 'string' ? i.title : '',
    duration: typeof i.duration === 'number' ? i.duration : null,
    uploader: typeof i.uploader === 'string' ? i.uploader : null,
    view_count: typeof i.view_count === 'number' ? i.view_count : null,
    description: typeof i.description === 'string' ? i.description : null,
    thumbnail: typeof i.thumbnail === 'string' ? i.thumbnail : null,
    url: url.toString(),
  };
}

/**
 * Video'yu indir. Caller `cleanup()` ile temp dosyaları silmeli.
 */
export async function downloadVideo(rawUrl: string, options: { maxDurationSec?: number } = {}): Promise<DownloadResult> {
  const url = validateVideoUrl(rawUrl);
  const { maxDurationSec = 600 } = options;
  const start = Date.now();

  // Önce metadata: süre çok uzunsa erken hata
  const meta = await fetchVideoMetadata(url.toString());
  if (meta.duration && meta.duration > maxDurationSec) {
    throw new InvalidVideoUrlError(`video ${meta.duration}s — max ${maxDurationSec}s sınırı`);
  }

  const { dir, cleanup } = await createTempDir('ytdlp');
  const outputTemplate = path.join(dir, '%(id)s.%(ext)s');

  try {
    await ytdlp(url.toString(), {
      output: outputTemplate,
      format: 'mp4/best[ext=mp4]/best',
      noWarnings: true,
      noCheckCertificate: process.env.NODE_ENV === 'development',
      addHeader: 'referer:youtube.com',
    });

    const files = await fs.readdir(dir);
    const downloadedFile = files.find((f) => /\.(mp4|webm|mkv|mov)$/i.test(f));
    if (!downloadedFile) throw new Error('İndirilen video dosyası bulunamadı');

    const filePath = path.join(dir, downloadedFile);
    const stat = await fs.stat(filePath);

    logger.info('video downloaded', {
      host: url.hostname,
      fileName: downloadedFile,
      sizeBytes: stat.size,
      ms: Date.now() - start,
    });

    return {
      filePath,
      fileName: downloadedFile,
      sizeBytes: stat.size,
      durationSec: meta.duration,
      title: meta.title,
      cleanup,
    };
  } catch (err) {
    await cleanup();
    throw err;
  }
}
