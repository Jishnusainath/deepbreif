import { ResearchDepth, ResearchReport, StepProgress } from "../types/research.js";

const HISTORY_STORAGE_KEY = "deepbrief_research_history_v1";

/**
 * Start research with live streaming progress updates
 */
export async function runResearch(
  query: string,
  depth: ResearchDepth,
  onProgress: (progress: StepProgress) => void
): Promise<ResearchReport> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    throw new Error("Please enter a research topic.");
  }

  // Try SSE Stream first for real-time progress
  try {
    const response = await fetch("/api/research/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: cleanQuery, depth }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    if (!response.body) {
      throw new Error("ReadableStream not supported by response");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let finalReport: ResearchReport | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data:")) {
          const jsonStr = trimmed.replace(/^data:\s*/, "");
          try {
            const data: StepProgress = JSON.parse(jsonStr);
            onProgress(data);

            if (data.step === "complete" && data.report) {
              finalReport = data.report;
            } else if (data.step === "error") {
              throw new Error(data.error || "Research encountered an error.");
            }
          } catch (parseErr) {
            console.warn("Failed to parse SSE line:", jsonStr, parseErr);
          }
        }
      }
    }

    if (finalReport) {
      saveReportToHistory(finalReport);
      return finalReport;
    }
  } catch (streamError) {
    console.warn("Streaming failed or was interrupted, falling back to direct POST:", streamError);
  }

  // Fallback to standard POST endpoint
  onProgress({
    step: "synthesizing",
    message: "Connecting to research agent...",
    percentage: 50,
  });

  const response = await fetch("/api/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: cleanQuery, depth }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "We couldn't complete the research right now. Please try again.");
  }

  const report: ResearchReport = await response.json();
  saveReportToHistory(report);
  return report;
}

/**
 * Local History Management
 */
export function getHistory(): ResearchReport[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReportToHistory(report: ResearchReport): void {
  try {
    const history = getHistory();
    // Prepend new report and remove duplicate if existing
    const filtered = history.filter((r) => r.id !== report.id && r.query !== report.query);
    const updated = [report, ...filtered].slice(0, 30); // keep up to 30 past reports
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to save report to local history:", err);
  }
}

export function deleteReportFromHistory(id: string): ResearchReport[] {
  try {
    const history = getHistory();
    const updated = history.filter((r) => r.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear local history:", err);
  }
}

/**
 * Generate Clean Markdown from a Research Report
 */
export function formatReportAsMarkdown(report: ResearchReport): string {
  const parts: string[] = [];

  parts.push(`# ${report.query}`);
  parts.push(`*Researched by DeepBrief on ${new Date(report.createdAt).toLocaleDateString()} | Depth: ${report.depth.toUpperCase()}*\n`);

  // Executive Summary
  parts.push(`## Executive Summary\n\n${report.executiveSummary}\n`);

  // Key Findings
  if (report.keyFindings && report.keyFindings.length > 0) {
    parts.push(`## Key Findings\n`);
    report.keyFindings.forEach((kf, idx) => {
      const citations = kf.sourceIds?.length ? ` *[${kf.sourceIds.join(", ")}]*` : "";
      parts.push(`### ${idx + 1}. ${kf.title}`);
      parts.push(`${kf.description}${citations}\n`);
    });
  }

  // Detailed Analysis
  if (report.detailedAnalysis && report.detailedAnalysis.length > 0) {
    parts.push(`## Detailed Analysis\n`);
    report.detailedAnalysis.forEach((section) => {
      parts.push(`### ${section.title}\n`);
      parts.push(`${section.content}\n`);
      if (section.keyPoints && section.keyPoints.length > 0) {
        parts.push(`**Key Takeaways:**`);
        section.keyPoints.forEach((kp) => parts.push(`- ${kp}`));
        parts.push("");
      }
    });
  }

  // Comparison Table
  if (report.comparisonTable && report.comparisonTable.headers?.length) {
    parts.push(`## Comparison Matrix\n`);
    const headers = report.comparisonTable.headers;
    parts.push(`| ${headers.join(" | ")} |`);
    parts.push(`| ${headers.map(() => "---").join(" | ")} |`);
    report.comparisonTable.rows.forEach((row) => {
      parts.push(`| **${row.entity}** | ${row.values.join(" | ")} |`);
    });
    if (report.comparisonTable.summary) {
      parts.push(`\n*Takeaway:* ${report.comparisonTable.summary}\n`);
    }
    parts.push("");
  }

  // Important Numbers
  if (report.importantNumbers && report.importantNumbers.length > 0) {
    parts.push(`## Key Statistics & Quantitative Metrics\n`);
    report.importantNumbers.forEach((num) => {
      parts.push(`- **${num.label}**: \`${num.value}\` — ${num.context}`);
    });
    parts.push("");
  }

  // Conflicting Information / Disagreements
  if (report.conflicts && report.conflicts.length > 0) {
    parts.push(`## Nuances & Conflicting Information\n`);
    report.conflicts.forEach((conflict) => {
      parts.push(`### ${conflict.topic}`);
      parts.push(`- **Perspective A (${conflict.sourceA}):** ${conflict.claimA}`);
      parts.push(`- **Perspective B (${conflict.sourceB}):** ${conflict.claimB}`);
      parts.push(`- **Context:** ${conflict.context}`);
      if (conflict.resolution) {
        parts.push(`- **Verdict / Outlook:** ${conflict.resolution}`);
      }
      parts.push("");
    });
  }

  // Conclusion
  parts.push(`## Conclusion\n\n${report.conclusion}\n`);

  // Sources
  if (report.sources && report.sources.length > 0) {
    parts.push(`## Authoritative Sources\n`);
    report.sources.forEach((s, idx) => {
      parts.push(`${idx + 1}. [${s.title}](${s.url}) — *${s.domain}* (${s.credibilityScore || "verified"} credibility)`);
    });
    parts.push("");
  }

  parts.push(`---\n*Generated by DeepBrief Research Agent*`);

  return parts.join("\n");
}
