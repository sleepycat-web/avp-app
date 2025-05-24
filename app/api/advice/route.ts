import { NextRequest, NextResponse } from "next/server";

// Gemini API types
interface GeminiContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

// Helper to call Gemini API with retry logic
async function callGeminiAPI(
  endpoint: string,
  payload: Record<string, any>,
  retries = 2
): Promise<GeminiContentResponse> {
  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) {
    return Promise.reject(new Error("Gemini API key not configured"));
  }
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${endpoint}?key=${KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as GeminiContentResponse;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error("Failed to call Gemini API");
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    // Build prompt for generating search suggestions
    const prompt = `Generate a list of alternative search queries or keywords for: "${query}". This is for a sikkim government document search portal. Return each suggestion on a new line. Limit responses to 5-15 suggestions.`;
    // Use the same gemini-2.0-flash-exp generateContent endpoint as other handlers
    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
    const payload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };
    const apiRes = await callGeminiAPI(endpoint, payload);
    const text =
      apiRes.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    // Split lines into suggestions array
    let suggestions = text
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    // Dedupe and limit to at most 10 suggestions
    suggestions = Array.from(new Set(suggestions)).slice(0, 10);
    // Build response message
    const messageText =
      "Here are the suggested queries:\n" +
      suggestions.map((s) => `* ${s}`).join("\n");
    return NextResponse.json({ suggestions, message: messageText });
  } catch (error: any) {
    console.error("Advice API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
