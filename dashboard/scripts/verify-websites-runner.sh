#!/bin/bash
# Waits for the free LL-research OpenSERP backend (droplet :7000) to come back,
# then runs verify-websites.py to completion. Resumable — safe to re-launch.
cd "$(dirname "$0")/.."
LOG=/tmp/verify-websites-runner.log
DROPLET="${LL_DROPLET:-137.184.135.50}"
MAX_WAIT_MIN=${MAX_WAIT_MIN:-720}     # give up after 12h
PROBE_URL="http://$DROPLET:7000/mega/search?text=ping&mode=fast&engines=duckduckgo&limit=1"

echo "$(date -Is) runner start; waiting for $DROPLET:7000" >>"$LOG"
waited=0
while :; do
  code=$(curl -s -o /dev/null -m 25 -w '%{http_code}' "$PROBE_URL")
  if [ "$code" = "200" ]; then
    echo "$(date -Is) backend UP (HTTP $code) — running verification" >>"$LOG"
    # --force: the baseline no-search pass already stamped every company, so a
    # plain resume would skip them all. Force a full search pass; it still writes
    # partial progress after every company, so a mid-run backend flap is safe.
    python3 scripts/verify-websites.py --force --sleep 12 --batch 12 --cooldown 90 >>"$LOG" 2>&1
    rc=$?
    echo "$(date -Is) verify pass exited rc=$rc" >>"$LOG"
    # retry any lookups that errored or stayed inconclusive
    python3 scripts/verify-websites.py --retry-errors --sleep 15 --batch 10 --cooldown 120 >>"$LOG" 2>&1
    python3 scripts/verify-websites.py --summary >>"$LOG" 2>&1
    echo "$(date -Is) runner done" >>"$LOG"
    exit 0
  fi
  waited=$((waited + 5))
  if [ "$waited" -ge "$((MAX_WAIT_MIN))" ]; then
    echo "$(date -Is) gave up after ${waited}m — backend still down (last HTTP $code)" >>"$LOG"
    exit 1
  fi
  sleep 300
done
