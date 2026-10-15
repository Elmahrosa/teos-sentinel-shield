const axios = require("axios");

// Optional upstream engine. Empty when unset — sendTokenScan fails fast instead of
// waiting up to 30s on a non-existent localhost endpoint.
const MCP_API = process.env.MCP_API || process.env.MCP_ENGINE_URL || "";
const TOKEN_SCAN_TIMEOUT = 30000;

async function sendTokenScan(mintAddress, mode = "basic") {
  if (!MCP_API) throw new Error("MCP engine not configured (set MCP_API)");
  const url = mode === "premium"
    ? `${MCP_API}/analyze-token`
    : `${MCP_API}/scan-token`;

  const res = await axios.post(url,
    { address: mintAddress.trim(), mode },
    { timeout: TOKEN_SCAN_TIMEOUT, headers: { "Content-Type": "application/json" } }
  );

  return res.data;
}

module.exports = { sendTokenScan };
