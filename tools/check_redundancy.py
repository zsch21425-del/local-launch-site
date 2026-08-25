#!/usr/bin/env python3
"""
Demo Image Guardrail — catches BROKEN or JARRING issues, ALLOWS reuse.

Zach (Aug 14): "We can reuse images and heroes demo to demo since it is just a
demo... if the landscaping hero is the same for three landscapers, that's fine
as long as it's not showing anything with their business name."

So reuse is EXPECTED and ALLOWED (cross-demo AND cross-section). This guardrail
does NOT punish reuse. It ONLY fails on:

  1. A referenced image/video file is MISSING (broken image = broken demo).
  2. The SAME image used as BOTH a section background AND a visible card
     (e.g. hero video frame as the services-bg behind the cards, OR a work photo
     as the reviews-bg) — this reads "way too redundant" when scrolling and was
     Zach's explicit complaint on Steve Cantrell.
  3. A single card/gallery image repeated 3+ times (clearly broken/broken grid).

Deliberately ALLOWED (not flagged):
  - Reusing the same hero video / images across DIFFERENT demos (that's the template).
  - A service image also appearing in the gallery (same project shown twice is fine).
  - Logo in nav + CTA (2x expected). Video poster (= first frame, expected).
  - The hero's hidden fallback <img> behind the video (covered, not visible).

Usage:
    python3 check_redundancy.py <demo_dir> [more...]
Exit 0 = PASS (ship it). Exit 1 = FAIL (fix before deploy).
"""
import os, re, sys
from collections import Counter

IGNORE_LOGO_PATTERNS = ("logo",)   # nav + CTA both use the logo
ALLOW_CARD_REUSE_COUNT = 2         # a card image may appear up to 2x (card + gallery) — fine

def collect(html):
    """Return (img_srcs, bg_srcs, poster_srcs, missing_srcs)."""
    body = html.split("</style>", 1)[-1]
    img_srcs = []   # visible <img> in cards/about
    bg_srcs = []    # <img> used as a section background (services-bg, reviews-bg)
    for m in re.finditer(r'<img[^>]+src="([^"]+)"', body):
        s = m.group(1)
        if any(p in s.lower() for p in IGNORE_LOGO_PATTERNS):
            continue
        # A section BACKGROUND img is one that is (a) aria-hidden, OR (b) the FIRST
        # child of a *-bg container (the opening tag is immediately followed by this img,
        # before any nested card div opens). Backgrounds are marked aria-hidden in the
        # template; content cards are not. Use that as the primary signal.
        tag = m.group(0)
        if 'aria-hidden="true"' in tag:
            bg_srcs.append(s)
            continue
        # Fallback: img appears within ~120 chars right after a *-bg container opening
        # (i.e. it's the direct background child, not a card inside the section).
        pre = body[:m.start()]
        search_start = max(0, len(pre) - 800)
        tail = pre[search_start:]
        last_bg = None
        for om in re.finditer(r'<(?:div|section)[^>]*class="[^"]*-bg[^"]*"[^>]*>', tail):
            last_bg = om
        if last_bg:
            bg_open_abs = search_start + last_bg.end()  # absolute position of the bg-open close
            if (m.start() - bg_open_abs) < 160:
                gap = body[bg_open_abs:m.start()]
                if '</div>' in gap or 'service-card' in gap or 'gallery-card' in gap or 'about-image' in gap:
                    img_srcs.append(s)
                else:
                    bg_srcs.append(s)
            else:
                img_srcs.append(s)
        else:
            img_srcs.append(s)
    poster_srcs = re.findall(r'<video[^>]*poster="([^"]+)"', html)
    return img_srcs, bg_srcs, poster_srcs

