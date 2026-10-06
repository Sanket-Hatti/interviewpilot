"""
RAG Document Indexing Service for InterviewPilot.
Performs semantic section chunking, embedding generation, and pgvector persistence for:
1. Resumes (Summary, Skills, Projects, Experience, Education)
2. Job Descriptions (Requirements, Preferred, Responsibilities, Interview Topics)
3. Interview Feedback (Technical Accuracy, Weaknesses, Communication)
"""

import logging
from typing import Dict, Any, Optional
from database.db import db
from models.document import Document, DocumentChunk
from models.candidate import CandidateProfile, JobTarget
from services.embedding_service import generate_embeddings
from services.job_service import analyze_job_description

logger = logging.getLogger(__name__)


def index_resume_document(
    user_id: int,
    resume_id: Optional[int] = None,
    raw_text: str = "",
    candidate_profile: Optional[Any] = None,
    profile: Optional[Any] = None
) -> Document:
    """
    Intelligently chunks and indexes a candidate's resume into pgvector.
    Chunks semantically by sections (Summary, Skills, Projects, Experience, Education)
    so specific queries (e.g. project drilldown) retrieve exact relevant context.
    """
    active_profile = candidate_profile or profile
    if hasattr(active_profile, "to_dict"):
        candidate_dict = active_profile.to_dict()
    elif isinstance(active_profile, dict):
        candidate_dict = active_profile
    else:
        prof = CandidateProfile.query.filter_by(user_id=user_id).first()
        candidate_dict = prof.to_dict() if prof else {}

    src_id = str(resume_id or "default")

    # Check if a resume document already exists for this resume_id
    doc = Document.query.filter_by(user_id=user_id, document_type="resume", source_id=src_id).first()
    if not doc:
        # Also clean up any prior resume documents for this user so only active resume is indexed
        old_docs = Document.query.filter_by(user_id=user_id, document_type="resume").all()
        for od in old_docs:
            db.session.delete(od)

        doc = Document(
            user_id=user_id,
            document_type="resume",
            source_id=src_id,
            title=f"Candidate Resume (ID: {src_id})",
            content=raw_text or "Candidate Resume",
            metadata_json={"resume_id": resume_id, "score": candidate_dict.get("resume_score", 0)}
        )
        db.session.add(doc)
        db.session.flush()
    else:
        doc.content = raw_text or doc.content
        doc.metadata_json = {"resume_id": resume_id, "score": candidate_dict.get("resume_score", 0)}
        # Delete existing chunks for re-indexing
        DocumentChunk.query.filter_by(document_id=doc.id).delete()
        db.session.flush()

    candidate_profile = candidate_dict

    chunks_to_create = []

    # 1. Profile Summary Section
    summary = candidate_profile.get("profile_summary") or ""
    if not summary and raw_text:
        # Extract first 400 chars of resume as header
        summary = " ".join(raw_text.split()[:80])
    if summary:
        chunks_to_create.append({
            "section": "summary",
            "content": f"Candidate Profile Summary:\n{summary.strip()}",
            "metadata": {"type": "summary"}
        })

    # 2. Technical Skills Taxonomy Section
    skills = candidate_profile.get("skills", [])
    languages = candidate_profile.get("programming_languages", [])
    frameworks = candidate_profile.get("frameworks", [])
    databases = candidate_profile.get("databases", [])
    cloud = candidate_profile.get("cloud_technologies", [])

    skills_text_parts = []
    if languages:
        skills_text_parts.append(f"Programming Languages: {', '.join(languages)}")
    if frameworks:
        skills_text_parts.append(f"Frameworks & Libraries: {', '.join(frameworks)}")
    if databases:
        skills_text_parts.append(f"Databases & Storage: {', '.join(databases)}")
    if cloud:
        skills_text_parts.append(f"Cloud & Infrastructure: {', '.join(cloud)}")
    if skills:
        skills_text_parts.append(f"All Extracted Technical Competencies: {', '.join(skills)}")

    if skills_text_parts:
        chunks_to_create.append({
            "section": "skills",
            "content": "Verified Technical Skills & Tooling:\n" + "\n".join(skills_text_parts),
            "metadata": {"type": "skills", "skill_count": len(skills)}
        })

    # 3. Projects Section (Each project chunked individually for grounded questions!)
    projects = candidate_profile.get("projects", [])
    if projects:
        for idx, p in enumerate(projects):
            p_str = p.strip() if isinstance(p, str) else str(p)
            chunks_to_create.append({
                "section": "projects",
                "content": f"Project Experience ({idx + 1}):\n{p_str}",
                "metadata": {"type": "project", "project_index": idx}
            })
    else:
        # Fallback: check if projects section exists in raw text
        if "project" in raw_text.lower():
            chunks_to_create.append({
                "section": "projects",
                "content": f"Resume Projects Section:\n{raw_text[:600]}",
                "metadata": {"type": "project"}
            })

    # 4. Work Experience Section
    experience = candidate_profile.get("experience", [])
    if experience:
        for idx, exp in enumerate(experience):
            exp_str = exp.strip() if isinstance(exp, str) else str(exp)
            chunks_to_create.append({
                "section": "experience",
                "content": f"Professional Experience Record ({idx + 1}):\n{exp_str}",
                "metadata": {"type": "experience", "experience_index": idx}
            })

    # 5. Education Section
    education = candidate_profile.get("education", [])
    if education:
        edu_text = "\n".join(f"- {e}" for e in education)
        chunks_to_create.append({
            "section": "education",
            "content": f"Educational Background:\n{edu_text}",
            "metadata": {"type": "education"}
        })

    # 6. Strengths and Recommended Improvement Areas
    strengths = candidate_profile.get("strengths", [])
    weaknesses = candidate_profile.get("areas_to_improve") or candidate_profile.get("weaknesses", [])
    if strengths or weaknesses:
        eval_parts = []
        if strengths:
            eval_parts.append(f"Strengths: {'; '.join(strengths)}")
        if weaknesses:
            eval_parts.append(f"Areas to Improve: {'; '.join(weaknesses)}")
        chunks_to_create.append({
            "section": "evaluation",
            "content": "Resume Diagnostics & Skill Assessment:\n" + "\n".join(eval_parts),
            "metadata": {"type": "evaluation"}
        })

    # Generate embeddings in batch
    texts = [c["content"] for c in chunks_to_create]
    embeddings = generate_embeddings(texts)

    for i, c in enumerate(chunks_to_create):
        chunk = DocumentChunk(
            document_id=doc.id,
            user_id=user_id,
            chunk_index=i,
            section=c["section"],
            content=c["content"],
            embedding=embeddings[i] if i < len(embeddings) else None,
            metadata_json=c["metadata"]
        )
        db.session.add(chunk)

    db.session.commit()
    logger.info(f"Indexed resume {resume_id} into {len(chunks_to_create)} semantic chunks for user {user_id}")
    return doc


