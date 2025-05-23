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
import {
  Mic,
  Search,
  Filter,
  Calendar,
  Building,
  FileType,
  Download,
  Sparkles,
  Send,
} from "lucide-react";
import { MainNav } from "@/components/main-nav";
export default function SearchPage() {
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchAnimation, setSearchAnimation] = useState(false);
  const [showAIInput, setShowAIInput] = useState(false);
  const [aiQuery, setAIQuery] = useState("");
  const [expandedResultId, setExpandedResultId] = useState<number | null>(null);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [chatbotQuery, setChatbotQuery] = useState<string>("");

  // NEW: Real search results from API
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Use AI input if available, otherwise use searchQuery.
  const displayedQuery = isSearchingAI
    ? "Loading..."
    : aiQuery.trim()
    ? aiQuery
    : searchQuery;

  // Add animation effect when results load
  useEffect(() => {
    if (showResults) {
      setSearchAnimation(true);
      const timer = setTimeout(() => setSearchAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [showResults]);

  // Fetch real search results from API
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setShowResults(false);
    setExpandedResultId(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setSearchResults(data.results || []);
      setShowResults(true);
      setChatbotQuery(searchQuery); // Mount chatbot with this query
    } catch (e) {
      setSearchResults([]);
      setShowResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVoiceSearch = () => {
    setIsListening(true);
    // Simulate voice recognition
    setTimeout(() => {
      setIsListening(false);
      setSearchQuery("scholarship form ");
      // Auto-search after voice input
      setTimeout(() => {
        handleSearch();
      }, 500);
    }, 2000);
  };

  const handleAISubmit = () => {
    if (!aiQuery.trim()) return;

    setIsSearchingAI(true);

    // Simulate API call delay
    setTimeout(() => {
      setIsSearchingAI(false);

      // Check if the query contains "Higher Secondary"
      if (aiQuery.toLowerCase().includes("higher secondary")) {
        // Set only the Higher Education result to be expanded
        setExpandedResultId(2);

        // Make sure results are showing
        setShowResults(true);

        // Scroll to the result
        setTimeout(() => {
          const element = document.getElementById("result-2");
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
      setSearchQuery(aiQuery);
    }, 3000);
  };

  // Add a variable to filter results when an AI query triggers a specific result
  const resultsToDisplay = expandedResultId
    ? searchResults.filter(
        (result) => result._id && result._id.$oid === expandedResultId
      )
    : searchResults;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <MainNav />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center animate-in fade-in duration-500">
            <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              Find Government Documents
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Use natural language to search for any government document
            </p>
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
                      variant="outline"
                      size="icon"
                      className={`h-12 w-12 transition-all ${
                        isListening
                          ? "bg-red-50 border-red-200"
                          : "hover:bg-blue-50 hover:border-blue-200"
                      }`}
                      onClick={handleVoiceSearch}
                    >
                      <Mic
                        className={`h-5 w-5 ${
                          isListening
                            ? "text-red-500 animate-pulse"
                            : "text-gray-500"
                        }`}
                      />
                    </Button>
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

                  {isListening && (
                    <div className="absolute left-0 right-0 top-full mt-2 rounded-md bg-white dark:bg-gray-800 p-3 shadow-md dark:shadow-gray-900/40 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                        <p className="text-center text-sm text-gray-600">
                          Listening... Say what you&apos;re looking for
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {showResults && (
            <div
              className={`grid gap-6 md:grid-cols-[300px_1fr] ${
                searchAnimation
                  ? "animate-in fade-in zoom-in-95 duration-300"
                  : ""
              }`}
            >
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
                    {expandedResultId ? 1 : resultsToDisplay.length} results for
                    &quot;{displayedQuery}&quot;
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
                </div>

                <div className="space-y-4">
                  {resultsToDisplay.map((result: any, index: number) => (
                    <Card
                      id={`result-${result._id?.$oid || index}`}
                      key={result._id?.$oid || index}
                      className={`border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 transition-all hover:shadow-md \
                                ${
                                  expandedResultId ===
                                  (result._id?.$oid || index)
                                    ? "shadow-lg border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30"
                                    : "hover:border-blue-200 dark:hover:border-blue-800"
                                }
                                ${
                                  expandedResultId !== null &&
                                  expandedResultId !==
                                    (result._id?.$oid || index)
                                    ? "opacity-50"
                                    : ""
                                } group`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-medium text-blue-700 hover:text-blue-800 transition-colors group-hover:underline">
                              {result.name ||
                                result.title ||
                                "Untitled Document"}
                            </CardTitle>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Building className="h-3.5 w-3.5" />
                                <span>{result.department || "-"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileType className="h-3.5 w-3.5" />
                                <span>
                                  {result.fileType
                                    ? result.fileType
                                        .replace("application/", "")
                                        .toUpperCase()
                                    : "-"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {result.createdAt
                                    ? new Date(
                                        result.createdAt.$date
                                      ).toLocaleDateString()
                                    : "-"}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 group-hover:bg-green-100 transition-colors"
                              >
                                {result.relevance}% Match
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors"
                            // TODO: implement download link
                          >
                            <Download className="mr-1 h-3.5 w-3.5" />
                            Download
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-600">
                          <div>
                            {/* Show keywords or categories as snippet */}
                            {result.keywords && result.keywords.length > 0 && (
                              <span>
                                Keywords: {result.keywords.join(", ")}
                              </span>
                            )}
                            {result.categories &&
                              result.categories.length > 0 && (
                                <span>
                                  {" "}
                                  | Categories: {result.categories.join(", ")}
                                </span>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
          {chatbotQuery && (
            <Chatbot
              initialQuery={chatbotQuery}
              key={chatbotQuery} // remounts chatbot if query changes
            />
          )}
        </div>
      </main>
    </div>
  );
}
