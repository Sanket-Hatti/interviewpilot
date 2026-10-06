import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  Send,
  Building2,
  Brain,
  Target,
  TrendingUp,
  Zap,
  Check,
  ChevronDown,
  ChevronUp
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

const DIFFICULTY_CONFIG = {
  easy: {
    label: "Easy / Foundational",
    badge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  },
  medium: {
    label: "Medium / Applied",
    badge: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300",
  },
  hard: {
    label: "Hard / Architecture",
    badge: "bg-rose-500/15 border-rose-500/30 text-rose-300",
  },
};

export default function MockInterview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const companyParam = searchParams.get("company") || "";
  const difficultyParam = searchParams.get("difficulty") || "";

  // Main flow steps: "setup" | "adaptive_interview" | "adaptive_evaluation" | "result" | "classic_questions"
  const [step, setStep] = useState("setup");
  const [interviewMode, setInterviewMode] = useState("adaptive"); // "adaptive" | "classic"

  // Setup options
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("medium");
  const [company, setCompany] = useState(companyParam);
  const [interviewType, setInterviewType] = useState("mixed"); // "technical" | "behavioral" | "mixed"
  const [maxQuestions, setMaxQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Adaptive Interview State
  const [session, setSession] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [nextTurn, setNextTurn] = useState(null);
  const [turnAnswer, setTurnAnswer] = useState("");
  const [turnEvaluation, setTurnEvaluation] = useState(null);
  const [nextActionDecision, setNextActionDecision] = useState(null);
  const [finalReport, setFinalReport] = useState(null);
  const [transcriptTurns, setTranscriptTurns] = useState([]);
  const [showTranscript, setShowTranscript] = useState(false);

  // Classic Batch Interview State (backward compatibility)
  const [classicInterview, setClassicInterview] = useState(null);
  const [classicAnswers, setClassicAnswers] = useState({});
  const [classicCurrent, setClassicCurrent] = useState(0);
  const [classicResult, setClassicResult] = useState(null);
  const [classicSubmitting, setClassicSubmitting] = useState(false);

  // Audio Speech Recognition & Timer
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [timer, setTimer] = useState(0);

  // Coach Hint State
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
    if (["adaptive_interview", "classic_questions"].includes(step)) {
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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
        toast("Listening to your response…", { icon: "🎙️" });
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (step === "adaptive_interview") {
          setTurnAnswer((prev) => (prev ? prev + " " : "") + transcript);
        } else {
          setClassicAnswers((prev) => ({
            ...prev,
            [classicCurrent]: (prev[classicCurrent] ? prev[classicCurrent] + " " : "") + transcript,
          }));
        }
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
    } catch {
      toast.error("Could not activate microphone.");
      setIsListening(false);
    }
  };

  // -------------------------------------------------------------------------
  // ADAPTIVE INTERVIEW FLOW (ONE TURN AT A TIME)
  // -------------------------------------------------------------------------
  const startAdaptiveSession = async () => {
    setLoading(true);
    setLoadingMessage("Starting adaptive interview session...");
    try {
      setLoadingMessage("Retrieving your verified preparation context...");
      const res = await api.post("/api/interview/start", {
        role,
        company: company ? company.trim() : undefined,
        interview_type: interviewType,
        maximum_questions: maxQuestions,
      });

      if (res.data?.success) {
        setSession(res.data.session);
        setCurrentTurn(res.data.turn);
        setTurnAnswer("");
        setTurnEvaluation(null);
        setNextActionDecision(null);
        setTimer(0);
        setStep("adaptive_interview");
        toast.success(`Adaptive interview initialized! Turn 1: ${res.data.turn.topic}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0] || "Failed to start interview. Check connection.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const submitAdaptiveTurn = async () => {
    if (!turnAnswer.trim() || turnAnswer.trim().length < 10) {
      toast.error("Please provide a substantive answer (at least a complete sentence) before submitting.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Evaluating your answer against industry benchmarks...");
    try {
      const res = await api.post(`/api/interview/${session.id}/answer`, {
        answer: turnAnswer.trim(),
      });

      if (res.data?.success) {
        setTurnEvaluation(res.data.turn_evaluation);
        setNextActionDecision(res.data.next_action);
        setSession(res.data.session);

        if (res.data.completed) {
          setFinalReport(res.data.final_report);
          setNextTurn(null);
        } else {
          setNextTurn(res.data.next_turn);
        }

        setStep("adaptive_evaluation");
        window.speechSynthesis?.cancel();
        toast.success("Turn evaluated successfully!");
      }
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0] || "Evaluation failed. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const advanceToNextTurn = () => {
    if (nextTurn) {
      setCurrentTurn(nextTurn);
      setNextTurn(null);
      setTurnAnswer("");
      setTurnEvaluation(null);
      setNextActionDecision(null);
      setHint("");
      setStep("adaptive_interview");
    } else if (finalReport) {
      setStep("result");
      loadTranscript();
    }
  };

  const loadTranscript = async () => {
    if (!session?.id) return;
    try {
      const res = await api.get(`/api/interview/${session.id}/history`);
      if (res.data?.success) {
        setTranscriptTurns(res.data.turns || []);
      }
    } catch (_) {}
  };

  // -------------------------------------------------------------------------
  // CLASSIC BATCH FLOW (BACKWARD COMPATIBILITY)
  // -------------------------------------------------------------------------
  const startClassicInterview = async () => {
    setLoading(true);
    setLoadingMessage("Generating 11-question standard interview set...");
    try {
      const res = await api.post("/api/interview/generate", {
        role,
        difficulty,
        company: company ? company.trim() : undefined,
      });
      setClassicInterview(res.data);
      setClassicAnswers({});
      setClassicCurrent(0);
      setTimer(0);
      setStep("classic_questions");
      toast.success("Batch interview session initialized!");
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0] || "Failed to generate interview.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const submitClassicInterview = async () => {
    const qList = classicInterview?.questions || [];
    const answerList = qList.map((_, i) => classicAnswers[i] || "");
    const unanswered = answerList.filter((a) => !a.trim()).length;

    if (unanswered > 0) {
      toast.error(`Please provide an answer for all questions (${unanswered} remaining).`);
      return;
    }

    setClassicSubmitting(true);
    try {
      const res = await api.post("/api/interview/submit", {
        interview_id: classicInterview.interview_id,
        answers: answerList,
      });
      setClassicResult(res.data);
      setStep("result");
      window.speechSynthesis?.cancel();
      toast.success("Evaluation complete!");
    } catch (e) {
      toast.error("Submission failed. Please try again.");
    } finally {
      setClassicSubmitting(false);
    }
  };

  const requestHint = async () => {
    const qText = step === "adaptive_interview" ? currentTurn?.question : classicInterview?.questions[classicCurrent]?.text;
    if (!qText) return;
    setLoadingHint(true);
    setHint("");
    try {
      const res = await api.post("/api/interview/chat-stream", {
        prompt: `Give a brief 1-2 sentence guiding hint on how to approach answering this interview question without giving away the full answer:\n"${qText}"`,
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

  const reset = () => {
    window.speechSynthesis?.cancel();
    setStep("setup");
    setSession(null);
    setCurrentTurn(null);
    setNextTurn(null);
    setTurnAnswer("");
    setTurnEvaluation(null);
    setFinalReport(null);
    setTranscriptTurns([]);
    setClassicInterview(null);
    setClassicAnswers({});
    setClassicResult(null);
    setTimer(0);
    setHint("");
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
              <span>Adaptive Mock Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>AI Mock Interview Simulator</span>
              {interviewMode === "adaptive" && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30">
                  Adaptive Agent
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Conduct realistic, adaptive mock interviews that observe your responses, probe depth with follow-ups, and calibrate difficulty in real time.
            </p>
          </div>

          {step !== "setup" && (
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

        {/* ── LOADING OVERLAY MODAL ── */}
        {loading && (
          <div className="card p-8 border border-indigo-500/30 bg-slate-900/90 text-center space-y-4 shadow-2xl">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">InterviewPilot Agent Working</h3>
              <p className="text-xs sm:text-sm text-indigo-300">
                {loadingMessage || "Retrieving preparation context and evaluating state..."}
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 1: SETUP ── */}
        {step === "setup" && !loading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setInterviewMode("adaptive")}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  interviewMode === "adaptive"
                    ? "border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500/40"
                    : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Brain className="w-4 h-4" />
                    <span>Adaptive Agentic Interview</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  One question at a time. The agent evaluates each answer in real-time, probes weak spots with intelligent follow-ups, and adapts difficulty.
                </p>
              </div>

              <div
                onClick={() => setInterviewMode("classic")}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  interviewMode === "classic"
                    ? "border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500/40"
                    : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                    <Code2 className="w-4 h-4 text-slate-400" />
                    <span>Classic Batch Mode</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    Static 11-Q
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generates an upfront batch of 11 questions (technical, behavioral, HR). Answer at your own pace and submit all responses simultaneously.
                </p>
              </div>
            </div>

            {/* Target Enterprise Track Banner */}
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
                      Rubric, questions, and evaluation criteria are weighted toward {company}&apos;s hiring bar.
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

            {/* Adaptive Interview Options */}
            {interviewMode === "adaptive" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="card p-6 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    2. Interview Focus Track
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "mixed", label: "Mixed Core", desc: "Tech + Behavioral" },
                      { id: "technical", label: "Technical", desc: "Architecture & Code" },
                      { id: "behavioral", label: "Behavioral", desc: "STAR Leadership" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setInterviewType(t.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          interviewType === t.id
                            ? "border-indigo-500 bg-indigo-500/15 text-white ring-1 ring-indigo-500/40"
                            : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{t.label}</div>
                        <div className="text-[10px] text-slate-400">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card p-6 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    3. Turn Session Length
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { count: 3, label: "Quick Sprint", desc: "3 Adaptive Turns" },
                      { count: 5, label: "Standard Round", desc: "5 Adaptive Turns" },
                      { count: 8, label: "Full Simulation", desc: "8 Adaptive Turns" },
                    ].map((len) => (
                      <button
                        key={len.count}
                        type="button"
                        onClick={() => setMaxQuestions(len.count)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          maxQuestions === len.count
                            ? "border-indigo-500 bg-indigo-500/15 text-white ring-1 ring-indigo-500/40"
                            : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{len.label}</div>
                        <div className="text-[10px] text-slate-400">{len.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-6 space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Select Assessment Tier
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { v: "easy", label: "Entry / Associate", desc: "Core definitions, basic algorithms, OOP." },
                    { v: "medium", label: "Mid-Level Professional", desc: "System design basics, optimized code, STAR." },
                    { v: "hard", label: "Senior / Staff Engineer", desc: "High-scale architecture, trade-offs, leadership." },
                  ].map((tier) => (
                    <button
                      key={tier.v}
                      onClick={() => setDifficulty(tier.v)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        difficulty === tier.v
                          ? "border-indigo-500 bg-indigo-500/15 text-white ring-1 ring-indigo-500/40"
                          : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-sm font-bold text-white mb-1">{tier.label}</div>
                      <div className="text-xs text-slate-400 leading-relaxed">{tier.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Launch Banner */}
            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Interview Calibration Ready</span>
                </div>
                <div className="text-slate-300 text-xs sm:text-sm">
                  {interviewMode === "adaptive"
                    ? `Adaptive agentic session will dynamically calibrate ${maxQuestions} questions based on your live answers.`
                    : "Standard batch mode will generate 11 questions simultaneously."}
                </div>
              </div>
              <button
                onClick={interviewMode === "adaptive" ? startAdaptiveSession : startClassicInterview}
                disabled={loading}
                className="btn-primary flex items-center gap-2 px-8 py-3 text-sm font-semibold shrink-0"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{interviewMode === "adaptive" ? "Start Adaptive Interview" : "Launch Batch Session"}</span>
              </button>
            </div>

          </motion.div>
        )}

        {/* ── STEP 2: ADAPTIVE ACTIVE TURN FLOW ── */}
        {step === "adaptive_interview" && currentTurn && session && (
          <div className="space-y-6">

            {/* Tracker Bar */}
            <div className="card p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{session.target_role}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-indigo-400 capitalize">{session.interview_type} Track</span>
                  {session.target_company && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="text-emerald-400">{session.target_company}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-400">
                    Question {session.question_number} of {session.maximum_questions}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(session.question_number / session.maximum_questions) * 100}%` }}
                />
              </div>

              {/* Topic & Difficulty Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                  Topic: {currentTurn.topic}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border capitalize ${DIFFICULTY_CONFIG[currentTurn.difficulty]?.badge || "bg-slate-800 text-slate-300"}`}>
                  Difficulty: {currentTurn.difficulty}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                  {currentTurn.question_type}
                </span>
              </div>
            </div>

            {/* Adaptation Reason (Why this question?) */}
            {currentTurn.adaptation_reason && (
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  <strong>Why this question:</strong> {currentTurn.adaptation_reason}
                </span>
              </div>
            )}

            {/* Question Card */}
            <div className="card p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Interviewer Question
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                    {currentTurn.question}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => speakQuestion(currentTurn.question)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                  title="Speak Question aloud"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Candidate Answer Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Your Response
                  </label>
                  <button
                    type="button"
                    onClick={toggleSpeechToText}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isListening
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{isListening ? "Stop Dictation" : "Voice Dictate"}</span>
                  </button>
                </div>

                <textarea
                  value={turnAnswer}
                  onChange={(e) => setTurnAnswer(e.target.value)}
                  placeholder="Structure your answer with definitions, real-world architecture examples, and trade-off analysis..."
                  rows={7}
                  className="input-field resize-none text-xs sm:text-sm leading-relaxed"
                />
              </div>

              {/* Hint & Word Count Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <button
                  onClick={requestHint}
                  disabled={loadingHint}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{loadingHint ? "Consulting Coach AI…" : "Need a Hint?"}</span>
                </button>

                <span className="text-[11px] text-slate-500">
                  {turnAnswer.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              {hint && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
                  <strong>Coach Hint:</strong> {hint}
                </div>
              )}

              {/* Submit Turn */}
              <div className="flex items-center justify-end pt-4">
                <button
                  onClick={submitAdaptiveTurn}
                  disabled={loading || !turnAnswer.trim()}
                  className="btn-primary flex items-center gap-2 px-7 py-2.5 text-xs sm:text-sm font-bold shadow-lg"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Answer for AI Evaluation</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ── STEP 3: ADAPTIVE TURN EVALUATION & ADAPTATION REVIEW ── */}
        {step === "adaptive_evaluation" && turnEvaluation && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Turn Scorecard Header */}
            <div className="card p-6 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <span>Turn {turnEvaluation.turn_number} Evaluation</span>
                  <span>•</span>
                  <span>{turnEvaluation.topic}</span>
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  Answer Assessment &amp; Feedback
                </h2>
                <p className="text-xs text-slate-400">
                  Evaluated against hiring expectations for {session?.target_role}.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Turn Score</div>
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {turnEvaluation.score ?? 70}%
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base border ${
                  (turnEvaluation.score ?? 70) >= 80
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : (turnEvaluation.score ?? 70) >= 65
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}>
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Rubric Feedback */}
            <div className="card p-6 space-y-4">
              <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
                AI Coach Assessment
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {turnEvaluation.feedback}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Strengths Observed</span>
                  </div>
                  <ul className="space-y-1.5">
                    {(turnEvaluation.strengths || ["Clearly articulated main definition"]).map((s, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas to Improve */}
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Areas to Improve / Missing Concepts</span>
                  </div>
                  <ul className="space-y-1.5">
                    {(turnEvaluation.missing_concepts && turnEvaluation.missing_concepts.length > 0
                      ? turnEvaluation.missing_concepts
                      : turnEvaluation.weaknesses || ["Discuss production failure modes"]
                    ).map((m, i) => (
                      <li key={i} className="text-xs text-amber-200 flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Adaptation Decision Banner (Why this next step?) */}
            {nextActionDecision && (
              <div className="card p-5 border border-purple-500/30 bg-purple-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                    <Brain className="w-3.5 h-3.5 text-purple-400" />
                    <span>Agent Adaptation Decision: {nextActionDecision.type?.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200">
                    {nextActionDecision.reason}
                  </p>
                </div>

                <button
                  onClick={advanceToNextTurn}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold shrink-0"
                >
                  <span>
                    {nextTurn
                      ? `Continue to Question ${nextTurn.turn_number} →`
                      : "View Comprehensive Diagnostic Report →"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </motion.div>
        )}

        {/* ── STEP 4: FINAL COMPREHENSIVE DIAGNOSTIC REPORT ── */}
        {step === "result" && (finalReport || classicResult) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Hero Banner */}
            <div className="card p-8 text-center space-y-3 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/30">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>Diagnostic Interview Complete</span>
              </div>

              <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Overall Candidate Readiness
              </h2>

              <div className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                {finalReport?.overall_score ?? classicResult?.overall_score ?? 75}
                <span className="text-2xl text-slate-500 font-normal"> / 100</span>
              </div>

              <div className="text-sm font-semibold text-indigo-300">
                {finalReport?.overall_readiness || `${role} · ${difficulty} Assessment Complete`}
              </div>

              <p className="text-xs text-slate-400 max-w-xl mx-auto">
                {finalReport?.job_alignment || "Performance calibrated against active target role benchmarks."}
              </p>
            </div>

            {/* Competency Breakdown */}
            <div className="card p-6 space-y-4">
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Competency Breakdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: "Technical Core",
                    val: typeof finalReport?.technical_score === "number" ? finalReport.technical_score : (classicResult?.feedback?.technical_accuracy ?? 75),
                  },
                  {
                    label: "Communication & Articulation",
                    val: typeof finalReport?.communication_score === "number" ? finalReport.communication_score : (classicResult?.feedback?.communication ?? 80),
                  },
                  {
                    label: "Depth & Problem Solving",
                    val: typeof finalReport?.problem_solving_score === "number" ? finalReport.problem_solving_score : (classicResult?.feedback?.completeness ?? 70),
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">{item.label}</span>
                      <span className="font-bold text-white">{item.val}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${item.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Growth Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strong Areas */}
              <div className="card p-6 space-y-3 border-l-4 border-l-emerald-500">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified Strengths</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(finalReport?.strong_areas || ["API Design", "Database Fundamentals"]).map((s, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Weak Areas */}
              <div className="card p-6 space-y-3 border-l-4 border-l-amber-500">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Focus Areas &amp; Gaps</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(finalReport?.weak_areas && finalReport.weak_areas.length > 0
                    ? finalReport.weak_areas
                    : ["System Design Trade-offs", "Edge Case Testing"]
                  ).map((w, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                      ! {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Closed Loop: Next Best Action Card */}
            {finalReport?.next_best_action && (
              <div className="rounded-xl bg-zinc-900/60 border border-indigo-500/40 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold tracking-wide">
                    <span>✦</span>
                    <span>Recommended Next Best Action</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    Closed-Loop Adaptive
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">
                      {finalReport.next_best_action.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                      {finalReport.next_best_action.description}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(finalReport.next_best_action.route || "/code")}
                    className="btn-primary inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2 shrink-0"
                  >
                    <span>{finalReport.next_best_action.action_label || "Start Practice →"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Collapsible Transcript */}
            {transcriptTurns.length > 0 && (
              <div className="card p-6 space-y-4">
                <button
                  type="button"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white"
                >
                  <span>Turn-By-Turn Q&amp;A Transcript ({transcriptTurns.length} turns)</span>
                  {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showTranscript && (
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    {transcriptTurns.map((turn, idx) => (
                      <div key={turn.id || idx} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-indigo-400">
                            Q{turn.turn_number}: {turn.topic} ({turn.difficulty})
                          </span>
                          <span className="font-bold text-white">{turn.score}%</span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium">{turn.question}</p>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                          <strong>Your Answer:</strong> {turn.answer}
                        </div>
                        {turn.feedback && (
                          <div className="text-[11px] text-indigo-300">
                            <strong>Feedback:</strong> {turn.feedback}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button onClick={reset} className="btn-secondary w-full py-3 text-xs font-semibold">
                Launch Another Practice Session
              </button>
              <button onClick={() => navigate("/dashboard")} className="btn-primary w-full py-3 text-xs font-semibold">
                Return to Dashboard
              </button>
            </div>

          </motion.div>
        )}

      </div>
    </div>
  );
}
