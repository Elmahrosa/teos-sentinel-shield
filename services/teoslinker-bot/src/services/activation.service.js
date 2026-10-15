const axios = require('axios');
const { logger } = require('../../logger.cjs');

const ACTIVATION_API = process.env.ACTIVATION_API || "http://localhost:8080";
const ACTIVATION_AUTH_TOKEN = process.env.ACTIVATION_AUTH_TOKEN || "";

// Founder bypass — always unlimited, even if activation API is down
const FOUNDER_IDS = new Set(
  (process.env.ADMIN_IDS || "").split(",").map(s => s.trim()).filter(Boolean)
);

function isFounder(userId) {
  return FOUNDER_IDS.has(String(userId));
}

function founderStatus(userId) {
  return {
    user_id: userId,
    entitlement_state: 'premium_granted',
    billing_state: 'founder',
    access_state: 'active',
    credit_state: { balance: Infinity, consumed_total: 0 },
    time_state: { subscription_expires: null }
  };
}

function founderTier(userId) {
  return { user_id: userId, tier: "founder", credits: Infinity, subscription_expires: null };
}

function getHeaders() {
  const headers = {};
  if (ACTIVATION_AUTH_TOKEN) {
    headers["x-service-token"] = ACTIVATION_AUTH_TOKEN;
  }
  return headers;
}

async function getCredits(userId) {
  if (isFounder(userId)) return Infinity;
  try {
    const res = await axios.get(
      `${ACTIVATION_API}/credits/${userId}`,
      { timeout: 5000, headers: getHeaders() }
    );
    return Number(res.data.credits ?? 0);
  } catch (err) {
    logger.warn({ err, userId }, "getCredits: activation API call failed, returning 0");
    return 0;
  }
}

async function consumeCredit(userId, amount) {
  if (isFounder(userId)) return Infinity;
  try {
    const res = await axios.post(
      `${ACTIVATION_API}/consume`,
      { userId, amount },
      { timeout: 5000, headers: getHeaders() }
    );
    return Number(res.data.credits ?? 0);
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const code = err?.code;
    throw new Error(`consume failed: status=${status} data=${JSON.stringify(data)} code=${code}`, { cause: err });
  }
}

async function checkService(url) {
  try {
    const res = await axios.get(url, { timeout: 5000 });
    return res.status >= 200 && res.status < 300;
  } catch (err) {
    logger.warn({ err, url: url && url.slice(0, 100) }, "checkService: health check failed");
    return false;
  }
}

async function getUserStatus(userId) {
  if (isFounder(userId)) return founderStatus(userId);
  try {
    const res = await axios.get(
      `${ACTIVATION_API}/status/${userId}`,
      { timeout: 5000, headers: getHeaders() }
    );
    return res.data;
  } catch (err) {
    logger.warn({ err, userId }, "getUserStatus: activation API call failed");
    return {
      user_id: userId,
      entitlement_state: 'none',
      billing_state: 'none',
      access_state: 'restricted',
      credit_state: { balance: 0, consumed_total: 0 },
      time_state: { subscription_expires: null }
    };
  }
}

async function getUserTier(userId) {
  if (isFounder(userId)) return founderTier(userId);
  try {
    const res = await axios.get(
      `${ACTIVATION_API}/credits/${userId}`,
      { timeout: 5000, headers: getHeaders() }
    );

    return {
      user_id: res.data.user_id,
      tier: res.data.tier || res.data.plan || "free",
      credits: Number(res.data.credits ?? 0),
      subscription_expires: res.data.subscription_expires || null
    };
  } catch (err) {
    logger.warn({ err, userId }, "getUserTier: activation API call failed, returning free/0");
    return { user_id: userId, tier: "free", credits: 0 };
  }
}

async function refillCredits(userId, amount) {
  try {
    const res = await axios.post(
      `${ACTIVATION_API}/refill`,
      { userId, amount },
      { timeout: 5000, headers: getHeaders() }
    );
    return res.data;
  } catch (err) {
    logger.warn({ err, userId, amount }, "refillCredits: activation API call failed");
    return null;
  }
}

async function activateTester(userId, secret) {
  const res = await axios.post(
    `${ACTIVATION_API}/activate-tester`,
    { userId, secret },
    { timeout: 5000, headers: getHeaders() }
  );
  return res.data;
}

async function logAudit(
  userId,
  action,
  target,
  verdict,
  score,
  creditsUsed,
  creditsRemaining
) {
  try {
    await axios.post(
      `${ACTIVATION_API}/audit`,
      {
        userId,
        action,
        target,
        verdict,
        score,
        credits_used: creditsUsed,
        credits_remaining: creditsRemaining
      },
      { timeout: 5000, headers: getHeaders() }
    );
  } catch (err) {
    logger.warn({ err, userId, action }, "logAudit: activation API call failed");
  }
}

async function getAuditLogs(userId, limit = 50, offset = 0) {
  try {
    const res = await axios.get(
      `${ACTIVATION_API}/audit/${userId}?limit=${limit}&offset=${offset}`,
      { timeout: 5000, headers: getHeaders() }
    );
    return res.data;
  } catch (err) {
    logger.warn({ err, userId }, "getAuditLogs: activation API call failed");
    return { logs: [], total: 0 };
  }
}

module.exports = {
  getCredits,
  consumeCredit,
  checkService,
  getUserTier,
  getUserStatus,
  refillCredits,
  activateTester,
  logAudit,
  getAuditLogs,
  ACTIVATION_API
};