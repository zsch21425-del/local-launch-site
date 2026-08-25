#!/usr/bin/env python3
"""Build the self-contained phone version of the prospect dashboard.

Reads dashboard.html + prospects.json, embeds the data, and rewrites
fetch/save to work fully client-side (localStorage) so it can be
deployed as a static site to Vercel for phone access.
"""
import json, os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(BASE, "dashboard.html")).read()
data = json.load(open(os.path.join(BASE, "prospects.json")))

# 1. Replace load() with embedded data
embed = json.dumps(data["prospects"])
old_load = """async function load() {
  try {
    const r = await fetch('/api/prospects');
    if (!r.ok) throw new Error('bad status');
    const d = await r.json();
    prospects = d.prospects || [];
  } catch (e) {
    loadFallback();
  }
  render();
}"""
new_load = """const EMBEDDED = """ + embed + """;
function load() {
  // Phone view: use embedded snapshot, then any localStorage edits on top
  try {
    const saved = localStorage.getItem('ll-prospects');
    prospects = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(EMBEDDED));
  } catch (e) {
    prospects = JSON.parse(JSON.stringify(EMBEDDED));
  }
  render();
}"""
assert old_load in html, "load() block not found"
html = html.replace(old_load, new_load)

# 2. Replace save() with localStorage save
old_save = """function save() {
  fetch('/api/prospects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prospects })
  }).then(r => r.json()).then(d => {
    if (d.ok) toast('Saved ✓' + (d.obsidian === 'synced' ? ' · Obsidian synced' : ''));
  }).catch(() => toast('Saved locally'));
}"""
new_save = """function save() {
  try { localStorage.setItem('ll-prospects', JSON.stringify(prospects)); } catch (e) {}
  toast('Saved on this device ✓ (desktop version syncs to Obsidian)');
}"""
assert old_save in html, "save() block not found"
html = html.replace(old_save, new_save)

# 3. Add a phone-view banner note in the subline
html = html.replace(
    'Local Launch internal',
    'Local Launch internal \\u00b7 phone view')

# 4. Remove server-only footer note
html = html.replace(
    'edits sync to Obsidian',
    'phone view \\u2014 edit on desktop to sync Obsidian')

out = os.path.join(BASE, "phone.html")
open(out, "w").write(html)
print(f"phone.html written: {len(html)} bytes, {len(data['prospects'])} prospects embedded")
