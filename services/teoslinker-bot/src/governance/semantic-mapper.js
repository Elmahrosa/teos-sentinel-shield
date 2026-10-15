const { safeTest } = require('../security/safe-regex');

const MCP_RULE_MAP = {
  "destructive-shell-cmd": "DESTRUCTIVE_RM_RF",
  "hardcoded-secret": "HARDCODED_SECRET",
  "key-exfil": "KEY_EXFIL",
  "base64-exec": "BASE64_EXEC",
  "xxe-injection": "XXE_INJECTION",
  "malicious-package": "SUPPLY_CHAIN_MALICIOUS",
  "install-script": "SUPPLY_CHAIN_INSTALL_SCRIPT",
  "suspicious-lockfile": "SUPPLY_CHAIN_LOCKFILE",
  "binary-executable": "BINARY_RISK",
  "docker-system-prune": "DESTRUCTIVE_DOCKER_PRUNE",
  "kubernetes-delete-ns": "DESTRUCTIVE_KUBERNETES_DELETE",
  "curl-pipe-sh": "DESTRUCTIVE_CURL_PIPE_SH",
  "sudo-rm": "DESTRUCTIVE_SUDO_RM",
  "fork-bomb": "DESTRUCTIVE_FORK_BOMB",
};

const RULE_MAP = {
  DESTRUCTIVE_RM_RF: {
    semantic_reason: "Destructive filesystem command detected — risk of irreversible data loss",
    root_cause: "Command contains rm -rf / or equivalent recursive destructive path targeting root filesystem",
    recovery_suggestion: "Remove or replace the destructive flag. Use safer alternatives like trash-cli or staged deletions with confirmation.",
  },
  DESTRUCTIVE_MKFS: {
    semantic_reason: "Block device formatting command detected — risk of filesystem destruction",
    root_cause: "Command invokes mkfs targeting a block device, which will erase all data on that device",
    recovery_suggestion: "Do not execute mkfs in production. Restrict access to mkfs via sudoers or remove it from the execution context.",
  },
  DESTRUCTIVE_DD: {
    semantic_reason: "Raw block device write detected — risk of overwriting disk data",
    root_cause: "Command uses dd with of=/dev pattern targeting raw block device for destructive write",
    recovery_suggestion: "Verify the target device path. Use dd with oflag=dsync for safe writes or block with confirmation gate.",
  },
  DESTRUCTIVE_CHMOD: {
    semantic_reason: "Recursive permission escape detected — risk of weakening system security",
    root_cause: "Command applies chmod -R 777 / or equivalent, opening all files to world-writable access",
    recovery_suggestion: "Replace with targeted permission changes. Never apply 777 recursively from root.",
  },
  DESTRUCTIVE_CHOWN: {
    semantic_reason: "Recursive ownership change detected — risk of privilege boundary violation",
    root_cause: "Command applies chown -R / or equivalent, changing ownership of entire filesystem",
    recovery_suggestion: "Scope ownership changes to specific paths. Never use chown -R from root.",
  },
  DESTRUCTIVE_FORK_BOMB: {
    semantic_reason: "Fork bomb pattern detected — risk of system resource exhaustion",
    root_cause: "Command contains recursive fork pattern (:(){}) that will exhaust process table and crash the system",
    recovery_suggestion: "Remove the fork bomb pattern. Use ulimit -u to cap process count as a defense layer.",
  },
  DESTRUCTIVE_CURL_PIPE_SH: {
    semantic_reason: "Remote pipe-to-shell execution detected — risk of arbitrary code execution",
    root_cause: "Command downloads from remote URL and pipes directly to shell interpreter without verification",
    recovery_suggestion: "Download first, verify checksum, then execute. Never pipe unverified remote content to shell.",
  },
  DESTRUCTIVE_SUDO_RM: {
    semantic_reason: "Escalated destructive command detected — privilege elevation combined with data destruction",
    root_cause: "Command uses sudo to elevate privileges for rm -rf, bypassing user-level protections",
    recovery_suggestion: "Remove sudo escalation. Restrict sudo rm access in /etc/sudoers. Use confirmation prompts.",
  },
  DESTRUCTIVE_DOCKER_PRUNE: {
    semantic_reason: "Docker bulk cleanup detected — risk of losing all container data and images",
    root_cause: "Command runs docker system prune with --all --volumes --force, destroying all stopped containers, networks, images, and volumes",
    recovery_suggestion: "Use targeted docker rm/rmi instead of system prune. Back up volumes before cleanup operations.",
  },
  DESTRUCTIVE_KUBERNETES_DELETE: {
    semantic_reason: "Kubernetes namespace deletion detected — risk of cluster-wide resource loss",
    root_cause: "Command deletes a Kubernetes namespace which will terminate all resources within it",
    recovery_suggestion: "Verify the namespace name. Use --dry-run=client first. Consider helm rollback instead of namespace deletion.",
  },
  HARDCODED_SECRET: {
    semantic_reason: "Hardcoded credential detected — risk of unauthorized access and credential theft",
    root_cause: "Source code contains embedded API keys, tokens, or passwords in plaintext",
    recovery_suggestion: "Rotate the exposed credential immediately. Move secrets to environment variables or a vault solution. Add to .gitignore.",
  },
  KEY_EXFIL: {
    semantic_reason: "SSH key or credential exfiltration detected — risk of persistent unauthorized access",
    root_cause: "Command attempts to read and transmit SSH keys, GPG keys, or authentication credentials",
    recovery_suggestion: "Block the outbound transfer. Revoke compromised keys immediately. Restrict read access to ~/.ssh.",
  },
  BASE64_EXEC: {
    semantic_reason: "Obfuscated execution chain detected — risk of concealed malicious payload",
    root_cause: "Command uses base64-encoded payload piped to shell, a common evasion technique",
    recovery_suggestion: "Decode and inspect the payload before execution. Base64 execution chains are a red flag for malware.",
  },
  XXE_INJECTION: {
    semantic_reason: "XML External Entity injection detected — risk of server-side request forgery and data disclosure",
    root_cause: "XML input contains DOCTYPE or ENTITY declarations that could read local files or make outbound requests",
    recovery_suggestion: "Disable external entity processing in your XML parser. Use JSON instead of XML where possible.",
  },
};

