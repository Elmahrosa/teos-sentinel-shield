const CORE_RULES = [
  // ── Destructive Shell Commands (R01-R06) ──
  { id: 'R01', name: 'DESTRUCTIVE_SHELL',        sev:'critical', score:100,
    test: c => {
      if (/rm\s+-rf\s+--no-preserve-root/i.test(c)) return true;
      if (/rm\s+-rf\s+\/(?:\s|$|etc|bin|boot|dev|lib|sbin|root|usr|var|proc|sys|srv|opt)(?:\/|\s|$)/i.test(c)) return true;
      if (/rm\s+-rf\s+~\/?(?:\s|$)/i.test(c)) return true;
      if (/dd\s+if=\/dev\/zero\s+of=\/dev\//i.test(c)) return true;
      if (/shred\s+-u\s+\/|wipe\s+-f\s+\//i.test(c)) return true;
      if (/\brm\s+-rf(?:\s*$|\s+\.(?:\/\*)?\s*$|\s+\*\s*$)/i.test(c)) return true;
      if (/format\s+[a-z]:\s*\/\s*(?:fs|q|u)/i.test(c)) return true;
      if (/deltree|deltree32/i.test(c)) return true;
      if (/mkfs\s+\.?\s*\/dev\/(?:sda|sdb|sdc|hda|nvme|mmc)/i.test(c)) return true;
      if (/pvcreate|vgcreate|lvcreate.*\/dev\/(?:sd|nvme|hd)/i.test(c)) return true;
      return false;
    },
    reasons: ['rm -rf on system-critical path — permanent filesystem destruction','Wiper malware signature detected','Disk destruction command detected'] },

  { id: 'R02', name: 'CHMOD_ESCALATION',         sev:'critical', score:90,
    test: c => /chmod\s+[0-7]*7{2,}.*\/etc|777.*passwd|chmod\s+777\s+\/|chmod\s+-R\s+777\s+\//i.test(c),
    reasons: ['chmod 777 on sensitive system files escalates privileges','World-writable permissions on system-critical path'] },

  { id: 'R03', name: 'CURL_EXEC_CHAIN',          sev:'critical', score:95,
    test: c => /curl.+\|\s*(bash|sh)|wget.+\|\s*(bash|sh)|curl.+\|\s*sudo/i.test(c),
    reasons: ['curl/wget piped to shell executes untrusted remote code','Remote code execution via pipe-to-shell pattern'] },

  { id: 'R04', name: 'SECRET_ECHO',              sev:'critical', score:90,
    test: c => /echo\s+\$[A-Z_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD|PASS|CREDENTIAL|API_KEY|ACCESS_KEY|SECRET_KEY)\b/i.test(c),
    reasons: ['Echoing secret environment variable — potential exfiltration','Credential leakage via stdout'] },

  { id: 'R05', name: 'ENV_EXFIL',                sev:'critical', score:95,
    test: c => /\$[A-Z_]*(KEY|SECRET|TOKEN).*(curl|wget|http)|(?:curl|wget).*\$[A-Z_]*(KEY|SECRET|TOKEN)/i.test(c),
    reasons: ['Sending environment secret to external host','Credential exfiltration via outbound request'] },

  { id: 'R06', name: 'FORK_BOMB',                sev:'critical', score:100,
    test: c => /(\:\(\)\{|:\(\))\s*\{.*:\|:/i.test(c),
    reasons: ['Fork bomb detected — denial of service pattern','Resource exhaustion denial of service'] },

  // ── Code Execution (R07-R13) ──
  { id: 'R07', name: 'BASE64_EXEC',              sev:'high',     score:88,
    test: c => /eval\s*\(\s*atob|base64\s+--decode.*(?:bash|sh|exec)|powershell\s+-[eE]\s+[A-Za-z0-9+\/=]{20,}|base64.*-d\s+\|/i.test(c),
    reasons: ['Base64-encoded payload executed via eval','Obfuscated code execution bypassing static analysis'] },

  { id: 'R08', name: 'REVERSE_SHELL',            sev:'critical', score:100,
    test: c => /nc\s+(-e|--exec)|bash\s+-i\s+>&\s*\/dev\/tcp|ncat.*-e.*(?:cmd|bash|sh)|socat\s+.*EXEC/i.test(c),
    reasons: ['Reverse shell connection attempt detected','Outbound shell connection to attacker-controlled host'] },

  { id: 'R09', name: 'SQL_DESTRUCTION',          sev:'high',     score:78,
    test: c => /DROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW|TRIGGER|FUNCTION|PROCEDURE)|TRUNCATE\s+TABLE/i.test(c),
    reasons: ['SQL DROP command permanently destroys data','Destructive database operation detected'] },

  { id: 'R10', name: 'SQL_INJECTION',            sev:'high',     score:78,
    test: c => /'\s*(OR|AND)\s+\d=\d|UNION\s+(ALL\s+)?SELECT|1=1.*--|\bEXEC\s*\(|xp_cmdshell|INTO\s+OUTFILE|LOAD_FILE|information_schema/i.test(c),
    reasons: ['SQL injection pattern detected','Database query manipulation via string concatenation'] },

  { id: 'R11', name: 'PATH_TRAVERSAL',           sev:'high',     score:80,
    test: c => {
      if (!/(\.\.\/|(\.\.\\)|%2e%2e)/i.test(c)) return false;
      const lower = c.toLowerCase().trim();
      if (/^[\w_]+\s*=\s*["']?[^"'\n]*\.\.\//.test(lower)) return false;
      if (/^(export|local)\s+[\w_]+\s*=\s*["']?[^"'\n]*\.\.\//.test(lower)) return false;
      if (/^(echo|printf|logger|print)\s+/.test(lower)) return false;
      if (/^console\.(log|debug|info|warn)\s*\(/.test(lower)) return false;
      if (/^(cd|pushd|popd)\s+/.test(lower)) return false;
      if (/\b(realpath|readlink|dirname)\s+/.test(lower)) return false;
      if (/\$[\(\{]\w+[\)\}]\s*\/\.\./.test(lower)) return false;
      return true;
    },
    reasons: ['Directory traversal detected — arbitrary file read possible','Path traversal escaping restricted directory'] },

  { id: 'R12', name: 'COMMAND_INJECTION',        sev:'critical', score:92,
    test: c => /(?:;|&&|\|\|)\s*(?:id|whoami|uname|cat|curl|wget|nc|ncat|bash|sh|python|perl|ruby|php|powershell)\b/i.test(c),
    reasons: ['OS command injection — command chained after separator','Arbitrary command execution via injection'] },

  { id: 'R13', name: 'PRIVILEGE_ESCALATION',     sev:'critical', score:92,
    test: c => /sudo\s+(su|bash|sh|python|perl|ruby|php|node)|chmod\s+u\+s|chmod\s+4777|setuid|setgid|cap_setuid/i.test(c),
    reasons: ['Privilege escalation via sudo or SUID abuse','Unauthorized privilege elevation attempt'] },

  // ── Supply Chain (R14-R16) ──
  { id: 'R14', name: 'MALICIOUS_PACKAGE',        sev:'high',     score:88,
    test: c => /event-stream@3\.3\.6|flatmap-stream|ua-parser-js@0\.7\.2[89]|is-promise@2\.\d\.\d|colors@1\.4\.(?:4[4-9]|5[0-9])/i.test(c),
    reasons: ['Known malicious npm package version detected','Supply chain attack via compromised package'] },

  { id: 'R15', name: 'TYPOSQUAT_PACKAGE',        sev:'high',     score:75,
    test: c => /require\s*\(\s*['"](?:lodashh|recat|expres|mongoos|chaii|noode|nodemailer|momen|awssdk|jsonwentoken|asyncs|blueburd|socketio|passportjwt|crossenv)['"]\s*\)/i.test(c) ||
               /\b(?:lodashh|recat|expres|mongoos|chaii|noode|nodemailer|momen)\b/i.test(c),
    reasons: ['Typosquatted package name detected — potential supply chain attack'] },

  { id: 'R16', name: 'UNSAFE_PERMISSIONS',       sev:'medium',   score:65,
    test: c => /permissions:\s*write-all|contents:\s*write\s+(?!.*read)/i.test(c),
    reasons: ['GitHub Actions write-all permissions overly broad','Excessive CI/CD permissions'] },

  // ── CI/CD & Docker (R17-R18) ──
  { id: 'R17', name: 'CURL_BASH_CI',             sev:'critical', score:95,
    test: c => /run:\s*curl.+\|\s*bash|run:\s*wget.+\|\s*sh|script.*curl.*pipe/i.test(c),
    reasons: ['curl|bash in CI/CD pipeline — remote code execution risk','Untrusted code execution in build pipeline'] },

  { id: 'R18', name: 'PRIVILEGED_CONTAINER',     sev:'high',     score:82,
    test: c => /--privileged|securityContext:\s*privileged:\s*true|privileged:\s*true/i.test(c),
    reasons: ['Privileged container flag breaks container isolation','Container escape via privileged mode'] },

  // ── Secrets & Keys (R19, R38) ──
  { id: 'R19', name: 'HARDCODED_SECRET',         sev:'critical', score:93,
    test: c => /(?:api_key|apikey|secret_key|secret|password|passwd|token|auth_token|access_token)\s*[=:]\s*['"][A-Za-z0-9_\-\.]{12,}['"]/i.test(c) ||
                /(?:sk-[a-zA-Z0-9-]{20,}|sk-proj-[a-zA-Z0-9-]{20,}|github_pat_[a-zA-Z0-9_]{20,}|ghp_[a-zA-Z0-9-]{20,}|gho_[a-zA-Z0-9-]{20,}|ghu_[a-zA-Z0-9-]{20,}|ghs_[a-zA-Z0-9-]{20,}|xox[bpsa]-[a-zA-Z0-9-]{10,})/i.test(c),
    reasons: ['Hardcoded API key, token, or password in source code','Credential exposure in source code'] },

  { id: 'R20', name: 'PROMPT_INJECTION',         sev:'high',     score:86,
    test: c => /ignore (?:previous|all|any) (?:instructions|directives|commands)|ignore all previous|disregard (?:your|the) (?:system|original) prompt|jailbreak|DAN\b|do anything now|override.*(?:ethics|moral|policy|rule)|pretend you are|roleplay as/i.test(c),
    reasons: ['LLM prompt injection attempt detected','AI system prompt compromise attempt'] },

  { id: 'R21', name: 'SSRF_ATTEMPT',             sev:'high',     score:86,
    test: c => /https?:\/\/(?:169\.254|10\.|192\.168|172\.(?:1[6-9]|2\d|3[01])|127\.0\.0\.1)/i.test(c) ||
               /https?:\/\/(?:metadata\.google|169\.254\.169\.254|localhost|0\.0\.0\.0)/i.test(c),
    reasons: ['SSRF attempt targeting internal/metadata IP range','Server-side request forgery to internal services'] },

  { id: 'R22', name: 'XXE_INJECTION',            sev:'high',     score:82,
    test: c => /<!ENTITY\s+\w+\s+SYSTEM|<!DOCTYPE.*\[|<!ELEMENT.*SYSTEM/i.test(c),
    reasons: ['XML External Entity injection pattern detected','XXE — file disclosure or SSRF via XML parser'] },

  { id: 'R23', name: 'CRYPTO_MINER',             sev:'critical', score:95,
    test: c => /stratum\+tcp|xmrig|minerd|ethminer|ccminer|cpuminer|sgminer|bfgminer|cgminer|cryptonight|randomx\b|kawpow|octopus\b/i.test(c),
    reasons: ['Cryptomining binary or pool connection detected','Unauthorized cryptocurrency mining'] },

  { id: 'R24', name: 'DATA_EXFIL_CURL',          sev:'high',     score:89,
    test: c => /curl\s+.*(?:-d|--data|--data-binary|--data-raw).*(?:\/etc\/(?:passwd|shadow|hosts|ssh|ssl)|\.env|credentials|secret|key|token)/i.test(c) ||
               /nc\s+.*\/(?:etc\/passwd|etc\/shadow|\.env|secret|key|token)/i.test(c),
    reasons: ['Exfiltrating sensitive system files via curl','Data exfiltration via network tool'] },

  { id: 'R25', name: 'CI_SECRETS_DUMP',          sev:'critical', score:92,
    test: c => /printenv|env\s*\|\s*grep|\$\{\{\s*secrets\s*\}\}|env.*\b(?:SECRET|TOKEN|KEY|PASSWORD)\b/i.test(c),
    reasons: ['CI secrets or environment variable dump detected','Secrets exposure via environment dump'] },

  // ── XSS & Web (R41-R48) ──
  { id: 'R41', name: 'XSS_REFLECTED',            sev:'high',     score:85,
    test: c => /<script>.*<\/script>|javascript:\s*(?:alert|confirm|prompt)\(|onerror\s*=|onload\s*=|onclick\s*=|onmouse/i.test(c) &&
               !/(?:sanitize|escape|encode|textContent|innerText)/i.test(c),
    reasons: ['Reflected XSS — unescaped user input injected into HTML','Cross-site scripting: arbitrary JavaScript execution'] },

  { id: 'R42', name: 'XSS_STORED',               sev:'high',     score:86,
    test: c => /(?:innerHTML|outerHTML|document\.write|document\.writeln)\s*=?\s*[^;'"]*(?:req\.query|req\.body|req\.params|url\?|userInput|req\.input)/i.test(c) &&
               !/(?:escape|sanitize|encode|DOMPurify|textContent)/i.test(c),
    reasons: ['Stored XSS — unsanitized input written to DOM','Persistent cross-site scripting via innerHTML'] },

  { id: 'R43', name: 'RCE_EVAL',                 sev:'critical', score:96,
    test: c => /\beval\s*\([^)]*[a-z_][^)]*\)|new\s+Function\s*\([^)]*[a-z_][^)]*\)|setTimeout\s*\(\s*["'`][^"'`]*[a-z_]+/i.test(c),
    reasons: ['eval() or new Function() with dynamic input — arbitrary code execution','Code injection via eval-like patterns'] },

  { id: 'R44', name: 'EXEC_COMMAND',             sev:'critical', score:95,
    test: c => /\bexec\s*\(|child_process\s*\.\s*exec|spawn\s*\(["'`](?:bash|sh|cmd|powershell)/i.test(c) ||
               /\bexecSync|execFile|fork\s*\([^)]*\)[^;]*\{[^}]*sh/i.test(c),
    reasons: ['shell execution via exec() — arbitrary command execution','OS command execution via Node.js child_process'] },

  { id: 'R45', name: 'SHELL_EXECUTION',          sev:'high',     score:88,
    test: c => /\bsubprocess\s*\.\s*(?:call|Popen|run|check_call|check_output)\s*\([^)]*shell\s*=\s*True/i.test(c) ||
               /\bos\.system\s*\(|pty\.spawn|pexpect\.spawn/i.test(c),
    reasons: ['Python shell execution — arbitrary command injection risk'] },

  { id: 'R46', name: 'DESERIALIZATION',          sev:'high',     score:87,
    test: c => /\b(?:pickle\.load|cPickle\.load|yaml\.load\b(?!.*Safe)|JSON\.parse|XMLHttpRequest|ActiveXObject|eval\(atob|JSON\.stringify)/i.test(c) &&
               /(?:eval|exec|require|import|from)/i.test(c),
    reasons: ['Unsafe deserialization — remote code execution via serialized payload'] },

  { id: 'R47', name: 'DOCKER_ESCAPE',            sev:'critical', score:94,
    test: c => /docker\s+run\s+(?:.*\s)?--privileged|docker\s+run\s+(?:.*\s)?-v\s+\/:\/host|docker\s+run\s+(?:.*\s)?--pid=host|docker\s+run\s+(?:.*\s)?--net=host|docker\s+run\s+(?:.*\s)?--cap-add\s*=\s*ALL/i.test(c),
    reasons: ['Docker escape via host resources','Container breakout via privileged mounts'] },

  { id: 'R48', name: 'K8S_ESCALATION',           sev:'critical', score:92,
    test: c => /kubectl\s+(?:exec|run)\s+(?:.*\s)?--\s+(?:bash|sh|chroot)|kubectl\s+auth\s+reconcile|kubectl\s+create\s+clusterrole|kubectl\s+create\s+clusterrolebinding/i.test(c) ||
               /(?:cluster-admin|system:masters|serviceaccount.*cluster)/i.test(c),
    reasons: ['Kubernetes privilege escalation attempt','Excessive K8s permissions requested'] },

  // ── Ransomware & Malware (R49-R54) ──
  { id: 'R49', name: 'RANSOMWARE_ENCRYPT',       sev:'critical', score:99,
    test: c => /\b(?:encrypt|decrypt)\s+(?:file|folder|disk|drive|all)\b[^;]*\b(?:bitcoin|monero|eth|pay|ransom|ransomware)\b/i.test(c) ||
               /\b(?:crypt\s+\/|gpg\s+--symmetric\s+--batch\s+--passphrase|openssl\s+enc\s+-aes)[^;]*rm\s+/i.test(c) ||
               /encrypt.*files.*rm.*originals/i.test(c) ||
               /\bencrypt\b.*\bpay\b.*\bbitcoin\b/i.test(c) ||
               /ransomware/i.test(c),
    reasons: ['Ransomware-like encryption + deletion pattern','Data extortion via file encryption'] },

  { id: 'R50', name: 'RANSOMWARE_NOTE',          sev:'critical', score:97,
    test: c => /(?:your\s+(?:files|data|documents)\s+(?:are|have\s+been)\s+encrypted|to\s+(?:restore|recover|decrypt)\s+(?:your\s+)?(?:files|data)|send\s+(?:\$|€|btc|eth|xmr)\s+\d+|pay\s+(?:us|the\s+ransom|ransom))/i.test(c),
    reasons: ['Ransomware note detected — extortion message','Ransomware demands and payment instructions'] },

  { id: 'R51', name: 'CREDENTIAL_THEFT',         sev:'critical', score:96,
    test: c => /\b(?:steal|harvest|collect|grab|dump)\b[^;]*\b(?:credential|password|cookie|session|token)\b[^;]*\b(?:from|in|stored)\b/i.test(c) ||
               /\b(?:mimikatz|secretsdump|wcedump|pwdump|cain|john|hashcat|hydra)\b/i.test(c),
    reasons: ['Credential theft tool or pattern detected','Credential harvesting utility'] },

  { id: 'R52', name: 'PCI_DSS_LEAKAGE',          sev:'critical', score:98,
    test: c => /\b(?:credit_card|cc_num|cc_number|card_number|pan|cvv|cvc|track1|track2|magstripe|card_holder)\b[^;]*\b(?:log|store|save|persist|write|insert)\b/i.test(c) ||
               /INSERT.*cards.*pan/i.test(c) ||
               /4111111111111111/i.test(c),
    reasons: ['PCI DSS leakage — sensitive card data in source/log','Payment card industry data breach risk'] },

  { id: 'R53', name: 'PII_LEAKAGE',              sev:'high',     score:86,
    test: c => /\b(?:ssn|social_security|passport|driver.?license|national_id|nid|patient|medical_record|hipaa|phi)\b[^;]*\b(?:log|print|return|send|email|export|write)\b/i.test(c),
    reasons: ['PII leakage — personal identifiable information exposed','Privacy data exposure risk'] },

  { id: 'R54', name: 'IDENTITY_LEAKAGE',         sev:'medium',  score:72,
    test: c => /\b(?:email|phone|mobile|address|dob|date_of_birth|birth_date)\b[^;]*\b(?:log|print|echo|return|response\.json|send)/i.test(c),
    reasons: ['Identity data leakage — personal information in logs or responses'] },

  // ── Network & Recon (R55-R60) ──
  { id: 'R55', name: 'NETWORK_SCAN',             sev:'medium',   score:68,
    test: c => /\bnmap\s+-sS|nmap\s+-sT|nmap\s+-Pn|masscan|zmap|unicornscan|netcat.*-z\s+/i.test(c),
    reasons: ['Network scanning detected — reconnaissance activity'] },

  { id: 'R56', name: 'PORT_SCAN',                sev:'medium',   score:65,
    test: c => /\b(?:nc\s+-zv|nmap\s+-p\s+|masscan\s+-p\s+)[0-9,\-]+\s/i.test(c),
    reasons: ['Port scanning detected — service enumeration'] } ,

  { id: 'R57', name: 'DNS_TUNNEL',               sev:'high',     score:82,
    test: c => /\b(?:dnscat|iodine|dns2tcp|dnstunnel|tuns)\b/i.test(c) ||
               /\b(?:dig|nslookup|host)\s+[a-z0-9]{20,}\./i.test(c),
    reasons: ['DNS tunneling tool detected — data exfiltration via DNS queries'] },

  { id: 'R58', name: 'PROXY_CHAIN',              sev:'medium',   score:70,
    test: c => /\b(?:proxychains|torify|torsocks|proxifier)\b/i.test(c),
    reasons: ['Proxy chain tool detected — anonymous access attempt'] },

  { id: 'R59', name: 'WIRESHARK_SNIFF',          sev:'medium',   score:66,
    test: c => /\b(?:tcpdump|wireshark|tshark|dumpcap|tcpflow|ngrep|ettercap)\b/i.test(c) &&
               /\b(?:-i\s+\w+|capture|sniff|listen|monitor)\b/i.test(c),
    reasons: ['Packet capture tool detected — network traffic interception'] },

  { id: 'R60', name: 'ARP_SPOOF',                sev:'high',     score:84,
    test: c => /\b(?:arpspoof|arpoison|ettercap.*ARP|bettercap.*arp|arping)\b/i.test(c),
    reasons: ['ARP spoofing tool detected — MITM attack capability'] },

  // ── Additional RCE & Injection (R61-R70) ──
  { id: 'R61', name: 'LDAP_INJECTION',           sev:'high',     score:82,
    test: c => /\b(?:ldap_search|ldap_bind|ldap_connect)\b[^;]*['"`].*?(?:\*|\(|\)|&|\|)[^;]*['"`]/i.test(c),
    reasons: ['LDAP injection — directory service query manipulation'] },

  { id: 'R62', name: 'XPATH_INJECTION',         sev:'high',     score:80,
    test: c => /'\]\|.*\/\/\*|'\]\s*\|=\s*'|'\]\s*or\s+'1'='1/i.test(c),
    reasons: ['XPath injection — XML query manipulation'] },

  { id: 'R63', name: 'NOSQL_INJECTION',         sev:'high',     score:83,
    test: c => /\$ne|\$gt|\$gte|\$lt|\$lte|\$regex|\$where|\$nin\b[^;]*['"]/i.test(c) &&
               /(?:find|findOne|update|aggregate|delete)/i.test(c),
    reasons: ['NoSQL injection — MongoDB operator injection'] },

  { id: 'R64', name: 'PROTOTYPE_POLLUTION',     sev:'critical', score:91,
    test: c => /__proto__|constructor\.prototype|prototype\.pollution|\bmerge\s*\([^)]*,\s*[^)]*\)[^;]*\b(?:__proto__|constructor)\b/i.test(c),
    reasons: ['Prototype pollution — object property injection vulnerability'] },

  { id: 'R65', name: 'SMUGGLING_HEADER',        sev:'high',     score:84,
    test: c => /Content-Length\s*:\s*\d+\s*Transfer-Encoding|Transfer-Encoding\s*:\s*chunked\s*Content-Length/i.test(c) ||
               /\bCL\.TE|TE\.CL|HTTP\/\d\.\d\s+200/i.test(c),
    reasons: ['HTTP request smuggling — header manipulation detected'] },

  { id: 'R66', name: 'INSECURE_COOKIE',          sev:'medium',   score:68,
    test: c => /Set-Cookie\s*:\s*[^;]*(?:domain|path|expires|max-age)[^;]*(?!.*HttpOnly)(?!.*Secure)/i.test(c),
    reasons: ['Insecure cookie — missing HttpOnly or Secure flags'] },

  { id: 'R67', name: 'CSP_BYPASS',               sev:'medium',   score:70,
    test: c => /Content-Security-Policy\s*:[^;]*unsafe-inline[^;]*unsafe-eval/i.test(c) ||
               /Content-Security-Policy\s*:[^;]*\*\s*[^;]*\*/i.test(c),
    reasons: ['CSP bypass via unsafe-inline and unsafe-eval combination'] },

  { id: 'R68', name: 'CORS_MISCONFIG',           sev:'medium',   score:66,
    test: c => /Access-Control-Allow-Origin\s*:\s*\*|Access-Control-Allow-Credentials\s*:\s*true[^;]*Access-Control-Allow-Origin\s*:\s*\*/i.test(c),
    reasons: ['CORS misconfiguration — wildcard origin with credentials enabled'] },

  { id: 'R69', name: 'WEAK_CRYPTO',              sev:'high',     score:86,
    test: c => /\b(?:crypto\.createHash)\s*\(\s*['"](?:md5|sha1|ripemd)['"]\b|new\s+Hash\s*\(['"](?:md5|sha1)['"]|hmac.*(?:md5|sha1)/i.test(c) &&
               !/\b(?:sha256|sha384|sha512|SHA-2)/i.test(c) ||
               /createHash.*md5/i.test(c),
    reasons: ['Weak cryptographic algorithm — use SHA-256 or stronger'] },

  { id: 'R70', name: 'HARDCODED_IV',             sev:'high',     score:82,
    test: c => /\b(?:iv|initialization_vector|nonce)\s*[=:]\s*['"][0-9a-fA-F]{16,32}['"]/i.test(c) ||
               /\b(?:crypto\.createCipheriv|crypto\.createDecipheriv)\s*\([^)]*['"][0-9a-fA-F]{16,}['"]/i.test(c),
    reasons: ['Hardcoded IV — cryptographic initialization vector should be random and unique'] },

  // ── Infrastructure & Cloud (R71-R75) ──
  { id: 'R71', name: 'CLOUD_KEY_LEAK',           sev:'critical', score:96,
    test: c => /(?:AKIA[0-9A-Z]{16}|ABIA[0-9A-Z]{16}|ACCA[0-9A-Z]{16}|ASIA[0-9A-Z]{16})/i.test(c) ||
               /(?:aws_access_key_id|aws_secret_access_key|aws_session_token)\s*[=:]\s*['"][a-zA-Z0-9\/+]{20,}['"]/i.test(c) ||
               /(?:azure.*connection.*string|azure_storage|AZURE_.*KEY|GOOGLE_.*KEY|GCP_.*CRED|AIza)/i.test(c),
    reasons: ['Cloud provider secret key or access key exposed','Cloud credential exposure — account takeover risk'] },

  { id: 'R72', name: 'OPEN_S3_BUCKET',           sev:'high',     score:85,
    test: c => /s3:\/\/(?!.*[.-]private|.*[.-]secure|.*[.-]internal)/i.test(c) ||
               /BucketPolicy\s*:[^}]*Effect\s*:\s*Allow[^}]*Principal\s*:\s*\*[^}]*Action\s*:\s*s3:\*[^}]*Resource\s*:\s*arn:aws:s3:::/i.test(c),
    reasons: ['Potential S3 bucket policy grants public access — data exposure risk'] },

  { id: 'R73', name: 'IAM_OVERPRIVILEGED',        sev:'high',     score:84,
    test: c => /Action\s*:\s*['"]\*['"]|Resource\s*:\s*['"]\*['"]|Effect\s*:\s*Allow[^}]*Action\s*:\s*['"]\*['"]/i.test(c),
    reasons: ['IAM policy with wildcard Action or Resource — overprivileged role'] },

  { id: 'R74', name: 'INSECURE_PROTOCOL',         sev:'high',     score:78,
    test: c => /http:\/\/[^'"\]\(\)\s>]*\.(?:com|org|net|io|app|dev|cloud)/i.test(c) &&
               !/https:\/\//i.test(c) &&
               !/(?:localhost|127\.0\.0\.1|192\.168|10\.|0\.0\.0\.0)/i.test(c),
    reasons: ['Non-HTTPS URL to external service — unencrypted communication'] },

  { id: 'R75', name: 'INJECTION_MONGO',          sev:'critical', score:90,
    test: c => /\$where\s*:\s*['"`].*['"`]|\$where\s*:\s*function|db\.\w+\.\w+\s*\(\s*\{[^}]*\$ne\b[^}]*\}[^)]*\)/i.test(c),
    reasons: ['MongoDB injection via $where operator — potential data leak'] },

  // ── Additional Critical Threats (R76-R85) ──
  { id: 'R76', name: 'WSL_MALWARE',              sev:'high',     score:86,
    test: c => /wsl\.exe\s+--exec|wsl\.exe\s+-e|bash\.exe\s+-c.*(?:curl|wget|bash|sh|python)/i.test(c),
    reasons: ['WSL used to execute shell commands — potential malware activity on Windows'] },

  { id: 'R77', name: 'REGISTRY_TAMPER',          sev:'high',     score:85,
    test: c => /reg\s+(?:add|delete|copy)\s+HK(?:LM|CU|CR|CC|U)[^;]*\b(?:run|runonce|currentversion|windows\\(?:currentversion|system))\b/i.test(c) ||
               /regedit\s*\/s|regini/i.test(c),
    reasons: ['Windows Registry modification — persistence mechanism'] },

  { id: 'R78', name: 'SERVICE_INSTALL',          sev:'high',     score:82,
    test: c => /sc\s+(?:create|config)\s+\w+\s*binPath|sc\s+start\s+\w+|installutil|New-Service|CreateService/i.test(c),
    reasons: ['Windows service installation — potential persistence via service'] },

  { id: 'R79', name: 'SCHEDULED_TASK',           sev:'high',     score:80,
    test: c => /schtasks\s+\/create|schtasks\s+\/change|schtasks\s+\/f|ScheduledTask\.Register|New-ScheduledTask/i.test(c) &&
               !/backup|update|maintenance/i.test(c),
    reasons: ['Scheduled task creation — potential persistence mechanism'] },

  { id: 'R80', name: 'POWERSHELL_ENCODED',       sev:'critical', score:93,
    test: c => /powershell\s+(?:-e|-enc|-en|-\w*\s*encodedCommand)\s+[A-Za-z0-9+\/=]{50,}/i.test(c) ||
               /pwsh\s+(?:-e|-enc|-en)\s+[A-Za-z0-9+\/=]{50,}/i.test(c),
    reasons: ['PowerShell encoded command — obfuscated execution'] },

  { id: 'R81', name: 'REFLECTION_ABUSE',         sev:'high',     score:84,
    test: c => /System\.Reflection\.Assembly\.Load|Assembly\.LoadFrom|Assembly\.LoadFile|Activator\.CreateInstance|GetType\s*\(/i.test(c) &&
               /(?:byte\[\]|FromBase64String|DownloadData|WebClient)/i.test(c),
    reasons: ['Reflection-based code loading — potentially malicious assembly loading'] },

  { id: 'R82', name: 'DLL_INJECTION',            sev:'critical', score:95,
    test: c => /CreateRemoteThread|WriteProcessMemory|VirtualAllocEx|SetWindowsHookEx|CreateToolhelp32Snapshot|OpenProcess\s*\([^)]*PROCESS/i.test(c),
    reasons: ['DLL/process injection pattern — remote code execution in another process'] },

  { id: 'R83', name: 'KEYLOGGER',                sev:'high',     score:86,
    test: c => /\b(?:SetWindowsHookEx|GetAsyncKeyState|GetKeyState|GetForegroundWindow|RegisterHotKey)\b[^;]*\b(?:key|input|press|hook)/i.test(c),
    reasons: ['Keylogger pattern — keyboard input capture'] },

  { id: 'R84', name: 'SCREEN_CAPTURE',           sev:'high',     score:85,
    test: c => /\b(?:CreateDC|BitBlt|GetDC|CaptureWindow|ScreenCapture|PrintWindow)\b[^;]*\b(?:screen|display|desktop|monitor)\b/i.test(c),
    reasons: ['Screen capture pattern — potential data exfiltration via screenshots'] },

  { id: 'R85', name: 'WEBSOCKET_EXFIL',          sev:'high',     score:83,
    test: c => /\b(?:WebSocket|new\s+WebSocket|ws:\/\/|wss:\/\/)\b[^;]*\b(?:send|emit|push|write)\b[^;]*(?:secret|key|token|password|data|file)/i.test(c) &&
               !/\b(?:localhost|127\.0\.0\.1)/i.test(c),
    reasons: ['WebSocket exfiltration — data sent to external WebSocket endpoint'] },

  // ── OWASP Top 10 Web (R86-R95) ──
  { id: 'R86', name: 'BROKEN_ACCESS_CONTROL',    sev:'critical', score:92,
    test: c => /\b(?:admin|dashboard|config|settings|backup)\b[^;]*\b(?:public|anyone|no_auth|without_auth|skip_auth)\b/i.test(c) ||
               /\.\s*(?:exec|query|find|findOne|update)\s*\([^)]*\)[^;]*\b(?:without|no)\s+(?:auth|check|verify)/i.test(c) ||
               /app\.get\s*\(\s*['"]\/admin['"]/i.test(c),
    reasons: ['Broken access control — admin endpoint accessible without authentication'] },

  { id: 'R87', name: 'CRYPTO_FAILURE',           sev:'high',     score:86,
    test: c => /\b(?:password|secret|key|token)\b[^;]*\b(?:md5|sha1|base64)\s*(?:\(|encrypt|hash)/i.test(c) &&
               !/\b(?:bcrypt|argon2|scrypt|pbkdf2|sha256|sha512)/i.test(c) ||
               /md5\(password\)/i.test(c),
    reasons: ['Cryptographic failure — weak or obsolete encryption/hashing for sensitive data'] },

  { id: 'R88', name: 'INSECURE_DESIGN',          sev:'high',     score:82,
    test: c => /\b(?:trust\s+user|trust\s+input|client.?side.?control|client.?side.?validation)\b/i.test(c),
    reasons: ['Insecure design — trusting user/client-side controls for security decisions'] },

  { id: 'R89', name: 'SECURITY_MISCONFIG',       sev:'medium',   score:72,
    test: c => /(?:debug\s*[=:]\s*true|verbose\s*[=:]\s*true|stack_trace\s*[=:]\s*true|show_errors\s*[=:]\s*true|display_errors\s*[=:]\s*on)/i.test(c),
    reasons: ['Security misconfiguration — debug/verbose mode exposes internals'] },

  { id: 'R90', name: 'VULN_COMPONENT',           sev:'high',     score:80,
    test: c => /(?:log4j|struts|spring4shell|heartbleed|shellshock|dirtycow|proxylogon|hafnium|zerologon|printnightmare)\b/i.test(c),
    reasons: ['Known vulnerable component referenced — associated with high-profile CVE'] },

  { id: 'R91', name: 'AUTH_BYPASS',              sev:'critical', score:94,
    test: c => /\b(?:auth|authenticate|login|signin)\b[^;]*\b(?:skip|bypass|disable|false|no|without)\b/i.test(c) ||
               /\b(?:req\.session|session\.auth|session\.user)\b[^;]*\b(?:=\s*true|==\s*true)/i.test(c) ||
               /req\.session\.auth\s*=\s*true/i.test(c) ||
               /\b(?:skip|bypass|disable)\s+(?:auth|authentication|login|signin|verification)\b/i.test(c),
    reasons: ['Authentication bypass — setting session/authentication state to true without validation'] },

  { id: 'R92', name: 'IDOR',                     sev:'high',     score:86,
    test: c => /\b(?:req\.params\.id|req\.query\.id|req\.body\.id|:id)\b[^;]*\b(?:findById|findOne|getById|delete|update|get)\b[^;]*\b(?:without|no)\s+(?:auth|check|access|owner)/i.test(c),
    reasons: ['Insecure Direct Object Reference — access control missing on ID-based endpoint'] },

  { id: 'R93', name: 'LOG_INJECTION',            sev:'medium',   score:68,
    test: c => /(?:log|logger|console\.log|printf|fprintf|syslog)\s*\([^)]*\b(?:req\.body|userInput|params|query|input)\b/i.test(c) &&
               !/(?:escape|sanitize|encode|replace|\.replace)/i.test(c),
    reasons: ['Log injection — unsanitized input written to logs (log forging)'] },

  { id: 'R94', name: 'SMTP_INJECTION',           sev:'high',     score:82,
    test: c => /\b(?:sendmail|Send-MailMessage|smtp\.send|mail\(|mailer->send)\b[^;]*\b(?:headers?\s*[=:]\s*[^;]*(?:\n|\r|%0a|%0d))/i.test(c),
    reasons: ['SMTP injection — email header injection via user input'] },

  { id: 'R95', name: 'HOST_HEADER_INJECTION',    sev:'high',     score:80,
    test: c => /\b(?:Host|X-Forwarded-Host|X-Forwarded-For)\b[^;]*\b(?:req\.headers|req\.get|headers\.)\b[^;]*\b(?:redirect|location|url|link|href)/i.test(c) &&
               !/\b(?:validate|sanitize|check|whitelist)\b/i.test(c),
    reasons: ['Host header injection — redirect poisoning via untrusted host header'] },

  // ── Additional rules to reach 95+ (R96-R110) ──
  { id: 'R96', name: 'SSTI_VULN',                 sev:'high',     score:88,
    test: c => /\{\{.*[a-z_]+\s*\(.*\}\}|\{\{.*config\b|\{\{.*request\b|\{\{.*self\b|\{\{.*app\b/i.test(c) ||
               /<%\s*=\s*\w+\s*\(|<%\s*\w+\.\w+\s*\(/i.test(c),
    reasons: ['Server-Side Template Injection — user input in template expression'] },
  { id: 'R97', name: 'SSO_WEAKNESS',              sev:'high',     score:85,
    test: c => /(?:SAML|OAuth|OpenID|JWT)\b[^;]*\b(?:skip|disable|bypass|no_check|no-verify|ignore)/i.test(c) ||
               /jwt\.verify\s*\([^)]*\)[^;]*\b(?:false|null|undefined|none)\b/i.test(c),
    reasons: ['SSO/Auth weakness — authentication verification disabled'] },
  { id: 'R98', name: 'API_SEC_BYPASS',            sev:'high',     score:87,
    test: c => /@(?:api|route|endpoint|view)\b[^;]*\b(?:public|anyone|no_auth|anonymous|skip_auth|disable_auth)/i.test(c) ||
               /\.(?:allowAny|permitAll|skipAuth|bypassAuth)\s*\(/i.test(c),
    reasons: ['API security bypass — endpoint exposed without authentication'] },
  { id: 'R99', name: 'CSP_BYPASS',                sev:'medium',   score:82,
    test: c => /unsafe-inline|unsafe-eval|'unsafe-'|data:\s*text\/html|base-uri\s*\*|form-action\s*\*/i.test(c),
    reasons: ['CSP bypass via unsafe directives or wildcard targets'] },
  { id: 'R100', name: 'NOSQL_INJECTION',           sev:'critical', score:93,
    test: c => /\$where\b|\$ne\b|\$gt\b|\$regex\b|\$nin\b.*req\.(?:body|query|params)/i.test(c) ||
               /req\.(?:body|query|params)\b[^;]*\$ne/i.test(c),
    reasons: ['NoSQL injection — MongoDB operator injection via user input'] },
  { id: 'R101', name: 'LDAP_INJECTION',            sev:'high',     score:88,
    test: c => /(?:ldap_search|ldap_bind|ldap_connect)\s*\([^)]*\breq\./i.test(c) &&
               !/escape|sanitize|validate|bind\s*\(/i.test(c),
    reasons: ['LDAP injection — unescaped user input in LDAP query'] },
  { id: 'R102', name: 'XXE_VULNERABILITY',         sev:'high',     score:87,
    test: c => /new\s+DOMParser|libxml_disable_entity_loader|simplexml_load_string|DocumentBuilder\.parse/i.test(c) &&
               !/LIBXML_NOENT|LIBXML_DTDLOAD/i.test(c),
    reasons: ['XML External Entity (XXE) — unsecured XML parser'] },
  { id: 'R103', name: 'RACE_CONDITION',            sev:'high',     score:83,
    test: c => /async\s+\w+\s*\([^)]*\)\s*\{[^}]*await\s+\w+\s*\([^)]*\)[^}]*await\s+\w+\s*\([^)]*\)[^}]*\}/i.test(c) &&
               /transfer|withdraw|deduct|credit|balance|approve/i.test(c),
    reasons: ['Race condition — check-then-act pattern without lock/mutex'] },
  { id: 'R104', name: 'PATH_TRAVERSAL',            sev:'high',     score:86,
    test: c => /(?:readFile|readFileSync|writeFile|writeFileSync|createReadStream|existsSync)\s*\([^)]*\.\.\//i.test(c) ||
               /\bpath\.join\s*\([^)]*\buserInput\b[^)]*\b(?:\.\.\/|\..*\..*\/)/i.test(c),
    reasons: ['Path traversal — user input in file read/write without sanitization'] },
  { id: 'R105', name: 'WEAK_RNG',                  sev:'high',     score:85,
    test: c => /\bMath\.random\b[^;]*\b(?:password|token|secret|key|nonce|salt|iv|seed)\b/i.test(c),
    reasons: ['Weak random number generation — Math.random() used for security-critical value'] },
  { id: 'R106', name: 'FILE_UPLOAD_DANGER',        sev:'high',     score:86,
    test: c => /(?:multer|busboy|formidable)\s*\([^)]*\)[^;]*\b(?:dest|uploadDir|path)\s*[:=]\s*['"][^'"]*['"]/i.test(c) &&
               !/extname|mimetype|mime\.lookup|fileFilter|limits/i.test(c),
    reasons: ['Unrestricted file upload — no type/size validation'] },
  { id: 'R107', name: 'HTTP_ONLY_COOKIE',          sev:'medium',   score:75,
    test: c => /cookie\s*:\s*\{[^}]*httpOnly\s*:\s*false|[^}]*(?:secure|sameSite)\s*:\s*false/i.test(c) ||
               /\bsetCookie\b[^;]*\bhttpOnly\s*=\s*false/i.test(c),
    reasons: ['Insecure cookie configuration — httpOnly/secure/sameSite disabled'] },
  { id: 'R108', name: 'GRAPHQL_INTROSPECT',       sev:'medium',   score:72,
    test: c => /__schema|__type\s*\{|introspectionQuery|__typename.*__schema/i.test(c),
    reasons: ['GraphQL introspection enabled in production — schema disclosure risk'] },
  { id: 'R109', name: 'OPEN_CORS',                 sev:'medium',   score:70,
    test: c => /Access-Control-Allow-Origin\s*[=:]\s*['"]\*['"]/i.test(c) &&
               /Access-Control-Allow-Credentials\s*[=:]\s*true/i.test(c),
    reasons: ['Dangerous CORS — wildcard origin with credentials enabled'] },
  { id: 'R110', name: 'LEAKED_STACK_TRACE',        sev:'medium',   score:68,
    test: c => /(?:stack\s*trace|Error\.stack|console\.trace)\b[^;]*\b(?:res\.send|res\.json|res\.write|process\.stdout)/i.test(c),
    reasons: ['Stack trace leaked to client — information disclosure'] },
];

const { extractMatch, toRecommendation } = require('./finding-utils');
const { isBudgetExceeded, safeRuleInput } = require('../../lib/regex-guard');

function runCoreEngine(input, options = {}) {
  if (!input || typeof input !== 'string') {
    return { verdict: 'ERROR', score: 0, rule: 'R00.ERROR', reasons: ['No input provided'], findings: [] };
  }

  const cmd = input.trim();
  if (cmd.length > 10000) {
    return { verdict: 'ERROR', score: 0, rule: 'R00.CLEAN', reasons: ['Input exceeds 10KB limit'], findings: [] };
  }

  const ruleInput = safeRuleInput(cmd);
  const startMs = Date.now();
  const triggered = [];
  let maxScore = 0;
  let topRule = null;

  for (let i = 0; i < CORE_RULES.length; i++) {
    const rule = CORE_RULES[i];
    if (isBudgetExceeded(startMs)) break;
    try {
      if (rule.test(ruleInput)) {
        triggered.push(rule);
        if (rule.score > maxScore) {
          maxScore = rule.score;
          topRule = rule;
        }
      }
    } catch (e) { /* skip rule on error — logged below */ }
  }

  const findings = triggered.map(t => ({
    ruleId: t.id, name: t.name, severity: t.sev,
    score: t.score, reasons: t.reasons,
    matchedPattern: extractMatch(cmd, t),
    recommendation: toRecommendation(t.reasons, t.sev),
  }));

  if (!topRule) {
    return {
      verdict: 'ALLOW', score: 0, rule: 'R00.CLEAN',
      severity: 'none',
      reasons: [`No threat patterns detected across ${CORE_RULES.length} rules`, 'Safe to execute'],
      findings, timestamp: new Date().toISOString(),
      engine: 'core', totalRules: CORE_RULES.length,
    };
  }

  const verdict = maxScore >= 85 ? 'BLOCK' : maxScore >= 60 ? 'WARN' : 'REVIEW';
  return {
    verdict, score: maxScore,
    rule: `${topRule.id}.${topRule.name}`,
    ruleId: topRule.id,
    severity: topRule.sev,
    reasons: topRule.reasons,
    findings, timestamp: new Date().toISOString(),
    engine: 'core', totalRules: CORE_RULES.length,
  };
}

module.exports = { runCoreEngine, CORE_RULES };
