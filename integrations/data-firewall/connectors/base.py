from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class FetchResult:
    url: str
    content: str
    status_code: int
    content_type: Optional[str]
    metadata: dict


class DataConnector(ABC):
    @abstractmethod
    async def validate_source(self, url: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    async def fetch(self, url: str, **kwargs) -> FetchResult:
        raise NotImplementedError

    @abstractmethod
    def get_capabilities(self) -> dict:
        raise NotImplementedError
