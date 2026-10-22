// Next.js adapter for lib/api.ts. Bearer-token auth only (no cookies), so open CORS is safe here.
import { handle } from '@/lib/api.ts';

export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

async function run(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  let body: unknown = {};
  if (req.method === 'POST') {
    const text = await req.text();
    if (text.length > 20_000) return Response.json({ error: 'Request too large.' }, { status: 413, headers: CORS });
    try { body = text ? JSON.parse(text) : {}; } catch { return Response.json({ error: 'Send JSON.' }, { status: 400, headers: CORS }); }
  }
  const r = handle(req.method, path.join('/'), body, req.headers.get('authorization'), new URL(req.url).searchParams);
  return Response.json(r.body, { status: r.status, headers: { ...CORS, 'Cache-Control': 'no-store' } });
}

export const GET = run;
export const POST = run;
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