def index_job_document(
    user_id: int,
    target_id: Optional[int] = None,
    job_description: str = "",
    target_role: str = "Software Engineer",
    target_company: Optional[str] = None,
    job_analysis: Optional[Dict[str, Any]] = None,
    job_target_id: Optional[int] = None,
    analysis_dict: Optional[Dict[str, Any]] = None,
) -> Document:
    """
    Intelligently chunks and indexes a Target Job Description into pgvector.
    Chunks semantically by sections (Overview, Required, Preferred, Responsibilities, Interview Topics)
    so queries strictly retrieve grounded job expectations without LLM hallucinations.
    """
    effective_target_id = target_id if target_id is not None else (job_target_id if job_target_id is not None else "default")
    effective_analysis = job_analysis or analysis_dict
    if not effective_analysis:
        effective_analysis = analyze_job_description(job_description or "", target_role or "Software Engineer")
    job_analysis = effective_analysis

    # Clean up prior job description documents for this user
    doc = Document.query.filter_by(user_id=user_id, document_type="job_description", source_id=str(effective_target_id)).first()
    if not doc:
        old_docs = Document.query.filter_by(user_id=user_id, document_type="job_description").all()
        for od in old_docs:
            db.session.delete(od)

        title = f"{target_role}" + (f" at {target_company}" if target_company else "")
        doc = Document(
            user_id=user_id,
            document_type="job_description",
            source_id=str(target_id),
            title=title,
            content=job_description or f"Job Description for {title}",
            metadata_json={
                "target_id": target_id,
                "role": target_role,
                "company": target_company or ""
            }
        )
        db.session.add(doc)
        db.session.flush()
    else:
        doc.content = job_description or doc.content
        doc.metadata_json = {
            "target_id": target_id,
            "role": target_role,
            "company": target_company or ""
        }
        DocumentChunk.query.filter_by(document_id=doc.id).delete()
        db.session.flush()

    chunks_to_create = []

    # 1. Target Role & Company Overview
    company_str = f" at {target_company}" if target_company else ""
    chunks_to_create.append({
        "section": "overview",
        "content": f"Target Opportunity: {target_role}{company_str}.\nRole benchmark for technical interview readiness and evaluation.",
        "metadata": {"type": "overview", "role": target_role, "company": target_company or ""}
    })

    # 2. Required Technical Skills
    req_skills = job_analysis.get("required_skills", [])
    if req_skills:
        chunks_to_create.append({
            "section": "requirements",
            "content": f"Required Technical Stack & Must-Have Skills for {target_role}:\n" + ", ".join(req_skills),
            "metadata": {"type": "requirements", "count": len(req_skills)}
        })

    # 3. Preferred Skills & Nice-to-haves
    pref_skills = job_analysis.get("preferred_skills", [])
    if pref_skills:
        chunks_to_create.append({
            "section": "preferred",
            "content": f"Preferred Qualifications & Bonus Tools for {target_role}:\n" + ", ".join(pref_skills),
            "metadata": {"type": "preferred", "count": len(pref_skills)}
        })

    # 4. Responsibilities & Deliverables
    responsibilities = job_analysis.get("responsibilities", [])
    if responsibilities:
        resp_text = "\n".join(f"- {r}" for r in responsibilities)
        chunks_to_create.append({
            "section": "responsibilities",
            "content": f"Core Engineering Responsibilities for {target_role}:\n{resp_text}",
            "metadata": {"type": "responsibilities"}
        })

    # 5. Likely Interview Drill Topics
    interview_topics = job_analysis.get("interview_topics", [])
    if interview_topics:
        topic_text = "\n".join(f"- {t}" for t in interview_topics)
        chunks_to_create.append({
            "section": "interview_topics",
            "content": f"High-Yield Technical Interview Topics for {target_role}:\n{topic_text}",
            "metadata": {"type": "interview_topics"}
        })

    # Generate embeddings in batch
    texts = [c["content"] for c in chunks_to_create]
    embeddings = generate_embeddings(texts)

    for i, c in enumerate(chunks_to_create):
        chunk = DocumentChunk(
            document_id=doc.id,
            user_id=user_id,
            chunk_index=i,
            section=c["section"],
            content=c["content"],
            embedding=embeddings[i] if i < len(embeddings) else None,
            metadata_json=c["metadata"]
        )
        db.session.add(chunk)

    db.session.commit()
    logger.info(f"Indexed job description {target_id} ({target_role}) into {len(chunks_to_create)} semantic chunks for user {user_id}")
    return doc


