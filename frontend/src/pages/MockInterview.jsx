import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";

const ROLES = [
  "Software Engineer","Backend Developer","Frontend Developer","Full Stack Developer",
  "Data Analyst","Data Scientist","Machine Learning Engineer","DevOps Engineer",
];

const TYPE_COLORS = {
  technical:  "bg-blue-900/30 border-blue-700/40 text-blue-300",
  behavioral: "bg-purple-900/30 border-purple-700/40 text-purple-300",
  hr:         "bg-green-900/30 border-green-700/40 text-green-300",
};

const ScoreBar = ({ label, value, color = "brand" }) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-300">{label}</span>
      <span className={`text-${color}-400 font-semibold`}>{value}/100</span>
    </div>
    <div className="h-2 bg-gray-800 rounded-full">
      <div className={`h-2 bg-${color}-500 rounded-full transition-all`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

export default function MockInterview() {
  const [step, setStep]         = useState("setup");  // setup | questions | result
  const [role, setRole]         = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading]   = useState(false);
  const [interview, setInterview] = useState(null);
  const [answers, setAnswers]   = useState({});
  const [current, setCurrent]   = useState(0);
  const [result, setResult]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/interview/generate", { role, difficulty });
      setInterview(res.data);
      setAnswers({});
      setCurrent(0);
      setStep("questions");
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0] || "Failed — check Gemini API key");
    } finally { setLoading(false); }
  };

  const submitInterview = async () => {
    const questions = interview.questions;
    const answerList = questions.map((_, i) => answers[i] || "");
    const unanswered = answerList.filter(a => !a.trim()).length;
    if (unanswered > 0) {
      toast.error(`Please answer all questions (${unanswered} remaining)`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/api/interview/submit", {
        interview_id: interview.interview_id,
        answers: answerList,
      });
      setResult(res.data);
      setStep("result");
    } catch (e) {
      toast.error("Submission failed. Please try again.");
    } finally { setSubmitting(false); }
  };

  const reset = () => {
    setStep("setup"); setInterview(null);
    setAnswers({}); setResult(null); setCurrent(0);
  };

  const questions = interview?.questions || [];
  const progress  = Object.keys(answers).filter(k => answers[k]?.trim()).length;

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white mb-1">Mock Interview</h1>
          <p className="text-gray-400 mb-8">Practice with AI-generated questions and get instant feedback.</p>

          {/* ── SETUP ── */}
          {step === "setup" && (
            <div className="space-y-6">
              <div className="card">
                <label className="block text-sm font-medium text-gray-300 mb-3">Target Role</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {ROLES.map(r => (
                    <button key={r} onClick={() => setRole(r)}
                      className={`p-2.5 rounded-lg border text-xs text-center transition-all
                        ${role === r ? "border-brand-500 bg-brand-600/20 text-white"
                                     : "border-gray-700 text-gray-400 hover:border-gray-600"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card">
                <label className="block text-sm font-medium text-gray-300 mb-3">Difficulty</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { v: "easy",   label: "Easy",   desc: "Basic concepts",       color: "green"  },
                    { v: "medium", label: "Medium",  desc: "Industry standard",    color: "amber"  },
                    { v: "hard",   label: "Hard",    desc: "Senior level",         color: "red"    },
                  ].map(d => (
                    <button key={d.v} onClick={() => setDifficulty(d.v)}
                      className={`p-4 rounded-lg border text-center transition-all
                        ${difficulty === d.v
                          ? `border-${d.color}-500 bg-${d.color}-900/20`
                          : "border-gray-700 hover:border-gray-600"}`}>
                      <div className={`text-sm font-semibold text-${d.color}-400`}>{d.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card bg-brand-900/10 border-brand-700/30">
                <p className="text-sm text-gray-300 mb-2">📋 What to expect:</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• 5 technical questions specific to {role}</li>
                  <li>• 3 behavioral questions (STAR method)</li>
                  <li>• 3 HR / situational questions</li>
                  <li>• AI scoring on accuracy, communication & completeness</li>
                </ul>
              </div>

              <button onClick={startInterview} disabled={loading} className="btn-primary w-full py-3 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Generating questions…
                  </span>
                ) : "Start Interview"}
              </button>
            </div>
          )}

          {/* ── QUESTIONS ── */}
          {step === "questions" && (
            <div className="space-y-4">
              {/* Progress */}
              <div className="card">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">{role} — {difficulty}</span>
                  <span className="text-brand-400">{progress}/{questions.length} answered</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full">
                  <div className="h-1.5 bg-brand-500 rounded-full transition-all"
                    style={{ width: `${(progress / questions.length) * 100}%` }} />
                </div>
              </div>

              {/* Question tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {questions.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`shrink-0 w-9 h-9 rounded-lg text-sm font-medium border transition-all
                      ${current === i ? "border-brand-500 bg-brand-600 text-white"
                        : answers[i]?.trim() ? "border-green-600 bg-green-900/30 text-green-400"
                        : "border-gray-700 text-gray-400 hover:border-gray-600"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Current question */}
              <AnimatePresence mode="wait">
                <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} className="card">
                  <div className="flex items-start gap-3 mb-4">
                    <span className={`px-2 py-0.5 rounded text-xs border ${TYPE_COLORS[questions[current]?.type]}`}>
                      {questions[current]?.type}
                    </span>
                    <span className="text-xs text-gray-500">Question {current + 1} of {questions.length}</span>
                  </div>
                  <p className="text-white font-medium mb-4 text-base leading-relaxed">
                    {questions[current]?.text}
                  </p>
                  <textarea
                    value={answers[current] || ""}
                    onChange={e => setAnswers(p => ({ ...p, [current]: e.target.value }))}
                    placeholder="Type your answer here… Be specific and use examples where possible."
                    rows={6}
                    className="input-field resize-none"
                  />
                  <div className="flex justify-between mt-4">
                    <button onClick={() => setCurrent(Math.max(0, current - 1))}
                      disabled={current === 0} className="btn-secondary">← Previous</button>
                    {current < questions.length - 1 ? (
                      <button onClick={() => setCurrent(current + 1)} className="btn-primary">Next →</button>
                    ) : (
                      <button onClick={submitInterview} disabled={submitting} className="btn-primary bg-green-600 hover:bg-green-700">
                        {submitting ? "Evaluating…" : "Submit & Get Feedback"}
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* ── RESULT ── */}
          {step === "result" && result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Overall score */}
              <div className="card text-center border-brand-500/30 bg-brand-900/10">
                <p className="text-gray-400 text-sm mb-2">Overall Interview Score</p>
                <div className="text-6xl font-bold text-white mb-1">
                  {result.feedback?.overall_score ?? result.overall_score}
                  <span className="text-2xl text-gray-500">/100</span>
                </div>
                <p className="text-brand-400 text-sm">{role} — {difficulty} difficulty</p>
              </div>

              {/* Score breakdown */}
              <div className="card space-y-4">
                <h3 className="font-semibold text-white">Score Breakdown</h3>
                <ScoreBar label="Technical Accuracy"  value={result.feedback?.technical_accuracy ?? 0} color="blue" />
                <ScoreBar label="Communication"       value={result.feedback?.communication ?? 0}      color="purple" />
                <ScoreBar label="Completeness"        value={result.feedback?.completeness ?? 0}       color="green" />
              </div>

              {/* Feedback */}
              {result.feedback?.detailed_feedback?.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-white mb-3">📋 Detailed Feedback</h3>
                  <ul className="space-y-2">
                    {result.feedback.detailed_feedback.map((f, i) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-brand-400 mt-0.5">→</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {result.feedback?.suggested_improvements?.length > 0 && (
                <div className="card border-amber-700/30">
                  <h3 className="font-semibold text-white mb-3">💡 How to Improve</h3>
                  <ul className="space-y-2">
                    {result.feedback.suggested_improvements.map((s, i) => (
                      <li key={i} className="text-sm text-amber-300 flex gap-2">
                        <span className="mt-0.5">⚡</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button onClick={reset} className="btn-primary w-full py-3">Try Another Interview</button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
