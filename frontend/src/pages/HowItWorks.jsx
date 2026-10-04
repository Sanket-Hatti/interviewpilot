import { Link } from "react-router-dom";
import {
  FileText,
  Target,
  Mic,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Compass
} from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: FileText,
      title: "Upload your resume",
      description: "InterviewPilot extracts your skills, projects and experience to create your baseline technical profile and evaluate ATS readiness.",
      details: [
        "Instant extraction of programming languages, libraries, and frameworks",
        "ATS formatting audit and keyword density evaluation",
        "Actionable bullet enhancement to quantify project impact"
      ]
    },
    {
      number: "02",
      icon: Target,
      title: "Choose your target role",
      description: "Tell InterviewPilot what job you're preparing for. We benchmark your profile against industry expectations.",
      details: [
        "Benchmark against 9 core software engineering tracks or custom job descriptions",
        "Discover missing skills, prerequisites, and priority gaps",
        "Generate a structured multi-week personalized preparation roadmap"
      ]
    },
    {
      number: "03",
      icon: Mic,
      title: "Practice",
      description: "Take personalized technical, behavioral and coding sessions tailored to your target job profile.",
      details: [
        "AI-evaluated technical scenarios with deep follow-up questions",
        "Behavioral STAR-framework evaluations with objective grading",
        "Live algorithmic coding environment with automated Big-O complexity audits"
      ]
    },
    {
      number: "04",
      icon: TrendingUp,
      title: "Improve",
      description: "Use AI feedback and recommendations to focus on your weakest areas and track longitudinal readiness.",
      details: [
        "Comprehensive scoring across technical depth, communication, and structure",
        "Continuous recommendation updates: 'Improve SQL JOINs', 'Practice behavioral questions'",
        "Know exactly when you're statistically ready for real interviews"
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-20">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Preparation Loop</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          How InterviewPilot works
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          A continuous, personalized cycle that learns where you struggle and adapts your preparation in real time.
        </p>
      </div>

      {/* 4 Steps Walkthrough */}
      <div className="space-y-8">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="p-6 sm:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col md:flex-row items-start gap-6 relative"
            >
              {/* Step indicator */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="md:hidden text-lg font-mono font-bold text-zinc-500">
                  {step.number}
                </div>
              </div>

              {/* Step Content */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {step.title}
                  </h2>
                  <span className="hidden md:inline-block font-mono text-sm font-bold text-zinc-600">
                    Step {step.number}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {step.description}
                </p>

                <ul className="space-y-2 pt-2 border-t border-zinc-800/60">
                  {step.details.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adaptive Workflow Loop */}
      <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-indigo-950/20 to-zinc-900/40 border border-indigo-500/30 text-center space-y-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
          <RefreshCw className="w-5 h-5" />
        </div>
        <div className="space-y-2 max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            The Adaptive Feedback Cycle
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            As you practice, InterviewPilot recalculates your interview readiness score, updates your identified skill gaps, and recommends your next highest-leverage practice module.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/register"
            className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-lg"
          >
            <span>Start your preparation plan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
