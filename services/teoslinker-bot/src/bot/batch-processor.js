const { getCredits } = require("../services/activation.service");
const { getCommandCost, isValidCommand } = require("./command-registry");
const { D } = require("../utils/formatting");
let logger;
try {
  logger = require("../../logger.cjs").logger;
} catch {
  logger = console;
}

const MAX_BATCH_SIZE = 10;
const BATCH_TIMEOUT_MS = 60000;

function parseBatchMessage(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const commands = [];
  
  for (const line of lines) {
    const match = line.match(/^\/(\w+(?:-\w+)?)(?:@\w+)?\s*(.*)?$/);
    if (match) {
      const cmd = match[1].toLowerCase();
      if (isValidCommand(cmd)) {
        commands.push({
          command: cmd,
          args: match[2] || '',
          raw: line
        });
      }
    }
  }
  
  return commands;
}

function calculateBatchCost(commands) {
  const breakdown = commands.map(cmd => ({
    command: cmd.command,
    cost: !cmd.args ? 0 : getCommandCost(cmd.command)
  }));
  
  const total = breakdown.reduce((sum, item) => sum + item.cost, 0);
  
  return { total, breakdown };
}

async function executeBatch(ctx, commands, commandHandlers) {
  const userId = String(ctx.from.id);
  const startTime = Date.now();
  const results = [];
  
  logger.info({ userId, commandCount: commands.length, commands: commands.map(c => c.command) }, "Batch execution started");
  
  const { total: totalCost, breakdown } = calculateBatchCost(commands);
  const initialCredits = await getCredits(userId);
  
  logger.info({ userId, totalCost, initialCredits, breakdown }, "Batch cost calculated");
  
  await ctx.reply(
`🔶 *TEOS Batch Processing*
${D}
Commands: ${commands.length}
Total cost: ${totalCost} credits
Your credits: ${initialCredits}
${commands.length > 0 ? `Remaining after: ${Math.max(0, initialCredits - totalCost)} credits` : ''}`,
    { parse_mode: "Markdown" }
  );
  
  let creditsRemaining = initialCredits;
  
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    const cost = !cmd.args ? 0 : getCommandCost(cmd.command);
    const cmdStartTime = Date.now();
    
    logger.info({ userId, commandIndex: i + 1, command: cmd.command, args: cmd.args.slice(0, 100), creditsRemaining }, "Batch command starting");
    
    if (Date.now() - startTime > BATCH_TIMEOUT_MS) {
      const timeoutError = `Batch timeout exceeded (60s limit, elapsed: ${((Date.now() - startTime) / 1000).toFixed(1)}s)`;
      logger.error({ userId, command: cmd.command, commandIndex: i + 1, elapsed: Date.now() - startTime }, timeoutError);
      
      results.push({
        index: i,
        command: cmd.command,
        status: 'timeout',
        error: timeoutError
      });
      
      for (let j = i + 1; j < commands.length; j++) {
        results.push({
          index: j,
          command: commands[j].command,
          status: 'skipped',
          error: 'Batch stopped due to timeout'
        });
      }
      break;
    }
    
    if (creditsRemaining < cost) {
      const creditError = `Insufficient credits (need ${cost}, have ${creditsRemaining})`;
      logger.warn({ userId, command: cmd.command, commandIndex: i + 1, cost, creditsRemaining }, creditError);
      
      results.push({
        index: i,
        command: cmd.command,
        status: 'skipped',
        error: creditError
      });
      
      for (let j = i + 1; j < commands.length; j++) {
        results.push({
          index: j,
          command: commands[j].command,
          status: 'skipped',
          error: 'Batch stopped due to insufficient credits'
        });
      }
      break;
    }
    
    await ctx.reply(`[${i + 1}/${commands.length}] Executing /${cmd.command}...`);
    
    try {
      const handler = commandHandlers[cmd.command];
      if (!handler) {
        const error = new Error(`No handler found for command: ${cmd.command}`);
        logger.error({ userId, command: cmd.command, commandIndex: i + 1, stack: error.stack }, error.message);
        throw error;
      }
      
      const mockCtx = createMockContext(ctx, cmd);
      const result = await handler(mockCtx);
      const cmdDuration = Date.now() - cmdStartTime;
      
      creditsRemaining = await getCredits(userId);
      
      logger.info({ userId, command: cmd.command, commandIndex: i + 1, duration: cmdDuration, creditsRemaining }, "Batch command completed successfully");
      
      results.push({
        index: i,
        command: cmd.command,
        status: 'success',
        result: result || mockCtx.lastReply,
        duration: cmdDuration
      });
    } catch (err) {
      const cmdDuration = Date.now() - cmdStartTime;
      logger.error({ 
        err, 
        userId, 
        command: cmd.command, 
        commandIndex: i + 1, 
        duration: cmdDuration,
        creditsRemaining,
        stack: err.stack,
        errorMessage: err.message,
        errorCode: err.code,
        errorResponse: err.response?.data
      }, `Batch command failed: ${cmd.command}`);
      
      results.push({
        index: i,
        command: cmd.command,
        status: 'error',
        error: err.message || 'Unknown error',
        duration: cmdDuration
      });
    }
  }
  
  const finalCredits = await getCredits(userId);
  const creditsUsed = initialCredits - finalCredits;
  const totalTime = Date.now() - startTime;
  
  logger.info({ 
    userId, 
    totalCommands: commands.length,
    successfulCommands: results.filter(r => r.status === 'success').length,
    failedCommands: results.filter(r => r.status === 'error').length,
    skippedCommands: results.filter(r => r.status === 'skipped' || r.status === 'timeout').length,
    creditsUsed,
    creditsRemaining: finalCredits,
    totalTime
  }, "Batch execution completed");
  
  return {
    results,
    breakdown,
    totalCost,
    creditsUsed,
    creditsRemaining: finalCredits,
    executionTime: totalTime
  };
}

