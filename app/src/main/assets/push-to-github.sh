#!/usr/bin/env bash
# Cyber AI helper: push project to GitHub and check the Actions build.
#   bash push-to-github.sh push   [repo]   (run inside the project root)
#   bash push-to-github.sh status [repo]   (waits up to ~2.5 min for the build)
set -u
MODE="${1:-push}"; REPO="${2:-cyber-ai}"
[ -f "$HOME/.cyberai_env" ] && { set -a; . "$HOME/.cyberai_env"; set +a; }
[ -n "${GH_TOKEN:-}" ] || { echo "NEED_TOKEN: owner must create ~/.cyberai_env (see Terminal tab)"; exit 2; }
command -v git >/dev/null 2>&1 && command -v curl >/dev/null 2>&1 || { echo "MISSING: run pkg install -y git curl"; exit 3; }

API="https://api.github.com"
AUTH="Authorization: Bearer $GH_TOKEN"
LOGIN=$(curl -s -H "$AUTH" "$API/user" | grep -o '"login": *"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$LOGIN" ] || { echo "TOKEN_INVALID (or no internet)"; exit 4; }
echo "user: $LOGIN"

if [ "$MODE" = push ]; then
  [ -f settings.gradle.kts ] || [ -f settings.gradle ] || { echo "NOT_PROJECT_ROOT: cd to the folder that has settings.gradle.kts"; exit 5; }
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "$AUTH" "$API/user/repos" -d "{\"name\":\"$REPO\",\"private\":true}")
  echo "create repo: HTTP $CODE (201 = created, 422 = already exists)"
  [ -f .gitignore ] || printf 'build/\n.gradle/\nlocal.properties\n*.iml\n.env\n' > .gitignore
  if [ ! -f .github/workflows/build.yml ]; then
    mkdir -p .github/workflows
    cat > .github/workflows/build.yml << 'YML'
name: Build APK
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '17' }
      - uses: gradle/actions/setup-gradle@v4
        with: { gradle-version: '8.7' }
      - run: gradle assembleDebug --no-daemon
      - uses: actions/upload-artifact@v4
        with:
          name: app-debug-apk
          path: app/build/outputs/apk/debug/*.apk
YML
  fi
  [ -d .git ] || git init -q
  git config user.name  >/dev/null 2>&1 || git config user.name  "$LOGIN"
  git config user.email >/dev/null 2>&1 || git config user.email "$LOGIN@users.noreply.github.com"
  git add -A
  git commit -qm "Cyber AI update" 2>/dev/null || echo "nothing new to commit"
  git branch -M main
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/$LOGIN/$REPO.git"
  B64=$(printf 'x-access-token:%s' "$GH_TOKEN" | base64 | tr -d '\n')
  OUT=$(GIT_TERMINAL_PROMPT=0 git -c http.extraheader="Authorization: Basic $B64" push -u origin main 2>&1); RC=$?
  echo "$OUT" | tail -n 5
  [ $RC -eq 0 ] || { echo "PUSH_FAILED (exit $RC)"; exit 6; }
  echo "PUSHED: https://github.com/$LOGIN/$REPO"
  echo "NEXT: bash $0 status $REPO"
  exit 0
fi

if [ "$MODE" = status ]; then
  SHA=$(git rev-parse HEAD 2>/dev/null || true)
  Q="branch=main"; [ -n "$SHA" ] && Q="head_sha=$SHA"
  i=0; ST=""; CO=""; RID=""
  while [ $i -lt 7 ]; do
    R=$(curl -s -H "$AUTH" "$API/repos/$LOGIN/$REPO/actions/runs?$Q&per_page=1")
    ST=$(echo "$R" | grep -o '"status": *"[^"]*"' | head -1 | cut -d'"' -f4)
    CO=$(echo "$R" | grep -o '"conclusion": *[^,]*' | head -1 | sed 's/.*: *//; s/"//g')
    RID=$(echo "$R" | grep -o '"id": *[0-9]*' | head -1 | grep -o '[0-9]*')
    [ "$ST" = completed ] && break
    i=$((i+1)); sleep 20
  done
  [ -n "$ST" ] || { echo "NO_RUN_FOUND (Actions disabled, or workflow not started yet - retry in a minute)"; exit 7; }
  echo "STATUS=$ST CONCLUSION=$CO"
  echo "URL: https://github.com/$LOGIN/$REPO/actions/runs/$RID"
  if [ "$ST" = completed ] && [ "$CO" != success ]; then
    J=$(curl -s -H "$AUTH" "$API/repos/$LOGIN/$REPO/actions/runs/$RID/jobs")
    JID=$(echo "$J" | grep -o '"id": *[0-9]*' | head -1 | grep -o '[0-9]*')
    echo "--- build errors ---"
    curl -sL -H "$AUTH" "$API/repos/$LOGIN/$REPO/actions/jobs/$JID/logs" \
      | grep -E ' e: |error:|What went wrong|Execution failed|BUILD FAILED|Unresolved|Could not' \
      | sed 's/^[0-9T:.Z-]* //' | tail -n 25
  fi
  [ "$ST" = completed ] && [ "$CO" = success ] && echo "BUILD_OK: APK is under Actions > this run > Artifacts"
  exit 0
fi
echo "usage: bash $0 push|status [repo]"; exit 1
