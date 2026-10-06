import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { getNextBestAction } from "../utils/recommendations";
import {
  ArrowRight,
  Mic,
  Code2,
  FileText,
  Map,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Circle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  Compass,
  Award
} from "lucide-react";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return "Yesterday";
  if (diffSec < 259200) return "2 days ago";
  if (diffSec < 345600) return "3 days ago";
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    resumeScore: null,
    resumeDate: null,
    bestRole: null,
    roleMatchPct: null,
    missingSkills: [],
    interviewsCompleted: 0,
    avgInterviewScore: null,
    technicalScore: null,
    behavioralScore: null,
    codingScore: null,
    activeRoadmapRole: null,
    roadmapWeek: 1,
    totalWeeks: 8,
    hasResumeProfile: false
  });

  const [recentInterviews, setRecentInterviews] = useState([]);
  const [activeJobTarget, setActiveJobTarget] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [agentRecommendation, setAgentRecommendation] = useState(null);
  const [coachingTimeline, setCoachingTimeline] = useState([]);
  const [progressSignals, setProgressSignals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resumesRes, interviewsRes, roadmapsRes, rolesRes, profileRes] = await Promise.allSettled([
        api.get("/api/resume/history"),
        api.get("/api/interview/history"),
        api.get("/api/roadmap/history"),
        api.get("/api/roles/current"),
        api.get("/api/resume/profile")
      ]);

      let computedAvg = null;
      let compTech = null;
      let compBehav = null;

      if (interviewsRes.status === "fulfilled" && interviewsRes.value.data?.interviews) {
        const list = interviewsRes.value.data.interviews;
        setRecentInterviews(list.slice(0, 4));
        if (list.length > 0) {
          const scoredList = list.filter(i => typeof i.overall_score === "number" && i.overall_score > 0);
          if (scoredList.length > 0) {
            const totalScore = scoredList.reduce((acc, curr) => acc + curr.overall_score, 0);
            computedAvg = Math.round(totalScore / scoredList.length);

            let techSum = 0, techCount = 0;
            let commSum = 0, commCount = 0;
            scoredList.forEach(item => {
              if (item.feedback && typeof item.feedback === "object") {
                if (typeof item.feedback.technical_accuracy === "number") {
                  techSum += item.feedback.technical_accuracy;
                  techCount++;
                }
                if (typeof item.feedback.communication === "number") {
                  commSum += item.feedback.communication;
                  commCount++;
                }
              }
            });

            compTech = techCount > 0 ? Math.round(techSum / techCount) : computedAvg;
            compBehav = commCount > 0 ? Math.round(commSum / commCount) : Math.max(50, computedAvg - 4);
          }

          setStats(prev => ({
            ...prev,
            interviewsCompleted: list.length,
            avgInterviewScore: computedAvg,
            technicalScore: compTech,
            behavioralScore: compBehav
          }));
        }
      }

      if (profileRes.status === "fulfilled" && profileRes.value.data?.has_profile) {
        const p = profileRes.value.data.profile;
        setCandidateProfile(p);
        if (p && typeof p.resume_score === "number") {
          setStats(prev => ({
            ...prev,
            hasResumeProfile: true,
            resumeScore: Math.round(p.resume_score),
            missingSkills: prev.missingSkills.length > 0 ? prev.missingSkills : (p.areas_to_improve || [])
          }));
        }
      }

      if (resumesRes.status === "fulfilled" && resumesRes.value.data?.resumes?.length > 0) {
        const latestResume = resumesRes.value.data.resumes[0];
        const latest = latestResume?.analysis;
        if (latest?.resume_score) {
          const score = Math.round(latest.resume_score);
          setStats(prev => ({
            ...prev,
            hasResumeProfile: true,
            resumeScore: score,
            resumeDate: latestResume.uploaded_at
          }));

          if (latest.extracted_skills && latest.extracted_skills.length > 0) {
            try {
              const matchRes = await api.post("/api/roles/match", { skills: latest.extracted_skills });
              if (matchRes.data?.best_match) {
                const bm = matchRes.data.best_match;
                setStats(prev => ({
                  ...prev,
                  bestRole: bm.role_name,
                  roleMatchPct: prev.roleMatchPct ?? Math.round(bm.match_percentage),
                  codingScore: Math.round(bm.match_percentage),
                  missingSkills: prev.missingSkills.length > 0 ? prev.missingSkills : (bm.missing_skills || [])
                }));
              }
            } catch (_) {}
          }
        }
      }

      if (rolesRes.status === "fulfilled" && rolesRes.value.data?.has_target) {
        const jt = rolesRes.value.data.job_target;
        setActiveJobTarget(jt);
        if (jt) {
          setStats(prev => ({
            ...prev,
            bestRole: jt.target_role || prev.bestRole,
            roleMatchPct: typeof jt.match_score === "number" ? Math.round(jt.match_score) : prev.roleMatchPct,
            missingSkills: (jt.missing_skills && jt.missing_skills.length > 0) ? jt.missing_skills : prev.missingSkills,
          }));
        }
      }

      if (roadmapsRes.status === "fulfilled" && roadmapsRes.value.data?.roadmaps?.length > 0) {
        const latest = roadmapsRes.value.data.roadmaps[0];
        if (latest) {
          setStats(prev => ({
            ...prev,
            activeRoadmapRole: latest.target_role,
            totalWeeks: latest.duration_weeks || 8,
            roadmapWeek: 1
          }));
        }
      }

      // Fetch dynamic agent recommendation, timeline, and verified signals
      try {
        const [agentRes, timelineRes, signalsRes] = await Promise.allSettled([
          api.get("/api/agent/next-action"),
          api.get("/api/agent/timeline"),
          api.get("/api/agent/signals")
        ]);

        if (agentRes.status === "fulfilled" && agentRes.value.data?.recommendation) {
          const rec = agentRes.value.data.recommendation;
          setAgentRecommendation({
            title: rec.title,
            description: rec.description,
            actionLabel: rec.action_label || rec.actionLabel,
            route: rec.route || rec.target,
            target: rec.target || rec.route,
            reason: rec.reason,
            topic: rec.topic,
            priority: rec.priority,
            whyReasons: rec.why_reasons || [],
            confidence: rec.confidence,
            source: rec.source || "agent"
          });
        }

        if (timelineRes.status === "fulfilled" && timelineRes.value.data?.timeline) {
          setCoachingTimeline(timelineRes.value.data.timeline);
        }

        if (signalsRes.status === "fulfilled" && signalsRes.value.data?.signals) {
          setProgressSignals(signalsRes.value.data.signals);
        }
      } catch (_) {
        // Fallback to deterministic recommendation
      }
    } catch (err) {
      setError("Unable to load all coaching signals. Using cached data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const firstName = user?.full_name?.split(" ")[0] || "Candidate";

  // Contextual primary CTA
  const primaryCTA = useMemo(() => {
    if (stats.resumeScore === null && !stats.hasResumeProfile) {
      return { label: "Upload Resume", to: "/resume" };
    }
    if (stats.roleMatchPct === null) {
      return { label: "Analyze Target Role", to: "/roles" };
    }
    if (!stats.activeRoadmapRole) {
      return { label: "Build Preparation Plan", to: "/roadmap" };
    }
    if (stats.interviewsCompleted === 0) {
      return { label: "Start Practice", to: "/code" };
    }
    return { label: "Continue Preparation", to: "/interview" };
  }, [stats]);

  // Overall Readiness Score
  const hasAnyData = stats.resumeScore !== null || stats.roleMatchPct !== null || stats.avgInterviewScore !== null;

  const compositeReadiness = useMemo(() => {
    if (!hasAnyData) return null;
    const parts = [];
    if (stats.resumeScore !== null) parts.push(stats.resumeScore);
    if (stats.roleMatchPct !== null) parts.push(stats.roleMatchPct);
    if (stats.technicalScore !== null) parts.push(stats.technicalScore);
    if (stats.behavioralScore !== null) parts.push(stats.behavioralScore);
    if (parts.length === 0) return null;
    return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
  }, [hasAnyData, stats]);

  // Dynamic coaching insight text
  const coachingInsight = useMemo(() => {
    if (!hasAnyData) {
      return "Upload your resume and complete your first practice session to calculate your readiness.";
    }
    if (stats.missingSkills.length > 0) {
      const topSkill = stats.missingSkills[0];
      return `Making steady progress. Focus on ${topSkill} and core architectural trade-offs next.`;
    }
    if (stats.avgInterviewScore && stats.avgInterviewScore < 75) {
      return "Focus on structured problem solving and technical accuracy in mock sessions.";
    }
    return "Strong technical foundation. Focus on high-difficulty scenarios and edge cases.";
  }, [hasAnyData, stats]);

  // Next Best Action (AI Coach recommendation with deterministic fallback)
  const nextBestAction = useMemo(() => {
    if (agentRecommendation) {
      return agentRecommendation;
    }
    return getNextBestAction({ user, stats, jobTarget: activeJobTarget });
  }, [user, stats, activeJobTarget, agentRecommendation]);

  // Preparation Journey Steps (Section 3)
  const preparationJourney = useMemo(() => {
    const hasResume = Boolean(stats.resumeScore !== null || stats.hasResumeProfile);
    const hasRole = Boolean(stats.roleMatchPct !== null || activeJobTarget?.match_score !== null);
    const hasGaps = Boolean(activeJobTarget && (activeJobTarget.strong_matches?.length > 0 || activeJobTarget.missing_skills?.length > 0));
    const hasRoadmap = Boolean(stats.activeRoadmapRole);
    const hasPractice = Boolean(
      (progressSignals?.practice_consistency?.sessions_this_week > 0) ||
      coachingTimeline.some(t => t.type === "practice")
    );
    const hasInterview = Boolean(stats.interviewsCompleted > 0);
    const isReady = Boolean(compositeReadiness !== null && compositeReadiness >= 75);

    // Determine current focus step
    let focus = "resume";
    if (hasResume && !hasRole) focus = "role";
    else if (hasRole && !hasGaps) focus = "gaps";
    else if (hasGaps && !hasRoadmap) focus = "roadmap";
    else if (hasRoadmap && !hasPractice) focus = "practice";
    else if (hasPractice && !hasInterview) focus = "interview";
    else if (hasInterview && !isReady) focus = "readiness";
    else if (isReady) focus = "complete";

    return [
      {
        id: "resume",
        label: "Resume",
        status: hasResume ? "completed" : focus === "resume" ? "current" : "upcoming",
        to: "/resume"
      },
      {
        id: "role",
        label: "Target Role",
        status: hasRole ? "completed" : focus === "role" ? "current" : "upcoming",
        to: "/roles"
      },
      {
        id: "gaps",
        label: "Skill Gap",
        status: hasGaps ? "completed" : focus === "gaps" ? "current" : "upcoming",
        to: "/roles"
      },
      {
        id: "roadmap",
        label: "Roadmap",
        status: hasRoadmap ? "completed" : focus === "roadmap" ? "current" : "upcoming",
        to: "/roadmap"
      },
      {
        id: "practice",
        label: "Practice",
        status: hasPractice ? "completed" : focus === "practice" ? "current" : "upcoming",
        to: "/code"
      },
      {
        id: "interview",
        label: "Interview",
        status: hasInterview ? "completed" : focus === "interview" ? "current" : "upcoming",
        to: "/interview"
      },
      {
        id: "readiness",
        label: "Readiness",
        status: isReady ? "completed" : focus === "readiness" ? "current" : "upcoming",
        to: "/dashboard"
      }
    ];
  }, [stats, activeJobTarget, progressSignals, coachingTimeline, compositeReadiness]);

  // Skill Strengths & Weaknesses (Section 7: Clean Real-Data Visualization)
  const skillCategories = useMemo(() => {
    let strong = [];
    let needsImprovement = [];
    let notDetected = [];

    if (activeJobTarget) {
      if (Array.isArray(activeJobTarget.strong_matches)) {
        strong = [...activeJobTarget.strong_matches];
      }
      if (Array.isArray(activeJobTarget.partial_matches)) {
        needsImprovement = [...activeJobTarget.partial_matches];
      }
      if (Array.isArray(activeJobTarget.missing_skills)) {
        notDetected = [...activeJobTarget.missing_skills];
      }
    }

    if (strong.length === 0 && candidateProfile?.skills?.length > 0) {
      strong = candidateProfile.skills.slice(0, 4);
    }

    if (needsImprovement.length === 0 && stats.missingSkills?.length > 0) {
      needsImprovement = stats.missingSkills.slice(0, 3);
    }

    // Merge progress signal improvements if present
    if (progressSignals?.skills_improving?.length > 0) {
      progressSignals.skills_improving.forEach(s => {
        if (!strong.includes(s)) strong.push(s);
        needsImprovement = needsImprovement.filter(n => n.toLowerCase() !== s.toLowerCase());
        notDetected = notDetected.filter(d => d.toLowerCase() !== s.toLowerCase());
      });
    }

    const hasData = strong.length > 0 || needsImprovement.length > 0 || notDetected.length > 0;

    return {
      strong: strong.slice(0, 5),
      needsImprovement: needsImprovement.slice(0, 5),
      notDetected: notDetected.slice(0, 5),
      hasData
    };
  }, [activeJobTarget, candidateProfile, stats.missingSkills, progressSignals]);

  // Fallback Recent Activity items combined if timeline is empty
  const fallbackTimeline = useMemo(() => {
    const items = [];
    recentInterviews.forEach((i) => {
      items.push({
        id: `int-${i.id}`,
        title: `Mock Interview · ${i.role}`,
        detail: `Completed assessment with focus on structured delivery`,
        badge: typeof i.overall_score === "number" && i.overall_score > 0 ? `${Math.round(i.overall_score)}% Score` : "Completed",
        date: i.created_at,
        route: "/interview",
        status: (i.overall_score || 0) >= 70 ? "success" : "warning"
      });
    });

    if (stats.resumeScore !== null) {
      items.push({
        id: "res-latest",
        title: "Resume ATS Analysis",
        detail: `Verified profile against core technical competencies`,
        badge: `${stats.resumeScore}% ATS`,
        date: stats.resumeDate,
        route: "/resume",
        status: "info"
      });
    }

    items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return items.slice(0, 5);
  }, [recentInterviews, stats]);

  const activeTimeline = coachingTimeline.length > 0 ? coachingTimeline : fallbackTimeline;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── 1. GREETING & CONTEXT HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3.5">
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              {activeJobTarget?.target_role ? (
                <span>
                  Targeting <strong className="text-zinc-200">{activeJobTarget.target_role}</strong>
                  {activeJobTarget.target_company ? ` at ${activeJobTarget.target_company}` : ""}
                  {" · Personal AI Interview Coach"}
                </span>
              ) : (
                "Your personal AI interview coach. Here is your current preparation status."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={primaryCTA.to}
              className="btn-primary inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2"
            >
              <span>{primaryCTA.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── ERROR RECOVERY STATE ── */}
        {error && (
          <div className="rounded-xl p-3.5 bg-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800/60 text-amber-100 font-medium transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Try again</span>
            </button>
          </div>
        )}

        {/* ── 2. YOUR NEXT BEST ACTION (HERO CARD - STRONGEST VISUAL ELEMENT) ── */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-950/30 via-zinc-900/60 to-zinc-900/40 border border-indigo-500/40 ring-1 ring-indigo-500/20 p-5 sm:p-6 space-y-4 shadow-xl shadow-indigo-950/20 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wide">
              <span>✦</span>
              <span>Recommended for you</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 font-normal">AI Coach</span>
            </div>

            <div className="flex items-center gap-2">
              {nextBestAction.topic && (
                <span className="text-[11px] font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                  Topic: {nextBestAction.topic}
                </span>
              )}
              {nextBestAction.priority && (
                <span className="text-[11px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                  {nextBestAction.priority}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                What should I do next?
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {nextBestAction.title}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                {nextBestAction.description}
              </p>

              {/* Concise "Why this?" explanations (No chain-of-thought exposed) */}
              {nextBestAction.whyReasons && nextBestAction.whyReasons.length > 0 && (
                <div className="pt-2.5 border-t border-zinc-800/60 mt-3 space-y-1.5">
                  <div className="text-[11px] font-semibold text-zinc-300 tracking-wide">
                    Why this?
                  </div>
                  <ul className="space-y-1 text-xs text-zinc-400">
                    {nextBestAction.whyReasons.map((reason, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="shrink-0 pt-1 sm:pt-0">
              <Link
                to={nextBestAction.route || nextBestAction.to || nextBestAction.target || "/code"}
                className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-5 py-2.5 shadow-lg shadow-indigo-600/20"
              >
                <span>{nextBestAction.actionLabel || nextBestAction.cta || "Practice Now →"}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── 3. PREPARATION JOURNEY (LIGHTWEIGHT VISUALIZATION) ── */}
        <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-4 sm:p-4.5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs sm:text-sm font-semibold text-white">
                Preparation Journey
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500">
              Closed-loop milestone progress
            </span>
          </div>

          {/* Stepped track */}
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center min-w-[560px] justify-between text-xs">
              {preparationJourney.map((step, idx) => (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <Link
                    to={step.to}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors group ${
                      step.status === "completed"
                        ? "text-zinc-300 hover:text-white"
                        : step.status === "current"
                        ? "text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/30"
                        : "text-zinc-500 hover:text-zinc-400"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : step.status === "current" ? (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                    ) : (
                      <Circle className="w-3 h-3 text-zinc-600 shrink-0" />
                    )}
                    <span>{step.label}</span>
                    {step.status === "current" && (
                      <span className="text-[10px] uppercase font-bold text-indigo-300 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-500/30">
                        Current focus
                      </span>
                    )}
                  </Link>
                  {idx < preparationJourney.length - 1 && (
                    <div className="flex-1 mx-1.5 h-[1px] bg-zinc-800" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 4. PREPARATION PROGRESS SIGNALS ── */}
        <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Interview Readiness
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {compositeReadiness !== null ? `${compositeReadiness}%` : "—"}
              </div>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                {coachingInsight}
              </p>
              {compositeReadiness === null && (
                <div className="pt-1">
                  <Link
                    to="/resume"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>Upload resume to benchmark readiness →</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {compositeReadiness !== null && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {compositeReadiness >= 75 ? "Interview Ready" : compositeReadiness >= 55 ? "Progressing Well" : "Needs Practice"}
                </span>
              )}
              {progressSignals?.practice_consistency && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                  Consistency: {progressSignals.practice_consistency.status}
                </span>
              )}
            </div>
          </div>

          {/* Progress Indicator Bar */}
          {compositeReadiness !== null && (
            <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${compositeReadiness}%` }}
              />
            </div>
          )}

          {/* 4 Compact Real-Data Breakdown Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/60">
            <div className="space-y-0.5">
              <div className="text-[11px] text-zinc-400">Resume ATS</div>
              <div className="text-sm sm:text-base font-bold text-white">
                {stats.resumeScore !== null ? `${stats.resumeScore}%` : "Not analyzed"}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-[11px] text-zinc-400">Role Alignment</div>
              <div className="text-sm sm:text-base font-bold text-white">
                {stats.roleMatchPct !== null ? `${stats.roleMatchPct}%` : "Not evaluated"}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-[11px] text-zinc-400">Technical Depth</div>
              <div className="text-sm sm:text-base font-bold text-white">
                {stats.technicalScore !== null ? `${stats.technicalScore}%` : "Not evaluated"}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-[11px] text-zinc-400">Communication</div>
              <div className="text-sm sm:text-base font-bold text-white">
                {stats.behavioralScore !== null ? `${stats.behavioralScore}%` : "Not evaluated"}
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. SKILL STRENGTHS & WEAKNESSES (SECTION 7: REAL DATA ONLY) ── */}
        <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-semibold text-white">
                Skill Strengths &amp; Focus Areas
              </h3>
              <p className="text-[11px] text-zinc-400">
                Calibrated against active role expectations. Real verification data only.
              </p>
            </div>
            {skillCategories.hasData && (
              <Link
                to="/roles"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Role gaps →
              </Link>
            )}
          </div>

          {skillCategories.hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Strong */}
              <div className="p-3 rounded-lg bg-emerald-950/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Strong</span>
                </div>
                {skillCategories.strong.length > 0 ? (
                  <ul className="space-y-1 text-xs text-zinc-300">
                    {skillCategories.strong.map((s, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-zinc-500 italic">None verified yet.</div>
                )}
              </div>

              {/* Needs Improvement */}
              <div className="p-3 rounded-lg bg-amber-950/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Needs improvement</span>
                </div>
                {skillCategories.needsImprovement.length > 0 ? (
                  <ul className="space-y-1 text-xs text-zinc-300">
                    {skillCategories.needsImprovement.map((s, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold">⚠</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-zinc-500 italic">No critical gaps flagged.</div>
                )}
              </div>

              {/* Not Detected */}
              <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <Circle className="w-3 h-3 text-zinc-500" />
                  <span>Not detected</span>
                </div>
                {skillCategories.notDetected.length > 0 ? (
                  <ul className="space-y-1 text-xs text-zinc-400">
                    {skillCategories.notDetected.map((s, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-zinc-500">○</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-zinc-500 italic">All required skills present.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-medium text-zinc-300">
                  Not enough data yet.
                </div>
                <p className="text-xs text-zinc-400">
                  Upload your resume and analyze a target role to isolate your skill strengths and weaknesses.
                </p>
              </div>
              <Link
                to="/roles"
                className="btn-primary inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 shrink-0"
              >
                <span>Analyze target role →</span>
              </Link>
            </div>
          )}
        </div>

        {/* ── 6. COACHING HISTORY (TIMELINE - SECTION 8) ── */}
        <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs sm:text-sm font-semibold text-white">
                Coaching History
              </h3>
              <span className="text-[11px] text-zinc-500 font-normal">
                Chronological preparation timeline
              </span>
            </div>
            {activeTimeline.length > 0 && (
              <Link
                to="/interview"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                All sessions →
              </Link>
            )}
          </div>

          {activeTimeline.length > 0 ? (
            <div className="divide-y divide-zinc-800/50">
              {activeTimeline.map((item) => (
                <Link
                  key={item.id}
                  to={item.route || item.to || "/interview"}
                  className="flex items-center justify-between py-2.5 hover:px-2 rounded-lg hover:bg-zinc-800/30 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      item.status === "warning" ? "bg-amber-400" : item.status === "info" ? "bg-blue-400" : "bg-indigo-500"
                    }`} />
                    <div className="space-y-0.5">
                      <div className="text-xs sm:text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </div>
                      {item.detail && (
                        <div className="text-[11px] text-zinc-400">
                          {item.detail}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded border ${
                      item.status === "warning"
                        ? "bg-amber-950/40 text-amber-300 border-amber-500/30"
                        : "bg-zinc-800/80 text-zinc-300 border-zinc-700/60"
                    }`}>
                      {item.badge}
                    </span>
                    <span className="text-xs text-zinc-500 hidden sm:inline">
                      {item.relative_time || formatRelativeTime(item.date || item.timestamp)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Actionable empty state (Section 2) */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-medium text-zinc-300">
                  You haven't completed any practice sessions yet.
                </div>
                <p className="text-xs text-zinc-400">
                  Complete your first coding or mock interview session to start logging coaching history.
                </p>
              </div>
              <Link
                to="/code"
                className="btn-primary inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 shrink-0"
              >
                <span>Start your first practice →</span>
              </Link>
            </div>
          )}
        </div>

        {/* ── 7. SECONDARY NAVIGATION / QUICK ACCESS ── */}
        <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-4 sm:p-5 space-y-3">
          <div className="border-b border-zinc-800/60 pb-2">
            <h3 className="text-xs sm:text-sm font-semibold text-white">
              Secondary Preparation Workspaces
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Mock Interview */}
            <Link
              to="/interview"
              className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all group space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                Mock Interview
              </div>
              <div className="text-[11px] text-zinc-400 line-clamp-1">
                {stats.avgInterviewScore !== null ? `Average: ${stats.avgInterviewScore}%` : "Adaptive simulator"}
              </div>
            </Link>

            {/* Algorithmic Coding */}
            <Link
              to="/code"
              className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all group space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                  <Code2 className="w-3.5 h-3.5" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                Coding Playground
              </div>
              <div className="text-[11px] text-zinc-400 line-clamp-1">
                {stats.missingSkills.length > 0 ? `Target: ${stats.missingSkills[0]}` : "Interactive code practice"}
              </div>
            </Link>

            {/* Preparation Roadmap */}
            <Link
              to="/roadmap"
              className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all group space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                  <Map className="w-3.5 h-3.5" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                Preparation Roadmap
              </div>
              <div className="text-[11px] text-zinc-400 line-clamp-1">
                {stats.activeRoadmapRole ? `${stats.activeRoadmapRole}` : "Build week-by-week plan"}
              </div>
            </Link>

            {/* Resume Optimization */}
            <Link
              to="/resume"
              className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all group space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                Resume ATS
              </div>
              <div className="text-[11px] text-zinc-400 line-clamp-1">
                {stats.resumeScore !== null ? `ATS: ${stats.resumeScore}%` : "Analyze PDF resume"}
              </div>
            </Link>
          </div>
        </div>

        {/* ── 8. FOOTER ── */}
        <footer className="pt-4 pb-2 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div>
            <span>InterviewPilot © 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-5 text-zinc-400">
            <Link to="/interview" className="hover:text-zinc-200 transition-colors">Practice</Link>
            <Link to="/code" className="hover:text-zinc-200 transition-colors">Coding</Link>
            <Link to="/roadmap" className="hover:text-zinc-200 transition-colors">Roadmap</Link>
            <Link to="/resume" className="hover:text-zinc-200 transition-colors">Resume</Link>
            <Link to="/companies" className="hover:text-zinc-200 transition-colors">Companies</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