function createMockContext(originalCtx, cmd) {
  const replies = [];
  
  return {
    from: originalCtx.from,
    chat: originalCtx.chat,
    message: {
      text: cmd.raw,
      from: originalCtx.from,
      chat: originalCtx.chat
    },
    reply: async (text, options) => {
      replies.push({ text, options });
      return { message_id: Date.now() };
    },
    replyWithMarkdown: async (text, options) => {
      replies.push({ text, options, markdown: true });
      return { message_id: Date.now() };
    },
    replyWithMarkdownV2: async (text, options) => {
      replies.push({ text, options, markdown: true });
      return { message_id: Date.now() };
    },
    replyWithDocument: async (doc, options) => {
      replies.push({ text: `[Document: ${doc.filename || 'report.pdf'}]`, options });
      return { message_id: Date.now() };
    },
    answerCbQuery: async () => {},
    getChatAdministrators: async () => originalCtx.getChatAdministrators?.() || [],
    botInfo: originalCtx.botInfo,
    lastReply: null,
    getReplies: () => replies
  };
}

function extractSecuritySummary(text) {
  if (!text || typeof text !== 'string') return null;
  const lines = text.split('\n').filter(l => l.trim());
  const keyLines = [];
  for (const line of lines) {
    const clean = line.replace(/[*_`]/g, '').trim();
    if (!clean) continue;
    if (/^(Verdict|Score|Risk|Code|Files|Issues|Rule|Command|Severity|Findings|Status|Credits|Remaining|Tier|Plan|Cost|Dangerous|Secret|Supply|Destructive|Trusted|Solana|EVM|CI|Dependencies)/i.test(clean)) {
      keyLines.push(clean);
      if (keyLines.length >= 5) break;
    }
  }
  return keyLines.length > 0 ? keyLines.join('\n') : null;
}

function formatBatchResults(batchResult, commands) {
  const { results, breakdown, totalCost, creditsUsed, creditsRemaining, executionTime } = batchResult;
  
  let output = `\u{1F6E1}\uFE0F *TEOS Batch Results*\n${D}\n\n`;
  
  for (const result of results) {
    const bd = breakdown && breakdown[result.index];
    const estCost = bd ? bd.cost : 0;
    const statusIcon = result.status === 'success' ? '\u2705' : 
                       result.status === 'error' ? '\u274C' :
                       result.status === 'timeout' ? '\u23F1\uFE0F' : '\u23ED\uFE0F';
    
    output += `*[${result.index + 1}/${commands.length}] /${result.command.toUpperCase()}* ${statusIcon}\n`;
    
    if (result.status === 'success') {
      if (result.result && typeof result.result === 'object') {
        output += `  Cost: ${estCost} cr`;
        if (result.result.verdict) output += ` | Verdict: ${result.result.verdict}`;
        if (result.result.score !== undefined) output += ` | Score: ${result.result.score}/100`;
        output += '\n';
        if (result.result.filesScanned !== undefined) output += `  Files scanned: ${result.result.filesScanned}\n`;
        if (result.result.issuesFound !== undefined) output += `  Issues found: ${result.result.issuesFound}\n`;
      } else if (result.result && typeof result.result === 'string') {
        const summary = extractSecuritySummary(result.result);
        output += `  Cost: ${estCost} cr\n`;
        if (summary) {
          for (const line of summary.split('\n')) {
            output += `  ${line}\n`;
          }
        } else {
          output += `  Scan completed\n`;
        }
      } else {
        output += `  Completed\n`;
      }
      if (result.duration) {
        output += `  Time: ${(result.duration / 1000).toFixed(1)}s\n`;
      }
    } else if (result.status === 'error') {
      output += `  Cost: ${estCost} cr\n`;
      output += `  Failed: ${result.error}\n`;
      if (result.duration) {
        output += `  Time: ${(result.duration / 1000).toFixed(1)}s\n`;
      }
    } else {
      output += `  Skipped: ${result.error}\n`;
    }
    
    output += `\n`;
  }
  
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'error').length;
  
  const verdicts = results.filter(r => r.status === 'success' && r.result && r.result.verdict).map(r => r.result.verdict);
  const blocks = verdicts.filter(v => v === 'BLOCK').length;
  const warns = verdicts.filter(v => v === 'WARN').length;
  const allows = verdicts.filter(v => v === 'ALLOW').length;
  const reviews = verdicts.filter(v => v === 'REVIEW').length;
  
  output += `${D}\n`;
  output += `*Summary*\n`;
  output += `Total: ${results.length} | \u2705 ${successCount} | \u274C ${failedCount}\n`;
  if (blocks > 0) output += `Blocks: ${blocks} | `;
  if (warns > 0) output += `Warns: ${warns} | `;
  if (reviews > 0) output += `Reviews: ${reviews} | `;
  if (allows > 0) output += `Allows: ${allows}`;
  output += '\n';
  output += `Cost: ${totalCost} cr est. | ${creditsUsed} cr used\n`;
  output += `Remaining: ${creditsRemaining} cr\n`;
  output += `Time: ${(executionTime / 1000).toFixed(1)}s\n`;
  output += `${D}\n`;
  output += `\u{1F4E2} *Share on LinkedIn / X*\n`;
  output += `\`\`\`\n`;
  output += `\u{1F6E1}\uFE0F TEOS Sentinel Security Scan\n\n`;
  output += `Commands: ${results.length} (%C% success, %E% errors)\n`;
  output += `Credits: ${creditsUsed} used | ${creditsRemaining} remaining\n`;
  output += `sentinel.teosegypt.com\n`;
  output += `\`\`\`\n`;
  output += `Tap \u{1F4CB} copy and paste to share your security scan results!`;
  
  return output.replace(
    '%C%',
    results.length > 0 ? Math.round((successCount / results.length) * 100) + '%' : '0%'
  ).replace(
    '%E%',
    results.length > 0 ? Math.round((failedCount / results.length) * 100) + '%' : '0%'
  );
}

async function processBatch(ctx, commandHandlers) {
  const text = ctx.message.text;
  const userId = String(ctx.from.id);
  const commands = parseBatchMessage(text);
  
  logger.info({ userId, text: text.slice(0, 500), parsedCommands: commands.length }, "Batch message received");
  
  if (commands.length === 0) {
    logger.info({ userId }, "No commands detected in batch message");
    return null;
  }
  
  if (commands.length === 1) {
    logger.info({ userId, command: commands[0].command }, "Single command detected, skipping batch processing");
    return null;
  }
  
  if (commands.length > MAX_BATCH_SIZE) {
    logger.warn({ userId, commandCount: commands.length, maxBatchSize: MAX_BATCH_SIZE }, "Batch limit exceeded");
    await ctx.reply(
`❌ *Batch limit exceeded*

Maximum ${MAX_BATCH_SIZE} commands per batch.
You sent ${commands.length} commands.

Please split into multiple batches.`,
      { parse_mode: "Markdown" }
    );
    return { status: 'rejected', reason: 'batch_too_large' };
  }
  
  try {
    const batchResult = await executeBatch(ctx, commands, commandHandlers);
    const formattedResults = formatBatchResults(batchResult, commands);
    
    await ctx.reply(formattedResults, { parse_mode: "Markdown" });
    
    logger.info({ userId, status: 'completed', creditsUsed: batchResult.creditsUsed, creditsRemaining: batchResult.creditsRemaining }, "Batch processing completed");
    
    return { status: 'completed', batchResult };
  } catch (err) {
    logger.error({ 
      err, 
      userId, 
      stack: err.stack,
      errorMessage: err.message,
      errorCode: err.code,
      commandCount: commands.length
    }, "Batch processing failed");
    
    await ctx.reply(
`❌ *Batch processing failed*

Error: ${err.message}

Please try again or contact support.`,
      { parse_mode: "Markdown" }
    );
    return { status: 'error', error: err.message };
  }
}

module.exports = {
  parseBatchMessage,
  calculateBatchCost,
  executeBatch,
  formatBatchResults,
  processBatch,
  MAX_BATCH_SIZE,
  BATCH_TIMEOUT_MS
};
