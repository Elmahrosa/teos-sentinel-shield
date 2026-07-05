# Getting Started with TEOS Sentinel

Welcome to TEOS Sentinel Beta. This guide walks you through your first scan.

## 1. Quick Start (Telegram)

The fastest way to use TEOS:

1. Open Telegram: [@teoslinker_bot](https://t.me/teoslinker_bot)
2. Send `/start`
3. Activate via deep-link: [start=beta](https://t.me/teoslinker_bot?start=beta)
4. Send your first scan:

```
/scan rm -rf /
```

Expected result: **BLOCK (90-100/100)**

## 2. What TEOS Scans

| Input Type | Example | Command |
|------------|---------|---------|
| Shell commands | `rm -rf /` | `/scan` |
| Source code | JavaScript, Python, Rust | `/scan` |
| GitHub repos | `https://github.com/owner/repo` | `/github` |
| Dependencies | `package.json` | `/deps` |
| CI/CD workflows | `.github/workflows/*.yml` | `/ci` |
| Solana programs | Anchor/Rust | `/solana` |
| EVM contracts | Solidity | `/scan` (auto-detect) |
| Multi-line batch | Multiple commands | Auto-detected |

## 3. Understanding Results

```
🛡️ BLOCK (95/100)
  ▸ R07: HARDCODED_SECRET — AWS key detected
  ▸ R22: KEY_EXFIL — Potential credential exposure
  ▸ Severity: CRITICAL
```

| Verdict | Meaning |
|---------|---------|
| ✅ ALLOW (0-39) | Code is safe |
| 🔍 REVIEW (40-79) | Suspicious — human review needed |
| ⚠️ WARN (80-100) | Highly suspicious, no deterministic match |
| 🛑 BLOCK (80-100) | Dangerous — matches security rule |

## 4. Credit System

| Action | Cost |
|--------|------|
| `/scan` | 1 credit |
| `/deps` | 1 credit |
| `/ci` | 1 credit |
| `/github` | 15 credits |
| `/report` | 2 credits |
| AI model scans | 5 credits each |
| `/status` | Free |

Beta testers: **200 credits**. Expires: **June 30, 2026**.

## 5. Next Steps

- [CLI Guide](cli-guide.md) — Scan from terminal
- [Bot Guide](bot-guide.md) — Telegram bot commands
- [API Reference](api-reference.md) — REST API endpoints
- [SDK Guide](sdk-guide.md) — Integration SDK
