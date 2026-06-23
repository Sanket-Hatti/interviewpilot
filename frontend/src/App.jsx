import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";

import Login         from "./pages/Login";
import Register      from "./pages/Register";
import Dashboard     from "./pages/Dashboard";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import RoleMatch     from "./pages/RoleMatch";

// Stub pages for Phase 3+
const Stub = ({ title }) => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="text-center">
      <div className="text-5xl mb-4">🚧</div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400">Coming in the next phase!</p>
    </div>
  </div>
);

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"         element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/resume"    element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
        <Route path="/roles"     element={<ProtectedRoute><RoleMatch /></ProtectedRoute>} />
        <Route path="/roadmap"   element={<ProtectedRoute><Stub title="AI Roadmap Generator" /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><Stub title="Mock Interview" /></ProtectedRoute>} />
        <Route path="/dsa"       element={<ProtectedRoute><Stub title="DSA Tracker" /></ProtectedRoute>} />
        <Route path="/company"   element={<ProtectedRoute><Stub title="Company Prep" /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
