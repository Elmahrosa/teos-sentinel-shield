/**
 * TEOS AST CodeGuard Engine
 * Multi-repo label: teos-codeguard-engine
 *
 * Deterministic AST-based code analysis layer.
 * Parses agent script payloads structurally before rule validation
 * to prevent adversarial obfuscation attacks.
 */
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

/**
 * Parse code into AST using Babel parser.
 * Supports JSX, TypeScript, and ES modules.
 */
function parseCode(code) {
  try {
    return parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'optionalChaining', 'nullishCoalescingOperator'],
    });
  } catch (e) {
    return null;
  }
}

/**
 * Scan AST for policy violations using declarative rules.
 * Returns array of violations with type, name, severity, and location.
 */
function scanAST(ast, policy) {
  const violations = [];
  if (!ast || !policy) return violations;

  const visitedFunctions = new Set();

  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      let name = null;

      if (callee.type === 'Identifier') {
        name = callee.name;
      } else if (callee.type === 'MemberExpression') {
        name = extractMemberExpressionName(callee);
      }

      if (!name || visitedFunctions.has(name)) return;
      visitedFunctions.add(name);

      if (policy.blockedFunctions && policy.blockedFunctions.includes(name)) {
        violations.push({
          type: 'BLOCKED_FUNCTION',
          name,
          severity: 'critical',
          loc: path.node.loc ? {
            line: path.node.loc.start.line,
            column: path.node.loc.start.column,
          } : null,
        });
      }

      if (policy.dangerousImports) {
        checkImportDanger(path, policy.dangerousImports, violations);
      }
    },

    NewExpression(path) {
      const callee = path.node.callee;
      if (callee.type === 'Identifier' && policy.blockedNewExpressions) {
        if (policy.blockedNewExpressions.includes(callee.name)) {
          violations.push({
            type: 'BLOCKED_NEW_EXPRESSION',
            name: callee.name,
            severity: 'high',
            loc: path.node.loc ? {
              line: path.node.loc.start.line,
              column: path.node.loc.start.column,
            } : null,
          });
        }
      }
    },

    ImportDeclaration(path) {
      const source = path.node.source.value;
      if (policy.dangerousModules) {
        for (const dm of policy.dangerousModules) {
          if (source.includes(dm) || dm.test(source)) {
            violations.push({
              type: 'DANGEROUS_IMPORT',
              name: source,
              severity: 'high',
              loc: path.node.loc ? {
                line: path.node.loc.start.line,
                column: path.node.loc.start.column,
              } : null,
            });
          }
        }
      }
    },

    AssignmentExpression(path) {
      if (policy.blockedAssignments) {
        const lhs = extractAssignmentTarget(path.node.left);
        if (lhs && policy.blockedAssignments.some(p => lhs.includes(p))) {
          violations.push({
            type: 'BLOCKED_ASSIGNMENT',
            name: lhs,
            severity: 'high',
            loc: path.node.loc ? {
              line: path.node.loc.start.line,
              column: path.node.loc.start.column,
            } : null,
          });
        }
      }
    },
  });

  return violations;
}

function extractMemberExpressionName(expr) {
  const parts = [];
  let current = expr;
  while (current.type === 'MemberExpression') {
    if (current.property.type === 'Identifier') {
      parts.unshift(current.property.name);
    } else if (current.property.type === 'StringLiteral') {
      parts.unshift(current.property.value);
    }
    current = current.object;
  }
  if (current.type === 'Identifier') {
    parts.unshift(current.name);
  }
  return parts.join('.');
}

function extractAssignmentTarget(node) {
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'MemberExpression') return extractMemberExpressionName(node);
  return null;
}

function checkImportDanger(path, dangerousImports, violations) {
  if (path.node.callee.type !== 'Identifier') return;
  if (path.node.callee.name !== 'require') return;
  const arg = path.node.arguments[0];
  if (arg && arg.type === 'StringLiteral') {
    for (const di of dangerousImports) {
      if (arg.value.includes(di)) {
        violations.push({
          type: 'DANGEROUS_REQUIRE',
          name: arg.value,
          severity: 'high',
          loc: path.node.loc ? {
            line: path.node.loc.start.line,
            column: path.node.loc.start.column,
          } : null,
        });
      }
    }
  }
}

/**
 * Compute verdict from AST violations.
 * Returns { verdict: 'block'|'warn'|'allow', score: number, reasons: string[] }
 */
function computeVerdict(violations) {
  if (!violations || violations.length === 0) {
    return { verdict: 'allow', score: 0, reasons: ['No AST violations detected'] };
  }

  const criticalCount = violations.filter(v => v.severity === 'critical').length;
  const highCount = violations.filter(v => v.severity === 'high').length;
  const mediumCount = violations.filter(v => v.severity === 'medium').length;

  let score = 0;
  let verdict = 'allow';
  const reasons = violations.map(v => {
    const loc = v.loc ? ` (line ${v.loc.line})` : '';
    return `${v.type}: ${v.name}${loc}`;
  });

  if (criticalCount > 0) {
    verdict = 'block';
    score = Math.min(100, 80 + criticalCount * 10);
  } else if (highCount > 0) {
    verdict = 'warn';
    score = Math.min(80, 50 + highCount * 10);
  } else if (mediumCount > 0) {
    verdict = 'warn';
    score = Math.min(50, 20 + mediumCount * 10);
  }

  return { verdict, score, reasons };
}

/**
 * Full pipeline: parse → scan → verdict.
 * Returns null if code is not parseable JS/TS.
 */
function analyzeCode(code, policy) {
  if (!code || typeof code !== 'string') return null;
  const ast = parseCode(code);
  if (!ast) return null;
  const violations = scanAST(ast, policy);
  return { ast, violations, verdict: computeVerdict(violations) };
}

module.exports = {
  parseCode,
  scanAST,
  computeVerdict,
  analyzeCode,
};
