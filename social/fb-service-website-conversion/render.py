from playwright.sync_api import sync_playwright

HTML = "file:///mnt/d/LocalLaunch/social/fb-service-website-conversion/card.html"
OUT = "/mnt/d/LocalLaunch/social/fb-service-website-conversion/card.png"

with sync_playwright() as p:
    b = p.chromium.launch(args=["--headless=new", "--no-sandbox"])
    page = b.new_page(viewport={"width": 1080, "height": 1080}, device_scale_factor=2)
    page.goto(HTML)
    page.wait_for_timeout(500)
    page.screenshot(path=OUT, clip={"x": 0, "y": 0, "width": 1080, "height": 1080})
    b.close()
print("rendered:", OUT)
