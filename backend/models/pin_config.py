"""models/pin_config.py"""
from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import func
from core.database import Base

class PinConfig(Base):
    __tablename__ = "pin_config"

    id         = Column(Integer, primary_key=True)
    hashed_pin = Column(String(256), nullable=False)
    pi_synced  = Column(Boolean, nullable=False, server_default="false")
    # Trường tạm thời để lưu PIN plaintext cần sync xuống Pi (sẽ xóa sau khi sync thành công hoặc hết hạn)
    pin_plaintext = Column(String(8), nullable=True)
    pin_plaintext_expires_at = Column(DateTime(timezone=True), nullable=True)  # TTL: hết hạn sau 5 phút
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
