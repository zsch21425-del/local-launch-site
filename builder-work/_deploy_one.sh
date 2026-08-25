#!/bin/bash
# _deploy_one.sh <slug> — set Vercel project name + deploy a finished demo
SLUG="$1"
DIR="/mnt/d/LocalLaunch/builder-work/$SLUG"
PROJECT="${SLUG}-demo"
[ -d "$DIR" ] || { echo "NO DIR: $DIR"; exit 2; }
cd "$DIR" || exit 2
# pin the Vercel project name to this slug
sed -i "s/^PROJECT = .*/PROJECT = \"$PROJECT\"/" deploy.py
grep -q "PROJECT = \"$PROJECT\"" deploy.py || { echo "FAILED to set PROJECT"; exit 2; }
/home/zach/.hermes/hermes-agent/venv/bin/python3 deploy.py 2>&1
