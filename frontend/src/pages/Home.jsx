import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  FileText,
  Target,
  Mic,
  Code2,
  Building2,
  CheckCircle2,
  Compass,
  Zap,
  TrendingUp,
  Brain,
  ShieldCheck,
  BarChart3,
  Layers
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-24 sm:space-y-32 pb-20">

      {/* ── 1. HERO SECTION ── */}
      <section className="pt-16 sm:pt-24 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-8">
        
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>The adaptive interview preparation platform</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] sm:leading-[1.1]">
          Prepare smarter. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-indigo-200 to-indigo-400">
            Interview with confidence.
          </span>
        </h1>

        {/* Supporting Text */}
        <p className="text-base sm:text-lg lg:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          InterviewPilot analyzes your resume, target role, and interview performance to build a personalized preparation plan that helps you focus on what actually matters.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/register"
            className="w-full sm:w-auto btn-primary inline-flex items-center justify-center gap-2 text-sm sm:text-base font-semibold px-6 py-3 rounded-lg shadow-lg shadow-indigo-600/20"
          >
            <span>Start preparing — Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/how-it-works"
            className="w-full sm:w-auto btn-secondary inline-flex items-center justify-center gap-2 text-sm sm:text-base font-medium px-6 py-3 rounded-lg"
          >
            <span>See how it works</span>
          </Link>
        </div>

        {/* Value statement */}
        <div className="pt-4 text-xs sm:text-sm text-zinc-500 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>Resume intelligence</span>
          <span>•</span>
          <span>Personalized practice</span>
          <span>•</span>
          <span>AI feedback</span>
          <span>•</span>
          <span>Progress tracking</span>
        </div>

      </section>

      {/* ── 2. PRODUCT PREVIEW SECTION ── */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-zinc-800 bg-[#0d121c] p-2 sm:p-3 shadow-2xl shadow-indigo-950/30">
          
          {/* Browser Window Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 mb-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/80" />
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-md px-3 py-0.5 text-[11px] text-zinc-400 font-mono hidden sm:inline-block">
              interviewpilot.ai/dashboard
            </div>
            <div className="text-[11px] text-zinc-500 font-medium">
              Demonstration Preview
            </div>
          </div>

          {/* Mock Product Dashboard Interface */}
          <div className="p-4 sm:p-6 space-y-5 bg-[#0b0f17] rounded-xl border border-zinc-800/60">
            
            {/* Header in Preview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3.5">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Welcome back, Alex 👋
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Here's your interview preparation progress and what to focus on next.
                </p>
              </div>

              <div className="shrink-0">
                <span className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 cursor-default pointer-events-none">
                  <span>Start Practice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Compact Readiness Card */}
            <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/70 p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Interview Readiness
                  </span>
                  <div className="text-3xl font-extrabold text-white tracking-tight">
                    72%
                  </div>
                  <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                    You're making steady progress. Focus on SQL JOINs and distributed caching next.
                  </p>
                </div>

                <div className="shrink-0 pt-0.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Progressing Well
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full w-[72%]" />
              </div>

              {/* 4 Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/60">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-zinc-400">Resume</div>
                  <div className="text-sm font-bold text-white">84%</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-zinc-400">Role Fit</div>
                  <div className="text-sm font-bold text-white">78%</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-zinc-400">Technical</div>
                  <div className="text-sm font-bold text-white">72%</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-zinc-400">Behavioral</div>
                  <div className="text-sm font-bold text-white">65%</div>
                </div>
              </div>
            </div>

            {/* Recommended For You Card */}
            <div className="rounded-xl bg-zinc-900/40 border border-indigo-500/30 p-4 sm:p-5 space-y-2.5 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold tracking-wide">
                <span>✦</span>
                <span>Recommended for you</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white tracking-tight">
                    Improve SQL JOINs
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                    Your recent practice shows SQL is currently one of your weakest areas. Complete a targeted exercise to raise your backend readiness score.
                  </p>
                </div>

                <div className="shrink-0">
                  <span className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 cursor-default pointer-events-none">
                    <span>Practice SQL →</span>
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

        <p className="text-center text-xs text-zinc-500 mt-3">
          Interactive preview representing real platform interface and adaptive recommendation logic.
        </p>
      </section>

      {/* ── 3. PROBLEM SECTION ── */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Interview preparation shouldn't be guesswork.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Most candidates spend dozens of hours solving arbitrary problems without knowing whether they address their actual interview weaknesses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-2">
            <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Problem 01
            </div>
            <h3 className="text-base font-semibold text-white">
              Don't know what to study
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Endless lists of questions without clear priorities for your specific career level, experience, and target company requirements.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-2">
            <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Problem 02
            </div>
            <h3 className="text-base font-semibold text-white">
              Don't know what interviewers will ask
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Unclear role expectations and hidden evaluation criteria lead to surprises and missed signals in the real interview room.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-2">
            <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Problem 03
            </div>
            <h3 className="text-base font-semibold text-white">
              Generic practice doesn't adapt to you
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Static question banks test what you already know rather than drilling into the specific technical gaps that cost you offers.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-2">
            <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Problem 04
            </div>
            <h3 className="text-base font-semibold text-white">
              Hard to know whether you're actually improving
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Practicing without objective metrics makes it impossible to know when you're truly ready for high-stakes interviews.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. SOLUTION SECTION: THE ONE PREPARATION SYSTEM ── */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <span>The Unified Approach</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            One preparation system, built around you.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            InterviewPilot connects your resume, target role, interview performance, and practice history into a coherent preparation loop.
          </p>
        </div>

        {/* Visual Pipeline Flow */}
        <div className="rounded-2xl bg-zinc-900/30 border border-zinc-800/80 p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
              <FileText className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
              <div className="text-xs font-semibold text-white">Resume</div>
              <div className="text-[11px] text-zinc-400">Extracted skills & background</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
              <Target className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
              <div className="text-xs font-semibold text-white">Target Role</div>
              <div className="text-[11px] text-zinc-400">Benchmark job requirements</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
              <Mic className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
              <div className="text-xs font-semibold text-white">Interview Performance</div>
              <div className="text-[11px] text-zinc-400">STAR structure & depth</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
              <TrendingUp className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
              <div className="text-xs font-semibold text-white">Practice History</div>
              <div className="text-[11px] text-zinc-400">Longitudinal accuracy</div>
            </div>

          </div>

          {/* Center Processing Engine */}
          <div className="text-center py-2 relative">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-300 text-xs sm:text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>InterviewPilot Intelligence Engine</span>
            </div>
          </div>

          {/* Resulting Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            
            <div className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80">
              <div className="text-xs font-semibold text-white">Skill Gap Analysis</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Identifies exact weaknesses</div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80">
              <div className="text-xs font-semibold text-white">Personalized Roadmap</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Multi-week structured plan</div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80">
              <div className="text-xs font-semibold text-white">Adaptive Practice</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Technical & behavioral sets</div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80">
              <div className="text-xs font-semibold text-indigo-400">Next Best Action</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Clear daily guidance</div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 5. HOW IT WORKS ── */}
      <section id="how-it-works" className="px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <span>Methodology</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            How InterviewPilot works
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Four simple steps from your current resume to interview readiness.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Step 1 */}
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-semibold text-zinc-500">01</span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white">
              Upload your resume
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              InterviewPilot extracts your skills, projects and experience to analyze ATS keyword health.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-semibold text-zinc-500">02</span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white">
              Choose your target role
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tell InterviewPilot what job you're preparing for to benchmark against industry expectations.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Mic className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-semibold text-zinc-500">03</span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white">
              Practice
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Take personalized technical, behavioral, and algorithmic coding practice sessions.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-semibold text-zinc-500">04</span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-white">
              Improve
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Use AI feedback and adaptive recommendations to focus on your weakest areas.
            </p>
          </div>

        </div>
      </section>

      {/* ── 6. AI / AGENTIC WORKFLOW SECTION ── */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Brain className="w-3.5 h-3.5" />
            <span>Adaptive Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Your preparation adapts as you improve.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            InterviewPilot doesn't just generate questions. It learns from your preparation progress and is designed to recommend what you should focus on next.
          </p>
        </div>

        {/* Adaptive Loop Illustration */}
        <div className="rounded-xl bg-zinc-900/40 border border-indigo-500/25 p-6 sm:p-8 space-y-6">
          <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider text-center">
            Example Adaptive Workflow
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center text-center">
            
            <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs font-medium text-zinc-200">
              User completes interview
            </div>

            <div className="text-zinc-500 font-mono text-xs hidden md:block">→</div>

            <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs font-medium text-zinc-200">
              AI evaluates performance
            </div>

            <div className="text-zinc-500 font-mono text-xs hidden md:block">→</div>

            <div className="p-3 rounded-lg bg-zinc-900/90 border border-amber-500/30 text-xs font-medium text-amber-300">
              Weakness detected: <br /> SQL JOINs
            </div>

            <div className="text-zinc-500 font-mono text-xs hidden md:block">→</div>

            <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-500/50 text-xs font-semibold text-indigo-300">
              Recommends: <br /> "Practice SQL JOINs"
            </div>

          </div>

          <div className="pt-2 text-center text-xs text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Once you complete the recommended module and your score improves, InterviewPilot moves to the next highest-leverage weakness.
          </div>
        </div>
      </section>

      {/* ── 7. FEATURE BREAKDOWN (4 CATEGORIES) ── */}
      <section id="features" className="px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <span>Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Built for modern engineering and tech roles
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Focused capabilities designed to replace scattered prep notes and generic question banks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Category 1: Resume Intelligence */}
          <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Resume Intelligence</h3>
                <p className="text-xs text-zinc-400">Extract, score, and optimize</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Resume ATS scoring</strong>: Instant evaluation against industry formatting and keywords.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Skill extraction</strong>: Automatic identification of technical proficiencies and tooling.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Bullet-point enhancer</strong>: Action-driven suggestions to quantify impact.</span>
              </li>
            </ul>
          </div>

          {/* Category 2: Role Preparation */}
          <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Role Preparation</h3>
                <p className="text-xs text-zinc-400">Match expectations & close gaps</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">9-role benchmark matcher</strong>: Compare skills to Backend, Frontend, Full Stack, DevOps, and more.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Skill gap detection</strong>: Highlights missing core technologies and domain fundamentals.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Prerequisite tree</strong>: Clear guidance on what to learn first.</span>
              </li>
            </ul>
          </div>

          {/* Category 3: Interview Practice */}
          <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Interview Practice</h3>
                <p className="text-xs text-zinc-400">Realistic AI mock simulations</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Multi-question simulations</strong>: Technical scenarios tailored to your level and role.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Behavioral STAR grading</strong>: Objective ratings on situation, task, action, and result.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Actionable feedback</strong>: Specific strengths and missing architectural edge cases.</span>
              </li>
            </ul>
          </div>

          {/* Category 4: Career Progress */}
          <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Career Progress</h3>
                <p className="text-xs text-zinc-400">Roadmaps, code, and companies</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Multi-week roadmap</strong>: Structured syllabus broken into manageable weekly milestones.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Algorithmic code runner</strong>: Live editor with automated Big-O complexity audits.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Company tracks</strong>: Targeted prep playbooks for American Express, TCS, Infosys, and more.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ── 8. MOCK INTERVIEW PREVIEW ── */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <span>Realistic Simulation</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            What practicing actually looks like
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Real feedback on technical accuracy, structure, and communication depth after every answer.
          </p>
        </div>

        {/* Mock Interview Window */}
        <div className="rounded-xl border border-zinc-800 bg-[#0d121c] p-4 sm:p-6 space-y-5 shadow-xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">INTERVIEWPILOT</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">Technical Interview</span>
            </div>
            <div className="text-zinc-400 font-mono text-[11px]">
              Question 4 / 10
            </div>
          </div>

          {/* Question Prompt */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
              Question
            </div>
            <div className="text-sm sm:text-base font-semibold text-white">
              "Explain how you would design a scalable REST API."
            </div>
          </div>

          {/* Answer Status */}
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Answer submitted ✓</span>
          </div>

          {/* AI Feedback Card */}
          <div className="rounded-lg bg-zinc-900/60 border border-zinc-800/80 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">AI Evaluation</span>
              <span className="text-[11px] text-zinc-400">Evaluated in 1.4s</span>
            </div>

            {/* Score pill bars */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <div className="text-[11px] text-zinc-400">Technical accuracy</div>
                <div className="text-sm font-bold text-white mt-0.5">82%</div>
              </div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <div className="text-[11px] text-zinc-400">Communication</div>
                <div className="text-sm font-bold text-white mt-0.5">76%</div>
              </div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <div className="text-[11px] text-zinc-400">Structure</div>
                <div className="text-sm font-bold text-white mt-0.5">88%</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <strong className="text-emerald-400">Strength: </strong>
                <span className="text-zinc-300">"Good explanation of API architecture, resource naming, and stateless HTTP verbs."</span>
              </div>
              <div>
                <strong className="text-amber-400">Improve: </strong>
                <span className="text-zinc-300">"Explain how you would handle distributed rate limiting and token bucket algorithms under high concurrency."</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <span className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 cursor-default pointer-events-none">
                <span>Continue interview →</span>
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ── 9. PROGRESS SECTION ── */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <span>Longitudinal Growth</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            See yourself getting better.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Measurable improvement across every interview discipline as you practice targeted recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-semibold">Technical Accuracy</span>
              <span className="text-indigo-400 font-mono font-medium">51% → 78%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full w-[78%]" />
            </div>
            <div className="text-[11px] text-zinc-500">+27% over 4 mock sessions</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-semibold">Algorithmic Coding</span>
              <span className="text-indigo-400 font-mono font-medium">44% → 69%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full w-[69%]" />
            </div>
            <div className="text-[11px] text-zinc-500">+25% in complexity analysis</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-semibold">Behavioral & STAR</span>
              <span className="text-indigo-400 font-mono font-medium">62% → 74%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full w-[74%]" />
            </div>
            <div className="text-[11px] text-zinc-500">+12% in structured communication</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-semibold">Resume ATS Score</span>
              <span className="text-indigo-400 font-mono font-medium">70% → 86%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full w-[86%]" />
            </div>
            <div className="text-[11px] text-zinc-500">+16% after keyword optimization</div>
          </div>

        </div>

        <p className="text-center text-xs text-zinc-500">
          Illustrative progression curves based on platform evaluation metrics.
        </p>
      </section>

      {/* ── 10. PRICING SECTION ── */}
      <section id="pricing" className="px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <span>Pricing</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Transparent, straightforward access
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Free while in public beta. No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Free Tier */}
          <div className="p-6 rounded-xl bg-zinc-900/50 border border-indigo-500/50 space-y-5 flex flex-col justify-between relative">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Community Beta</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Current
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white">
                $0
                <span className="text-xs font-normal text-zinc-400 ml-1">/ beta period</span>
              </div>
              <p className="text-xs text-zinc-400">
                Full access to core preparation tools and simulations.
              </p>
              <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Resume PDF parsing & ATS score</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>9-role benchmark matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI mock interview simulations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Algorithmic coding playground</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Adaptive focus recommendations</span>
                </li>
              </ul>
            </div>

            <Link
              to="/register"
              className="btn-primary text-center text-xs font-semibold py-2.5 rounded-lg w-full mt-4"
            >
              Start preparing — Free
            </Link>
          </div>

          {/* Pro Tier (Coming soon) */}
          <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800 space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Pro Plan</span>
                <span className="text-xs text-zinc-500 font-mono">Coming soon</span>
              </div>
              <div className="text-3xl font-extrabold text-zinc-400">
                —
              </div>
              <p className="text-xs text-zinc-400">
                Advanced multi-agent interview simulations and live voice streaming.
              </p>
              <ul className="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800">
                <li>• Live voice audio interviews</li>
                <li>• Real-time interviewer interruption handling</li>
                <li>• Deep architectural system design canvas</li>
                <li>• Unlimited interview session histories</li>
              </ul>
            </div>

            <button
              disabled
              className="btn-secondary opacity-60 cursor-not-allowed text-center text-xs font-medium py-2.5 rounded-lg w-full mt-4"
            >
              Coming soon
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800 space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Institutions</span>
                <span className="text-xs text-zinc-500 font-mono">Custom</span>
              </div>
              <div className="text-3xl font-extrabold text-zinc-400">
                Custom
              </div>
              <p className="text-xs text-zinc-400">
                For universities, bootcamps, and career accelerators.
              </p>
              <ul className="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800">
                <li>• Cohort-level readiness dashboards</li>
                <li>• Custom rubrics for university placements</li>
                <li>• Bulk candidate licensing</li>
                <li>• Dedicated advisor analytics</li>
              </ul>
            </div>

            <a
              href="mailto:support@interviewpilot.ai"
              className="btn-secondary text-center text-xs font-medium py-2.5 rounded-lg w-full mt-4"
            >
              Contact us
            </a>
          </div>

        </div>
      </section>

      {/* ── 11. VALUE STANCE / SOCIAL PROOF ── */}
      <section className="px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="p-8 sm:p-10 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-center space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Built for candidates who want preparation to be personal, measurable and practical.
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            No empty praise. No arbitrary question quotas. Only rigorous feedback on what you need to improve before speaking with real hiring managers.
          </p>
        </div>
      </section>

      {/* ── 12. FINAL CALL TO ACTION ── */}
      <section className="px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Stop guessing what to prepare. <br />
          <span className="text-zinc-400 font-semibold text-2xl sm:text-4xl block mt-2">
            Build your preparation around the role you actually want.
          </span>
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Link
            to="/register"
            className="w-full sm:w-auto btn-primary inline-flex items-center justify-center gap-2 text-sm sm:text-base font-semibold px-7 py-3 rounded-lg shadow-xl shadow-indigo-600/25"
          >
            <span>Start preparing — Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/features"
            className="w-full sm:w-auto btn-secondary inline-flex items-center justify-center gap-2 text-sm sm:text-base font-medium px-7 py-3 rounded-lg"
          >
            <span>Explore features →</span>
          </Link>
        </div>
      </section>

    </div>
  );
}
