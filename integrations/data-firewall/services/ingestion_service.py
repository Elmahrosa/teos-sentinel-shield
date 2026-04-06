from __future__ import annotations

from connectors.base import DataConnector
from core.logging import logger
from core.pii import PIIScrubResult, scrub_text
from core.policy import PolicyEngine


class IngestionService:
    def __init__(self, connector: DataConnector, policy_engine: PolicyEngine):
        self.connector = connector
        self.policy = policy_engine

    async def ingest(self, url: str) -> tuple[str, int]:
        if not self.policy.check_robots(url):
            raise PermissionError("robots policy denied")
        if not self.policy.check_budget(url):
            raise PermissionError("crawl budget exceeded")
        result = await self.connector.fetch(url)
        pii_result: PIIScrubResult = scrub_text(result.content)
        logger.info(
            "ingestion.completed",
            url=url,
            status_code=result.status_code,
            pii_count=pii_result.count,
        )
        return pii_result.text, pii_result.count
