import { getGeminiClient, GEMINI_MODEL } from "../gemini/client.js";
import { executeWebSearch, filterSources, FilteredSource, RawSearchResult } from "../search/searchAdapter.js";
import { ResearchDepth, ResearchReport, StepProgress } from "../../src/types/research.js";
import { Type } from "@google/genai";

export interface ResearchIntent {
  topic: string;
  category: 'comparison' | 'investigation' | 'market_analysis' | 'technical_deep_dive' | 'general_exploratory';
  primaryQuestions: string[];
  entitiesToCompare?: string[];
  keyDimensions?: string[];
  timeframe?: string;
  isComparison: boolean;
}

export type ProgressCallback = (progress: StepProgress) => void;

/**
 * Safely parse JSON even with markdown code fences or trailing characters
 */
function safeJsonParse(rawText: string | undefined, defaultValue: any = {}): any {
  if (!rawText || !rawText.trim()) return defaultValue;
  let text = rawText.trim();

  // Strip markdown code fences if present
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    // Try regex match for first JSON object or array
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch {}
    }
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        return JSON.parse(arrMatch[0]);
      } catch {}
    }
    return defaultValue;
  }
}

/**
 * 1. Understand Research Intent
 */
export async function understandResearchIntent(
  query: string,
  depth: ResearchDepth
): Promise<ResearchIntent> {
  const ai = getGeminiClient();

  const prompt = `You are the intent analyzer of DeepBrief, an elite AI research agent.
Analyze the user's research topic to extract the core intent, key questions to answer, whether it involves comparisons, and the critical dimensions to evaluate.

Current Year Context: 2026.
Research Depth: ${depth}
User Topic: "${query}"

Respond strictly with valid JSON conforming to this structure:
{
  "topic": "Clean normalized title of the research topic",
  "category": "comparison" | "investigation" | "market_analysis" | "technical_deep_dive" | "general_exploratory",
  "isComparison": true | false,
  "entitiesToCompare": ["Entity 1", "Entity 2"] (optional, if comparison),
  "primaryQuestions": ["Specific research question 1", "Specific research question 2", "Specific research question 3"],
  "keyDimensions": ["Dimension 1 (e.g. pricing, latency, accuracy, capability)", "Dimension 2"],
  "timeframe": "e.g. 2025-2026 or Current"
}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const parsed = safeJsonParse(response.text, {});
    return {
      topic: parsed.topic || query,
      category: parsed.category || (query.toLowerCase().includes("vs") || query.toLowerCase().includes("compare") ? "comparison" : "investigation"),
      isComparison: Boolean(parsed.isComparison || query.toLowerCase().includes("vs") || query.toLowerCase().includes("compare")),
      entitiesToCompare: Array.isArray(parsed.entitiesToCompare) ? parsed.entitiesToCompare : undefined,
      primaryQuestions: Array.isArray(parsed.primaryQuestions) && parsed.primaryQuestions.length > 0 ? parsed.primaryQuestions : [query],
      keyDimensions: Array.isArray(parsed.keyDimensions) ? parsed.keyDimensions : undefined,
      timeframe: parsed.timeframe || "2026",
    };
  } catch (error) {
    console.warn("Intent analysis fallback:", error);
    const isComparison = query.toLowerCase().includes("vs") || query.toLowerCase().includes("compare");
    return {
      topic: query,
      category: isComparison ? "comparison" : "investigation",
      isComparison,
      primaryQuestions: [query],
      timeframe: "2026",
    };
  }
}

/**
 * 2. Generate Search Queries
 */
export async function generateSearchQueries(
  query: string,
  intent: ResearchIntent,
  depth: ResearchDepth
): Promise<string[]> {
  const ai = getGeminiClient();
  const queryCount = depth === 'quick' ? 3 : depth === 'deep' ? 7 : 5;

  const prompt = `You are a search query strategist for DeepBrief.
Generate ${queryCount} distinct, high-precision search queries to thoroughly research this topic.
Include search queries that target:
1. Core overview, capabilities, official specifications (2026 context)
2. Quantitative benchmarks, pricing, and independent evaluations
3. Known limitations, real-world trade-offs, and critical reception
${intent.isComparison ? '4. Direct head-to-head comparisons and feature matrix data' : '4. Recent developments and expert consensus'}

Topic: "${query}"
Intent Questions: ${JSON.stringify(intent.primaryQuestions)}
Dimensions: ${JSON.stringify(intent.keyDimensions || [])}

Respond strictly with a JSON array of search strings. Example:
["query 1", "query 2", "query 3"]`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = safeJsonParse(response.text, []);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, queryCount);
    }
  } catch (error) {
    console.warn("Query generation fallback:", error);
  }

  // Fallback queries
  const fallback = [
    query,
    `${query} 2026 benchmark analysis`,
    `${query} comparison review`,
  ];
  return fallback.slice(0, queryCount);
}

/**
 * 3. Search Web for all generated queries
 */
export async function searchWeb(
  queries: string[]
): Promise<{ rawResults: RawSearchResult[]; searchSummaries: string[] }> {
  const allResults: RawSearchResult[] = [];
  const searchSummaries: string[] = [];

  // Execute searches (with small concurrency batching to respect rate limits)
  for (const q of queries) {
    try {
      const { sources, searchSummary } = await executeWebSearch(q, { maxResults: 6 });
      allResults.push(...sources);
      if (searchSummary) {
        searchSummaries.push(`### Query: ${q}\n${searchSummary}`);
      }
    } catch (err) {
      console.warn(`Error during search for "${q}":`, err);
    }
  }

  return { rawResults: allResults, searchSummaries };
}

