import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";
import { useLocation, Link } from "react-router-dom";
import {
  Compass,
  BookOpen,
  CheckSquare,
  Rocket,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Code2
} from "lucide-react";

const ROLES = [
  "Software Engineer", "Backend Developer", "Frontend Developer", "Full Stack Developer",
  "Data Analyst", "Data Scientist", "Machine Learning Engineer", "DevOps Engineer", "Cloud Engineer",
];

const SKILLS_BY_ROLE = {
  "Backend Developer": ["FastAPI", "REST API", "PostgreSQL", "Docker", "AWS", "Redis"],
  "Frontend Developer": ["React", "TypeScript", "Tailwind CSS", "Next.js", "State Management"],
  "Full Stack Developer": ["React", "Node.js", "FastAPI", "PostgreSQL", "Docker", "REST API"],
  "Data Scientist": ["Machine Learning", "TensorFlow", "Pandas", "Statistics", "PyTorch"],
  "Machine Learning Engineer": ["PyTorch", "MLOps", "Docker", "Scikit-learn", "HuggingFace"],
  "DevOps Engineer": ["Kubernetes", "Terraform", "CI/CD", "Linux", "Docker"],
  "Cloud Engineer": ["AWS", "Azure", "Terraform", "Kubernetes", "Networking"],
  "Data Analyst": ["SQL", "Tableau", "Pandas", "Excel", "PowerBI"],
  "Software Engineer": ["Data Structures", "Algorithms", "System Design", "SQL", "Git"],
};

