import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// You must set these as environment variables in your deployment
const MONGODB_URI = process.env.MONGODB_URI!  ;
const MONGODB_DB = process.env.MONGODB_DB!;

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

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) {
    return NextResponse.json(
      { response: "No query provided." },
      { status: 400 }
    );
  }

  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    // Get all collections
    const collections = await db.listCollections().toArray();
    let allDocs: any[] = [];
    for (const col of collections) {
      const docs = await db.collection(col.name).find({}).toArray();
      allDocs = allDocs.concat(docs);
    }
    // Use Gemini API to match
    const response = await queryGeminiAPI(query, allDocs);
    return NextResponse.json({ response });
  } catch (e) {
    return NextResponse.json(
      { response: "Error querying database." },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
