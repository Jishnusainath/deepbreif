import React from "react";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";

interface ErrorViewProps {
  error: string;
  query: string;
  onRetry: () => void;
  onBack: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  error,
  query,
  onRetry,
  onBack,
}) => {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-semibold text-zinc-100 mb-2">
          Research Unsuccessful
        </h3>

        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          {error || "We couldn't complete the research right now. Please try again or refine your query."}
        </p>

        {query && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-400 italic mb-6 truncate">
            &ldquo;{query}&rdquo;
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>

          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 transition-colors shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
