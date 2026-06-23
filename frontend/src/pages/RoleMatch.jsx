import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";

const COMMON_SKILLS = [
  "Python","JavaScript","React","Node.js","Flask","Django","SQL","PostgreSQL",
  "MongoDB","Docker","AWS","Git","Machine Learning","TensorFlow","Pandas",
  "REST API","TypeScript","Java","C++","Kubernetes","Linux","Agile",
];

export default function RoleMatch() {
  const [roles, setRoles]         = useState([]);
  const [selected, setSelected]   = useState([]);
  const [custom, setCustom]       = useState("");
  const [matches, setMatches]     = useState(null);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    api.get("/api/roles/").then(r => setRoles(r.data.roles)).catch(() => {});
  }, []);

  const toggle = (skill) => {
    setSelected(s => s.includes(skill) ? s.filter(x => x !== skill) : [...s, skill]);
  };

  const addCustom = () => {
    const s = custom.trim();
    if (s && !selected.includes(s)) {
      setSelected(prev => [...prev, s]);
      setCustom("");
    }
  };

  const matchRoles = async () => {
    if (!selected.length) { toast.error("Select at least one skill"); return; }
    setLoading(true);
    try {
      const res = await api.post("/api/roles/match", { skills: selected });
      setMatches(res.data);
    } catch {
      toast.error("Matching failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pctColor = (p) => p >= 70 ? "bg-green-500" : p >= 40 ? "bg-amber-500" : "bg-red-500";
  const pctText  = (p) => p >= 70 ? "text-green-400" : p >= 40 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white mb-1">Role Matching</h1>
          <p className="text-gray-400 mb-8">Select your skills to find the best-fit roles and identify skill gaps.</p>

          {/* Skill picker */}
          <div className="card mb-6">
            <h3 className="font-semibold text-white mb-4">Select your skills</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {COMMON_SKILLS.map(skill => (
                <button key={skill} onClick={() => toggle(skill)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all
                    ${selected.includes(skill)
                      ? "bg-brand-600 border-brand-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:border-brand-600"}`}>
                  {skill}
                </button>
              ))}
            </div>

            {/* Custom skill input */}
            <div className="flex gap-2">
              <input
                value={custom}
                onChange={e => setCustom(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCustom()}
                placeholder="Add a custom skill..."
                className="input-field flex-1"
              />
              <button onClick={addCustom} className="btn-secondary px-4">Add</button>
            </div>

            {/* Selected pills */}
            {selected.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-400 mb-2">Selected ({selected.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {selected.map(s => (
                    <span key={s} onClick={() => toggle(s)}
                      className="px-2.5 py-1 bg-brand-900/50 border border-brand-600/50 text-brand-300 text-xs rounded-full cursor-pointer hover:bg-red-900/30 hover:border-red-600/50 hover:text-red-300 transition-colors">
                      {s} ✕
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={matchRoles} disabled={loading || !selected.length} className="btn-primary w-full py-3 text-base mb-8">
            {loading ? "Matching…" : "Find My Best Roles"}
          </button>

          {/* Results */}
          {matches && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Best match hero */}
              {matches.best_match && (
                <div className="card border-brand-500/40 bg-brand-900/10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <p className="text-xs text-brand-400 font-medium">Best Match</p>
                      <h2 className="text-xl font-bold text-white">{matches.best_match.role_name}</h2>
                    </div>
                    <span className={`ml-auto text-3xl font-bold ${pctText(matches.best_match.match_percentage)}`}>
                      {matches.best_match.match_percentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full mt-3">
                    <div className={`h-2 rounded-full ${pctColor(matches.best_match.match_percentage)}`}
                      style={{ width: `${matches.best_match.match_percentage}%` }} />
                  </div>
                </div>
              )}

              {/* All roles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.matches.map((m, i) => (
                  <motion.div key={m.role_id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card hover:border-gray-700 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{m.role_name}</h3>
                      <span className={`text-sm font-bold ${pctText(m.match_percentage)}`}>
                        {m.match_percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full mb-3">
                      <div className={`h-1.5 rounded-full transition-all ${pctColor(m.match_percentage)}`}
                        style={{ width: `${m.match_percentage}%` }} />
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      {m.matched_count}/{m.required_count} required skills matched
                    </div>

                    {m.missing_skills.length > 0 && (
                      <div>
                        <p className="text-xs text-amber-400 mb-1">Skills to learn:</p>
                        <div className="flex flex-wrap gap-1">
                          {m.missing_skills.slice(0, 4).map(s => (
                            <span key={s} className="px-2 py-0.5 bg-amber-900/20 border border-amber-700/30 text-amber-300 text-xs rounded">
                              {s}
                            </span>
                          ))}
                          {m.missing_skills.length > 4 && (
                            <span className="text-xs text-gray-500">+{m.missing_skills.length - 4} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
