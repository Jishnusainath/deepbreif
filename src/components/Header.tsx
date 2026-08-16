import React from "react";
import { Compass, History, Plus, Sparkles } from "lucide-react";

interface HeaderProps {
  onNewResearch: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  isReportView: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNewResearch,
  onOpenHistory,
  historyCount,
  isReportView,
}) => {
  return (
    <header className="w-full border-b border-zinc-800/80 bg-[#090d14]/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={onNewResearch}
          className="flex items-center gap-2.5 group text-left focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center group-hover:border-zinc-500 transition-colors shadow-sm">
            <Compass className="w-4 h-4 text-zinc-200 group-hover:rotate-45 transition-transform duration-300" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-base tracking-tight text-zinc-100 group-hover:text-white transition-colors">
              DeepBrief
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
              Agent
            </span>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {isReportView && (
            <button
              onClick={onNewResearch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 rounded-lg transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Research</span>
            </button>
          )}

          <button
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 rounded-lg transition-all shadow-sm relative"
            title="Research History"
          >
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono font-medium rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 ml-0.5">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
