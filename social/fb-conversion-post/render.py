#!/usr/bin/env python3
"""Render the bright FB conversion card HTML -> PNG via headless Chrome."""
import sys
from pathlib import Path

PY = "/mnt/d/Hermes/hermes-home/hermes-agent/venv/bin/python"
HTML = "/mnt/d/LocalLaunch/social/fb-conversion-post/card.html"
OUT = "/mnt/d/LocalLaunch/social/fb-conversion-post/fb-conversion-card.png"

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--headless=new", "--no-sandbox"])
    page = browser.new_page(
        viewport={"width": 1080, "height": 1080},
        device_scale_factor=2,
    )
    page.goto("file://" + HTML)
    page.wait_for_timeout(500)
    page.screenshot(path=OUT, clip={"x": 0, "y": 0, "width": 1080, "height": 1080})
    browser.close()

print("RENDERED", OUT, Path(OUT).stat().st_size, "bytes")
