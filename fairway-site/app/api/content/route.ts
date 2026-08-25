import { NextRequest, NextResponse } from 'next/server';
import { getContent, saveContent } from '@/lib/db';

export const dynamic = 'force-dynamic';

function authed(req: NextRequest) {
  return req.cookies.get('fairway_admin')?.value === (process.env.FAIRWAY_ADMIN_PASSWORD || 'fairway2026');
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try { return NextResponse.json(await getContent()); }
  catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    await saveContent(body.id, body.value);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
