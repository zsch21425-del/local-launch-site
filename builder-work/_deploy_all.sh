#!/bin/bash
# _deploy_all.sh — deploy all 18 demos sequentially, log URLs
for slug in lumberjack-tree-service tree-wisemen-upstate gotta-guy-home-services mmk-pressure-washing sky-branch-llc gulottas-window-cleaning brb-pressure-washing home-shield-roofing upstate-window-cleaning fix-home-projects brian-dillard-concrete milford-mountain-landscape sbc-handyman-services kanebreak-custom-backyards wright-time-disposal all-in-one-maintenance fresh-blades-lawn-care fresh-start-pressure-washing; do
  echo "===== $slug ====="
  bash /mnt/d/LocalLaunch/builder-work/_deploy_one.sh "$slug" 2>&1 | grep -E "Live:|Aliased to|already in use|SSO|Error|error|Traceback" | head -6
done
echo "===== DEPLOY BATCH DONE ====="
