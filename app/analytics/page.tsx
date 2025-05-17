import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MainNav } from "@/components/main-nav";
import {
  BarChart3,
  FileText,
  Users,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
      <MainNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor document usage and search patterns
              </p>
            </div>
            <Badge
              variant="outline"
              className="self-start md:self-auto bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1"
            >
              Last updated: Today, 10:45 AM
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <Card className="border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 hover:border-blue-200 dark:hover:border-blue-800 transition-all hover:shadow-md group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Documents
                  </p>
                  <p className="text-3xl font-bold text-gray-900">1,248</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 group-hover:bg-blue-200 transition-colors">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500">+12%</span>
                <span className="ml-1 text-gray-500">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 hover:border-blue-200 dark:hover:border-blue-800 transition-all hover:shadow-md group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Searches
                  </p>
                  <p className="text-3xl font-bold text-gray-900">5,672</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 group-hover:bg-blue-200 transition-colors">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500">+24%</span>
                <span className="ml-1 text-gray-500">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 hover:border-blue-200 dark:hover:border-blue-800 transition-all hover:shadow-md group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Downloads</p>
                  <p className="text-3xl font-bold text-gray-900">3,157</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 group-hover:bg-blue-200 transition-colors">
                  <Download className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500">+18%</span>
                <span className="ml-1 text-gray-500">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 hover:border-blue-200 dark:hover:border-blue-800 transition-all hover:shadow-md group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Active Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900">892</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 group-hover:bg-blue-200 transition-colors">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowDown className="mr-1 h-4 w-4 text-amber-500" />
                <span className="text-amber-500">-3%</span>
                <span className="ml-1 text-gray-500">from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <Card className="border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 hover:border-blue-200 dark:hover:border-blue-800 transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Popular Search Terms</span>
                <Badge
                  variant="outline"
                  className="ml-2 bg-blue-50 text-blue-600 text-xs"
                >
                  This Month
                </Badge>
              </CardTitle>
              <CardDescription>
                Most frequently searched terms this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { term: "scholarship form", count: 342 },
                  { term: "land records", count: 287 },
                  { term: "birth certificate", count: 231 },
                  { term: "voter id", count: 198 },
                  { term: "driving license", count: 176 },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600 group-hover:bg-blue-200 transition-colors">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                        {item.term}
                      </span>
                    </div>
                    <span className="text-gray-500">{item.count} searches</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 hover:border-blue-200 dark:hover:border-blue-800 transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Most Downloaded Documents</span>
                <Badge
                  variant="outline"
                  className="ml-2 bg-blue-50 text-blue-600 text-xs"
                >
                  This Month
                </Badge>
              </CardTitle>
              <CardDescription>Top documents by download count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "Scholarship Application Form 2025",
                    department: "Education",
                    downloads: 187,
                  },
                  {
                    title: "Land Ownership Certificate Form",
                    department: "Revenue",
                    downloads: 156,
                  },
                  {
                    title: "Birth Certificate Application",
                    department: "Health",
                    downloads: 134,
                  },
                  {
                    title: "Voter ID Correction Form",
                    department: "Election",
                    downloads: 112,
                  },
                  {
                    title: "Driving License Application",
                    department: "Transport",
                    downloads: 98,
                  },
                ].map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-md transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                        {doc.title}
                      </p>
                      <p className="text-xs text-gray-500">{doc.department}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Download className="h-4 w-4" />
                      <span>{doc.downloads}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <Card className="border-blue-100 dark:border-blue-900/50 dark:bg-gray-900 hover:border-blue-200 dark:hover:border-blue-800 transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Monthly Activity</span>
                <Badge
                  variant="outline"
                  className="ml-2 bg-blue-50 text-blue-600 text-xs"
                >
                  Last 6 Months
                </Badge>
              </CardTitle>
              <CardDescription>
                Document uploads and searches over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                <div className="text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Chart visualization will appear here
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    (Placeholder for actual chart implementation)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
