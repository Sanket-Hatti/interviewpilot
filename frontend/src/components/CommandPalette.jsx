import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Target,
  Compass,
  Mic,
  Code2,
  Building2,
  Search,
  X,
  ArrowRight
} from "lucide-react";

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const items = [
    { title: "Dashboard Overview", category: "Navigation", to: "/dashboard", icon: LayoutDashboard },
    { title: "Resume ATS Diagnostic", category: "Tools", to: "/resume", icon: FileText },
    { title: "Role Match & Skill Gap", category: "Tools", to: "/roles", icon: Target },
    { title: "Sprint Curriculum Roadmap", category: "Tools", to: "/roadmap", icon: Compass },
    { title: "Mock Interview Simulator", category: "Practice", to: "/interview", icon: Mic },
    { title: "Live Code Studio & Big-O", category: "Practice", to: "/code", icon: Code2 },
    { title: "Target Company Tracks", category: "Preparation", to: "/companies", icon: Building2 },
  ];

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose(prev => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        onClose(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-[#0d0f17] border border-zinc-700/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search pages... (Esc to close)"
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={() => onClose(false)}
            className="p-1 text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    navigate(item.to);
                    onClose(false);
                  }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 cursor-pointer text-xs text-zinc-300 hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{item.title}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{item.category}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-zinc-500">
              No matching pages found for "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Navigation Shortcuts</span>
          <span>Press ESC to exit</span>
        </div>

      </div>
    </div>
  );
}
