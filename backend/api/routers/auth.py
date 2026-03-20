"""api/routers/auth.py"""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)
from models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class LoginResponse(BaseModel):
    access_token: str
    token_type:   str  = "bearer"
    username:     str
    is_superuser: bool


class UserResponse(BaseModel):
    id:           int
    username:     str
    email:        str
    is_active:    bool
    is_superuser: bool
    created_at:   datetime

    model_config = {"from_attributes": True}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password:     str

    # ✅ fix: validate độ mạnh mật khẩu mới (Ít nhất 8 ký tự, 1 HOA, 1 số)
    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


# ---------------------------------------------------------------------------
# Dependency (Người bảo vệ các API khác)
# ---------------------------------------------------------------------------

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db),
) -> User:
    # ✅ FIX MỚI: Bọc try-except để bắt lỗi Token rác hoặc Token hết hạn
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ✅ fix: validate "sub" tồn tại và không None trước khi query
    username: str | None = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=401,
            detail="Invalid token: missing subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is disabled",
        )
    return user


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.username == form_data.username)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)  # ✅ fix: refresh sau commit để tránh expired state

    token = create_access_token(data={"sub": user.username})
    return LoginResponse(
        access_token=token,
        username=user.username,
        is_superuser=user.is_superuser,
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    # ✅ JWT là stateless — token vẫn hợp lệ đến khi hết hạn.
    # Client (Frontend) phải tự xóa token khỏi storage (localStorage/Cookie).
    return {
        "message": "Logged out successfully",
        "note": "Please delete the token on the client side",
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # ✅ fix: merge current_user vào đúng session db này trước khi update
    user = await db.merge(current_user)
    user.hashed_password = hash_password(body.new_password)
    await db.commit()

    return {"message": "Password changed successfully"}
