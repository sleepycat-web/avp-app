import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { cosineSimilarity } from "@/lib/utils";
import { ObjectId } from "mongodb"; // Import ObjectId for type compatibility

// Constants
const ALLOWED_COLLECTIONS = [
  "EmploymentNotice",
  "NotificationCircular", 
  "Tender"
] as const;

const SEARCH_LIMITS = {
  INITIAL_RESULTS: 20,
  SEMANTIC_RESULTS: 10,
  SIMILARITY_THRESHOLD: 0.7
} as const;

// Types
interface SearchResult {
  _id: string | ObjectId; // Allow both string and ObjectId for compatibility
  title?: string;
  name?: string;          // Add name field
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
  supabase?: {          // Add supabase field for download URLs
    url?: string;
  };
  aws?: {               // Add aws field as fallback
    bucket?: string;
    key?: string;
    region?: string;
  };
  summary?: string;     // Add summary field
  fileType?: string;    // Add fileType field
}

interface GeminiEmbeddingResponse {
  embedding?: number[];
  values?: number[]; // Alternative field name
}

// Improved error handling
class SearchError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'SearchError';
  }
}

// Gemini API with proper error handling and retry logic
async function callGeminiAPI(endpoint: string, payload: any, retries = 2): Promise<any> {
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

      return await response.json();
    } catch (error) {
      console.error(`Gemini API attempt ${attempt + 1} failed:`, error);
      
      if (attempt === retries) {
        throw new SearchError("External search service unavailable", 503);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// Generate embeddings using correct Gemini API
async function generateEmbedding(text: string): Promise<number[]> {
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";
  
  const payload = {
    model: "models/text-embedding-004",
    content: {
      parts: [{ text }]
    }
  };

  const response = await callGeminiAPI(endpoint, payload);
  
  // Handle different possible response structures
  const embedding = response.embedding?.values || response.embedding || response.values;
  
  if (!embedding || !Array.isArray(embedding)) {
    throw new SearchError("Invalid embedding response from API");
  }
  
  return embedding;
}

// Refine search terms using Gemini
async function refineSearchTerms(query: string, sampleDocs: SearchResult[]): Promise<string[]> {
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
  
  // Limit sample docs to avoid token limits
  const limitedDocs = sampleDocs.slice(0, 10).map(doc => ({
    title: doc.title,
    categories: doc.categories,
    keywords: doc.keywords,
    department: doc.department
  }));

  const payload = {
    contents: [{
      parts: [{
        text: `Given this user query: "${query}"
        
And these document samples: ${JSON.stringify(limitedDocs)}

Extract 3-5 relevant search keywords that would help find documents related to the query. Return only the keywords as a comma-separated list, no explanations.`
      }]
    }]
  };

  try {
    const response = await callGeminiAPI(endpoint, payload);
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

// Optimized database search with aggregation
async function performDatabaseSearch(db: any, query: string): Promise<SearchResult[]> {
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i"); // Escape special chars
  
  const pipeline = [
    {
      $match: {
        $or: [
          { categories: regex },
          { keywords: regex },
          { department: regex },
          { title: regex },
          { content: regex }
        ]
      }
    },    {
      $project: {
        title: 1,
        name: 1,  // Ensure name is included
        content: 1,
        categories: 1,
        keywords: 1,
        department: 1,
        createdAt: 1,
        embedding: 1,
        filePath: 1,
        collection: 1,
        supabase: 1,  // Include supabase field for download URLs
        aws: 1,       // Include aws field as fallback
        summary: 1,   // Include summary field
        fileType: 1   // Include fileType field
      }
    }
  ];

  const results: SearchResult[] = [];
  
  for (const collection of ALLOWED_COLLECTIONS) {
    try {
      const docs = await db.collection(collection).aggregate(pipeline).toArray();
      results.push(...docs);
    } catch (error) {
      console.error(`Error searching collection ${collection}:`, error);
      // Continue with other collections
    }
  }

  return results;
}

// Semantic search implementation
async function performSemanticSearch(db: any, query: string): Promise<SearchResult[]> {
  try {
    console.log("🔍 Performing semantic search");
    
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);
    
    // Enhanced pipeline with text search across multiple fields
    const pipeline = [
      {
        $match: {
          $and: [
            { embedding: { $exists: true, $ne: null } },
            {
              $or: [
                { categories: { $regex: query, $options: 'i' } },
                { keywords: { $regex: query, $options: 'i' } },
                { summary: { $regex: query, $options: 'i' } },
                { title: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } }
              ]
            }
          ]
        }
      },      {
        $project: {
          title: 1,
          name: 1,      // Include name field
          content: 1,
          categories: 1,
          keywords: 1,
          department: 1,
          createdAt: 1,
          embedding: 1,
          summary: 1,
          collection: 1,
          filePath: 1,
          supabase: 1,  // Include supabase field for download URLs
          aws: 1,       // Include aws field as fallback
          fileType: 1,  // Include fileType field
          // Calculate text match score
          textScore: {
            $add: [
              { $cond: [{ $regexMatch: { input: "$title", regex: query, options: "i" } }, 2, 0] },
              { $cond: [{ $regexMatch: { input: "$content", regex: query, options: "i" } }, 1, 0] },
              { $cond: [{ $regexMatch: { input: { $concat: "$categories" }, regex: query, options: "i" } }, 1.5, 0] },
              { $cond: [{ $regexMatch: { input: { $concat: "$keywords" }, regex: query, options: "i" } }, 1.5, 0] },
              { $cond: [{ $regexMatch: { input: "$summary", regex: query, options: "i" } }, 1.8, 0] }
            ]
          }
        }
      },
      { $limit: 100 } // Initial limit for performance
    ];

    const allDocs: SearchResult[] = [];
    for (const collection of ALLOWED_COLLECTIONS) {
      const docs = await db.collection(collection).aggregate(pipeline).toArray();
      allDocs.push(...docs);
    }

    if (allDocs.length === 0) {
      return [];
    }

    // Calculate similarities and combine with text match score
    const resultsWithSimilarity = allDocs
      .map(doc => {
        if (!doc.embedding) return null;
        
        const semanticSimilarity = cosineSimilarity(queryEmbedding, doc.embedding as number[]);
        // Combine semantic similarity with text match score
        const combinedScore = (semanticSimilarity * 0.7) + ((doc.textScore ?? 0) * 0.3);
        
        return { 
          ...doc, 
          similarity: combinedScore,
          semanticScore: semanticSimilarity,
          textMatchScore: doc.textScore 
        };
      })
      .filter((doc): doc is SearchResult & { similarity: number; semanticScore: number; textMatchScore: number } => 
        doc !== null && doc.similarity! >= SEARCH_LIMITS.SIMILARITY_THRESHOLD
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, SEARCH_LIMITS.SEMANTIC_RESULTS);

    console.log(`🎯 Found ${resultsWithSimilarity.length} semantic matches with enhanced scoring`);
    return resultsWithSimilarity;
    
  } catch (error) {
    console.error("Semantic search failed:", error);
    return []; // Fallback gracefully
  }
}

// Normalize date fields
function normalizeResults(results: SearchResult[]): SearchResult[] {
  return results.map(result => ({
    ...result,
    createdAt: result.createdAt && typeof result.createdAt === 'object' && '$date' in result.createdAt
      ? new Date((result.createdAt as any).$date).toISOString()
      : result.createdAt || null
  }));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  console.log("📩 POST /api/chat received");
  
  try {
    const body = await req.json();
    const { query } = body;
    
    if (!query?.trim()) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    console.log("🔎 Processing query:", query);
    
    const { db } = await connectToDatabase();
    
    // Step 1: Initial database search
    console.log("📊 Starting initial database search");
    const initialResults = await performDatabaseSearch(db, query.trim());
    
    if (initialResults.length > 0) {
      console.log(`✅ Found ${initialResults.length} initial results`);
      return NextResponse.json({ 
        results: normalizeResults(initialResults), // Return all initial results
        searchType: 'keyword'
      });
    }

    // Step 2: Semantic search
    console.log("🧠 Trying semantic search");
    const semanticResults = await performSemanticSearch(db, query.trim());
    
    if (semanticResults.length > 0) {
      console.log(`✅ Found ${semanticResults.length} semantic results`);
      return NextResponse.json({ 
        results: normalizeResults(semanticResults), // Return all semantic results
        searchType: 'semantic'
      });
    }

    // Step 3: Keyword refinement fallback
    console.log("🔄 Attempting keyword refinement");
    
    // Get sample documents for context
    const sampleDocs: SearchResult[] = [];
    for (const collection of ALLOWED_COLLECTIONS) {
      const docs = await db.collection(collection)
        .find({})
        .limit(5)
        .project({ title: 1, categories: 1, keywords: 1, department: 1 })
        .toArray();
      sampleDocs.push(...docs.map(doc => ({ ...doc, _id: doc._id.toString() }))); // Convert _id to string
    }

    const refinedKeywords = await refineSearchTerms(query, sampleDocs);
    
    if (refinedKeywords.length > 0) {
      console.log("🔑 Refined keywords:", refinedKeywords);
        const keywordResults: SearchResult[] = [];
      for (const collection of ALLOWED_COLLECTIONS) {
        const docs = await db.collection(collection)
          .find({ 
            $or: [
              { keywords: { $in: refinedKeywords } },
              { categories: { $in: refinedKeywords } }
            ]
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
            fileType: 1
          })
          .limit(SEARCH_LIMITS.INITIAL_RESULTS)
          .toArray();
        keywordResults.push(...docs.map(doc => ({ ...doc, _id: doc._id.toString() }))); // Convert _id to string
      }

      if (keywordResults.length > 0) {
        console.log(`✅ Found ${keywordResults.length} results with refined keywords`);
        return NextResponse.json({ 
          results: normalizeResults(keywordResults), // Return all refined keyword results
          searchType: 'refined',
          refinedKeywords
        });
      }
    }

    console.log("❌ No results found");
    return NextResponse.json({
      message: "No relevant documents found for your query",
      suggestions: [
        "Try using different keywords",
        "Check for spelling errors", 
        "Use more general terms"
      ]
    }, { status: 404 });

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