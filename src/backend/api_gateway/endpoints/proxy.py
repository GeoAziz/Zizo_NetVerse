from fastapi import APIRouter, HTTPException, Depends, Request
from services.proxy_engine import proxy_engine
from pydantic import BaseModel
from typing import Dict, List, Any
import asyncio
import time
from .auth import require_admin # Import the admin role dependency

router = APIRouter()

RATE_LIMIT = {}
def rate_limiter(request: Request):
    ip = request.client.host
    now = time.time()
    window = 10  # seconds
    max_requests = 5
    if ip not in RATE_LIMIT:
        RATE_LIMIT[ip] = []
    RATE_LIMIT[ip] = [t for t in RATE_LIMIT[ip] if now - t < window]
    if len(RATE_LIMIT[ip]) >= max_requests:
        raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")
    RATE_LIMIT[ip].append(now)


class ProxyRule(BaseModel):
    """Proxy rule model."""
    description: str
    action: str  # Block, Allow, Log, Rate Limit
    status: str  # Active, Inactive
    priority: int = 0
    conditions: Dict[str, Any] = {}


# In-memory proxy rules storage
PROXY_RULES: Dict[str, ProxyRule] = {
    "RULE-001": ProxyRule(
        description="Block known C&C server IPs (ThreatFeed-A)",
        action="Block",
        status="Active",
        priority=1
    ),
    "RULE-002": ProxyRule(
        description="Allow outbound HTTPS on port 443 for finance dept",
        action="Allow",
        status="Active",
        priority=2
    ),
    "RULE-003": ProxyRule(
        description="Log all DNS requests to *.internal.local (Audit)",
        action="Log",
        status="Inactive",
        priority=3
    ),
    "RULE-004": ProxyRule(
        description="Rate limit connections to /login endpoint",
        action="Rate Limit",
        status="Active",
        priority=4
    ),
}

PROXY_STATE = {
    "is_running": False,
    "started_at": None,
    "connections_processed": 0,
}


@router.post("/proxy/start", tags=["Proxy"], dependencies=[Depends(require_admin), Depends(rate_limiter)])
async def start_proxy():
    try:
        if PROXY_STATE["is_running"]:
            return {"status": "already_running", "message": "Proxy engine is already running"}
        
        PROXY_STATE["is_running"] = True
        PROXY_STATE["started_at"] = time.time()
        asyncio.create_task(proxy_engine.start())
        return {
            "status": "success",
            "message": "Proxy engine started"
        }
    except Exception as e:
        PROXY_STATE["is_running"] = False
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/proxy/stop", tags=["Proxy"], dependencies=[Depends(require_admin), Depends(rate_limiter)])
async def stop_proxy():
    try:
        if not PROXY_STATE["is_running"]:
            return {"status": "already_stopped", "message": "Proxy engine is not running"}
        
        PROXY_STATE["is_running"] = False
        await proxy_engine.shutdown()
        return {
            "status": "success",
            "message": "Proxy engine stopped"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/proxy/status", tags=["Proxy"])
async def get_proxy_status():
    """Get current proxy engine status."""
    try:
        uptime = None
        if PROXY_STATE["started_at"]:
            uptime = int(time.time() - PROXY_STATE["started_at"])
        
        return {
            "status": "active" if PROXY_STATE["is_running"] else "inactive",
            "running": PROXY_STATE["is_running"],
            "uptime_seconds": uptime,
            "connections_processed": PROXY_STATE["connections_processed"],
            "rules_active": sum(1 for r in PROXY_RULES.values() if r.status == "Active")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/proxy/rules", tags=["Proxy"])
async def get_proxy_rules():
    """Get all proxy rules."""
    try:
        rules = [
            {
                "id": rule_id,
                "description": rule.description,
                "action": rule.action,
                "status": rule.status,
                "priority": rule.priority
            }
            for rule_id, rule in PROXY_RULES.items()
        ]
        return {
            "status": "success",
            "rules": sorted(rules, key=lambda x: x["priority"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/proxy/rules", tags=["Proxy"], dependencies=[Depends(require_admin)])
async def add_proxy_rule(rule: ProxyRule):
    """Add a new proxy rule."""
    try:
        rule_id = f"RULE-{len(PROXY_RULES) + 1:03d}"
        PROXY_RULES[rule_id] = rule
        return {
            "status": "success",
            "id": rule_id,
            "rule": {
                "id": rule_id,
                "description": rule.description,
                "action": rule.action,
                "status": rule.status,
                "priority": rule.priority
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/proxy/rules/{rule_id}", tags=["Proxy"], dependencies=[Depends(require_admin)])
async def update_proxy_rule(rule_id: str, rule: ProxyRule):
    """Update an existing proxy rule."""
    try:
        if rule_id not in PROXY_RULES:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        PROXY_RULES[rule_id] = rule
        return {
            "status": "success",
            "id": rule_id,
            "rule": {
                "id": rule_id,
                "description": rule.description,
                "action": rule.action,
                "status": rule.status,
                "priority": rule.priority
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/proxy/rules/{rule_id}", tags=["Proxy"], dependencies=[Depends(require_admin)])
async def delete_proxy_rule(rule_id: str):
    """Delete a proxy rule."""
    try:
        if rule_id not in PROXY_RULES:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        del PROXY_RULES[rule_id]
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