/**
 * 4. Extract and Compare Findings across Sources
 */
export async function extractAndCompareInformation(
  query: string,
  intent: ResearchIntent,
  sources: FilteredSource[],
  searchSummaries: string[]
): Promise<{
  keyFindings: any[];
  importantNumbers: any[];
  conflicts: any[];
  comparisonTable: any | null;
}> {
  const ai = getGeminiClient();

  const sourceContext = sources.map(s => `[${s.id}] ${s.title} (${s.domain})\nURL: ${s.url}\nExcerpt: ${s.snippet || 'N/A'}`).join("\n\n");
  const summaryContext = searchSummaries.join("\n\n---\n\n");

  const prompt = `You are the Lead Analyst at DeepBrief.
Analyze the following gathered research data for topic: "${query}".

Intent: ${JSON.stringify(intent)}

Collected Authoritative Sources:
${sourceContext}

Web Search Evidence & Syntheses:
${summaryContext.slice(0, 14000)}

Task: Extract structured insights with rigorous source attribution.
1. Key Findings: 4 to 6 major findings. For each, give a clear headline, detailed description, impact level ("critical" | "notable" | "insight"), and cited sourceIds (e.g. ["src-1", "src-2"]).
2. Important Numbers: 3 to 6 key quantitative statistics, dates, prices, performance percentages, or metrics with context and sourceId.
3. Conflicting Information / Disagreements: Any areas where credible sources disagree or where there is nuance/uncertainty. If no explicit conflict, highlight key trade-offs or caveats.
4. Comparison Table (ONLY IF topic compares entities or multiple alternatives; otherwise null):
   - headers: ["Criteria / Feature", "Entity A", "Entity B", ...]
   - rows: [{ "entity": "Metric/Feature Name", "values": ["Val A", "Val B"] }]
   - summary: Short takeaways from the comparison.

Respond strictly with valid JSON conforming to this structure:
{
  "keyFindings": [
    {
      "id": "kf-1",
      "title": "Finding Title",
      "description": "Thorough factual finding explanation with nuances...",
      "impact": "critical",
      "sourceIds": ["src-1"]
    }
  ],
  "importantNumbers": [
    {
      "label": "Metric Name",
      "value": "94.8% or $20/mo",
      "context": "Context explaining what this number means in 2026...",
      "trend": "up" | "down" | "neutral" | "info",
      "sourceId": "src-1"
    }
  ],
  "conflicts": [
    {
      "topic": "Disputed or Nuanced Area",
      "claimA": "Perspective / Claim 1",
      "sourceA": "Source / Benchmark A",
      "claimB": "Counter Perspective / Claim 2",
      "sourceB": "Source / Benchmark B",
      "context": "Why the difference exists (e.g. testing methodology, enterprise vs consumer tiers)...",
      "resolution": "Current consensus or practical takeaway"
    }
  ],
  "comparisonTable": {
    "headers": ["Feature", "Option 1", "Option 2"],
    "rows": [
      { "entity": "Context Window", "values": ["128k tokens", "1M tokens"] }
    ],
    "summary": "Key distinction"
  } // or null if comparison is not applicable
}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const parsed = safeJsonParse(response.text, {});
    return {
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      importantNumbers: Array.isArray(parsed.importantNumbers) ? parsed.importantNumbers : [],
      conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
      comparisonTable: parsed.comparisonTable && parsed.comparisonTable.headers ? parsed.comparisonTable : null,
    };
  } catch (error) {
    console.error("Extraction & Comparison error:", error);
    return {
      keyFindings: [],
      importantNumbers: [],
      conflicts: [],
      comparisonTable: null,
    };
  }
}

/**
 * 5. Generate Final Detailed Research Report
 */
export async function generateFinalReport(
  query: string,
  depth: ResearchDepth,
  intent: ResearchIntent,
  sources: FilteredSource[],
  extracted: {
    keyFindings: any[];
    importantNumbers: any[];
    conflicts: any[];
    comparisonTable: any | null;
  },
  searchSummaries: string[],
  searchQueries: string[],
  startTime: number
): Promise<ResearchReport> {
  const ai = getGeminiClient();

  const sourceList = sources.map(s => `[${s.id}] ${s.title} - ${s.domain} (${s.url})`).join("\n");

  const prompt = `You are DeepBrief's Chief Research Officer.
Generate the authoritative final research report for: "${query}".

Topic Intent: ${JSON.stringify(intent)}
Structured Findings: ${JSON.stringify(extracted.keyFindings)}
Extracted Numbers: ${JSON.stringify(extracted.importantNumbers)}
Comparison Matrix: ${JSON.stringify(extracted.comparisonTable)}
Conflicts / Nuances: ${JSON.stringify(extracted.conflicts)}
Authoritative Sources:
${sourceList}

Synthesize the final report sections:
1. "executiveSummary": A crisp, high-level, authoritative explanation of the answer (2-3 paragraphs), directly addressing the query with nuance and verified facts.
2. "detailedAnalysis": An array of 3 to 5 in-depth thematic sections. Each section must have:
   - "title": Section heading (e.g. "Architecture & Core Capabilities", "Pricing & Accessibility", "Performance Benchmarks")
   - "content": Comprehensive, well-written analytical paragraphs (supports markdown formatting, bolding, bullet lists).
   - "keyPoints": 2-3 bullet takeaway points.
   - "sourceIds": Cited source IDs (e.g. ["src-1", "src-2"]).
3. "conclusion": Clear, actionable, objective conclusion summarizing the strategic outlook, practical recommendations, and final verdict based strictly on collected evidence.

Format strictly as JSON:
{
  "executiveSummary": "...",
  "detailedAnalysis": [
    {
      "title": "Section Title",
      "content": "Deep analysis...",
      "keyPoints": ["Takeaway 1", "Takeaway 2"],
      "sourceIds": ["src-1"]
    }
  ],
  "conclusion": "..."
}`;

  let executiveSummary = "";
  let detailedAnalysis: any[] = [];
  let conclusion = "";

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = safeJsonParse(response.text, {});
    executiveSummary = parsed.executiveSummary || "";
    detailedAnalysis = Array.isArray(parsed.detailedAnalysis) && parsed.detailedAnalysis.length > 0 ? parsed.detailedAnalysis : [];
    conclusion = parsed.conclusion || "";
  } catch (error) {
    console.error("Report synthesis error:", error);
    executiveSummary = `Comprehensive research on ${query} based on ${sources.length} sources.`;
    detailedAnalysis = [
      {
        title: "Overview and Findings",
        content: searchSummaries.join("\n\n").slice(0, 2000),
        keyPoints: ["Detailed analysis gathered across primary sources."],
        sourceIds: sources.slice(0, 3).map(s => s.id),
      },
    ];
    conclusion = `Based on current 2026 data, ${query} presents distinct strengths and trade-offs documented in the research sources above.`;
  }

  // Ensure source formatting matches frontend types
  const finalSources = sources.map(s => ({
    id: s.id,
    title: s.title,
    url: s.url,
    domain: s.domain,
    snippet: s.snippet,
    credibilityScore: s.credibilityScore,
    category: s.category,
    publishedDate: s.publishedDate,
  }));

  const reportId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: reportId,
    query: intent.topic || query,
    depth,
    createdAt: new Date().toISOString(),
    executiveSummary,
    keyFindings: extracted.keyFindings,
    detailedAnalysis,
    comparisonTable: extracted.comparisonTable,
    importantNumbers: extracted.importantNumbers,
    conflicts: extracted.conflicts,
    conclusion,
    sources: finalSources,
    searchQueries,
    meta: {
      queryCount: searchQueries.length,
      sourceCount: finalSources.length,
      durationMs: Date.now() - startTime,
    },
  };
}

/**
 * Main Orchestration Function: researchTopic
 * Multi-step agent workflow with step-by-step progress notifications
 */
export async function researchTopic(
  query: string,
  depth: ResearchDepth = 'standard',
  onProgress?: ProgressCallback
): Promise<ResearchReport> {
  const startTime = Date.now();
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    throw new Error("Research query cannot be empty.");
  }

  // Step 1: Understand Research Intent
  onProgress?.({
    step: 'intent',
    message: 'Understanding research intent...',
    detail: `Analyzing query scope and key dimensions for ${depth} depth`,
    percentage: 10,
  });

  const intent = await understandResearchIntent(cleanQuery, depth);

  // Step 2: Generate Search Queries
  onProgress?.({
    step: 'queries',
    message: 'Generating targeted search queries...',
    detail: `Formulating multi-angle search queries across 2026 benchmarks and sources`,
    percentage: 25,
  });

  const queries = await generateSearchQueries(cleanQuery, intent, depth);

  onProgress?.({
    step: 'queries',
    message: 'Targeted search queries generated',
    queries,
    percentage: 35,
  });

  // Step 3: Search Web
  onProgress?.({
    step: 'search',
    message: 'Searching web & gathering sources...',
    detail: `Querying authoritative sources across ${queries.length} search angles`,
    queries,
    percentage: 45,
  });

  const { rawResults, searchSummaries } = await searchWeb(queries);

  // Step 4: Filter Sources
  onProgress?.({
    step: 'filtering',
    message: 'Filtering & scoring source credibility...',
    detail: `Removing duplicates and prioritizing academic, official & industry sources`,
    percentage: 60,
  });

  let filteredSources = filterSources(rawResults);

  // If no sources were found via web search (e.g. offline search), execute a fallback grounded query
  if (filteredSources.length === 0) {
    const { sources: fallbackSources } = await executeWebSearch(cleanQuery, { maxResults: 6 });
    filteredSources = filterSources(fallbackSources);
  }

  onProgress?.({
    step: 'filtering',
    message: `Verified ${filteredSources.length} distinct authoritative sources`,
    sourcesFound: filteredSources.length,
    percentage: 70,
  });

  // Step 5: Extract Findings & Key Numbers
  onProgress?.({
    step: 'extracting',
    message: 'Extracting key findings & quantitative metrics...',
    detail: 'Analyzing verified data points, dates, percentages, and claims',
    percentage: 80,
  });

  // Step 6: Compare Sources & Conflicting Info
  onProgress?.({
    step: 'comparing',
    message: 'Comparing claims & identifying disagreements...',
    detail: 'Cross-checking evidence across independent perspectives',
    percentage: 88,
  });

  const extracted = await extractAndCompareInformation(cleanQuery, intent, filteredSources, searchSummaries);

  // Step 7: Synthesize Final Report
  onProgress?.({
    step: 'synthesizing',
    message: 'Synthesizing executive summary & structured report...',
    detail: 'Compiling structured report, executive takeaways, and source index',
    percentage: 95,
  });

  const finalReport = await generateFinalReport(
    cleanQuery,
    depth,
    intent,
    filteredSources,
    extracted,
    searchSummaries,
    queries,
    startTime
  );

  onProgress?.({
    step: 'complete',
    message: 'Research complete',
    report: finalReport,
    percentage: 100,
  });

  return finalReport;
}
