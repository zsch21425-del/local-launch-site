#!/usr/bin/env python3
"""Relay server: accepts chat from dashboard browser, forwards to Supervisor API, returns response."""
import json, http.server, urllib.request, os

SUPERVISOR_URL = 'http://127.0.0.1:9912/v1/chat/completions'
PORT = int(os.environ.get('RELAY_PORT', 9924))
API_SERVER_KEY = os.environ.get('API_SERVER_KEY', '')


def _load_api_key():
    """Load API_SERVER_KEY from env or the supervisor profile .env."""
    global API_SERVER_KEY
    if API_SERVER_KEY:
        return API_SERVER_KEY
    for path in ('/mnt/d/Hermes/hermes-home/profiles/local-launch-supervisor/.env',
                 '/home/zach/.hermes/profiles/local-launch-supervisor/.env'):
        try:
            with open(path) as f:
                for line in f:
                    if line.startswith('API_SERVER_KEY='):
                        API_SERVER_KEY = line.strip().split('=', 1)[1].strip('"').strip("'")
                        return API_SERVER_KEY
        except OSError:
            continue
    return ''

class Relay(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length)) if length else {}

        if self.path == '/chat':
            try:
                _load_api_key()
                headers = {'Content-Type': 'application/json'}
                if API_SERVER_KEY:
                    headers['Authorization'] = 'Bearer ' + API_SERVER_KEY
                req = urllib.request.Request(SUPERVISOR_URL,
                    data=json.dumps({
                        'model': 'deepseek-v4-flash',
                        'messages': [
                            {'role': 'system', 'content': 'You are the Local Launch Supervisor. Be concise. Pipeline data in /mnt/d/Documents/Hermes Vault/Local Launch/. Pricing: $300 one-time, $49/mo optional. Phone: (503) 358-5860. Help Zach manage pipeline, approve pitches, answer questions.'},
                            {'role': 'user', 'content': body.get('message', '')}
                        ],
                        'max_tokens': 500
                    }).encode(),
                    headers=headers)
                resp = json.loads(urllib.request.urlopen(req, timeout=90).read())
                reply = resp['choices'][0]['message']['content']
                self._json({'reply': reply})
            except Exception as e:
                self._json({'reply': f'Error: {e}'}, 500)
        elif self.path == '/pipeline':
            try:
                with open('/mnt/d/Documents/Hermes Vault/Local Launch/pipeline.json') as f:
                    data = json.load(f)
                self._json(data)
            except:
                self._json({'clients': []})
        else:
            self._json({'reply': 'Local Launch Supervisor online. Use /chat to talk, /pipeline for data.'})

    def _json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, format, *args):
        print(f"[relay] {args[0]}")

print(f'Relay on :{PORT} → Supervisor API')
http.server.HTTPServer(('0.0.0.0', PORT), Relay).serve_forever()
