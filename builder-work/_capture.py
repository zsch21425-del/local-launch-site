#!/usr/bin/env python3
"""Capture full-page desktop (1280) + mobile (390) screenshots via Playwright for all 5 demos."""
from playwright.sync_api import sync_playwright

jobs = [
    ("https://milford-mountain-landscape-demo.vercel.app", "mml"),
    ("https://kanebreak-backyards-demo.vercel.app", "kb"),
    ("https://fresh-blades-lawn-demo.vercel.app", "fb"),
    ("https://all-in-one-maintenance-demo.vercel.app", "aio"),
    ("https://wright-time-disposal-demo.vercel.app", "wt"),
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    for url, slug in jobs:
        pg = browser.new_page(viewport={'width': 1280, 'height': 900})
        pg.goto(url, wait_until='networkidle', timeout=45000)
        pg.wait_for_timeout(1500)
        pg.screenshot(path=f'/tmp/{slug}_desk.png', full_page=True)
        pg.close()
        pg = browser.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=3)
        pg.goto(url, wait_until='networkidle', timeout=45000)
        pg.wait_for_timeout(1500)
        pg.screenshot(path=f'/tmp/{slug}_mob.png', full_page=True)
        pg.close()
        print(f"captured {slug}")
    browser.close()
print("done")
