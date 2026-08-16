import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header.js";
import { LandingHero } from "./components/LandingHero.js";
import { ResearchProgress } from "./components/ResearchProgress.js";
import { ReportView } from "./components/ReportView.js";
import { HistoryDrawer } from "./components/HistoryDrawer.js";
import { ErrorView } from "./components/ErrorView.js";
import { Toast } from "./components/Toast.js";
import {
  ResearchDepth,
  ResearchReport,
  StepProgress,
} from "./types/research.js";
import {
  runResearch,
  getHistory,
  deleteReportFromHistory,
  clearHistory,
} from "./services/api.js";

type AppView = "home" | "researching" | "report" | "error";

export default function App() {
  const [view, setView] = useState<AppView>("home");
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentDepth, setCurrentDepth] = useState<ResearchDepth>("standard");
  const [progress, setProgress] = useState<StepProgress>({
    step: "idle",
    message: "",
    percentage: 0,
  });
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [history, setHistory] = useState<ResearchReport[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  }, []);

  const handleStartResearch = async (
    query: string,
    depth: ResearchDepth = "standard"
  ) => {
    setCurrentQuery(query);
    setCurrentDepth(depth);
    setErrorMsg("");
    setView("researching");
    setProgress({
      step: "intent",
      message: "Understanding research intent...",
      percentage: 10,
    });

    try {
      const generatedReport = await runResearch(query, depth, (prog) => {
        setProgress(prog);
      });

      setReport(generatedReport);
      setHistory(getHistory());
      setView("report");
    } catch (err: any) {
      console.error("Research failed:", err);
      setErrorMsg(
        err?.message ||
          "We couldn't complete the research right now. Please try again."
      );
      setView("error");
    }
  };

  const handleSelectPastReport = (pastReport: ResearchReport) => {
    setReport(pastReport);
    setCurrentQuery(pastReport.query);
    setCurrentDepth(pastReport.depth);
    setView("report");
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteReportFromHistory(id);
    setHistory(updated);
    showToast("Report removed from history");
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    showToast("History cleared");
  };

  const handleNewResearch = () => {
    setReport(null);
    setErrorMsg("");
    setProgress({ step: "idle", message: "", percentage: 0 });
    setView("home");
  };

  const handleRetry = () => {
    if (currentQuery) {
      handleStartResearch(currentQuery, currentDepth);
    } else {
      setView("home");
    }
  };

  return (
    <div className="min-h-screen bg-[#090d14] text-zinc-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        onNewResearch={handleNewResearch}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        isReportView={view === "report"}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {view === "home" && (
          <LandingHero
            onStartResearch={handleStartResearch}
            isLoading={false}
          />
        )}

        {view === "researching" && (
          <ResearchProgress query={currentQuery} progress={progress} />
        )}

        {view === "report" && report && (
          <ReportView
            report={report}
            onNewResearch={handleNewResearch}
            onShowToast={showToast}
          />
        )}

        {view === "error" && (
          <ErrorView
            error={errorMsg}
            query={currentQuery}
            onRetry={handleRetry}
            onBack={handleNewResearch}
          />
        )}
      </main>

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectReport={handleSelectPastReport}
        onDeleteReport={handleDeleteHistoryItem}
        onClearHistory={handleClearHistory}
      />

      {/* Global Action Toast */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
