import { NextRequest, NextResponse } from 'next/server';
import { recordOutboundClick } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    await recordOutboundClick(body.slug || 'unknown', body.url || '');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
