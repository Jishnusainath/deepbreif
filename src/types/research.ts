export type ResearchDepth = 'quick' | 'standard' | 'deep';

export interface SourceItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  credibilityScore?: 'high' | 'medium' | 'standard';
  category?: 'official' | 'academic' | 'news' | 'industry' | 'reference';
  publishedDate?: string;
}

export interface KeyFinding {
  id: string;
  title: string;
  description: string;
  impact?: 'critical' | 'notable' | 'insight';
  sourceIds?: string[];
}

export interface AnalysisSection {
  title: string;
  content: string;
  keyPoints?: string[];
  sourceIds?: string[];
}

export interface ComparisonRow {
  entity: string;
  values: string[];
}

export interface ComparisonTable {
  headers: string[];
  rows: ComparisonRow[];
  summary?: string;
}

export interface ImportantMetric {
  label: string;
  value: string;
  context: string;
  sourceId?: string;
  trend?: 'up' | 'down' | 'neutral' | 'info';
}

export interface ConflictItem {
  topic: string;
  claimA: string;
  sourceA: string;
  claimB: string;
  sourceB: string;
  context: string;
  resolution?: string;
}

export interface ResearchReport {
  id: string;
  query: string;
  depth: ResearchDepth;
  createdAt: string;
  executiveSummary: string;
  keyFindings: KeyFinding[];
  detailedAnalysis: AnalysisSection[];
  comparisonTable?: ComparisonTable | null;
  importantNumbers: ImportantMetric[];
  conflicts: ConflictItem[];
  conclusion: string;
  sources: SourceItem[];
  searchQueries?: string[];
  meta?: {
    queryCount: number;
    sourceCount: number;
    durationMs: number;
  };
}

export type ResearchStep = 
  | 'idle'
  | 'intent'
  | 'queries'
  | 'search'
  | 'filtering'
  | 'extracting'
  | 'comparing'
  | 'synthesizing'
  | 'complete'
  | 'error';

export interface StepProgress {
  step: ResearchStep;
  message: string;
  detail?: string;
  queries?: string[];
  sourcesFound?: number;
  percentage?: number;
  report?: ResearchReport;
  error?: string;
}
