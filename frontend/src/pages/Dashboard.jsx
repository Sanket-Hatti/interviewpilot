import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const cards = [
  { title: "Resume Analyzer",  icon: "📄", desc: "Upload and score your resume",        to: "/resume",    done: true  },
  { title: "Role Matching",    icon: "🎯", desc: "Find your best-fit roles",            to: "/roles",     done: true  },
  { title: "AI Roadmap",       icon: "🗺️", desc: "Week-by-week learning plan",          to: "/roadmap",   done: false },
  { title: "Mock Interview",   icon: "🎤", desc: "AI-powered practice sessions",        to: "/interview", done: false },
  { title: "DSA Tracker",      icon: "💻", desc: "Track your coding progress",          to: "/dsa",       done: false },
  { title: "Company Prep",     icon: "🏢", desc: "Company-specific strategies",         to: "/company",   done: false },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user?.full_name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-400 mt-1">Your AI placement dashboard is ready.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card, i) => (
              <motion.div key={card.title}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}>
                <Link to={card.to}
                  className={`card block hover:border-brand-500/50 transition-colors relative
                    ${card.done ? "cursor-pointer" : "opacity-70"}`}>
                  {card.done && (
                    <span className="absolute top-3 right-3 text-xs bg-green-900/50 text-green-400 border border-green-700/40 px-2 py-0.5 rounded-full">
                      Ready
                    </span>
                  )}
                  <div className="text-3xl mb-3">{card.icon}</div>
                  <h3 className="font-semibold text-white mb-1">{card.title}</h3>
                  <p className="text-gray-400 text-sm">{card.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card border-green-700/30 bg-green-900/5">
              <p className="text-green-400 text-sm font-medium mb-1">✅ Phase 2 complete</p>
              <p className="text-gray-400 text-sm">Resume Analyzer and Role Matching are live. Upload your resume to get started!</p>
            </div>
            <div className="card border-brand-700/30 bg-brand-900/5">
              <p className="text-brand-400 text-sm font-medium mb-1">🚀 Coming next</p>
              <p className="text-gray-400 text-sm">AI Roadmap Generator, Mock Interviews, DSA Tracker, and Company Prep.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
