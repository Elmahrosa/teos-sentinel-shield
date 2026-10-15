const MAX_BODY_SIZE = 100 * 1024;
const { safeReplace } = require("./safe-regex");

const HTML_TAG_RE = /<[^>]*>/g;
const SCRIPT_RE = /[<>]|javascript:/gi;

function sanitizeText(val) {
  if (typeof val !== "string") return val;
  if (val.length > MAX_BODY_SIZE) return val.slice(0, MAX_BODY_SIZE);
  return safeReplace(HTML_TAG_RE, "", safeReplace(SCRIPT_RE, "", val));
}

function sanitizeRequest(req, res, next) {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeText(req.body[key]);
      }
    }
  }
  next();
}

module.exports = { sanitizeRequest, sanitizeText };
