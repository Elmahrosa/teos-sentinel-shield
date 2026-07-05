# Architecture Diagram — TEOS Sentinel Shield

**Classification:** INTERNAL
**Last Updated:** 2026-06-18

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TEOS SENTINEL SHIELD                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌───────────────┐   ┌───────────────┐  │
│  │ Telegram │──▶│   Bot Gateway│──▶│ Risk Engine   │   │ Activation    │  │
│  │ Users    │   │  (8082)      │   │ (MCP, 8090)   │   │ Service (8080)│  │
│  └──────────┘   └──────┬───────┘   └──────┬────────┘   └──────┬────────┘  │
│                        │                  │                   │           │
│                        │         ┌────────▼────────┐         │           │
│                        │         │  Redis Cache    │         │           │
│                        │         │  (Rate Limit,   │         │           │
│                        │         │   Session)      │         │           │
│                        │         └─────────────────┘         │           │
│                        │                                     │           │
│              ┌─────────▼──────────────────────────────────────▼──────┐   │
│              │               Sentinel Shield                         │   │
│              │               Dashboard (3000)                        │   │
│              │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │   │
│              │  │ Landing  │ │ Dashboard│ │ Audit    │ │ Report │  │   │
│              │  │ Pages    │ │          │ │ Trail    │ │ Export │  │   │
│              │  └──────────┘ └──────────┘ └──────────┘ └────────┘  │   │
│              └──────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     External Integrations                            │  │
│  │  ┌────────────┐  ┌──────────┐  ┌───────────┐  ┌─────────────────┐  │  │
│  │  │ GitHub API │  │ Dodo     │  │ Groq/     │  │ UptimeRobot /   │  │  │
│  │  │ (scanning) │  │ Payments │  │ Anthropic │  │ BetterStack     │  │  │
│  │  └────────────┘  └──────────┘  └───────────┘  └─────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     Deployment Pipeline                               │  │
│  │  GitHub (push main) → GitHub Actions → Railway (auto-deploy)         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Scan Request Flow

```
1. User sends code to @teoslinker_bot
2. Bot Gateway receives message
3. Bot checks activation status via Activation Service
4. Bot sends code to Risk Engine (MCP)
5. Risk Engine evaluates 103 rules (64 core + 29 Solana + 10 EVM)
6. Risk Engine returns verdict (ALLOW/WARN/REVIEW/BLOCK)
7. Bot formats response and replies to user
8. Shield dashboard updates audit trail
```

### Activation Flow

```
1. User clicks deep-link: t.me/teoslinker_bot?start=<secret>
2. Bot receives /start command with secret
3. Bot sends activation request to Activation Service
4. Activation Service validates secret, grants credits
5. Bot confirms activation to user
6. Shield dashboard reflects user's new status
```

## Security Boundaries

```
┌──────────────────────────────────────────────────┐
│                Railway Network                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│  │  Bot     │────│ Risk     │────│ Redis    │   │
│  │ (public) │    │ Engine   │    │ (private)│   │
│  └────┬─────┘    └──────────┘    └──────────┘   │
│       │                                           │
│  ┌────▼─────┐    ┌──────────┐                     │
│  │ Activation│   │ Shield   │                     │
│  │ Service   │   │ Dashboard│                     │
│  └──────────┘    └──────────┘                     │
│                                                    │
│  External (HTTPS) : Bot, Shield                    │
│  Internal (Docker): Redis                          │
└──────────────────────────────────────────────────┘
```

## Component Dependencies

```
Bot Gateway
  ├── Risk Engine (HTTP)
  ├── Activation Service (HTTP)
  └── Redis (optional)

Risk Engine
  ├── Redis (rate limiting)
  └── GitHub API (external)

Activation Service
  └── Dodo Payments API (external)

Sentinel Shield
  ├── Redis (session)
  └── Risk Engine (HTTP - for demo scans)
```
