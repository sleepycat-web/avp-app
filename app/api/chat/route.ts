import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";

// Gemini API call (real implementation)
async function queryGeminiAPI(query: string, docs: any[]) {
  const GEMINI_API_URL =
    process.env.GEMINI_API_URL ||
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not set in environment variables.");
  }

  // Prepare the payload as required by Gemini API
  const payload = {
    contents: [
      { role: "user", parts: [{ text: query }] },
      { role: "system", parts: [{ text: JSON.stringify(docs) }] },
    ],
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }
    const data = await response.json();
    // Adjust this based on the actual Gemini API response structure
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini API."
    );
  } catch (error: any) {
    return `Error calling Gemini API: ${error.message}`;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  console.log("📩 POST /api/chat received");
  const { query } = await req.json();
  console.log("🔎 Query:", query);
  if (!query) {
    console.log("⚠️ No query provided");
    return NextResponse.json(
      { response: "No query provided." },
      { status: 400 }
    );
  }

  const allowedCollections = [
    "EmploymentNotice",
    "NotificationCircular",
    "Tender",
  ];

  // Connect to MongoDB and ensure client is closed in a finally block
  const { db } = await connectToDatabase();
  try {
    console.log("🗄️ Connected to DB, starting initial search");
    // Initial search: match query in categories, keywords, or department
    let initialResults: any[] = [];
    const regex = new RegExp(query, "i");
    console.log("🔍 Initial regex:", regex);
    for (const name of allowedCollections) {
      const docs = await db
        .collection(name)
        .find({
          $or: [
            { categories: regex },
            { keywords: regex },
            { department: regex },
          ],
        })
        .toArray();
      initialResults = initialResults.concat(docs);
    }
    console.log("✅ Initial results count:", initialResults.length);
    if (initialResults.length > 0) {
      console.log("🎉 Returning initial results");
      return NextResponse.json({ results: initialResults });
    }

    console.log("ℹ️ No initial results, fetching all docs for refinement");
    // Fallback: fetch all docs to refine keywords via Gemini
    let allDocs: any[] = [];
    for (const name of allowedCollections) {
      const docs = await db.collection(name).find({}).toArray();
      allDocs = allDocs.concat(docs);
    }
    console.log("🤖 Calling Gemini with", allDocs.length, "docs");
    const refinements = await queryGeminiAPI(query, allDocs);
    console.log("🤖 Gemini refinements:", refinements);

    const refinedKeywords = refinements
      .split(/,| and /)
      .map((k: string) => k.trim())
      .filter(Boolean);
    console.log("🔑 Refined keywords:", refinedKeywords);

    // Search again using refined keywords
    let fallbackResults: any[] = [];
    for (const name of allowedCollections) {
      const docs = await db
        .collection(name)
        .find({ keywords: { $in: refinedKeywords } })
        .toArray();
      fallbackResults = fallbackResults.concat(docs);
    }
    console.log("✅ Fallback results count:", fallbackResults.length);

    if (fallbackResults.length === 0) {
      console.log("❌ No results found after fallback");
      return NextResponse.json(
        { response: "Sorry, no answer found." },
        { status: 404 }
      );
    }

    console.log("🎉 Returning fallback results");
    return NextResponse.json({ results: fallbackResults, refinedKeywords });
  } catch (e) {
    console.error("🚨 Error querying database:", e);
    return NextResponse.json(
      { response: "Error querying database." },
      { status: 500 }
    );
  } finally {
    console.log("🔒 Skipping client.close(), reusing existing MongoClient");
  }
}
