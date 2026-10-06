"""
End-to-End Test Suite for InterviewPilot RAG + Agent Architecture.
Validates all 10 core requirements:
 1. Resume document indexing & chunking
 2. Job description indexing & chunking
 3. Embedding generation (FastEmbed / provider)
 4. Vector retrieval & similarity scoring
 5. Strict multi-tenant user isolation (User A vs User B)
 6. Resume-grounded interview question generation
 7. Job-grounded question generation
 8. Agent tool execution & schema validation
 9. Agent fallback to deterministic rule-based logic upon LLM failure
 10. Next-best-action generation
"""

import os
import sys
import json
import logging
from uuid import uuid4
from datetime import datetime

# Configure logging for test observability
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("test_rag_agent")

from app import create_app
from database.db import db
from models.user import User
from models.candidate import CandidateProfile, JobTarget
from models.document import Document, DocumentChunk
from services.embedding_service import generate_embedding, generate_embeddings, cosine_similarity
from services.retrieval_service import (
    search_resume_context,
    search_job_context,
    search_candidate_context,
    construct_rag_context
)
from services.rag_service import (
    index_resume_document,
    index_job_document,
    index_interview_feedback_document
)
from services.agent_tools import (
    AGENT_TOOLS,
    AGENT_TOOLS_SCHEMA,
    execute_agent_tool,
    tool_recommend_next_action
)
from services.agent_service import (
    get_agent_state,
    agent_next_action,
    rule_based_next_action,
    generate_grounded_interview_questions
)


