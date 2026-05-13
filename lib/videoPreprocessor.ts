// Video frame extraction.
// 0.5 fps sampling sonrası `sampleEvenly` ile max 5 frame'e indirir
// (Vision API maliyet kontrolü: 5 frame × ~200KB = ~1MB payload).

import path from 'path';
import { promises as fs } from 'fs';
import { ffmpeg, createTempDir, probeDuration } from './ffmpeg';
import { logger } from './logger';

export interface FrameExtractionOptions {
  /** Saniyede kaç frame örnekle. Default 0.5 (her 2 saniyede bir). */
  fps?: number;
  /** Maximum dönecek frame sayısı (Vision API limiti). Default 5. */
  maxFrames?: number;
  /** Çıktı genişliği (yüksek = maliyet artar). Default 720. */
  width?: number;
  /** Maksimum video süresi saniye. Default 60 — daha uzun ise hata. */
  maxDurationSec?: number;
}

export interface ExtractedFrames {
  paths: string[];
  base64: string[];
  durationSec: number;
  cleanup: () => Promise<void>;
}

/** Eşit aralıkla N öğe seç. */
function sampleEvenly<T>(items: T[], n: number): T[] {
  if (items.length <= n) return [...items];
  const step = (items.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => items[Math.round(i * step)]);
}

/**
 * Video'dan frame'leri çıkarır. Caller mutlaka `cleanup()` çağırmalı (finally).
 *
 * ```ts
 * const { base64, cleanup } = await extractFrames(videoPath);
 * try {
 *   await visionAnalyze(base64);
 * } finally {
 *   await cleanup();
 * }
 * ```
 */
export async function extractFrames(
  videoPath: string,
  options: FrameExtractionOptions = {},
): Promise<ExtractedFrames> {
  const { fps = 0.5, maxFrames = 5, width = 720, maxDurationSec = 60 } = options;

  const durationSec = await probeDuration(videoPath);
  if (durationSec > maxDurationSec) {
    throw new Error(`Video ${durationSec.toFixed(1)}s — max ${maxDurationSec}s sınırını aşıyor`);
  }

  const { dir, cleanup } = await createTempDir('frames');
  const pattern = path.join(dir, 'frame-%03d.jpg');

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([`-vf`, `fps=${fps},scale=${width}:-1`])
        .output(pattern)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    const files = (await fs.readdir(dir))
      .filter((f) => f.startsWith('frame-') && f.endsWith('.jpg'))
      .sort()
      .map((f) => path.join(dir, f));

    if (files.length === 0) {
      throw new Error('Frame extraction sonuç vermedi (boş dizin)');
    }

    const sampled = sampleEvenly(files, maxFrames);
    const base64 = await Promise.all(
      sampled.map(async (p) => {
        const buf = await fs.readFile(p);
        return buf.toString('base64');
      }),
    );

    logger.info('frames extracted', {
      videoPath,
      durationSec,
      totalFrames: files.length,
      sampledFrames: sampled.length,
    });

    return { paths: sampled, base64, durationSec, cleanup };
  } catch (err) {
    await cleanup();
    throw err;
  }
}
