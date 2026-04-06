import type { NextFunction, Request, Response } from "express";
import { maybeReset24h, stats } from "./stats";

export function trackStats(req: Request, _res: Response, next: NextFunction) {
  maybeReset24h();

  // Count every request (including 402 responses from x402 gate)
  stats.totalRequests++;
  stats.last24h.requests++;

  const ip =
    (req.headers["cf-connecting-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown";

  stats.uniqueIps.add(ip);

  next();
}
