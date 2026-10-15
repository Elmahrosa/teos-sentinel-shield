#!/bin/bash
# TEOS Superintelligence — GitHub Repo Bootstrap
# Usage: GITHUB_TOKEN=xxx ORG=Elmahrosa bash scripts/create_github_repo.sh

set -e

REPO_NAME="teos-superintelligence"
ORG="${ORG:-Elmahrosa}"
TOKEN="${GITHUB_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "ERROR: GITHUB_TOKEN not set"
  exit 1
fi

echo "Creating repo $ORG/$REPO_NAME ..."

curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/orgs/$ORG/repos \
  -d "{
    \"name\": \"$REPO_NAME\",
    \"description\": \"TEOS Superintelligence — Sovereign AI Infrastructure by Elmahrosa International\",
    \"private\": true,
    \"has_issues\": true,
    \"has_projects\": true,
    \"has_wiki\": false,
    \"auto_init\": false,
    \"default_branch\": \"main\"
  }" | python3 -m json.tool

echo ""
echo "Now push:"
echo "  cd /path/to/teos-si"
echo "  git init"
echo "  git add ."
echo "  git commit -m 'feat: initial TEOS Superintelligence scaffold'"
echo "  git branch -M main"
echo "  git remote add origin git@github.com:$ORG/$REPO_NAME.git"
echo "  git push -u origin main"
echo "  git checkout -b develop && git push -u origin develop"
