import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="border-t border-zinc-800/70 bg-[#080c14] text-zinc-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          {/* Brand info */}
          <div className="col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/25 transition-all">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-white group-hover:text-zinc-100 transition-colors">
                InterviewPilot
              </span>
            </Link>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              AI-powered interview preparation. Understand your resume, target role, and interview performance to practice what matters.
            </p>
            <div className="pt-1 text-[11px] text-zinc-500">
              Personalized • Objective • Adaptive
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              Product
            </div>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="hover:text-zinc-200 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-zinc-200 transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-zinc-200 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              Resources
            </div>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="hover:text-zinc-200 transition-colors">
                  Mock Interview
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-zinc-200 transition-colors">
                  Coding Practice
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-zinc-200 transition-colors">
                  Company Prep
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              Company
            </div>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-zinc-200 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <a href="mailto:support@interviewpilot.ai" className="hover:text-zinc-200 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <div>
            © 2026 InterviewPilot. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Built for modern software candidates</span>
            <span>•</span>
            <span>Continuous Improvement</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
