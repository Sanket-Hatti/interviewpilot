import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import CommandPalette from "./components/CommandPalette";
import PublicLayout from "./components/PublicLayout";

import Home from "./pages/Home";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import About from "./pages/About";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import RoleMatch from "./pages/RoleMatch";
import Roadmap from "./pages/Roadmap";
import MockInterview from "./pages/MockInterview";
import CodePlayground from "./pages/CodePlayground";
import CompanyPrep from "./pages/CompanyPrep";

function Layout({ children }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  return (
    <>
      <Navbar onOpenPalette={() => setPaletteOpen(true)} />
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
      {children}
    </>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090a0f]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
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
        {/* Public Marketing Routes */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/features" element={<PublicLayout><Features /></PublicLayout>} />
        <Route path="/how-it-works" element={<PublicLayout><HowItWorks /></PublicLayout>} />
        <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />

        {/* Authentication Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />

        {/* Protected Dashboard & Application Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/resume" element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute><RoleMatch /></ProtectedRoute>} />
        <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
        <Route path="/code" element={<ProtectedRoute><CodePlayground /></ProtectedRoute>} />
        <Route path="/companies" element={<ProtectedRoute><CompanyPrep /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

