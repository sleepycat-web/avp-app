"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  X,
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { MainNav } from "@/components/main-nav";

export default function AdminUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadSuccess(false);
    setUploadError(false);

    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);

      // Simulate success (90% chance) or error (10% chance)
      const isSuccess = Math.random() > 0.1;
      if (isSuccess) {
        setUploadSuccess(true);
        // Reset form after 2 seconds
        setTimeout(() => {
          setSelectedFile(null);
          setTags([]);
          setUploadSuccess(false);
        }, 2000);
      } else {
        setUploadError(true);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <MainNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center animate-in fade-in duration-500">
            <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              Document Upload
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Upload and categorize government documents for the SikkimDoc
              Finder
            </p>
          </div>

          <Tabs
            defaultValue="upload"
            className="mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="upload"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700"
              >
                Upload Document
              </TabsTrigger>
              <TabsTrigger
                value="recent"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700"
              >
                Recent Uploads
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <Card className="border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 overflow-hidden transition-all hover:border-blue-200 dark:hover:border-blue-800">
                <div className="bg-blue-600 h-1.5 w-full"></div>
                <CardHeader>
                  <CardTitle>Upload New Document</CardTitle>
                  <CardDescription>
                    Add a new document to the system with proper categorization
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* File Upload Section */}
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Document File</Label>
                    {!selectedFile ? (
                      <div
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() =>
                          document.getElementById("file-upload")?.click()
                        }
                      >
                        <Upload className="mb-2 h-10 w-10 text-gray-400" />
                        <p className="mb-1 text-sm font-medium text-gray-700">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, DOCX, XLSX, PPTX (Max 10MB)
                        </p>
                        <Input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".pdf,.docx,.xlsx,.pptx"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-700">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              • {selectedFile.type}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedFile(null)}
                          className="rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Document Metadata */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="doc-title">Document Title</Label>
                      <Input
                        id="doc-title"
                        placeholder="Enter document title"
                        className="focus-visible:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doc-department">Department</Label>
                      <Select>
                        <SelectTrigger
                          id="doc-department"
                          className="focus:ring-blue-500"
                        >
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="agriculture">
                            Agriculture
                          </SelectItem>
                          <SelectItem value="tourism">Tourism</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doc-type">Document Type</Label>
                      <Select>
                        <SelectTrigger
                          id="doc-type"
                          className="focus:ring-blue-500"
                        >
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="form">Form</SelectItem>
                          <SelectItem value="circular">Circular</SelectItem>
                          <SelectItem value="notification">
                            Notification
                          </SelectItem>
                          <SelectItem value="report">Report</SelectItem>
                          <SelectItem value="guideline">Guideline</SelectItem>
                          <SelectItem value="application">
                            Application
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="doc-year">Year</Label>
                      <Select defaultValue="2025">
                        <SelectTrigger
                          id="doc-year"
                          className="focus:ring-blue-500"
                        >
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2025">2025</SelectItem>
                          <SelectItem value="2023">2023</SelectItem>
                          <SelectItem value="2022">2022</SelectItem>
                          <SelectItem value="2021">2021</SelectItem>
                          <SelectItem value="2020">2020</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="doc-tags">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        id="doc-tags"
                        placeholder="Add tags (press Enter)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="focus-visible:ring-blue-500"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleAddTag}
                        disabled={!tagInput.trim()}
                        className="hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="flex items-center gap-1 group"
                          >
                            {tag}
                            <X
                              className="h-3 w-3 cursor-pointer group-hover:text-red-500 transition-colors"
                              onClick={() => handleRemoveTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="doc-description">Description</Label>
                    <Textarea
                      id="doc-description"
                      placeholder="Enter a brief description of the document"
                      rows={3}
                      className="focus-visible:ring-blue-500"
                    />
                  </div>

                  {/* AI Enhancement */}
                  <Card className="border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-1 text-sm font-medium text-gray-700">
                            AI-Enhanced Document Processing
                          </h4>
                          <p className="mb-2 text-xs text-gray-600">
                            Our AI will automatically extract key information,
                            generate tags, and make the document searchable.
                          </p>
                          <div className="flex items-center space-x-2">
                            <Switch id="ai-processing" defaultChecked />
                            <Label htmlFor="ai-processing" className="text-xs">
                              Enable AI processing
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Access Control */}
                  <div className="space-y-2">
                    <Label htmlFor="doc-access">Access Level</Label>
                    <Select defaultValue="public">
                      <SelectTrigger
                        id="doc-access"
                        className="focus:ring-blue-500"
                      >
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          Public (Accessible to all)
                        </SelectItem>
                        <SelectItem value="restricted">
                          Restricted (Requires login)
                        </SelectItem>
                        <SelectItem value="internal">
                          Internal (Government only)
                        </SelectItem>
                        <SelectItem value="confidential">
                          Confidential (Specific roles)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="min-w-[120px] hover:bg-blue-700 transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <span className="animate-pulse">Uploading</span>
                        <span className="animate-pulse">.</span>
                        <span className="animate-pulse delay-100">.</span>
                        <span className="animate-pulse delay-200">.</span>
                      </>
                    ) : (
                      "Upload Document"
                    )}
                  </Button>
                </CardFooter>

                {/* Success/Error Messages */}
                {uploadSuccess && (
                  <div className="mx-6 mb-6 flex items-center gap-2 rounded-md bg-green-50 p-3 text-green-700 animate-in fade-in slide-in-from-top duration-300">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Document uploaded successfully!</span>
                  </div>
                )}

                {uploadError && (
                  <div className="mx-6 mb-6 flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-700 animate-in fade-in slide-in-from-top duration-300">
                    <AlertCircle className="h-5 w-5" />
                    <span>Error uploading document. Please try again.</span>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="recent">
              <Card className="border-2 border-blue-100 overflow-hidden transition-all hover:border-blue-200">
                <div className="bg-blue-600 h-1.5 w-full"></div>
                <CardHeader>
                  <CardTitle>Recent Uploads</CardTitle>
                  <CardDescription>
                    Documents uploaded in the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Vaccination Guidelines",
                        department: "Health",
                        type: "PDF",
                        date: "Apr 2, 2025",
                        status: "Published",
                      },
                      {
                        title: "Tourism Development Plan 2025",
                        department: "Tourism",
                        type: "DOCX",
                        date: "Apr 1, 2025",
                        status: "Published",
                      },
                      {
                        title: "Agricultural Subsidy Form",
                        department: "Agriculture",
                        type: "PDF",
                        date: "Mar 28, 2025",
                        status: "Processing",
                      },
                      {
                        title: "School Admission Circular 2025",
                        department: "Education",
                        type: "PDF",
                        date: "Mar 25, 2025",
                        status: "Published",
                      },
                    ].map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:shadow-sm hover:border-blue-200 transition-all group"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                              {doc.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              <span>{doc.department}</span>
                              <span>•</span>
                              <span>{doc.type}</span>
                              <span>•</span>
                              <span>Uploaded: {doc.date}</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            doc.status === "Published" ? "outline" : "secondary"
                          }
                          className={
                            doc.status === "Published"
                              ? "bg-green-50 text-green-700 group-hover:bg-green-100 transition-colors"
                              : "bg-yellow-50 text-yellow-700 group-hover:bg-yellow-100 transition-colors"
                          }
                        >
                          {doc.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
