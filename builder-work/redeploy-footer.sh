#!/bin/bash
PY=/home/zach/hermes-agent/venv/bin/python3
for d in country-life-tires upstate-tree-solutions seases-tree-services sparrow-fencing buy-sell-landscape-supply garcias-painting; do
  echo "===== $d ====="
  cd "/mnt/d/LocalLaunch/builder-work/$d" && "$PY" deploy.py 2>&1 | grep -E "Live|error" | tail -1
done
echo "===== elite-sweep (Vercel CLI) ====="
bash /mnt/d/LocalLaunch/builder-work/elite-sweep-premium/redeploy.sh 2>&1 | grep -E "ready|Error" | tail -1
echo "ALL DONE"
