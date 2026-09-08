#!/bin/bash
# Pre-commit secret scan — blocks commits that reintroduce hardcoded secrets.
# Install: cp scripts/pre-commit-secrets.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
set -uo pipefail

# Common secret shapes: A2A tokens, Neon DB passwords, AWS keys, private keys,
# and connection strings with embedded credentials.
PATTERN='(a2a_[a-z0-9]{20,}|npg_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}|ghp_[A-Za-z0-9]{20,}|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|postgresql://[^/@[:space:]]+:[^/@[:space:]]+@)'

staged=$(git diff --cached --name-only -z -- '*.js' '*.py' '*.ts' '*.tsx' '*.json' '*.sh' '*.env*')
if [ -z "$staged" ]; then
  exit 0
fi

if echo "$staged" | xargs -0 grep -HnE "$PATTERN" 2>/dev/null; then
  echo ""
  echo "❌ Secret scan FAILED: remove hardcoded secrets from the staged files above."
  echo "   Read them from environment variables instead (process.env / os.environ)."
  exit 1
fi

exit 0
