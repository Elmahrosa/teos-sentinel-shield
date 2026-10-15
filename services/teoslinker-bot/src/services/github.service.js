const axios = require('axios');
const { logger } = require('../../logger.cjs');
const { acquireGithubScan, releaseGithubScan, checkScanMemory } = require('../governance/resource-guard');
const { scanForSecrets } = require('./secret-detection');
const { safeTest, safeMatch } = require('../security/safe-regex');

const MAX_FILES = 30;
const MAX_FILE_SIZE = 200 * 1024;
const MAX_TOTAL_SIZE = 5 * 1024 * 1024;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const TRUSTED_PATH_PREFIXES = [
  'scripts/',
  'deploy/',
  'tools/',
  'ci/',
  'runtime-validation/',
];

const HIGH_RISK_PATTERNS = [
  /\.github\/workflows\/.+\.ya?ml$/i,
  /Dockerfile[^/]*$/i,
  /docker-compose.+\.ya?ml$/i,
  /\.?dockerfile$/i,
  /\.sh$/,
  /\.bash$/,
  /\.tf$/,
  /\.tfvars$/,
  /Jenkinsfile[^/]*$/i,
  /\.gitlab-ci\.ya?ml$/i,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^pnpm-lock\.yaml$/,
  /^yarn\.lock$/,
  /^requirements\.txt$/,
  /^go\.mod$/,
  /^Gemfile$/,
  /^Pipfile$/,
  /^Cargo\.toml$/,
  /^composer\.json$/,
  /install\.sh$/i,
  /deploy.+\.(sh|ya?ml)$/i,
  /k8s?.+\.ya?ml$/i,
  /\.k8s?\.ya?ml$/i,
];

const BINARY_EXTENSIONS = new Set([
  'exe', 'dll', 'so', 'dylib', 'bin', 'elf', 'o', 'a', 'lib',
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'ico', 'webp',
  'woff', 'woff2', 'ttf', 'eot',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'zip', 'tar', 'gz', 'bz2', '7z', 'rar',
  'mp3', 'mp4', 'avi', 'mov', 'mkv',
  'pyc', 'class', 'jar', 'war',
  'iso', 'img', 'dmg',
  'pdb', 'ds_store',
]);

const KNOWN_MALICIOUS_PACKAGES = new Set([
  'crossenv', 'events-stream', 'eslint-scope', 'babel-lo', 'node-fabric',
  'aws-sdk-mock', 'electron-native-notify', 'load-from-cwd', 'safe-eval',
  'flatmap-stream', 'event-stream', 'js-diff', 'css-inline',
]);

function isTrustedPath(filePath) {
  return TRUSTED_PATH_PREFIXES.some(p => filePath.startsWith(p));
}

function isHighRiskSurface(filePath) {
  return HIGH_RISK_PATTERNS.some(p => safeTest(p, filePath));
}

