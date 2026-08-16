import React, { useState } from "react";
import { X, Trash2, Search, Calendar, ChevronRight, FileText, ArrowUpRight } from "lucide-react";
import { ResearchReport } from "../types/research.js";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ResearchReport[];
  onSelectReport: (report: ResearchReport) => void;
  onDeleteReport: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectReport,
  onDeleteReport,
  onClearHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filtered = history.filter((r) =>
    r.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-zinc-300" />
              <h2 className="text-base font-semibold text-zinc-100">
                Research History
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                {history.length}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar inside history */}
          {history.length > 0 && (
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/40">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter past research..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>
          )}

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <FileText className="w-10 h-10 text-zinc-700 mb-3" />
                <p className="text-sm font-medium text-zinc-400">No saved research yet</p>
                <p className="text-xs text-zinc-600 mt-1 max-w-xs">
                  Your research briefs and source analyses will be saved locally as you generate them.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No matching reports found for &ldquo;{searchTerm}&rdquo;
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-3.5 transition-all cursor-pointer flex items-start justify-between gap-3"
                  onClick={() => {
                    onSelectReport(item);
                    onClose();
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-zinc-200 group-hover:text-white line-clamp-2 leading-snug">
                      {item.query}
                    </h4>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500 font-mono">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="uppercase">{item.depth}</span>
                      <span>•</span>
                      <span>{item.sources?.length || 0} sources</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteReport(item.id);
                      }}
                      className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/80 transition-colors"
                      title="Delete report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Clear All */}
          {history.length > 0 && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Stored in your browser
              </span>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear all research history?")) {
                    onClearHistory();
                  }
                }}
                className="text-xs text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
