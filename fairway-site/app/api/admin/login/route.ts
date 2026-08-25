import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const expected = process.env.FAIRWAY_ADMIN_PASSWORD || 'fairway2026';
  if (body.password === expected) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('fairway_admin', expected, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
    return res;
  }
  return NextResponse.json({ ok: false, error: 'incorrect' }, { status: 401 });
}
