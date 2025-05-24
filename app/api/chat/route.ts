import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { cosineSimilarity } from "@/lib/utils";
import { ObjectId, Db } from "mongodb"; // Import ObjectId for type compatibility

/**
 * CONFIGURATION CONSTANTS
 * These define the allowed collections to search and performance limits
 */
// Constants
const ALLOWED_COLLECTIONS = [
  "EmploymentNotice",
  "NotificationCircular",
  "Tender",
] as const;

const SEARCH_LIMITS = {
  INITIAL_RESULTS: 20,
  SEMANTIC_RESULTS: 10,
  SIMILARITY_THRESHOLD: 0.7,
} as const;

/**
 * TYPE DEFINITIONS
 * These interfaces define the structure of data we work with
 */
// Types
interface SearchResult {
  _id: string | ObjectId; // Allow both string and ObjectId for compatibility
  title?: string;
  name?: string; // Add name field
  content?: string;
  categories?: string[];
  keywords?: string[];
  department?: string;
  createdAt?: Date | string | null;
  similarity?: number;
  embedding?: number[]; // Add embedding property
  textScore?: number; // Add textScore property
  filePath?: string;
  collection?: string;
  supabase?: {
    // Add supabase field for download URLs
    url?: string;
  };
  aws?: {
    // Add aws field as fallback
    bucket?: string;
    key?: string;
    region?: string;
  };
  summary?: string; // Add summary field
  fileType?: string; // Add fileType field
}

// Gemini API types
interface GeminiEmbeddingResponse {
  embedding?:
    | {
        values?: number[];
      }
    | number[];
  values?: number[];
}

interface GeminiContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface MongoDocument {
  _id: ObjectId;
  title?: string;
  name?: string;
  content?: string;
  categories?: string[];
  keywords?: string[];
  department?: string;
  createdAt?: Date | string | null;
  embedding?: number[];
  filePath?: string;
  supabase?: {
    url?: string;
  };
  aws?: {
    bucket?: string;
    key?: string;
    region?: string;
  };
  summary?: string;
  fileType?: string;
  textScore?: number;
}

// Pipeline stage types
interface MatchStage {
  $match: Record<string, unknown>;
}

interface ProjectStage {
  $project: Record<string, unknown>;
}

interface LimitStage {
  $limit: number;
}

type PipelineStage = MatchStage | ProjectStage | LimitStage;

/**
 * ERROR HANDLING CLASS
 * Custom error class for better error management in search operations
 */
// Improved error handling
class SearchError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = "SearchError";
  }
}

/**
 * GEMINI API CALLER WITH RETRY LOGIC
 * Responsible for: Making API calls to Google's Gemini AI service with automatic retries
 * - Handles authentication with API key
 * - Implements exponential backoff retry strategy
 * - Provides consistent error handling for all Gemini API calls
 */
