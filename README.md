# DeepBrief — Autonomous AI Research Agent

> "Research anything. Understand everything."

DeepBrief is a full-stack, autonomous AI research agent designed to perform deep, multi-source web investigations in the background and present comprehensive, structured research reports through an ultra-clean, minimalist interface.

---

## 🌟 Key Features

- **Autonomous Multi-Step Workflow**: Deconstructs user intent, formulates targeted search queries, searches live sources, deduplicates citations, extracts key metrics, identifies conflicting evidence, and synthesizes structured reports.
- **Real-Time Progress Streaming**: Uses Server-Sent Events (SSE) to display live checkpoints without freezing the browser.
- **Deep Source Attribution**: Categorizes and scores credibility (Official, Academic, News, Industry, Reference) with direct, uninvented links.
- **Nuance & Conflict Detection**: Explicitly highlights areas where credible sources disagree rather than fabricating artificial consensus.
- **Comparison Matrices**: Automatically generates comparison tables when evaluating multiple entities, technologies, or products.
- **Important Numbers & Metrics**: Surfaces verified quantitative statistics, dates, percentages, and benchmark data.
- **Export & Portability**: Copy structured markdown, download `.md` files, and print clean report PDFs.
- **Lightweight History**: Locally persists previous reports for instant retrieval and offline review.
- **Zero Heavy Frameworks**: Built without LangChain or LangGraph — completely modular TypeScript architecture.

---

## 🏗️ Architecture & Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                      DeepBrief Client                       │
│      (React 19 + TypeScript + Tailwind CSS + Lucide)        │
└──────────────┬──────────────────────────────▲───────────────┘
               │ POST /api/research/stream    │ SSE Progress
               ▼                              │ & Report JSON
┌─────────────────────────────────────────────────────────────┐
│                 Express Backend Service                     │
│                  (/server/research/agent.ts)                │
├─────────────────────────────────────────────────────────────┤
│  1. understandResearchIntent()   → Scope & Dimensions       │
│  2. generateSearchQueries()      → Multi-angle Queries      │
│  3. searchWeb()                  → Google Grounding / APIs  │
│  4. filterSources()              → Deduplicate & Score      │
│  5. extractAndCompare()          → Stats & Nuance Detection │
│  6. generateFinalReport()        → Structured Synthesis     │
└──────────────┬──────────────────────────────▲───────────────┘
               │                              │
               ▼                              │
┌──────────────────────────────┐┌──────────────────────────────┐
│       Google GenAI SDK       ││   Live Search Grounding      │
│      (gemini-3.7-flash)      ││   (Google Search / Tavily)   │
└──────────────────────────────┘└──────────────────────────────┘
```

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Lucide Icons, React Markdown, Remark GFM
- **Backend**: Node.js, Express, tsx, esbuild
- **AI & Grounding**: `@google/genai` TypeScript SDK (gemini-3.7-flash) with Google Search Grounding
- **Search Provider Layer**: Built-in Google Search Grounding with support for external Search APIs (`SEARCH_API_KEY`)

---

## 🔐 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Required: Gemini API Key from Google AI Studio
GEMINI_API_KEY="your-gemini-api-key"

# Optional: External Search Provider API Key (e.g. Tavily tvly-...)
# If omitted, DeepBrief uses native Google Search Grounding via Gemini
SEARCH_API_KEY=""

# Host port (default 3000)
PORT=3000
```

---

## 🚀 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/deepbrief.git
   cd deepbrief
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run build & lint checks**:
   ```bash
   npm run lint
   npm run build
   ```

---

## 🌐 Cloud Deployment

### 1. Render Deployment (Web Service)

1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service**.
3. Configure the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
4. Add environment variables in Render's dashboard:
   - `GEMINI_API_KEY`: Your Google GenAI API key.
   - `NODE_ENV`: `production`
5. Click **Deploy**.

### 2. Vercel Deployment

1. Import the repository into [Vercel](https://vercel.com).
2. Set Build & Development Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add `GEMINI_API_KEY` under Project Settings > Environment Variables.
4. Deploy!

---

## 📡 API Documentation

### `GET /api/health`
Health check endpoint.
```json
{
  "status": "ok",
  "timestamp": "2026-08-15T22:24:00.000Z"
}
```

### `POST /api/research`
Executes complete research topic synchronously.

**Request Body:**
```json
{
  "query": "Compare ChatGPT, Claude, Gemini and Perplexity for students in 2026",
  "depth": "standard"
}
```

**Response:**
```json
{
  "id": "rep_172376...",
  "query": "Compare ChatGPT, Claude, Gemini and Perplexity for students in 2026",
  "depth": "standard",
  "createdAt": "2026-08-15T22:24:00.000Z",
  "executiveSummary": "...",
  "keyFindings": [...],
  "detailedAnalysis": [...],
  "comparisonTable": {
    "headers": ["Model / Assistant", "Best Use Case", "Free Tier Limit", "Research / Web", "Cost"],
    "rows": [...]
  },
  "importantNumbers": [...],
  "conflicts": [...],
  "conclusion": "...",
  "sources": [
    {
      "id": "src-1",
      "title": "...",
      "url": "https://...",
      "domain": "...",
      "credibilityScore": "high"
    }
  ]
}
```

### `POST /api/research/stream`
Server-Sent Events (SSE) endpoint providing streaming progress updates and the final structured report payload.

---

## 🔮 Future Enhancements

- Multi-language research synthesis (generating reports in Spanish, Japanese, French, German).
- Custom domain whitelists / blacklists per project.
- Automated scheduled re-briefing (track evolving topics every month).
- Collaborative team workspaces.

---

## 📄 License
Apache-2.0
