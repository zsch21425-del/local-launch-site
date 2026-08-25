# Builder Brief — Jackson's Junk: Restore old demo + FIX the visualizer slider

You are the BUILDER agent. The OLD Jackson's Junk demo (dark glass motion template with AI Visualizer) is what Zach prefers — "the old demo for Jackson was better. It just needed the visualizer slider to work." The NEW jtp-design rebrand is NOT wanted for this client. Your job: restore the old demo and FIX the broken before/after slider.

## Files in this directory
- `OLD-INDEX-WITH-VISUALIZER.html` — THE old Jackson's demo (has the AI Visualizer with before/after slider). This is the design to restore + fix. It is the LIVE page content from https://jacksons-junk.vercel.app.
- `REDWOOD-WORKING-VISUALIZER.html` — the Redwood Landscaping visualizer page, which has a WORKING before/after slider ("Visualizer: ✅ Working — Gemini 2.5 Flash, 413 error fixed"). Use its slider JS as the proven reference.
- `deploy.py` — deploys to `jacksons-junk-demo.vercel.app` (PROJECT = jacksons-junk-demo). Do NOT change PROJECT.

## The bug
The old Jackson's demo has an "AI Visualizer" section: a before/after slider (`#viz-slider`) with a draggable handle (`#viz-handle`) that should reveal the "before" image (`#viz-before-clip`) over the "after" base. **The slider does not move when dragged** — verified in a headless browser: dispatching pointerdown/move/up on `#viz-slider` leaves `clip.style.width` unchanged (stayed at the CSS default 50%).

### Root-cause hypothesis (verify it)
The visualizer JS (in OLD-INDEX) starts with:
```
var src = document.getElementById('viz-src');
...
if (!file || !cleanBtn) return;   // ← EARLY RETURN before slider listeners attach!
```
If `viz-file` (the hidden file input) or `viz-clean-btn` resolves null at runtime — duplicate IDs elsewhere in the page, an ID mismatch, a typo, or the element being inside a hidden/template container — the function returns BEFORE `slider.addEventListener('pointerdown', ...)` is ever attached. Result: the slider looks fine but never responds to drags.

Compare with the WORKING Redwood implementation (REDWOOD-WORKING-VISUALIZER.html lines ~453-465):
```
(function(){
  var s=document.getElementById('ba-slider');
  if(!s)return;
  var c=document.getElementById('ba-before-clip'),h=document.getElementById('ba-handle'),d=false;
  function m(x){var r=s.getBoundingClientRect(),p=Math.max(2,Math.min(98,((x-r.left)/r.width)*100));c.style.width=p+'%';h.style.left=p+'%';}
  s.addEventListener('pointerdown',function(e){d=true;s.setPointerCapture(e.pointerId);m(e.clientX);e.preventDefault();});
  s.addEventListener('pointermove',function(e){if(d)m(e.clientX);});
  s.addEventListener('pointerup',function(){d=false;});
  s.addEventListener('pointerleave',function(){d=false;});
  s.addEventListener('pointercancel',function(){d=false;});
})();
```
Key differences to check in the Jackson's version:
1. The early-return guard `if (!file || !cleanBtn) return;` — remove it or move it AFTER the slider listeners attach, OR make it non-fatal (`if (file) ...`).
2. The slider listener block is nested inside `if (slider && clip) { ... }` — verify `slider`/`clip` are non-null.
3. Check for DUPLICATE ids: count how many elements have id `viz-file`, `viz-clean-btn`, `viz-slider` etc. If duplicated, `getElementById` returns the first and the JS may bind to a hidden one.
4. Check the pointer events: the working version calls `e.preventDefault()` on pointerdown; the Jackson's version wraps `setPointerCapture` in try/catch — that's fine, but verify `upd()` computes `p` correctly and `setSlider(p)` writes `clip.style.width` and `handle.style.left`.

## The fix (deliverable)
1. Take `OLD-INDEX-WITH-VISUALIZER.html` as the base.
2. Fix the visualizer slider so dragging the handle actually moves the before/after clip width and handle position (match the working Redwood behavior). Keep the "Clear It Now" AI processing + upload features working (they use `/api/clean-driveway`).
3. Do NOT redesign the page — restore the old dark-glass design as-is, just fix the slider.
4. Save your fixed result as `index.html` in this directory.
5. Sanity-check: the slider JS should attach listeners unconditionally (no early return before attach), and you should verify no duplicate IDs break getElementById.

## Constraints
- Keep the design EXACTLY as the old demo (this is the design Zach prefers).
- Do NOT use the jtp-rebrand files (they're not in this dir).
- Phone (864) 449-4987, "You Don't Lift It. We Shift It." tagline, 6-city area — keep as-is from the old demo.
- Verify your HTML parses (HTMLParser) and the visualizer IDs are unique.

## Output
Report concisely (under 200 words): the root cause you found, what you changed to fix the slider, and confirmation the slider logic now matches the working Redwood pattern.
