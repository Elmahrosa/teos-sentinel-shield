"""
TEOS Vector Store — ChromaDB-based RAG
Stores document chunks with embeddings, retrieves relevant context.
Supports chunking, deduplication, and filtered batch ingestion.
Mandatory metadata filtering: only documents with status=active are returned.
"""
import os
import hashlib
import logging
from typing import Optional

import chromadb
from chromadb.config import Settings

logger = logging.getLogger(__name__)

CHROMA_PATH = os.environ.get("CHROMA_PATH", "/data/chroma")
COLLECTION_NAME = "teos_rag"
CHUNK_SIZE = int(os.environ.get("CHUNK_SIZE", "500"))
CHUNK_OVERLAP = int(os.environ.get("CHUNK_OVERLAP", "50"))

ACTIVE_FILTER = {"status": "active"}


def chunk_document(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    words = text.split()
    if len(words) <= chunk_size:
        return [text] if text.strip() else []
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start = end - overlap
        if start >= len(words):
            break
    return chunks


class VectorStore:
    def __init__(self):
        self._client: Optional[chromadb.Client] = None
        self._collection = None

    def connect(self) -> None:
        if self._client is None:
            self._client = chromadb.PersistentClient(
                path=CHROMA_PATH,
                settings=Settings(anonymized_telemetry=False),
            )
            self._collection = self._client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
            logger.info("Vector store connected at %s", CHROMA_PATH)

    def exists(self, doc_id: str) -> bool:
        self.connect()
        try:
            result = self._collection.get(ids=[doc_id])
            return len(result["ids"]) > 0
        except Exception:
            return False

    def add_document(
        self,
        content: str,
        metadata: dict | None = None,
        doc_id: str | None = None,
    ) -> str:
        self.connect()
        doc_id = doc_id or hashlib.sha256(content.encode()).hexdigest()[:16]
        meta = dict(metadata or {})
        meta.setdefault("status", "active")
        self._collection.add(
            documents=[content],
            metadatas=[meta],
            ids=[doc_id],
        )
        logger.debug("Added document %s to vector store", doc_id)
        return doc_id

    def add_documents(
        self,
        documents: list[str],
        metadatas: list[dict] | None = None,
        ids: list[str] | None = None,
    ) -> list[str]:
        self.connect()
        if metadatas is None:
            metadatas = [{} for _ in documents]
        for m in metadatas:
            m.setdefault("status", "active")
        if ids is None:
            ids = [hashlib.sha256(d.encode()).hexdigest()[:16] for d in documents]
        self._collection.add(documents=documents, metadatas=metadatas, ids=ids)
        return ids

    def add_documents_deduped(
        self,
        documents: list[str],
        metadatas: list[dict] | None = None,
    ) -> list[str]:
        self.connect()
        if metadatas is None:
            metadatas = [{} for _ in documents]
        for m in metadatas:
            m.setdefault("status", "active")

        ids = [hashlib.sha256(d.encode()).hexdigest()[:16] for d in documents]

        new_docs, new_metas, new_ids = [], [], []
        skipped = 0
        for doc, meta, doc_id in zip(documents, metadatas, ids):
            if not self.exists(doc_id):
                new_docs.append(doc)
                new_metas.append(meta)
                new_ids.append(doc_id)
            else:
                skipped += 1

        if new_docs:
            self._collection.add(documents=new_docs, metadatas=new_metas, ids=new_ids)

        if skipped:
            logger.info("Dedup: skipped %d existing chunks, added %d new", skipped, len(new_docs))

        return new_ids

    def search(self, query: str, n_results: int = 5) -> list[dict]:
        self.connect()
        results = self._collection.query(
            query_texts=[query],
            n_results=n_results,
            where=ACTIVE_FILTER,
        )
        docs = []
        if results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                docs.append({
                    "content": doc,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else 0.0,
                })
        return docs

    def delete_document(self, doc_id: str) -> None:
        self.connect()
        self._collection.delete(ids=[doc_id])

    def count(self) -> int:
        self.connect()
        return self._collection.count()
