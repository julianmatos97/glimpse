from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLAlchemyEnum
import enum


class Base(DeclarativeBase): 
    """Base class for all models"""
    pass

class Source(enum.Enum):
    REFERRAL = "Referral"
    WEBSITE = "Website"
    COLD_CALL = "Cold Call"
    EVENT = "Event"
class Interest(enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
class Status(enum.Enum):
    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    CLOSED = "Closed"


class Lead(Base):
    __tablename__ = "leads"

    id = Column("id", Integer, primary_key=True)
    name = Column("name", String, index=True)
    contact_information= Column("contact_information", String, unique=True)
    source = Column("source", SQLAlchemyEnum(Source))
    interest = Column("interest", SQLAlchemyEnum(Interest))
    status = Column("status", SQLAlchemyEnum(Status), index=True)
    assigned_salesperson_name = Column("assigned_salesperson_name", String, index=True)
    salesperson_id = Column("salesperson_id", Integer, ForeignKey("sales_persons.id"))
    sales_person = relationship("SalesPerson", back_populates="leads")
    
class SalesPerson(Base):
    __tablename__ = "sales_persons"
    id = Column("id", Integer, primary_key=True)
    name = Column("name", String, unique=True, index=True)
    hashed_password = Column("hashed_password", String)
    leads = relationship("Lead", back_populates="sales_person")