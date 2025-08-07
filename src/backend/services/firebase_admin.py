# src/backend/services/firebase_admin.py

import firebase_admin
from firebase_admin import credentials
from core.config import settings
import os

def initialize_firebase_admin():
    """
    Initializes the Firebase Admin SDK using the service account key.
    """
    # Check if the app is already initialized to prevent errors.
    if not firebase_admin._apps:
        try:
            # The GOOGLE_APPLICATION_CREDENTIALS env var should be set.
            # This is the recommended way for server environments.
            cred = credentials.ApplicationDefault()
            
            firebase_admin.initialize_app(cred, {
                'projectId': os.getenv("FIREBASE_PROJECT_ID"), # You might need to set this env var
            })
            print("Firebase Admin SDK initialized successfully.")
        except Exception as e:
            print(f"Error initializing Firebase Admin SDK: {e}")
            print("Please ensure the GOOGLE_APPLICATION_CREDENTIALS environment variable is set correctly.")
    else:
        print("Firebase Admin SDK already initialized.")
