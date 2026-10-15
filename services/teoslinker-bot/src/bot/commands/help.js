const { D } = require("../../utils/formatting");
const { mainMenu } = require("../menus");
const { modelService, MODELS } = require("../../services/model.service");

async function helpCommand(ctx) {
  const groqOk = !!process.env.GROQ_API_KEY;
  const anthropicOk = !!process.env.ANTHROPIC_API_KEY;
  const availableModels = modelService.getAvailableModels(groqOk, anthropicOk);
  const claudeAvailable = availableModels.some(m => m.id === 'claude');
  const claudeLine = claudeAvailable
    ? '/claude <message>       Claude agent with TEOS Sentinel firewall (5cr)'
    : '';

  await ctx.reply(
`🔶 TEOS Sentinel Shield — Reference
${D}
🔍 Analysis
/scan <code>            Scan shell commands or code (incl. PCI-DSS contamination + identity leak detection)
/scan-banking <code>    Audit core financial pipelines for data leaks/compliance (1cr)
/scan-solana <code>     Scan Solana programs
/solana <code>          Scan Solana programs
/evm <code>             Scan EVM smart contracts
/solanatoken <address>  Basic Solana token intelligence (5cr)
/diligence <address>    Premium on-chain due diligence (15cr)
/fullreport <address>   Full token risk report PDF (20cr)
/deps <package.json>    Dependency vulnerability scan
/ci <workflow>          CI/CD pipeline security audit

🏛️ Financial Compliance Modules (CBE / FRA)
/scan-banking <code>    Audit core financial pipelines for data leaks/compliance
                        View dynamic CBE/FRA dual-mandate guardrails

🤖 AI Agent (Multi-Model)
/model                  Select AI model
/llama3                 Quick-select Llama 3 8B (free)
/qwen                   Quick-select Qwen 3 32B (free)
/openai                 Quick-select OpenAI GPT-OSS 20B (free)
/chat <message>         Chat with selected model (1-3cr)
/claude <message>       Claude Sonnet 4.6 (2cr)
/claude-opus <message>  Claude Opus 4.6 (3cr)

\u{1F6E1}\uFE0F Protection
/protect on             Enable group auto-moderation
/protect off            Disable group auto-moderation
/protect status         View protection status
/automod on             Enable group auto-moderation
/automod off            Disable group auto-moderation
/automod status         View protection status

\u{1F4B0} Account
/credits             View balance and tier
/plans               View available plans
/upgrade             Upgrade your account
/status              System health dashboard
/dashboard           Open Command Center web dashboard

\u{1F4DD} Feedback
/feedback <message>  Report issues, false positives, or suggestions
${D}
\u{1F4CC} Examples
/scan rm -rf /
/solana use anchor_lang::prelude::*;
/scan-solana use anchor_lang::prelude::*;
/evm pragma solidity ^0.8.0;
/solanatoken DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
/diligence DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
/fullreport DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
/deps {"dependencies":{"express":"latest"}}
/ci uses: actions/checkout@v4
/claude Deploy to production
/claude-opus Write a comprehensive security audit
/llama3 What is a CSRF attack?
/qwen Write a Dockerfile for Node.js
/feedback False positive on EVM scanner`,

    mainMenu()
  );
}

module.exports = { helpCommand };