// Gemini API with proper error handling and retry logic
async function callGeminiAPI(
  endpoint: string,
  payload: Record<string, unknown>,
  retries = 2
): Promise<GeminiEmbeddingResponse | GeminiContentResponse> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new SearchError("Gemini API key not configured", 500);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return (await response.json()) as
        | GeminiEmbeddingResponse
        | GeminiContentResponse;
    } catch (error) {
      console.error(`Gemini API attempt ${attempt + 1} failed:`, error);

      if (attempt === retries) {
        throw new SearchError("External search service unavailable", 503);
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  // This should never be reached due to the throw in the loop, but TypeScript needs it
  throw new SearchError("External search service unavailable", 503);
}

/**
 * EMBEDDING GENERATOR
 * Responsible for: Converting text into numerical vectors (embeddings) for semantic search
 * - Uses Google's text-embedding-004 model
 * - Converts user queries and document content into mathematical representations
 * - Enables similarity comparisons between different texts
 */
// Generate embeddings using correct Gemini API
async function generateEmbedding(text: string): Promise<number[]> {
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

  const payload = {
    model: "models/text-embedding-004",
    content: {
      parts: [{ text }],
    },
  };

  const response = (await callGeminiAPI(
    endpoint,
    payload
  )) as GeminiEmbeddingResponse;

  // Handle different possible response structures
  const embedding =
    (response.embedding as { values?: number[] })?.values ||
    (response.embedding as number[]) ||
    response.values;

  if (!embedding || !Array.isArray(embedding)) {
    throw new SearchError("Invalid embedding response from API");
  }

  return embedding;
}

/**
 * SEARCH TERM REFINEMENT
 * Responsible for: Improving search queries using AI to extract better keywords
 * - Takes user's original query and sample documents as context
 * - Uses Gemini AI to generate more relevant search terms
 * - Helps find documents when direct keyword matching fails
 */
// Refine search terms using Gemini
async function refineSearchTerms(
  query: string,
  sampleDocs: SearchResult[]
): Promise<string[]> {
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

  // Limit sample docs to avoid token limits
  const limitedDocs = sampleDocs.slice(0, 10).map((doc) => ({
    title: doc.title,
    categories: doc.categories,
    keywords: doc.keywords,
    department: doc.department,
  }));

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Given this user query: "${query}"
        
And these document samples: ${JSON.stringify(limitedDocs)}

Extract 3-5 relevant search keywords that would help find documents related to the query. Return only the keywords as a comma-separated list, no explanations.`,
          },
        ],
      },
    ],
  };

  try {
    const response = (await callGeminiAPI(
      endpoint,
      payload
    )) as GeminiContentResponse;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return text
      .split(/[,\n]/)
      .map((k: string) => k.trim()) // Explicitly type 'k' as string
      .filter((k: string) => k.length > 2) // Explicitly type 'k' as string
      .slice(0, 5);
  } catch (error) {
    console.error("Failed to refine search terms:", error);
    return []; // Fallback to empty array
  }
}

/**
 * BASIC DATABASE SEARCH (KEYWORD MATCHING)
 * Responsible for: Finding documents using traditional text matching
 * - Searches across multiple fields: categories, keywords, department, title, content
 * - Uses regular expressions for case-insensitive matching
 * - Fast and reliable for exact keyword matches
 * - Searches across all allowed collections (EmploymentNotice, NotificationCircular, Tender)
 */
// Optimized database search with aggregation
async function performDatabaseSearch(
  db: Db,
  query: string
): Promise<SearchResult[]> {
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); // Escape special chars

  const pipeline: PipelineStage[] = [
    {
      $match: {
        $or: [
          { categories: regex },
          { keywords: regex },
          { department: regex },
          { title: regex },
          { content: regex },
        ],
      },
    },
    {
      $project: {
        title: 1,
        name: 1, // Ensure name is included
        content: 1,
        categories: 1,
        keywords: 1,
        department: 1,
        createdAt: 1,
        embedding: 1,
        filePath: 1,
        collection: 1,
        supabase: 1, // Include supabase field for download URLs
        aws: 1, // Include aws field as fallback
        summary: 1, // Include summary field
        fileType: 1, // Include fileType field
      },
    },
  ];

  const results: SearchResult[] = [];
  for (const collection of ALLOWED_COLLECTIONS) {
    try {
      const docs: MongoDocument[] = await db
        .collection<MongoDocument>(collection)
        .aggregate<MongoDocument>(pipeline)
        .toArray();
      // Add collection name to each document
      const docsWithCollection = docs.map((doc) => ({
        ...doc,
        collection: collection,
        _id: doc._id.toString(), // Convert ObjectId to string
      }));
      results.push(...docsWithCollection);
    } catch (error) {
      console.error(`Error searching collection ${collection}:`, error);
      // Continue with other collections
    }
  }

  return results;
}

/**
 * SEMANTIC SEARCH ENGINE
 * Responsible for: Finding documents based on meaning rather than exact words
 * - Converts user query into embedding (numerical representation)
 * - Compares query embedding with document embeddings using cosine similarity
 * - Combines semantic similarity (70%) with text matching score (30%)
 * - Finds documents that are conceptually related even if they don't share exact keywords
 * - Returns results sorted by combined relevance score
 */
// Semantic search implementation
async function performSemanticSearch(
  db: Db,
  query: string
): Promise<SearchResult[]> {
  try {
    console.log("🔍 Performing semantic search");

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Enhanced pipeline with text search across multiple fields
    const pipeline: PipelineStage[] = [
      {
        $match: {
          $and: [
            { embedding: { $exists: true, $ne: null } },
            {
              $or: [
                { categories: { $regex: query, $options: "i" } },
                { keywords: { $regex: query, $options: "i" } },
                { summary: { $regex: query, $options: "i" } },
                { title: { $regex: query, $options: "i" } },
                { content: { $regex: query, $options: "i" } },
              ],
            },
          ],
        },
      },
      {
        $project: {
          title: 1,
          name: 1, // Include name field
          content: 1,
          categories: 1,
          keywords: 1,
          department: 1,
          createdAt: 1,
          embedding: 1,
          summary: 1,
          collection: 1,
          filePath: 1,
          supabase: 1, // Include supabase field for download URLs
          aws: 1, // Include aws field as fallback
          fileType: 1, // Include fileType field
          // Calculate text match score
          textScore: {
            $add: [
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$title",
                      regex: query,
                      options: "i",
                    },
                  },
                  2,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$content",
                      regex: query,
                      options: "i",
                    },
                  },
                  1,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: { $concat: "$categories" },
                      regex: query,
                      options: "i",
                    },
                  },
                  1.5,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: { $concat: "$keywords" },
                      regex: query,
                      options: "i",
                    },
                  },
                  1.5,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$summary",
                      regex: query,
                      options: "i",
                    },
                  },
                  1.8,
                  0,
                ],
              },
            ],
          },
        },
      },
      { $limit: 100 }, // Initial limit for performance
    ];

    const allDocs: SearchResult[] = [];
    for (const collection of ALLOWED_COLLECTIONS) {
      const docs: MongoDocument[] = await db
        .collection<MongoDocument>(collection)
        .aggregate<MongoDocument>(pipeline)
        .toArray();
      // Add collection name to each document
      const docsWithCollection = docs.map((doc) => ({
        ...doc,
        collection: collection,
        _id: doc._id.toString(), // Convert ObjectId to string
      }));
      allDocs.push(...docsWithCollection);
    }

    if (allDocs.length === 0) {
      return [];
    }

    /**
     * SIMILARITY CALCULATION AND SCORING
     * This section calculates how similar documents are to the user's query
     * - Computes cosine similarity between query and document embeddings
     * - Combines semantic similarity (70%) with text match score (30%)
     * - Filters results to only include documents above similarity threshold
     * - Sorts by combined relevance score
     */
    // Calculate similarities and combine with text match score
    const resultsWithSimilarity = allDocs
      .map((doc) => {
        if (!doc.embedding) return null;

        const semanticSimilarity = cosineSimilarity(
          queryEmbedding,
          doc.embedding as number[]
        );
        // Combine semantic similarity with text match score
        const combinedScore =
          semanticSimilarity * 0.7 + (doc.textScore ?? 0) * 0.3;

        return {
          ...doc,
          similarity: combinedScore,
          semanticScore: semanticSimilarity,
          textMatchScore: doc.textScore,
        };
      })
      .filter(
        (
          doc
        ): doc is SearchResult & {
          similarity: number;
          semanticScore: number;
          textMatchScore: number;
        } =>
          doc !== null && doc.similarity! >= SEARCH_LIMITS.SIMILARITY_THRESHOLD
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, SEARCH_LIMITS.SEMANTIC_RESULTS);

    console.log(
      `🎯 Found ${resultsWithSimilarity.length} semantic matches with enhanced scoring`
    );
    return resultsWithSimilarity;
  } catch (error) {
    console.error("Semantic search failed:", error);
    return []; // Fallback gracefully
  }
}

/**
 * DATA NORMALIZATION
 * Responsible for: Cleaning and standardizing search results
 * - Converts MongoDB date objects to ISO strings
 * - Ensures consistent data format for frontend consumption
 * - Handles different date formats that might exist in the database
 */
// Normalize date fields
function normalizeResults(results: SearchResult[]): SearchResult[] {
  return results.map((result) => ({
    ...result,
    createdAt:
      result.createdAt &&
      typeof result.createdAt === "object" &&
      "$date" in result.createdAt
        ? new Date((result.createdAt as { $date: string }).$date).toISOString()
        : result.createdAt || null,
  }));
}

/**
 * MAIN API ENDPOINT HANDLER
 * Responsible for: Orchestrating the entire search process
 * This function implements a 3-tier search strategy:
 *
 * TIER 1: Basic keyword search (fastest)
 * - Direct text matching across document fields
 * - Returns immediately if matches found
 *
 * TIER 2: Semantic search (AI-powered)
 * - Uses embeddings and cosine similarity
 * - Finds conceptually related documents
 * - Only runs if keyword search fails
 *
 * TIER 3: Refined keyword search (fallback)
 * - Uses AI to generate better search terms
 * - Searches again with AI-suggested keywords
 * - Last resort when other methods fail
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  console.log("📩 POST /api/chat received");

  try {
    const body = (await req.json()) as { query?: string };
    const { query } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log("🔎 Processing query:", query);

    const { db } = await connectToDatabase();

    /**
     * SEARCH TIER 1: INITIAL DATABASE SEARCH
     * Fast keyword-based search using MongoDB text matching
     */
    // Step 1: Initial database search
    console.log("📊 Starting initial database search");
    const initialResults = await performDatabaseSearch(db, query.trim());

    if (initialResults.length > 0) {
      console.log(`✅ Found ${initialResults.length} initial results`);
      return NextResponse.json({
        results: normalizeResults(initialResults), // Return all initial results
        searchType: "keyword",
      });
    }

    /**
     * SEARCH TIER 2: SEMANTIC SEARCH
     * AI-powered search using document embeddings and similarity matching
     */
    // Step 2: Semantic search
    console.log("🧠 Trying semantic search");
    const semanticResults = await performSemanticSearch(db, query.trim());

    if (semanticResults.length > 0) {
      console.log(`✅ Found ${semanticResults.length} semantic results`);
      return NextResponse.json({
        results: normalizeResults(semanticResults), // Return all semantic results
        searchType: "semantic",
      });
    }

    /**
     * SEARCH TIER 3: KEYWORD REFINEMENT FALLBACK
     * AI-assisted keyword generation for improved search terms
     */
    // Step 3: Keyword refinement fallback
    console.log("🔄 Attempting keyword refinement");

    // Get sample documents for context
    const sampleDocs: SearchResult[] = [];
    for (const collection of ALLOWED_COLLECTIONS) {
      const docs = await db
        .collection<MongoDocument>(collection)
        .find<MongoDocument>({})
        .project({ title: 1, categories: 1, keywords: 1, department: 1 })
        .limit(5)
        .toArray();
      sampleDocs.push(
        ...docs.map((doc) => ({ ...doc, _id: doc._id.toString() }))
      ); // Convert _id to string
    }

    const refinedKeywords = await refineSearchTerms(query, sampleDocs);

    if (refinedKeywords.length > 0) {
      console.log("🔑 Refined keywords:", refinedKeywords);
      const keywordResults: SearchResult[] = [];
      for (const collection of ALLOWED_COLLECTIONS) {
        const docs = await db
          .collection<MongoDocument>(collection)
          .find<MongoDocument>({
            $or: [
              { keywords: { $in: refinedKeywords } },
              { categories: { $in: refinedKeywords } },
            ],
          })
          .project({
            title: 1,
            name: 1,
            content: 1,
            categories: 1,
            keywords: 1,
            department: 1,
            createdAt: 1,
            filePath: 1,
            collection: 1,
            supabase: 1,
            aws: 1,
            summary: 1,
            fileType: 1,
          })
          .limit(SEARCH_LIMITS.INITIAL_RESULTS)
          .toArray();
        keywordResults.push(
          ...docs.map((doc) => ({ ...doc, _id: doc._id.toString() }))
        ); // Convert _id to string
      }

      if (keywordResults.length > 0) {
        console.log(
          `✅ Found ${keywordResults.length} results with refined keywords`
        );
        return NextResponse.json({
          results: normalizeResults(keywordResults), // Return all refined keyword results
          searchType: "refined",
          refinedKeywords,
        });
      }
    }

    /**
     * NO RESULTS FOUND
     * Return helpful suggestions when all search strategies fail
     */
    console.log("❌ No results found");
    return NextResponse.json(
      {
        message: "No relevant documents found for your query",
        suggestions: [
          "Try using different keywords",
          "Check for spelling errors",
          "Use more general terms",
        ],
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("🚨 Search error:", error);

    // Don't expose internal errors to client
    if (error instanceof SearchError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Search service temporarily unavailable" },
      { status: 503 }
    );
  }
}
