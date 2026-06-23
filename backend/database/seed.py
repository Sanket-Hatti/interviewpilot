"""
Run once to seed roles and company data.
Usage: python database/seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import create_app
from database.db import db
from models.role import Role
from models.company import CompanyPreparation

ROLES = [
    {
        "role_name": "Software Engineer",
        "required_skills": ["Python", "Data Structures", "Algorithms", "Git", "REST API", "SQL"]
    },
    {
        "role_name": "Backend Developer",
        "required_skills": ["Python", "Flask", "REST API", "PostgreSQL", "Git", "Docker", "AWS"]
    },
    {
        "role_name": "Frontend Developer",
        "required_skills": ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind", "Git"]
    },
    {
        "role_name": "Full Stack Developer",
        "required_skills": ["React", "Node.js", "Python", "REST API", "PostgreSQL", "Git", "Docker"]
    },
    {
        "role_name": "Data Analyst",
        "required_skills": ["Python", "SQL", "Pandas", "NumPy", "Tableau", "Excel", "Statistics"]
    },
    {
        "role_name": "Data Scientist",
        "required_skills": ["Python", "Machine Learning", "Pandas", "Scikit-learn", "SQL", "Statistics", "Deep Learning"]
    },
    {
        "role_name": "Machine Learning Engineer",
        "required_skills": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "MLOps", "Docker", "AWS"]
    },
    {
        "role_name": "DevOps Engineer",
        "required_skills": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform", "Git"]
    },
    {
        "role_name": "Cloud Engineer",
        "required_skills": ["AWS", "Azure", "GCP", "Terraform", "Docker", "Kubernetes", "Networking"]
    }
]

COMPANIES = [
    {
        "company_name": "American Express",
        "difficulty_level": "hard",
        "interview_pattern": {
            "rounds": ["Online Assessment", "Technical Round 1", "Technical Round 2", "HR Round"],
            "duration": "3–4 weeks",
            "focus": "DSA + System Design + Behavioral"
        },
        "frequent_topics": ["Arrays", "Dynamic Programming", "System Design", "OOP", "SQL", "Spring Boot"],
        "prep_strategy": "Focus on medium-hard LeetCode problems. Study payment system design. Prepare STAR-method behavioral stories. AmEx values problem-solving and code quality over speed."
    },
    {
        "company_name": "TCS",
        "difficulty_level": "easy",
        "interview_pattern": {
            "rounds": ["TCS NQT (Online Test)", "Technical Interview", "HR Interview"],
            "duration": "1–2 weeks",
            "focus": "Aptitude + Basic Programming + Communication"
        },
        "frequent_topics": ["C", "Java", "SQL", "OOP Concepts", "Aptitude", "Verbal Ability"],
        "prep_strategy": "Clear TCS NQT with strong aptitude preparation. Revise OOP fundamentals and basic data structures. Practice verbal and reasoning sections. HR round focuses on communication and attitude."
    },
    {
        "company_name": "Infosys",
        "difficulty_level": "easy",
        "interview_pattern": {
            "rounds": ["InfyTQ / HackWithInfy", "Technical Interview", "HR Interview"],
            "duration": "2–3 weeks",
            "focus": "Problem Solving + OOP + Communication"
        },
        "frequent_topics": ["Python", "Java", "OOP", "SQL", "Data Structures", "Puzzles"],
        "prep_strategy": "Register on InfyTQ platform and complete certification. Practice coding on HackerRank at easy-medium level. Know SDLC, Agile, and basic design patterns."
    },
    {
        "company_name": "Accenture",
        "difficulty_level": "easy",
        "interview_pattern": {
            "rounds": ["Cognitive & Technical Assessment", "Coding Test", "Communication Test", "HR Interview"],
            "duration": "2–3 weeks",
            "focus": "Aptitude + Coding Basics + Communication"
        },
        "frequent_topics": ["Java", "Python", "SQL", "Aptitude", "Verbal", "OOP"],
        "prep_strategy": "Focus on verbal ability and logical reasoning. Coding test covers easy problems — practice basic arrays, strings, and sorting. HR evaluates culture fit — research Accenture's values."
    },
    {
        "company_name": "Wipro",
        "difficulty_level": "easy",
        "interview_pattern": {
            "rounds": ["NLTH Test", "Technical Interview", "HR Interview"],
            "duration": "2–3 weeks",
            "focus": "Aptitude + Coding + OOP"
        },
        "frequent_topics": ["C++", "Java", "SQL", "Aptitude", "Networking Basics", "OOP"],
        "prep_strategy": "Clear the NLTH online test: aptitude, coding (easy level), and essay writing. Technical round covers DBMS, OOP, and basic DS. Stay confident in HR — Wipro values communication highly."
    },
    {
        "company_name": "Cognizant",
        "difficulty_level": "easy",
        "interview_pattern": {
            "rounds": ["GenC / GenC Elevate Test", "Technical Interview", "HR Interview"],
            "duration": "2 weeks",
            "focus": "Aptitude + Coding + Communication"
        },
        "frequent_topics": ["Java", "Python", "SQL", "OOP", "Aptitude", "Pseudo Code"],
        "prep_strategy": "Target GenC or GenC Elevate track based on profile. Practice pseudo-code questions and basic coding. DBMS and OS fundamentals are frequently asked. Cognizant values clarity of thought."
    },
    {
        "company_name": "Capgemini",
        "difficulty_level": "easy",
        "interview_pattern": {
            "rounds": ["Pseudo Code Test", "Game-based Assessment", "Technical Interview", "HR Interview"],
            "duration": "2 weeks",
            "focus": "Pseudo Code + Aptitude + Communication"
        },
        "frequent_topics": ["Pseudo Code", "Aptitude", "C", "Java", "SQL", "Analytical Reasoning"],
        "prep_strategy": "Capgemini's unique pseudo-code section needs dedicated practice — find sample papers online. Game-based assessment tests cognitive skills. Technical round is entry-level. Prioritize communication and clarity."
    }
]

def seed():
    app = create_app("development")
    with app.app_context():
        # Seed roles
        for role_data in ROLES:
            exists = Role.query.filter_by(role_name=role_data["role_name"]).first()
            if not exists:
                role = Role(**role_data)
                db.session.add(role)
                print(f"  Added role: {role_data['role_name']}")
            else:
                print(f"  Skipped (exists): {role_data['role_name']}")

        # Seed companies
        for company_data in COMPANIES:
            exists = CompanyPreparation.query.filter_by(company_name=company_data["company_name"]).first()
            if not exists:
                company = CompanyPreparation(**company_data)
                db.session.add(company)
                print(f"  Added company: {company_data['company_name']}")
            else:
                print(f"  Skipped (exists): {company_data['company_name']}")

        db.session.commit()
        print("\nSeed complete.")

if __name__ == "__main__":
    seed()
