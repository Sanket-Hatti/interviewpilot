import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";
import {
  Building2,
  Layers,
  Clock,
  Target,
  ArrowRight,
  BookOpen,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Play
} from "lucide-react";

export default function CompanyPrep() {
  const [companies, setCompanies] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get("/api/companies/");
        if (res.data?.companies) {
          setCompanies(res.data.companies);
          if (res.data.companies.length > 0) {
            setSelectedId(res.data.companies[0].id);
          }
        }
      } catch (err) {
        toast.error("Failed to load company preparation tracks.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const activeCompany = companies.find((c) => c.id === selectedId) || companies[0];

  const handleStartSim = (company) => {
    toast.success(`Launching ${company.company_name} interview simulation track!`);
    const diff = company.difficulty_level || "medium";
    navigate(`/interview?company=${encodeURIComponent(company.company_name)}&difficulty=${encodeURIComponent(diff)}`);
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-500">
              <span>Placement Intelligence</span>
              <span>/</span>
              <span className="text-zinc-300">Company Battlegrounds</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Target Company Interview Tracks
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl">
              Deconstruct the exact hiring rubrics, round-by-round assessment patterns, and core algorithmic domains of top tech firms.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>{companies.length} Profiles Indexed</span>
          </div>
        </div>

        {/* ── TWO-COLUMN INTERACTIVE ARENA ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Company List (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 mb-2 px-1">
              Select Target Enterprise
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
              {companies.map((comp) => {
                const isSelected = comp.id === selectedId;
                const diffColor =
                  comp.difficulty_level === "hard"
                    ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                    : comp.difficulty_level === "medium"
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

                return (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedId(comp.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-zinc-800/90 border-zinc-700 text-white shadow-sm"
                        : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                        {comp.company_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white">{comp.company_name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {comp.interview_pattern?.duration || "2–3 weeks"}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${diffColor}`}>
                      {comp.difficulty_level}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Company Deep Dive (8 cols) */}
          <div className="lg:col-span-8">
            {activeCompany ? (
              <motion.div
                key={activeCompany.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 sm:p-8 space-y-6"
              >
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        {activeCompany.company_name}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {activeCompany.difficulty_level} tier
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs mt-1">
                      Target Focus: <strong className="text-zinc-200">{activeCompany.interview_pattern?.focus || "Core Engineering"}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartSim(activeCompany)}
                    className="btn-primary flex items-center gap-2 text-xs font-semibold px-5 py-2.5 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Launch Company Simulation</span>
                  </button>
                </div>

                {/* Interview Rounds Flow */}
                <div className="space-y-3">
                  <div className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                    Standard Interview Rounds ({activeCompany.interview_pattern?.rounds?.length || 0} Stages)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(activeCompany.interview_pattern?.rounds || []).map((round, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-1"
                      >
                        <div className="text-[10px] font-mono text-zinc-500 uppercase">
                          Stage 0{i + 1}
                        </div>
                        <div className="font-semibold text-white">{round}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* High Frequency Technical Topics */}
                <div className="space-y-3">
                  <div className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                    High Frequency Topic Domains
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(activeCompany.frequent_topics || []).map((topic, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Strategy Playbook */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Candidate Preparation Playbook</span>
                  </div>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    {activeCompany.prep_strategy}
                  </p>
                </div>

              </motion.div>
            ) : (
              <div className="card p-12 text-center text-zinc-500 text-xs">
                Select a company to view interview rubric.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
