import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, Sparkles, Zap, Layers, Cpu, Search, Check } from "lucide-react";
import { ResearchDepth } from "../types/research.js";

interface LandingHeroProps {
  onStartResearch: (query: string, depth: ResearchDepth) => void;
  isLoading: boolean;
}

const DEPTH_OPTIONS: Array<{
  id: ResearchDepth;
  name: string;
  desc: string;
  icon: React.ElementType;
}> = [
  {
    id: "quick",
    name: "Quick",
    desc: "Fast synthesis with primary sources",
    icon: Zap,
  },
  {
    id: "standard",
    name: "Standard",
    desc: "Balanced depth & cross-source check",
    icon: Layers,
  },
  {
    id: "deep",
    name: "Deep",
    desc: "Exhaustive multi-angle investigation",
    icon: Cpu,
  },
];

const SUGGESTIONS = [
  "Compare ChatGPT, Claude, Gemini and Perplexity for students in 2026",
  "Compare the latest AI coding assistants for software engineers in 2026",
  "Solid-state EV battery commercialization timelines and market leaders",
  "CRISPR gene therapy approvals and clinical pipeline status",
];

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartResearch,
  isLoading,
}) => {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState<ResearchDepth>("standard");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;
    onStartResearch(query.trim(), depth);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-3xl flex flex-col items-center text-center">
        {/* Subtle Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-400 text-xs font-mono mb-8 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Autonomous Multi-Source Research Agent
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-zinc-100 leading-[1.12] mb-4">
          Research anything.
          <br />
          <span className="text-zinc-400 font-normal">Understand everything.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-zinc-400 max-w-xl font-normal leading-relaxed mb-10">
          DeepBrief researches the web, compares information, and turns it into a clear, structured report.
        </p>

        {/* Main Search Input Container */}
        <div className="w-full bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black/60 focus-within:border-zinc-700 transition-all">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative flex items-start gap-3">
              <Search className="w-5 h-5 text-zinc-500 mt-2.5 shrink-0 ml-1" />
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What do you want to research? (e.g. Compare the latest AI coding assistants...)"
                rows={2}
                className="w-full bg-transparent text-zinc-100 placeholder:text-zinc-600 text-base sm:text-lg focus:outline-none resize-none pt-1.5 leading-relaxed"
                disabled={isLoading}
              />
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800/60">
              {/* Depth Selector */}
              <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80 w-full sm:w-auto justify-center sm:justify-start">
                {DEPTH_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = depth === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDepth(opt.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                      }`}
                      title={opt.desc}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-zinc-200" : "text-zinc-500"}`} />
                      <span>{opt.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Research Action Button */}
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg hover:shadow-zinc-100/10 active:scale-[0.98]"
              >
                <span>Research</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Suggestion Chips */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-2xl">
          <span className="text-xs text-zinc-600 mr-1 font-mono uppercase tracking-wider">
            Try:
          </span>
          {SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(suggestion);
                textareaRef.current?.focus();
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-lg px-3 py-1.5 transition-all text-left truncate max-w-[280px] sm:max-w-[360px]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
