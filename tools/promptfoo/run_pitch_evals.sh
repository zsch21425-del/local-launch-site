#!/bin/bash
# run_pitch_evals.sh — run the Local Launch pitch-voice regression suite.
# Usage: ./run_pitch_evals.sh   (extra args pass through to `promptfoo eval`)
set -e
cd "$(dirname "$0")"

# DeepSeek key for the eval (the real drafting model) — from the shared env.
export DEEPSEEK_API_KEY="$(grep -m1 '^DEEPSEEK_API_KEY=' /home/zach/.hermes/.env | cut -d= -f2- | tr -d '"' | tr -d "'")"
# OpenRouter key for the free nemotron grader.
export OPENROUTER_API_KEY="$(grep -m1 '^OPENROUTER_API_KEY=' /home/zach/.hermes/.env | cut -d= -f2- | tr -d '"' | tr -d "'")"

if [ -z "$DEEPSEEK_API_KEY" ]; then
  echo "⛔ DEEPSEEK_API_KEY not found in /home/zach/.hermes/.env" >&2
  exit 2
fi

promptfoo eval "$@"
