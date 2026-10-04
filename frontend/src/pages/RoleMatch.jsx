import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";
import { Link } from "react-router-dom";
import {
  Target,
  Plus,
  Check,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
  XCircle,
  Briefcase
} from "lucide-react";

const COMMON_SKILLS = [
  "Python", "JavaScript", "React", "Node.js", "Flask", "Django", "SQL", "PostgreSQL",
  "MongoDB", "Docker", "AWS", "Git", "Machine Learning", "TensorFlow", "Pandas",
  "REST API", "TypeScript", "Java", "C++", "Kubernetes", "Linux", "Agile",
];

export default function RoleMatch() {
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState([
    "Python", "JavaScript", "React", "Git", "REST API", "SQL"
  ]);
  const [custom, setCustom] = useState("");
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/roles/").then((r) => setRoles(r.data.roles)).catch(() => {});
    // Auto run first match
    api.post("/api/roles/match", { skills: selected })
      .then((r) => setMatches(r.data))
      .catch(() => {});
  }, []);

  const toggle = (skill) => {
    setSelected((s) => (s.includes(skill) ? s.filter((x) => x !== skill) : [...s, skill]));
  };

  const addCustom = () => {
    const s = custom.trim();
    if (s && !selected.includes(s)) {
      setSelected((prev) => [...prev, s]);
      setCustom("");
    }
  };

  const matchRoles = async () => {
    if (!selected.length) {
      toast.error("Please select at least one skill.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/roles/match", { skills: selected });
      setMatches(res.data);
      toast.success("Role matching updated!");
    } catch {
      toast.error("Matching failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <span>Placement Intelligence</span>
              <span>/</span>
              <span>Role Compatibility</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Role Match & Skill Gap Radar
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Benchmark your skill portfolio against market job profiles, discover your highest percentage fit, and isolate missing competencies.
            </p>
          </div>

          <button
            onClick={matchRoles}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-xs font-bold px-5 py-2.5 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? "Calculating Fit…" : "Recalculate Fit"}</span>
          </button>
        </div>

        {/* ── SKILL PICKER HUB ── */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Active Skill Portfolio ({selected.length} Selected)
            </h2>
            <button
              onClick={() => setSelected([])}
              className="text-[11px] text-slate-500 hover:text-slate-400"
            >
              Clear all
            </button>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {COMMON_SKILLS.map((skill) => {
              const isSelected = selected.includes(skill);
              return (
                <button
                  key={skill}
                  onClick={() => toggle(skill)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20 font-semibold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{skill}</span>
                </button>
              );
            })}
          </div>

          {/* Add custom skill */}
          <div className="flex gap-2 pt-2 border-t border-slate-800/80">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustom()}
              placeholder="Type custom skill (e.g. Redis, GraphQL, Next.js) and press Enter..."
              className="input-field text-xs"
            />
            <button
              onClick={addCustom}
              className="btn-secondary flex items-center gap-1.5 px-4 text-xs font-semibold shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* ── MATCH RESULTS ── */}
        {matches && (
          <div className="space-y-6">
            
            {/* Top Match Highlight */}
            {matches.best_match && (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Top Market Fit</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {matches.best_match.role_name}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
                    You currently satisfy <strong>{matches.best_match.match_percentage}%</strong> of the core required stack for this position.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                  <div className="text-center sm:text-right">
                    <div className="text-3xl font-black text-indigo-400">
                      {matches.best_match.match_percentage}%
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">Alignment</div>
                  </div>
                  <Link
                    to="/roadmap"
                    className="btn-primary flex items-center gap-2 text-xs font-semibold px-5 py-2.5"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Build Roadmap</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Grid of All Role Alignments */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                Full Role Compatibility Breakdown
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(matches.matches || []).map((roleItem, idx) => {
                  const pct = roleItem.match_percentage;
                  const barColor = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500";
                  const badgeColor =
                    pct >= 70
                      ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
                      : pct >= 40
                      ? "text-amber-400 bg-amber-500/15 border-amber-500/30"
                      : "text-rose-400 bg-rose-500/15 border-rose-500/30";

                  return (
                    <div
                      key={idx}
                      className="card p-5 space-y-4 hover:border-slate-700/80 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-white text-base leading-tight">
                            {roleItem.role_name}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {roleItem.matched_skills?.length || 0} matched · {roleItem.missing_skills?.length || 0} missing
                          </span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeColor}`}>
                          {pct}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>

                      {/* Matched Skills */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Matched Competencies:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {roleItem.matched_skills?.length ? (
                            roleItem.matched_skills.map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">None yet</span>
                          )}
                        </div>
                      </div>

                      {/* Missing Skills */}
                      {roleItem.missing_skills?.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-amber-400" />
                            <span>Skills to Acquire:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {roleItem.missing_skills.map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action footer */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-end">
                        <Link
                          to="/roadmap"
                          className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          <span>Plan Learning</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
