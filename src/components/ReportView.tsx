import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Check,
  Download,
  Printer,
  Plus,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  BarChart3,
  BookOpen,
  Calendar,
  Layers,
  Scale,
  Sparkles,
  ArrowUpRight,
  Hash,
} from "lucide-react";
import { ResearchReport, SourceItem } from "../types/research.js";
import { formatReportAsMarkdown } from "../services/api.js";

interface ReportViewProps {
  report: ResearchReport;
  onNewResearch: () => void;
  onShowToast: (message: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  report,
  onNewResearch,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const markdown = formatReportAsMarkdown(report);
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      onShowToast("Report copied to clipboard as Markdown");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      onShowToast("Failed to copy to clipboard");
    }
  };

  const handleExportMarkdown = () => {
    const markdown = formatReportAsMarkdown(report);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = report.query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    a.download = `deepbrief-${safeTitle}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast("Downloaded Markdown file");
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(report.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Floating / Sticky Action Header */}
        <div className="no-print mb-8 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              {report.depth} Research
            </span>
            <span className="text-xs text-zinc-500">•</span>
            <span className="text-xs text-zinc-400 font-mono">
              {report.sources.length} sources analyzed
            </span>
            {report.meta?.durationMs && (
              <>
                <span className="text-xs text-zinc-500">•</span>
                <span className="text-xs text-zinc-400 font-mono">
                  {(report.meta.durationMs / 1000).toFixed(1)}s
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all shadow-sm active:scale-95"
              title="Copy formatted report"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all shadow-sm active:scale-95"
              title="Download Markdown (.md)"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all shadow-sm active:scale-95"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-400" />
              <span>Print</span>
            </button>

            <button
              onClick={onNewResearch}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 transition-all shadow-sm active:scale-95 ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Report Document Container */}
        <article className="space-y-12">
          {/* Document Header */}
          <header className="border-b border-zinc-800 pb-8">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">
              <span>DeepBrief</span>
              <span>/</span>
              <span>Research Report</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-zinc-100 leading-tight mb-4">
              {report.query}
            </h1>

            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>{formattedDate}</span>
              </span>
              <span>•</span>
              <span>Validated against live 2026 web sources</span>
            </div>
          </header>

          {/* Quick Table of Contents Jump Nav */}
          <nav className="no-print flex flex-wrap gap-2 pt-2">
            <a
              href="#executive-summary"
              className="text-xs px-2.5 py-1 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
            >
              Summary
            </a>
            <a
              href="#key-findings"
              className="text-xs px-2.5 py-1 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
            >
              Key Findings
            </a>
            <a
              href="#detailed-analysis"
              className="text-xs px-2.5 py-1 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
            >
              Detailed Analysis
            </a>
            {report.comparisonTable && (
              <a
                href="#comparison-matrix"
                className="text-xs px-2.5 py-1 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
              >
                Comparison
              </a>
            )}
            {report.importantNumbers && report.importantNumbers.length > 0 && (
              <a
                href="#key-metrics"
                className="text-xs px-2.5 py-1 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
              >
                Numbers & Stats
              </a>
            )}
            {report.conflicts && report.conflicts.length > 0 && (
              <a
                href="#conflicts-nuance"
                className="text-xs px-2.5 py-1 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
              >
                Nuances & Conflicts
              </a>
            )}
            <a
              href="#conclusion"
              className="text-xs px-2.5 py-1 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
            >
              Conclusion
            </a>
            <a
              href="#sources"
              className="text-xs px-2.5 py-1 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
            >
              Sources ({report.sources.length})
            </a>
          </nav>

          {/* 1. Executive Summary */}
          <section id="executive-summary" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Executive Summary
            </h2>
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 sm:p-6 text-zinc-200 leading-relaxed text-base font-normal space-y-4 shadow-sm">
              <div className="markdown-body prose prose-invert max-w-none text-zinc-200 text-base leading-relaxed">
                <Markdown remarkPlugins={[remarkGfm]}>
                  {report.executiveSummary}
                </Markdown>
              </div>
            </div>
          </section>

          {/* 2. Key Findings */}
          {report.keyFindings && report.keyFindings.length > 0 && (
            <section id="key-findings" className="scroll-mt-24 space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Key Findings
              </h2>
              <div className="grid grid-cols-1 gap-3.5">
                {report.keyFindings.map((kf, idx) => {
                  return (
                    <div
                      key={kf.id || idx}
                      className="bg-zinc-900/50 border border-zinc-800/90 hover:border-zinc-700/80 rounded-xl p-4 sm:p-5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-zinc-100 text-base leading-snug">
                          {idx + 1}. {kf.title}
                        </h3>
                        {kf.impact && (
                          <span
                            className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-medium shrink-0 ${
                              kf.impact === "critical"
                                ? "bg-rose-950/60 text-rose-300 border border-rose-800/60"
                                : kf.impact === "notable"
                                ? "bg-amber-950/60 text-amber-300 border border-amber-800/60"
                                : "bg-blue-950/60 text-blue-300 border border-blue-800/60"
                            }`}
                          >
                            {kf.impact}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {kf.description}
                      </p>

                      {/* Source Citations */}
                      {kf.sourceIds && kf.sourceIds.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-mono text-zinc-500">
                            Citations:
                          </span>
                          {kf.sourceIds.map((sid) => {
                            const foundSource = report.sources.find((s) => s.id === sid);
                            return (
                              <a
                                key={sid}
                                href={foundSource?.url || "#sources"}
                                target={foundSource?.url ? "_blank" : undefined}
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                              >
                                <span>{sid}</span>
                                {foundSource && <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. Detailed Analysis */}
          {report.detailedAnalysis && report.detailedAnalysis.length > 0 && (
            <section id="detailed-analysis" className="scroll-mt-24 space-y-6">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Detailed Analysis
              </h2>

              <div className="space-y-8">
                {report.detailedAnalysis.map((section, idx) => (
                  <div
                    key={idx}
                    className="border-b border-zinc-800/80 pb-8 last:border-b-0 space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-zinc-100">
                      {section.title}
                    </h3>

                    <div className="markdown-body text-zinc-300 text-sm sm:text-base leading-relaxed space-y-3">
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {section.content}
                      </Markdown>
                    </div>

                    {/* Key points if present */}
                    {section.keyPoints && section.keyPoints.length > 0 && (
                      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 mt-3">
                        <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                          Core Takeaways
                        </p>
                        <ul className="space-y-1.5">
                          {section.keyPoints.map((kp, kidx) => (
                            <li
                              key={kidx}
                              className="text-xs sm:text-sm text-zinc-300 flex items-start gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                              <span>{kp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Comparison Table (if applicable) */}
          {report.comparisonTable && report.comparisonTable.headers?.length > 0 && (
            <section id="comparison-matrix" className="scroll-mt-24 space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                Comparison Matrix
              </h2>

              <div className="w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
                <table className="w-full text-left text-sm text-zinc-300 border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80">
                      {report.comparisonTable.headers.map((header, hidx) => (
                        <th
                          key={hidx}
                          className={`py-3.5 px-4 font-semibold text-zinc-100 ${
                            hidx === 0 ? "w-1/4" : ""
                          }`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70">
                    {report.comparisonTable.rows.map((row, ridx) => (
                      <tr
                        key={ridx}
                        className="hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-zinc-200 bg-zinc-900/20">
                          {row.entity}
                        </td>
                        {row.values.map((val, vidx) => (
                          <td key={vidx} className="py-3 px-4 text-zinc-300 text-xs sm:text-sm">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {report.comparisonTable.summary && (
                <p className="text-xs text-zinc-400 italic bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                  <span className="font-semibold text-zinc-300 not-italic">
                    Synthesis:{" "}
                  </span>
                  {report.comparisonTable.summary}
                </p>
              )}
            </section>
          )}

          {/* 5. Important Numbers & Quantitative Metrics */}
          {report.importantNumbers && report.importantNumbers.length > 0 && (
            <section id="key-metrics" className="scroll-mt-24 space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Key Numbers & Statistics
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {report.importantNumbers.map((metric, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs text-zinc-400 font-medium">
                        {metric.label}
                      </span>
                      <div className="text-2xl font-semibold font-mono tracking-tight text-zinc-100 mt-1 mb-2 text-cyan-300">
                        {metric.value}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {metric.context}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 6. Conflicting Information & Disagreements */}
          {report.conflicts && report.conflicts.length > 0 && (
            <section id="conflicts-nuance" className="scroll-mt-24 space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                Disagreements & Conflicting Information
              </h2>

              <div className="space-y-3.5">
                {report.conflicts.map((conflict, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-900/40 border border-amber-900/30 rounded-xl p-5 space-y-3"
                  >
                    <h3 className="font-semibold text-zinc-200 text-sm sm:text-base">
                      {conflict.topic}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3">
                        <div className="text-[11px] font-mono text-zinc-400 mb-1">
                          Perspective A ({conflict.sourceA || "Source A"})
                        </div>
                        <p className="text-xs text-zinc-300">
                          {conflict.claimA}
                        </p>
                      </div>

                      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3">
                        <div className="text-[11px] font-mono text-zinc-400 mb-1">
                          Perspective B ({conflict.sourceB || "Source B"})
                        </div>
                        <p className="text-xs text-zinc-300">
                          {conflict.claimB}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      <span className="font-semibold text-zinc-300">Reason for discrepancy: </span>
                      {conflict.context}
                    </p>

                    {conflict.resolution && (
                      <div className="text-xs text-amber-300/90 bg-amber-950/20 border border-amber-800/40 rounded-md px-3 py-2">
                        <span className="font-semibold">Verdict / Consensus: </span>
                        {conflict.resolution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 7. Conclusion */}
          <section id="conclusion" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Conclusion
            </h2>
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 sm:p-6 text-zinc-200 leading-relaxed text-sm sm:text-base">
              <div className="markdown-body prose prose-invert max-w-none text-zinc-200 leading-relaxed">
                <Markdown remarkPlugins={[remarkGfm]}>
                  {report.conclusion}
                </Markdown>
              </div>
            </div>
          </section>

          {/* 8. Sources & References */}
          <section id="sources" className="scroll-mt-24 space-y-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-zinc-400" />
                Authoritative Sources ({report.sources.length})
              </h2>
            </div>

            <p className="text-xs text-zinc-400">
              Verified references and primary documents gathered and analyzed during this research.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {report.sources.map((source, idx) => (
                <a
                  key={source.id || idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-3.5 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-mono text-zinc-500 uppercase">
                        [{source.id || `src-${idx + 1}`}] {source.domain}
                      </span>
                      {source.credibilityScore && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            source.credibilityScore === "high"
                              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {source.credibilityScore} authority
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-white line-clamp-2 leading-snug">
                      {source.title}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-zinc-300">
                    <span className="truncate max-w-[200px] sm:max-w-[260px] font-mono">
                      {source.url.replace(/^https?:\/\//, "")}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Footer of the Report */}
          <footer className="pt-8 pb-12 border-t border-zinc-800 text-center space-y-2">
            <p className="text-xs text-zinc-500 font-mono">
              Report compiled by DeepBrief Autonomous Research Agent
            </p>
            <p className="text-xs text-zinc-600">
              Cross-checked with multi-angle search grounding and source verification.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
};
