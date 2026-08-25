#!/bin/bash
# _build_one.sh <slug> — run Claude Code haiku builder on one demo
SLUG="$1"
DIR="/mnt/d/LocalLaunch/builder-work/$SLUG"
LOG="/tmp/claude-builder-$SLUG.log"
[ -d "$DIR" ] || { echo "NO DIR: $DIR"; exit 2; }
cd "$DIR" || exit 2
echo "Read BRIEF.md and execute the builder task with /hallmark. Edit index.html as specified. You may Read, Edit, Write, and run Bash in this directory. Do NOT touch files outside this directory. When done, report concisely with the /hallmark critique stamp and the SELF-CERTIFY line." \
  | claude -p --model haiku --max-turns 80 --dangerously-skip-permissions --allowedTools "Read,Edit,Write,Bash" \
  > "$LOG" 2>&1
echo "EXIT=$?"
echo "--- LOG TAIL ($LOG) ---"
tail -40 "$LOG"
