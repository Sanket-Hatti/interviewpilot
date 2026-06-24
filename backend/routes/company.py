from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models.company import CompanyPreparation

company_bp = Blueprint("company", __name__, url_prefix="/api/company")


@company_bp.route("/", methods=["GET"])
@jwt_required()
def list_companies():
    companies = CompanyPreparation.query.order_by(CompanyPreparation.company_name).all()
    return jsonify({"success": True, "companies": [c.to_dict() for c in companies]}), 200


@company_bp.route("/<string:company_name>", methods=["GET"])
@jwt_required()
def get_company(company_name):
    company = CompanyPreparation.query.filter(
        CompanyPreparation.company_name.ilike(company_name)
    ).first()
    if not company:
        return jsonify({"success": False, "errors": ["Company not found."]}), 404
    return jsonify({"success": True, "company": company.to_dict()}), 200
