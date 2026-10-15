# Credit Accounting Audit Report

## 1. Root Cause: Double Deduction

The batch processor (`batch-processor.js:executeBatch`) and each command handler independently called `consumeCredit()`, causing every paid command to be deducted **twice**.

| Deduction Source | File | Lines |
|---|---|---|
| Batch processor loop | `src/bot/batch-processor.js` | 135-142 (removed) |
| Scan handler | `src/bot/commands/scan.js` | 93 |
| Deps handler | `src/bot/commands/deps.js` | 54 |
| CI handler | `src/bot/commands/ci.js` | 40 |
| GitHub handler | `src/index.js` (commandHandlers) | 379 |
| Report handler | `src/index.js` (commandHandlers) | 431 |
| Solana handler | `src/bot/commands/solana.js` | 138 |
| EVM handler | `src/bot/commands/evm.js` | 144 |

## 2. Audit of the Reported Batch

**Input:**
```
/status
/scan rm -rf /
/deps
/github https://github.com/Elmahrosa/teoslinker-bot
/ci
```

**Starting credits: 92, Ending credits: 64, Actual deduction: 28**

### Before Fix — Double Deduction Trace

| # | Command | Registry Cost | Batch Deduction | Handler Deduction | Total Deducted | Reason |
|---|---------|:-:|:-:|:-:|:-:|--------|
| 1 | /status | 0 | 0 | 0 | **0** | Free command |
| 2 | /scan rm -rf / | 1 | 1 | 1 | **2** | Double! |
| 3 | /deps (no args) | 3 | 3 | 0 | **3** | Handler returned early (usage) |
| 4 | /github ... | 5 | 5 | 15 | **20** | Double! Registry said 5, handler charges 15 |
| 5 | /ci (no args) | 3 | 3 | 0 | **3** | Handler returned early (usage) |
| **Total** | | **12** | **12** | **16** | **28** | |

### After Fix — Single Deduction Trace

| # | Command | Estimated Cost | Handler Deduction | Total Deducted | Match? |
|---|---------|:-:|:-:|:-:|:-:|
| 1 | /status | 0 | 0 | **0** | ✓ |
| 2 | /scan rm -rf / | 1 | 1 | **1** | ✓ |
| 3 | /deps (no args) | 0 | 0 | **0** | ✓ |
| 4 | /github ... | 15 | 15 | **15** | ✓ |
| 5 | /ci (no args) | 0 | 0 | **0** | ✓ |
| **Total** | | **16** | **16** | **16** | **✓** |

## 3. Registry Cost Mismatches Found

| Command | Old Registry | Handler Charges | Fix |
|---------|:-:|:-:|------|
| deps | 3 | 1 | Registry updated to 1 |
| ci | 3 | 1 | Registry updated to 1 |
| github | 5 | 15 | Registry updated to 15 |

## 4. Empty-Arg Cost Accounting

Commands sent without arguments (e.g. `/deps` with no payload) return early in the handler with a usage message — no scan is performed and no credits are deducted. The batch-processor estimate now sets cost=0 for argless commands to match this reality.

## 5. Changes Applied

### `src/bot/batch-processor.js`
- **Removed** `consumeCredit(userId, cost)` from the per-command execution loop (was lines 135-142)
- **Removed** `consumeCredit` from the import
- **Added** `creditsRemaining = await getCredits(userId)` after each handler completes (reads actual balance from API)
- **Added** `!cmd.args ? 0 :` check to `cost` for both the estimate (`calculateBatchCost`) and the credit sufficiency check

### `src/bot/command-registry.js`
- `deps: 3` → `deps: 1` (matches `deps.js` line 54)
- `ci: 3` → `ci: 1` (matches `ci.js` line 40)
- `github: 5` → `github: 15` (matches `index.js` GitHub handler line 379)

## 6. Other Deduction Paths (Not Affected)

| Path | File | Deducts | Notes |
|------|------|:-------|-------|
| Auto-scan (text detect) | `detectionEngine.js` | 1/15/5/1 | Separate codepath, not triggered during batch |
| Actions (buttons) | `actions/index.js` | 1/5/15/1 | Callback queries, not text |
| Standalone commands | `bot.command(...)` handlers | Varies | Unchanged — standalone was never double-deducted |
| Claude/Chat | `claude.js`, `chat.js` | 1+ | Not batch-compatible (not in VALID_COMMANDS) |

## 7. Known Residual Issues

- **`report` handler**: Not in `VALID_COMMANDS` (excluded from batch). But the batch `commandHandlers.report` always deducts 2 even for GitHub repos, while the standalone `bot.command("report")` deducts 15 for repos. These should be reconciled.
- **`claude`/`chat` handlers**: Not in `VALID_COMMANDS` (excluded from batch). Their costs (1 per message) are not tracked in the registry.

## 8. Verification

The fix ensures:
- `estimated_cost === actual_cost` for all batch commands with non-empty args
- Empty-arg commands show cost=0 (matches handler behavior — no scan, no charge)
- No double deduction: each `consumeCredit()` call happens exactly once, in the handler
- Local `creditsRemaining` tracking is derived from the API (`getCredits()`) after each command, not from internal arithmetic
