export type Last24hWindow = {
  requests: number;
  blocked: number;
  windowStart: string; // ISO string
};

export type StatsStore = {
  totalRequests: number;
  paidRequests: number;
  blockedDecisions: number;
  uniqueIps: Set<string>;
  last24h: Last24hWindow;
};

export const stats: StatsStore = {
  totalRequests: 0,
  paidRequests: 0,
  blockedDecisions: 0,
  uniqueIps: new Set<string>(),
  last24h: {
    requests: 0,
    blocked: 0,
    windowStart: new Date().toISOString(),
  },
};

export function maybeReset24h(): void {
  const now = Date.now();
  const start = Date.parse(stats.last24h.windowStart);
  const WINDOW_MS = 24 * 60 * 60 * 1000;

  if (Number.isFinite(start) && now - start < WINDOW_MS) return;

  stats.last24h = {
    requests: 0,
    blocked: 0,
    windowStart: new Date().toISOString(),
  };
}
