import os
import sys
import json
import urllib.request
import urllib.parse
from uuid import uuid4

BASE_URL = "http://localhost:5000/api"

def make_multipart_body(field_name, file_path):
    boundary = "----WebKitFormBoundary" + uuid4().hex
    with open(file_path, "rb") as f:
        file_bytes = f.read()
    filename = os.path.basename(file_path)

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'
        f"Content-Type: application/pdf\r\n\r\n"
    ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    content_type = f"multipart/form-data; boundary={boundary}"
    return body, content_type

def test_full_workflow():
    test_email = f"workflow_test_{uuid4().hex[:6]}@example.com"
    password = "password123"

    print("==================================================")
    print("STEP 1: USER REGISTRATION & AUTH")
    print("==================================================")
    reg_req = urllib.request.Request(
        f"{BASE_URL}/auth/register",
        data=json.dumps({"full_name": "Sanket Hatti", "email": test_email, "password": password}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(reg_req) as resp:
        reg_data = json.loads(resp.read().decode("utf-8"))
        token = reg_data["access_token"]
        print(f"[OK] Registered user: {test_email} (ID: {reg_data['user']['id']})")

    headers = {"Authorization": f"Bearer {token}"}

    print("\n==================================================")
    print("STEP 2: RESUME UPLOAD & ANALYSIS")
    print("==================================================")
    pdf_path = os.path.join("backend", "uploads", "7f7ba65bde4c4741a8a701da819274b4_Sanket_Resume.pdf")
    if not os.path.exists(pdf_path):
        # Fallback to any PDF in uploads
        uploads = os.listdir(os.path.join("backend", "uploads"))
        pdf_name = next(f for f in uploads if f.endswith(".pdf"))
        pdf_path = os.path.join("backend", "uploads", pdf_name)

    body, ctype = make_multipart_body("file", pdf_path)
    up_req = urllib.request.Request(
        f"{BASE_URL}/resume/analyze",
        data=body,
        headers={"Authorization": f"Bearer {token}", "Content-Type": ctype}
    )
    with urllib.request.urlopen(up_req) as resp:
        up_data = json.loads(resp.read().decode("utf-8"))
        print(f"[OK] Resume Analyzed successfully! Score: {up_data.get('resume_score')}%")
        print(f"  Extracted Skills ({len(up_data.get('extracted_skills', []))}): {up_data.get('extracted_skills', [])[:8]}")
        print(f"  Parsed Projects: {up_data.get('projects', [])[:2]}")

    print("\n==================================================")
    print("STEP 3: CANDIDATE PROFILE RETRIEVAL")
    print("==================================================")
    prof_req = urllib.request.Request(f"{BASE_URL}/resume/profile", headers=headers)
    with urllib.request.urlopen(prof_req) as resp:
        prof_data = json.loads(resp.read().decode("utf-8"))
        assert prof_data.get("has_profile") is True, "CandidateProfile was not persisted!"
        profile = prof_data.get("profile")
        print(f"[OK] CandidateProfile verified in PostgreSQL:")
        print(f"  User ID: {profile.get('user_id')}")
        print(f"  Verified Skills: {profile.get('skills')[:6]}")
        print(f"  Languages: {profile.get('programming_languages')}")
        print(f"  Frameworks: {profile.get('frameworks')}")
        print(f"  Databases: {profile.get('databases')}")

    print("\n==================================================")
    print("STEP 4: TARGET ROLE & JOB DESCRIPTION ANALYSIS")
    print("==================================================")
    job_desc = (
        "We are looking for a Senior Software Engineer to join Kyndryl. "
        "The ideal candidate will have extensive experience with Python, SQL, REST APIs, and AWS. "
        "Experience with Docker, Kubernetes, and Microservices is preferred. "
        "Responsibilities include architecting low-latency database queries, optimizing AWS Lambda functions, "
        "and leading technical design reviews."
    )
    role_req = urllib.request.Request(
        f"{BASE_URL}/roles/analyze",
        data=json.dumps({
            "target_role": "Senior Software Engineer",
            "target_company": "Kyndryl",
            "job_description": job_desc
        }).encode("utf-8"),
        headers={**headers, "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(role_req) as resp:
        role_data = json.loads(resp.read().decode("utf-8"))
        target = role_data.get("job_target", {})
        comp = role_data.get("comparison", {})
        print(f"[OK] Job Target Analyzed & Persisted:")
        print(f"  Target Role: {target.get('target_role')} at {target.get('target_company')}")
        print(f"  Match Score: {target.get('match_score')}%")
        print(f"  Score Breakdown: {target.get('score_breakdown')}")
        print(f"  Required Skills ({len(target.get('required_skills', []))}): {target.get('required_skills')}")
        print(f"  Preferred Skills ({len(target.get('preferred_skills', []))}): {target.get('preferred_skills')}")
        print(f"  Strong Matches: {[s['skill'] for s in comp.get('strong_matches', [])]}")
        print(f"  Needs Improvement: {[s['skill'] for s in comp.get('needs_improvement', [])]}")
        print(f"  Missing (Not detected in resume): {[s['skill'] for s in comp.get('missing', [])]}")
        print(f"  Likely Interview Topics: {target.get('interview_topics')[:4]}")

    print("\n==================================================")
    print("STEP 5: CURRENT ACTIVE ROLE VERIFICATION")
    print("==================================================")
    curr_role_req = urllib.request.Request(f"{BASE_URL}/roles/current", headers=headers)
    with urllib.request.urlopen(curr_role_req) as resp:
        curr_role_data = json.loads(resp.read().decode("utf-8"))
        assert curr_role_data.get("has_target") is True
        print("[OK] Verified GET /api/roles/current returns active target and comparison")

    print("\n==================================================")
    print("STEP 6: PERSONALIZED ROADMAP GENERATION")
    print("==================================================")
    roadmap_req = urllib.request.Request(
        f"{BASE_URL}/roadmap/generate",
        data=json.dumps({"weekly_hours": 15, "duration_weeks": 4}).encode("utf-8"),
        headers={**headers, "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(roadmap_req) as resp:
        rm_data = json.loads(resp.read().decode("utf-8"))
        print(f"[OK] Roadmap generated based on actual gaps:")
        print(f"  Target Role: {rm_data.get('target_role')}")
        print(f"  Weeks Count: {len(rm_data.get('roadmap', {}).get('weeks', []))}")
        for w in rm_data.get('roadmap', {}).get('weeks', [])[:2]:
            print(f"    - {w.get('title')}: {w.get('topics')[:2]}")

    print("\n==================================================")
    print("STEP 7: GET CURRENT ROADMAP")
    print("==================================================")
    curr_rm_req = urllib.request.Request(f"{BASE_URL}/roadmap/current", headers=headers)
    with urllib.request.urlopen(curr_rm_req) as resp:
        curr_rm_data = json.loads(resp.read().decode("utf-8"))
        assert curr_rm_data.get("has_roadmap") is True
        print("[OK] Verified GET /api/roadmap/current returns active roadmap")

    print("\n==================================================")
    print("ALL 7 CORE WORKFLOW STEPS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_full_workflow()