def index_interview_feedback_document(
    user_id: int,
    interview_id: int,
    role: str,
    feedback: Dict[str, Any],
    overall_score: float = 0.0
) -> Document:
    """Indexes completed interview session feedback into RAG for performance context."""
    doc = Document.query.filter_by(
        user_id=user_id,
        document_type="interview_feedback",
        source_id=str(interview_id)
    ).first()

    if not doc:
        doc = Document(
            user_id=user_id,
            document_type="interview_feedback",
            source_id=str(interview_id),
            title=f"Mock Interview Feedback ({role}) - Score: {overall_score}%",
            content=str(feedback),
            metadata_json={"interview_id": interview_id, "score": overall_score, "role": role}
        )
        db.session.add(doc)
        db.session.flush()
    else:
        DocumentChunk.query.filter_by(document_id=doc.id).delete()
        db.session.flush()

    chunks_to_create = []

    # Extract feedback dimensions
    summary = feedback.get("overall_summary") or feedback.get("summary") or ""
    if summary:
        chunks_to_create.append({
            "section": "feedback_summary",
            "content": f"Interview Performance Summary for {role} (Score: {overall_score}%):\n{summary}",
            "metadata": {"score": overall_score}
        })

    weaknesses = feedback.get("weaknesses") or feedback.get("areas_for_improvement") or []
    if weaknesses:
        w_text = "\n".join(f"- {w}" for w in (weaknesses if isinstance(weaknesses, list) else [weaknesses]))
        chunks_to_create.append({
            "section": "weaknesses",
            "content": f"Identified Weakness & Gaps during {role} Interview:\n{w_text}",
            "metadata": {"type": "weaknesses"}
        })

    strengths = feedback.get("strengths") or []
    if strengths:
        s_text = "\n".join(f"- {s}" for s in (strengths if isinstance(strengths, list) else [strengths]))
        chunks_to_create.append({
            "section": "strengths",
            "content": f"Demonstrated Technical Strengths during {role} Interview:\n{s_text}",
            "metadata": {"type": "strengths"}
        })

    if chunks_to_create:
        texts = [c["content"] for c in chunks_to_create]
        embeddings = generate_embeddings(texts)
        for i, c in enumerate(chunks_to_create):
            chunk = DocumentChunk(
                document_id=doc.id,
                user_id=user_id,
                chunk_index=i,
                section=c["section"],
                content=c["content"],
                embedding=embeddings[i] if i < len(embeddings) else None,
                metadata_json=c["metadata"]
            )
            db.session.add(chunk)
        db.session.commit()

    return doc


