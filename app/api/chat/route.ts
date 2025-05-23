import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { cosineSimilarity } from "@/lib/utils"; // Import cosine similarity helper

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

// Function to perform semantic search
async function performSemanticSearch(
  query: string,
  db: any,
  allowedCollections: string[]
) {
  console.log("🤖 Performing semantic search");

  // Step 1: Convert query to embedding using Gemini API
  const GEMINI_API_URL =
    process.env.GEMINI_API_URL ||
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:embed";
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not set in environment variables.");
  }

  const embeddingResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!embeddingResponse.ok) {
    throw new Error(`Gemini API error: ${embeddingResponse.statusText}`);
  }

  const embeddingData = await embeddingResponse.json();
  const queryEmbedding = embeddingData.embedding; // Adjust based on Gemini API response

  // Step 2: Fetch all documents with embeddings from the database
  let allDocs: any[] = [];
  for (const name of allowedCollections) {
    const docs = await db
      .collection(name)
      .find({ embedding: { $exists: true } })
      .toArray();
    allDocs = allDocs.concat(docs);
  }

  // Step 3: Calculate cosine similarity for each document
  const resultsWithSimilarity = allDocs.map((doc) => {
    const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
    return { ...doc, similarity };
  });

  // Step 4: Sort by similarity and return top 5 results
  // Ensure the createdAt field is properly formatted and valid
  const topResults = resultsWithSimilarity
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
    .map((result) => {
      if (result.createdAt && result.createdAt.$date) {
        result.createdAt = new Date(result.createdAt.$date).toISOString();
      } else {
        result.createdAt = null; // Handle missing or invalid dates
      }
      return result;
    });

  console.log("🎯 Top semantic search results:", topResults);
  return topResults;
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
