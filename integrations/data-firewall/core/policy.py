# core/policy.py

from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse
import urllib.robotparser

import redis
import yaml

from core.config import get_settings
from core.logging import logger

settings = get_settings()

RULES_PATH = Path(__file__).parent.parent / "policies" / "rules.yaml"


def _load_rules() -> dict:
    if RULES_PATH.exists():
        with open(RULES_PATH) as f:
            return yaml.safe_load(f) or {}
    return {"default": "allow", "domains": []}


class CrawlBudgetService:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.ttl_seconds = 86400

    def check_and_increment(self, domain: str, limit: int) -> bool:
        key = f"crawl:{domain}"
        with self.redis.pipeline() as pipe:
            while True:
                try:
                    pipe.watch(key)
                    current = pipe.get(key)
                    current_count = int(current) if current else 0
                    if current_count >= limit:
                        pipe.unwatch()
                        return False
                    pipe.multi()
                    pipe.incr(key, 1)
                    if current_count == 0:
                        pipe.expire(key, self.ttl_seconds)
                    pipe.execute()
                    return True
                except redis.WatchError:
                    continue

    def get_count(self, domain: str) -> int:
        val = self.redis.get(f"crawl:{domain}")
        return int(val) if val else 0


class DomainConcurrencyService:
    """
    Atomic domain concurrency control using Redis Lua scripting.
    Prevents race conditions under concurrent worker load.
    """
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.KEY_PREFIX = "concurrency:domain:"
        self.TTL = 60  # seconds

    def acquire(self, domain: str, max_concurrent: int) -> bool:
        """Atomic check-and-increment using Redis Lua script"""
        key = f"{self.KEY_PREFIX}{domain}"
        
        lua_script = """
        local current = tonumber(redis.call('GET', KEYS[1]) or "0")
        local max = tonumber(ARGV[1])
        local ttl = tonumber(ARGV[2])
        
        if current < max then
            redis.call('INCR', KEYS[1])
            redis.call('EXPIRE', KEYS[1], ttl)
            return 1
        else
            return 0
        end
        """
        
        try:
            result = self.redis.eval(lua_script, 1, key, max_concurrent, self.TTL)
            return result == 1
        except Exception as e:
            # Fail closed on Redis error for safety
            logger.error("concurrency.acquire_error", domain=domain, error=str(e))
            return False

    def release(self, domain: str) -> None:
        """Atomic decrement with error handling"""
        key = f"{self.KEY_PREFIX}{domain}"
        try:
            self.redis.decr(key)
        except Exception as e:
            logger.warning("concurrency.release_error", domain=domain, error=str(e))


class PolicyEngine:
    def __init__(self, redis_client: redis.Redis):
        self.crawl_budget = CrawlBudgetService(redis_client)
        self.concurrency = DomainConcurrencyService(redis_client)
        self._rules = _load_rules()

    def _get_domain_rule(self, domain: str) -> dict | None:
        for rule in self._rules.get("domains", []):
            if rule.get("domain") == domain:
                return rule
        return None

    def evaluate(self, url: str) -> tuple[bool, str]:
        """
        Returns (allowed, reason).
        Checks YAML rules first, then robots.txt, then crawl budget.
        """
        parsed = urlparse(url)
        domain = parsed.netloc

        # 1. YAML domain rules
        rule = self._get_domain_rule(domain)
        if rule is not None:
            if not rule.get("allow", True):
                reason = rule.get("reason", "domain blocked by policy")
                logger.warning("policy.yaml_blocked", url=url, domain=domain,
                               reason=reason, security_event=True)
                return False, reason

            # Check blocked paths
            for blocked_path in rule.get("blocked_paths", []):
                if parsed.path.startswith(blocked_path):
                    logger.warning("policy.path_blocked", url=url, domain=domain,
                                   path=parsed.path, security_event=True)
                    return False, f"path blocked by policy: {blocked_path}"

            # Crawl budget
            budget = rule.get("crawl_budget", 1000)
            if not self.crawl_budget.check_and_increment(domain, budget):
                logger.warning("policy.budget_exceeded", url=url, domain=domain,
                               security_event=True)
                return False, "crawl budget exceeded"

            # Domain concurrency (ATOMIC)
            max_concurrent = rule.get("max_concurrent", 2)
            if not self.concurrency.acquire(domain, max_concurrent):
                return False, "domain concurrency limit reached"

        else:
            # Default policy
            default = self._rules.get("default", "allow")
            if default == "deny":
                return False, "domain not in allowlist"

            # Default budget
            if not self.crawl_budget.check_and_increment(domain, 1000):
                return False, "crawl budget exceeded"

        # 2. robots.txt
        if not self.check_robots(url):
            return False, "robots.txt denied"

        return True, "allowed"

    def check_robots(self, url: str, user_agent: str = "*") -> bool:
        parsed = urlparse(url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
        parser = urllib.robotparser.RobotFileParser()
        parser.set_url(robots_url)
        try:
            parser.read()
            return parser.can_fetch(user_agent, url)
        except Exception as exc:
            logger.warning("robots.check_failed", url=url, error=str(exc),
                           security_event=True)
            return settings.robots_error_mode == "allow"

    def check_budget(self, url: str, limit: int = 1000) -> bool:
        parsed = urlparse(url)
        return self.crawl_budget.check_and_increment(parsed.netloc, limit)
