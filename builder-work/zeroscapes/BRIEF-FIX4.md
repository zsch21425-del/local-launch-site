# Builder Brief — Zeroscapes mobile hero badge fix (final round)

You are the BUILDER agent. Fix TWO text-clipping issues on MOBILE (~390px) in `/mnt/d/LocalLaunch/builder-work/zeroscapes/index.html`:

1. **`.hero-badge`** ("15+ YEARS LICENSED & INSURED") — the word "INSURED" is cut off on the right edge on mobile. Fix: allow the badge to wrap to two lines on small screens (e.g. `white-space: normal; line-height: 1.3`) OR reduce its font-size/padding on mobile so the full text fits. Add `text-align:center`.
2. **`.hero-proof`** — the "15+ Years Experience" item text is truncated ("15+ Ye."). Fix: allow proof items to wrap on mobile (remove any `white-space:nowrap`/`overflow:hidden` that clips them) and/or reduce the proof font-size slightly on mobile so each item fits on its line. Also ensure the icons don't force overflow.

Target: on a 390px viewport, the badge shows fully ("15+ YEARS LICENSED & INSURED") and each proof item shows its full text. Keep everything else identical.

## Verify
- After the fix, the badge and proof items are fully visible at 390px with no clipping.

## Output
Report concisely: the CSS changes you made for the badge + proof wrapping on mobile.
