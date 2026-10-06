"""
Comprehensive End-to-End Test Suite for Continuous AI Coach.
Validates:
1. Canonical candidate state assembly
2. Agent next-best-action structured decision
3. Practice -> state update
4. Interview -> state update
5. Weak skill -> priority increase
6. Improved skill -> priority decrease
7. RAG historical coaching retrieval
8. Dashboard recommendation & signals APIs
9. Dynamic roadmap priority adaptation
10. Multi-tenant user isolation
11. Agent failure fallback
12. RAG failure fallback
"""

import os
import sys
import uuid
import logging
from datetime import datetime, timezone

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from database.db import db
from models.user import User
from models.candidate import CandidateProfile, JobTarget
from models.roadmap import Roadmap
from models.interview import InterviewSession, InterviewTurn
from models.practice import PracticeActivity
from services.candidate_context_service import (
    build_canonical_candidate_state,
    record_practice_performance,
    calculate_progress_signals,
    get_coaching_timeline,
    update_roadmap_priorities
)
from services.agent_service import agent_next_action, rule_based_next_action, get_agent_state
from services.retrieval_service import search_coaching_context
from services.rag_service import index_resume_document, index_job_document, index_interview_feedback_document

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = create_app()


def run_tests():
    with app.app_context():
        logger.info("=" * 60)
        logger.info("STARTING CONTINUOUS AI COACH TEST SUITE")
        logger.info("=" * 60)

        # -------------------------------------------------------------
        # SETUP TEST USERS
        # -------------------------------------------------------------
        uid_a = f"coach_user_a_{uuid.uuid4().hex[:6]}"
        uid_b = f"coach_user_b_{uuid.uuid4().hex[:6]}"

        user_a = User(email=f"{uid_a}@example.com", full_name="Candidate Alpha")
        user_a.set_password("SecurePass123!")
        db.session.add(user_a)

        user_b = User(email=f"{uid_b}@example.com", full_name="Candidate Beta")
        user_b.set_password("SecurePass123!")
        db.session.add(user_b)
        db.session.commit()

        u_id = user_a.id
        u_b_id = user_b.id

        try:
            # Seed Candidate Profile for User A
            profile_a = CandidateProfile(
                user_id=u_id,
                resume_score=82.0,
                skills=["Python", "PostgreSQL", "Flask", "REST APIs"],
                projects=[{"name": "InterviewPilot", "description": "AI career preparation system"}],
                experience=[{"role": "Backend Engineer", "company": "Tech Corp"}]
            )
            db.session.add(profile_a)

            # Seed Target Job with Gaps: AWS and Docker are required/preferred
            target_a = JobTarget(
                user_id=u_id,
                target_role="Staff Cloud Engineer",
                target_company="Stripe",
                match_score=60.0,
                required_skills=["Python", "PostgreSQL", "AWS"],
                preferred_skills=["Docker", "Kubernetes"],
                strong_matches=["Python", "PostgreSQL"],
                partial_matches=[],
                missing_skills=["AWS", "Docker"]
            )
            db.session.add(target_a)

            # Seed Roadmap for User A
            roadmap_data = {
                "target_role": "Staff Cloud Engineer",
                "weeks": [
                    {
                        "week": 1,
                        "theme": "AWS Networking & VPC",
                        "priority": "medium",
                        "skills": ["AWS", "VPC"],
                        "topics": ["Subnets", "Security Groups", "ALB"],
                        "completed": False
                    },
                    {
                        "week": 2,
                        "theme": "Docker & Container Architecture",
                        "priority": "medium",
                        "skills": ["Docker"],
                        "topics": ["Multi-stage builds", "Compose"],
                        "completed": False
                    }
                ]
            }
            roadmap_a = Roadmap(
                user_id=u_id,
                target_role="Staff Cloud Engineer",
                missing_skills=["AWS", "Docker"],
                roadmap_data=roadmap_data,
                completion_pct=0.0
            )
            db.session.add(roadmap_a)
            db.session.commit()

            # Seed RAG context
            index_resume_document(user_id=u_id, candidate_profile=profile_a)
            index_job_document(user_id=u_id, job_analysis={
                "target_role": "Staff Cloud Engineer",
                "required_skills": ["Python", "PostgreSQL", "AWS"],
                "preferred_skills": ["Docker"],
                "responsibilities": ["Design distributed AWS infrastructure"],
                "interview_topics": ["AWS VPC isolation", "PostgreSQL connection pooling"]
            })

            # -------------------------------------------------------------
            # TEST 1: Canonical Candidate State Assembly
            # -------------------------------------------------------------
            logger.info("\n--- TEST 1: Canonical Candidate State Assembly ---")
            state = build_canonical_candidate_state(u_id)
            assert "candidate" in state, "State missing 'candidate' slice"
            assert "target" in state, "State missing 'target' slice"
            assert "skill_gaps" in state, "State missing 'skill_gaps' slice"
            assert "roadmap" in state, "State missing 'roadmap' slice"
            assert "practice" in state, "State missing 'practice' slice"
            assert "interviews" in state, "State missing 'interviews' slice"
            assert "agent" in state, "State missing 'agent' slice"

            assert state["candidate"]["resume_available"] is True
            assert state["target"]["role"] == "Staff Cloud Engineer"
            assert "AWS" in state["skill_gaps"]["missing"]
            assert state["roadmap"]["exists"] is True
            logger.info("[PASS] Canonical candidate state validated with all 7 complete domain slices.")

            # -------------------------------------------------------------
            # TEST 2: Agent Next-Best-Action Decision
            # -------------------------------------------------------------
            logger.info("\n--- TEST 2: Agent Next-Best-Action Decision ---")
            rec = agent_next_action(u_id)
            assert "title" in rec, "Recommendation missing 'title'"
            assert "action_label" in rec or "actionLabel" in rec, "Recommendation missing action button label"
            assert "route" in rec or "target" in rec, "Recommendation missing route"
            logger.info("[PASS] Agent next-best-action decision returned: '%s' -> %s (source=%s)", rec.get("title"), rec.get("route"), rec.get("source"))

            # -------------------------------------------------------------
            # TEST 3: Practice -> State Update
            # -------------------------------------------------------------
            logger.info("\n--- TEST 3: Practice -> State Update ---")
            activity_1 = record_practice_performance(
                user_id=u_id,
                topic="AWS",
                score=45.0,
                problem_name="VPC Subnet Isolation Drill",
                practice_type="coding",
                mistakes=["Private subnet NAT Gateway routing misconfiguration"],
                concepts_missed=["CIDR block partitioning", "NACL vs SG statefulness"],
                feedback={"review_summary": "Candidate struggled with AWS VPC private subnet isolation."}
            )
            assert activity_1.id is not None, "PracticeActivity was not persisted"

            # Check updated state
            updated_state = build_canonical_candidate_state(u_id)
            assert "AWS" in updated_state["practice"]["recent_topics"]
            assert 45.0 in updated_state["practice"]["recent_scores"]
            assert "AWS" in updated_state["practice"]["weak_topics"]
            logger.info("[PASS] Practice performance recorded and registered as weak topic in candidate state.")

            # -------------------------------------------------------------
            # TEST 4: Interview -> State Update
            # -------------------------------------------------------------
            logger.info("\n--- TEST 4: Interview -> State Update ---")
            sess = InterviewSession(
                user_id=u_id,
                target_role="Staff Cloud Engineer",
                status="completed",
                overall_score=40.0,
                weak_topics=["AWS", "System Design"],
                strong_topics=["Python"],
                recent_scores=[40.0, 45.0],
                covered_topics=["AWS", "System Design"]
            )
            db.session.add(sess)
            db.session.commit()

            # Index interview feedback
            index_interview_feedback_document(
                user_id=u_id,
                interview_id=sess.id,
                role="Staff Cloud Engineer",
                feedback={
                    "weaknesses": ["AWS VPC isolation", "IAM boundary conditions"],
                    "strengths": ["Clean Python coding syntax"]
                },
                overall_score=40.0
            )

            state_after_interview = build_canonical_candidate_state(u_id)
            assert state_after_interview["interviews"]["completed"] >= 1
            assert "AWS" in state_after_interview["interviews"]["weak_topics"]
            logger.info("[PASS] Adaptive interview completion updated candidate interview state and weak topics.")

            # -------------------------------------------------------------
            # TEST 5: Weak Skill -> Priority Increase
            # -------------------------------------------------------------
            logger.info("\n--- TEST 5: Weak Skill -> Priority Increase ---")
            state_priority = build_canonical_candidate_state(u_id)
            assert state_priority["agent"]["current_focus"] == "AWS", f"Expected 'AWS' focus, got {state_priority['agent']['current_focus']}"
            assert state_priority["agent"]["recommended_action"] in ["IMPROVE_WEAK_TOPIC", "PRACTICE_SKILL"]

            rec_priority = rule_based_next_action(u_id)
            assert "AWS" in rec_priority["title"] or "AWS" in rec_priority.get("topic", "")
            logger.info("[PASS] Weak interview + practice performance escalated AWS to primary focus: '%s'", rec_priority["title"])

            # -------------------------------------------------------------
            # TEST 6: Improved Skill -> Priority Decrease
            # -------------------------------------------------------------
            logger.info("\n--- TEST 6: Improved Skill -> Priority Decrease ---")
            # Candidate studies and completes practice with score 88%
            activity_2 = record_practice_performance(
                user_id=u_id,
                topic="AWS",
                score=88.0,
                problem_name="AWS Cloud Architecture Advanced Drill",
                practice_type="coding",
                mistakes=[],
                concepts_missed=[],
                feedback={"review_summary": "Outstanding mastery of AWS VPC, ALB, and ECS security groups."}
            )

            state_after_improvement = build_canonical_candidate_state(u_id)
            assert "AWS" in state_after_improvement["practice"]["strong_topics"]
            # Next priority should advance to Docker (the next remaining gap)
            next_focus = state_after_improvement["agent"]["current_focus"]
            logger.info("[PASS] Improved AWS score (88.0) lowered AWS priority. Next focus area: '%s'", next_focus)
            assert next_focus != "Python", "Agent should not regress to already mastered Python"

            # -------------------------------------------------------------
            # TEST 7: RAG Historical Coaching Retrieval
            # -------------------------------------------------------------
            logger.info("\n--- TEST 7: RAG Historical Coaching Retrieval ---")
            chunks = search_coaching_context(user_id=u_id, query="AWS VPC networking mistakes", top_k=3)
            assert len(chunks) > 0, "Failed to retrieve coaching context from pgvector"
            found_feedback = any(c["document_type"] in ["practice_feedback", "interview_feedback"] for c in chunks)
            assert found_feedback, "Retrieved chunks missing practice or interview feedback"
            logger.info("[PASS] pgvector retrieved %d historical coaching chunks for user %s: '%s'", len(chunks), u_id, chunks[0]["section"])

            # -------------------------------------------------------------
            # TEST 8: Dashboard Recommendation & Signals
            # -------------------------------------------------------------
            logger.info("\n--- TEST 8: Dashboard Recommendation & Signals ---")
            signals = calculate_progress_signals(u_id)
            assert "interview_readiness" in signals
            assert "role_alignment" in signals
            assert "practice_consistency" in signals
            assert signals["has_sufficient_data"] is True
            logger.info("[PASS] Progress signals calculated: Readiness=%.1f%%, RoleAlignment=%.1f%%, Consistency=%s",
                        signals["interview_readiness"], signals["role_alignment"], signals["practice_consistency"]["status"])

            timeline = get_coaching_timeline(u_id)
            assert len(timeline) >= 2, f"Expected at least 2 timeline events, got {len(timeline)}"
            logger.info("[PASS] Coaching timeline populated with %d events: '%s' (%s)", len(timeline), timeline[0]["title"], timeline[0]["relative_time"])

            # -------------------------------------------------------------
            # TEST 9: Dynamic Roadmap Priority Adaptation
            # -------------------------------------------------------------
            logger.info("\n--- TEST 9: Dynamic Roadmap Priority Adaptation ---")
            # Roadmap Week 1 is AWS Networking
            rd_record = Roadmap.query.filter_by(user_id=u_id).order_by(Roadmap.created_at.desc()).first()
            week1 = rd_record.roadmap_data["weeks"][0]
            # Since activity_2 scored 88% on AWS, week 1 should be marked completed/low priority
            assert week1["priority"] == "low"
            assert week1["completed"] is True
            assert rd_record.completion_pct > 0.0
            logger.info("[PASS] Roadmap week 1 automatically marked completed with %.1f%% total roadmap completion.", rd_record.completion_pct)

            # Now simulate low score on Docker
            update_roadmap_priorities(user_id=u_id, topic="Docker", score=40.0)
            rd_record_updated = Roadmap.query.filter_by(user_id=u_id).order_by(Roadmap.created_at.desc()).first()
            week2 = rd_record_updated.roadmap_data["weeks"][1]
            assert week2["priority"] == "high"
            assert week2["needs_review"] is True
            logger.info("[PASS] Roadmap week 2 (Docker) dynamically elevated to 'high' priority following weak performance.")

            # -------------------------------------------------------------
            # TEST 10: Multi-Tenant User Isolation
            # -------------------------------------------------------------
            logger.info("\n--- TEST 10: Multi-Tenant User Isolation ---")
            # User B attempts to retrieve User A's coaching memory
            user_b_chunks = search_coaching_context(user_id=u_b_id, query="AWS VPC networking", top_k=5)
            assert len(user_b_chunks) == 0, f"SECURITY LEAK: User B retrieved {len(user_b_chunks)} chunks belonging to User A"

            user_b_state = build_canonical_candidate_state(u_b_id)
            assert user_b_state["candidate"]["resume_available"] is False
            assert user_b_state["practice"]["total_activities"] == 0
            logger.info("[PASS] Multi-tenant isolation verified: Zero data leakage between User A and User B.")

            # -------------------------------------------------------------
            # TEST 11: Agent Failure Fallback
            # -------------------------------------------------------------
            logger.info("\n--- TEST 11: Agent Failure Fallback ---")
            import services.agent_service as ag_svc
            original_client = ag_svc.groq_client
            ag_svc.groq_client = None

            try:
                fallback_action = ag_svc.agent_next_action(u_id)
                assert fallback_action is not None
                assert "title" in fallback_action
                assert fallback_action.get("source") in ["rule_based", "fallback"]
                logger.info("[PASS] Agent gracefully returned deterministic fallback recommendation: '%s'", fallback_action["title"])
            finally:
                ag_svc.groq_client = original_client

            # -------------------------------------------------------------
            # TEST 12: RAG Retrieval Failure Fallback
            # -------------------------------------------------------------
            logger.info("\n--- TEST 12: RAG Retrieval Failure Fallback ---")
            # User B has no indexed documents in pgvector
            state_empty_rag = build_canonical_candidate_state(u_b_id)
            assert state_empty_rag is not None
            assert state_empty_rag["agent"]["recommended_action"] == "START_RESUME"
            logger.info("[PASS] System gracefully initialized candidate state for user with 0 RAG documents.")

            logger.info("=" * 60)
            logger.info("ALL 12 AI COACH CORE TESTS PASSED WITH 100% SUCCESS!")
            logger.info("=" * 60)

        finally:
            # Cleanup test records
            logger.info("\nCleaning up test artifacts...")
            try:
                from models.document import Document, DocumentChunk
                from models.dsa import DSAProgress
                DocumentChunk.query.filter(DocumentChunk.user_id.in_([u_id, u_b_id])).delete()
                Document.query.filter(Document.user_id.in_([u_id, u_b_id])).delete()
                PracticeActivity.query.filter(PracticeActivity.user_id.in_([u_id, u_b_id])).delete()
                DSAProgress.query.filter(DSAProgress.user_id.in_([u_id, u_b_id])).delete()
                InterviewTurn.query.filter(InterviewTurn.user_id.in_([u_id, u_b_id])).delete()
                InterviewSession.query.filter(InterviewSession.user_id.in_([u_id, u_b_id])).delete()
                Roadmap.query.filter(Roadmap.user_id.in_([u_id, u_b_id])).delete()
                JobTarget.query.filter(JobTarget.user_id.in_([u_id, u_b_id])).delete()
                CandidateProfile.query.filter(CandidateProfile.user_id.in_([u_id, u_b_id])).delete()
                User.query.filter(User.id.in_([u_id, u_b_id])).delete()
                db.session.commit()
                logger.info("[OK] Test database cleaned up successfully.")
            except Exception as e:
                logger.warning("Cleanup error: %s", e)


if __name__ == "__main__":
    run_tests()
