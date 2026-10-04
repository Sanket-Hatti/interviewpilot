/**
 * Recommendation Engine for InterviewPilot (Agentic Workflow Foundation)
 * Evaluates real candidate state and deterministically calculates the Next Best Action.
 * 
 * Future agent hook: This pure function can be swapped with or augmented by
 * an asynchronous call to the InterviewPilot Adaptive Agent.
 *
 * @param {Object} params
 * @param {Object} params.user Current authenticated user profile
 * @param {Object} params.stats Current dashboard metrics and history
 * @returns {Object} { title, description, actionLabel, route, reason }
 */
export function getNextBestAction({ user, stats }) {
  // STATE 1 — NEW USER (No resume uploaded)
  if (!stats || stats.resumeScore === null) {
    return {
      title: "Start with your resume",
      description: "Upload your resume so InterviewPilot can understand your skills and create your personalized preparation plan.",
      actionLabel: "Analyze my resume →",
      route: "/resume",
      reason: "resume_missing"
    };
  }

  // STATE 2 — RESUME EXISTS, TARGET ROLE MISSING
  const effectiveRole = user?.target_role || stats.bestRole;
  if (!effectiveRole) {
    return {
      title: "Choose your target role",
      description: "Tell InterviewPilot what role you're preparing for so we can identify the skills that matter.",
      actionLabel: "Set target role →",
      route: "/roles",
      reason: "target_role_missing"
    };
  }

  // STATE 3 — RESUME + ROLE EXIST, ROLE ANALYSIS PENDING
  if (stats.roleMatchPct === null) {
    return {
      title: "Analyze your target role",
      description: "Compare your profile with the requirements of your target role and identify your skill gaps.",
      actionLabel: "Analyze role →",
      route: "/roles",
      reason: "role_analysis_pending"
    };
  }

  // STATE 4 — ROLE ANALYSIS COMPLETE, ROADMAP PENDING
  if (!stats.activeRoadmapRole) {
    return {
      title: "Build your preparation plan",
      description: "Your profile is ready. Generate a personalized roadmap based on your target role and skill gaps.",
      actionLabel: "Generate my plan →",
      route: "/roadmap",
      reason: "roadmap_pending"
    };
  }

  // STATE 5 — USER HAS PRACTICE / GAP HISTORY
  // 5a. Missing Skills Gap (e.g. SQL, AWS, System Design, or top missing skill)
  if (stats.missingSkills && stats.missingSkills.length > 0) {
    const skill = stats.missingSkills[0];
    const sLower = skill.toLowerCase();
    let title = `Strengthen ${skill}`;
    if (sLower.includes("sql")) title = "Improve SQL JOINs";
    else if (sLower.includes("aws")) title = "Improve your AWS fundamentals";
    else if (sLower.includes("system") || sLower.includes("design")) title = "Strengthen system design";

    return {
      title,
      description: `Your benchmark for ${effectiveRole} shows ${skill} is currently an identified skill gap. Practice questions to close this gap.`,
      actionLabel: "Start practice →",
      route: "/code",
      reason: "skill_gap"
    };
  }

  // 5b. First interview needed
  if (!stats.interviewsCompleted || stats.interviewsCompleted === 0) {
    return {
      title: "Complete your first practice session",
      description: "Take a baseline simulation to benchmark technical knowledge, communication, and STAR-format responses.",
      actionLabel: "Start interview →",
      route: "/interview",
      reason: "baseline_interview_needed"
    };
  }

  // 5c. Behavioral score lower than technical score
  if (
    stats.behavioralScore !== null &&
    stats.technicalScore !== null &&
    stats.behavioralScore < stats.technicalScore
  ) {
    return {
      title: "Practice behavioral questions",
      description: "Sharpen structured storytelling using the STAR framework to raise your communication evaluation score.",
      actionLabel: "Practice behavioral →",
      route: "/interview",
      reason: "behavioral_lower"
    };
  }

  // 5d. Recent interview average below 80%
  if (stats.avgInterviewScore !== null && stats.avgInterviewScore < 80) {
    return {
      title: "Try another mock interview",
      description: `Your recent practice average is ${stats.avgInterviewScore}%. Take another session to sharpen structured delivery and technical depth.`,
      actionLabel: "Practice again →",
      route: "/interview",
      reason: "score_improvement"
    };
  }

  // 5e. Default: Company track preparation
  return {
    title: "Explore target company tracks",
    description: "Review specific interview formats, question patterns, and prep playbooks for American Express, TCS, Infosys, and more.",
    actionLabel: "Explore tracks →",
    route: "/companies",
    reason: "company_prep"
  };
}
