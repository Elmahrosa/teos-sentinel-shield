"""
TEOS Genesis Sync — Remote Knowledge Ingestion
Fetches READMEs and architecture docs from active Elmahrosa GitHub repos,
chunks and embeds them into the production ChromaDB vector store.
Strictly ignores all deprecated repos mapped in config.
"""
import os
import sys
import json
import logging
import hashlib
from pathlib import Path

import httpx

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("genesis_sync")

GITHUB_API = "https://api.github.com"
GITHUB_ORG = "Elmahrosa"
GITHUB_PAT = os.environ.get("GITHUB_PAT", "")

DEPRECATED_REPOS = [
    r.strip()
    for r in os.environ.get(
        "DEPRECATED_REPOS",
        "UnityCare,ConSensus-Elmahrosa-Alexandria-Prep,safe-ingestion-engine,"
        "teos-platform,x-teos-pro,teos-sentinel-stack,uch-sovereign-core,"
        "Unity-Care-Hospital-Sovereign,salma-unity-care-hospital,UCH-Buyer-Kit,"
        "UCH-Backend,U_C_H2,teos-ai-platform,Teos-Pharaoh-Portal,"
        "TEOS-Identity-Insight-AI,TEOS-Governance,TEOS-Egypt-SovereignStack-2026,"
        "TEOS-API-Sovereign,Teos-Sovereign-System,Elmahrosa-Core,demo-repository,"
        "TeosPitaxi,TeosEgypt-DomainPlatform,TeosEgypt-AI-Travel-OS,"
        "Teos-Sat-Sovereign-System,TEOS-NFT-AI-Generator,Teos-Integration,"
        "Teos-Gold-Reserve,TEOS-Global-Civic-Blockchain-Ecosystem,"
        "Teos-Bankchain-Mobile,teos-bankchain,teos-app-studio,Nilex,"
        "Mine_alltokens,hk-consensus-2026-teos,ERT-LAUNCH,ElMahrosa-Pi-Smart-City,"
        "Elmahrosa-Map-of-PI,Elmahrosa-Blockchain,TEOS-Token-SPL,elmahrosa-website,"
        "FPBE-First-Pimisr-Bank,teos-ecosystem-mining,teos-ecosystem-events,"
        "teos-github-pages-site,teos-nexus,teos-ecosystem-nft-marketplace",
    )
    if r.strip()
]

DOC_FILENAMES = [
    "README.md",
    "README.rst",
    "README.txt",
    "ARCHITECTURE.md",
    "DESIGN.md",
    "CONTRIBUTING.md",
    "docs/architecture.md",
    "docs/overview.md",
]


def _headers() -> dict:
    h = {"Accept": "application/vnd.github+json"}
    if GITHUB_PAT:
        h["Authorization"] = f"Bearer {GITHUB_PAT}"
    return h


def fetch_active_repos() -> list[dict]:
    repos = []
    page = 1
    while True:
        url = f"{GITHUB_API}/orgs/{GITHUB_ORG}/repos?per_page=100&page={page}&type=all"
        resp = httpx.get(url, headers=_headers(), timeout=30)
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        repos.extend(batch)
        page += 1
    logger.info("Fetched %d repos from GitHub", len(repos))
    return repos


def filter_active(repos: list[dict]) -> list[str]:
    active = []
    skipped_deprecated = 0
    skipped_archived = 0
    for repo in repos:
        name = repo["name"]
        if name in DEPRECATED_REPOS:
            skipped_deprecated += 1
            continue
        if repo.get("archived", False):
            skipped_archived += 1
            continue
        active.append(name)
    logger.info(
        "Active repos: %d | deprecated skipped: %d | archived skipped: %d",
        len(active), skipped_deprecated, skipped_archived,
    )
    return active


def fetch_file_content(repo_name: str, file_path: str) -> str | None:
    url = f"{GITHUB_API}/repos/{GITHUB_ORG}/{repo_name}/contents/{file_path}"
    resp = httpx.get(url, headers=_headers(), timeout=15)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    data = resp.json()
    if data.get("encoding") == "base64":
        import base64
        return base64.b64decode(data["content"]).decode("utf-8", errors="replace")
    return None


