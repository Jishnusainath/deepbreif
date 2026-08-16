import React from "react";
import { Check, Loader2, Sparkles, Globe, Filter, Brain, Layers, FileText, ArrowRight } from "lucide-react";
import { ResearchStep, StepProgress } from "../types/research.js";

interface ResearchProgressProps {
  query: string;
  progress: StepProgress;
}

interface StepDef {
  key: ResearchStep;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}

const STEPS: StepDef[] = [
  {
    key: "intent",
    label: "Understanding question",
    sublabel: "Analyzing research intent, entity scope & key dimensions",
    icon: Brain,
  },
  {
    key: "queries",
    label: "Formulating search queries",
    sublabel: "Generating multi-angle search queries across 2026 sources",
    icon: Sparkles,
  },
  {
    key: "search",
    label: "Finding relevant sources",
    sublabel: "Querying live web & retrieving authoritative evidence",
    icon: Globe,
  },
  {
    key: "filtering",
    label: "Filtering & ranking sources",
    sublabel: "Deduplicating and scoring credibility (academic, official, news)",
    icon: Filter,
  },
  {
    key: "extracting",
    label: "Extracting key findings",
    sublabel: "Pulling quantitative metrics, dates, percentages & core claims",
    icon: Layers,
  },
  {
    key: "comparing",
    label: "Comparing information",
    sublabel: "Cross-checking claims and identifying nuances & disagreements",
    icon: Layers,
  },
  {
    key: "synthesizing",
    label: "Preparing your report",
    sublabel: "Synthesizing executive summary, analysis & source index",
    icon: FileText,
  },
];

const STEP_ORDER: ResearchStep[] = [
  "intent",
  "queries",
  "search",
  "filtering",
  "extracting",
  "comparing",
  "synthesizing",
  "complete",
];

export const ResearchProgress: React.FC<ResearchProgressProps> = ({
  query,
  progress,
}) => {
  const currentStepIndex = STEP_ORDER.indexOf(progress.step);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-xl flex flex-col items-center">
        {/* Main Status Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>Researching in background...</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100 mb-3">
            Investigating your topic
          </h2>

          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-4 py-2.5 max-w-md mx-auto text-zinc-300 text-sm font-medium italic truncate">
            &ldquo;{query}&rdquo;
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-900 border border-zinc-800/80 rounded-full h-1.5 mb-8 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(8, progress.percentage || 15)}%` }}
          />
        </div>

        {/* Step List */}
        <div className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 shadow-xl shadow-black/40 space-y-4">
          {STEPS.map((step, idx) => {
            const stepIdx = STEP_ORDER.indexOf(step.key);
            const isCompleted = currentStepIndex > stepIdx || progress.step === "complete";
            const isCurrent = progress.step === step.key;
            const isPending = !isCompleted && !isCurrent;

            return (
              <div
                key={step.key}
                className={`flex items-start gap-3.5 transition-opacity duration-300 ${
                  isPending ? "opacity-35" : "opacity-100"
                }`}
              >
                {/* Status Indicator Icon */}
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    </div>
                  )}
                </div>

                {/* Step Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm font-medium ${
                        isCurrent
                          ? "text-zinc-100 font-semibold"
                          : isCompleted
                          ? "text-zinc-300"
                          : "text-zinc-500"
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <span className="text-[11px] font-mono text-blue-400 animate-pulse">
                        Active
                      </span>
                    )}
                  </div>

                  {isCurrent && progress.detail && (
                    <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                      {progress.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Search Queries preview if generated */}
        {progress.queries && progress.queries.length > 0 && (
          <div className="w-full mt-4 bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3.5">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
              Generated Search Angles ({progress.queries.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {progress.queries.map((q, idx) => (
                <span
                  key={idx}
                  className="text-xs font-mono bg-zinc-900 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded-md truncate max-w-full"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        <p className="text-xs text-zinc-600 mt-6 text-center">
          DeepBrief cross-references multiple independent sources to ensure veracity and depth.
        </p>
      </div>
    </div>
  );
};
