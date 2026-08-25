#!/bin/bash
# capture all 18 demos (desktop 1280 + mobile 390 full-page)
CAP=/mnt/d/Hermes/hermes-home/profiles/local-launch-supervisor/skills/web-design/website-vision-qa/scripts/capture_full_page.py
VENV=/home/zach/.hermes/hermes-agent/venv/bin/python3
mkdir -p /mnt/d/LocalLaunch/qa
while read slug domain; do
  echo "== $slug =="
  $VENV "$CAP" "https://$domain" "/mnt/d/LocalLaunch/qa/$slug" 2>&1 | tail -1
done <<'EOF'
lumberjack lumberjack-treeservice-demo.vercel.app
tree-wisemen tree-wisemen-upstate-demo.vercel.app
gotta-guy gotta-guy-home-services-demo.vercel.app
mmk mmk-pressure-washing-demo.vercel.app
sky-branch sky-branch-llc-demo.vercel.app
gulottas gulottas-window-cleaning-demo.vercel.app
brb brb-pressure-washing-demo.vercel.app
home-shield home-shield-roofing-demo.vercel.app
upstate-window upstate-window-cleaning-demo.vercel.app
fix-home fix-home-projects-demo.vercel.app
brian-dillard brian-dillard-concrete-demo.vercel.app
milford milford-mountain-landscape-demo.vercel.app
sbc sbc-handyman-services-demo.vercel.app
kanebreak kanebreak-custom-backyards-demo.vercel.app
wright-time wright-time-disposal-demo.vercel.app
all-in-one all-in-one-maintenance-demo.vercel.app
fresh-blades fresh-blades-lawn-care-demo.vercel.app
fresh-start fresh-start-pressure-washing-demo.vercel.app
EOF
echo "CAPTURE ALL DONE"