const SECRET_TYPE_MAP = {
  "openai-api-key": {
    semantic_reason: "OpenAI API key exposed — risk of unauthorized AI service access and billing abuse",
    root_cause: "Plaintext OpenAI API key found in code, matching the sk- pattern",
    recovery_suggestion: "Rotate the key in OpenAI dashboard. Use environment variables. Never commit keys to version control.",
  },
  "anthropic-api-key": {
    semantic_reason: "Anthropic API key exposed — risk of unauthorized AI service access and billing abuse",
    root_cause: "Plaintext Anthropic API key found in code, matching the sk-ant- pattern",
    recovery_suggestion: "Rotate the key in Anthropic console. Use environment variables or vault service.",
  },
  "github-pat": {
    semantic_reason: "GitHub Personal Access Token exposed — risk of repository and infrastructure compromise",
    root_cause: "GitHub PAT found in code, providing access to repositories and CI/CD pipelines",
    recovery_suggestion: "Rotate the token in GitHub settings. Use fine-grained tokens with minimal scopes. Add to .env.",
  },
  "aws-access-key": {
    semantic_reason: "AWS access key exposed — risk of cloud infrastructure compromise",
    root_cause: "Plaintext AWS access key ID found in code, part of a long-term credential pair",
    recovery_suggestion: "Deactivate the key in AWS IAM. Switch to short-lived STS credentials or instance profiles.",
  },
  "aws-secret-key": {
    semantic_reason: "AWS secret access key exposed — risk of full AWS API access",
    root_cause: "Plaintext AWS secret access key found in code, paired with an exposed access key ID",
    recovery_suggestion: "Deactivate both keys in AWS IAM immediately. Use IAM roles and temporary credentials instead.",
  },
  "stripe-api-key": {
    semantic_reason: "Stripe API key exposed — risk of payment processing compromise and financial loss",
    root_cause: "Plaintext Stripe API key found in code, providing access to payment systems",
    recovery_suggestion: "Rotate the key in Stripe Dashboard. Use restricted keys. Never commit payment credentials.",
  },
  "telegram-bot-token": {
    semantic_reason: "Telegram bot token exposed — risk of bot account takeover and message interception",
    root_cause: "Telegram bot token found in code, granting full control of the bot",
    recovery_suggestion: "Revoke the token via @BotFather. Use environment variables for bot tokens.",
  },
  "private-rsa-key": {
    semantic_reason: "Private RSA key exposed — risk of cryptographic identity theft",
    root_cause: "Private SSH or TLS key found in code, enabling impersonation and decryption",
    recovery_suggestion: "Generate a new key pair immediately. Remove the exposed key from all systems. Notify security team.",
  },
};

