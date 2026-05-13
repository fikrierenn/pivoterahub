// FFmpeg singleton + temp dir helper.
// Sistem ffmpeg binary'sini kullanır. FFMPEG_PATH env var ile override edilebilir.
// Vercel deploy için ayrı plan (binary yok); local dev'de PATH'te ffmpeg olmalı.

import ffmpeg from 'fluent-ffmpeg';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';

if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

export { ffmpeg };

/**
 * Benzersiz temp dizin yarat — caller `cleanup()` ile silmeli (finally bloğunda).
 * Dosyalar `os.tmpdir()/pivotera-<uuid>/` altında.
 */
export async function createTempDir(prefix = 'pivotera'): Promise<{ dir: string; cleanup: () => Promise<void> }> {
  const dir = path.join(os.tmpdir(), `${prefix}-${Date.now()}-${randomUUID()}`);
  await fs.mkdir(dir, { recursive: true });
  return {
    dir,
    cleanup: async () => {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {
        // Cleanup hatası kritik değil — sadece warn'la
      }
    },
  };
}

/**
 * Video süresini saniye olarak döndürür. ffprobe gerektirir.
 */
export function probeDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration;
      resolve(typeof duration === 'number' ? duration : 0);
    });
  });
}
