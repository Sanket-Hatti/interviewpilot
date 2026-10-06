import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Target,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Briefcase,
  Building2,
  FileText,
  RefreshCw,
  HelpCircle,
  BookOpen,
  Code2
} from "lucide-react";

const POPULAR_ROLES = [
  "Software Engineer",
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Cloud Engineer"
];

export default function RoleMatch() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Inputs
  const [targetRole, setTargetRole] = useState(user?.target_role || "Software Engineer");
  const [targetCompany, setTargetCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [useBenchmark, setUseBenchmark] = useState(false);

  // States
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load existing profile and active job target on mount
  useEffect(() => {
    let active = true;
    const fetchInitialData = async () => {
      try {
        const [profRes, targetRes] = await Promise.allSettled([
          api.get("/api/resume/profile"),
          api.get("/api/roles/current")
        ]);

        if (active && profRes.status === "fulfilled" && profRes.value.data?.has_profile) {
          setCandidateProfile(profRes.value.data.profile);
        }

        if (active && targetRes.status === "fulfilled" && targetRes.value.data?.has_target) {
          const t = targetRes.value.data.job_target;
          setTargetRole(t.target_role || user?.target_role || "Software Engineer");
          setTargetCompany(t.target_company || "");
          if (t.job_description) {
            setJobDescription(t.job_description);
          }
          if (targetRes.value.data.candidate_profile) {
            setCandidateProfile(targetRes.value.data.candidate_profile);
          }
          setResult({
            job_target: t,
            comparison: targetRes.value.data.comparison || {},
            candidate_skills: targetRes.value.data.candidate_profile?.skills || []
          });
        }
      } catch (_) {
        // Silent fallback
      } finally {
        if (active) setInitialLoading(false);
      }
    };

    fetchInitialData();
    return () => { active = false; };
  }, [user]);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!targetRole.trim()) {
      toast.error("Please specify a target role.");
      return;
    }

    if (!useBenchmark && !jobDescription.trim()) {
      toast.error("Please paste a job description or choose 'Use selected role without job description'.");
      return;
    }

    setLoading(true);
    setAnalysisStep(1);

    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 850);

    try {
      const payload = {
        target_role: targetRole.trim(),
        target_company: targetCompany.trim(),
        job_description: useBenchmark ? "" : jobDescription.trim(),
        use_benchmark: useBenchmark
      };

      const res = await api.post("/api/roles/analyze", payload);
      clearInterval(stepInterval);
      setAnalysisStep(3);
      setResult(res.data);
      if (res.data.candidate_profile) {
        setCandidateProfile(res.data.candidate_profile);
      }
      toast.success("Job description analyzed and skill gaps mapped!");
    } catch (err) {
      clearInterval(stepInterval);
      const msgs = err.response?.data?.errors || ["Analysis failed. Please check inputs."];
      msgs.forEach((m) => toast.error(m));
    } finally {
      setLoading(false);
      setAnalysisStep(0);
    }
  };

  const handleProceedToRoadmap = () => {
    const missing = result?.job_target?.missing_skills || [];
    navigate("/roadmap", {
      state: {
        target_role: targetRole,
        missing_skills: missing,
        autoGenerate: true
      }
    });
  };

  const comparison = result?.comparison || {};
  const jobTarget = result?.job_target || {};
  const matchScore = jobTarget.match_score ?? null;
  const breakdown = jobTarget.score_breakdown || {};
  const allComparisonItems = [
    ...(comparison.strong_matches || []),
    ...(comparison.needs_improvement || []),
    ...(comparison.missing || [])
  ];

  return (
    <div className="min-h-screen bg-[#0b0f17] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <span>Placement Intelligence</span>
              <span>/</span>
              <span>Target Role & Skill Gap Analysis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Role Match & Skill Gap Radar
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Benchmark your verified candidate profile against specific target job requirements. Detect exact competencies, isolate missing skills, and build your personalized preparation plan.
            </p>
          </div>

          {candidateProfile && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium self-start sm:self-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Resume Synced: {candidateProfile.skills?.length || 0} skills detected</span>
            </div>
          )}
        </div>

        {/* ── RESUME MISSING CALLOUT ── */}
        {!candidateProfile && !initialLoading && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white">You haven't analyzed a resume yet</h4>
                <p className="text-xs text-amber-200/80 max-w-xl">
                  Upload your resume so InterviewPilot can extract your genuine skills and benchmark them against job requirements.
                </p>
              </div>
            </div>
            <Link
              to="/resume"
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shrink-0 text-center"
            >
              Analyze my resume →
            </Link>
          </div>
        )}

        {/* ── TARGET ROLE & JOB DESCRIPTION FORM ── */}
        <div className="card p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <span>Define Your Target Opportunity</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Provide your target engineering position and paste the job description from LinkedIn, Indeed, or the company careers page.
            </p>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Target Role Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Target Role <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Engineer, Backend Developer"
                  required
                  className="input-field text-sm"
                />
                {/* Role quick pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {POPULAR_ROLES.map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setTargetRole(r)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
                        targetRole === r
                          ? "bg-indigo-600/30 border-indigo-500 text-indigo-300 font-semibold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Company Input (Optional) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Target Company</span>
                  <span className="text-slate-500 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Kyndryl, Google, TCS, Startup"
                    className="input-field text-sm pl-10"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Used to calibrate company-specific interview style and preparation playbooks.
                </p>
              </div>

            </div>

            {/* Toggle: Use benchmark without JD */}
            <div className="pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={useBenchmark}
                  onChange={(e) => setUseBenchmark(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">
                    I'll use my selected role without a job description
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    InterviewPilot will benchmark your candidate profile against standard market requirements for {targetRole || "this position"}.
                  </span>
                </div>
              </label>
            </div>

            {/* Job Description Textarea (if not using benchmark) */}
            {!useBenchmark && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Paste Job Description <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {jobDescription.length} characters
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={`Paste full job description text here...\n\nExample:\nWe are seeking a Software Engineer experienced in Python, SQL, REST APIs, and AWS. Knowledge of Docker, Kubernetes, and CI/CD pipelines is preferred. Responsibilities include building scalable services, database indexing, and collaborating with cross-functional teams.`}
                  className="input-field resize-y text-xs sm:text-sm leading-relaxed"
                />
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 px-6 py-3 text-sm font-bold shadow-lg shadow-indigo-600/25"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Job Profile…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Role & Compare Skills</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Loading step progress */}
          {loading && (
            <div className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 space-y-3">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Analyzing Job Requirements & Mapping Skill Gaps...
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  analysisStep >= 1 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-500"
                }`}>
                  {analysisStep > 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />}
                  <span>1. Extracting requirements</span>
                </div>
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  analysisStep >= 2 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-500"
                }`}>
                  {analysisStep > 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <span className="w-2 h-2 rounded-full bg-slate-600" />}
                  <span>2. Comparing profile</span>
                </div>
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  analysisStep >= 3 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-500"
                }`}>
                  {analysisStep >= 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <span className="w-2 h-2 rounded-full bg-slate-600" />}
                  <span>3. Calculating match score</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── ANALYSIS & SKILL GAP RESULTS ── */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* TOP MATCH SCORE HERO BANNER */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-purple-950/30 to-slate-900 border border-indigo-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Role Compatibility Evaluation</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {jobTarget.target_role}
                    {jobTarget.target_company ? ` at ${jobTarget.target_company}` : ""}
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                    Evaluated deterministically across required skills, preferred qualifications, parsed projects, and work experience.
                  </p>
                </div>

                {/* Score badge & Preparation Plan CTA */}
                <div className="flex flex-col sm:flex-row items-center gap-6 shrink-0">
                  <div className="text-center sm:text-right">
                    {matchScore !== null ? (
                      <>
                        <div className="text-4xl sm:text-5xl font-black text-indigo-400">
                          {matchScore}%
                        </div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                          Role Match
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-amber-400 max-w-[160px] text-center">
                        Not enough information to calculate a reliable match.
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleProceedToRoadmap}
                    className="btn-primary flex items-center gap-2 text-xs sm:text-sm font-bold px-6 py-3 shadow-lg shadow-indigo-600/30 shrink-0"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Generate my preparation plan →</span>
                  </button>
                </div>
              </div>

              {/* TRANSPARENT SCORE BREAKDOWN */}
              {breakdown && Object.keys(breakdown).length > 0 && (
                <div className="card p-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Transparent Scoring Methodology Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Skills Match (50%)</span>
                      <span className="text-xl font-bold text-white">{breakdown.skills_match ?? 0} pts</span>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, ((breakdown.skills_match || 0) / 50) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Preferred Skills (20%)</span>
                      <span className="text-xl font-bold text-white">{breakdown.preferred_skills ?? 0} pts</span>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, ((breakdown.preferred_skills || 0) / 20) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Projects Relevance (15%)</span>
                      <span className="text-xl font-bold text-white">{breakdown.projects_relevance ?? 0} pts</span>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, ((breakdown.projects_relevance || 0) / 15) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Experience Relevance (15%)</span>
                      <span className="text-xl font-bold text-white">{breakdown.experience_relevance ?? 0} pts</span>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, ((breakdown.experience_relevance || 0) / 15) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* THREE-TIER SKILL CATEGORIZATION */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Strong Matches */}
                <div className="card p-6 space-y-3 border-t-4 border-t-emerald-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Strong Matches</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold">
                      {comparison.strong_matches?.length || 0}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Skills confirmed in candidate profile matching role requirements.
                  </p>
                  <ul className="space-y-1.5 pt-1">
                    {(comparison.strong_matches || []).length > 0 ? (
                      comparison.strong_matches.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-xs">
                          <span className="font-semibold text-white">✓ {item.skill}</span>
                          <span className="text-[10px] text-emerald-400 font-medium">{item.candidate_level}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-500 italic p-2">None identified yet.</li>
                    )}
                  </ul>
                </div>

                {/* Needs Improvement */}
                <div className="card p-6 space-y-3 border-t-4 border-t-amber-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Needs Improvement</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold">
                      {comparison.needs_improvement?.length || 0}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Partial mentions or foundational skills requiring greater interview depth.
                  </p>
                  <ul className="space-y-1.5 pt-1">
                    {(comparison.needs_improvement || []).length > 0 ? (
                      comparison.needs_improvement.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-xs">
                          <span className="font-semibold text-amber-300">⚠ {item.skill}</span>
                          <span className="text-[10px] text-slate-400">{item.candidate_level}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-500 italic p-2">No partial gaps detected.</li>
                    )}
                  </ul>
                </div>

                {/* Missing / Not Detected */}
                <div className="card p-6 space-y-3 border-t-4 border-t-rose-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                      <XCircle className="w-4 h-4" />
                      <span>Missing from Profile</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-semibold">
                      {comparison.missing?.length || 0}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Competencies required by the job but <em>not detected in your resume</em>.
                  </p>
                  <ul className="space-y-1.5 pt-1">
                    {(comparison.missing || []).length > 0 ? (
                      comparison.missing.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-xs">
                          <span className="font-semibold text-rose-300">✕ {item.skill}</span>
                          <span className="text-[10px] text-slate-500">Not detected</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-500 italic p-2">All required skills detected!</li>
                    )}
                  </ul>
                </div>

              </div>

              {/* REAL SKILL COMPARISON TABLE */}
              <div className="card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Comprehensive Skill Comparison Table
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {allComparisonItems.length} skills evaluated
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-3">Skill / Technology</th>
                        <th className="py-3 px-3">Candidate Profile</th>
                        <th className="py-3 px-3">Job Requirement</th>
                        <th className="py-3 px-3">Status Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {allComparisonItems.length > 0 ? (
                        allComparisonItems.map((item, idx) => {
                          const isStrong = comparison.strong_matches?.some(s => s.skill === item.skill);
                          const isPartial = comparison.needs_improvement?.some(s => s.skill === item.skill);
                          const isMissing = comparison.missing?.some(s => s.skill === item.skill);

                          return (
                            <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 px-3 font-semibold text-white">
                                {item.skill}
                              </td>
                              <td className="py-3 px-3">
                                {item.candidate_level === "Not detected in resume" ? (
                                  <span className="text-slate-500 italic">Not detected in resume</span>
                                ) : (
                                  <span className="text-indigo-300 font-medium">{item.candidate_level || "Detected in resume"}</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  item.requirement_level === "Required"
                                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                    : "bg-slate-800 text-slate-300 border border-slate-700"
                                }`}>
                                  {item.requirement_level || "Required"}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {isStrong && (
                                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Strong match</span>
                                  </span>
                                )}
                                {isPartial && (
                                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>Needs improvement</span>
                                  </span>
                                )}
                                {isMissing && (
                                  <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Not detected</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-500">
                            No comparison data available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* EXTRACTED JOB REQUIREMENTS & LIKELY INTERVIEW TOPICS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Extracted Requirements Breakdown */}
                <div className="card p-6 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Code2 className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Extracted Job Stack Taxonomies
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Required Core Stack ({jobTarget.required_skills?.length || 0})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(jobTarget.required_skills || []).map((s) => (
                          <span key={s} className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {(jobTarget.preferred_skills || []).length > 0 && (
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Preferred & Nice-to-Have
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {jobTarget.preferred_skills.map((s) => (
                            <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Likely Interview Topics */}
                <div className="card p-6 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <BookOpen className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Likely Interview Drill Topics
                    </h3>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300">
                    {(jobTarget.interview_topics || []).length > 0 ? (
                      jobTarget.interview_topics.map((t, idx) => (
                        <li key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                          <span className="text-indigo-400 font-bold">{idx + 1}.</span>
                          <span className="font-medium text-slate-200">{t}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic p-2">Standard engineering fundamentals.</li>
                    )}
                  </ul>
                </div>

              </div>

              {/* BOTTOM LAUNCH PREPARATION PLAN BANNER */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-lg">Next Step: Build Your Personalized Preparation Plan</h4>
                  <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
                    InterviewPilot will synthesize your detected gaps into a week-by-week curriculum with targeted drills, architecture concepts, and mock interview milestones.
                  </p>
                </div>
                <button
                  onClick={handleProceedToRoadmap}
                  className="btn-primary flex items-center gap-2 px-6 py-3 text-sm font-bold shadow-lg shadow-indigo-600/25 shrink-0"
                >
                  <Compass className="w-4 h-4" />
                  <span>Generate my preparation plan →</span>
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
