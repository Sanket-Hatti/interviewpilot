import { Link } from "react-router-dom";
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function Pricing() {
  const faqs = [
    {
      q: "Is InterviewPilot really free during public beta?",
      a: "Yes. All core features including resume ATS scoring, role matching, AI mock interviews, code playground, and personalized roadmaps are completely free during our public beta phase."
    },
    {
      q: "Will I need a credit card to sign up?",
      a: "No. You can create an account with just your name, email, and password. No billing information or credit cards are required."
    },
    {
      q: "How is my resume and practice data handled?",
      a: "Your resume and interview transcripts are strictly private and accessible only through your authenticated account. We never share your data with recruiters or third-party advertisers."
    },
    {
      q: "What will happen when paid plans launch?",
      a: "Early beta users will receive grandfathered access and exclusive early-adopter discounts. We will always maintain a generous free tier for candidates."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-20">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Plans & Access</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Simple, honest pricing.
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          InterviewPilot is completely free during public beta. Start preparing today without a credit card.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Community Beta Tier */}
        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/50 border border-indigo-500/50 space-y-6 flex flex-col justify-between relative shadow-xl shadow-indigo-950/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Community Beta</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Active
              </span>
            </div>
            
            <div>
              <div className="text-4xl font-extrabold text-white">
                $0
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Free while in public beta
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Full access to complete end-to-end interview preparation and feedback.
            </p>

            <ul className="space-y-2.5 text-xs text-zinc-300 pt-4 border-t border-zinc-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Resume ATS audit & skill extraction</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>9-role benchmark matching & gap detection</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Technical & behavioral AI mock interviews</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Algorithmic code runner with Big-O audits</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Multi-week custom preparation roadmaps</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Company prep playbooks (Amex, TCS, etc.)</span>
              </li>
            </ul>
          </div>

          <Link
            to="/register"
            className="btn-primary text-center text-xs font-semibold py-3 rounded-lg w-full mt-6"
          >
            Start preparing — Free
          </Link>
        </div>

        {/* Pro Plan Tier */}
        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Pro Plan</span>
              <span className="text-xs text-zinc-500 font-mono">Coming soon</span>
            </div>
            
            <div>
              <div className="text-4xl font-extrabold text-zinc-400">
                —
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Announced with public launch
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Designed for candidates targeting high-stakes staff and senior roles.
            </p>

            <ul className="space-y-2.5 text-xs text-zinc-400 pt-4 border-t border-zinc-800">
              <li>• Real-time voice audio interviews</li>
              <li>• Live interviewer interruption simulation</li>
              <li>• Distributed system architecture canvas</li>
              <li>• Unlimited mock interview recording archives</li>
              <li>• Priority AI evaluation queues</li>
            </ul>
          </div>

          <button
            disabled
            className="btn-secondary opacity-60 cursor-not-allowed text-center text-xs font-medium py-3 rounded-lg w-full mt-6"
          >
            Coming soon
          </button>
        </div>

        {/* Enterprise / Institution Tier */}
        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Institutions</span>
              <span className="text-xs text-zinc-500 font-mono">Custom</span>
            </div>
            
            <div>
              <div className="text-4xl font-extrabold text-zinc-400">
                Custom
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Universities & bootcamps
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Equip your cohort with standardized, measurable interview readiness.
            </p>

            <ul className="space-y-2.5 text-xs text-zinc-400 pt-4 border-t border-zinc-800">
              <li>• Cohort-wide progress & readiness dashboard</li>
              <li>• Custom interview question bank import</li>
              <li>• University career advisor analytics</li>
              <li>• Bulk student provisioning & SSO</li>
            </ul>
          </div>

          <a
            href="mailto:support@interviewpilot.ai"
            className="btn-secondary text-center text-xs font-medium py-3 rounded-lg w-full mt-6"
          >
            Contact us
          </a>
        </div>

      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-6 pt-10 border-t border-zinc-800/60">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-center">
          Frequently asked questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
              <div className="text-sm font-semibold text-white">
                {faq.q}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
