"""Vercel serverless function: /api/clean-driveway
Flask app. Takes a cluttered-space photo (base64), sends it to Gemini image-gen to 'clear' it
it, returns the cleaned image as base64. GEMINI_API_KEY lives here (server-side).
"""
import json, base64, os, urllib.request, urllib.error
from flask import Flask, request, jsonify

app = Flask(__name__)

SAMPLE_URL = os.environ.get(
    "VISUALIZER_SAMPLE",
    "https://{{SLUG}}-demo.vercel.app/junk-before-real.jpg",
)

INSTRUCTION = (
    "Remove all clutter, boxes, furniture, appliances, and debris from this room, "
    "garage, attic, or space. Make it completely empty, swept, and clean, just like "
    "a junk removal team finished hauling everything away. Keep the exact same angle, "
    "composition, walls, floor, and lighting. Only remove the items and clean the area; "
    "do not change the structure. Photorealistic."
)


@app.route("/", methods=["GET", "POST"])
@app.route("/api/clean-driveway", methods=["GET", "POST"])
def index():
    if request.method == "GET":
        return jsonify({"ok": True, "msg": "clean-driveway endpoint"})
    data = request.get_json(silent=True) or {}
    image_b64 = data.get("image_b64", "")
    if not image_b64:
        # fall back to the shipped sample junk-space photo
        try:
            req = urllib.request.Request(SAMPLE_URL)
            with urllib.request.urlopen(req, timeout=15) as r:
                image_b64 = base64.b64encode(r.read()).decode()
        except Exception:
            return jsonify({"error": "image_b64 required and sample fetch failed"}), 400

    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        return jsonify({"error": "no gemini key configured"}), 500

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-3-pro-image:generateContent?key=" + key
    )
    payload = {
        "contents": [
            {
                "parts": [
                    {"inlineData": {"mimeType": "image/jpeg", "data": image_b64}},
                    {"text": data.get("instruction", INSTRUCTION)},
                ],
                "role": "user",
            }
        ],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=90) as r:
            out = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return jsonify({"error": f"gemini http {e.code}: {e.read().decode()[:200]}"}), 502
    except Exception as e:
        return jsonify({"error": str(e)[:300]}), 502

    parts = out.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    img = next((p for p in parts if p.get("inlineData", {}).get("data")), None)
    if not img:
        return jsonify({"error": "no image in gemini response"}), 502

    return jsonify(
        {
            "image_b64": img["inlineData"]["data"],
            "mime": img["inlineData"].get("mimeType", "image/jpeg"),
        }
    )
