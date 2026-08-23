from sqlalchemy import Column, BigInteger, String, DateTime, func

from app.core.database import Base


class CompanyReference(Base):
    __tablename__ = "companies_reference"

    company_id = Column(BigInteger, primary_key=True, autoincrement=True)
    company_name = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime, server_default=func.now())
    remarks = Column(String(255), nullable=True)


class Complainant(Base):
    __tablename__ = "complainants"

    complainant_id = Column(BigInteger, primary_key=True, autoincrement=True)
    complainant_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class CauseOfAction(Base):
    __tablename__ = "cause_of_actions"

    cause_of_action_id = Column(BigInteger, primary_key=True, autoincrement=True)
    cause_of_action = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime, server_default=func.now())
    remarks = Column(String(255), nullable=True)