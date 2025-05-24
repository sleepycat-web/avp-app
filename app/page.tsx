"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Chatbot from "@/components/chatbot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Filter, Loader2 } from "lucide-react";
import { MainNav } from "@/components/main-nav";

// Define a type for search results, replace '...' with actual properties
interface SearchResult {
  _id?: { $oid: string };
  name?: string;
  title?: string;
  filePath?: string;
  collection?: string;
  categories?: string[];
  summary?: string;
  createdAt?: string;
  supabase?: { url?: string };
  // ... other properties
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSearchQuery, setCurrentSearchQuery] = useState(""); // Store the query that was actually searched
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [chatbotQuery, setChatbotQuery] = useState<string>("");
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");

  // Add a handler to receive results from chatbot refinement
  const handleChatbotResults = (results: SearchResult[]) => {
    setSearchResults(results);
    setShowResults(true);
    setChatbotQuery(""); // Unmount chatbot after showing results
  };
  // Perform search for given query or current searchQuery
  const handleSearch = async (queryParam?: string) => {
    const query = queryParam ?? searchQuery;
    if (!query.trim()) {
      return;
    }

    setIsSearching(true);
    setShowResults(false);
    setCurrentSearchQuery(query); // Store the search query that's being executed

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      console.log("API Response:", data); // Log the response received after query
      console.log("Search Results:", data.results); // Log the actual results array
      // Log each result to see the structure
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((result: SearchResult, index: number) => {
          console.log(`Result ${index}:`, {
            name: result.name,
            supabase: result.supabase,
            hasSupabaseUrl: !!result.supabase?.url,
          });
        });
      }
      setSearchResults(Array.isArray(data.results) ? data.results : []);
      setShowResults(true);
      setChatbotQuery(query);
    } catch (e) {
      console.error("Error during search:", e);
      setSearchResults([]);
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Handler for Chatbot's query refinement
  const handleChatbotQuery = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  // Update filtered results when search results, filters, or sort order change
  useEffect(() => {
    let filtered = [...searchResults];

    // Apply document type filter
    if (selectedDocumentType && selectedDocumentType !== "all") {
      filtered = filtered.filter((result) => {
        const docType = getDocumentType(result);
        return docType.toLowerCase() === selectedDocumentType.toLowerCase();
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);

      if (sortOrder === "newest") {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    });

    setFilteredResults(filtered);
  }, [searchResults, selectedDocumentType, sortOrder]);

  const getDocumentTitle = (result: SearchResult) => {
    // Always use the document name from database
    if (result.name) return result.name;
    if (result.title) return result.title;

    // If somehow we don't have a name (which shouldn't happen),
    // extract it from filepath as last resort
    if (result.filePath) {
      const filename = result.filePath.split("/").pop() || "";
      return filename.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
    }

    // Log error if we reach here (should never happen)
    console.error("Document missing required name field:", result);
    return "Error: Document name not found";
  };
  const getDocumentType = (result: SearchResult) => {
    // Primary: Use the collection field from database
    if (result.collection) {
      const collection = result.collection.toLowerCase();
      // Map collection names to display names
      if (collection.includes("employmentnotice")) return "Employment";
      if (collection.includes("notificationcircular")) return "Circular";
      if (collection.includes("tender")) return "Tender";
      if (collection.includes("notice")) return "Notice";
    }

    // Fallback 1: Check document name or title
    const title = (result.name || result.title || "").toLowerCase();
    if (title.includes("tender")) return "Tender";
    if (title.includes("notice")) return "Notice";
    if (title.includes("circular")) return "Circular";
    if (title.includes("employment") || title.includes("job"))
      return "Employment";

    // Fallback 2: Check categories
    if (result.categories && Array.isArray(result.categories)) {
      for (const category of result.categories) {
        const cat = category.toLowerCase();
        if (cat.includes("tender")) return "Tender";
        if (cat.includes("notice")) return "Notice";
        if (cat.includes("circular")) return "Circular";
        if (cat.includes("employment") || cat.includes("job"))
          return "Employment";
      }
    }

    // Fallback 3: Check summary
    if (result.summary) {
      const summary = result.summary.toLowerCase();
      if (summary.includes("tender")) return "Tender";
      if (summary.includes("notice")) return "Notice";
      if (summary.includes("circular")) return "Circular";
      if (summary.includes("employment") || summary.includes("job"))
        return "Employment";
    }

    return "Document"; // Default fallback
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {" "}
          <div className="mb-8 text-center animate-in fade-in duration-500">
            <div className="break-words">
              <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white break-words">
                Find Government Documents
              </h2>
              <p className="text-gray-600 dark:text-gray-300 break-words">
                Use natural language to search for any government document
              </p>
            </div>
          </div>
          <Card className="mb-8 border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 overflow-hidden animate-in fade-in duration-700">
            <div className="bg-blue-600 h-1.5 w-full"></div>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                      <Input
                        className="pl-10 pr-4 py-6 text-lg focus-visible:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                        placeholder="Enter your search query"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>{" "}
                    <Button
                      className="h-12 px-6 transition-all hover:bg-blue-700 flex items-center justify-center"
                      onClick={() => handleSearch()}
                      disabled={isSearching || !searchQuery.trim()}
                    >
                      {isSearching ? (
                        <>
                          Searching{" "}
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        "Search"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {showResults && (
            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
              <div className="order-2 md:order-1">
                <Card className="sticky top-20 border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 transition-all hover:border-blue-200 dark:hover:border-blue-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Filter className="h-5 w-5 text-blue-600" />
                      Filters
                    </CardTitle>
                  </CardHeader>{" "}
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Document Type
                        </Label>
                        <Select
                          value={selectedDocumentType}
                          onValueChange={(value) =>
                            setSelectedDocumentType(value)
                          }
                        >
                          <SelectTrigger className="focus:ring-blue-500">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>{" "}
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="employment">
                              Employment
                            </SelectItem>
                            <SelectItem value="circular">Circular</SelectItem>
                            <SelectItem value="notice">Notice</SelectItem>
                            <SelectItem value="tender">Tender</SelectItem>
                            <SelectItem value="document">Document</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Sort by Date
                        </Label>
                        <Select
                          value={sortOrder}
                          onValueChange={(value) => setSortOrder(value)}
                        >
                          <SelectTrigger className="focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="order-1 md:order-2">
                {" "}
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {filteredResults.length} results for &quot;
                    {currentSearchQuery}
                    &quot;
                  </h3>
                </div>{" "}
                <div className="space-y-4">
                  {filteredResults.map(
                    (result: SearchResult, index: number) => {
                      // Debug logging for each result
                      console.log(`Rendering result ${index}:`, {
                        name: result.name,
                        supabase: result.supabase,
                        hasSupabaseUrl: !!result.supabase?.url,
                        fullResult: result,
                      });

                      return (
                        <Card
                          key={result._id?.$oid || index}
                          className="border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 group overflow-hidden"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="flex items-start gap-2 mb-2">
                                  <Badge className="bg-blue-100   text-black text-xs flex-shrink-0">
                                    {getDocumentType(result)}
                                  </Badge>
                                </div>{" "}
                                <CardTitle className="text-lg font-medium text-blue-700 hover:text-blue-800 transition-colors group-hover:underline break-words leading-relaxed whitespace-normal mb-3 overflow-x-auto max-w-full">
                                  {getDocumentTitle(result)}
                                </CardTitle>
                                <div className="mt-2 space-y-2 text-sm text-gray-500">
                                  {result.summary && (
                                    <p className="break-words leading-relaxed">
                                      {result.summary}
                                    </p>
                                  )}
                                  {result.categories &&
                                    result.categories.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {result.categories
                                          .slice(0, 3)
                                          .map(
                                            (category: string, idx: number) => (
                                              <Badge
                                                key={idx}
                                                variant="secondary"
                                                className="text-xs"
                                              >
                                                {category}
                                              </Badge>
                                            )
                                          )}
                                      </div>
                                    )}
                                  <p className="break-words">
                                    Created At:{" "}
                                    {result.createdAt
                                      ? new Date(
                                          result.createdAt
                                        ).toLocaleDateString()
                                      : "Not specified"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {result.supabase?.url ? (
                                  <Button
                                    className="h-10 px-4 bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
                                    onClick={async () => {
                                      // Debug log to see what's available
                                      console.log("Document download data:", {
                                        supabaseUrl: result.supabase?.url,
                                        name: result.name,
                                      });

                                      // Use supabase.url directly
                                      if (result.supabase?.url) {
                                        window.open(
                                          result.supabase.url,
                                          "_blank"
                                        );
                                      } else {
                                        alert(
                                          "Sorry, file download is not available for this document."
                                        );
                                      }
                                    }}
                                  >
                                    Download
                                  </Button>
                                ) : (
                                  <div className="h-10 px-4 flex items-center">
                                    <span className="text-gray-400 text-sm italic whitespace-nowrap">
                                      File not available
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}{" "}
          {/* Chatbot is always visible, but only auto-opens when no results found */}
          <Chatbot
            initialQuery={
              showResults && searchResults.length === 0 ? chatbotQuery : ""
            }
            key={
              showResults && searchResults.length === 0
                ? chatbotQuery
                : "always-visible"
            }
            initialResults={
              showResults && searchResults.length === 0 ? searchResults : []
            }
            onResults={handleChatbotResults} // legacy: handle direct results
            onQuery={handleChatbotQuery} // delegate refined queries to parent
          />
        </div>
      </main>
    </div>
  );
}
