import { getGeminiClient, GEMINI_MODEL } from "../gemini/client.js";

export interface RawSearchResult {
  title: string;
  url: string;
  snippet?: string;
  sourceQuery?: string;
  publishedDate?: string;
}

export interface FilteredSource {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet?: string;
  credibilityScore: 'high' | 'medium' | 'standard';
  category: 'official' | 'academic' | 'news' | 'industry' | 'reference';
  publishedDate?: string;
}

/**
 * Clean and normalize a URL (strip tracking params, hashes, trailing slashes)
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // Remove typical tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source', 'fbclid', 'gclid'];
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    
    // Normalize protocol and lowercase hostname
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();
    
    // Remove trailing slash if path is just /
    let clean = parsed.toString();
    if (clean.endsWith('/') && parsed.pathname === '/') {
      clean = clean.slice(0, -1);
    }
    return clean;
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Extract hostname without leading www.
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'web-source';
  }
}

/**
 * Assess credibility score and category based on domain authority, TLD, and source context
 */
export function assessSourceCredibility(url: string, title: string): {
  credibilityScore: 'high' | 'medium' | 'standard';
  category: 'official' | 'academic' | 'news' | 'industry' | 'reference';
} {
  const domain = extractDomain(url).toLowerCase();
  
  // High Authority TLDs & Academic
  if (domain.endsWith('.gov') || domain.endsWith('.mil') || domain.endsWith('.edu') || domain.endsWith('.ac.uk')) {
    return { credibilityScore: 'high', category: 'academic' };
  }

  // Academic / Research databases
  const academicDomains = [
    'arxiv.org', 'nature.com', 'sciencedirect.com', 'ieee.org', 'acm.org',
    'nih.gov', 'ncbi.nlm.nih.gov', 'pnas.org', 'frontiersin.org', 'springer.com',
    'biorxiv.org', 'medrxiv.org', 'ssrn.com', 'researchgate.net', 'scholar.google.com'
  ];
  if (academicDomains.some(d => domain.includes(d))) {
    return { credibilityScore: 'high', category: 'academic' };
  }

  // Official documentation & Primary tech providers
  const officialDomains = [
    'openai.com', 'anthropic.com', 'google.com', 'deepmind.google', 'microsoft.com',
    'apple.com', 'github.com', 'w3.org', 'mozilla.org', 'python.org', 'rust-lang.org',
    'ecma-international.org', 'iso.org', 'who.int', 'un.org', 'worldbank.org',
    'aws.amazon.com', 'meta.com', 'nvidia.com', 'kubernetes.io', 'cloudflare.com'
  ];
  if (officialDomains.some(d => domain.includes(d))) {
    return { credibilityScore: 'high', category: 'official' };
  }

  // Top tier news & industry publications
  const reputableMedia = [
    'reuters.com', 'bloomberg.com', 'ft.com', 'wsj.com', 'nytimes.com',
    'bbc.com', 'bbc.co.uk', 'economist.com', 'apnews.com', 'theguardian.com',
    'techcrunch.com', 'theverge.com', 'wired.com', 'arstechnica.com', 'technologyreview.com',
    'venturebeat.com', 'zdnet.com', 'spectrum.ieee.org', 'cnbc.com', 'forbes.com'
  ];
  if (reputableMedia.some(d => domain.includes(d))) {
    return { credibilityScore: 'high', category: 'news' };
  }

  // Reference sources
  if (domain.includes('wikipedia.org') || domain.includes('britannica.com') || domain.includes('statista.com') || domain.includes('ourworldindata.org')) {
    return { credibilityScore: 'medium', category: 'reference' };
  }

  // Industry / Developer sources
  const industryDev = ['medium.com', 'dev.to', 'stackoverflow.com', 'hackernews.com', 'ycombinator.com', 'substack.com', 'infoworld.com'];
  if (industryDev.some(d => domain.includes(d))) {
    return { credibilityScore: 'medium', category: 'industry' };
  }

  return { credibilityScore: 'standard', category: 'industry' };
}

