from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ai.genkit import analyze_packet, analyze_incident

router = APIRouter()

class PacketAnalysisRequest(BaseModel):
    packet_data: dict

class IncidentAnalysisRequest(BaseModel):
    incident_data: dict

@router.post("/ai/analyze-packet", tags=["AI Analysis"])
async def ai_analyze_packet(request: PacketAnalysisRequest):
    try:
        result = analyze_packet(request.packet_data)
        return {"analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/analyze-incident", tags=["AI Analysis"])
async def ai_analyze_incident(request: IncidentAnalysisRequest):
    try:
        result = analyze_incident(request.incident_data)
        return {"analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
