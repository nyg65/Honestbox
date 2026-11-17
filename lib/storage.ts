// Where photo files live. With HB_S3_BUCKET set, files go to that private S3 bucket under photos/;
// otherwise they are written next to the database (fine for development; wiped on Render's free plan).
import { mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export interface FileStore {
  readonly kind: 'local' | 's3';
  put(name: string, body: Buffer, contentType: string): Promise<void>;
  get(name: string): Promise<Buffer | null>;
  remove(name: string): Promise<void>;
}

export function localDir() {
  const dir = process.env.HB_UPLOAD_DIR
    || (process.env.HB_DB_PATH ? join(dirname(resolve(process.env.HB_DB_PATH)), 'uploads') : join(process.cwd(), 'data', 'uploads'));
  mkdirSync(dir, { recursive: true });
  return dir;
}

const local: FileStore = {
  kind: 'local',
  async put(name, body) { await writeFile(join(localDir(), name), body); },
  async get(name) { try { return await readFile(join(localDir(), name)); } catch { return null; } },
  async remove(name) { const p = join(localDir(), name); if (existsSync(p)) unlinkSync(p); },
};

function s3Store(bucket: string): FileStore {
  const client = new S3Client({ region: process.env.HB_S3_REGION || process.env.AWS_REGION || 'us-east-1' });
  const key = (name: string) => `photos/${name}`;
  return {
    kind: 's3',
    async put(name, body, contentType) {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key(name), Body: body, ContentType: contentType, CacheControl: 'public, max-age=31536000, immutable' }));
    },
    async get(name) {
      try {
        const r = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key(name) }));
        return r.Body ? Buffer.from(await r.Body.transformToByteArray()) : null;
      } catch (e) {
        const code = (e as { name?: string; $metadata?: { httpStatusCode?: number } });
        if (code.name === 'NoSuchKey' || code.$metadata?.httpStatusCode === 404) return null;
        throw e;
      }
    },
    async remove(name) { await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key(name) })); },
  };
}

let cached: FileStore | null = null;
let override: FileStore | null = null;
export function store(): FileStore {
  if (override) return override;
  if (!cached) cached = process.env.HB_S3_BUCKET ? s3Store(process.env.HB_S3_BUCKET) : local;
  return cached;
}
/** Tests only: swap in another store. */
export function setStoreForTests(s: FileStore | null) { override = s; }
