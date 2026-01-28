"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Shield, 
  LayoutDashboard, 
  FileText, 
  MapPin, 
  Users, 
  Radio, 
  Bell, 
  Settings, 
  LogOut,
  Car
} from "lucide-react"
import Dock, { type DockItemData } from "@/components/dock"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/fir", label: "FIR", icon: FileText },
  { href: "/admin/hotspots", label: "Hotspots", icon: MapPin },
  { href: "/admin/patrols", label: "Patrols", icon: Car },
  { href: "/admin/officers", label: "Officers", icon: Users },
  { href: "/admin/monitoring", label: "Monitoring", icon: Radio },
  { href: "/admin/complaints", label: "Complaints", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isDockVisible, setIsDockVisible] = React.useState(false)

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
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
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Admin Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md">
                AD
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-foreground">Admin User</p>
                <p className="text-xs text-muted-foreground">Command Center</p>
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

      {/* Dock Navigation */}
      <Dock 
        items={dockItems}
        baseItemSize={44}
        magnification={64}
        distance={120}
        panelHeight={68}
        collapsible={true}
        onCollapsedChange={(isCollapsed) => setIsDockVisible(!isCollapsed)}
      />
    </div>
  )
}
