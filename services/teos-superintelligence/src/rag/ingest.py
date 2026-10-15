"""
TEOS RAG Ingestion Pipeline
Scans a local filesystem for whitelisted TEOS repos, chunks documents,
deduplicates, and ingests into ChromaDB with metadata.
Only active (non-archived) repos are ingested.
"""
import os
import hashlib
import logging
from pathlib import Path

from src.rag.vector_store import VectorStore, chunk_document

logger = logging.getLogger(__name__)

WHITELISTED_REPOS = [
    r.strip()
    for r in os.environ.get(
        "TEOS_WHITELISTED_REPOS",
        "teos-platform,teos-sentinel-stack,Teos-Integration",
    ).split(",")
    if r.strip()
]

_DEFAULT_DEPRECATED = "teos-bankchain,UCH-Backend"
DEPRECATED_REPOS = [
    r.strip()
    for r in os.environ.get("TEOS_DEPRECATED_REPOS", _DEFAULT_DEPRECATED).split(",")
    if r.strip()
]

SKIP_DIRS = {
    ".git", "__pycache__", "node_modules", ".venv", "venv",
    "dist", "build", ".mypy_cache", ".pytest_cache", ".ruff_cache",
    "egg-info", ".tox", ".eggs",
}

SKIP_EXTENSIONS = {
    ".pyc", ".pyo", ".so", ".dll", ".exe", ".bin",
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
    ".mp3", ".mp4", ".wav", ".avi", ".mov",
    ".zip", ".tar", ".gz", ".bz2", ".7z", ".rar",
    ".woff", ".woff2", ".ttf", ".eot",
    ".sqlite", ".db", ".lock",
}


def _hash_content(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:16]


def _is_text_file(path: Path) -> bool:
    text_extensions = {
        ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rs",
        ".rb", ".php", ".cs", ".swift", ".kt",
        ".md", ".rst", ".txt",
        ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf",
        ".json", ".jsonl",
        ".html", ".htm", ".css", ".scss",
        ".sh", ".bash", ".zsh", ".fish", ".bat", ".cmd", ".ps1",
        ".sql", ".graphql", ".gql",
        ".env", ".env.example",
        ".dockerfile", ".dockerignore",
        ".gitignore", ".gitattributes",
        "Makefile", "Dockerfile", "docker-compose.yml",
        "README", "LICENSE", "CHANGELOG",
    }
    if path.suffix.lower() in text_extensions:
        return True
    if path.name in {
        "Makefile", "Dockerfile", "docker-compose.yml", "docker-compose.yaml",
        "requirements.txt", "setup.py", "setup.cfg", "pyproject.toml",
        "Cargo.toml", "go.mod", "Gemfile", "Package.json",
        ".gitignore", ".dockerignore", "README", "LICENSE",
    }:
        return True
    return False


def scan_repo(repo_dir: Path, whitelist: list[str] = None, deprecated: list[str] = None) -> dict:
    whitelist = whitelist or WHITELISTED_REPOS
    deprecated = deprecated or DEPRECATED_REPOS

    result = {
        "scanned_repos": [],
        "whitelisted": [],
        "deprecated_skipped": [],
        "not_whitelisted": [],
        "files_found": 0,
        "total_bytes": 0,
    }

    if not repo_dir.exists():
        logger.error("Repository directory does not exist: %s", repo_dir)
        return result

    for entry in sorted(repo_dir.iterdir()):
        if not entry.is_dir() or entry.name.startswith("."):
            continue

        repo_name = entry.name

        if repo_name in deprecated:
            result["deprecated_skipped"].append(repo_name)
            logger.info("Skipping deprecated repo: %s", repo_name)
            continue

        if repo_name not in whitelist:
            result["not_whitelisted"].append(repo_name)
            logger.debug("Repo not in whitelist, skipping: %s", repo_name)
            continue

        result["whitelisted"].append(repo_name)
        result["scanned_repos"].append(repo_name)

        for file_path in _walk_files(entry):
            result["files_found"] += 1
            try:
                result["total_bytes"] += file_path.stat().st_size
            except OSError:
                pass

    logger.info(
        "Scan complete: %d whitelisted repos, %d files, %d bytes",
        len(result["whitelisted"]),
        result["files_found"],
        result["total_bytes"],
    )
    return result


