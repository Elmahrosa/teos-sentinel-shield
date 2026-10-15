"""
TEOS Sentinel Shield — Self-hosted Sidecar
27 deterministic safety rules. Fail-closed. No ML dependencies.
"""
import os
import re
import logging
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI
from pydantic import BaseModel

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
logger = logging.getLogger("sentinel")


class AnalyzeRequest(BaseModel):
    content: str
    user_id: Optional[str] = "system"


class AnalyzeResponse(BaseModel):
    action: str
    rule: Optional[str] = None
    message: Optional[str] = None


BLOCKED_PATTERNS = [
    (r"(?i)\b(malware|ransomware|trojan|virus|worm|backdoor|rootkit|keylogger)\b", "MALWARE_001"),
    (r"(?i)\b(sql\s*inject(?:ion)?|select\s+.*\s+from|union\s+select|drop\s+table)\b", "INJECTION_002"),
    (r"(?i)\b(xss|script\s*>|<script|cross.?site.?script)\b", "XSS_003"),
    (r"(?i)\b(rm\s+-rf|format\s+drive|dd\s+if=|mkfs\.|fdisk)\b", "DESTRUCTIVE_004"),
    (r"(?i)\b(password|passwd|secret|credential|api.?key|token|auth.?key)\s*[:=]\s*\S", "SECRET_005"),
    (r"(?i)\b(pwn|exploit|cve-\d{4}-\d{4,})\b", "EXPLOIT_006"),
    (r"(?i)\b(phishing|spear.?phish|whaling)\b", "PHISHING_007"),
    (r"(?i)(\bbomb\b|\bexplosive\b|\bweapon\b|\bwarfare\b|\bmilitary\s+attack\b)", "WEAPON_008"),
    (r"(?i)\b(dox|doxx|doxing|doxxing)\b", "DOX_009"),
    (r"(?i)\b(spoof|spoofing|spoofed)\b", "SPOOF_010"),
    (r"(?i)\b(botnet|c2\s+server|command.and.control)\b", "BOTNET_011"),
    (r"(?i)\b(tor\s+exit|dark.?web|darknet|onion\s+link)\b", "DARKNET_012"),
    (r"(?i)\b(how\s+to\s+hack|hacking\s+tutorial|learn\s+to\s+hack)\b", "HACK_TUT_013"),
    (r"(?i)\b(social\s+engineering|pretexting|tailgating|baiting)\b", "SOCIAL_ENG_014"),
    (r"(?i)\b(crack|keygen|warez|pirate|torrent|piracy)\b", "PIRACY_015"),
    (r"(?i)\b(terror|terrorism|terrorist|isis|extremist|radicalize)\b", "TERROR_016"),
    (r"(?i)\b(hate\s+speech|discriminat|racist|racial\s+slur)\b", "HATE_017"),
    (r"(?i)\b(self.?harm|suicide\s+method|commit\s+suicide|cutting)\b", "SELF_HARM_018"),
    (r"(?i)\b(child\s+abuse|child\s+porn|child\s+exploit)\b", "CHILD_019"),
    (r"(?i)\b(harass|stalk|cyber.?stalking|cyber.?bully)\b", "HARASS_020"),
    (r"(?i)\b(fraud|scam|money.?launder|ponzi|pyramid\s+schema)\b", "FRAUD_021"),
    (r"(?i)\b(deepfake|non.?consensual|revenge.?porn)\b", "DEEPFAKE_022"),
    (r"(?i)\b(insider\s+threat|data\s+exfiltrat|unauthorized\s+access)\b", "INSIDER_023"),
    (r"(?i)\b(ransom|pay\s+ransom|bitcoin\s+ransom|extort)\b", "RANSOM_024"),
    (r"(?i)\b(anonymiz|prox(y|ies)\s+chain|vpn\s+to\s+bypass)\b", "ANONYMIZE_025"),
    (r"(?i)\b(ddos|denial.?of.?service|flood\s+attack|syn\s+flood)\b", "DOS_026"),
    (r"(?i)\b(0day|zero.?day|unpatched\s+vuln|unknown\s+vuln)\b", "ZERODAY_027"),
]

WARN_PATTERNS = [
    (r"(?i)\b(vpn|proxy|tor|encrypt)\b", "WARN_VPN_001"),
    (r"(?i)\b(bypass|circumvent|evade)\b", "WARN_BYPASS_002"),
    (r"(?i)\b(anonym|pseudo|fake\s+identity)\b", "WARN_ANON_003"),
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Sentinel Shield sidecar online — 27 deterministic rules")
    yield
    logger.info("Sentinel Shield shutdown")


app = FastAPI(title="TEOS Sentinel Shield", version="1.0.0", lifespan=lifespan)


def _normalize(content: str) -> str:
    return re.sub(r"\s+", " ", content.strip())


def _check_patterns(content: str) -> tuple[Optional[str], Optional[str]]:
    for pattern, rule_id in BLOCKED_PATTERNS:
        if re.search(pattern, content):
            return "BLOCK", rule_id
    for pattern, rule_id in WARN_PATTERNS:
        if re.search(pattern, content):
            return "WARN", rule_id
    return None, None


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    normalized = _normalize(req.content)
    action, rule = _check_patterns(normalized)
    if action == "BLOCK":
        logger.warning("BLOCKED user=%s rule=%s", req.user_id, rule)
        return AnalyzeResponse(action="BLOCK", rule=rule, message=f"Blocked by rule {rule}")
    if action == "WARN":
        logger.info("WARN user=%s rule=%s", req.user_id, rule)
        return AnalyzeResponse(action="WARN", rule=rule, message="Content flagged for review")
    return AnalyzeResponse(action="ALLOW", message="Content OK")


@app.get("/health")
async def health():
    return {"status": "ok", "rules": len(BLOCKED_PATTERNS), "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
