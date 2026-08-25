#!/bin/bash
cd /mnt/d/LocalLaunch/builder-work/elite-sweep-premium
cat > /tmp/es-prompt.txt <<'EOF'
Read BRIEF.md and execute the builder task with /hallmark. Rebrand index.html into the Elite Sweep Property Cleaning pressure-washing premium demo exactly as BRIEF.md specifies, including porting the AI visualizer section from /mnt/d/LocalLaunch/builder-work/elite-sweep-cleaning/index.html. You may Read, Edit, Write, and run Bash in THIS directory only. Do NOT touch other files or directories. Do NOT modify api/clean-driveway.py, vercel.json, or requirements.txt. When done, report concisely with the /hallmark critique stamp + the SELF-CERTIFY line from the BRIEF.
EOF
claude -p --model haiku --max-turns 30 --dangerously-skip-permissions --allowedTools "Read,Edit,Write,Bash" < /tmp/es-prompt.txt > /tmp/claude-builder-elite-sweep.log 2>&1
echo "EXIT=$?"
tail -30 /tmp/claude-builder-elite-sweep.log
