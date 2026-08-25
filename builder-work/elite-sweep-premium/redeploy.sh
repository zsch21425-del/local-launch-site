#!/bin/bash
set -e
cd /mnt/d/LocalLaunch/builder-work/elite-sweep-premium
set -a
source /home/zach/.hermes/.env 2>/dev/null || true
set +a
vercel deploy --prod --yes --token "$VERCEL_TOKEN" --name elite-sweep-cleaning-demo -e "GEMINI_API_KEY=$GEMINI_API_KEY"
