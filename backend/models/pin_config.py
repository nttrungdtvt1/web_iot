"""models/pin_config.py"""
from sqlalchemy import Boolean, Column, Integer, String
from core.database import Base

class PinConfig(Base):
    __tablename__ = "pin_config"

    id         = Column(Integer, primary_key=True)
    hashed_pin = Column(String(256), nullable=False)
    pi_synced  = Column(Boolean, nullable=False, server_default="false")
