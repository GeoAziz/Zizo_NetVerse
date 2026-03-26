# src/backend/api_gateway/endpoints/ai_analysis_updated.py
"""
Updated AI Analysis endpoints with support for both in-memory and Firestore incident storage.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import json
import os

logger = logging.getLogger(__name__)

router = APIRouter()


class ThreatIndicator(BaseModel):
    """Model for threat indicators in incident analysis."""
    indicator_type: str  # ip, domain, hash, url, etc.
    value: str
    severity: str  # low, medium, high, critical
    confidence: float = Field(..., ge=0.0, le=1.0)
    source: Optional[str] = None


class IncidentReport(BaseModel):
    """Schema for incident report generation."""
    incident_id: str = Field(..., description="Unique incident identifier")
    title: str = Field(..., description="Incident title/summary")
    description: str = Field(..., description="Detailed incident description")
    severity: str = Field(..., description="Incident severity")
    
    @validator("severity")
    def validate_severity(cls, v):
        allowed = ["low", "medium", "high", "critical"]
        if v not in allowed:
            raise ValueError(f"Severity must be one of {allowed}")
        return v
    
    incident_type: str = Field(..., description="Type of incident")
    timestamp: datetime = Field(default_factory=datetime.now)
    affected_assets: List[str] = Field(default=[], description="IPs, devices affected")
    threat_indicators: List[ThreatIndicator] = Field(default=[])
    
    # AI-generated recommendations
    recommendations: List[str] = Field(default=[])
    immediate_actions: List[str] = Field(default=[])
    long_term_actions: List[str] = Field(default=[])
    
    # Detection details
    detection_method: str = Field(default="", description="How the incident was detected")
    confidence_score: float = Field(default=0.95, ge=0.0, le=1.0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "incident_id": "INC-2026-001",
                "title": "Unusual External Connection Attempt",
                "description": "System detected multiple failed SSH attempts from suspicious IP",
                "severity": "high",
                "incident_type": "brute-force-attack",
                "affected_assets": ["192.168.1.100"],
                "threat_indicators": [
                    {
                        "indicator_type": "ip",
                        "value": "203.0.113.45",
                        "severity": "high",
                        "confidence": 0.95,
                        "source": "threat-intel-feed"
                    }
                ],
                "recommendations": [
                    "Block IP 203.0.113.45 at firewall",
                    "Review SSH logs for intrusion attempts",
                    "Enable MFA on all accounts"
                ],
                "immediate_actions": [
                    "Block suspicious IP address",
                    "Isolate affected system if critical services"
                ],
                "long_term_actions": [
                    "Implement rate limiting on SSH port",
                    "Deploy honeypot systems"
                ],
                "detection_method": "IDS signature match + behavioral analysis",
                "confidence_score": 0.95
            }
        }


class PacketAnalysisRequest(BaseModel):
    """Request model for packet analysis."""
    packet_data: Dict[str, Any] = Field(..., description="Raw packet information")
    include_threat_analysis: bool = Field(default=True)
    include_recommendations: bool = Field(default=True)


class IncidentResponseReport(BaseModel):
    """Response model for incident reports."""
    status: str
    incident_id: str
    generated_at: datetime
    report_content: IncidentReport


# ==================== Incident Store Factory ====================

class IncidentStoreFactory:
    """Factory for creating the appropriate incident store."""
    
    _instance = None
    
    @staticmethod
    def get_incident_store():
        """
        Get or create the singleton incident store.
        Uses Firestore if FIRESTORE_PROJECT_ID env var is set, otherwise uses in-memory store.
        """
        if IncidentStoreFactory._instance is None:
            use_firestore = os.getenv("USE_FIRESTORE", "false").lower() == "true"
            
            if use_firestore:
                try:
                    from services.incident_store_firestore import FirestoreIncidentStore
                    store = FirestoreIncidentStore()
                    logger.info("Initialized Firestore incident store")
                except Exception as e:
                    logger.warning(f"Failed to initialize Firestore store, falling back to in-memory: {e}")
                    store = InMemoryIncidentStore()
            else:
                store = InMemoryIncidentStore()
                logger.info("Initialized in-memory incident store")
            
            IncidentStoreFactory._instance = store
        
        return IncidentStoreFactory._instance
    
    @staticmethod
    def reset():
        """Reset the singleton instance (useful for testing)."""
        IncidentStoreFactory._instance = None


# ==================== In-Memory Store (Legacy) ====================

class InMemoryIncidentStore:
    """In-memory incident storage (backward compatible)."""
    
    def __init__(self):
        self.incidents: Dict[str, IncidentReport] = {}
    
    def save_incident(self, report: IncidentReport) -> bool:
        """Save incident report."""
        try:
            self.incidents[report.incident_id] = report
            logger.info(f"Incident saved in-memory: {report.incident_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to save incident: {e}")
            return False
    
    def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve incident report."""
        report = self.incidents.get(incident_id)
        if report:
            return report.dict() if hasattr(report, 'dict') else report
        return None
    
    def list_incidents(self, severity_filter: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """List all incidents, optionally filtered by severity."""
        incidents = list(self.incidents.values())
        
        if severity_filter:
            incidents = [i for i in incidents if i.severity == severity_filter]
        
        # Sort by timestamp descending
        incidents.sort(key=lambda x: x.timestamp, reverse=True)
        
        result = []
        for i in incidents[:limit]:
            result.append(i.dict() if hasattr(i, 'dict') else i)
        return result
    
    def delete_incident(self, incident_id: str) -> bool:
        """Delete an incident."""
        if incident_id in self.incidents:
            del self.incidents[incident_id]
            logger.info(f"Incident deleted: {incident_id}")
            return True
        return False


# Initialize the incident store
incident_store = IncidentStoreFactory.get_incident_store()


# ==================== API Endpoints ====================

@router.post(
    "/ai-analysis/incident-report",
    response_model=IncidentResponseReport,
    tags=["AI Analysis"]
)
async def generate_incident_report(
    report: IncidentReport
) -> IncidentResponseReport:
    """
    Generate and store an AI-assisted incident report.
    
    **Features:**
    - Validates incident data schema
    - Stores incident for future reference (persistent)
    - Returns structured incident report
    
    **Storage:**
    - Firestore (if USE_FIRESTORE=true) for production
    - In-memory (default) for development
    
    **Example:**
    ```json
    {
        "incident_id": "INC-2026-001",
        "title": "Brute Force Attack Detected",
        "description": "Multiple SSH login attempts from external IP",
        "severity": "high",
        "incident_type": "brute-force-attack",
        "affected_assets": ["192.168.1.100"],
        "recommendations": ["Block IP at firewall"],
        "detection_method": "IDS alert"
    }
    ```
    """
    try:
        # Validate threat indicators
        if report.threat_indicators:
            for indicator in report.threat_indicators:
                if not (0.0 <= indicator.confidence <= 1.0):
                    raise ValueError(f"Invalid confidence score: {indicator.confidence}")
        
        # Store the incident
        if not incident_store.save_incident(report):
            raise HTTPException(status_code=500, detail="Failed to save incident")
        
        response = IncidentResponseReport(
            status="success",
            incident_id=report.incident_id,
            generated_at=datetime.now(),
            report_content=report
        )
        
        logger.info(f"Incident report generated: {report.incident_id}")
        return response
        
    except ValueError as ve:
        logger.warning(f"Validation error: {ve}")
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error(f"Error generating incident report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/ai-analysis/analyze-packet",
    tags=["AI Analysis"]
)
async def analyze_packet(
    request: PacketAnalysisRequest
) -> Dict[str, Any]:
    """
    Analyze a network packet for threat indicators and generate recommendations.
    
    **Returns:**
    - Threat analysis results
    - Recommendations for mitigation
    - Incident correlation if applicable
    """
    try:
        packet = request.packet_data
        analysis_result = {
            "status": "analyzed",
            "packet_summary": {
                "protocol": packet.get("protocol"),
                "source": f"{packet.get('source_ip')}:{packet.get('source_port')}",
                "destination": f"{packet.get('dest_ip')}:{packet.get('dest_port')}",
                "length": packet.get("length")
            },
            "threat_analysis": {}
        }
        
        # Enhanced threat detection
        if request.include_threat_analysis:
            analysis_result["threat_analysis"] = _analyze_threats(packet)
        
        # Generate recommendations
        if request.include_recommendations:
            analysis_result["recommendations"] = _generate_recommendations(packet, analysis_result["threat_analysis"])
        
        logger.info(f"Packet analyzed: {packet.get('protocol')} from {packet.get('source_ip')}")
        return analysis_result
        
    except Exception as e:
        logger.error(f"Error analyzing packet: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/ai-analysis/incidents",
    tags=["AI Analysis"]
)
async def list_incidents(
    severity: Optional[str] = None,
    limit: int = 50
) -> Dict[str, Any]:
    """
    List stored incident reports.
    
    **Query Parameters:**
    - severity: Filter by incident severity (low, medium, high, critical)
    - limit: Maximum number of incidents to return
    """
    try:
        incidents = incident_store.list_incidents(severity, limit)
        
        return {
            "status": "success",
            "count": len(incidents),
            "incidents": [
                {
                    "incident_id": i.get("incident_id") if isinstance(i, dict) else i.incident_id,
                    "title": i.get("title") if isinstance(i, dict) else i.title,
                    "severity": i.get("severity") if isinstance(i, dict) else i.severity,
                    "timestamp": i.get("timestamp") if isinstance(i, dict) else i.timestamp,
                    "type": i.get("incident_type") if isinstance(i, dict) else i.incident_type,
                    "affected_assets": i.get("affected_assets") if isinstance(i, dict) else i.affected_assets
                }
                for i in incidents
            ]
        }
    except Exception as e:
        logger.error(f"Error listing incidents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/ai-analysis/incidents/{incident_id}",
    tags=["AI Analysis"]
)
async def get_incident(incident_id: str) -> Dict[str, Any]:
    """Retrieve a specific incident report."""
    try:
        incident = incident_store.get_incident(incident_id)
        
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        return {
            "status": "success",
            "incident": incident
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving incident: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/ai-analysis/incidents/{incident_id}",
    tags=["AI Analysis"]
)
async def delete_incident(incident_id: str) -> Dict[str, Any]:
    """Delete an incident report."""
    try:
        if not incident_store.delete_incident(incident_id):
            raise HTTPException(status_code=404, detail="Incident not found")
        
        return {"status": "deleted", "incident_id": incident_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting incident: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Alias routes for frontend compatibility
@router.get(
    "/ai-analysis/incident-report/{incident_id}",
    tags=["AI Analysis"]
)
async def get_incident_report_alias(incident_id: str) -> Dict[str, Any]:
    """Retrieve a specific incident report (alias for /incidents/{incident_id})."""
    try:
        incident = incident_store.get_incident(incident_id)
        
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        return {
            "status": "success",
            "incident_id": incident_id,
            "generated_at": incident.get("timestamp", datetime.now()).isoformat() if isinstance(incident.get("timestamp"), datetime) else incident.get("timestamp"),
            "report_content": incident
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving incident report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/ai-analysis/incident-report/{incident_id}",
    tags=["AI Analysis"]
)
async def delete_incident_report_alias(incident_id: str) -> Dict[str, Any]:
    """Delete an incident report (alias for /incidents/{incident_id})."""
    try:
        if not incident_store.delete_incident(incident_id):
            raise HTTPException(status_code=404, detail="Incident not found")
        
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting incident report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Helper Functions ====================

def _analyze_threats(packet: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze packet for threat indicators."""
    threats = {
        "detected_threats": [],
        "threat_score": 0.0,
        "notes": []
    }
    
    protocol = packet.get("protocol", "").upper()
    dest_port = packet.get("dest_port", 0)
    
    # Check for common attack patterns
    if protocol == "TCP":
        if dest_port in [22, 23, 3389]:  # SSH, Telnet, RDP
            threats["detected_threats"].append({
                "type": "Remote access attempt",
                "port": dest_port,
                "severity": "medium"
            })
            threats["threat_score"] += 0.2
        
        if dest_port in [80, 443, 8080]:  # Web services
            threats["notes"].append(f"Web service traffic on port {dest_port}")
    
    # Check for suspicious flags
    flags = packet.get("flags", [])
    if "R" in flags or "F" in flags:  # RST or FIN flags
        threats["notes"].append("Connection termination detected")
    
    # Check for unusual ports
    if dest_port > 49151:  # Ephemeral port range
        threats["notes"].append("Ephemeral port communication")
    
    # Check source enrichment
    source_enrichment = packet.get("source_ip_enrichment", {})
    if source_enrichment.get("is_suspicious"):
        threats["detected_threats"].append({
            "type": "Suspicious source IP",
            "severity": "high"
        })
        threats["threat_score"] += 0.4
    
    return threats


def _generate_recommendations(
    packet: Dict[str, Any],
    threat_analysis: Dict[str, Any]
) -> List[str]:
    """Generate mitigation recommendations based on packet analysis."""
    recommendations = []
    
    dest_ip = packet.get("dest_ip")
    dest_port = packet.get("dest_port", 0)
    threats = threat_analysis.get("detected_threats", [])
    threat_score = threat_analysis.get("threat_score", 0)
    
    if threat_score > 0.5:
        recommendations.append(f"Monitor traffic from {packet.get('source_ip')} closely")
        recommendations.append(f"Consider implementing rate limiting on port {dest_port}")
    
    if any("Remote access" in t.get("type", "") for t in threats):
        recommendations.append(f"Review access controls for port {dest_port}")
        recommendations.append("Consider changing default port numbers for remote services")
    
    if any("Suspicious source" in t.get("type", "") for t in threats):
        recommendations.append(f"Implement IP reputation-based filtering")
        recommendations.append(f"Add {packet.get('source_ip')} to watchlist")
    
    if not recommendations:
        recommendations.append("No specific threats detected. Continue monitoring.")
    
    return recommendations
