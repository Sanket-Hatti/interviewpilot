import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { getNextBestAction } from "../utils/recommendations";
import {
  ArrowRight,
  Mic,
  Code2,
  FileText
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
    totalWeeks: 8
  });

  const [recentInterviews, setRecentInterviews] = useState([]);
  const [activeJobTarget, setActiveJobTarget] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
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
      } catch (err) {
        // Silent fallback
      }
    };
    fetchData();
  }, []);

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

  // Dynamic coaching insight text when data exists
  const coachingInsight = useMemo(() => {
    if (!hasAnyData) {
      return "Upload your resume and complete your first practice session to calculate your readiness.";
    }
    if (stats.missingSkills.length > 0) {
      const topSkill = stats.missingSkills[0];
      return `You're making steady progress. Focus on ${topSkill} and system design next.`;
    }
    if (stats.avgInterviewScore && stats.avgInterviewScore < 75) {
      return "Focus on structured problem solving and technical accuracy in mock sessions.";
    }
    return "Strong technical foundation. Focus on high-difficulty behavioral and live coding scenarios.";
  }, [hasAnyData, stats]);

  // Next Best Action (AI Recommendation Foundation - agentic ready)
  const nextBestAction = useMemo(() => {
    return getNextBestAction({ user, stats, jobTarget: activeJobTarget });
  }, [user, stats, activeJobTarget]);

  // Recent Activity items combined
  const recentActivity = useMemo(() => {
    const items = [];
    recentInterviews.forEach((i) => {
      items.push({
        id: `int-${i.id}`,
        title: `Mock Interview · ${i.role}`,
        badge: typeof i.overall_score === "number" && i.overall_score > 0 ? `${Math.round(i.overall_score)}%` : "Completed",
        date: i.created_at,
        to: "/interview"
      });
    });

    if (stats.resumeScore !== null) {
      items.push({
        id: "res-latest",
        title: "Resume ATS Analysis",
        badge: `${stats.resumeScore}% Score`,
        date: stats.resumeDate,
        to: "/resume"
      });
    }

    items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return items.slice(0, 4);
  }, [recentInterviews, stats]);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── 1. COMPACT HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3.5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Here's your interview preparation progress and what to focus on next.
            </p>
          </div>

          <div>
            <Link
              to={primaryCTA.to}
              className="btn-primary inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2"
            >
              <span>{primaryCTA.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── 2. COMPACT READINESS SECTION ── */}
        <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-4 sm:p-5 space-y-3">
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
                    <span>Get started →</span>
                  </Link>
                </div>
              )}
            </div>

            {compositeReadiness !== null && (
              <div className="shrink-0 pt-0.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {compositeReadiness >= 75 ? "Interview Ready" : compositeReadiness >= 55 ? "Progressing Well" : "Needs Practice"}
                </span>
              </div>
            )}
          </div>

          {/* Progress Indicator Bar (shown when score exists) */}
          {compositeReadiness !== null && (
            <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${compositeReadiness}%` }}
              />
            </div>
          )}

          {/* 4 Compact Lightweight Metrics with reduced vertical whitespace */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/60">
            <div className="space-y-0.5">
              <div className="text-[11px] text-zinc-400">Resume</div>
              <div className="text-sm sm:text-base font-bold text-white">
                {stats.resumeScore !== null ? `${stats.resumeScore}%` : "—"}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-[11px] text-zinc-400">Role Fit</div>
              <div className="text-sm sm:text-base font-bold text-white">
                {stats.roleMatchPct !== null ? `${stats.roleMatchPct}%` : "—"}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-[11px] text-zinc-400">Technical</div>
              <div className="text-sm sm:text-base font-bold text-white">
                {stats.technicalScore !== null ? `${stats.technicalScore}%` : "—"}
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-[11px] text-zinc-400">Behavioral</div>
              <div className="text-sm sm:text-base font-bold text-white">
                {stats.behavioralScore !== null ? `${stats.behavioralScore}%` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. AI RECOMMENDATION: YOUR NEXT BEST ACTION ── */}
        <div className="rounded-xl bg-zinc-900/40 border border-indigo-500/30 p-4 sm:p-5 space-y-2.5 relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold tracking-wide">
            <span>✦</span>
            <span>Recommended for you</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {nextBestAction.title}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                {nextBestAction.description}
              </p>
            </div>

            <div className="shrink-0 pt-0.5 sm:pt-0">
              <Link
                to={nextBestAction.route || nextBestAction.to}
                className="btn-primary inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2"
              >
                <span>{nextBestAction.actionLabel || nextBestAction.cta}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── 4 & 5. TWO COLUMN: CONTINUE PREPARATION & PROGRESS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Continue Preparation (7 cols) */}
          <div className="lg:col-span-7 rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-4 sm:p-4.5 space-y-2.5">
            <div className="border-b border-zinc-800/60 pb-2">
              <h3 className="text-xs sm:text-sm font-semibold text-white">
                Continue preparation
              </h3>
            </div>

            <div className="space-y-2">
              {/* Item 1: Mock Interview */}
              <Link
                to="/interview"
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      Mock Interview
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {stats.avgInterviewScore !== null
                        ? `Last score: ${stats.avgInterviewScore}%`
                        : "Practice technical & behavioral questions"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-zinc-400 group-hover:text-indigo-300 font-medium transition-colors">
                  <span>{stats.avgInterviewScore ? "Practice again →" : "Start →"}</span>
                </div>
              </Link>

              {/* Item 2: Coding Practice */}
              <Link
                to="/code"
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
                    <Code2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      Algorithmic Coding
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {stats.missingSkills.length > 0
                        ? `Targeting ${stats.missingSkills[0]}`
                        : "Live code editor with complexity audits"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-zinc-400 group-hover:text-indigo-300 font-medium transition-colors">
                  <span>Continue →</span>
                </div>
              </Link>

              {/* Item 3: Resume ATS */}
              <Link
                to="/resume"
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      Resume Optimization
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {stats.resumeScore !== null
                        ? `ATS Score: ${stats.resumeScore}%`
                        : "Upload PDF to evaluate keyword score"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-zinc-400 group-hover:text-indigo-300 font-medium transition-colors">
                  <span>{stats.resumeScore ? "Review →" : "Upload →"}</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Progress Breakdown (5 cols) */}
          <div className="lg:col-span-5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-4 sm:p-4.5 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
              <h3 className="text-xs sm:text-sm font-semibold text-white">
                Progress
              </h3>
              <Link
                to="/roles"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                View details →
              </Link>
            </div>

            {/* Simple Horizontal Progress Bars */}
            <div className="space-y-2.5">
              {/* Technical */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Technical</span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {stats.technicalScore !== null ? `${stats.technicalScore}%` : "—"}
                  </span>
                </div>
                <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.technicalScore || 0}%` }}
                  />
                </div>
              </div>

              {/* Behavioral */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Behavioral</span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {stats.behavioralScore !== null ? `${stats.behavioralScore}%` : "—"}
                  </span>
                </div>
                <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.behavioralScore || 0}%` }}
                  />
                </div>
              </div>

              {/* Coding */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Coding</span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {stats.codingScore !== null ? `${stats.codingScore}%` : "—"}
                  </span>
                </div>
                <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.codingScore || 0}%` }}
                  />
                </div>
              </div>

              {/* Resume */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">Resume</span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {stats.resumeScore !== null ? `${stats.resumeScore}%` : "—"}
                  </span>
                </div>
                <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.resumeScore || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-zinc-800/60 text-center">
              <Link
                to="/roles"
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1"
              >
                <span>View detailed progress</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </div>

        {/* ── 6. COMPACT RECENT ACTIVITY ── */}
        <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-4 sm:p-4.5 space-y-2.5">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
            <h3 className="text-xs sm:text-sm font-semibold text-white">
              Recent activity
            </h3>
            {recentActivity.length > 0 && (
              <Link
                to="/interview"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                All sessions →
              </Link>
            )}
          </div>

          {recentActivity.length > 0 ? (
            <div className="divide-y divide-zinc-800/50">
              {recentActivity.map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  className="flex items-center justify-between py-2 hover:px-1.5 rounded-lg hover:bg-zinc-800/30 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <div className="text-xs sm:text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                      {item.title}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                      {item.badge}
                    </span>
                    <span className="text-xs text-zinc-500 hidden sm:inline">
                      {formatRelativeTime(item.date)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-1">
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-medium text-zinc-300">
                  No practice sessions yet.
                </div>
                <p className="text-xs text-zinc-400">
                  Complete your first session to start tracking progress.
                </p>
              </div>
              <Link
                to="/interview"
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium shrink-0 transition-colors"
              >
                <span>Start practice →</span>
              </Link>
            </div>
          )}
        </div>

        {/* ── 7. MINIMAL FOOTER ── */}
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

