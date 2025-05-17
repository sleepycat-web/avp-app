"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileSearch, Upload, Menu, X, Home, BarChart3, Settings, HelpCircle, LogOut, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useMobile } from "@/hooks/use-mobile"
import { ThemeToggle } from "@/components/theme-toggle"

export function MainNav() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Add scroll detection for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: <Home className="h-4 w-4 mr-2" />,
    },
    {
      name: "Search Documents",
      href: "/search",
      icon: <FileSearch className="h-4 w-4 mr-2" />,
    },
    {
      name: "Admin Portal",
      href: "/admin/upload",
      icon: <Upload className="h-4 w-4 mr-2" />,
      badge: "Admin",
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: <BarChart3 className="h-4 w-4 mr-2" />,
      badge: "Admin",
    },
  ]

  return (
    <nav
      className={`sticky top-0 z-50 bg-white dark:bg-gray-950 transition-all duration-200 ${scrolled ? "shadow-md dark:shadow-gray-900/40" : "shadow-sm dark:shadow-gray-900/20"}`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="h-7 w-7 text-blue-600" />
            <Link href="/">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                SikkimDoc Finder
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className={`relative transition-all duration-200 ${isActive(item.href) ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700" : "hover:bg-blue-50 dark:hover:bg-gray-800"}`}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    {item.icon}
                    {item.name}
                    {item.badge && (
                      <Badge
                        variant="outline"
                        className="ml-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] px-1 py-0 absolute -top-1 -right-1"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              ))}

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 rounded-full h-9 w-9 hover:bg-blue-50 dark:hover:bg-gray-800"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Admin User</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full h-9 w-9 hover:bg-blue-50"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMobile && mobileMenuOpen && (
          <div className="mt-4 space-y-1 pb-2 animate-in fade-in duration-200">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className={`w-full justify-start transition-all ${isActive(item.href) ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700" : "hover:bg-blue-50 dark:hover:bg-gray-800"}`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.icon}
                  {item.name}
                  {item.badge && (
                    <Badge
                      variant="outline"
                      className="ml-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            ))}
            <div className="pt-2 border-t dark:border-gray-700 mt-2">
              <div className="flex items-center px-2 py-1.5">
                <span className="text-sm mr-2">Theme:</span>
                <ThemeToggle />
              </div>
              <Button variant="ghost" className="w-full justify-start hover:bg-blue-50 dark:hover:bg-gray-800">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button variant="ghost" className="w-full justify-start hover:bg-blue-50 dark:hover:bg-gray-800">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
