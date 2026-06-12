/**
 * TEOS Policy Engine
 * Multi-repo label: teos-policy-engine
 *
 * Declarative security policy definitions for AST-based code analysis.
 * Defines blocked functions, dangerous modules, and forbidden patterns
 * that the AST engine uses to detect adversarial code.
 */

const BLOCKED_FUNCTIONS = [
  'exec',
  'execSync',
  'execFile',
  'execFileSync',
  'spawn',
  'spawnSync',
  'fork',
  'eval',
  'Function',
  'setTimeout',
  'setInterval',
  'child_process',
  'runInNewContext',
  'runInThisContext',
  'runInContext',
  'vm',
  'compileFunction',
  'Spawn',
  'Exec',
];

const BLOCKED_NEW_EXPRESSIONS = [
  'Worker',
  'ChildProcess',
  'Subprocess',
];

const DANGEROUS_MODULES = [
  /child_process/,
  /vm/,
  /cluster/,
  /worker_threads/,
];

const DANGEROUS_IMPORTS = [
  'child_process',
  'vm',
  'cluster',
  'worker_threads',
  'eval',
];

const BLOCKED_ASSIGNMENTS = [
  'process.env',
  '__proto__',
  'prototype',
];

const SEVERITY_MAP = {
  exec: 'critical',
  execSync: 'critical',
  execFile: 'critical',
  eval: 'critical',
  Function: 'critical',
  spawn: 'critical',
  spawnSync: 'critical',
  fork: 'high',
  child_process: 'critical',
  vm: 'high',
  Worker: 'high',
};

const REASON_MAP = {
  exec: 'Dynamic code execution via exec() — arbitrary command injection vector',
  execSync: 'Synchronous shell execution — blocks event loop, enables RCE',
  eval: 'Arbitrary code evaluation — allows injection of unverified code strings',
  Function: 'Dynamic function constructor — can execute arbitrary code',
  spawn: 'Subprocess spawn — potential unauthorized process execution',
  child_process: 'Node.js child_process module — direct system access',
  vm: 'VM module — sandbox escape risk in untrusted contexts',
  Worker: 'Web Worker creation — potential for lateral code execution',
};

function getPolicy() {
  return {
    blockedFunctions: BLOCKED_FUNCTIONS,
    blockedNewExpressions: BLOCKED_NEW_EXPRESSIONS,
    dangerousModules: DANGEROUS_MODULES,
    dangerousImports: DANGEROUS_IMPORTS,
    blockedAssignments: BLOCKED_ASSIGNMENTS,
  };
}

function getSeverity(name) {
  return SEVERITY_MAP[name] || 'high';
}

function getReason(name) {
  return REASON_MAP[name] || `Unauthorized function call: ${name}`;
}

module.exports = {
  getPolicy,
  getSeverity,
  getReason,
  BLOCKED_FUNCTIONS,
  BLOCKED_NEW_EXPRESSIONS,
  DANGEROUS_MODULES,
  DANGEROUS_IMPORTS,
  BLOCKED_ASSIGNMENTS,
};
