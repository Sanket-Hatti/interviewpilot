import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user?.full_name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-400 mt-1">Your AI placement dashboard is ready.</p>
          </div>
          <button onClick={logout} className="btn-secondary text-sm">
            Sign out
          </button>
        </div>

        {/* Placeholder cards — filled in Phase 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Resume Analyzer",    icon: "📄", desc: "Upload and score your resume" },
            { title: "Role Matching",      icon: "🎯", desc: "Find your best-fit roles" },
            { title: "AI Roadmap",         icon: "🗺️", desc: "Week-by-week learning plan" },
            { title: "Mock Interview",     icon: "🎤", desc: "AI-powered practice sessions" },
            { title: "DSA Tracker",        icon: "💻", desc: "Track your coding progress" },
            { title: "Company Prep",       icon: "🏢", desc: "Company-specific strategies" },
          ].map(card => (
            <div key={card.title} className="card hover:border-brand-500/50 transition-colors cursor-pointer">
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="font-semibold text-white mb-1">{card.title}</h3>
              <p className="text-gray-400 text-sm">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 card border-brand-500/30">
          <p className="text-brand-400 text-sm font-medium">✅ Phase 1 complete</p>
          <p className="text-gray-400 text-sm mt-1">
            Auth system working. Backend API running. Ready for Phase 2 — Resume Analyzer & Role Matching.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
