import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../utils/api";
import ReadinessRadar from "../components/ReadinessRadar";
import {
  FileText,
  Target,
  Compass,
  Mic,
  ArrowRight,
  Code2,
  Building2,
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  UploadCloud
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    resumeScore: null,
    bestRole: null,
    roleMatchPct: null,
    interviewsCompleted: 0,
    avgInterviewScore: null,
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

        if (interviewsRes.status === "fulfilled" && interviewsRes.value.data?.interviews) {
          const list = interviewsRes.value.data.interviews;
          setRecentInterviews(list.slice(0, 3));
          if (list.length > 0) {
            const scoredList = list.filter(i => typeof i.overall_score === "number" && i.overall_score > 0);
            const totalScore = scoredList.reduce((acc, curr) => acc + curr.overall_score, 0);
            const avg = scoredList.length > 0 ? Math.round(totalScore / scoredList.length) : null;
            setStats(prev => ({
              ...prev,
              interviewsCompleted: list.length,
              avgInterviewScore: avg
            }));
          }
        }

        if (resumesRes.status === "fulfilled" && resumesRes.value.data?.resumes?.length > 0) {
          const latest = resumesRes.value.data.resumes[0]?.analysis;
          if (latest?.resume_score) {
            const score = Math.round(latest.resume_score);
            setStats(prev => ({ ...prev, resumeScore: score }));

            if (latest.extracted_skills && latest.extracted_skills.length > 0) {
              try {
                const matchRes = await api.post("/api/roles/match", { skills: latest.extracted_skills });
                if (matchRes.data?.best_match) {
                  setStats(prev => ({
                    ...prev,
                    bestRole: matchRes.data.best_match.role_name,
                    roleMatchPct: Math.round(matchRes.data.best_match.match_percentage)
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

  const featureCards = [
    {
      title: "Resume Analyzer",
      desc: "Upload your resume to extract skills, evaluate ATS compatibility, and improve bullet points.",
      icon: FileText,
      to: "/resume",
      badge: stats.resumeScore !== null ? `${stats.resumeScore}/100 Score` : "Analyze PDF",
    },
    {
      title: "Role Matcher",
      desc: "Benchmark your skills against standard industry roles and identify target gaps.",
      icon: Target,
      to: "/roles",
      badge: stats.roleMatchPct !== null ? `${stats.roleMatchPct}% Match` : "Compare Skills",
    },
    {
      title: "Mock Interview",
      desc: "Practice technical, behavioral, and HR questions with real-time AI scoring and feedback.",
      icon: Mic,
      to: "/interview",
      badge: stats.avgInterviewScore !== null ? `${stats.avgInterviewScore}% Average` : "Start Practice",
    },
    {
      title: "Company Prep",
      desc: "Explore interview patterns, syllabus, and prep strategies for leading tech companies.",
      icon: Building2,
      to: "/companies",
      badge: "Company Tracks",
    },
    {
      title: "Code Studio",
      desc: "Solve algorithmic interview questions with real-time time & space complexity analysis.",
      icon: Code2,
      to: "/code",
      badge: "Code & Analyze",
    },
    {
      title: "Study Roadmap",
      desc: "Generate personalized week-by-week learning roadmaps tailored to your career goal.",
      icon: Compass,
      to: "/roadmap",
      badge: stats.activeRoadmapRole ? `Week ${stats.roadmapWeek}` : "Generate Plan",
    },
  ];

  const hasData = stats.resumeScore !== null || stats.interviewsCompleted > 0;

  const radarDimensions = [
    { label: "Algorithms & DSA", value: stats.avgInterviewScore ? Math.min(100, Math.round(stats.avgInterviewScore * 1.05)) : 50 },
    { label: "System Design", value: stats.avgInterviewScore ? Math.min(100, Math.round(stats.avgInterviewScore * 0.95)) : 50 },
    { label: "Behavioral", value: stats.avgInterviewScore ? Math.round(stats.avgInterviewScore) : 50 },
    { label: "Code Quality", value: stats.roleMatchPct ? Math.round(stats.roleMatchPct) : 50 },
    { label: "Resume ATS", value: stats.resumeScore || 50 },
  ];

  const compositeScore = hasData
    ? Math.round(radarDimensions.reduce((acc, curr) => acc + curr.value, 0) / radarDimensions.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#0b0f17] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, {user?.full_name?.split(" ")[0] || "Candidate"}
            </h1>
            <p className="text-zinc-400 text-sm">
              Prepare for interviews, analyze your resume, and track your readiness.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/resume"
              className="btn-secondary flex items-center gap-1.5 text-xs font-medium px-3.5 py-2"
            >
              <UploadCloud className="w-3.5 h-3.5 text-zinc-400" />
              <span>Upload Resume</span>
            </Link>
            <Link
              to="/interview"
              className="btn-primary flex items-center gap-2 text-xs font-medium px-4 py-2"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Start Mock Interview</span>
            </Link>
          </div>
        </div>

        {/* ── METRIC CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">Resume Score</span>
              <FileText className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stats.resumeScore !== null ? `${stats.resumeScore}` : "--"}
              </span>
              {stats.resumeScore !== null && (
                <span className="text-xs text-zinc-500">/100</span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              {stats.resumeScore !== null ? "Based on latest PDF scan" : "No resume analyzed yet"}
            </p>
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">Target Role Fit</span>
              <Target className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stats.roleMatchPct !== null ? `${stats.roleMatchPct}%` : "--%"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 truncate">
              {stats.bestRole ? `Optimal: ${stats.bestRole}` : "Select skills to compute fit"}
            </p>
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">Mock Interview Avg</span>
              <Award className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stats.avgInterviewScore !== null ? `${stats.avgInterviewScore}%` : "--%"}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              {stats.interviewsCompleted > 0
                ? `${stats.interviewsCompleted} session${stats.interviewsCompleted > 1 ? "s" : ""} completed`
                : "No sessions recorded"}
            </p>
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">Active Roadmap</span>
              <BookOpen className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                {stats.activeRoadmapRole ? `Week ${stats.roadmapWeek}` : "No Plan"}
              </span>
              {stats.activeRoadmapRole && (
                <span className="text-xs text-zinc-500">of {stats.totalWeeks}</span>
              )}
            </div>
            <p className="text-xs text-zinc-500 truncate">
              {stats.activeRoadmapRole || "Generate a personalized track"}
            </p>
          </div>

        </div>

        {/* ── PREPARATION MODULES ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Preparation Modules
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  to={card.to}
                  className="card p-5 flex flex-col justify-between group hover:border-zinc-700 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded-md border border-zinc-700/40">
                        {card.badge}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    <span>Open tool</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── TWO COLUMN: RECENT SESSIONS + READINESS RADAR ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Recent Sessions (7 cols) */}
          <div className="lg:col-span-7 card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-semibold text-white">
                Recent Practice Sessions
              </h3>
              <Link to="/interview" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                View all →
              </Link>
            </div>

            {recentInterviews.length > 0 ? (
              <div className="space-y-2.5">
                {recentInterviews.map((session, idx) => (
                  <div
                    key={session.id || idx}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-white text-xs sm:text-sm">
                        {session.role}
                      </div>
                      <div className="text-xs text-zinc-400 capitalize">
                        {session.difficulty} difficulty · {new Date(session.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700">
                      {Math.round(session.overall_score || 0)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center space-y-2.5">
                <Mic className="w-8 h-8 text-zinc-600 mx-auto" />
                <div className="text-sm font-medium text-zinc-300">No mock interview records yet</div>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Practice technical and behavioral questions with instant AI feedback.
                </p>
                <div className="pt-2">
                  <Link
                    to="/interview"
                    className="btn-secondary text-xs inline-flex items-center gap-1.5 px-3.5 py-2"
                  >
                    <span>Start Practice Session</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Readiness Radar (5 cols) */}
          <div className="lg:col-span-5 card p-6 space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-semibold text-white">
                Readiness Assessment
              </h3>
              {hasData && (
                <span className="text-xs font-medium text-indigo-400">
                  {compositeScore}% Score
                </span>
              )}
            </div>

            <div className="py-2 flex items-center justify-center">
              <ReadinessRadar
                dimensions={radarDimensions}
                hasData={hasData}
                size={260}
              />
            </div>

            <div className="pt-3 border-t border-zinc-800/80 text-xs text-zinc-400 text-center">
              {hasData ? (
                <span>Composite technical and communication benchmark</span>
              ) : (
                <span>Take a mock session or analyze your resume to generate your score</span>
              )}
            </div>
          </div>

        </div>

        {/* ── FOOTER (NO GITHUB LINKS) ── */}
        <footer className="pt-8 pb-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-400">InterviewPilot Platform © 2026</span>
          </div>

          <div className="flex items-center gap-6 text-zinc-400">
            <Link to="/resume" className="hover:text-zinc-200 transition-colors">Resume</Link>
            <Link to="/roles" className="hover:text-zinc-200 transition-colors">Role Match</Link>
            <Link to="/roadmap" className="hover:text-zinc-200 transition-colors">Roadmap</Link>
            <Link to="/interview" className="hover:text-zinc-200 transition-colors">Mock Interview</Link>
            <Link to="/companies" className="hover:text-zinc-200 transition-colors">Company Prep</Link>
            <Link to="/code" className="hover:text-zinc-200 transition-colors">Code Studio</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
