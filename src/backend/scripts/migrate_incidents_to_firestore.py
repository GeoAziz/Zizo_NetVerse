#!/usr/bin/env python3
# src/backend/scripts/migrate_incidents_to_firestore.py
"""
Migration script to move incident reports from in-memory storage to Firestore.
Usage: python migrate_incidents_to_firestore.py
"""

import sys
import os
import json
from datetime import datetime
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def migrate_from_file(input_file: str, use_firestore: bool = True):
    """
    Migrate incidents from a JSON file to Firestore.
    
    Args:
        input_file: Path to JSON file containing incidents
        use_firestore: Whether to use Firestore (True) or keep in-memory
    """
    try:
        from api_gateway.endpoints.ai_analysis_updated import (
            IncidentReport,
            IncidentStoreFactory,
            ThreatIndicator
        )
        
        print(f"Loading incidents from {input_file}...")
        
        with open(input_file, 'r') as f:
            incidents_data = json.load(f)
        
        print(f"Found {len(incidents_data)} incidents")
        
        # Get the appropriate store
        if use_firestore:
            os.environ['USE_FIRESTORE'] = 'true'
        
        IncidentStoreFactory.reset()
        store = IncidentStoreFactory.get_incident_store()
        
        successful = 0
        failed = 0
        
        for incident_data in incidents_data:
            try:
                # Convert timestamp string to datetime if needed
                if isinstance(incident_data.get('timestamp'), str):
                    incident_data['timestamp'] = datetime.fromisoformat(incident_data['timestamp'])
                
                # Handle threat indicators
                threat_indicators = []
                if incident_data.get('threat_indicators'):
                    for ti in incident_data['threat_indicators']:
                        threat_indicators.append(ThreatIndicator(**ti))
                    incident_data['threat_indicators'] = threat_indicators
                
                report = IncidentReport(**incident_data)
                
                if store.save_incident(report):
                    successful += 1
                    print(f"✓ Migrated: {report.incident_id}")
                else:
                    failed += 1
                    print(f"✗ Failed to migrate: {incident_data.get('incident_id')}")
                    
            except Exception as e:
                failed += 1
                print(f"✗ Error migrating {incident_data.get('incident_id')}: {e}")
        
        print(f"\nMigration complete: {successful} successful, {failed} failed")
        return failed == 0
        
    except Exception as e:
        print(f"Migration failed: {e}")
        return False


def export_incidents_to_file(output_file: str, use_firestore: bool = True):
    """
    Export all incidents from store to a JSON file.
    
    Args:
        output_file: Path to output JSON file
        use_firestore: Whether to read from Firestore (True) or in-memory
    """
    try:
        from api_gateway.endpoints.ai_analysis_updated import IncidentStoreFactory
        
        if use_firestore:
            os.environ['USE_FIRESTORE'] = 'true'
        
        IncidentStoreFactory.reset()
        store = IncidentStoreFactory.get_incident_store()
        
        print(f"Exporting incidents from store...")
        incidents = store.list_incidents(limit=10000)
        
        # Convert to JSON-serializable format
        export_data = []
        for incident in incidents:
            if isinstance(incident, dict):
                incident_dict = incident
            else:
                incident_dict = incident.dict() if hasattr(incident, 'dict') else incident
            
            # Convert datetime objects to ISO strings
            if isinstance(incident_dict.get('timestamp'), datetime):
                incident_dict['timestamp'] = incident_dict['timestamp'].isoformat()
            
            export_data.append(incident_dict)
        
        # Create output directory if needed
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)
        
        print(f"✓ Exported {len(export_data)} incidents to {output_file}")
        return True
        
    except Exception as e:
        print(f"Export failed: {e}")
        return False


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Migrate incident reports between storage backends'
    )
    
    parser.add_argument(
        '--export',
        action='store_true',
        help='Export incidents from store to JSON file'
    )
    
    parser.add_argument(
        '--import',
        dest='import_file',
        help='Import incidents from JSON file to store'
    )
    
    parser.add_argument(
        '--output',
        default='incidents_export.json',
        help='Output file for export (default: incidents_export.json)'
    )
    
    parser.add_argument(
        '--use-firestore',
        action='store_true',
        help='Use Firestore instead of in-memory storage'
    )
    
    parser.add_argument(
        '--input',
        help='Input file for import'
    )
    
    args = parser.parse_args()
    
    if args.export:
        output_file = args.output
        success = export_incidents_to_file(output_file, use_firestore=args.use_firestore)
        sys.exit(0 if success else 1)
    
    elif args.import_file:
        input_file = args.import_file
        success = migrate_from_file(input_file, use_firestore=args.use_firestore)
        sys.exit(0 if success else 1)
    
    else:
        parser.print_help()
        sys.exit(1)
