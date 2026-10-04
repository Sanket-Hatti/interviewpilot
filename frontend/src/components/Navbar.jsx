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
  Search,
  Sparkles
} from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/roles", label: "Role Match", icon: Target },
  { to: "/roadmap", label: "Roadmap", icon: Compass },
  { to: "/interview", label: "Mock Interview", icon: Mic },
  { to: "/companies", label: "Company Prep", icon: Building2 },
  { to: "/code", label: "Code Studio", icon: Code2 },
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
    <header className="sticky top-0 z-50 bg-[#0b0f17]/95 backdrop-blur-md border-b border-zinc-800/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-4">
          
          {/* Brand Mark */}
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/20 transition-colors">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">
              InterviewPilot
            </span>
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-800/90 text-white font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-zinc-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Command Palette Button */}
            <button
              onClick={onOpenPalette}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 transition-colors"
              title="Search pages (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-[10px] text-zinc-400 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* User Profile */}
            {user && (
              <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800/80">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-xs font-medium text-zinc-300">
                  {getInitials(user.full_name)}
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-800/60"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Mobile Sub-Nav */}
        <div className="flex lg:hidden items-center gap-1 overflow-x-auto py-2 border-t border-zinc-800/70 no-scrollbar">
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
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
