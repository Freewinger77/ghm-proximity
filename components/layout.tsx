"use client"

import { useState, useEffect, createContext, useContext } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Layout, BarChart3, Sun, Moon, ChevronLeft, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import type React from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Create a context for the configure page state
const ConfigureContext = createContext<{
  state: any
  setState: React.Dispatch<React.SetStateAction<any>>
}>({
  state: {},
  setState: () => {},
})

export const useConfigureContext = () => useContext(ConfigureContext)

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [configureState, setConfigureState] = useState({})

  useEffect(() => {
    // Load the configure state from localStorage on initial render
    const savedState = localStorage.getItem("configureState")
    if (savedState) {
      setConfigureState(JSON.parse(savedState))
    }
  }, [])

  useEffect(() => {
    // Save the configure state to localStorage whenever it changes
    localStorage.setItem("configureState", JSON.stringify(configureState))
  }, [configureState])

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("isAuthenticated")
  }

  const NavLink = ({
    href,
    icon: Icon,
    children,
  }: { href: string; icon: React.ElementType; children: React.ReactNode }) => (
    <Link
      href={href}
      className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${
        pathname === href
          ? "bg-white shadow-soft text-primary"
          : "text-sidebar-muted hover:bg-white/50 hover:text-sidebar-foreground"
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {children}
    </Link>
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-sidebar-foreground mb-8">Proximity Platform</h1>
        <div className="space-y-6">
          <div>
            <h2 className="px-4 text-xs font-semibold text-sidebar-muted uppercase tracking-wider mb-2">Design</h2>
            <ul className="space-y-2">
              <li>
                <NavLink href="/configure" icon={Layout}>
                  Configure
                </NavLink>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="px-4 text-xs font-semibold text-sidebar-muted uppercase tracking-wider mb-2">Analytics</h2>
            <ul className="space-y-2">
              <li>
                <NavLink href="/reports" icon={BarChart3}>
                  Reports
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ConfigureContext.Provider value={{ state: configureState, setState: setConfigureState }}>
      <div className="flex h-screen bg-background">
        {/* Sidebar for larger screens */}
        <nav className="hidden md:block w-64 bg-sidebar-background border-r border-gray-200">
          <SidebarContent />
        </nav>

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-background border-b border-gray-200">
            <div className="px-4 py-4 flex justify-between items-center">
              <div className="flex items-center">
                {/* Menu button for mobile */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden mr-2">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    <SidebarContent />
                  </SheetContent>
                </Sheet>

                {pathname !== "/reports" && pathname !== "/configure" && (
                  <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.back()}>
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Back
                  </Button>
                )}
                <h2 className="text-xl font-semibold text-foreground">
                  {pathname.startsWith("/campaign-report/")
                    ? decodeURIComponent(pathname.split("/").pop() || "")
                    : pathname === "/configure"
                      ? "Configure"
                      : "Reports"}
                </h2>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="text-sidebar-muted hover:text-sidebar-foreground"
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-sidebar-muted hover:text-sidebar-foreground"
                >
                  Logout
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </ConfigureContext.Provider>
  )
}

