import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";

const ROLES = [
  "Software Engineer","Backend Developer","Frontend Developer","Full Stack Developer",
  "Data Analyst","Data Scientist","Machine Learning Engineer","DevOps Engineer","Cloud Engineer",
];

const SKILLS_BY_ROLE = {
  "Backend Developer":        ["Flask","REST API","PostgreSQL","Docker","AWS"],
  "Frontend Developer":       ["React","TypeScript","Tailwind","Next.js"],
  "Full Stack Developer":     ["React","Node.js","PostgreSQL","Docker"],
  "Data Scientist":           ["Machine Learning","TensorFlow","Pandas","Statistics"],
  "Machine Learning Engineer":["PyTorch","MLOps","Docker","Scikit-learn"],
  "DevOps Engineer":          ["Kubernetes","Terraform","CI/CD","Linux"],
  "Cloud Engineer":           ["AWS","Azure","Terraform","Kubernetes"],
  "Data Analyst":             ["SQL","Tableau","Pandas","Excel"],
  "Software Engineer":        ["Data Structures","Algorithms","System Design","SQL"],
};

export default function Roadmap() {
  const [role, setRole]         = useState("");
  const [skills, setSkills]     = useState([]);
  const [custom, setCustom]     = useState("");
  const [hours, setHours]       = useState(10);
  const [weeks, setWeeks]       = useState(8);
  const [loading, setLoading]   = useState(false);
  const [roadmap, setRoadmap]   = useState(null);
  const [openWeek, setOpenWeek] = useState(0);

  const suggestedSkills = SKILLS_BY_ROLE[role] || [];

  const toggleSkill = (s) =>
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const addCustom = () => {
    const s = custom.trim();
    if (s && !skills.includes(s)) { setSkills(p => [...p, s]); setCustom(""); }
  };

  const generate = async () => {
    if (!role) { toast.error("Select a target role"); return; }
    setLoading(true);
    try {
      const res = await api.post("/api/roadmap/generate", {
        target_role: role, missing_skills: skills,
        weekly_hours: hours, duration_weeks: weeks,
      });
      setRoadmap(res.data);
      setOpenWeek(0);
      toast.success("Roadmap generated!");
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0] || "Failed — check Gemini API key");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white mb-1">AI Roadmap Generator</h1>
          <p className="text-gray-400 mb-8">Get a personalized week-by-week learning plan powered by Gemini AI.</p>

          {!roadmap ? (
            <div className="space-y-6">
              {/* Role */}
              <div className="card">
                <label className="block text-sm font-medium text-gray-300 mb-3">Target Role</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ROLES.map(r => (
                    <button key={r} onClick={() => setRole(r)}
                      className={`p-3 rounded-lg border text-sm text-left transition-all
                        ${role === r ? "border-brand-500 bg-brand-600/20 text-white"
                                     : "border-gray-700 text-gray-400 hover:border-gray-600"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills to learn */}
              {role && (
                <div className="card">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Skills you want to learn
                    <span className="text-gray-500 font-normal ml-1">(leave empty for a general roadmap)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Suggested for {role}:</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {suggestedSkills.map(s => (
                      <button key={s} onClick={() => toggleSkill(s)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all
                          ${skills.includes(s)
                            ? "bg-brand-600 border-brand-500 text-white"
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:border-brand-600"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={custom} onChange={e => setCustom(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCustom()}
                      placeholder="Add custom skill..." className="input-field flex-1" />
                    <button onClick={addCustom} className="btn-secondary px-4">Add</button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {skills.map(s => (
                        <span key={s} onClick={() => toggleSkill(s)}
                          className="px-2.5 py-1 bg-brand-900/50 border border-brand-600/50 text-brand-300 text-xs rounded-full cursor-pointer hover:bg-red-900/30 hover:border-red-600/50 hover:text-red-300 transition-colors">
                          {s} ✕
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Duration & Hours */}
              <div className="card">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Duration</label>
                    <div className="flex gap-2">
                      {[4, 8, 12].map(w => (
                        <button key={w} onClick={() => setWeeks(w)}
                          className={`flex-1 py-2 rounded-lg border text-sm transition-all
                            ${weeks === w ? "border-brand-500 bg-brand-600/20 text-white"
                                         : "border-gray-700 text-gray-400 hover:border-gray-600"}`}>
                          {w}w
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Hours/week: <span className="text-brand-400">{hours}h</span>
                    </label>
                    <input type="range" min={5} max={40} step={5} value={hours}
                      onChange={e => setHours(Number(e.target.value))}
                      className="w-full accent-brand-500" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5h</span><span>40h</span>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={generate} disabled={loading || !role}
                className="btn-primary w-full py-3 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Generating with Gemini AI…
                  </span>
                ) : "Generate My Roadmap"}
              </button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Header */}
              <div className="card border-brand-500/30 bg-brand-900/10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{roadmap.target_role}</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      {roadmap.duration_weeks}-week plan · {roadmap.weekly_hours}h/week
                    </p>
                    {roadmap.roadmap?.overview && (
                      <p className="text-gray-300 text-sm mt-2">{roadmap.roadmap.overview}</p>
                    )}
                  </div>
                  <button onClick={() => setRoadmap(null)} className="btn-secondary text-sm">
                    New Roadmap
                  </button>
                </div>
              </div>

              {/* Week accordion */}
              {(roadmap.roadmap?.weeks || []).map((w, i) => (
                <div key={i} className="card cursor-pointer" onClick={() => setOpenWeek(openWeek === i ? -1 : i)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400 text-sm font-bold">
                        {w.week}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">{w.title}</h3>
                        <p className="text-gray-500 text-xs">{w.topics?.join(", ")}</p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-lg">{openWeek === i ? "▲" : "▼"}</span>
                  </div>

                  <AnimatePresence>
                    {openWeek === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-brand-400 mb-2">📚 Topics</p>
                            <ul className="space-y-1">
                              {w.topics?.map((t, j) => (
                                <li key={j} className="text-sm text-gray-300 flex gap-2"><span>•</span>{t}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-green-400 mb-2">🔗 Resources</p>
                            <ul className="space-y-1">
                              {w.resources?.map((r, j) => (
                                <li key={j} className="text-sm text-gray-300 flex gap-2"><span>•</span>{r}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-amber-400 mb-2">✅ Practice Tasks</p>
                            <ul className="space-y-1">
                              {w.tasks?.map((t, j) => (
                                <li key={j} className="text-sm text-gray-300 flex gap-2"><span>•</span>{t}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-purple-400 mb-2">🚀 Mini Project</p>
                            <p className="text-sm text-gray-300">{w.mini_project}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
