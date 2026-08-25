# Local Launch Launchpad Demo

Standalone demo page built without touching the live Local Launch site.

## Preview

Open `index.html` directly in a browser, or serve this folder from a local static server.

## Assets

The demo loads the existing Local Launch logo from `../../logo.jpg` (the root LocalLaunch folder).

## Notes

- CSS-only motion and visuals—no WebGL/canvas.
- Contact form is intentionally a non-submitting demo; it states this after interaction.
- Responsive layout and reduced-motion fallback are included.

## Next steps

If approved, migrate the selected sections into the production site deliberately, wiring the contact form to the existing `api/contact.js` endpoint only after verifying its current behavior.
.