"use client"

import React, { useEffect, useRef } from "react"

import { 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Car, 
  FileText, 
  TrendingUp,
  MapPin,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Mock data
const stats = {
  activeHotspots: 12,
  mediumRiskZones: 24,
  safeZones: 89,
  patrolsActive: 18,
  firsToday: 34,
  firsWeek: 187,
}

const recentAlerts = [
  { id: 1, type: "hotspot", message: "New high-risk zone detected in Sector 7", time: "5 min ago", severity: "high" },
  { id: 2, type: "patrol", message: "Unit P-12 requesting backup at Main Street", time: "12 min ago", severity: "medium" },
  { id: 3, type: "fir", message: "New FIR filed - Vehicle theft", time: "28 min ago", severity: "low" },
  { id: 4, type: "complaint", message: "Noise complaint escalated - Downtown area", time: "45 min ago", severity: "low" },
]

const topRiskyZones = [
  { name: "Sector 7 - Industrial Area", risk: 87, trend: "up" },
  { name: "Downtown Market", risk: 72, trend: "down" },
  { name: "Railway Station", risk: 68, trend: "up" },
  { name: "Sector 15 - Residential", risk: 54, trend: "stable" },
]

export default function AdminDashboard() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)

  // Initialize map with heatmap data
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || !window.google) return

      const CITY_CENTER = { lat: 19.08, lng: 72.88 } // Mumbai coordinates
      
      const map = new google.maps.Map(mapRef.current, {
        center: CITY_CENTER,
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      })

      mapInstanceRef.current = map

      // Sample heatmap data points based on the risky zones
      const heatmapData = [
        // Sector 7 - Industrial Area (High Risk - 87)
        { lat: 19.04, lng: 72.82, weight: 0.87 },
        { lat: 19.045, lng: 72.825, weight: 0.87 },
        { lat: 19.035, lng: 72.815, weight: 0.85 },
        
        // Downtown Market (Risk - 72)
        { lat: 19.09, lng: 72.89, weight: 0.72 },
        { lat: 19.095, lng: 72.895, weight: 0.70 },
        
        // Railway Station (Risk - 68)
        { lat: 19.075, lng: 72.880, weight: 0.68 },
        { lat: 19.08, lng: 72.875, weight: 0.68 },
        
        // Sector 15 - Residential (Risk - 54)
        { lat: 19.12, lng: 72.92, weight: 0.54 },
        { lat: 19.125, lng: 72.925, weight: 0.52 },
        
        // Additional scattered data points
        { lat: 19.055, lng: 72.835, weight: 0.60 },
        { lat: 19.100, lng: 72.870, weight: 0.55 },
        { lat: 19.065, lng: 72.905, weight: 0.48 },
      ]

      // Create heatmap layer
      const heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData.map(point => ({
          location: new google.maps.LatLng(point.lat, point.lng),
          weight: point.weight
        })),
        map: map,
        radius: 35,
        maxIntensity: 1,
      })

      return () => {
        heatmap.setMap(null)
      }
    }

    const timer = setTimeout(() => {
      initializeMap()
    }, 100)

    return () => clearTimeout(timer)
  }, [])
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
          <p className="text-muted-foreground">City overview at a glance</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Last updated: Just now
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Active Hotspots"
          value={stats.activeHotspots}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="danger"
        />
        <StatCard
          label="Medium Risk"
          value={stats.mediumRiskZones}
          icon={<ShieldAlert className="h-4 w-4" />}
          variant="warning"
        />
        <StatCard
          label="Safe Zones"
          value={stats.safeZones}
          icon={<ShieldCheck className="h-4 w-4" />}
          variant="success"
        />
        <StatCard
          label="Patrols Active"
          value={stats.patrolsActive}
          icon={<Car className="h-4 w-4" />}
          variant="primary"
        />
        <StatCard
          label="FIRs Today"
          value={stats.firsToday}
          icon={<FileText className="h-4 w-4" />}
          variant="default"
        />
        <StatCard
          label="FIRs This Week"
          value={stats.firsWeek}
          icon={<TrendingUp className="h-4 w-4" />}
          variant="default"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">City Heatmap</CardTitle>
            <Link href="/admin/hotspots">
              <Button variant="ghost" size="sm" className="text-primary">
                View Full Map
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef}
              className="relative h-[300px] rounded-lg bg-muted overflow-hidden"
            />
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Alerts</CardTitle>
            <Link href="/admin/complaints">
              <Button variant="ghost" size="sm" className="text-primary">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex gap-3 rounded-lg border border-border p-3">
                <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                  alert.severity === "high" ? "bg-destructive" :
                  alert.severity === "medium" ? "bg-warning" : "bg-muted-foreground"
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground leading-tight">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Risky Zones */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Top Risky Zones</CardTitle>
            <Link href="/admin/hotspots">
              <Button variant="ghost" size="sm" className="text-primary">
                Analyze
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRiskyZones.map((zone, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{zone.name}</p>
                    <div className="mt-1 h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          zone.risk >= 70 ? "bg-destructive" :
                          zone.risk >= 50 ? "bg-warning" : "bg-success"
                        }`}
                        style={{ width: `${zone.risk}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className={`font-medium ${
                      zone.risk >= 70 ? "text-destructive" :
                      zone.risk >= 50 ? "text-warning" : "text-success"
                    }`}>
                      {zone.risk}%
                    </span>
                    {zone.trend === "up" && <ArrowUpRight className="h-3 w-3 text-destructive" />}
                    {zone.trend === "down" && <ArrowDownRight className="h-3 w-3 text-success" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link href="/admin/fir">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 bg-transparent">
                <FileText className="h-5 w-5" />
                <span className="text-xs">FIR Management</span>
              </Button>
            </Link>
            <Link href="/admin/hotspots">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 bg-transparent">
                <MapPin className="h-5 w-5" />
                <span className="text-xs">Hotspot Analysis</span>
              </Button>
            </Link>
            <Link href="/admin/patrols">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 bg-transparent">
                <Car className="h-5 w-5" />
                <span className="text-xs">Patrol Management</span>
              </Button>
            </Link>
            <Link href="/admin/officers">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 bg-transparent">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xs">Officers</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  icon, 
  variant 
}: { 
  label: string
  value: number
  icon: React.ReactNode
  variant: "danger" | "warning" | "success" | "primary" | "default"
}) {
  const colors = {
    danger: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning-foreground",
    success: "bg-success/10 text-success",
    primary: "bg-primary/10 text-primary",
    default: "bg-muted text-muted-foreground",
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${colors[variant]}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-foreground leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
