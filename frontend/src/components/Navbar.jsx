import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Sparkles,
  LayoutDashboard,
  Compass,
  Mic,
  Code2,
  Building2,
  FileText,
  Target,
  ChevronDown,
  Search,
  LogOut,
  Menu,
  X
} from "lucide-react";

export default function Navbar({ onOpenPalette }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [practiceOpen, setPracticeOpen] = useState(false);
  const [careerOpen, setCareerOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const practiceRef = useRef(null);
  const careerRef = useRef(null);

  // Close dropdowns on route change
  useEffect(() => {
    setPracticeOpen(false);
    setCareerOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (practiceRef.current && !practiceRef.current.contains(e.target)) {
        setPracticeOpen(false);
      }
      if (careerRef.current && !careerRef.current.contains(e.target)) {
        setCareerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const isPracticeActive = ["/interview", "/code", "/companies"].includes(location.pathname);
  const isCareerActive = ["/resume", "/roles"].includes(location.pathname);

  return (
    <header className="sticky top-0 z-50 bg-[#0b0f17]/95 backdrop-blur-md border-b border-zinc-800/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/20 transition-all">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white group-hover:text-zinc-100 transition-colors">
              InterviewPilot
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            
            {/* Dashboard */}
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                location.pathname === "/dashboard"
                  ? "bg-zinc-800/90 text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              Dashboard
            </Link>

            {/* Practice Dropdown */}
            <div className="relative" ref={practiceRef}>
              <button
                onClick={() => {
                  setPracticeOpen(!practiceOpen);
                  setCareerOpen(false);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isPracticeActive || practiceOpen
                    ? "bg-zinc-800/90 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                <span>Practice</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${practiceOpen ? "rotate-180" : ""}`} />
              </button>

              {practiceOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-64 rounded-xl bg-[#111622] border border-zinc-800/90 p-1.5 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <Link
                    to="/interview"
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Mic className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white group-hover:text-indigo-300 transition-colors">
                        Mock Interview
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        AI-evaluated technical & behavioral simulation
                      </p>
                    </div>
                  </Link>

                  <Link
                    to="/code"
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 mt-0.5">
                      <Code2 className="w-3.5 h-3.5 text-zinc-300" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white group-hover:text-indigo-300 transition-colors">
                        Coding Practice
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Live IDE with Big-O & space complexity audits
                      </p>
                    </div>
                  </Link>

                  <Link
                    to="/companies"
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-zinc-300" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white group-hover:text-indigo-300 transition-colors">
                        Company Prep
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Interview patterns and prep tracks for top tech
                      </p>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Roadmap */}
            <Link
              to="/roadmap"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                location.pathname === "/roadmap"
                  ? "bg-zinc-800/90 text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
              }`}
            >
              Roadmap
            </Link>

            {/* Career Dropdown (Resume & Role Match) */}
            <div className="relative" ref={careerRef}>
              <button
                onClick={() => {
                  setCareerOpen(!careerOpen);
                  setPracticeOpen(false);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isCareerActive || careerOpen
                    ? "bg-zinc-800/90 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                <span>Career</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${careerOpen ? "rotate-180" : ""}`} />
              </button>

              {careerOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl bg-[#111622] border border-zinc-800/90 p-1.5 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <Link
                    to="/resume"
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-3.5 h-3.5 text-zinc-300" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white group-hover:text-indigo-300 transition-colors">
                        Resume Analyzer
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        PDF ATS scoring & bullet enhancer
                      </p>
                    </div>
                  </Link>

                  <Link
                    to="/roles"
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0 mt-0.5">
                      <Target className="w-3.5 h-3.5 text-zinc-300" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white group-hover:text-indigo-300 transition-colors">
                        Role Matcher
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Benchmark skills against tech roles
                      </p>
                    </div>
                  </Link>
                </div>
              )}
            </div>

          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Quick Command Palette Button */}
            <button
              onClick={onOpenPalette}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Search commands (⌘K or Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-[10px] text-zinc-400 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* User Profile */}
            {user && (
              <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800/80">
                <div
                  className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-300"
                  title={user.email}
                >
                  {getInitials(user.full_name)}
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors rounded-lg"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-zinc-800/70 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <div className="space-y-1">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                  location.pathname === "/dashboard"
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/roadmap"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                  location.pathname === "/roadmap"
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Compass className="w-4 h-4 text-zinc-400" />
                <span>Roadmap</span>
              </Link>
            </div>

            <div className="pt-2 border-t border-zinc-800/60">
              <div className="px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Practice
              </div>
              <div className="space-y-1">
                <Link
                  to="/interview"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/40"
                >
                  <Mic className="w-4 h-4 text-indigo-400" />
                  <span>Mock Interview</span>
                </Link>
                <Link
                  to="/code"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/40"
                >
                  <Code2 className="w-4 h-4 text-zinc-400" />
                  <span>Coding Practice</span>
                </Link>
                <Link
                  to="/companies"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/40"
                >
                  <Building2 className="w-4 h-4 text-zinc-400" />
                  <span>Company Prep</span>
                </Link>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800/60">
              <div className="px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Career
              </div>
              <div className="space-y-1">
                <Link
                  to="/resume"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/40"
                >
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <span>Resume Analyzer</span>
                </Link>
                <Link
                  to="/roles"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/40"
                >
                  <Target className="w-4 h-4 text-zinc-400" />
                  <span>Role Matcher</span>
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