export default function Roadmap() {
  const location = useLocation();
  const [role, setRole] = useState(location.state?.target_role || "Software Engineer");
  const [skills, setSkills] = useState(location.state?.missing_skills || []);
  const [custom, setCustom] = useState("");
  const [hours, setHours] = useState(15);
  const [weeks, setWeeks] = useState(8);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [openWeek, setOpenWeek] = useState(0);
  const [completedTasks, setCompletedTasks] = useState({});

  useEffect(() => {
    let active = true;

    // Handle auto-generation from Role Match
    if (location.state?.autoGenerate && location.state.target_role) {
      const autoGen = async () => {
        setLoading(true);
        try {
          const res = await api.post("/api/roadmap/generate", {
            target_role: location.state.target_role,
            missing_skills: location.state.missing_skills || [],
            weekly_hours: 15,
            duration_weeks: 8,
          });
          if (active) {
            setRoadmap(res.data);
            setRole(location.state.target_role);
            if (location.state.missing_skills) setSkills(location.state.missing_skills);
            setOpenWeek(0);
            toast.success("Personalized roadmap generated from your detected skill gaps!");
          }
        } catch {
          if (active) toast.error("Could not auto-generate plan. You can configure below.");
        } finally {
          if (active) setLoading(false);
        }
      };
      autoGen();
      return;
    }

    // Otherwise load existing active roadmap
    api.get("/api/roadmap/current")
      .then((res) => {
        if (active && res.data?.has_roadmap && res.data?.roadmap) {
          const rm = res.data.roadmap;
          setRoadmap(rm);
          if (rm.target_role) setRole(rm.target_role);
          if (rm.missing_skills) setSkills(rm.missing_skills);
        }
      })
      .catch(() => {});

    return () => { active = false; };
  }, [location.state]);

  const suggestedSkills = SKILLS_BY_ROLE[role] || [];

  const toggleSkill = (s) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const addCustom = () => {
    const s = custom.trim();
    if (s && !skills.includes(s)) {
      setSkills((p) => [...p, s]);
      setCustom("");
    }
  };

  const toggleTaskDone = (taskKey) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskKey]: !prev[taskKey],
    }));
  };

  const generate = async () => {
    if (!role) {
      toast.error("Please select a target role.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/roadmap/generate", {
        target_role: role,
        missing_skills: skills,
        weekly_hours: hours,
        duration_weeks: weeks,
      });
      setRoadmap(res.data);
      setOpenWeek(0);
      setCompletedTasks({});
      toast.success("Personalized AI roadmap generated!");
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0] || "Generation failed. Check server connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <span>Placement Intelligence</span>
              <span>/</span>
              <span>Adaptive Curriculum</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Personalized Learning Roadmap
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Synthesize your target role, available study hours, and skill gaps into a prioritized week-by-week sprint schedule.
            </p>
          </div>

          {roadmap && (
            <button
              onClick={() => setRoadmap(null)}
              className="btn-secondary flex items-center gap-1.5 text-xs font-semibold px-4 py-2 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Configure New Plan</span>
            </button>
          )}
        </div>

        {/* ── SETUP FORM ── */}
        {!roadmap ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Target Role Selector */}
            <div className="card p-6 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Select Target Engineering Position
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setSkills([]);
                    }}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                      role === r
                        ? "border-indigo-500 bg-indigo-600/20 text-white font-semibold ring-1 ring-indigo-500/50"
                        : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills selection */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Priority Skills to Master
                </label>
                <span className="text-[11px] text-slate-500">
                  {skills.length ? `${skills.length} chosen` : "Leave empty for standard full curriculum"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {suggestedSkills.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSkill(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      skills.includes(s)
                        ? "bg-indigo-600 border-indigo-500 text-white font-semibold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Add custom skill */}
              <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustom()}
                  placeholder="Type custom skill to focus on..."
                  className="input-field text-xs"
                />
                <button
                  onClick={addCustom}
                  className="btn-secondary px-4 text-xs font-semibold shrink-0"
                >
                  Add Focus
                </button>
              </div>
            </div>

            {/* Duration & Weekly Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Duration */}
              <div className="card p-6 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  3. Program Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[4, 8, 12].map((w) => (
                    <button
                      key={w}
                      onClick={() => setWeeks(w)}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                        weeks === w
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {w} Weeks
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly Hours Slider */}
              <div className="card p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    4. Commitment
                  </label>
                  <span className="text-xs font-bold text-indigo-400">
                    {hours} Hours / Week
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={5}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>5h (Casual)</span>
                  <span>20h (Focused)</span>
                  <span>40h (Bootcamp)</span>
                </div>
              </div>

            </div>

            {/* Launch Button */}
            <button
              onClick={generate}
              disabled={loading || !role}
              className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Sprint Curriculum with Groq AI…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Personalized Roadmap</span>
                </>
              )}
            </button>

          </motion.div>
        ) : (
          /* ── ROADMAP RESULTS & TIMELINE ── */
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Overview Hero */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                  {roadmap.target_role}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {roadmap.duration_weeks} Weeks Plan · {roadmap.weekly_hours}h / week
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {roadmap.roadmap?.overview || "Comprehensive preparation track optimized for technical interviews."}
              </p>
            </div>

            {/* Skill Gap Preparation Priorities */}
            {roadmap.missing_skills && roadmap.missing_skills.length > 0 && (
              <div className="card p-5 border-indigo-500/30 bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Your Skill Gap Priorities</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {roadmap.missing_skills.map((skill, idx) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
                      >
                        <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  to="/code"
                  className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold shrink-0 self-start sm:self-auto shadow-md shadow-indigo-600/20"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Start Practice →</span>
                </Link>
              </div>
            )}

            {/* Week Accordion Timeline */}
            <div className="space-y-3">
              {(roadmap.roadmap?.weeks || []).map((weekItem, i) => {
                const isOpen = openWeek === i;
                return (
                  <div
                    key={i}
                    className="card overflow-hidden transition-all border border-slate-800 hover:border-slate-700/80"
                  >
                    {/* Accordion Trigger */}
                    <div
                      onClick={() => setOpenWeek(isOpen ? -1 : i)}
                      className="p-5 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                          W{weekItem.week}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">
                            {weekItem.title}
                          </h3>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>{weekItem.topics?.slice(0, 3).join(", ")}</span>
                            {weekItem.topics?.length > 3 && <span>+{weekItem.topics.length - 3} more</span>}
                          </div>
                        </div>
                      </div>

                      <button className="text-slate-400 hover:text-white">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Accordion Body */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-5 pb-5 pt-2 border-t border-slate-800/70"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                            
                            {/* Topics */}
                            <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                              <div className="font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Core Topics</span>
                              </div>
                              <ul className="space-y-1.5 text-slate-300">
                                {weekItem.topics?.map((t, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-indigo-500 mt-0.5">•</span>
                                    <span>{t}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Resources */}
                            <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                              <div className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Recommended Resources</span>
                              </div>
                              <ul className="space-y-1.5 text-slate-300">
                                {weekItem.resources?.map((r, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-emerald-500 mt-0.5">•</span>
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Interactive Tasks */}
                            <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                              <div className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>Weekly Practice Tasks</span>
                              </div>
                              <div className="space-y-1.5">
                                {weekItem.tasks?.map((task, idx) => {
                                  const taskKey = `${i}-${idx}`;
                                  const isDone = !!completedTasks[taskKey];
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => toggleTaskDone(taskKey)}
                                      className={`flex items-start gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                                        isDone ? "text-slate-500 line-through" : "text-slate-300 hover:bg-slate-900/60"
                                      }`}
                                    >
                                      <CheckCircle2
                                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                                          isDone ? "text-emerald-400" : "text-slate-600"
                                        }`}
                                      />
                                      <span>{task}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Mini Project */}
                            <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                              <div className="font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                <Rocket className="w-3.5 h-3.5" />
                                <span>Milestone Project</span>
                              </div>
                              <p className="text-slate-300 leading-relaxed">
                                {weekItem.mini_project || "Build a working prototype demonstrating the concepts learned this week."}
                              </p>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Next Step in Preparation Journey */}
            <div className="card p-6 border border-indigo-500/40 bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-indigo-400">Next Step in Your Preparation Journey</div>
                <div className="text-base font-bold text-white">Start Your Focused Practice</div>
                <p className="text-xs text-zinc-400 max-w-xl">
                  Your week-by-week preparation plan is active. Begin with targeted algorithmic coding problems or simulate an adaptive mock interview.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  to="/code"
                  className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-5 py-2.5 shadow-lg"
                >
                  <span>Start Practice →</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </motion.div>
        )}

      </div>
    </div>
  );
}
