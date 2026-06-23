import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";

const ScoreRing = ({ score }) => {
  const r = 54, c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const dash = (pct / 100) * c;
  const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="130" height="130" className="-rotate-90">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-white">{pct}</div>
        <div className="text-xs text-gray-400">/ 100</div>
      </div>
    </div>
  );
};

const SkillBadge = ({ skill }) => (
  <span className="px-2.5 py-1 bg-brand-900/50 border border-brand-700/50 text-brand-300 text-xs rounded-full">
    {skill}
  </span>
);

const Section = ({ title, items, color = "gray" }) => {
  if (!items?.length) return null;
  return (
    <div className="card">
      <h3 className="font-semibold text-white mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className={`text-sm text-${color}-400 flex gap-2`}>
            <span className="mt-0.5 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function ResumeAnalyzer() {
  const [dragging, setDragging]   = useState(false);
  const [file, setFile]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [bullet, setBullet]       = useState("");
  const [improved, setImproved]   = useState("");
  const [improving, setImproving] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") { toast.error("Only PDF files allowed"); return; }
    if (f.size > 10 * 1024 * 1024)   { toast.error("File must be under 10MB");  return; }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
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
      toast.success("Resume analyzed successfully!");
    } catch (err) {
      const msgs = err.response?.data?.errors || ["Analysis failed."];
      msgs.forEach(m => toast.error(m));
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
    } catch {
      toast.error("Failed to improve bullet. Check your Gemini API key.");
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white mb-1">Resume Analyzer</h1>
          <p className="text-gray-400 mb-8">Upload your resume to get an AI-powered score and skill analysis.</p>

          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-6
              ${dragging ? "border-brand-500 bg-brand-500/10" : "border-gray-700 hover:border-brand-600 hover:bg-gray-900/50"}`}
          >
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            <div className="text-4xl mb-3">{file ? "📄" : "☁️"}</div>
            {file ? (
              <div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-gray-400 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB — Click to change</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-300 font-medium">Drag & drop your resume here</p>
                <p className="text-gray-500 text-sm mt-1">or click to browse — PDF only, max 10MB</p>
              </div>
            )}
          </div>

          {file && !result && (
            <button onClick={analyze} disabled={loading} className="btn-primary w-full py-3 text-base mb-8">
              {loading ? "Analyzing…" : "Analyze Resume"}
            </button>
          )}

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                {/* Score + top role matches */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card flex flex-col items-center justify-center gap-4">
                    <h3 className="font-semibold text-white">Resume Score</h3>
                    <ScoreRing score={result.resume_score} />
                    <div className="grid grid-cols-2 gap-2 w-full text-center text-xs">
                      {Object.entries(result.score_breakdown || {}).map(([k, v]) => (
                        <div key={k} className="bg-gray-800 rounded-lg p-2">
                          <div className="text-white font-semibold">{v}</div>
                          <div className="text-gray-400 capitalize">{k}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="font-semibold text-white mb-3">Top Role Matches</h3>
                    <div className="space-y-3">
                      {(result.role_matches || []).map((r, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">{r.role_name}</span>
                            <span className="text-brand-400 font-medium">{r.match_percentage}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full">
                            <div className="h-1.5 bg-brand-500 rounded-full transition-all"
                              style={{ width: `${r.match_percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="card">
                  <h3 className="font-semibold text-white mb-3">
                    Detected Skills
                    <span className="ml-2 text-xs text-gray-400">({result.extracted_skills?.length || 0} found)</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.extracted_skills?.length
                      ? result.extracted_skills.map(s => <SkillBadge key={s} skill={s} />)
                      : <p className="text-gray-500 text-sm">No known skills detected. Try adding technical keywords to your resume.</p>
                    }
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Section title="✅ Strengths" items={result.strengths} color="green" />
                  <Section title="⚠️ Weaknesses" items={result.weaknesses} color="amber" />
                  <Section title="💼 Experience" items={result.experience} color="gray" />
                  <Section title="🎓 Education"  items={result.education}  color="gray" />
                  <Section title="🚀 Projects"   items={result.projects}   color="gray" />
                </div>

                <button onClick={() => { setResult(null); setFile(null); }}
                  className="btn-secondary w-full">
                  Analyze another resume
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bullet Improver */}
          <div className="card mt-8">
            <h3 className="font-semibold text-white mb-1">✨ Resume Bullet Improver</h3>
            <p className="text-gray-400 text-sm mb-4">Paste a weak bullet point and AI will rewrite it professionally.</p>
            <textarea
              value={bullet}
              onChange={e => setBullet(e.target.value)}
              placeholder="e.g. Created a website using React"
              rows={3}
              className="input-field mb-3 resize-none"
            />
            <button onClick={improveBullet} disabled={improving || !bullet.trim()} className="btn-primary">
              {improving ? "Improving…" : "Improve Bullet"}
            </button>
            {improved && (
              <div className="mt-4 p-4 bg-green-900/20 border border-green-700/40 rounded-lg">
                <p className="text-xs text-green-400 font-medium mb-1">Improved version:</p>
                <p className="text-gray-200 text-sm">{improved}</p>
                <button onClick={() => navigator.clipboard.writeText(improved)}
                  className="mt-2 text-xs text-brand-400 hover:text-brand-300">
                  Copy to clipboard
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
