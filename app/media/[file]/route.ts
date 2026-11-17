import { FILE_RE } from '@/lib/photos.ts';
import { store } from '@/lib/storage.ts';

// Serves processed watch photos. File names are random and never reused, so they can be cached forever.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!FILE_RE.test(file)) return new Response('Not found', { status: 404 });
  const body = await store().get(file);
  if (!body) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(body), { headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
}
