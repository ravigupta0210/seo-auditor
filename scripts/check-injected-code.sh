#!/usr/bin/env bash
#
# Guard against code injection into tracked source files.
#
# On 2026-07-27 someone force-pushed to main with a 32,295-character obfuscated
# payload appended to frontend/next.config.js — a file that executes on every
# `next build`. It read process.env, spawned child processes, and exfiltrated to
# a C2 fronted by an Ethereum RPC. It was invisible in review because it sat on
# a single very long line after the legitimate `module.exports`.
#
# Two cheap signals catch that class of attack:
#   1. Absurdly long lines. The longest legitimate line in this repo is ~1,520
#      chars (a blog JSON), so 5,000 leaves a wide margin.
#   2. Hex-identifier obfuscation (_0x1a2b), the signature of every common
#      JavaScript obfuscator.
#
# Exit 1 on detection. Run locally with: bash scripts/check-injected-code.sh
set -uo pipefail

MAX_LINE=5000
FAILED=0

# package-lock.json is generated and legitimately dense; .md files are prose.
EXCLUDE='package-lock\.json|\.min\.(js|css)$|\.md$'

echo "Scanning tracked files for injected code..."

while IFS= read -r f; do
  [ -f "$f" ] || continue

  # 1. Overlong lines
  long=$(awk -v m="$MAX_LINE" 'length > m { print NR": "length" chars"; exit }' "$f")
  if [ -n "$long" ]; then
    echo "::error file=$f::Line exceeds ${MAX_LINE} chars ($long) — possible injected payload"
    FAILED=1
  fi

  # 2. Hex-identifier obfuscation, only in executable sources
  case "$f" in
    *.js|*.ts|*.tsx|*.jsx|*.mjs|*.cjs)
      if grep -qE '_0x[0-9a-f]{4,}' "$f"; then
        echo "::error file=$f::Obfuscated hex identifiers (_0x…) detected — possible injected payload"
        FAILED=1
      fi
      ;;
  esac
done < <(git ls-files | grep -vE "$EXCLUDE")

if [ "$FAILED" -eq 0 ]; then
  echo "✓ No injected code detected."
else
  echo ""
  echo "✗ Potential code injection found. Do NOT build or deploy until reviewed."
  echo "  Inspect the flagged file(s) and compare against a known-good commit."
fi
exit "$FAILED"
