import uuid
from sqlalchemy import Column, String, Float, Boolean
from app.core.database import Base

class Server(Base):
    __tablename__ = "servers"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(128), nullable=False)
    hostname = Column(String(256), nullable=False)
    port = Column(String(16), default="8000")
    protocol = Column(String(16), default="http")
    region = Column(String(64), nullable=False)
    country = Column(String(64), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(32), default="active") # active, degraded, maintenance
    capacity_gbps = Column(Float, default=10.0)
    is_default = Column(Boolean, default=False)
