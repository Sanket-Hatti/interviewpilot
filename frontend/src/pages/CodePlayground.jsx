import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";
import {
  Code2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Sparkles,
  Zap,
  Terminal,
  ChevronRight
} from "lucide-react";

const PROBLEMS = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Array & Hash Table",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
    ],
    starterCode: {
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    pass`,
      javascript: `function twoSum(nums, target) {
    // Write your solution here
    return [];
}`,
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    // Write your solution here
    return {};
}`
    }
  },
  {
    id: "valid-anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    category: "String & Hash Table",
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An Anagram is a word formed by rearranging the letters of a different word, typically using all the original letters exactly once.`,
    examples: [
      { input: "s = 'anagram', t = 'nagaram'", output: "true" },
      { input: "s = 'rat', t = 'car'", output: "false" }
    ],
    starterCode: {
      python: `def is_anagram(s: str, t: str) -> bool:
    # Write your solution here
    pass`,
      javascript: `function isAnagram(s, t) {
    // Write your solution here
    return false;
}`,
      cpp: `bool isAnagram(string s, string t) {
    // Write your solution here
    return false;
}`
    }
  },
  {
    id: "best-time-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    category: "Dynamic Programming",
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i-th\` day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve.`,
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5 (Buy day 2 @ 1, sell day 5 @ 6)" }
    ],
    starterCode: {
      python: `def max_profit(prices: list[int]) -> int:
    # Write your solution here
    pass`,
      javascript: `function maxProfit(prices) {
    // Write your solution here
    return 0;
}`,
      cpp: `int maxProfit(vector<int>& prices) {
    // Write your solution here
    return 0;
}`
    }
  }
];

export default function CodePlayground() {
  const [selectedProblem, setSelectedProblem] = useState(PROBLEMS[0]);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(PROBLEMS[0].starterCode.python);
  const [evaluating, setEvaluating] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSelectProblem = (prob) => {
    setSelectedProblem(prob);
    setCode(prob.starterCode[language] || prob.starterCode.python);
    setReviewResult(null);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(selectedProblem.starterCode[lang] || selectedProblem.starterCode.python);
  };

  const handleRunEvaluation = async () => {
    if (!code.trim()) {
      toast.error("Please provide code to evaluate.");
      return;
    }
    setEvaluating(true);
    try {
      const res = await api.post("/api/code/review", {
        problem: selectedProblem.description,
        code,
        language
      });
      setReviewResult(res.data.evaluation);
      toast.success("AI Code review and complexity analysis complete!");
    } catch (err) {
      toast.error("Evaluation failed. Check backend connection.");
    } finally {
      setEvaluating(false);
    }
  };

  const copyOptimized = () => {
    if (!reviewResult?.optimized_code) return;
    navigator.clipboard.writeText(reviewResult.optimized_code);
    setCopied(true);
    toast.success("Optimized code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] bg-grid-pattern p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-500">
              <span>Placement Intelligence</span>
              <span>/</span>
              <span className="text-zinc-300">Live Code Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Algorithmic Code Studio & Complexity Analyzer
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Implement solutions, test edge cases, and receive rigorous Big-O time and space complexity audits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCode(selectedProblem.starterCode[language] || "")}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
              title="Reset code to starter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleRunEvaluation}
              disabled={evaluating}
              className="btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-2"
            >
              {evaluating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Auditing Solution…</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run Big-O & AI Review</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── SPLIT PANE WORKSPACE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Problem Statement & Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Problem List Drawer */}
            <div className="card p-4 space-y-2">
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                Interview Problems
              </div>
              <div className="space-y-1.5">
                {PROBLEMS.map((prob) => (
                  <button
                    key={prob.id}
                    onClick={() => handleSelectProblem(prob)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition-all flex items-center justify-between ${
                      selectedProblem.id === prob.id
                        ? "bg-zinc-800 border-zinc-700 text-white font-semibold"
                        : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <span>{prob.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400">
                      {prob.difficulty}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Problem Details */}
            <div className="card p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">
                    {selectedProblem.title}
                  </h2>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {selectedProblem.category}
                  </span>
                </div>
                <div className="mt-3 text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                  {selectedProblem.description}
                </div>
              </div>

              {/* Examples */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="text-[11px] font-mono uppercase text-zinc-400 font-semibold">
                  Test Scenarios
                </div>
                {selectedProblem.examples.map((ex, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono space-y-1">
                    <div><span className="text-zinc-500">Input:</span> <span className="text-zinc-300">{ex.input}</span></div>
                    <div><span className="text-zinc-500">Output:</span> <span className="text-indigo-400 font-semibold">{ex.output}</span></div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Code Editor & AI Review Pane (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Editor Window */}
            <div className="card p-0 overflow-hidden border border-zinc-800">
              
              {/* Window Titlebar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  </div>
                  <span className="text-xs font-mono text-zinc-400 ml-2">
                    solution.{language === "python" ? "py" : language === "javascript" ? "js" : "cpp"}
                  </span>
                </div>

                {/* Language Switcher */}
                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-md border border-zinc-800">
                  {["python", "javascript", "cpp"].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-mono uppercase transition-colors ${
                        language === lang
                          ? "bg-zinc-800 text-white font-bold"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Area */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={14}
                spellCheck="false"
                className="w-full bg-[#090a0f] p-4 text-xs font-mono text-zinc-200 leading-relaxed resize-none focus:outline-none focus:ring-0 border-none select-text"
              />

              {/* Status bar */}
              <div className="px-4 py-2 bg-zinc-950/80 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>UTF-8 · Tab Size: 4</span>
                <span>{code.split("\n").length} Lines · {code.length} Chars</span>
              </div>
            </div>

            {/* AI Review Result Drawer */}
            {reviewResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6 space-y-4 border-l-4 border-l-indigo-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                      Technical Interview Audit Result
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-zinc-800 text-indigo-400 border border-zinc-700">
                    Rating: {reviewResult.score}/100
                  </span>
                </div>

                {/* Big-O Complexity Meter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Time Complexity</div>
                    <div className="text-white font-bold mt-0.5">{reviewResult.time_complexity}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase">Space Complexity</div>
                    <div className="text-white font-bold mt-0.5">{reviewResult.space_complexity}</div>
                  </div>
                </div>

                {/* Review Summary */}
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {reviewResult.review_summary}
                </p>

                {/* Edge Cases */}
                {reviewResult.edge_cases?.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                      Edge Case Analysis
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {reviewResult.edge_cases.map((ec, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800"
                        >
                          <span className="text-zinc-300 text-[11px]">{ec.case}</span>
                          <span className={ec.passed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            {ec.passed ? "Passed" : "Failed"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimized Solution */}
                {reviewResult.optimized_code && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
                        Optimized Reference Solution
                      </span>
                      <button
                        onClick={copyOptimized}
                        className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? "Copied" : "Copy Code"}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 overflow-x-auto">
                      {reviewResult.optimized_code}
                    </pre>
                  </div>
                )}

              </motion.div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
