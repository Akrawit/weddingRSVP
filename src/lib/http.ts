import { NextRequest, NextResponse } from 'next/server';

export class HttpError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function checkOrigin(request: NextRequest) {
  const expected = process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : `${request.nextUrl.protocol}//${request.headers.get('host')}`;
  if (request.headers.get('origin') !== expected) throw new HttpError('Request not allowed.', 403);
}
export async function readJson(request: NextRequest, limit = 4096): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError('Expected JSON.', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError('Missing request body.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new HttpError('Request too large.', 413); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpError('Invalid JSON.'); }
}
export function apiJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
export function apiError(error: unknown) {
  return error instanceof HttpError ? apiJson({ error: error.message }, error.status) : apiJson({ error: 'Unable to complete this request. Please try again.' }, 503);
}
