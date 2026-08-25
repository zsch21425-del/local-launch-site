#!/bin/bash
set -e
PY=/home/zach/hermes-agent/venv/bin/python3
for d in sparrow-fencing seases-tree-services garcias-painting coopers-plumbing buy-sell-landscape-supply; do
  echo "===== DEPLOYING $d ====="
  cd "/mnt/d/LocalLaunch/builder-work/$d"
  "$PY" deploy.py 2>&1 | tail -6
  echo ""
done
echo "ALL DONE"
