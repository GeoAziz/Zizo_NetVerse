# src/backend/api_gateway/endpoints/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from firebase_admin import auth
import firebase_admin

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dependency to verify Firebase ID token and get user data.
    """
    try:
        # Verify the ID token while checking if the token is revoked by passing
        # check_revoked=True.
        decoded_token = auth.verify_id_token(token, check_revoked=True)
        return decoded_token
    except auth.RevokedIdTokenError:
        # Token has been revoked. Inform the user to reauthenticate.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please reauthenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.InvalidIdTokenError:
        # Token is invalid
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token. Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {e}",
        )


@router.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """
    A protected endpoint that returns the current user's Firebase details.
    This demonstrates how to protect your custom backend endpoints.
    The frontend would call this with the Firebase ID token in the Authorization header.
    """
    return {"uid": current_user.get("uid"), "email": current_user.get("email")}
