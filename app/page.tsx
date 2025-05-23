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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Filter } from "lucide-react";
import { MainNav } from "@/components/main-nav";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [chatbotQuery, setChatbotQuery] = useState<string>("");
  // Add a handler to receive results from chatbot refinement
  const handleChatbotResults = (results: any[]) => {
    setSearchResults(results);
    setShowResults(true);
    setChatbotQuery(""); // Unmount chatbot after showing results
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setShowResults(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      console.log("API Response:", data); // Log the response received after query
      console.log("Search Results:", data.results); // Log the actual results array
      // Log each result to see the structure
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((result: any, index: number) => {
          console.log(`Result ${index}:`, {
            name: result.name,
            supabase: result.supabase,
            hasSupabaseUrl: !!result.supabase?.url,
          });
        });
      }
      setSearchResults(Array.isArray(data.results) ? data.results : []);
      setShowResults(true);
      setChatbotQuery(searchQuery);
    } catch (e) {
      console.error("Error during search:", e);
      setSearchResults([]);
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };
  const getDocumentTitle = (result: any) => {
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
                        placeholder="Try 'agricultural subsidy form'"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                    <Button
                      className="h-12 px-6 transition-all hover:bg-blue-700"
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                    >
                      {isSearching ? (
                        <>
                          <span className="animate-pulse">Searching</span>
                          <span className="animate-pulse">.</span>
                          <span className="animate-pulse delay-100">.</span>
                          <span className="animate-pulse delay-200">.</span>
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
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Document Type
                        </Label>
                        <Select>
                          <SelectTrigger className="focus:ring-blue-500">
                            <SelectValue placeholder="Select Document Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tender">Tender</SelectItem>
                            <SelectItem value="circular">Circular</SelectItem>
                            <SelectItem value="notice">Notice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Relevance
                          </Label>
                          <span className="text-xs text-gray-500">
                            70% or higher
                          </span>
                        </div>
                        <Slider
                          defaultValue={[70]}
                          max={100}
                          step={1}
                          className="[&>span]:bg-blue-600"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="verified" />
                        <Label htmlFor="verified" className="text-sm">
                          Show verified documents only
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="order-1 md:order-2">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {searchResults.length} results for &quot;{searchQuery}&quot;
                  </h3>
                  <Select defaultValue="relevance">
                    <SelectTrigger className="w-[180px] focus:ring-blue-500">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">
                        Sort by Relevance
                      </SelectItem>
                      <SelectItem value="date">Sort by Date</SelectItem>
                      <SelectItem value="title">Sort by Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>{" "}
                <div className="space-y-4">
                  {searchResults.map((result: any, index: number) => {
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
                        className="border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 group"
                      >
                        <CardHeader className="pb-2">
                          {" "}
                          <div className="flex items-start justify-between gap-4">
                            {" "}
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg font-medium text-blue-700 hover:text-blue-800 transition-colors group-hover:underline break-words leading-relaxed whitespace-normal overflow-wrap-anywhere mb-3">
                                {getDocumentTitle(result)}
                              </CardTitle>
                              <div className="mt-2 space-y-1 text-sm text-gray-500">
                                {result.summary && (
                                  <p className="line-clamp-3 break-words">
                                    {result.summary.length > 200
                                      ? result.summary.substring(0, 200) + "..."
                                      : result.summary}
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
                            </div>{" "}
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
                          </div>{" "}
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {/* Only mount Chatbot if no results are found */}
          {showResults && searchResults.length === 0 && (
            <Chatbot
              initialQuery={chatbotQuery}
              key={chatbotQuery}
              initialResults={searchResults}
              onResults={handleChatbotResults} // Pass callback for refined results
            />
          )}
        </div>
      </main>
    </div>
  );
}
