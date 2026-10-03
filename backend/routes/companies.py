from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from models.company import CompanyPreparation
from utils.auth import get_current_user

router = APIRouter(prefix="/api/companies", tags=["Company Preparation"])

@router.get("/")
def get_all_companies(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Retrieve all company preparation profiles."""
    companies = db.query(CompanyPreparation).all()
    return {
        "success": True,
        "companies": [c.to_dict() for c in companies]
    }

@router.get("/{company_id}")
def get_company(company_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Retrieve details for a specific company."""
    company = db.query(CompanyPreparation).filter(CompanyPreparation.id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company profile not found")
    return {
        "success": True,
        "company": company.to_dict()
    }
