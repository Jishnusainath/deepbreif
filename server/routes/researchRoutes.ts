import { Router, Request, Response } from "express";
import { researchTopic } from "../research/agent.js";
import { ResearchDepth, StepProgress } from "../../src/types/research.js";

const router = Router();

// GET /api/health
router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// POST /api/research (Synchronous complete response)
router.post("/research", async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, depth = "standard" } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      res.status(400).json({ error: "A valid research query string is required." });
      return;
    }

    const validDepths: ResearchDepth[] = ["quick", "standard", "deep"];
    const selectedDepth: ResearchDepth = validDepths.includes(depth) ? depth : "standard";

    const report = await researchTopic(query, selectedDepth);
    res.json(report);
  } catch (error: any) {
    console.error("Research API Error:", error);
    res.status(500).json({
      error: "We couldn't complete the research right now. Please try again.",
      message: error?.message || "Internal research error",
    });
  }
});

// GET or POST /api/research/stream (Server-Sent Events for live progress)
router.all("/research/stream", async (req: Request, res: Response): Promise<void> => {
  const query = req.method === "POST" ? req.body?.query : req.query?.query;
  const depth = req.method === "POST" ? req.body?.depth : req.query?.depth;

  if (!query || typeof query !== "string" || !query.trim()) {
    res.status(400).json({ error: "A valid research query string is required." });
    return;
  }

  const validDepths: ResearchDepth[] = ["quick", "standard", "deep"];
  const selectedDepth: ResearchDepth = validDepths.includes(depth as ResearchDepth)
    ? (depth as ResearchDepth)
    : "standard";

  // Set SSE Headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const sendEvent = (data: StepProgress) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await researchTopic(query, selectedDepth, (progress) => {
      sendEvent(progress);
    });
    res.end();
  } catch (error: any) {
    console.error("SSE Research Error:", error);
    sendEvent({
      step: "error",
      message: "Research failed",
      error: "We couldn't complete the research right now. Please check your query or connection and try again.",
    });
    res.end();
  }
});

export default router;