/**
 * Filter and deduplicate raw search results
 */
export function filterSources(rawResults: RawSearchResult[]): FilteredSource[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const filtered: FilteredSource[] = [];

  // Exclude known spam, low-quality aggregators, or ad farms
  const lowQualityDomains = [
    'pinterest.com', 'quora.com', 'yahoo.answers', 'ehow.com', 'buzzfeed.com',
    'tiktok.com', 'instagram.com', 'facebook.com', 'twitter.com', 'x.com'
  ];

  for (const item of rawResults) {
    if (!item.url || !item.title) continue;

    const cleanUrl = normalizeUrl(item.url);
    const domain = extractDomain(cleanUrl);

    // Skip low quality or social feeds unless specific
    if (lowQualityDomains.some(bad => domain.includes(bad))) {
      continue;
    }

    // Skip duplicates
    const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    if (seenUrls.has(cleanUrl) || (normalizedTitle && seenTitles.has(normalizedTitle))) {
      continue;
    }

    seenUrls.add(cleanUrl);
    if (normalizedTitle) seenTitles.add(normalizedTitle);

    const { credibilityScore, category } = assessSourceCredibility(cleanUrl, item.title);

    filtered.push({
      id: `src-${filtered.length + 1}`,
      title: item.title.trim(),
      url: cleanUrl,
      domain,
      snippet: item.snippet?.trim() || undefined,
      credibilityScore,
      category,
      publishedDate: item.publishedDate,
    });
  }

  // Sort by credibility (high first, then medium, then standard)
  const scoreOrder: Record<string, number> = { high: 3, medium: 2, standard: 1 };
  filtered.sort((a, b) => (scoreOrder[b.credibilityScore] || 1) - (scoreOrder[a.credibilityScore] || 1));

  return filtered;
}

/**
 * Search provider abstraction:
 * 1. If SEARCH_API_KEY is provided and supports Tavily/Serper, call it.
 * 2. Uses Google Search Grounding with Gemini to execute live web search.
 */
export async function executeWebSearch(
  query: string,
  options: { maxResults?: number } = {}
): Promise<{ sources: RawSearchResult[]; searchSummary: string }> {
  const maxResults = options.maxResults || 8;
  const searchApiKey = process.env.SEARCH_API_KEY?.trim();

  // If Tavily / Serper search API key is provided
  if (searchApiKey && searchApiKey.startsWith('tvly-')) {
    try {
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: searchApiKey,
          query,
          search_depth: 'advanced',
          max_results: maxResults,
          include_answer: true,
        }),
      });
      if (tavilyRes.ok) {
        const data = await tavilyRes.json();
        const sources: RawSearchResult[] = (data.results || []).map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
          sourceQuery: query,
          publishedDate: r.published_date,
        }));
        return {
          sources,
          searchSummary: data.answer || '',
        };
      }
    } catch (err) {
      console.warn('External search provider failed, falling back to Google Search Grounding:', err);
    }
  }

  // Standard & Native: Google Search Grounding with Gemini
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Perform a factual, objective web search to find current information, key data points, and authoritative sources on the following topic:\n"${query}"\n\nProvide a synthesized summary highlighting verified facts, important statistics, comparisons, and source details.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const candidate = response.candidates?.[0];
    const summaryText = response.text || '';
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];

    const sources: RawSearchResult[] = [];

    for (const chunk of groundingChunks) {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({
          title: chunk.web.title,
          url: chunk.web.uri,
          snippet: summaryText.slice(0, 300),
          sourceQuery: query,
        });
      }
    }

    return {
      sources,
      searchSummary: summaryText,
    };
  } catch (error) {
    console.error(`Search failed for query "${query}":`, error);
    return {
      sources: [],
      searchSummary: '',
    };
  }
}
