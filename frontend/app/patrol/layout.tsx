"use client"

import React, { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Shield, 
  LayoutDashboard, 
  Navigation,
  FileText, 
  Video, 
  AlertTriangle, 
  History,
  LogOut,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import Dock, { type DockItemData } from "@/components/dock"

const navItems = [
  { href: "/patrol", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patrol/route", label: "Route", icon: Navigation },
  { href: "/patrol/fir", label: "FIR", icon: FileText },
  { href: "/patrol/bodycam", label: "Bodycam", icon: Video },
  { href: "/patrol/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/patrol/history", label: "History", icon: History },
]

export default function PatrolLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isDockVisible, setIsDockVisible] = useState(true)
  const [shouldHideDockByDefault, setShouldHideDockByDefault] = useState(false)

  useEffect(() => {
    // Check if screen is small, hide dock by default on mobile
    const checkScreenSize = () => {
      setShouldHideDockByDefault(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setIsDockVisible(false)
      }
    }
    
    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  const isActive = (href: string) => {
    if (href === "/patrol") return pathname === "/patrol"
    return pathname.startsWith(href)
  }

  const dockItems: DockItemData[] = navItems.map((item) => ({
    icon: <item.icon className="h-5 w-5" />,
    label: item.label,
    onClick: () => router.push(item.href),
    isActive: isActive(item.href),
  }))

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="flex h-full items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold text-foreground tracking-tight">CityShield</span>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Patrol Unit</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md">
                PL
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-foreground">Patrol Leader</p>
                <p className="text-xs text-muted-foreground">Unit Alpha-7</p>
              </div>
            </div>
            <Link
              href="/login"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`pt-16 pb-28 transition-all duration-300 ${isDockVisible ? "ml-24" : "ml-0"}`}>
        <div className="min-h-[calc(100vh-10rem)]">
          {children}
        </div>
      </main>

      {/* Dock Toggle Button - shown when dock is hidden */}
      {!isDockVisible && (
        <button
          onClick={() => setIsDockVisible(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center h-12 w-6 bg-card/90 backdrop-blur-xl border border-l-0 border-border rounded-r-lg shadow-lg hover:bg-card transition-all duration-200 group"
          aria-label="Show navigation dock"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      )}

      {/* Dock Navigation with collapse button */}
      <div className={`fixed top-1/2 left-0 -translate-y-1/2 z-50 flex justify-center transition-all duration-300 ${isDockVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full pointer-events-none"}`}>
        {/* Collapse button - positioned at right side of dock */}
        {isDockVisible && (
          <button
            onClick={() => setIsDockVisible(false)}
            className="absolute -right-14 flex items-center justify-center h-10 w-10 bg-card/90 backdrop-blur-xl border border-border rounded-full shadow-lg hover:bg-card transition-all duration-200 group"
            aria-label="Hide navigation dock"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        )}
        <Dock 
          items={dockItems}
          baseItemSize={44}
          magnification={64}
          distance={120}
          panelHeight={68}
        />
      </div>
    </div>
  )
}
