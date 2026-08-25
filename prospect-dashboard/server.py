#!/usr/bin/env python3
"""Local Launch Prospect Dashboard server.

Serves the dashboard at http://localhost:8787 and persists edits:
  - GET  /                    -> dashboard.html
  - GET  /api/prospects       -> prospects.json
  - POST /api/prospects       -> save prospects.json AND regenerate the
                                 Obsidian pipeline file (00 - Prospects.md)

Run:  python3 server.py   (or ./server.py)
"""
import json
import os
import sys
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROSPECTS_FILE = os.path.join(BASE_DIR, "prospects.json")
OBSIDIAN_FILE = os.path.join(
    "/mnt/d/Obsidian/Local-Launch/Prospects", "00 - Prospects.md"
)

STAGE_LABELS = {
    "audited": "🔍 Audited",
    "demo_built": "🎨 Demo Built",
    "outreach_drafted": "📝 Outreach Drafted",
    "contacted": "📞 Contacted",
    "demo_shown": "🖥️ Site Demo",
    "proposal": "📋 Proposal Sent",
    "paid": "✅ Paid Client",
    "on_hold": "⏸️ On Hold",
    "re_audit": "🔁 Re-Audit",
    "re_pitch": "🔁 Re-Pitch",
    "lost": "❌ Lost",
}

STAGE_ORDER = [
    "audited",
    "demo_built",
    "outreach_drafted",
    "contacted",
    "demo_shown",
    "proposal",
    "paid",
    "on_hold",
    "re_audit",
    "re_pitch",
    "lost",
]


def generate_markdown(prospects):
    """Build the Obsidian 00 - Prospects.md pipeline table from prospect data."""
    counts = {}
    for p in prospects:
        counts[p.get("stage", "audited")] = counts.get(p.get("stage", "audited"), 0) + 1

    lines = []
    lines.append("# 🎯 Local Launch — Prospect Pipeline")
    lines.append("")
    lines.append(
        f"**{len(prospects)} prospects tracked | "
        f"{counts.get('paid', 0)} paid | {counts.get('outreach_drafted', 0)} outreach drafted | "
        f"{counts.get('demo_built', 0)} demos built**"
    )
    lines.append("")
    lines.append("## Pipeline Overview")
    lines.append("")
    lines.append("| Status | Count |")
    lines.append("|--------|:-----:|")
    for stage in STAGE_ORDER:
        label = STAGE_LABELS.get(stage, stage)
        c = counts.get(stage, 0)
        if c > 0:
            lines.append(f"| {label} | {c} |")
    lines.append("")
    lines.append("## Prospects")
    lines.append("")
    lines.append("| # | Business | Phone | City | Vertical | Stage | Demo |")
    lines.append("|---|----------|-------|------|----------|-------|------|")
    for i, p in enumerate(prospects, 1):
        stage_label = STAGE_LABELS.get(p.get("stage", "audited"), p.get("stage", ""))
        demo = p.get("demo", "") or "—"
        lines.append(
            f"| {i} | {p.get('name', '')} | {p.get('phone', '')} | "
            f"{p.get('city', '')} | {p.get('vertical', '')} | {stage_label} | {demo} |"
        )
    lines.append("")
    lines.append(f"*Auto-synced from dashboard — last updated {date.today().isoformat()}*")
    lines.append("")
    return "\n".join(lines)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stderr.write(f"[dashboard] {fmt % args}\n")

    def _send(self, code, body, ctype="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            html = os.path.join(BASE_DIR, "dashboard.html")
            if not os.path.exists(html):
                self._send(404, b"dashboard.html not found - build it first", "text/plain")
                return
            with open(html, "rb") as f:
                self._send(200, f.read(), "text/html")
        elif self.path == "/api/prospects":
            with open(PROSPECTS_FILE, "rb") as f:
                self._send(200, f.read())
        else:
            self._send(404, b"not found", "text/plain")

    def do_POST(self):
        if self.path != "/api/prospects":
            self._send(404, b"not found", "text/plain")
            return
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw)
            prospects = data.get("prospects", [])
        except json.JSONDecodeError:
            self._send(400, json.dumps({"error": "bad json"}).encode())
            return

        # 1. Save the canonical JSON
        with open(PROSPECTS_FILE, "w") as f:
            json.dump({"prospects": prospects}, f, indent=2)

        # 2. Regenerate the Obsidian markdown file
        md = generate_markdown(prospects)
        try:
            os.makedirs(os.path.dirname(OBSIDIAN_FILE), exist_ok=True)
            with open(OBSIDIAN_FILE, "w") as f:
                f.write(md)
            obsidian_status = "synced"
        except Exception as e:
            obsidian_status = f"error: {e}"

        self._send(200, json.dumps({"ok": True, "obsidian": obsidian_status}).encode())


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8787"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Prospect dashboard: http://localhost:{port}")
    print(f"Obsidian sync: {OBSIDIAN_FILE}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