def _walk_files(directory: Path):
    for entry in directory.rglob("*"):
        if not entry.is_file():
            continue
        if any(part in SKIP_DIRS for part in entry.parts):
            continue
        if entry.suffix.lower() in SKIP_EXTENSIONS:
            continue
        if not _is_text_file(entry):
            continue
        try:
            if entry.stat().st_size > 1_000_000:
                continue
        except OSError:
            continue
        yield entry


def ingest_repo(
    repo_dir: Path,
    vector_store: VectorStore,
    repo_name: str,
    chunk_size: int = None,
    chunk_overlap: int = None,
) -> dict:
    from src.rag.vector_store import CHUNK_SIZE, CHUNK_OVERLAP
    chunk_size = chunk_size or CHUNK_SIZE
    chunk_overlap = chunk_overlap or CHUNK_OVERLAP

    result = {
        "repo": repo_name,
        "files_processed": 0,
        "chunks_created": 0,
        "chunks_ingested": 0,
        "errors": [],
    }

    repo_path = repo_dir / repo_name
    if not repo_path.exists():
        result["errors"].append(f"Repo directory not found: {repo_path}")
        return result

    all_chunks = []
    all_metas = []

    for file_path in _walk_files(repo_path):
        try:
            content = file_path.read_text(encoding="utf-8", errors="replace")
            if not content.strip():
                continue

            rel_path = file_path.relative_to(repo_path)
            chunks = chunk_document(content, chunk_size, chunk_overlap)

            for idx, chunk in enumerate(chunks):
                all_chunks.append(chunk)
                all_metas.append({
                    "repo": repo_name,
                    "filename": str(rel_path),
                    "chunk_index": idx,
                    "total_chunks": len(chunks),
                    "status": "active",
                })

            result["files_processed"] += 1
            result["chunks_created"] += len(chunks)

        except Exception as e:
            result["errors"].append(f"{file_path}: {e}")
            logger.warning("Failed to process %s: %s", file_path, e)

    if all_chunks:
        ingested_ids = vector_store.add_documents_deduped(all_chunks, all_metas)
        result["chunks_ingested"] = len(ingested_ids)

    logger.info(
        "Repo %s: %d files, %d chunks created, %d ingested",
        repo_name, result["files_processed"],
        result["chunks_created"], result["chunks_ingested"],
    )
    return result


def ingest_all(
    repo_dir: Path,
    vector_store: VectorStore = None,
    whitelist: list[str] = None,
    deprecated: list[str] = None,
) -> dict:
    vector_store = vector_store or VectorStore()

    scan = scan_repo(repo_dir, whitelist, deprecated)
    results = {"scan": scan, "repos": {}}

    for repo_name in scan["whitelisted"]:
        repo_result = ingest_repo(repo_dir, vector_store, repo_name)
        results["repos"][repo_name] = repo_result

    total_chunks = sum(r["chunks_ingested"] for r in results["repos"].values())
    total_files = sum(r["files_processed"] for r in results["repos"].values())
    total_errors = sum(len(r["errors"]) for r in results["repos"].values())

    results["summary"] = {
        "repos_ingested": len(scan["whitelisted"]),
        "repos_skipped_deprecated": len(scan["deprecated_skipped"]),
        "repos_skipped_not_whitelisted": len(scan["not_whitelisted"]),
        "total_files": total_files,
        "total_chunks_ingested": total_chunks,
        "total_errors": total_errors,
    }

    logger.info(
        "Ingestion complete: %d repos, %d files, %d chunks, %d errors",
        len(scan["whitelisted"]), total_files, total_chunks, total_errors,
    )
    return results


if __name__ == "__main__":
    import sys
    import json

    logging.basicConfig(level=logging.INFO)

    repo_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/repos")
    print(f"Scanning {repo_path}...")

    results = ingest_all(repo_path)
    print(json.dumps(results["summary"], indent=2))

    for repo_name, repo_result in results["repos"].items():
        if repo_result["errors"]:
            print(f"\n{repo_name} errors:")
            for err in repo_result["errors"]:
                print(f"  - {err}")