def fetch_repo_docs(repo_name: str) -> list[dict]:
    docs = []
    for filename in DOC_FILENAMES:
        content = fetch_file_content(repo_name, filename)
        if content and content.strip():
            docs.append({
                "repo": repo_name,
                "filename": filename,
                "content": content,
            })
            logger.debug("Fetched %s/%s (%d bytes)", repo_name, filename, len(content))
    return docs


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
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


def hash_content(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:16]


def ingest_to_vectordb(
    vector_store,
    all_docs: list[dict],
) -> dict:
    all_chunks = []
    all_metas = []
    all_ids = []
    seen_ids = set()

    for doc in all_docs:
        chunks = chunk_text(doc["content"])
        for idx, chunk in enumerate(chunks):
            doc_id = hash_content(chunk)
            if doc_id in seen_ids:
                continue
            seen_ids.add(doc_id)
            all_chunks.append(chunk)
            all_metas.append({
                "repo": doc["repo"],
                "filename": doc["filename"],
                "chunk_index": idx,
                "total_chunks": len(chunks),
                "source": "genesis_sync",
                "status": "active",
            })
            all_ids.append(doc_id)

    if all_chunks:
        existing = 0
        new_chunks, new_metas, new_ids = [], [], []
        for chunk, meta, doc_id in zip(all_chunks, all_metas, all_ids):
            if vector_store.exists(doc_id):
                existing += 1
            else:
                new_chunks.append(chunk)
                new_metas.append(meta)
                new_ids.append(doc_id)

        if new_chunks:
            vector_store.add_documents(new_chunks, new_metas, new_ids)

        return {
            "total_chunks_scanned": len(all_chunks),
            "duplicates_skipped": existing,
            "new_chunks_ingested": len(new_chunks),
        }

    return {
        "total_chunks_scanned": 0,
        "duplicates_skipped": 0,
        "new_chunks_ingested": 0,
    }


def main():
    logger.info("=== TEOS Genesis Sync Starting ===")

    if not GITHUB_PAT:
        logger.error("GITHUB_PAT not set. Cannot authenticate to GitHub API.")
        sys.exit(1)

    logger.info("Step 1/5: Fetching repos from GitHub org '%s'...", GITHUB_ORG)
    repos = fetch_active_repos()

    logger.info("Step 2/5: Filtering active (non-deprecated, non-archived) repos...")
    active_names = filter_active(repos)

    logger.info("Step 3/5: Fetching docs from %d active repos...", len(active_names))
    all_docs = []
    errors = []
    for name in active_names:
        try:
            docs = fetch_repo_docs(name)
            all_docs.extend(docs)
        except Exception as e:
            errors.append(f"{name}: {e}")
            logger.warning("Failed to fetch docs for %s: %s", name, e)

    logger.info(
        "Fetched %d documents from %d repos (%d errors)",
        len(all_docs), len(active_names), len(errors),
    )

    logger.info("Step 4/5: Connecting to ChromaDB...")
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from src.rag.vector_store import VectorStore
    import chromadb
    from chromadb.config import Settings

    vector_store = VectorStore()
    chroma_host = os.environ.get("CHROMA_HOST", "")
    chroma_port = os.environ.get("CHROMA_PORT", "8000")
    if chroma_host:
        logger.info("Connecting to remote ChromaDB at %s:%s", chroma_host, chroma_port)
        vector_store._client = chromadb.HttpClient(
            host=chroma_host,
            port=int(chroma_port),
            settings=Settings(anonymized_telemetry=False),
        )
        vector_store._collection = vector_store._client.get_or_create_collection(
            name="teos_rag",
            metadata={"hnsw:space": "cosine"},
        )
    else:
        vector_store.connect()
    logger.info("ChromaDB connected. Current doc count: %d", vector_store.count())

    logger.info("Step 5/5: Ingesting into ChromaDB...")
    result = ingest_to_vectordb(vector_store, all_docs)

    summary = {
        "repos_fetched": len(repos),
        "active_repos": len(active_names),
        "docs_fetched": len(all_docs),
        "docs_with_errors": len(errors),
        "ingestion": result,
        "total_docs_in_store": vector_store.count(),
        "errors": errors[:20],
    }

    logger.info("=== Genesis Sync Complete ===")
    print(json.dumps(summary, indent=2))
    return summary


if __name__ == "__main__":
    main()
