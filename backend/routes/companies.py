from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from database.db import db
from models.company import CompanyPreparation

companies_bp = Blueprint("companies", __name__, url_prefix="/api/companies")


@companies_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_companies():
    """Retrieve all company preparation profiles."""
    companies = CompanyPreparation.query.all()
    return jsonify({
        "success": True,
        "companies": [c.to_dict() for c in companies]
    }), 200


@companies_bp.route("/<int:company_id>", methods=["GET"])
@jwt_required()
def get_company(company_id):
    """Retrieve details for a specific company."""
    company = db.session.get(CompanyPreparation, company_id)
    if not company:
        return jsonify({"success": False, "errors": ["Company profile not found."]}), 404
    return jsonify({
        "success": True,
        "company": company.to_dict()
    }), 200
