import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard",  label: "Dashboard"  },
  { to: "/resume",     label: "Resume"     },
  { to: "/roles",      label: "Role Match" },
  { to: "/roadmap",    label: "Roadmap"    },
  { to: "/interview",  label: "Interview"  },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  const handleLogout = async () => { await logout(); navigate("/login"); };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 h-14">
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span className="font-bold text-white text-sm hidden sm:block">InterviewPilot</span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors
                ${location.pathname === l.to
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {user && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-gray-400 hidden md:block">{user.full_name}</span>
            <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-1.5">Sign out</button>
          </div>
        )}
      </div>
    </nav>
  );
}