function isBinaryExtension(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

function authHeaders() {
  const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'teoslinker-bot' };
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

function parseGitHubUrl(url) {
  url = url.trim().replace(/\.git$/, '').replace(/^git@(?:github\.com):/, 'https://github.com/');
  url = url.split('?')[0].split('#')[0];
  url = url.replace(/github\.com:\d+\//, 'github.com/');

  const match = safeMatch(/github\.com\/([^\/?#]+)\/([^\/?#]+?)(?:\/|$)/i, url);
  if (!match) return null;

  const [, owner, repo] = match;
  const rest = url.slice(match.index + match[0].length).replace(/^\//, '');

  if (!rest) return { owner, repo: repo.replace(/\.git$/, ''), ref: '', path: '' };

  const treeMatch = safeMatch(/^(tree|blob)\/(.+)$/i, rest);
  if (treeMatch) {
    return { owner, repo: repo.replace(/\.git$/, ''), ref: treeMatch[2], path: '' };
  }

  return { owner, repo: repo.replace(/\.git$/, ''), ref: '' };
}

async function getRepoMetadata(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const res = await axios.get(url, { timeout: 5000, headers: authHeaders() });
  return res.data;
}

async function resolveBranchRef(owner, repo, ref, default_branch) {
  if (!ref || !ref.trim()) return { branch: default_branch || 'main', path: '' };

  const segments = ref.split('/');

  // Try progressively shorter refs as branch names
  for (let i = segments.length; i > 0; i--) {
    const candidate = segments.slice(0, i).join('/');
    const rest = segments.slice(i).join('/');
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(candidate)}`,
        { timeout: 3000, headers: authHeaders(), validateStatus: s => s < 400 }
      );
      if (res.data && res.data.name) {
        return { branch: candidate, path: rest };
      }
    } catch {
      continue;
    }
  }

  // Fall back to default branch with full ref as path
  if (default_branch) {
    logger.warn({ owner, repo, ref, default_branch }, "Branch ref not found — falling back to default branch");
    return { branch: default_branch, path: ref };
  }

  return { branch: segments[0], path: segments.slice(1).join('/') };
}

async function getCommitSha(owner, repo, branch) {
  const url = `https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`;
  const res = await axios.get(url, { timeout: 5000, headers: authHeaders() });
  return res.data.commit.sha;
}

async function getRepoTreeBySha(owner, repo, sha) {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;
  const res = await axios.get(url, { timeout: 10000, headers: authHeaders() });
  return res.data.tree.filter(f => f.type === 'blob');
}

async function getFileContent(owner, repo, branch, path, skipApi) {
  if (GITHUB_TOKEN && !skipApi) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
      const res = await axios.get(url, { timeout: 3000, headers: authHeaders(), validateStatus: s => s < 400 });
      if (res.data && res.data.content) {
        return Buffer.from(res.data.content, 'base64').toString('utf-8');
      }
    } catch (e) { logger.warn({ err: e?.message, owner, repo, path }, "GitHub Contents API failed — falling back to raw"); }
  }
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const headers = { 'User-Agent': 'teoslinker-bot' };
  try {
    const res = await axios.get(rawUrl, { timeout: 5000, responseType: 'text', validateStatus: s => s < 400, headers });
    return res.data;
  } catch (e) {
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
      const res = await axios.get(rawUrl, { timeout: 5000, responseType: 'text', validateStatus: s => s < 400, headers });
      return res.data;
    }
    throw e;
  }
}

function isBinaryContent(content) {
  if (!content || typeof content !== 'string') return false;
  const checkLen = Math.min(content.length, 2048);
  for (let i = 0; i < checkLen; i++) {
    if (content.charCodeAt(i) === 0) return true;
  }
  return false;
}

function analyzeSupplyChain(filename, content) {
  const findings = [];
  const lowerName = filename.toLowerCase();

  if (lowerName === 'package-lock.json' || lowerName === 'pnpm-lock.yaml') {
    try {
      const data = JSON.parse(content);
      const packages = data.packages || data.dependencies || {};
      for (const [name, info] of Object.entries(packages)) {
        const pkgName = name.replace(/^node_modules\//, '').split('/')[0];

        if (KNOWN_MALICIOUS_PACKAGES.has(pkgName)) {
          findings.push({
            verdict: 'BLOCK',
            score: 100,
            package_name: pkgName,
            severity: 'critical',
            message: `Known malicious package detected: ${pkgName}`,
            file: filename,
          });
        }

        const scripts = info.scripts || {};
        for (const [hook, cmd] of Object.entries(scripts)) {
          if (typeof cmd === 'string' && safeTest(/(?:curl|wget|bash|sh|exec|eval|rm\s+-rf|chmod\s+777|nc\s+|chsh|pty|reverse|shell)/i, cmd)) {
            findings.push({
              verdict: 'BLOCK',
              score: 100,
              package_name: pkgName,
              script_hook: hook,
              severity: 'critical',
              message: `Malicious install script (${hook}) in ${pkgName}: ${cmd.slice(0, 80)}`,
              file: filename,
            });
          }
        }
      }
    } catch (err) { logger.warn({ err }, "analyzeSupplyChain lockfile parse failed"); }
  }

  if (lowerName === 'yarn.lock') {
    const lines = content.split('\n');
    let currentPkg = '';
    for (const line of lines) {
      const pkgMatch = line.match(/^"?([^@\s"]+)@/);
      if (pkgMatch) {
        currentPkg = pkgMatch[1];
        if (KNOWN_MALICIOUS_PACKAGES.has(currentPkg)) {
          findings.push({
            verdict: 'BLOCK',
            score: 100,
            package_name: currentPkg,
            severity: 'critical',
            message: `Known malicious package in yarn.lock: ${currentPkg}`,
            file: filename,
          });
        }
      }
    }
  }

  return findings;
}

let _tokenValid = null;
async function isTokenValid() {
  if (_tokenValid !== null) return _tokenValid;
  try {
    const res = await axios.get('https://api.github.com/user', { timeout: 3000, headers: authHeaders(), validateStatus: s => s < 400 });
    _tokenValid = true;
  } catch {
    _tokenValid = false;
  }
  return _tokenValid;
}

async function scanGitHubRepo(url, scanFn) {
  const guard = acquireGithubScan();
  if (!guard.allowed) return { error: true, message: guard.reason };
  try {
  const info = parseGitHubUrl(url);
  if (!info) return { error: true, message: 'Invalid GitHub URL' };
  const { owner, repo } = info;

  let metadata;
  try {
    metadata = await getRepoMetadata(owner, repo);
  } catch {
    return { error: true, message: `Could not fetch repository.${GITHUB_TOKEN ? '' : ' — for private repos, set GITHUB_TOKEN'}` };
  }

  const default_branch = metadata.default_branch || 'main';

  const { branch: resolvedBranch, path: filterPath } = await resolveBranchRef(owner, repo, info.ref, default_branch);

  let commitSha;
  try {
    commitSha = await getCommitSha(owner, repo, resolvedBranch);
  } catch {
    return { error: true, message: `Could not resolve branch "${resolvedBranch}"` };
  }

  let files;
  try {
    files = await getRepoTreeBySha(owner, repo, commitSha);
  } catch {
    return { error: true, message: 'Could not fetch repository tree.' };
  }

  if (filterPath) {
    files = files.filter(f => f.path.startsWith(filterPath));
  } else {
    files = files.filter(f => isHighRiskSurface(f.path));
  }

  if (files.length > MAX_FILES) files = files.slice(0, MAX_FILES);
  checkScanMemory(files.reduce((acc, f) => acc + f.size || 0, 0));

  const results = [];
  const skippedBinaries = [];
  let totalBytes = 0;
  const tokenValid = await isTokenValid();
  const mcpQueue = [];
  const scanStart = Date.now();
  const SCAN_HARD_LIMIT_MS = 60000;
  for (const file of files) {
    if (totalBytes >= MAX_TOTAL_SIZE) break;
    try {
      const content = await getFileContent(owner, repo, resolvedBranch, file.path, !tokenValid);

      if (!content || content.length < 3) continue;

      if (isBinaryExtension(file.path) || isBinaryContent(content)) {
        skippedBinaries.push({ file: file.path, type: 'binary', scanned: false, size: content.length });
        continue;
      }

      if (content.length >= MAX_FILE_SIZE) continue;
      totalBytes += content.length;

      // Secret detection (runs locally, always)
      if (content.length < MAX_FILE_SIZE) {
        const secretFindings = scanForSecrets(content, file.path);
        if (secretFindings.length > 0) {
          results.push({
            file: file.path,
            verdict: 'BLOCK',
            score: 100,
            reasons: secretFindings.map(f => f.message),
            findings: secretFindings,
            trusted_infrastructure: isTrustedPath(file.path),
            rule_id: secretFindings[0].rule || null,
            line_number: secretFindings[0].line || null,
            matched_pattern: secretFindings[0].matched_pattern || secretFindings[0].snippet || secretFindings[0].message || null,
            evidence_snippet: secretFindings[0].evidence_snippet || secretFindings[0].snippet || secretFindings[0].message || null,
          });
          continue;
        }
      }

      // Supply chain analysis (lockfiles)
      const supplyChainFindings = analyzeSupplyChain(file.path, content);
      if (supplyChainFindings.length > 0) {
        for (const sf of supplyChainFindings) {
          results.push({
            file: file.path,
            verdict: sf.verdict,
            score: sf.score,
            reasons: [sf.message],
            package_name: sf.package_name,
            rule_id: 'SUPPLY_CHAIN_' + (sf.package_name ? 'MALICIOUS' : 'INSTALL_SCRIPT'),
            matched_pattern: sf.message || null,
            evidence_snippet: sf.message || null,
          });
        }
        continue;
      }

      mcpQueue.push({ file, content });
    } catch (e) { logger.warn({ err: e?.message, file: file.path }, "File scan failed"); }
  }

  // Process MCP scans in parallel batches with hard time limit
  const CONCURRENCY = 2;
  for (let i = 0; i < mcpQueue.length && Date.now() - scanStart < SCAN_HARD_LIMIT_MS; i += CONCURRENCY) {
    const batch = mcpQueue.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(batch.map(({ file, content }) => {
      const scanPromise = scanFn(content).then(scanResult => {
        if (scanResult && scanResult.verdict !== 'ALLOW') {
          const firstFinding = (scanResult.findings || [])[0] || {};
          return {
            file: file.path,
            ...scanResult,
            trusted_infrastructure: isTrustedPath(file.path),
            rule_id: firstFinding.rule_id || firstFinding.rule || null,
            line_number: firstFinding.line_number || null,
            matched_pattern: firstFinding.matched_pattern || firstFinding.reasons?.[0] || null,
            evidence_snippet: firstFinding.evidence_snippet || firstFinding.reasons?.[0] || null,
          };
        }
        return null;
      }).catch(() => null);
      return Promise.race([
        scanPromise,
        new Promise(resolve => setTimeout(() => resolve(null), 15000))
      ]);
    }));
    for (const r of batchResults) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
  }

  const totalFiles = files.length;
  const findings = results.filter(r => r.verdict !== 'ALLOW');
  const totalIssues = findings.length;
  let overallVerdict = 'ALLOW';
  let highestScore = 0;
  for (const r of findings) {
    if (r.verdict === 'BLOCK') overallVerdict = 'BLOCK';
    else if (r.verdict === 'WARN' && overallVerdict !== 'BLOCK') overallVerdict = 'WARN';
    if ((r.score || 0) > highestScore) highestScore = r.score;
  }

  const fileList = files.map(f => ({
    path: f.path,
    trusted: isTrustedPath(f.path),
  }));

  return {
    verdict: overallVerdict,
    score: highestScore,
    owner,
    repo,
    branch: resolvedBranch,
    defaultBranch: default_branch,
    totalFiles,
    filesScanned: files.length,
    highRiskSurfaces: fileList,
    issuesFound: totalIssues,
    findings,
    skippedBinaries,
    commitSha,
    scanMs: Date.now() - scanStart,
  };
  } finally { releaseGithubScan(); }
}

module.exports = {
  scanGitHubRepo,
  parseGitHubUrl,
  getRepoMetadata,
  resolveBranchRef,
  getCommitSha,
  getRepoTreeBySha,
  getFileContent,
  isBinaryContent,
  isBinaryExtension,
  isTrustedPath,
  isHighRiskSurface,
  analyzeSupplyChain,
};
