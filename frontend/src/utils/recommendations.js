/**
 * Recommendation Engine for InterviewPilot (Agentic Workflow Foundation)
 * Evaluates real candidate state and deterministically calculates the Next Best Action.
 * 
 * Safe Migration Path:
 * getNextBestAction() & rule_based_next_action() provide guaranteed deterministic fallbacks,
 * while fetchAgentNextAction() queries the autonomous InterviewPilot Agent.
 *
 * @param {Object} params
 * @param {Object} params.user Current authenticated user profile
 * @param {Object} params.stats Current dashboard metrics and history
 * @param {Object} [params.jobTarget] Active JobTarget entity
 * @returns {Object} { title, description, actionLabel, route, reason }
 */
export function rule_based_next_action({ user, stats, jobTarget }) {
  return getNextBestAction({ user, stats, jobTarget });
}

export function getNextBestAction({ user, stats, jobTarget }) {
  const hasResume = Boolean(stats && (stats.resumeScore !== null || stats.hasResumeProfile));
  const effectiveRole = jobTarget?.target_role || user?.target_role || stats?.bestRole;
  const hasRoleAnalysis = Boolean(jobTarget?.match_score !== null && jobTarget?.match_score !== undefined || stats?.roleMatchPct !== null);
  const hasRoadmap = Boolean(stats?.activeRoadmapRole);
  const interviewsDone = stats?.interviewsCompleted || 0;
  const missingSkills = (jobTarget?.missing_skills && jobTarget.missing_skills.length > 0)
    ? jobTarget.missing_skills
    : (stats?.missingSkills || []);

  // STEP 1 — NO RESUME UPLOADED
  if (!hasResume) {
    return {
      title: "Start with your resume",
      description: "Upload your resume so InterviewPilot can extract your genuine skills and build your verified candidate profile.",
      actionLabel: "Analyze my resume →",
      route: "/resume",
      target: "/resume",
      reason: "resume_missing",
      topic: "Resume Analysis",
      priority: "High Priority",
      whyReasons: [
        "Resume analysis required to benchmark your skills",
        "Enables personalized preparation roadmap",
        "Identifies verified technical strengths"
      ]
    };
  }

  // STEP 2 — RESUME ANALYZED, TARGET ROLE / JOB ANALYSIS PENDING
  if (!hasRoleAnalysis) {
    return {
      title: "Analyze your target role",
      description: effectiveRole
        ? `Benchmark your profile against requirements for ${effectiveRole} and identify your isolated skill gaps.`
        : "Compare your candidate profile with target job descriptions to identify exact market skill gaps.",
      actionLabel: "Analyze target role →",
      route: "/roles",
      target: "/roles",
      reason: "role_analysis_pending",
      topic: "Target Role Benchmark",
      priority: "High Priority",
      whyReasons: [
        "Role benchmark isolates critical skill gaps",
        "Calibrates mock interview difficulty",
        "Tailors roadmap to company expectations"
      ]
    };
  }

  // STEP 3 — ROLE & SKILL GAPS ANALYZED, ROADMAP PENDING
  if (!hasRoadmap) {
    return {
      title: "Build your preparation plan",
      description: `Your ${effectiveRole || "role"} benchmark is ready with ${missingSkills.length} identified focus areas. Generate a week-by-week curriculum.`,
      actionLabel: "Generate my plan →",
      route: "/roadmap",
      target: "/roadmap",
      reason: "roadmap_pending",
      topic: "Preparation Roadmap",
      priority: "High Priority",
      whyReasons: [
        "Transforms skill gaps into week-by-week milestones",
        "Structures practice hours to your target timeline",
        `Prioritizes must-have skills for ${effectiveRole || "your target role"}`
      ]
    };
  }

  // STEP 4 — ROADMAP CREATED, BEFORE INITIAL PRACTICE ON IDENTIFIED GAP
  const topGap = missingSkills.length > 0 ? missingSkills[0] : "SQL";
  const gapLower = topGap.toLowerCase();

  if (interviewsDone === 0) {
    return {
      title: `Start ${topGap} practice`,
      description: `Your customized preparation roadmap prioritizes ${topGap} as your primary gap for ${effectiveRole || "your target role"}. Begin focused technical practice.`,
      actionLabel: `Start ${topGap} practice →`,
      route: "/code",
      target: "/code",
      reason: "start_gap_practice",
      topic: topGap,
      priority: "High Priority",
      whyReasons: [
        "Required by your target role",
        "Primary gap identified in your roadmap",
        "High-impact preparation area"
      ]
    };
  }

  // STEP 5 — AFTER PRACTICE / MOCK SESSIONS COMPLETED
  // 5a. Deepen specific skill topic (e.g. SQL JOINs, AWS fundamentals)
  if (gapLower.includes("sql")) {
    return {
      title: "Improve SQL JOINs",
      description: "Based on your technical practice, focus on complex multi-table JOINs, subqueries, and indexing optimization.",
      actionLabel: "Practice SQL JOINs →",
      route: "/code",
      target: "/code",
      reason: "deepen_sql_joins",
      topic: "SQL Optimization",
      priority: "Medium",
      whyReasons: [
        "Required by your target role",
        "Weak in your recent interview or practice",
        "High-impact preparation area"
      ]
    };
  }

  if (gapLower.includes("aws") || gapLower.includes("cloud")) {
    return {
      title: "Improve AWS fundamentals",
      description: "Sharpen architecture knowledge on IAM policies, ECS container orchestration, and VPC networking for upcoming rounds.",
      actionLabel: "Practice AWS concepts →",
      route: "/interview",
      target: "/interview",
      reason: "deepen_aws",
      topic: "AWS Networking",
      priority: "High Priority",
      whyReasons: [
        "Required by your target role",
        "Weak in your recent interview",
        "High-impact preparation area"
      ]
    };
  }

  // 5b. Behavioral calibration if communication is lower than technical
  if (
    stats.behavioralScore !== null &&
    stats.technicalScore !== null &&
    stats.behavioralScore < stats.technicalScore
  ) {
    return {
      title: "Practice behavioral questions",
      description: "Sharpen structured storytelling using the STAR framework to raise your communication readiness rating.",
      actionLabel: "Practice behavioral →",
      route: "/interview",
      target: "/interview",
      reason: "behavioral_lower",
      topic: "STAR Behavioral",
      priority: "High Priority",
      whyReasons: [
        "Communication score lower than technical score",
        "STAR framework required for behavioral rounds",
        "Key evaluation factor in final loops"
      ]
    };
  }

  // 5c. Recent mock interview average below 80%
  if (stats.avgInterviewScore !== null && stats.avgInterviewScore < 80) {
    return {
      title: "Try another mock interview",
      description: `Your recent practice average is ${stats.avgInterviewScore}%. Take another simulation to solidify structured response delivery.`,
      actionLabel: "Practice again →",
      route: "/interview",
      target: "/interview",
      reason: "score_improvement",
      topic: "Adaptive Mock",
      priority: "Medium",
      whyReasons: [
        `Recent mock interview average is ${stats.avgInterviewScore}%`,
        "Tests live problem solving under time constraints",
        "Calibrates adaptive difficulty"
      ]
    };
  }

  // 5d. Company specific playbook
  if (jobTarget?.target_company) {
    return {
      title: `Explore ${jobTarget.target_company} interview playbook`,
      description: `Review specific round structures, evaluation criteria, and known problem patterns for ${jobTarget.target_company}.`,
      actionLabel: "Explore company track →",
      route: "/companies",
      target: "/companies",
      reason: "company_prep",
      topic: jobTarget.target_company,
      priority: "Medium",
      whyReasons: [
        `${jobTarget.target_company} specific hiring bar`,
        "Enterprise-specific evaluation rubrics",
        "High-yield targeted practice"
      ]
    };
  }

  // 5e. General company tracks
  return {
    title: "Explore target company tracks",
    description: "Review specific interview formats, question patterns, and prep playbooks for American Express, TCS, Infosys, and more.",
    actionLabel: "Explore tracks →",
    route: "/companies",
    target: "/companies",
    reason: "company_prep",
    topic: "Enterprise Playbooks",
    priority: "Medium",
    whyReasons: [
      "Company-specific question formats",
      "Benchmark against top tech firms",
      "Comprehensive interview readiness"
    ]
  };
}

