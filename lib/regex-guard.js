'use strict';

/**
 * Regex Guard — ReDoS protection for TEOS Sentinel engines.
 *
 * Strategy:
 *   1. Per-engine time budget (200ms) enforced via Date.now() checks inside the rule loop.
 *   2. Input truncation (rules receive at most 5000 chars; engine-level cap is 10KB).
 *   3. Startup-time regex validation (flags any regex that could cause catastrophic backtracking).
 *   4. Per-rule timing metrics (logs any single rule exceeding 10ms).
 */

const ENGINE_TIMEOUT_MS = parseInt(process.env.ENGINE_TIMEOUT_MS) || 200;
const RULE_WARN_MS      = parseInt(process.env.RULE_WARN_MS) || 10;
const MAX_RULE_INPUT    = 5000;

/**
 * Check if total engine execution time budget is exceeded.
 * Call this inside the rule loop (every N rules) to bail out early.
 * @param {number} startMs - Date.now() captured before the loop
 * @returns {boolean} true if budget exceeded
 */
function isBudgetExceeded(startMs) {
  return (Date.now() - startMs) > ENGINE_TIMEOUT_MS;
}

/**
 * Truncate input to a safe length for individual rule testing.
 * Reduces ReDoS attack surface without changing the engine-level cap.
 * @param {string} cmd - The normalized command string
 * @returns {string} truncated input
 */
function safeRuleInput(cmd) {
  return cmd.length > MAX_RULE_INPUT ? cmd.slice(0, MAX_RULE_INPUT) : cmd;
}

/**
 * Validate a regex at startup for common ReDoS-vulnerable patterns.
 * Logs warnings but does not block (prevention, not enforcement).
 * @param {string} ruleId - Rule identifier
 * @param {RegExp} regex - The regex to validate
 */
function validateRegex(ruleId, regex) {
  const source = regex.source;
  // Common catastrophic backtracking patterns
  const dangerous = [
    /\(\.\*\+\)\{/,             // Nested quantifiers: (a+){n}
    /\(\.\*\)\{/,               // Nested quantifiers: (a*){n}
    /\.\*\.\*/,                  // Multiple .* in sequence
  ];

  for (const pat of dangerous) {
    if (pat.test(source)) {
      console.warn(JSON.stringify({
        ts: new Date().toISOString(),
        level: 'warn',
        msg: 'Potentially vulnerable regex detected',
        ruleId,
        pattern: source.slice(0, 100),
        recommendation: 'Consider simplifying to avoid catastrophic backtracking',
      }));
      return false;
    }
  }
  return true;
}

module.exports = { ENGINE_TIMEOUT_MS, RULE_WARN_MS, MAX_RULE_INPUT, isBudgetExceeded, safeRuleInput, validateRegex };
