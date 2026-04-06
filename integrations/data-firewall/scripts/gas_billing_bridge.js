/**
 * Safe Ingestion Engine — GAS Billing Bridge
 * 
 * Add this function to your existing apps_script_v3.gs
 * Call it after you confirm the USDC transaction on Base.
 *
 * Required Script Properties (File → Project properties → Script properties):
 *   SAFE_API_BASE_URL   = https://safe.teosegypt.com
 *   GAS_WEBHOOK_SECRET  = <same value as GAS_WEBHOOK_SECRET in your .env>
 */

// ── Plan definitions (must match server PLAN_CREDITS) ──────────────────────
var PLANS = {
  trial:      { credits: 5,     usdcAmount: 0    },
  starter:    { credits: 100,   usdcAmount: 5    },
  growth:     { credits: 1000,  usdcAmount: 20   },
  enterprise: { credits: 50000, usdcAmount: 500  }
};

/**
 * Main entry point: call this after verifying a USDC payment.
 * 
 * @param {string} userEmail   - Buyer's email address
 * @param {string} plan        - "trial" | "starter" | "growth" | "enterprise"
 * @param {string} txHash      - USDC transaction hash on Base (for audit log)
 * @returns {string}           - The generated API key (sent to user via email)
 */
function issueApiKeyAfterPayment(userEmail, plan, txHash) {
  var props = PropertiesService.getScriptProperties();
  var baseUrl = props.getProperty("SAFE_API_BASE_URL");
  var webhookSecret = props.getProperty("GAS_WEBHOOK_SECRET");

  if (!baseUrl || !webhookSecret) {
    throw new Error("SAFE_API_BASE_URL or GAS_WEBHOOK_SECRET not set in Script Properties");
  }

  if (!PLANS[plan]) {
    throw new Error("Unknown plan: " + plan);
  }

  // 1. Generate a UUID key
  var apiKey = "sk-" + generateUUID();

  // 2. Register key with the FastAPI server
  var registerResult = registerKeyWithServer(apiKey, plan, txHash, baseUrl, webhookSecret);

  if (!registerResult.registered) {
    throw new Error("Server refused key registration: " + JSON.stringify(registerResult));
  }

  // 3. Log to sheet
  logKeyIssuance(userEmail, plan, txHash, apiKey, registerResult.credits);

  // 4. Email the key to the user
  sendKeyEmail(userEmail, apiKey, plan, registerResult.credits);

  Logger.log("Key issued: hash=" + registerResult.hash_preview + " plan=" + plan + " credits=" + registerResult.credits);

  return apiKey;
}

/**
 * Call FastAPI /internal/register-key
 */
function registerKeyWithServer(apiKey, plan, txHash, baseUrl, webhookSecret) {
  var payload = {
    api_key: apiKey,
    plan: plan,
    tx_hash: txHash || null
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: {
      "x-webhook-secret": webhookSecret
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(baseUrl + "/internal/register-key", options);
  var code = response.getResponseCode();
  var body = JSON.parse(response.getContentText());

  if (code !== 200) {
    throw new Error("register-key failed HTTP " + code + ": " + JSON.stringify(body));
  }

  return body;
}

/**
 * Send API key delivery email to buyer
 */
function sendKeyEmail(email, apiKey, plan, credits) {
  var subject = "Your Safe Ingestion Engine API Key";
  var body = [
    "Hi,",
    "",
    "Your API key is ready. Here are your details:",
    "",
    "  API Key:  " + apiKey,
    "  Plan:     " + plan,
    "  Credits:  " + credits + " URLs",
    "",
    "Quick start:",
    "",
    "  curl -X POST https://safe.teosegypt.com/v1/ingest_async \\",
    "       -H 'X-API-Key: " + apiKey + "' \\",
    "       -H 'Content-Type: application/json' \\",
    "       -d '{\"url\": \"https://example.com\"}'",
    "",
    "Check your balance anytime:",
    "",
    "  curl https://safe.teosegypt.com/v1/account \\",
    "       -H 'X-API-Key: " + apiKey + "'",
    "",
    "Docs: https://safe.teosegypt.com",
    "",
    "— Elmahrosa International"
  ].join("\n");

  GmailApp.sendEmail(email, subject, body);
}

/**
 * Log key issuance to the active spreadsheet (Sheet: "Keys")
 */
function logKeyIssuance(email, plan, txHash, apiKey, credits) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Keys") || ss.insertSheet("Keys");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Email", "Plan", "Credits", "TX Hash", "Key Preview"]);
  }

  sheet.appendRow([
    new Date().toISOString(),
    email,
    plan,
    credits,
    txHash || "N/A",
    apiKey.substring(0, 12) + "..."   // never log full key
  ]);
}

/**
 * Generate a UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    var v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ── Test function — run manually from GAS editor to verify the bridge ───────
function TEST_issueTrialKey() {
  var result = issueApiKeyAfterPayment(
    "test@example.com",
    "trial",
    "0xTEST_TX_HASH"
  );
  Logger.log("Test key issued: " + result);
}
