# src/backend/services/incident_store_firestore.py
"""
Firestore-backed persistent incident storage.
Replaces in-memory IncidentStore with cloud storage.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
from pydantic import BaseModel
from google.cloud import firestore
from google.cloud.exceptions import NotFound

logger = logging.getLogger(__name__)


class FirestoreIncidentStore:
    """Persistent incident storage using Google Firestore."""
    
    COLLECTION_NAME = "incidents"
    
    def __init__(self, db: Optional[firestore.Client] = None):
        """
        Initialize Firestore incident store.
        
        Args:
            db: Firestore client instance. If None, creates a new client.
        """
        self.db = db or firestore.Client()
        self.collection = self.db.collection(self.COLLECTION_NAME)
        logger.info("Firestore IncidentStore initialized")
    
    def save_incident(self, report: BaseModel) -> bool:
        """
        Save incident report to Firestore.
        
        Args:
            report: IncidentReport model instance
            
        Returns:
            bool: True if saved successfully, False otherwise
        """
        try:
            # Convert Pydantic model to dict
            incident_data = report.dict(exclude_none=True)
            
            # Convert datetime objects to ISO format strings for Firestore
            if 'timestamp' in incident_data and isinstance(incident_data['timestamp'], datetime):
                incident_data['timestamp'] = incident_data['timestamp'].isoformat()
            
            # Add metadata
            incident_data['created_at'] = datetime.now().isoformat()
            incident_data['updated_at'] = datetime.now().isoformat()
            
            # Save to Firestore
            self.collection.document(report.incident_id).set(incident_data)
            
            logger.info(f"Incident saved to Firestore: {report.incident_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save incident to Firestore: {e}")
            return False
    
    def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve incident report from Firestore.
        
        Args:
            incident_id: Unique incident identifier
            
        Returns:
            dict: Incident data if found, None otherwise
        """
        try:
            doc = self.collection.document(incident_id).get()
            
            if doc.exists:
                data = doc.to_dict()
                
                # Convert ISO string back to datetime if needed
                if 'timestamp' in data and isinstance(data['timestamp'], str):
                    data['timestamp'] = datetime.fromisoformat(data['timestamp'])
                
                logger.info(f"Retrieved incident from Firestore: {incident_id}")
                return data
            
            logger.warning(f"Incident not found in Firestore: {incident_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving incident from Firestore: {e}")
            return None
    
    def list_incidents(
        self,
        severity_filter: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        List incidents from Firestore with optional filtering.
        
        Args:
            severity_filter: Filter by severity (low, medium, high, critical)
            limit: Maximum number of incidents to return
            offset: Number of incidents to skip
            
        Returns:
            list: List of incident dictionaries, sorted by timestamp descending
        """
        try:
            query = self.collection.order_by('timestamp', direction=firestore.Query.DESCENDING)
            
            if severity_filter:
                query = query.where('severity', '==', severity_filter)
            
            # Get all matching documents (Firestore doesn't have true offset)
            docs = query.limit(limit + offset).stream()
            
            incidents = []
            for i, doc in enumerate(docs):
                if i >= offset:
                    data = doc.to_dict()
                    
                    # Convert ISO string back to datetime
                    if 'timestamp' in data and isinstance(data['timestamp'], str):
                        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
                    
                    incidents.append(data)
            
            logger.info(f"Retrieved {len(incidents)} incidents from Firestore (severity: {severity_filter})")
            return incidents
            
        except Exception as e:
            logger.error(f"Error listing incidents from Firestore: {e}")
            return []
    
    def delete_incident(self, incident_id: str) -> bool:
        """
        Delete an incident from Firestore.
        
        Args:
            incident_id: Unique incident identifier
            
        Returns:
            bool: True if deleted successfully, False otherwise
        """
        try:
            self.collection.document(incident_id).delete()
            logger.info(f"Incident deleted from Firestore: {incident_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting incident from Firestore: {e}")
            return False
    
    def update_incident(self, incident_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update specific fields of an incident.
        
        Args:
            incident_id: Unique incident identifier
            updates: Dictionary of fields to update
            
        Returns:
            bool: True if updated successfully, False otherwise
        """
        try:
            # Add updated_at timestamp
            updates['updated_at'] = datetime.now().isoformat()
            
            self.collection.document(incident_id).update(updates)
            logger.info(f"Incident updated in Firestore: {incident_id}")
            return True
            
        except NotFound:
            logger.warning(f"Incident not found in Firestore: {incident_id}")
            return False
        except Exception as e:
            logger.error(f"Error updating incident in Firestore: {e}")
            return False
    
    def batch_save_incidents(self, reports: List[BaseModel]) -> bool:
        """
        Save multiple incidents in a batch operation for efficiency.
        
        Args:
            reports: List of IncidentReport model instances
            
        Returns:
            bool: True if all saved successfully, False otherwise
        """
        try:
            batch = self.db.batch()
            
            for report in reports:
                incident_data = report.dict(exclude_none=True)
                
                if 'timestamp' in incident_data and isinstance(incident_data['timestamp'], datetime):
                    incident_data['timestamp'] = incident_data['timestamp'].isoformat()
                
                incident_data['created_at'] = datetime.now().isoformat()
                incident_data['updated_at'] = datetime.now().isoformat()
                
                doc_ref = self.collection.document(report.incident_id)
                batch.set(doc_ref, incident_data)
            
            batch.commit()
            logger.info(f"Batch saved {len(reports)} incidents to Firestore")
            return True
            
        except Exception as e:
            logger.error(f"Error batch saving incidents to Firestore: {e}")
            return False
    
    def query_incidents(
        self,
        field: str,
        operator: str,
        value: Any,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Query incidents by a specific field and operator.
        
        Args:
            field: Field name to query
            operator: Comparison operator (==, <, <=, >, >=, !=)
            value: Value to compare against
            limit: Maximum number of results
            
        Returns:
            list: List of matching incident dictionaries
        """
        try:
            query = self.collection
            
            if operator == '==':
                query = query.where(field, '==', value)
            elif operator == '<':
                query = query.where(field, '<', value)
            elif operator == '<=':
                query = query.where(field, '<=', value)
            elif operator == '>':
                query = query.where(field, '>', value)
            elif operator == '>=':
                query = query.where(field, '>=', value)
            else:
                logger.warning(f"Unsupported operator: {operator}")
                return []
            
            docs = query.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit).stream()
            
            incidents = []
            for doc in docs:
                data = doc.to_dict()
                if 'timestamp' in data and isinstance(data['timestamp'], str):
                    data['timestamp'] = datetime.fromisoformat(data['timestamp'])
                incidents.append(data)
            
            logger.info(f"Query returned {len(incidents)} incidents")
            return incidents
            
        except Exception as e:
            logger.error(f"Error querying incidents: {e}")
            return []
    
    def get_incident_count(self, severity_filter: Optional[str] = None) -> int:
        """
        Get count of incidents, optionally filtered by severity.
        
        Args:
            severity_filter: Optional severity filter
            
        Returns:
            int: Number of incidents matching filter
        """
        try:
            query = self.collection
            
            if severity_filter:
                query = query.where('severity', '==', severity_filter)
            
            # Count using aggregation
            count = len(list(query.stream()))
            return count
            
        except Exception as e:
            logger.error(f"Error counting incidents: {e}")
            return 0
    
    def export_incidents(self, filepath: str, severity_filter: Optional[str] = None) -> bool:
        """
        Export incidents to JSON file.
        
        Args:
            filepath: Path to export file
            severity_filter: Optional severity filter
            
        Returns:
            bool: True if exported successfully, False otherwise
        """
        try:
            import json
            
            incidents = self.list_incidents(severity_filter=severity_filter, limit=10000)
            
            # Convert datetime objects to strings for JSON serialization
            for incident in incidents:
                if 'timestamp' in incident and isinstance(incident['timestamp'], datetime):
                    incident['timestamp'] = incident['timestamp'].isoformat()
                if 'created_at' in incident and isinstance(incident['created_at'], datetime):
                    incident['created_at'] = incident['created_at'].isoformat()
                if 'updated_at' in incident and isinstance(incident['updated_at'], datetime):
                    incident['updated_at'] = incident['updated_at'].isoformat()
            
            with open(filepath, 'w') as f:
                json.dump(incidents, f, indent=2, default=str)
            
            logger.info(f"Exported {len(incidents)} incidents to {filepath}")
            return True
            
        except Exception as e:
            logger.error(f"Error exporting incidents: {e}")
            return False
