import { openai } from '@/lib/openai';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export async function transcribeVideo(videoBuffer: Buffer, filename: string): Promise<string> {
  let tempFilePath: string | null = null;

  try {
    // Create temp file
    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    tempFilePath = path.join(tempDir, `${Date.now()}-${filename}`);
    await writeFile(tempFilePath, videoBuffer);

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      language: 'tr', // Turkish
    });

    return transcription.text;
  } catch (error) {
    console.error('Error transcribing video:', error);
    throw new Error('Failed to transcribe video');
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      await unlink(tempFilePath);
    }
  }
}

export async function downloadVideo(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error downloading video:', error);
    throw new Error('Failed to download video from URL');
  }
}