def index_practice_feedback_document(
    user_id: int,
    practice_id: int,
    topic: str,
    problem_name: Optional[str] = None,
    score: float = 0.0,
    feedback: Optional[Dict[str, Any]] = None,
    mistakes: Optional[list] = None,
    concepts_missed: Optional[list] = None
) -> Document:
    """Indexes practice session feedback, mistakes, and missed concepts into RAG."""
    fb = feedback or {}
    source_key = f"practice_{practice_id}"
    doc = Document.query.filter_by(
        user_id=user_id,
        document_type="practice_feedback",
        source_id=source_key
    ).first()

    title_desc = f"{topic} ({problem_name})" if problem_name else topic
    if not doc:
        doc = Document(
            user_id=user_id,
            document_type="practice_feedback",
            source_id=source_key,
            title=f"Practice Feedback - {title_desc} - Score: {round(score, 1)}%",
            content=f"Topic: {topic}\nProblem: {problem_name}\nScore: {score}%\nMistakes: {mistakes}\nConcepts Missed: {concepts_missed}",
            metadata_json={"practice_id": practice_id, "topic": topic, "score": score, "problem_name": problem_name}
        )
        db.session.add(doc)
        db.session.flush()
    else:
        doc.title = f"Practice Feedback - {title_desc} - Score: {round(score, 1)}%"
        DocumentChunk.query.filter_by(document_id=doc.id).delete()
        db.session.flush()

    chunks_to_create = []

    # 1. Summary Chunk
    summary_text = fb.get("review_summary") or fb.get("summary") or f"Candidate scored {round(score, 1)}% on {topic} practice ({problem_name or 'Drill'})."
    chunks_to_create.append({
        "section": "practice_summary",
        "content": f"Practice Drill Performance Summary for {topic} - {problem_name or 'General Drill'} (Score: {round(score, 1)}%):\n{summary_text}",
        "metadata": {"topic": topic, "score": score}
    })

    # 2. Mistakes
    all_mistakes = (mistakes or []) + (fb.get("mistakes") or [])
    if all_mistakes:
        m_lines = "\n".join(f"- {m}" for m in all_mistakes)
        chunks_to_create.append({
            "section": "mistakes",
            "content": f"Identified Mistakes and Edge Case Failures in {topic} ({problem_name or 'Drill'}):\n{m_lines}",
            "metadata": {"type": "mistakes", "topic": topic}
        })

    # 3. Concepts Missed
    all_missed = (concepts_missed or []) + (fb.get("concepts_missed") or []) + (fb.get("areas_to_improve") or [])
    if all_missed:
        c_lines = "\n".join(f"- {c}" for c in all_missed)
        chunks_to_create.append({
            "section": "concepts_missed",
            "content": f"Concepts Missed and Foundational Gaps in {topic}:\n{c_lines}",
            "metadata": {"type": "concepts_missed", "topic": topic}
        })

    # 4. Strengths
    all_strengths = fb.get("strengths") or []
    if all_strengths:
        s_lines = "\n".join(f"- {s}" for s in all_strengths)
        chunks_to_create.append({
            "section": "strengths",
            "content": f"Demonstrated Strengths in {topic} Practice:\n{s_lines}",
            "metadata": {"type": "strengths", "topic": topic}
        })

    if chunks_to_create:
        texts = [c["content"] for c in chunks_to_create]
        embeddings = generate_embeddings(texts)
        for i, c in enumerate(chunks_to_create):
            chunk = DocumentChunk(
                document_id=doc.id,
                user_id=user_id,
                chunk_index=i,
                section=c["section"],
                content=c["content"],
                embedding=embeddings[i] if i < len(embeddings) else None,
                metadata_json=c["metadata"]
            )
            db.session.add(chunk)
        db.session.commit()

    return doc
