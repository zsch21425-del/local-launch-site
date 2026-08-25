import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function authed(req: NextRequest) {
  return req.cookies.get('fairway_admin')?.value === (process.env.FAIRWAY_ADMIN_PASSWORD || 'fairway2026');
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const publicDir = path.join(process.cwd(), 'public', 'assets');
    let files: string[] = [];
    if (fs.existsSync(publicDir)) {
      files = fs.readdirSync(publicDir)
        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        .map(f => '/assets/' + f);
    }
    return NextResponse.json({ assets: files });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
