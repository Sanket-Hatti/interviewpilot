import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";

const DIFFICULTY_COLORS = {
  easy:   "text-green-400 bg-green-900/30 border-green-700/40",
  medium: "text-amber-400 bg-amber-900/30 border-amber-700/40",
  hard:   "text-red-400 bg-red-900/30 border-red-700/40",
};

const LOGOS = {
  "American Express": "💳",
  "TCS":             "🏢",
  "Infosys":         "💻",
  "Accenture":       "⚡",
  "Wipro":           "🌐",
  "Cognizant":       "🧠",
  "Capgemini":       "🔷",
};

export default function CompanyPrep() {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected]  = useState(null);
  const [loading, setLoading]    = useState(true);

  useEffect(() => {
    api.get("/api/company/").then(r => {
      setCompanies(r.data.companies);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const fetchCompany = async (name) => {
    try {
      const res = await api.get(`/api/company/${name}`);
      setSelected(res.data.company);
    } catch {
      setSelected(companies.find(c => c.company_name === name));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white mb-1">Company Prep</h1>
          <p className="text-gray-400 mb-8">Interview patterns, frequently asked topics, and preparation strategies.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Company list */}
            <div className="space-y-2">
              {companies.map(c => (
                <button key={c.company_name} onClick={() => fetchCompany(c.company_name)}
                  className={`w-full p-4 rounded-xl border text-left transition-all
                    ${selected?.company_name === c.company_name
                      ? "border-brand-500 bg-brand-900/20"
                      : "border-gray-800 bg-gray-900 hover:border-gray-700"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{LOGOS[c.company_name] || "🏢"}</span>
                    <div>
                      <div className="font-medium text-white text-sm">{c.company_name}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[c.difficulty_level]}`}>
                        {c.difficulty_level}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Detail panel */}
            <div className="md:col-span-2">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div key={selected.company_name}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }} className="space-y-4">

                    {/* Header */}
                    <div className="card border-brand-500/20">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-4xl">{LOGOS[selected.company_name] || "🏢"}</span>
                        <div>
                          <h2 className="text-xl font-bold text-white">{selected.company_name}</h2>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[selected.difficulty_level]}`}>
                            {selected.difficulty_level} difficulty
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interview pattern */}
                    {selected.interview_pattern && (
                      <div className="card">
                        <h3 className="font-semibold text-white mb-3">📋 Interview Pattern</h3>
                        <div className="space-y-3">
                          {selected.interview_pattern.rounds?.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-400 mb-2">Rounds:</p>
                              <div className="flex flex-wrap gap-2">
                                {selected.interview_pattern.rounds.map((r, i) => (
                                  <div key={i} className="flex items-center gap-1">
                                    <span className="w-5 h-5 rounded-full bg-brand-600/30 border border-brand-500/40 text-brand-400 text-xs flex items-center justify-center font-bold">
                                      {i + 1}
                                    </span>
                                    <span className="text-sm text-gray-300">{r}</span>
                                    {i < selected.interview_pattern.rounds.length - 1 && (
                                      <span className="text-gray-600 mx-1">→</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {selected.interview_pattern.duration && (
                            <p className="text-sm text-gray-400">
                              ⏱ Duration: <span className="text-gray-200">{selected.interview_pattern.duration}</span>
                            </p>
                          )}
                          {selected.interview_pattern.focus && (
                            <p className="text-sm text-gray-400">
                              🎯 Focus: <span className="text-gray-200">{selected.interview_pattern.focus}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Frequent topics */}
                    {selected.frequent_topics?.length > 0 && (
                      <div className="card">
                        <h3 className="font-semibold text-white mb-3">🔥 Frequently Asked Topics</h3>
                        <div className="flex flex-wrap gap-2">
                          {selected.frequent_topics.map((t, i) => (
                            <span key={i} className="px-3 py-1 bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strategy */}
                    {selected.prep_strategy && (
                      <div className="card border-green-700/30 bg-green-900/5">
                        <h3 className="font-semibold text-white mb-3">💡 Preparation Strategy</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{selected.prep_strategy}</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="h-64 flex flex-col items-center justify-center text-center card">
                    <div className="text-4xl mb-3">👆</div>
                    <p className="text-gray-400">Select a company to see preparation details</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
