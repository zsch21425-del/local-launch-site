#!/bin/bash
# Monitor for the vision-verify cron: prints the count of "pending-verify"
# demos (deterministic — no timestamps). Change from 0 → >0 wakes the agent.
cd /mnt/d/LocalLaunch/dashboard
node scripts/verify-demo.js list 2>/dev/null | grep -c '"id"' || echo 0
