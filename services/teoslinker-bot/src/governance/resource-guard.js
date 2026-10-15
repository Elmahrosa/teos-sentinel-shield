const MAX_CONCURRENT_GITHUB_SCANS = 2;
const MAX_PDF_DURATION_MS = 30000;
const MAX_WEBHOOK_RETRIES = 3;
const MAX_SCAN_MEMORY_MB = 128;

const state = {
  activeGithubScans: 0,
  activePdfGenerations: 0,
};

function acquireGithubScan() {
  if (state.activeGithubScans >= MAX_CONCURRENT_GITHUB_SCANS) {
    return { allowed: false, reason: `Max concurrent GitHub scans reached (${MAX_CONCURRENT_GITHUB_SCANS})` };
  }
  state.activeGithubScans++;
  return { allowed: true };
}

function releaseGithubScan() {
  if (state.activeGithubScans > 0) state.activeGithubScans--;
}

function acquirePdfGeneration() {
  if (state.activePdfGenerations >= 1) {
    return { allowed: false, reason: "PDF generation already in progress" };
  }
  state.activePdfGenerations++;
  return { allowed: true, timeoutMs: MAX_PDF_DURATION_MS };
}

function releasePdfGeneration() {
  if (state.activePdfGenerations > 0) state.activePdfGenerations--;
}

function checkScanMemory(bytes) {
  const mb = bytes / 1024 / 1024;
  return mb <= MAX_SCAN_MEMORY_MB;
}

function getState() {
  return { ...state, maxGithub: MAX_CONCURRENT_GITHUB_SCANS, maxPdfDuration: MAX_PDF_DURATION_MS, maxWebhookRetries: MAX_WEBHOOK_RETRIES, maxScanMemoryMB: MAX_SCAN_MEMORY_MB };
}

module.exports = { acquireGithubScan, releaseGithubScan, acquirePdfGeneration, releasePdfGeneration, checkScanMemory, getState, MAX_CONCURRENT_GITHUB_SCANS, MAX_PDF_DURATION_MS, MAX_WEBHOOK_RETRIES, MAX_SCAN_MEMORY_MB };
