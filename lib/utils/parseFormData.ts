import busboy from 'busboy';
import { Readable } from 'stream';

export interface ParsedFormData {
  fields: Record<string, string>;
  file: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  } | null;
}

export async function parseFormData(request: Request): Promise<ParsedFormData> {
  const contentType = request.headers.get('content-type') ?? '';
  const bodyBuffer = Buffer.from(await request.arrayBuffer());

  if (bodyBuffer.byteLength === 0) {
    throw new Error('Request body is empty');
  }

  return new Promise((resolve, reject) => {
    const fields: Record<string, string> = {};
    let file: ParsedFormData['file'] = null;

    const bb = busboy({ headers: { 'content-type': contentType }, limits: { fileSize: 500 * 1024 * 1024 } });

    bb.on('file', (name, stream, info) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => {
        if (name === 'file') {
          file = {
            buffer: Buffer.concat(chunks),
            filename: info.filename || `upload-${Date.now()}`,
            mimeType: info.mimeType || 'application/octet-stream',
          };
        }
      });
    });

    bb.on('field', (name, value) => { fields[name] = value; });
    bb.on('finish', () => resolve({ fields, file }));
    bb.on('error', reject);

    Readable.from(bodyBuffer).pipe(bb);
  });
}
