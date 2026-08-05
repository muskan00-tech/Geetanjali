"""Authentication router — login, logout, me."""
import logging
from fastapi import APIRouter, Response, Depends
from core.database import db
from core.helpers import verify_pw, make_token, get_current_user
from core.models import LoginIn

router = APIRouter(prefix="/api", tags=["auth"])
log = logging.getLogger("lss.auth")


@router.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower().strip()
    u = await db.users.find_one({"email": email})
    log.info(f"Login attempt: email={email}, user_found={bool(u)}")
    if not u or not verify_pw(payload.password, u["password_hash"]):
        from fastapi import HTTPException
        raise HTTPException(401, "Invalid credentials")
    token = make_token(u["id"], u["role"])
    response.set_cookie("access_token", token, httponly=True, samesite="none", secure=True, max_age=604800, path="/")
    return {"id": u["id"], "email": u["email"], "name": u["name"], "role": u["role"], "token": token}


@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/", samesite="none", secure=True)
    return {"ok": True}


@router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user