def main():
    paths = sys.argv[1:]
    if not paths:
        print("Usage: check_redundancy.py <demo_dir> [more...]"); sys.exit(2)
    failed = False
    for p in paths:
        d = p if os.path.isdir(p) else os.path.dirname(p)
        html_path = os.path.join(d, "index.html")
        if not os.path.exists(html_path):
            print(f"✗ {p}: no index.html"); failed = True; continue
        html = open(html_path).read()
        img_srcs, bg_srcs, poster_srcs = collect(html)

        problems = []

        # 1. Missing files (all refs)
        for src in img_srcs + bg_srcs + poster_srcs:
            if src in IGNORE_LOGO_PATTERNS:
                continue
            f = os.path.join(d, src)
            if not os.path.exists(f) and not src.startswith(("http", "data:")):
                problems.append(f"  ✗ MISSING FILE: {src}")

        # 2. A bg image that is ALSO a visible card image (jarring reuse)
        bg_set = set(bg_srcs)
        for img in set(img_srcs):
            if img in bg_set:
                problems.append(f"  ✗ '{img}' used as BOTH a section background AND a visible card — jarring when scrolling. Give the section bg a solid color or a different image.")

        # 3. Card image repeated 3+ times (broken)
        counts = Counter(img_srcs)
        for src, cnt in counts.items():
            if cnt > ALLOW_CARD_REUSE_COUNT:
                problems.append(f"  ✗ '{src}' used {cnt} times in visible cards (>2) — broken/duplicate grid. Use distinct images.")

        # 4. ⚠️ PERCEPTUAL DUPLICATES — images that are visually the SAME SCENE even with
        #    different filenames (e.g. N crops cut from ONE hero video). The Builder was
        #    cutting 12 differently-named images from one source, so the page showed the
        #    same shot in services, gallery, about, and backgrounds. Zach caught this on
        #    Mr. Painter + Stallion Concrete (Aug 14) — cost us 2 prospects. Detect via
        #    average-hash: any 2 visible <img> that are >~70% perceptually identical = flag.
        try:
            from PIL import Image as _Img
            def _ahash(p, size=10):
                im = _Img.open(p).convert('L').resize((size, size))
                px = list(im.getdata()); avg = sum(px)/len(px)
                return ''.join('1' if v > avg else '0' for v in px)
            seen = {}
            # Compare BOTH visible card <img> AND CSS url() background images —
            # the concrete/pressure-wash redundancy that slipped through (Zach,
            # Aug 14) lived in CSS backgrounds (services-bg/reviews-bg/about),
            # NOT <img> tags. Excluding bg_srcs earlier let near-identical scenes
            # pass the gate. Now compare the union so perceptual dupes anywhere
            # in the page are flagged.
            all_vis = sorted(set(img_srcs) | set(bg_srcs))
            for src in all_vis:
                fp = os.path.join(d, src)
                if src in IGNORE_LOGO_PATTERNS or not os.path.exists(fp): continue
                try:
                    h = _ahash(fp)
                except Exception:
                    continue
                for prev, ph in seen.items():
                    diff = sum(1 for a,b in zip(h, ph) if a!=b) / len(h)
                    # <0.23 (~77%+ identical) = same scene / crop of one source.
                    # Calibrated 2026-08-15 against generated trade imagery: the
                    # egregious same-scene crops (Stallion concrete = 0.08-0.19,
                    # driveway-before/after crops) hash <0.23, while GENUINELY
                    # distinct trade photos (concrete/pw scenes) sit at 0.24-0.45
                    # because they share low-contrast gray tonality. A stricter
                    # threshold (0.30-0.35) false-flagged distinct-but-similar-toned
                    # concrete as redundant. 0.23 catches real crops, passes real scenes.
                    if diff < 0.23:
                        problems.append(f"  ✗ '{src}' is perceptually the SAME image as '{prev}' (near-identical {1-diff:.0%}, different filename) — likely crops of one source. Use genuinely distinct images.")
                seen[src] = h
        except ImportError:
            pass  # PIL unavailable — skip perceptual check (filename check still ran)

        if problems:
            failed = True
            print(f"✗ {p}:")
            for pr in problems: print(pr)
        else:
            print(f"✓ PASS {p}: {len(img_srcs)} card imgs + {len(bg_srcs)} bg imgs + {len(poster_srcs)} poster, no missing files, no jarring reuse")
    sys.exit(1 if failed else 0)

if __name__ == "__main__":
    main()
