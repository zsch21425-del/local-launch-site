#!/usr/bin/env python3
"""Generate an image via the ChatGPT/Codex backend (gpt-6-astra + native
image_generation tool). The image returns as base64 in the `result` field of
the `image_generation_call` output item in the SSE stream.

Usage: python3 astra_image.py "<prompt>" <output.png>
       python3 astra_image.py --list <prompt>   # returns N=4 grid? not supported
"""
import base64, json, os, re, subprocess, sys

AUTH_PATH = os.path.expanduser("~/.hermes/auth.json")
BASE = "https://chatgpt.com/backend-api/codex/responses"


def get_token():
    return json.load(open(AUTH_PATH))["credential_pool"]["openai-codex"][0]["access_token"]


def gen(prompt, out_path, size="auto", quality="auto"):
    tok = get_token()
    tools = [{"type": "image_generation"}]
    body = json.dumps({
        "model": "gpt-6-astra",
        "input": [{"role": "user", "content": prompt}],
        "store": False, "stream": True, "tools": tools,
    })
    r = subprocess.run(
        ["curl", "-s", "-N", BASE, "-H", "Authorization: Bearer " + tok,
         "-H", "Content-Type: application/json", "-d", body],
        capture_output=True, text=True, timeout=600)
    raw = r.stdout
    if r.returncode != 0 or not raw.strip():
        print("ERR", r.returncode, raw[:500]); return None

    # Find the image_generation_call item with a base64 `result`
    m = re.search(r'"type":"image_generation_call"[^{]*"result":"([A-Za-z0-9+/=]+)"', raw)
    if not m:
        # fallback: last occurrence of result field in image_generation_call blocks
        blocks = re.findall(r'"result":"([A-Za-z0-9+/=]{100,})"', raw)
        if blocks:
            data = base64.b64decode(blocks[-1])
        else:
            print("NO_IMAGE — no base64 result found. tail:")
            print(raw[-1000:])
            return None
    else:
        data = base64.b64decode(m.group(1))

    open(out_path, "wb").write(data)
    print("SAVED", out_path, len(data), "bytes")
    return out_path


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    prompt, out = sys.argv[1], sys.argv[2]
    gen(prompt, out)
