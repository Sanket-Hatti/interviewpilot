import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../utils/api";
import {
  Sparkles,
  ArrowRight,
  Mic,
  Code2,
  FileText,
  Target,
  Compass,
  CheckCircle2,
  TrendingUp,
  Clock,
  Building2,
  ChevronRight,
  RotateCcw
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resumesRes, interviewsRes, roadmapsRes] = await Promise.allSettled([
          api.get("/api/resume/history"),
          api.get("/api/interview/history"),
          api.get("/api/roadmap/history")
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

        if (resumesRes.status === "fulfilled" && resumesRes.value.data?.resumes?.length > 0) {
          const latestResume = resumesRes.value.data.resumes[0];
          const latest = latestResume?.analysis;
          if (latest?.resume_score) {
            const score = Math.round(latest.resume_score);
            setStats(prev => ({
              ...prev,
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
                    roleMatchPct: Math.round(bm.match_percentage),
                    codingScore: Math.round(bm.match_percentage),
                    missingSkills: bm.missing_skills || []
                  }));
                }
              } catch (_) {}
            }
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
    if (stats.resumeScore === null) {
      return { label: "Upload Resume", to: "/resume" };
    }
    if (stats.roleMatchPct === null) {
      return { label: "Analyze Target Role", to: "/roles" };
    }
    if (stats.interviewsCompleted === 0) {
      return { label: "Start Practice", to: "/interview" };
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

  // Readiness coaching insight text
  const coachingInsight = useMemo(() => {
    if (!hasAnyData) {
      return "Complete your first practice session or resume scan to calculate readiness.";
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

  // Next Best Action (Hero recommendation card)
  const nextBestAction = useMemo(() => {
    if (stats.resumeScore === null) {
      return {
        badge: "Recommended Step",
        title: "Upload Resume for ATS Diagnostic",
        description: "Upload your PDF resume to extract skills, evaluate keyword match rates, and get tailored recommendations.",
        cta: "Upload Resume",
        to: "/resume"
      };
    }
    if (stats.roleMatchPct === null) {
      return {
        badge: "Recommended Step",
        title: "Benchmark Target Role Fit",
        description: "Match your extracted skills against 9 tech industry roles to discover skill dependencies and missing requirements.",
        cta: "Analyze Role Fit",
        to: "/roles"
      };
    }
    if (stats.missingSkills.length > 0) {
      const skill = stats.missingSkills[0];
      return {
        badge: "Skill Focus",
        title: `Improve ${skill}`,
        description: `Your benchmark for ${stats.bestRole || "your target role"} shows ${skill} is currently an identified skill gap. Practice questions to close this gap.`,
        cta: "Start Practice",
        to: "/code"
      };
    }
    if (stats.interviewsCompleted === 0) {
      return {
        badge: "Simulation",
        title: "Take Your First Mock Interview",
        description: "Complete your first practice session to get personalized rubric evaluations and benchmark your communication.",
        cta: "Start Practice",
        to: "/interview"
      };
    }
    if (stats.avgInterviewScore !== null && stats.avgInterviewScore < 80) {
      return {
        badge: "Score Acceleration",
        title: "Refine Technical Explanations",
        description: `Your recent practice average is ${stats.avgInterviewScore}%. Take another session to sharpen structured delivery and STAR responses.`,
        cta: "Practice Again",
        to: "/interview"
      };
    }
    return {
      badge: "Target Companies",
      title: "Explore Company Preparation Tracks",
      description: "Review specific interview formats, question patterns, and prep playbooks for American Express, TCS, Infosys, and more.",
      cta: "Explore Tracks",
      to: "/companies"
    };
  }, [stats]);

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
      <div className="max-w-5xl mx-auto space-y-7">

        {/* ── 1. HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Here's your interview preparation progress and what to focus on next.
            </p>
          </div>

          <div>
            <Link
              to={primaryCTA.to}
              className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2"
            >
              <span>{primaryCTA.label}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── 2. READINESS OVERVIEW ── */}
        <div className="card p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Interview Readiness
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {compositeReadiness !== null ? `${compositeReadiness}%` : "—"}
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
                {coachingInsight}
              </p>
            </div>

            {compositeReadiness !== null && (
              <div className="hidden sm:block shrink-0">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {compositeReadiness >= 75 ? "Interview Ready" : compositeReadiness >= 55 ? "Progressing Well" : "Needs Practice"}
                </span>
              </div>
            )}
          </div>

          {/* Clean Progress Indicator Bar */}
          <div className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${compositeReadiness || 0}%` }}
            />
          </div>

          {/* 4 Compact Lightweight Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/60">
            <div className="space-y-1">
              <div className="text-xs text-zinc-400">Resume</div>
              <div className="text-base sm:text-lg font-bold text-white">
                {stats.resumeScore !== null ? `${stats.resumeScore}%` : "—"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-zinc-400">Role Fit</div>
              <div className="text-base sm:text-lg font-bold text-white">
                {stats.roleMatchPct !== null ? `${stats.roleMatchPct}%` : "—"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-zinc-400">Technical</div>
              <div className="text-base sm:text-lg font-bold text-white">
                {stats.technicalScore !== null ? `${stats.technicalScore}%` : "—"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-zinc-400">Behavioral</div>
              <div className="text-base sm:text-lg font-bold text-white">
                {stats.behavioralScore !== null ? `${stats.behavioralScore}%` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. NEXT BEST ACTION (Most Important Card) ── */}
        <div className="relative rounded-2xl bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-zinc-900/40 border border-indigo-500/30 p-6 sm:p-7 shadow-lg shadow-black/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Your next best action</span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {nextBestAction.title}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                {nextBestAction.description}
              </p>
            </div>

            <div className="shrink-0">
              <Link
                to={nextBestAction.to}
                className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-5 py-2.5 shadow-md shadow-indigo-600/20"
              >
                <span>{nextBestAction.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── 4 & 5. TWO COLUMN: CONTINUE PREPARATION & PROGRESS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Continue Preparation (7 cols) */}
          <div className="lg:col-span-7 card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <h3 className="text-sm font-semibold text-white">
                Continue preparation
              </h3>
            </div>

            <div className="space-y-3">
              {/* Item 1: Mock Interview */}
              <Link
                to="/interview"
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      Mock Interview
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {stats.avgInterviewScore !== null
                        ? `Last score: ${stats.avgInterviewScore}% · 11 questions`
                        : "Simulate technical & behavioral questions"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-zinc-400 group-hover:text-indigo-300 font-medium transition-colors">
                  <span>{stats.avgInterviewScore ? "Practice again" : "Start"}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Item 2: Coding Practice */}
              <Link
                to="/code"
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      Algorithmic Coding
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {stats.missingSkills.length > 0
                        ? `Targeting ${stats.missingSkills[0]} · Big-O audit`
                        : "Write code with real-time complexity analysis"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-zinc-400 group-hover:text-indigo-300 font-medium transition-colors">
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Item 3: Resume ATS */}
              <Link
                to="/resume"
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      Resume Optimization
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {stats.resumeScore !== null
                        ? `ATS Score: ${stats.resumeScore}% · Bullet improver`
                        : "Upload PDF to evaluate keyword score"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-zinc-400 group-hover:text-indigo-300 font-medium transition-colors">
                  <span>{stats.resumeScore ? "Review" : "Upload"}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          {/* Progress Breakdown (5 cols) */}
          <div className="lg:col-span-5 card p-5 sm:p-6 space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <h3 className="text-sm font-semibold text-white">
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
            <div className="space-y-4">
              {/* Technical */}
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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

            <div className="pt-3 border-t border-zinc-800/60 text-center">
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

        {/* ── 6. RECENT ACTIVITY ── */}
        <div className="card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <h3 className="text-sm font-semibold text-white">
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
                  className="flex items-center justify-between py-3 hover:px-2 rounded-lg hover:bg-zinc-800/40 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-200 border border-zinc-700/60">
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
            <div className="py-8 text-center space-y-3">
              <Clock className="w-7 h-7 text-zinc-600 mx-auto" />
              <div className="text-xs sm:text-sm font-medium text-zinc-400">
                No practice sessions yet.
              </div>
              <div>
                <Link
                  to="/interview"
                  className="btn-secondary text-xs inline-flex items-center gap-1.5 px-3.5 py-1.5"
                >
                  <span>Start your first practice</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── 7. FOOTER (Minimal & Clean) ── */}
        <footer className="pt-6 pb-4 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
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
