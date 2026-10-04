import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";
import {
  Mic,
  MicOff,
  Volume2,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Code2,
  Users,
  ShieldAlert,
  ChevronRight,
  Send,
  HelpCircle,
  Building2
} from "lucide-react";

const ROLES = [
  "Software Engineer",
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
];

const TYPE_CONFIG = {
  technical: {
    icon: Code2,
    badge: "Technical Core",
    color: "bg-blue-500/15 border-blue-500/30 text-blue-300",
  },
  behavioral: {
    icon: Users,
    badge: "STAR Behavioral",
    color: "bg-purple-500/15 border-purple-500/30 text-purple-300",
  },
  hr: {
    icon: Briefcase,
    badge: "Culture & HR",
    color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  },
};

export default function MockInterview() {
  const [searchParams] = useSearchParams();
  const companyParam = searchParams.get("company") || "";
  const difficultyParam = searchParams.get("difficulty") || "";

  const [step, setStep] = useState("setup"); // setup | questions | result
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("medium");
  const [company, setCompany] = useState(companyParam);
  const [loading, setLoading] = useState(false);
  const [interview, setInterview] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Audio Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Timer per question
  const [timer, setTimer] = useState(0);

  // AI Hint State
  const [hint, setHint] = useState("");
  const [loadingHint, setLoadingHint] = useState(false);

  useEffect(() => {
    if (companyParam) setCompany(companyParam);
    if (difficultyParam && ["easy", "medium", "hard"].includes(difficultyParam.toLowerCase())) {
      setDifficulty(difficultyParam.toLowerCase());
    }
  }, [companyParam, difficultyParam]);

  useEffect(() => {
    let interval = null;
    if (step === "questions") {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Format Timer as MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  // Text-To-Speech: Speak Question aloud
  const speakQuestion = (text) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech not supported on this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Speech-To-Text: Voice input
  const toggleSpeechToText = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        toast("Listening to your answer…");
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setAnswers((prev) => ({
          ...prev,
          [current]: (prev[current] ? prev[current] + " " : "") + transcript,
        }));
      };

      recognition.onerror = (e) => {
        setIsListening(false);
        toast.error("Microphone error: " + e.error);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      toast.error("Could not activate microphone.");
      setIsListening(false);
    }
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/interview/generate", {
        role,
        difficulty,
        company: company ? company.trim() : undefined,
      });
      setInterview(res.data);
      setAnswers({});
      setCurrent(0);
      setTimer(0);
      setStep("questions");
      toast.success(company ? `${company} track interview session initialized!` : "Interview session initialized!");
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0] || "Failed to generate interview. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const requestHint = async () => {
    const q = questions[current]?.text;
    if (!q) return;
    setLoadingHint(true);
    setHint("");
    try {
      const res = await api.post("/api/interview/chat-stream", {
        prompt: `Give a brief 1-2 sentence guiding hint on how to approach answering this interview question without giving away the full answer:\n"${q}"`,
      });
      if (res.data) {
        const parsed = res.data
          .split("\n")
          .filter((l) => l.startsWith("data: "))
          .map((l) => l.replace("data: ", ""))
          .join("")
          .trim();
        setHint(parsed || "Focus on core principles, trade-offs, and structured real-world examples.");
      } else {
        setHint("Focus on discussing time-space trade-offs and structure your answer using practical edge cases.");
      }
    } catch {
      setHint("Consider starting with the core definition, providing a real-world scenario, and explaining the architectural trade-offs.");
    } finally {
      setLoadingHint(false);
    }
  };

  const submitInterview = async () => {
    const qList = interview.questions;
    const answerList = qList.map((_, i) => answers[i] || "");
    const unanswered = answerList.filter((a) => !a.trim()).length;

    if (unanswered > 0) {
      toast.error(`Please provide an answer for all questions (${unanswered} remaining).`);
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
      window.speechSynthesis?.cancel();
      toast.success("Evaluation complete!");
    } catch (e) {
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    window.speechSynthesis?.cancel();
    setStep("setup");
    setInterview(null);
    setAnswers({});
    setResult(null);
    setCurrent(0);
    setHint("");
  };

  const questions = interview?.questions || [];
  const progress = Object.keys(answers).filter((k) => answers[k]?.trim()).length;

  return (
    <div className="min-h-screen bg-[#0b0f17] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <span>Placement Intelligence</span>
              <span>/</span>
              <span>Mock Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Mock Interview Simulator
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Conduct high-fidelity technical and behavioral mock sessions with speech transcription, question narration, and instant rubric scoring.
            </p>
          </div>

          {step === "questions" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Session Time: <strong className="text-white">{formatTime(timer)}</strong></span>
              </div>
              <button
                onClick={reset}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title="End & Reset Session"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── STEP 1: SETUP ── */}
        {step === "setup" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Target Enterprise Track Banner (if selected from Company Prep) */}
            {company && (
              <div className="card p-4 border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                      Enterprise Target Track
                    </div>
                    <div className="text-sm font-bold text-white">
                      {company} Interview Simulation
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Rubric, questions, and evaluation criteria are weighted toward {company}'s hiring bar.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCompany("")}
                  className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 transition-colors shrink-0"
                >
                  Clear Track
                </button>
              </div>
            )}

            {/* Target Role Selector */}
            <div className="card p-6 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Select Target Engineering Profile
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                      role === r
                        ? "border-indigo-500 bg-indigo-600/20 text-white shadow-md shadow-indigo-600/10 font-semibold ring-1 ring-indigo-500/50"
                        : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 bg-slate-950/40"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Tier */}
            <div className="card p-6 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Select Assessment Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    v: "easy",
                    label: "Entry / Associate",
                    desc: "Core definitions, basic algorithms, OOP fundamentals.",
                    border: "border-emerald-500/40",
                    activeBg: "bg-emerald-500/15 border-emerald-500 text-emerald-300",
                  },
                  {
                    v: "medium",
                    label: "Mid-Level Professional",
                    desc: "System design basics, optimized code, STAR behavioral.",
                    border: "border-indigo-500/40",
                    activeBg: "bg-indigo-500/15 border-indigo-500 text-indigo-300",
                  },
                  {
                    v: "hard",
                    label: "Senior / Staff Engineer",
                    desc: "High-scale architecture, edge cases, executive leadership.",
                    border: "border-rose-500/40",
                    activeBg: "bg-rose-500/15 border-rose-500 text-rose-300",
                  },
                ].map((tier) => (
                  <button
                    key={tier.v}
                    onClick={() => setDifficulty(tier.v)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      difficulty === tier.v
                        ? `${tier.activeBg} shadow-lg`
                        : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-sm font-bold text-white mb-1">{tier.label}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{tier.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Session Scope Card */}
            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Session Composition
                </div>
                <div className="text-slate-300 text-xs sm:text-sm">
                  Includes <strong>5 Technical</strong> + <strong>3 Behavioral (STAR)</strong> + <strong>3 HR Situational</strong> questions.
                </div>
              </div>
              <button
                onClick={startInterview}
                disabled={loading}
                className="btn-primary flex items-center gap-2 px-8 py-3 text-sm font-semibold shrink-0"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Preparing Scenario…</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Launch Interview Session</span>
                  </>
                )}
              </button>
            </div>

          </motion.div>
        )}

        {/* ── STEP 2: ACTIVE QUESTION FLOW ── */}
        {step === "questions" && questions.length > 0 && (
          <div className="space-y-6">

            {/* Navigation & Progress Tracker */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  {role} · <span className="capitalize">{difficulty} Tier</span>
                </span>
                <span className="font-bold text-indigo-400">
                  {progress} of {questions.length} Answered
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(progress / questions.length) * 100}%` }}
                />
              </div>

              {/* Question Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrent(i);
                      setHint("");
                    }}
                    className={`shrink-0 w-8 h-8 rounded-lg text-xs font-semibold border transition-all ${
                      current === i
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : answers[i]?.trim()
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Question Box */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card p-6 sm:p-8 space-y-6 relative"
              >
                {/* Question Type & Narration Bar */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const cfg = TYPE_CONFIG[questions[current]?.type] || TYPE_CONFIG.technical;
                      const Icon = cfg.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{cfg.badge}</span>
                        </span>
                      );
                    })()}
                    <span className="text-xs text-slate-500 font-medium">
                      Question {current + 1} of {questions.length}
                    </span>
                  </div>

                  {/* Audio Speaker */}
                  <button
                    onClick={() => speakQuestion(questions[current]?.text)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    title="Listen to question"
                  >
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <span className="hidden sm:inline">Listen</span>
                  </button>
                </div>

                {/* Question Text */}
                <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                  {questions[current]?.text}
                </h2>

                {/* Candidate Answer Textarea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-400">Your Response:</span>
                    
                    {/* Voice-to-Text Button */}
                    <button
                      onClick={toggleSpeechToText}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        isListening
                          ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse"
                          : "bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25"
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3.5 h-3.5 text-rose-400" />
                          <span>Stop Recording</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Speak Answer</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    value={answers[current] || ""}
                    onChange={(e) => setAnswers((p) => ({ ...p, [current]: e.target.value }))}
                    placeholder="Type or speak your answer... Use structured frameworks (like STAR for behavioral or trade-off analysis for technical)."
                    rows={6}
                    className="input-field resize-none text-xs sm:text-sm leading-relaxed"
                  />
                </div>

                {/* Hint Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button
                    onClick={requestHint}
                    disabled={loadingHint}
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{loadingHint ? "Consulting AI…" : "Need a Hint?"}</span>
                  </button>

                  <span className="text-[11px] text-slate-500">
                    {(answers[current] || "").trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>

                {hint && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
                    <strong>Coach Hint:</strong> {hint}
                  </div>
                )}

                {/* Bottom Navigation Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => {
                      setCurrent(Math.max(0, current - 1));
                      setHint("");
                    }}
                    disabled={current === 0}
                    className="btn-secondary flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  {current < questions.length - 1 ? (
                    <button
                      onClick={() => {
                        setCurrent(current + 1);
                        setHint("");
                      }}
                      className="btn-primary flex items-center gap-1.5 text-xs font-semibold px-5 py-2"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={submitInterview}
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
                    >
                      {submitting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Evaluating Responses…</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Session for Scoring</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

              </motion.div>
            </AnimatePresence>

          </div>
        )}

        {/* ── STEP 3: RESULTS & RUBRIC SCORING ── */}
        {step === "result" && result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Scorecard Hero */}
            <div className="card p-8 text-center space-y-3 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/30">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>Session Rubric Complete</span>
              </div>
              <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Overall Evaluation Score
              </h2>
              <div className="text-6xl font-black text-white tracking-tight">
                {result.feedback?.overall_score ?? result.overall_score}
                <span className="text-2xl text-slate-500 font-normal"> / 100</span>
              </div>
              <p className="text-indigo-300 text-xs sm:text-sm font-medium">
                {role} · <span className="capitalize">{difficulty} Tier Assessment</span>
              </p>
            </div>

            {/* Competency Breakdown */}
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Rubric Competencies
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Technical Accuracy",
                    val: result.feedback?.technical_accuracy ?? 70,
                    color: "bg-blue-500",
                  },
                  {
                    label: "Communication & Articulation",
                    val: result.feedback?.communication ?? 75,
                    color: "bg-purple-500",
                  },
                  {
                    label: "Completeness & Edge Case Handling",
                    val: result.feedback?.completeness ?? 70,
                    color: "bg-emerald-500",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-300">{item.label}</span>
                      <span className="font-bold text-white">{item.val}/100</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`${item.color} h-full rounded-full transition-all duration-700`}
                        style={{ width: `${item.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Feedback & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Detailed Feedback */}
              <div className="card p-6 space-y-3 border-l-4 border-l-indigo-500">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>Strengths Observed</span>
                </h3>
                <ul className="space-y-2">
                  {(result.feedback?.detailed_feedback || []).map((f, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggestions */}
              <div className="card p-6 space-y-3 border-l-4 border-l-amber-500">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Key Growth Areas</span>
                </h3>
                <ul className="space-y-2">
                  {(result.feedback?.suggested_improvements || []).map((s, i) => (
                    <li key={i} className="text-xs text-amber-200 flex items-start gap-2 leading-relaxed">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button onClick={reset} className="btn-primary w-full py-3 text-xs font-semibold">
                Launch Another Practice Session
              </button>
            </div>

          </motion.div>
        )}

      </div>
    </div>
  );
}
