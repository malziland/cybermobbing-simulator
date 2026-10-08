#!/bin/bash
# Compares what the live site serves with the local files, by checksum.
# Read-only. Exit code 0 only if every file is identical.
#
# Use: bash scripts/verify-live.sh [base-url]
#   after a deployment it must end with 0; right before one it must end with 1
#   (the live site still serves the previous release) -- that is the proof
#   that this check can fail at all.
#
# The content of js/config.js is never printed, only compared.

set -u

BASE="${1:-https://cybermobbing.web.app}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2

sum() { shasum -a 256 | cut -d' ' -f1; }

# What the page consists of: the same list the deployment gate works with
FILES=$(node scripts/deploy-files.js --list) || {
  echo "RESULT: scripts/deploy-files.js could not list the files -- the check itself failed"
  exit 2
}

# What must not be reachable: hidden folders (up to v1.2.1 the live site served
# .git/ and .claude/), documentation, tests and tooling
HIDDEN=".git/HEAD .git/config .git/index .claude/settings.local.json .github/workflows/ci.yml
docs/RUNBOOK.md docs/adr/ADR-0001-projekt-einordnung.md tests/test-runner.html
scripts/run-e2e.js scripts/verify-live.sh README.md CHANGELOG.md AGENTS.md SECURITY.md
package.json package-lock.json eslint.config.js setup.sh firebase.json database.rules.json
js/config.example.js"

total=0
bad=0
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

while IFS= read -r f; do
  [ -n "$f" ] || continue
  total=$((total + 1))
  code=$(curl -s -o "$TMP" -w '%{http_code}' "$BASE/$f")
  if [ "$code" != "200" ]; then
    echo "MISSING   $f (HTTP $code)"
    bad=$((bad + 1))
    continue
  fi
  if [ "$(sum < "$TMP")" = "$(sum < "$f")" ]; then
    echo "same      $f"
  else
    echo "DIFFERENT $f"
    bad=$((bad + 1))
  fi
done <<EOF_FILES
$FILES
EOF_FILES

hidden_total=0
for f in $HIDDEN; do
  hidden_total=$((hidden_total + 1))
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/$f")
  if [ "$code" = "404" ]; then
    echo "hidden    $f"
  else
    echo "EXPOSED   $f (HTTP $code)"
    bad=$((bad + 1))
  fi
done
# The 404 above must mean "not deployed", not "this host answers 404 to everything"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/robots.txt")
if [ "$code" != "200" ]; then
  echo "RESULT: $BASE/robots.txt answers HTTP $code -- the check itself failed"
  exit 2
fi

stamp=$(curl -s "$BASE/index.html" | grep -o '?v=[0-9]*' | sort -u | tr '\n' ' ')
echo "live cache stamp: ${stamp:-none found}"
echo "local cache stamp: $(grep -o '?v=[0-9]*' index.html | sort -u | tr '\n' ' ')"

if [ "$total" -eq 0 ]; then
  echo "RESULT: no files compared -- the check itself failed"
  exit 2
fi
if [ "$bad" -eq 0 ]; then
  echo "RESULT: live site serves this state ($total of $total files identical, $hidden_total of $hidden_total tooling files not reachable)"
  exit 0
fi
echo "RESULT: live site differs ($bad problem(s) in $total files and $hidden_total hidden paths)"
exit 1
