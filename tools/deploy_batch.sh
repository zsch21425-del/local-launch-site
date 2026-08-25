#!/bin/bash
# Deploy a Local Launch demo (B&M-family, has api/ + vercel.json) to Vercel CLI.
# Usage: deploy_batch.sh <dir_name> <project_slug>
set -euo pipefail

DIR="$1"
SLUG="$2"
BASE="/mnt/d/LocalLaunch/builder-work"
TOKEN=$(python3 -c "import json; print(json.load(open('/home/zach/.vercel/auth.json'))['token'])")
set -a; source /home/zach/.hermes/.env 2>/dev/null; set +a

cd "$BASE/$DIR"

echo "=== Deploying $DIR -> $SLUG ==="
npx vercel deploy --prod --yes --token "$TOKEN" --project "$SLUG" \
  -e GEMINI_API_KEY="$GEMINI_API_KEY" \
  -e VISUALIZER_SAMPLE="https://${SLUG}.vercel.app/before.jpg" 2>&1 | tail -25
echo "=== DONE $SLUG ==="
