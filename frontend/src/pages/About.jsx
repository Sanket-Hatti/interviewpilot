import { Link } from "react-router-dom";
import { Sparkles, ShieldCheck, Target, Zap, ArrowRight } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-16">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Our Mission</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Preparation built around reality.
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          InterviewPilot was built on a simple observation: technical interviews are among the most consequential milestones in an engineer's career, yet preparation is still treated as unguided guesswork.
        </p>
      </div>

      {/* The Problem & Vision */}
      <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          Why we built InterviewPilot
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <p>
            Candidates typically prepare by solving hundreds of disconnected problems on arbitrary platforms, reading disjointed behavioral lists, and hoping for the best. When an interview doesn't go well, there is rarely constructive feedback—only generic rejection letters.
          </p>
          <p>
            We believe preparation should be personal, measurable, and adaptive. By analyzing your resume against target roles and evaluating your mock interview responses with objective rubrics, InterviewPilot helps you identify your actual skill gaps and guides you toward what to practice next.
          </p>
        </div>
      </div>

      {/* Our 3 Principles */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white tracking-tight text-center">
          What we believe
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Know what to practice</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Don't waste weeks reviewing concepts you have already mastered. Focus on the exact technical gaps that impact your target role.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Know where you stand</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Objective readiness scoring on technical accuracy, structure, and communication depth gives you clarity before speaking with hiring managers.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Improve with every session</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Actionable feedback and senior-candidate benchmark models help you refine your thinking, storytelling, and delivery incrementally.
            </p>
          </div>
        </div>
      </div>

      {/* Contact & CTA */}
      <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Join the public beta
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          Start your personalized interview preparation journey today. Have questions or feedback? Reach out directly at <a href="mailto:support@interviewpilot.ai" className="text-indigo-400 hover:underline">support@interviewpilot.ai</a>.
        </p>
        <div className="pt-2">
          <Link
            to="/register"
            className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-lg"
          >
            <span>Start preparing — Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
