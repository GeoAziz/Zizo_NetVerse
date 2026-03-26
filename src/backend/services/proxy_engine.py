# src/backend/services/proxy_engine.py

import asyncio
import logging
from typing import List, Dict, Any, Optional
import re
from mitmproxy import options, http
from mitmproxy.tools.dump import DumpMaster
from mitmproxy.addons import core
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class ProxyRule:
    """Represents a filtering rule for the proxy."""
    
    def __init__(
        self,
        rule_id: str,
        rule_type: str,  # block, allow, redirect, log
        pattern: str,
        domain: Optional[str] = None,
        ip: Optional[str] = None,
        action: str = "block"
    ):
        self.rule_id = rule_id
        self.rule_type = rule_type
        self.pattern = pattern
        self.domain = domain
        self.ip = ip
        self.action = action
        self.compiled_pattern = re.compile(pattern, re.IGNORECASE)
        self.match_count = 0
        self.created_at = datetime.now().isoformat()


class TrafficFilter:
    """Addon for mitmproxy to implement filtering rules."""
    
    def __init__(self, proxy_engine):
        self.proxy_engine = proxy_engine
        self.blocked_requests = []
        self.allowed_requests = []
        
    def request(self, flow: http.HTTPFlow) -> None:
        """Handle incoming HTTP requests."""
        try:
            request = flow.request
            host = request.host
            url = request.pretty_url
            
            # Check against rules
            for rule in self.proxy_engine.rules:
                if rule.compiled_pattern.search(url) or rule.compiled_pattern.search(host):
                    rule.match_count += 1
                    
                    if rule.action == "block":
                        # Block the request
                        flow.kill()  # Cancel the request
                        self.blocked_requests.append({
                            "timestamp": datetime.now().isoformat(),
                            "url": url,
                            "host": host,
                            "rule_id": rule.rule_id,
                            "method": request.method
                        })
                        logger.info(f"Blocked request: {url} by rule {rule.rule_id}")
                        break
                    
                    elif rule.action == "redirect":
                        # Redirect to another URL
                        logger.info(f"Redirecting {url} by rule {rule.rule_id}")
                        self.allowed_requests.append({
                            "timestamp": datetime.now().isoformat(),
                            "url": url,
                            "host": host,
                            "action": "redirect",
                            "rule_id": rule.rule_id
                        })
                        break
            
            if not flow.killed:
                # Request is allowed
                self.allowed_requests.append({
                    "timestamp": datetime.now().isoformat(),
                    "url": url,
                    "host": host,
                    "method": request.method
                })
                
        except Exception as e:
            logger.error(f"Error in traffic filter: {e}")
    
    def response(self, flow: http.HTTPFlow) -> None:
        """Handle HTTP responses."""
        try:
            # Log response details
            response = flow.response
            if response:
                logger.debug(f"Response from {flow.request.host}: {response.status_code}")
        except Exception as e:
            logger.error(f"Error in response handler: {e}")


class ProxyEngine:
    """Advanced proxy engine with filtering rules."""
    
    def __init__(self, listen_host: str = "0.0.0.0", listen_port: int = 8081):
        self.listen_host = listen_host
        self.listen_port = listen_port
        self.master: Optional[DumpMaster] = None
        self.rules: List[ProxyRule] = []
        self.traffic_filter: Optional[TrafficFilter] = None
        self.is_running = False
    
    def add_rule(
        self,
        rule_id: str,
        rule_type: str,
        pattern: str,
        action: str = "block",
        domain: Optional[str] = None,
        ip: Optional[str] = None
    ) -> ProxyRule:
        """Add a new filtering rule."""
        rule = ProxyRule(
            rule_id=rule_id,
            rule_type=rule_type,
            pattern=pattern,
            domain=domain,
            ip=ip,
            action=action
        )
        self.rules.append(rule)
        logger.info(f"Added rule: {rule_id} ({action} on {pattern})")
        return rule
    
    def remove_rule(self, rule_id: str) -> bool:
        """Remove a filtering rule."""
        initial_count = len(self.rules)
        self.rules = [r for r in self.rules if r.rule_id != rule_id]
        
        if len(self.rules) < initial_count:
            logger.info(f"Removed rule: {rule_id}")
            return True
        return False
    
    def get_rules(self) -> List[Dict[str, Any]]:
        """Get all active rules."""
        return [
            {
                "rule_id": r.rule_id,
                "rule_type": r.rule_type,
                "pattern": r.pattern,
                "action": r.action,
                "match_count": r.match_count,
                "created_at": r.created_at
            }
            for r in self.rules
        ]
    
    def get_blocked_requests(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recently blocked requests."""
        return self.traffic_filter.blocked_requests[-limit:] if self.traffic_filter else []
    
    def get_allowed_requests(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recently allowed requests."""
        return self.traffic_filter.allowed_requests[-limit:] if self.traffic_filter else []
    
    async def start(self) -> None:
        """Start the proxy server."""
        try:
            logger.info(f"Starting proxy on {self.listen_host}:{self.listen_port}")
            
            opts = options.Options(
                listen_host=self.listen_host,
                listen_port=self.listen_port,
            )
            
            self.master = DumpMaster(opts, with_termlog=False, with_dumper=False)
            self.master.addons.add(core.Core())
            
            # Add traffic filter addon
            self.traffic_filter = TrafficFilter(self)
            self.master.addons.add(self.traffic_filter)
            
            self.is_running = True
            logger.info("Proxy started successfully")
            
            # Run in thread to avoid blocking
            await asyncio.to_thread(self.master.run)
            
        except Exception as e:
            logger.error(f"Failed to start proxy: {e}")
            self.is_running = False
    
    async def shutdown(self) -> None:
        """Shutdown the proxy server."""
        try:
            if self.master:
                logger.info("Shutting down proxy")
                await asyncio.to_thread(self.master.shutdown)
                self.is_running = False
                logger.info("Proxy stopped")
        except Exception as e:
            logger.error(f"Error during proxy shutdown: {e}")


# Global instance
proxy_engine = ProxyEngine()
