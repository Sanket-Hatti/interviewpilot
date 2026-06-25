import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const cards = [
  { title: "Resume Analyzer", icon: "📄", desc: "Upload your resume for AI-powered scoring and skill extraction", to: "/resume",    color: "from-brand-900/40 to-brand-800/20"   },
  { title: "Role Matching",   icon: "🎯", desc: "Match your skills against 9 tech roles and find your best fit",  to: "/roles",     color: "from-purple-900/40 to-purple-800/20" },
  { title: "AI Roadmap",      icon: "🗺️",  desc: "Get a personalized week-by-week study plan for your target role", to: "/roadmap",   color: "from-teal-900/40 to-teal-800/20"    },
  { title: "Mock Interview",  icon: "🎤", desc: "Practice with AI-generated questions and get instant feedback",  to: "/interview", color: "from-orange-900/40 to-orange-800/20" },
];

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          {/* Hero */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user?.full_name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Your AI-powered placement coach is ready.</p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cards.map((card, i) => (
              <motion.div key={card.title}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}>
                <Link to={card.to}
                  className={`block rounded-2xl p-6 bg-gradient-to-br ${card.color} border border-gray-800 hover:border-brand-600/50 transition-all hover:scale-[1.02] duration-200`}>
                  <div className="text-4xl mb-4">{card.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
                  <div className="mt-4 text-brand-400 text-sm font-medium flex items-center gap-1">
                    Get started <span>→</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Status */}
          <div className="mt-8 p-4 rounded-xl bg-gray-900 border border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
              <span className="text-green-400 text-sm font-medium">All systems operational</span>
            </div>
            <p className="text-gray-500 text-xs">Powered by Groq AI (Llama 3) · Resume analysis · Role matching · Roadmap generation · Mock interviews</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
