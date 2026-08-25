import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Admin password check via a simple cookie (lightweight, sufficient for owner editor)
function authed(req: NextRequest) {
  const pw = req.cookies.get('fairway_admin')?.value;
  return pw === process.env.FAIRWAY_ADMIN_PASSWORD || pw === 'fairway2026';
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const a = await getAnalytics();
    return NextResponse.json(a);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
