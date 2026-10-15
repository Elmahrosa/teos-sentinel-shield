const MAX_REGEX_INPUT = 1024 * 1024;
const MAX_NAMED_INPUT = 100 * 1024;
const REGEX_TIMEOUT_MS = 1000;

function truncate(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str.length > maxLen ? str.slice(0, maxLen) : str;
}

function safeRegex(regex, flags) {
  try {
    return new RegExp(regex, flags);
  } catch {
    return null;
  }
}

function safeTest(pattern, str, maxLen = MAX_REGEX_INPUT) {
  if (typeof str !== 'string') return false;
  const truncated = truncate(str, maxLen);
  try {
    const re = safeRegex(pattern.source || pattern, pattern.flags);
    if (re) return re.test(truncated);
    const native = new RegExp(pattern.source || pattern, pattern.flags);
    return native.test(truncated);
  } catch {
    return false;
  }
}

function safeExec(pattern, str, maxLen = MAX_REGEX_INPUT) {
  if (typeof str !== 'string') return null;
  const truncated = truncate(str, maxLen);
  try {
    const re = safeRegex(pattern.source || pattern, pattern.flags);
    if (re) return re.exec(truncated);
    const native = new RegExp(pattern.source || pattern, pattern.flags);
    return native.exec(truncated);
  } catch {
    return null;
  }
}

function safeMatch(pattern, str, maxLen = MAX_REGEX_INPUT) {
  if (typeof str !== 'string') return null;
  const truncated = truncate(str, maxLen);
  try {
    const re = safeRegex(pattern.source || pattern, pattern.flags);
    if (re) return truncated.match(re);
    const native = new RegExp(pattern.source || pattern, pattern.flags);
    return truncated.match(native);
  } catch {
    return null;
  }
}

function safeMatchAll(pattern, str, maxLen = MAX_REGEX_INPUT) {
  if (typeof str !== 'string') return [];
  const truncated = truncate(str, maxLen);
  try {
    const re = safeRegex(pattern.source || pattern, pattern.flags);
    if (re) return Array.from(truncated.matchAll(re));
    const native = new RegExp(pattern.source || pattern, pattern.flags);
    return Array.from(truncated.matchAll(native));
  } catch {
    return [];
  }
}

function safeReplace(pattern, replacer, str, maxLen = MAX_REGEX_INPUT) {
  if (typeof str !== 'string') return '';
  const truncated = truncate(str, maxLen);
  try {
    const re = safeRegex(pattern.source || pattern, pattern.flags);
    if (re) return truncated.replace(re, replacer);
    const native = new RegExp(pattern.source || pattern, pattern.flags);
    return truncated.replace(native, replacer);
  } catch {
    return truncated;
  }
}

function safeSplit(pattern, str, maxLen = MAX_REGEX_INPUT) {
  if (typeof str !== 'string') return [str];
  const truncated = truncate(str, maxLen);
  try {
    if (typeof pattern === 'string') return truncated.split(pattern);
    const re = safeRegex(pattern.source || pattern, pattern.flags);
    if (re) return truncated.split(re);
    const native = new RegExp(pattern.source || pattern, pattern.flags);
    return truncated.split(native);
  } catch {
    return [truncated];
  }
}

module.exports = {
  safeRegex,
  safeTest,
  safeExec,
  safeMatch,
  safeMatchAll,
  safeReplace,
  safeSplit,
  MAX_REGEX_INPUT,
  MAX_NAMED_INPUT,
};