const SUPPLY_CHAIN_MAP = {
  known_malicious: {
    semantic_reason: "Known malicious package detected — risk of supply chain compromise",
    root_cause: "Dependency matches a known malicious package in the TEOS supply chain blocklist",
    recovery_suggestion: "Remove the package immediately. Run npm audit. Replace with the legitimate package.",
  },
  malicious_install_script: {
    semantic_reason: "Malicious install script detected — risk of post-install compromise",
    root_cause: "Package install script contains destructive, exfiltration, or reverse-shell commands",
    recovery_suggestion: "Remove the package. Audit all dependencies. Pin versions and review package.json scripts.",
  },
  suspicious_lockfile: {
    semantic_reason: "Suspicious lockfile entry detected — risk of dependency confusion",
    root_cause: "Lockfile contains entries from untrusted or unexpected sources",
    recovery_suggestion: "Regenerate lockfile with npm install --locked. Verify all registry URLs are trusted.",
  },
};

function findRuleById(id) {
  return RULE_MAP[id] || null;
}

function findSecretType(type) {
  return SECRET_TYPE_MAP[type] || null;
}

function findSupplyChainType(type) {
  return SUPPLY_CHAIN_MAP[type] || {
    semantic_reason: "Supply chain anomaly detected — risk of compromised dependency",
    root_cause: "Dependency or install behavior matches suspicious patterns",
    recovery_suggestion: "Review the dependency for malicious intent. Run npm audit and Snyk. Pin versions.",
  };
}

function classifyFinding(reasonText, finding) {
  if (!reasonText && !finding) return null;

  if (finding && finding.rule) {
    const semanticKey = MCP_RULE_MAP[finding.rule] || finding.rule;
    if (RULE_MAP[semanticKey]) {
      return { source: "rule", key: semanticKey, mapping: RULE_MAP[semanticKey] };
    }
  }

  if (finding && finding.package_name) {
    const key = finding.known_malicious ? "known_malicious" : "malicious_install_script";
    return { source: "supply_chain", key, mapping: findSupplyChainType(key) };
  }

  const text = (reasonText || "").toLowerCase();

  for (const [key, mapping] of Object.entries(RULE_MAP)) {
    const ruleKey = key.toLowerCase().replace(/_/g, " ");
    if (text.includes(ruleKey) || text.includes(key.toLowerCase())) {
      return { source: "rule", key, mapping };
    }
  }

  if (safeTest(/secret|key|token|password|credential|api.?key/i, text)) {
    for (const [type, mapping] of Object.entries(SECRET_TYPE_MAP)) {
      if (text.includes(type)) {
        return { source: "secret", key: type, mapping };
      }
    }
    return {
      source: "secret",
      key: "generic_secret",
      mapping: {
        semantic_reason: "Hardcoded credential detected — risk of unauthorized access",
        root_cause: "Source code contains embedded credentials or secrets in plaintext",
        recovery_suggestion: "Rotate exposed credentials. Use environment variables or a secrets manager.",
      },
    };
  }

  if (safeTest(/package|lockfile|dependency|npm|malicious|compromised|supply.?chain/i, text)) {
    return {
      source: "supply_chain",
      key: "generic_supply_chain",
      mapping: findSupplyChainType("generic"),
    };
  }

  if (safeTest(/binary|executable|artifact/i, text)) {
    return {
      source: "binary",
      key: "untrusted_binary",
      mapping: {
        semantic_reason: "Untrusted binary detected — risk of hidden malicious behavior",
        root_cause: "Binary or executable file cannot be inspected by source-level analysis",
        recovery_suggestion: "Only execute binaries from official sources. Verify checksums and signatures.",
      },
    };
  }

  return null;
}

function rootCauseForFinding(finding) {
  const classified = classifyFinding(finding?.reasons?.[0] || finding?.message || "", finding);
  return classified ? classified.mapping.root_cause : "Unclassified security finding";
}

function recoveryForFinding(finding) {
  const classified = classifyFinding(finding?.reasons?.[0] || finding?.message || "", finding);
  return classified ? classified.mapping.recovery_suggestion : "Review the finding manually and apply least privilege.";
}

function semanticForFinding(finding) {
  const classified = classifyFinding(finding?.reasons?.[0] || finding?.message || "", finding);
  return classified ? classified.mapping.semantic_reason : "Unclassified security finding requires manual review";
}

module.exports = {
  RULE_MAP,
  SECRET_TYPE_MAP,
  SUPPLY_CHAIN_MAP,
  classifyFinding,
  rootCauseForFinding,
  recoveryForFinding,
  semanticForFinding,
};