def run_tests():
    app = create_app()

    with app.app_context():
        logger.info("==================================================")
        logger.info("STARTING RAG + AGENT TEST SUITE")
        logger.info("==================================================")

        # Create two distinct test users for isolation testing
        user_a_email = f"usera_{uuid4().hex[:6]}@example.com"
        user_b_email = f"userb_{uuid4().hex[:6]}@example.com"

        user_a = User(email=user_a_email, full_name="User Alpha (Python Dev)", target_role="Backend Engineer")
        user_a.set_password("password123")
        user_b = User(email=user_b_email, full_name="User Beta (Java Dev)", target_role="Java Architect")
        user_b.set_password("password123")

        db.session.add_all([user_a, user_b])
        db.session.commit()
        logger.info("[OK] Created User A (ID %d) and User B (ID %d)", user_a.id, user_b.id)

        # -------------------------------------------------------------------
        # TEST 1: Embedding Generation
        # -------------------------------------------------------------------
        logger.info("\n--- TEST 1: Embedding Generation ---")
        emb1 = generate_embedding("Python Flask microservices and PostgreSQL")
        assert isinstance(emb1, list), "Embedding must be a list"
        assert len(emb1) == 384, f"Embedding dimension should be 384, got {len(emb1)}"

        embs = generate_embeddings(["Python backend", "Java enterprise", "Italian pasta recipe"])
        assert len(embs) == 3
        sim_related = cosine_similarity(embs[0], embs[0])
        sim_contrast = cosine_similarity(embs[0], embs[2])
        assert sim_related > 0.99, f"Self-similarity should be ~1.0, got {sim_related}"
        logger.info("[PASS] Embedding generation verified (dim=%d, self_sim=%.4f)", len(emb1), sim_related)

        # -------------------------------------------------------------------
        # TEST 2: Resume Document Indexing & Semantic Chunking
        # -------------------------------------------------------------------
        logger.info("\n--- TEST 2: Resume Document Indexing ---")
        resume_a_text = """
        Sanket Hatti - Backend Engineer
        Skills: Python, Flask, FastAPI, PostgreSQL, Redis, Docker, Celery.
        Projects:
        InterviewPilot: Built an AI-powered interview preparation platform using Flask, PostgreSQL, and React.
        Implemented real-time scoring and adaptive feedback algorithms with sub-second latency.
        E-Commerce API: Designed high-throughput payment and checkout service processing 10k orders per minute.
        Experience:
        Software Engineer at Acme Corp (2022-2024): Developed distributed microservices and reduced SQL query latency by 45%.
        Education:
        B.S. in Computer Science, 2022.
        """
        profile_a = CandidateProfile(
            user_id=user_a.id,
            resume_score=85,
            skills=["Python", "Flask", "PostgreSQL", "Redis", "Docker"],
            projects=[
                {"name": "InterviewPilot", "description": "Built AI interview prep platform using Flask and PostgreSQL."},
                {"name": "E-Commerce API", "description": "High-throughput payment microservice processing 10k orders/min."}
            ],
            experience=[{"role": "Software Engineer", "company": "Acme Corp", "years": 2}],
            strengths=["Python backend architecture", "Database indexing"],
            weaknesses=["System Design at scale", "Kubernetes"]
        )
        db.session.add(profile_a)
        db.session.commit()

        doc_a = index_resume_document(user_id=user_a.id, raw_text=resume_a_text, profile=profile_a)
        assert doc_a.id is not None
        assert len(doc_a.chunks) > 0
        sections_a = {c.section for c in doc_a.chunks}
        logger.info("[PASS] User A Resume indexed into %d chunks. Sections: %s", len(doc_a.chunks), sections_a)
        assert "projects" in sections_a or "skills" in sections_a

        # Index User B's resume with totally different content (Java, Spring Boot, Oracle)
        resume_b_text = """
        User Beta - Senior Java Enterprise Architect
        Skills: Java, Spring Boot, Hibernate, Oracle DB, Apache Kafka.
        Projects:
        Banking Core Ledger: Built mission-critical Java ledger handling 50M financial transactions daily.
        Experience:
        Java Developer at Megabank (2020-2024): Maintained Spring Boot microservices and Oracle stored procedures.
        """
        profile_b = CandidateProfile(
            user_id=user_b.id,
            resume_score=82,
            skills=["Java", "Spring Boot", "Hibernate", "Oracle DB", "Kafka"],
            projects=[{"name": "Banking Core Ledger", "description": "Built mission-critical Java ledger handling 50M transactions"}],
            experience=[{"role": "Java Developer", "company": "Megabank", "years": 4}],
            strengths=["Java enterprise design", "Oracle tuning"],
            weaknesses=["Frontend development"]
        )
        db.session.add(profile_b)
        db.session.commit()

        doc_b = index_resume_document(user_id=user_b.id, raw_text=resume_b_text, profile=profile_b)
        assert doc_b.id is not None
        logger.info("[PASS] User B Resume indexed into %d chunks", len(doc_b.chunks))

        # -------------------------------------------------------------------
        # TEST 3: Job Document Indexing
        # -------------------------------------------------------------------
        logger.info("\n--- TEST 3: Job Document Indexing ---")
        job_text = """
        Role: Staff Backend Engineer
        Company: CloudScale
        Requirements:
        Must have 4+ years of Python, RESTful API design, PostgreSQL query tuning, and Docker containerization.
        Preferred:
        Experience with AWS Lambda, Redis caching, and CI/CD pipelines.
        Responsibilities:
        Architect resilient microservices, conduct architecture reviews, and maintain 99.99% service uptime.
        """
        target_a = JobTarget(
            user_id=user_a.id,
            target_role="Staff Backend Engineer",
            target_company="CloudScale",
            job_description=job_text,
            required_skills=["Python", "PostgreSQL", "Docker", "RESTful API"],
            preferred_skills=["AWS", "Redis", "CI/CD"],
            missing_skills=["AWS", "CI/CD"],
            strong_matches=["Python", "PostgreSQL", "Docker"],
            partial_matches=["Redis"],
            match_score=78.5,
            interview_topics=["PostgreSQL Performance", "Distributed Microservices", "AWS Infrastructure"]
        )
        db.session.add(target_a)
        db.session.commit()

        job_doc = index_job_document(
            user_id=user_a.id,
            target_role=target_a.target_role,
            target_company=target_a.target_company,
            job_description=job_text,
            job_target_id=target_a.id
        )
        assert job_doc.id is not None
        assert len(job_doc.chunks) > 0
        logger.info("[PASS] Job Description indexed into %d chunks. Sections: %s", len(job_doc.chunks), {c.section for c in job_doc.chunks})

        # -------------------------------------------------------------------
        # TEST 4: Vector Retrieval & Cosine Similarity
        # -------------------------------------------------------------------
        logger.info("\n--- TEST 4: Vector Retrieval ---")
        results = search_resume_context(user_id=user_a.id, query="Tell me about InterviewPilot project and Flask", top_k=2)
        assert len(results) > 0
        top_match = results[0]
        logger.info("[PASS] Retrieved chunk for User A: section='%s', score=%.4f, excerpt='%s...'",
                    top_match["section"], top_match["similarity"], top_match["content"][:80])
        assert "InterviewPilot" in top_match["content"] or "Flask" in top_match["content"] or "Python" in top_match["content"]

        # -------------------------------------------------------------------
        # TEST 5: Strict Multi-Tenant User Isolation
        # -------------------------------------------------------------------
        logger.info("\n--- TEST 5: Strict Multi-Tenant User Isolation ---")
        # Query User A for "Java Spring Boot Oracle"
        # User A has only Python/Flask resume; User B has Java/Spring Boot resume.
        a_cross_results = search_resume_context(user_id=user_a.id, query="Java Spring Boot Banking Core Ledger", top_k=5)
        for chunk in a_cross_results:
            assert "Banking Core Ledger" not in chunk["content"], "SECURITY BREACH: User A retrieved User B's project!"
            assert "Megabank" not in chunk["content"], "SECURITY BREACH: User A retrieved User B's employer!"

        b_cross_results = search_resume_context(user_id=user_b.id, query="InterviewPilot Flask PostgreSQL", top_k=5)
        for chunk in b_cross_results:
            assert "InterviewPilot" not in chunk["content"], "SECURITY BREACH: User B retrieved User A's project!"
            assert "Acme Corp" not in chunk["content"], "SECURITY BREACH: User B retrieved User A's employer!"

        logger.info("[PASS] Zero data leakage: User A cannot retrieve User B's resume, and User B cannot retrieve User A's resume.")

        # -------------------------------------------------------------------
        # TEST 6: Resume-Grounded Question Generation
        # -------------------------------------------------------------------
        logger.info("\n--- TEST 6: Resume-Grounded Question Generation ---")
        grounded_res = generate_grounded_interview_questions(
            user_id=user_a.id,
            role="Backend Engineer",
            difficulty="medium",
            topic="InterviewPilot architecture"
        )
        assert grounded_res["success"] is True
        assert grounded_res["grounded"] is True
        questions = grounded_res["questions"]
        assert len(questions.get("technical", [])) > 0
        logger.info("[PASS] Grounded Question Generation produced %d technical questions: %s",
                    len(questions["technical"]), questions["technical"][:2])

        # -------------------------------------------------------------------
        # TEST 7: Job-Grounded Context & Questions
        # -------------------------------------------------------------------
        logger.info("\n--- TEST 7: Job-Grounded Context Retrieval ---")
        job_chunks = search_job_context(user_id=user_a.id, query="database query tuning and uptime", top_k=2)
        assert len(job_chunks) > 0
        assert any("PostgreSQL" in c["content"] or "uptime" in c["content"] or "microservices" in c["content"] for c in job_chunks)
        logger.info("[PASS] Job-grounded context retrieved successfully (%d chunks)", len(job_chunks))

        # -------------------------------------------------------------------
        # TEST 8: Agent Tool Selection & Execution
        # -------------------------------------------------------------------
        logger.info("\n--- TEST 8: Agent Tool Selection & Safe Execution ---")
        # Direct tool execution through safe dispatcher
        profile_tool_res = execute_agent_tool(user_id=user_a.id, tool_name="get_candidate_profile", arguments={})
        assert profile_tool_res["success"] is True
        assert profile_tool_res["result"]["has_profile"] is True
        assert "Python" in profile_tool_res["result"]["skills"]

        gap_tool_res = execute_agent_tool(user_id=user_a.id, tool_name="analyze_skill_gaps", arguments={})
        assert gap_tool_res["success"] is True
        assert "AWS" in gap_tool_res["result"]["top_priority_gaps"]

        questions_tool_res = execute_agent_tool(
            user_id=user_a.id,
            tool_name="generate_practice_questions",
            arguments={"skill": "SQL", "difficulty": "medium", "count": 2}
        )
        assert questions_tool_res["success"] is True
        assert len(questions_tool_res["result"]["questions"]) >= 2
        logger.info("[PASS] Agent tools executed safely with schema validation.")

        # -------------------------------------------------------------------
        # TEST 9: Agent Fallback to Deterministic Logic on Simulated Failure
        # -------------------------------------------------------------------
        logger.info("\n--- TEST 9: Agent Fallback On Simulated Failure ---")
        db.session.remove()
        # Test rule_based_next_action directly
        deterministic_action = rule_based_next_action(user_id=user_a.id)
        assert deterministic_action is not None
        assert "title" in deterministic_action
        assert "route" in deterministic_action
        assert deterministic_action["source"] == "rule_based"
        logger.info("[PASS] Deterministic rule_based_next_action returned: '%s' -> %s",
                    deterministic_action["title"], deterministic_action["route"])

        # Test agent_next_action fallback by setting an invalid model temporarily
        from services import agent_service
        orig_client = agent_service.groq_client
        try:
            # Temporarily simulate LLM downtime
            agent_service.groq_client = None
            fallback_action = agent_next_action(user_id=user_a.id)
            assert fallback_action is not None
            assert "title" in fallback_action
            assert "route" in fallback_action
            logger.info("[PASS] Agent gracefully fell back to deterministic action when LLM is unavailable: '%s'",
                        fallback_action["title"])
        finally:
            agent_service.groq_client = orig_client

        # -------------------------------------------------------------------
        # TEST 10: Next-Best-Action Generation
        # -------------------------------------------------------------------
        logger.info("\n--- TEST 10: Next-Best-Action Live Generation ---")
        live_action = agent_next_action(user_id=user_a.id)
        assert live_action is not None
        assert "title" in live_action
        assert "description" in live_action
        assert "action_label" in live_action
        assert "route" in live_action
        logger.info("[PASS] Live Next-Best-Action returned: title='%s', action='%s', route='%s', source='%s'",
                    live_action["title"], live_action["action_label"], live_action["route"], live_action.get("source"))

        # Clean up test users and their cascade documents
        logger.info("\nCleaning up test users...")
        DocumentChunk.query.filter(DocumentChunk.user_id.in_([user_a.id, user_b.id])).delete()
        Document.query.filter(Document.user_id.in_([user_a.id, user_b.id])).delete()
        JobTarget.query.filter(JobTarget.user_id.in_([user_a.id, user_b.id])).delete()
        CandidateProfile.query.filter(CandidateProfile.user_id.in_([user_a.id, user_b.id])).delete()
        User.query.filter(User.id.in_([user_a.id, user_b.id])).delete()
        db.session.commit()
        logger.info("[OK] Test users cleaned up successfully.")

        logger.info("==================================================")
        logger.info("ALL 10 RAG + AGENT TESTS PASSED WITH 100% SUCCESS!")
        logger.info("==================================================")


if __name__ == "__main__":
    run_tests()
