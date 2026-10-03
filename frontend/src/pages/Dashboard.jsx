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
  Play,
  Activity,
  Code2,
  Building2,
  Zap,
  Sparkles,
  Search
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

            // Fetch live role match if skills are present
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
        // Fallback
      }
    };
    fetchData();
  }, []);

  const featureCards = [
    {
      title: "ATS Resume Intelligence",
      tag: "PARSER & DIAGNOSTIC",
      desc: "Deep PDF parsing, skill taxonomy extraction, ATS keyword scoring, and high-impact bullet point enhancer.",
      icon: FileText,
      to: "/resume",
      metric: stats.resumeScore !== null ? `${stats.resumeScore}/100 Score` : "Upload Resume",
    },
    {
      title: "Target Role Matcher",
      tag: "COMPATIBILITY RADAR",
      desc: "Benchmark your technical capabilities against industry job profiles to identify missing dependencies.",
      icon: Target,
      to: "/roles",
      metric: stats.roleMatchPct !== null ? `${stats.roleMatchPct}% Match` : "Analyze Skills",
    },
    {
      title: "Algorithmic Code Studio",
      tag: "LIVE IDE & BIG-O",
      desc: "Interactive technical interview coding with edge-case tests, real-time time & space complexity analysis.",
      icon: Code2,
      to: "/code",
      metric: "Live Evaluation",
    },
    {
      title: "Company Battlegrounds",
      tag: "FAANG & ENTERPRISE",
      desc: "Deconstructed interview rubrics, frequent topics, and specific preparation playbooks for Google, Meta, Amazon, etc.",
      icon: Building2,
      to: "/companies",
      metric: "7 Profiles Indexed",
    },
    {
      title: "Curriculum Roadmap",
      tag: "SPRINT PLANNER",
      desc: "Tailored week-by-week curriculum with curated resources, practical milestones, and architectural mini-projects.",
      icon: Compass,
      to: "/roadmap",
      metric: stats.activeRoadmapRole ? `Wk ${stats.roadmapWeek} of ${stats.totalWeeks}` : "Create Plan",
    },
    {
      title: "Mock Interview Studio",
      tag: "SIMULATOR & RUBRIC",
      desc: "Technical, behavioral, and architectural question simulator with real-time speech input and rubric evaluation.",
      icon: Mic,
      to: "/interview",
      metric: stats.avgInterviewScore !== null ? `${stats.avgInterviewScore}% Average` : "Start Session",
    },
  ];

  const radarDimensions = [
    { label: "DSA & Alg", value: stats.avgInterviewScore ? Math.min(100, Math.round(stats.avgInterviewScore * 1.05)) : 50 },
    { label: "System Design", value: stats.avgInterviewScore ? Math.min(100, Math.round(stats.avgInterviewScore * 0.95)) : 50 },
    { label: "STAR Behavior", value: stats.avgInterviewScore ? Math.round(stats.avgInterviewScore) : 50 },
    { label: "Code Optimization", value: stats.roleMatchPct ? Math.round(stats.roleMatchPct) : 50 },
    { label: "ATS Resume", value: stats.resumeScore || 50 },
  ];

  const hasData = stats.resumeScore !== null || stats.interviewsCompleted > 0;
  const compositeScore = hasData
    ? Math.round(radarDimensions.reduce((acc, curr) => acc + curr.value, 0) / radarDimensions.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#090a0f] bg-grid-pattern p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── CLEAN EXECUTIVE HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-500">
              <span>Workspace</span>
              <span>/</span>
              <span className="text-zinc-300">Engineering Readiness</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, {user?.full_name?.split(" ")[0] || "Candidate"}
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-xl">
              Real-time placement intelligence, code complexity audits, company tracks, and simulated sessions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/code"
              className="btn-secondary flex items-center gap-1.5 text-xs font-medium px-3.5 py-2"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Code Studio</span>
            </Link>
            <Link
              to="/companies"
              className="btn-secondary flex items-center gap-1.5 text-xs font-medium px-3.5 py-2"
            >
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Company Prep</span>
            </Link>
            <Link
              to="/interview"
              className="btn-primary flex items-center gap-2 text-xs font-semibold px-4 py-2"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Mock</span>
            </Link>
          </div>
        </div>

        {/* ── KPI METRICS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>ATS Resume Score</span>
              <span className="font-mono text-[11px] text-zinc-500">RESUME</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white font-mono">
                {stats.resumeScore !== null ? stats.resumeScore : "--"}
              </span>
              <span className="text-zinc-500 text-xs font-mono">/100</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-zinc-200 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.resumeScore || 0}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              {stats.resumeScore !== null ? "Calculated from latest PDF scan" : "No resume analyzed yet"}
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>Target Role Fit</span>
              <span className="font-mono text-[11px] text-zinc-500">COMPATIBILITY</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white font-mono">
                {stats.roleMatchPct !== null ? `${stats.roleMatchPct}%` : "--%"}
              </span>
              <span className="text-zinc-400 text-xs truncate max-w-[120px]">
                {stats.bestRole || "Run Match"}
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-zinc-200 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.roleMatchPct || 0}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              {stats.bestRole ? `Optimal fit: ${stats.bestRole}` : "Select skills to compute fit"}
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>Mock Interview Avg</span>
              <span className="font-mono text-[11px] text-zinc-500">EVALUATION</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white font-mono">
                {stats.avgInterviewScore !== null ? `${stats.avgInterviewScore}%` : "--%"}
              </span>
              <span className="text-zinc-500 text-xs font-mono">
                ({stats.interviewsCompleted} sessions)
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-zinc-200 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.avgInterviewScore || 0}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              {stats.interviewsCompleted > 0 ? "Cumulative session score" : "Take your first mock session"}
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>Sprint Roadmap</span>
              <span className="font-mono text-[11px] text-zinc-500">CURRICULUM</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white font-mono">
                {stats.activeRoadmapRole ? `Wk ${stats.roadmapWeek}` : "No Plan"}
              </span>
              <span className="text-zinc-500 text-xs font-mono">
                {stats.activeRoadmapRole ? `of ${stats.totalWeeks}` : ""}
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-zinc-200 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.activeRoadmapRole ? (stats.roadmapWeek / stats.totalWeeks) * 100 : 0}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-500 font-mono truncate">
              {stats.activeRoadmapRole ? stats.activeRoadmapRole : "Generate a custom study track"}
            </div>
          </div>

        </div>

        {/* ── CORE MODULES (3x2 Grid) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
              Core Preparation Modules
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  to={card.to}
                  className="card p-5 flex flex-col justify-between group hover:border-zinc-700 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {card.metric}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-400">
                        {card.tag}
                      </div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">
                        {card.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── TWO COLUMN: RECENT SESSIONS + READINESS RADAR MATRIX ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Recent Sessions (7 cols) */}
          <div className="lg:col-span-7 card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-400" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
                  Recent Practice Sessions
                </h3>
              </div>
              <Link to="/interview" className="text-xs text-zinc-400 hover:text-white transition-colors">
                View all sessions →
              </Link>
            </div>

            {recentInterviews.length > 0 ? (
              <div className="space-y-2.5">
                {recentInterviews.map((session, idx) => (
                  <div
                    key={session.id || idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-mono text-xs">
                        #{session.id || idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-white text-xs">{session.role}</div>
                        <div className="text-[11px] text-zinc-500 capitalize">
                          {session.difficulty} difficulty · {new Date(session.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {Math.round(session.overall_score || 0)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-lg bg-zinc-950/60 border border-dashed border-zinc-800 space-y-2">
                <Mic className="w-6 h-6 text-zinc-600 mx-auto" />
                <div className="text-xs font-medium text-zinc-400">No mock interview records found</div>
                <p className="text-[11px] text-zinc-600 max-w-xs mx-auto">
                  Take a simulated technical or behavioral session to generate benchmark data.
                </p>
                <div className="pt-2">
                  <Link
                    to="/interview"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-medium transition-colors"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Launch Interview</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Readiness Radar Matrix (5 cols) */}
          <div className="lg:col-span-5 card p-6 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
                  Readiness Radar Matrix
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">5-AXIS AUDIT</span>
            </div>

            <div className="py-2 flex items-center justify-center">
              <ReadinessRadar
                dimensions={radarDimensions}
                size={270}
              />
            </div>

            <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 text-center font-mono">
              Composite Technical Readiness:{" "}
              {hasData ? (
                <strong className="text-white font-bold">{compositeScore}%</strong>
              ) : (
                <span className="text-zinc-500 italic">Pending Activity Scan</span>
              )}
            </div>
          </div>

        </div>

        {/* ── PRODUCTION MINIMAL FOOTER ── */}
        <footer className="pt-8 pb-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-400 font-medium">All systems operational</span>
            <span className="text-zinc-700">•</span>
            <span>InterviewPilot AI Platform © 2026</span>
          </div>

          <div className="flex items-center gap-6 text-zinc-400">
            <Link to="/code" className="hover:text-zinc-200 transition-colors">Code Studio</Link>
            <Link to="/companies" className="hover:text-zinc-200 transition-colors">Company Tracks</Link>
            <Link to="/interview" className="hover:text-zinc-200 transition-colors">Mock Practice</Link>
            <Link to="/resume" className="hover:text-zinc-200 transition-colors">Resume ATS</Link>
            <a href="https://github.com/Sanket-Hatti/interviewpilot" target="_blank" rel="noreferrer" className="hover:text-zinc-200 transition-colors">Documentation</a>
          </div>
        </footer>

      </div>
    </div>
  );
}
