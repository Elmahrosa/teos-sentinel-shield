// ESLint flat config — pragmatic baseline for the TEOS Sentinel bot.
//
// Goal: catch real mistakes (undefined variables, unreachable code, dropped
// assignments, bad control flow) without drowning in stylistic debt from a
// large pre-existing codebase. High-signal rules stay as errors; noisy
// "code-smell" rules are kept as warnings so `npm run lint` stays green while
// still surfacing them.
const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "logs/**",
      "dist/**",
      "templates/**",
      "**/*.min.js",
    ],
  },

  js.configs.recommended,

  {
    // CommonJS source (the bulk of the project).
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: {
      // Pre-existing code has many unused vars / empty blocks. Surface them
      // without blocking CI.
      "no-unused-vars": [
        "warn",
        { args: "none", caughtErrors: "none", varsIgnorePattern: "^_" },
      ],
      "no-empty": ["warn", { allowEmptyCatch: true }],

      // Detector / security regexes intentionally use redundant escapes and
      // control characters. These are stylistic, not bugs, so keep them
      // visible as warnings instead of errors.
      "no-useless-escape": "warn",
      "no-control-regex": "warn",

      // Dead stores from older control flow; visible but not blocking.
      "no-useless-assignment": "warn",
    },
  },

  {
    // ESM modules and test files (vitest).
    files: [
      "**/*.mjs",
      "tests/**/*.js",
      "**/*.test.js",
      "**/*.spec.js",
      "vitest.config.*",
    ],
    languageOptions: {
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": "off",
    },
  },
];
