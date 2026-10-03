import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Target,
  Compass,
  Mic,
  Code2,
  Building2,
  LogOut,
  Command,
  Plus,
  Search
} from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resume", label: "Resume ATS", icon: FileText },
  { to: "/roles", label: "Role Match", icon: Target },
  { to: "/roadmap", label: "Curriculum", icon: Compass },
  { to: "/interview", label: "Mock Studio", icon: Mic },
  { to: "/code", label: "Code Studio", icon: Code2 },
  { to: "/companies", label: "Company Tracks", icon: Building2 },
];

export default function Navbar({ onOpenPalette }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#090a0f]/90 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4">
          
          {/* Brand Mark */}
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-100 group-hover:bg-zinc-700 transition-colors">
              <Command className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                InterviewPilot
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
                PRO
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Command Palette Button */}
            <button
              onClick={onOpenPalette}
              className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-400 font-mono transition-colors"
              title="Search or execute commands (Ctrl+K)"
            >
              <Search className="w-3 h-3 text-zinc-500" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">
                ⌘K
              </kbd>
            </button>

            {/* Quick Mock CTA */}
            <Link
              to="/interview"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span>New Session</span>
            </Link>

            {/* User Profile */}
            {user && (
              <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800">
                <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono font-semibold text-zinc-300">
                  {getInitials(user.full_name)}
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors rounded"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Mobile Sub-Nav */}
        <div className="flex lg:hidden items-center gap-1 overflow-x-auto py-2 border-t border-zinc-800/80 no-scrollbar">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap ${
                  isActive
                    ? "bg-zinc-800 text-white font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
