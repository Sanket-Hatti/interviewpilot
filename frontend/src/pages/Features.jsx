import { Link } from "react-router-dom";
import {
  FileText,
  Target,
  Mic,
  Code2,
  Compass,
  Building2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Cpu,
  BarChart2
} from "lucide-react";

export default function Features() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-20">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Product Capabilities</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Everything you need to interview with confidence.
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          InterviewPilot replaces scattered notes, generic question banks, and guesswork with an integrated preparation suite.
        </p>
      </div>

      {/* Feature Section 1: Resume Intelligence */}
      <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Resume Intelligence & ATS Optimization
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Transform your resume into a clear technical profile that gets past automated screens.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-semibold text-white">Automated PDF Parsing</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Extracts work history, educational milestones, and core technical proficiencies directly from your PDF without manual entry.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-semibold text-white">ATS Keyword Audit</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Calculates keyword density, formatting flags, and readability metrics against real hiring manager expectations.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-semibold text-white">Bullet-Point Enhancer</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Rephrases weak or passive descriptions into action-oriented statements quantifying business and engineering outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Section 2: Role Matching & Skill Gaps */}
      <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Role Matcher & Gap Detection
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Benchmark your skills against standard industry roles before applying.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-semibold text-white">9-Role Benchmark Matching</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Compares your extracted skills against Frontend, Backend, Full Stack, DevOps, Data, and Machine Learning requirements.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-semibold text-white">Precision Gap Detection</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Identifies missing libraries, framework gaps, and architectural concepts that would result in interview rejection.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-semibold text-white">Custom Role Matcher</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Paste custom job descriptions from LinkedIn or Indeed to calculate a direct compatibility score and customized prep plan.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Section 3: AI Mock Interviews */}
      <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              AI Mock Interviews with STAR Evaluation
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Simulate high-pressure technical and behavioral rounds with objective AI scoring.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-semibold text-white">Technical Scenarios</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Multi-question simulations testing architectural depth, API design, database schemas, and edge case handling.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-semibold text-white">STAR Behavioral Rubric</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Grades responses on Situation, Task, Action, and Result with precise feedback on conciseness and narrative leadership.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-semibold text-white">Instant Model Answers</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Compare your answer with senior-level candidate benchmarks to understand how to structure your answers effectively.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Section 4: Coding & Company Tracks */}
      <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Algorithmic Playground & Company Playbooks
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Practice live programming with automated complexity analysis and company-specific preparation guides.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-semibold text-white">Live Code Execution</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              In-browser IDE supporting Python, JavaScript, and Java with test runner validation.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-semibold text-white">Big-O Complexity Audit</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Automated AI evaluation of your solution's time and space complexity with suggestions for optimization.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="text-xs font-semibold text-white">Target Company Guides</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Curated interview formats, question patterns, and prep playbooks for American Express, TCS, Infosys, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-8 sm:p-10 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Ready to experience personalized preparation?
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
          Create your free account today and discover where your interview skills currently stand.
        </p>
        <Link
          to="/register"
          className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-lg"
        >
          <span>Start preparing — Free</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
