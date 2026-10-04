import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";
import { Link } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Copy,
  Check,
  Briefcase,
  GraduationCap,
  FolderGit2,
  ArrowRight,
  RefreshCw,
  X,
  Target,
  Wand2,
  ShieldCheck
} from "lucide-react";

const ScoreRing = ({ score }) => {
  const r = 52, c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const dash = (pct / 100) * c;
  const color = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const grade = pct >= 80 ? "Grade A" : pct >= 65 ? "Grade B" : "Needs Revision";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute text-center flex flex-col items-center">
        <span className="text-3xl font-extrabold text-white tracking-tight">{pct}</span>
        <span className="text-[11px] font-semibold text-slate-400 -mt-0.5">/ 100</span>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 mt-1 rounded-full"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {grade}
        </span>
      </div>
    </div>
  );
};

export default function ResumeAnalyzer() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [bullet, setBullet] = useState("");
  const [improved, setImproved] = useState("");
  const [improving, setImproving] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Only PDF format resumes are accepted.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Resume file size must be under 10MB.");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api.post("/api/resume/analyze", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      toast.success("ATS Analysis completed successfully!");
    } catch (err) {
      const msgs = err.response?.data?.errors || ["Analysis failed. Please try again."];
      msgs.forEach((m) => toast.error(m));
    } finally {
      setLoading(false);
    }
  };

  const improveBullet = async () => {
    if (!bullet.trim()) return;
    setImproving(true);
    try {
      const res = await api.post("/api/resume/improve", { bullet });
      setImproved(res.data.improved);
      toast.success("Bullet point enhanced with quantifiable metrics!");
    } catch {
      toast.error("Failed to enhance bullet. Please check your backend connection.");
    } finally {
      setImproving(false);
    }
  };

  const copyToClipboard = () => {
    if (!improved) return;
    navigator.clipboard.writeText(improved);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleBullets = [
    "Worked on the backend API using Python and PostgreSQL",
    "Built a responsive dashboard in React for clients",
    "Reduced database query time and handled large datasets",
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
              <span>ATS Resume Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Resume ATS Diagnostic & Scorer
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Upload your PDF resume to run deep semantic parsing, extract technical skill taxonomies, benchmark against job roles, and re-engineer bullet points.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ATS Parser v3.8</span>
            </span>
          </div>
        </div>

        {/* ── UPLOAD AREA ── */}
        {!result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
                dragging
                  ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                  : "border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
                  <UploadCloud className="w-8 h-8" />
                </div>

                {file ? (
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-sm font-semibold">
                      <FileText className="w-4 h-4" />
                      <span>{file.name}</span>
                    </div>
                    <p className="text-slate-400 text-xs">
                      {(file.size / 1024).toFixed(1)} KB · Click to change file
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-white font-semibold text-base">
                      Drop your resume PDF here, or <span className="text-indigo-400 hover:underline">browse files</span>
                    </p>
                    <p className="text-slate-500 text-xs">
                      Standard PDF documents up to 10MB supported
                    </p>
                  </div>
                )}
              </div>
            </div>

            {file && (
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setFile(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={analyze}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-semibold"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Extracting Taxonomies…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run Full ATS Audit</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── ANALYSIS RESULTS ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Action Bar */}
              <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-300">
                    Audit Complete · <strong className="text-white">{result.extracted_skills?.length || 0} skills detected</strong>
                  </span>
                </div>
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Analyze Another</span>
                </button>
              </div>

              {/* Score + Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Score Gauge */}
                <div className="card flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    ATS Readiness Rating
                  </h3>
                  <ScoreRing score={result.resume_score} />
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    Evaluated on skill keywords, quantified impact, structural sections, and technical depth.
                  </p>
                </div>

                {/* Sub-Score Dimensions */}
                <div className="card lg:col-span-2 p-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Component Breakdown
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(result.score_breakdown || {}).map(([key, val]) => (
                      <div
                        key={key}
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1"
                      >
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider capitalize">
                          {key}
                        </div>
                        <div className="text-xl font-bold text-white">{val} pts</div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, (val / 30) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Top Role Matches */}
                  <div className="pt-2">
                    <div className="text-xs font-bold text-slate-300 mb-2">
                      Top Target Role Alignment:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(result.role_matches || []).slice(0, 4).map((role, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs"
                        >
                          <span className="font-medium text-slate-300">{role.role_name}</span>
                          <span className="font-bold text-indigo-400">{role.match_percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Detected Skills Cloud */}
              <div className="card p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Verified Technical Skills
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {result.extracted_skills?.length || 0} extracted
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {result.extracted_skills?.length ? (
                    result.extracted_skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/25 text-indigo-300"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-500 text-xs">
                      No matching keywords detected. Check section headings and tech names.
                    </p>
                  )}
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Strengths */}
                <div className="card p-6 space-y-3 border-l-4 border-l-emerald-500">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Key Strengths
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {(result.strengths || []).map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses / Opportunities */}
                <div className="card p-6 space-y-3 border-l-4 border-l-amber-500">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Recommended Improvements
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {(result.weaknesses || []).map((w, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Extracted Experience & Projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Briefcase className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Parsed Experience Items
                    </h3>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {(result.experience || []).slice(0, 6).map((item, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card p-6 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <FolderGit2 className="w-4 h-4" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Parsed Projects
                    </h3>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {(result.projects || []).slice(0, 6).map((item, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AI BULLET ENHANCER STUDIO ── */}
        <div className="card p-6 sm:p-8 space-y-5 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-xs font-semibold">
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Bullet Point Studio</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Re-engineer Weak Resume Bullets
              </h2>
              <p className="text-slate-400 text-xs">
                Paste any standard duty description. Our AI transforms it into an executive achievement with action verbs and quantifiable impact metrics.
              </p>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Try sample:</span>
            {sampleBullets.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => setBullet(sample)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 border border-slate-700/50 transition-colors truncate max-w-xs"
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Textarea Input */}
          <div className="space-y-3">
            <textarea
              value={bullet}
              onChange={(e) => setBullet(e.target.value)}
              placeholder="e.g. Created a backend using Python and PostgreSQL to handle user logins"
              rows={3}
              className="input-field resize-none text-xs sm:text-sm leading-relaxed"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {bullet.length} characters
              </span>
              <button
                onClick={improveBullet}
                disabled={improving || !bullet.trim()}
                className="btn-primary flex items-center gap-2 text-xs font-semibold px-5 py-2.5"
              >
                {improving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Re-writing with Groq AI…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate High-Impact Bullet</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Card */}
          {improved && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Optimized Version</span>
                </span>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-xs text-indigo-300 hover:text-white px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy to Clipboard"}</span>
                </button>
              </div>

              <p className="text-slate-100 text-sm leading-relaxed font-medium">
                {improved}
              </p>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
