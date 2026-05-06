name: Sentinel Scan

on: [push]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Scan with TEOS Sentinel
        run: |
          curl -X POST https://api.teossecurity.com/scan \
          -H "Content-Type: application/json" \
          -d '{"code":"${{ github.event.head_commit.message }}"}'
