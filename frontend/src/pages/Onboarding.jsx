import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  UploadCloud,
  FileText,
  Building2,
  Briefcase,
  AlertCircle
} from "lucide-react";

const CAREER_GOALS = [
  { id: "Software Engineer", label: "Software Engineer", desc: "General software development & architecture" },
  { id: "Frontend Developer", label: "Frontend Developer", desc: "React, UI/UX systems & client performance" },
  { id: "Backend Developer", label: "Backend Developer", desc: "APIs, distributed systems & databases" },
  { id: "Full Stack Developer", label: "Full Stack Developer", desc: "End-to-end web architecture & cloud" },
  { id: "Data Analyst", label: "Data Analyst", desc: "SQL, business intelligence & data modeling" },
  { id: "Data Engineer", label: "Data Engineer", desc: "ETL pipelines, big data & streaming" },
  { id: "QA / Testing", label: "QA / Testing", desc: "Test automation, CI/CD & quality assurance" },
  { id: "Other", label: "Other", desc: "Custom or specialized technology track" }
];

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Step 1: Career Goal, Step 2: Target Role, Step 3: Resume, Step 4: Completion
  const [step, setStep] = useState(1);

  // Form State
  const [careerGoal, setCareerGoal] = useState(user?.career_goal || "Software Engineer");
  const [targetRole, setTargetRole] = useState(user?.target_role || "Software Engineer");
  const [targetCompany, setTargetCompany] = useState(user?.target_company || "");

  // Resume Upload State
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadedResumeId, setUploadedResumeId] = useState(user?.resume_id || null);
  const [uploadedResumeName, setUploadedResumeName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState(""); // "Uploading...", "Analyzing resume...", "Extracting skills..."
  const [uploadError, setUploadError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Completion saving state
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  const firstName = user?.full_name?.split(" ")[0] || "there";

  // Step 1: Goal Selected -> Next
  const handleSelectGoal = (goal) => {
    setCareerGoal(goal);
    // Auto-prepopulate target role if it was default
    if (!targetRole || targetRole === "Software Engineer" || CAREER_GOALS.some(g => g.id === targetRole)) {
      setTargetRole(goal === "Other" ? "" : goal);
    }
  };

  const handleStep1Continue = () => {
    if (!careerGoal) {
      toast.error("Please select a career goal to continue.");
      return;
    }
    setStep(2);
  };

  // Step 2: Target Role & Company
  const handleStep2Continue = () => {
    if (!targetRole.trim()) {
      toast.error("Please specify your target role.");
      return;
    }
    setStep(3);
  };

  const handleDecideCompanyLater = () => {
    setTargetCompany("");
    if (!targetRole.trim()) {
      setTargetRole(careerGoal || "Software Engineer");
    }
    setStep(3);
  };

  // Step 3: Resume Upload
  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const processSelectedFile = async (file) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit.");
      return;
    }

    setUploadError("");
    setResumeFile(file);
    setUploadedResumeName(file.name);
    setIsUploading(true);
    setUploadStage("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setTimeout(() => setUploadStage("Analyzing resume..."), 800);
      setTimeout(() => setUploadStage("Extracting skills..."), 1800);

      const res = await api.post("/api/resume/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data?.success) {
        setUploadedResumeId(res.data.resume_id);
        toast.success("Resume analyzed successfully!");
      }
    } catch (err) {
      const msg = err.response?.data?.errors?.[0] || "Upload failed. Please check the file and try again.";
      setUploadError(msg);
      setResumeFile(null);
    } finally {
      setIsUploading(false);
      setUploadStage("");
    }
  };

  const handleSkipResume = () => {
    setStep(4);
  };

  const handleStep3Continue = () => {
    setStep(4);
  };

  // Step 4: Final Completion
  const handleFinishOnboarding = async () => {
    setIsSaving(true);
    try {
      const payload = {
        career_goal: careerGoal,
        target_role: targetRole || careerGoal,
        target_company: targetCompany.trim() || null,
        resume_id: uploadedResumeId,
        onboarding_completed: true
      };

      const res = await api.post("/api/auth/onboarding", payload);
      if (res.data?.user) {
        updateUser(res.data.user);
      } else {
        updateUser({ onboarding_completed: true });
      }

      toast.success("Preparation profile initialized!");
      navigate("/dashboard");
    } catch (err) {
      // In case of network glitch, update local state and proceed
      updateUser({ onboarding_completed: true });
      navigate("/dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-zinc-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 antialiased selection:bg-indigo-600 selection:text-white">
      
      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full pt-4 pb-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/25 transition-all">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-white group-hover:text-zinc-100 transition-colors">
            InterviewPilot
          </span>
        </Link>

        {/* Step indicator */}
        {step <= 3 && (
          <div className="text-right">
            <div className="text-xs font-mono font-medium text-zinc-400">
              Step {step} of 3
            </div>
            <div className="w-24 sm:w-32 bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center py-6">
        
        {/* ── STEP 1: CAREER GOAL ── */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in zoom-in-98 duration-200">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Let's personalize your preparation.
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                What are you preparing for?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {CAREER_GOALS.map((goal) => {
                const isSelected = careerGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => handleSelectGoal(goal.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? "bg-indigo-500/10 border-indigo-500/60 shadow-sm shadow-indigo-950/40 text-white"
                        : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70 text-zinc-300"
                    }`}
                  >
                    <div className="pt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-700" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-white">
                        {goal.label}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                        {goal.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleStep1Continue}
                className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold px-6 py-2.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: TARGET ROLE & COMPANY ── */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in zoom-in-98 duration-200">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                What's your target role?
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Specify the exact position and optional target company you're aiming for.
              </p>
            </div>

            <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/80 p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Target role
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Software Engineer, Backend Engineer"
                    className="input-field pl-9 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Target company <span className="text-zinc-500 font-normal">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDecideCompanyLater}
                    className="text-[11px] text-zinc-400 hover:text-indigo-300 transition-colors"
                  >
                    I'll decide later
                  </button>
                </div>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Kyndryl, Google, Amazon"
                    className="input-field pl-9 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-4 py-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleStep2Continue}
                className="btn-primary inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-6 py-2.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: RESUME UPLOAD ── */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in zoom-in-98 duration-200">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Let's start with your resume.
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                Upload your resume so InterviewPilot can understand your skills, projects and experience.
              </p>
            </div>

            {/* Dropzone or Uploaded state */}
            {!resumeFile && !uploadedResumeId ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <div className="text-sm font-semibold text-white">
                  Upload your resume
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Drag & drop or browse
                </p>
                <div className="text-[11px] text-zinc-500 font-mono mt-3">
                  PDF • Max 10MB
                </div>
              </div>
            ) : isUploading ? (
              <div className="border border-zinc-800 rounded-2xl p-8 text-center bg-zinc-900/40 space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-xs sm:text-sm font-semibold text-white">
                  {uploadStage || "Processing..."}
                </div>
                <p className="text-[11px] text-zinc-400">
                  {uploadedResumeName}
                </p>
              </div>
            ) : (
              <div className="border border-indigo-500/40 rounded-2xl p-6 bg-zinc-900/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>Resume uploaded</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 max-w-xs truncate">
                        {uploadedResumeName || "Resume.pdf"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setResumeFile(null);
                      setUploadedResumeId(null);
                      setUploadedResumeName("");
                      setTimeout(() => fileInputRef.current?.click(), 50);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Replace
                  </button>
                </div>
              </div>
            )}

            {/* Error banner */}
            {uploadError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-secondary inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-4 py-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSkipResume}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1.5"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  onClick={handleStep3Continue}
                  className="btn-primary inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-6 py-2.5"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: COMPLETION SCREEN ── */}
        {step === 4 && (
          <div className="space-y-6 text-center animate-in fade-in zoom-in-98 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                You're all set, {firstName} 🎉
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                InterviewPilot is ready to build your personalized preparation plan.
              </p>
            </div>

            {/* Profile Summary Card */}
            <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/80 p-5 text-left space-y-3 max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/60">
                <span className="text-zinc-400">Target role</span>
                <span className="font-semibold text-white">{targetRole || careerGoal}</span>
              </div>

              {targetCompany && (
                <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Target company</span>
                  <span className="font-semibold text-white">{targetCompany}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Resume</span>
                <span className="font-semibold text-indigo-400">
                  {uploadedResumeId ? "Uploaded ✓" : "Pending upload"}
                </span>
              </div>
            </div>

            <div className="pt-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={handleFinishOnboarding}
                disabled={isSaving}
                className="btn-primary w-full inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold py-3 rounded-lg shadow-lg shadow-indigo-600/20"
              >
                <span>{isSaving ? "Finalizing profile..." : "Go to dashboard →"}</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Footer copyright */}
      <div className="text-center text-[11px] text-zinc-600 pb-2">
        InterviewPilot © 2026. All rights reserved.
      </div>

    </div>
  );
}
