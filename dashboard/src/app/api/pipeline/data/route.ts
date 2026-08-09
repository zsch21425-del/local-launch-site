import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PIPELINE_PATH = path.join(process.cwd(), "data", "pipeline.json");

/** GET: return live pipeline data */
export async function GET() {
  try {
    if (!fs.existsSync(PIPELINE_PATH)) {
      return NextResponse.json({ clients: [], stats: { total: 0 } });
    }
    const raw = fs.readFileSync(PIPELINE_PATH, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, clients: [] }, { status: 500 });
  }
}

/** POST: Supervisor pushes pipeline updates from vault */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dir = path.dirname(PIPELINE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PIPELINE_PATH, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true, count: body?.clients?.length || 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, ok: false }, { status: 500 });
  }
}
