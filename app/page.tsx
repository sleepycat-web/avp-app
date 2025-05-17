import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  FileSearch,
  Upload,
  Search,
  FileText,
  CheckCircle,
} from "lucide-react";
import { MainNav } from "@/components/main-nav";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <MainNav />

      <main className="container mx-auto px-4 py-12">
        <section className="mb-16 text-center">
          <div className="mx-auto max-w-3xl space-y-4">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white animate-in fade-in duration-500">
              AI-Powered Document Search Assistant
            </h2>
            <p className="mx-auto mb-8 text-lg text-gray-600 dark:text-gray-300 animate-in fade-in duration-700">
              Making government documents accessible and easy to find for all
              citizens of Sikkim
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 animate-in fade-in duration-1000">
            <Card className="border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 transition-all hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                  <div className="rounded-full bg-blue-100 p-2 group-hover:bg-blue-200 transition-colors">
                    <FileSearch className="h-6 w-6 text-blue-600" />
                  </div>
                  <span>Search Documents</span>
                </CardTitle>
                <CardDescription>
                  Find government documents using natural language or voice
                  search
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 rounded-lg bg-gray-50 dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Search className="h-4 w-4" />
                    <span className="italic">
                      &quot;Find scholarship form for college students
                      2025&quot;
                    </span>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Natural language search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Voice-enabled queries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">AI-guided assistance</span>
                  </div>
                </div>
                <Link href="/search">
                  <Button className="w-full group-hover:bg-blue-700 transition-colors">
                    Go to Search
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 transition-all hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                  <div className="rounded-full bg-blue-100 p-2 group-hover:bg-blue-200 transition-colors">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <span>Admin Portal</span>
                </CardTitle>
                <CardDescription>
                  Upload and categorize documents for the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 rounded-lg bg-gray-50 dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <FileText className="h-4 w-4" />
                    <span className="italic">
                      Upload, tag, and manage government documents
                    </span>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      AI-enhanced document processing
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Smart tagging system</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Access control management</span>
                  </div>
                </div>
                <Link href="/admin/upload">
                  <Button className="w-full group-hover:bg-blue-700 transition-colors">
                    Admin Portal
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 dark:bg-gray-900 py-8 border-t border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">SikkimDoc Finder</span>
            </div>
            <p>© 2025 Government of Sikkim Initiative</p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Terms of Use
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
