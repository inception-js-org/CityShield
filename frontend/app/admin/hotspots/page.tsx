"use client"

import { useState, useEffect } from "react"
import { 
  Layers, 
  MapPin, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Sun,
  Moon,
  Download,
  RefreshCw,
  ChevronRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { zonesAPI, firsAPI, complaintsAPI } from "@/lib/api"
import type { Zone, FIR, Complaint } from "@/app/api/index"

export default function HotspotAnalysis() {
  const [activeLayer, setActiveLayer] = useState<"fir" | "heatmap" | "predicted">("heatmap")
  const [loading, setLoading] = useState(true)
  const [zones, setZones] = useState<Zone[]>([])
  const [firs, setFirs] = useState<FIR[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [zonesData, firsData, complaintsData] = await Promise.all([
        zonesAPI.getAll(),
        firsAPI.getRecent(50),
        complaintsAPI.getAll()
      ])
      setZones(Array.isArray(zonesData) ? zonesData : [])
      setFirs(Array.isArray(firsData) ? firsData : [])
      setComplaints(Array.isArray(complaintsData) ? complaintsData : [])
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate hotspots from zones data
  const hotspots = zones
    .map(zone => {
      const zoneFirs = firs.filter(f => f.zoneId === zone.id)
      const zoneComplaints = complaints.filter(c => c.zoneId === zone.id)
      const incidentCount = zoneFirs.length + zoneComplaints.length
      
      // Get most common crime type
      const crimeTypes: Record<string, number> = {}
      zoneFirs.forEach(f => {
        crimeTypes[f.incidentType] = (crimeTypes[f.incidentType] || 0) + 1
      })
      const topCrime = Object.entries(crimeTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"

      return {
        id: zone.id,
        name: zone.name,
        risk: Math.round(zone.riskBase * 100),
        crimeCount: incidentCount,
        trend: zone.riskScore && zone.riskScore > zone.riskBase ? `+${Math.round((zone.riskScore - zone.riskBase) * 100)}%` : "-5%",
        topCrime,
        coords: zone.coords
      }
    })
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 5)

  // Calculate crime type distribution
  const crimeTypeTrends = (() => {
    const typeCounts: Record<string, number> = {}
    firs.forEach(f => {
      typeCounts[f.incidentType] = (typeCounts[f.incidentType] || 0) + 1
    })
    const total = firs.length || 1
    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  })()

  // Time-based risk analysis
  const timeBasedRisk = [
    { time: "12 AM - 6 AM", risk: "High", color: "destructive" },
    { time: "6 AM - 12 PM", risk: "Low", color: "success" },
    { time: "12 PM - 6 PM", risk: "Medium", color: "warning" },
    { time: "6 PM - 12 AM", risk: "High", color: "destructive" },
  ]

  // Find highest risk zone for AI prediction
  const highestRiskZone = zones.reduce((max, zone) => 
    zone.riskBase > (max?.riskBase || 0) ? zone : max, zones[0])

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hotspot & Risk Analysis</h1>
          <p className="text-muted-foreground">AI-powered crime intelligence and predictions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Layer Controls */}
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeLayer === "fir" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLayer("fir")}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  FIR Points ({firs.length})
                </Button>
                <Button
                  variant={activeLayer === "heatmap" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLayer("heatmap")}
                  className="gap-2"
                >
                  <Layers className="h-4 w-4" />
                  Heatmap
                </Button>
                <Button
                  variant={activeLayer === "predicted" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLayer("predicted")}
                  className="gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Predicted Risk
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardContent className="p-0">
              <div className="relative h-[400px] lg:h-[500px] rounded-lg bg-muted overflow-hidden">
                {/* Simulated map visualization */}
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/80">
                  {/* Grid overlay */}
                  <div className="absolute inset-0 opacity-20">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                  
                  {/* Heatmap zones */}
                  {activeLayer === "heatmap" && zones.slice(0, 4).map((zone, i) => (
                    <div 
                      key={zone.id}
                      className={`absolute rounded-full blur-xl ${
                        zone.riskBase >= 0.6 ? "bg-destructive/30" :
                        zone.riskBase >= 0.4 ? "bg-warning/30" :
                        "bg-success/30"
                      }`}
                      style={{
                        top: `${20 + i * 20}%`,
                        left: `${25 + i * 15}%`,
                        width: `${80 + zone.riskBase * 50}px`,
                        height: `${80 + zone.riskBase * 50}px`,
                      }}
                    />
                  ))}

                  {/* FIR Points */}
                  {activeLayer === "fir" && firs.slice(0, 10).map((fir, i) => (
                    <div 
                      key={fir.id}
                      className={`absolute h-4 w-4 rounded-full border-2 border-card shadow-lg ${
                        fir.status === "FILED" ? "bg-destructive" :
                        fir.status === "UNDER_INVESTIGATION" ? "bg-warning" :
                        "bg-success"
                      }`}
                      style={{
                        top: `${15 + (i * 8)}%`,
                        left: `${20 + (i * 7)}%`,
                      }}
                    />
                  ))}

                  {/* Predicted zones */}
                  {activeLayer === "predicted" && zones.filter(z => z.riskBase >= 0.5).slice(0, 3).map((zone, i) => (
                    <div 
                      key={zone.id}
                      className={`absolute rounded-lg border-2 border-dashed ${
                        zone.riskBase >= 0.6 ? "border-destructive bg-destructive/10" : "border-warning bg-warning/10"
                      }`}
                      style={{
                        top: `${15 + i * 25}%`,
                        left: `${20 + i * 20}%`,
                        width: `${60 + zone.riskBase * 40}px`,
                        height: `${60 + zone.riskBase * 40}px`,
                      }}
                    />
                  ))}
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 rounded-lg bg-card/95 backdrop-blur border border-border p-3">
                  <p className="text-xs font-medium text-foreground mb-2">Risk Level</p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-success" />
                      <span className="text-muted-foreground">Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-warning" />
                      <span className="text-muted-foreground">Medium</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-destructive" />
                      <span className="text-muted-foreground">High</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panels */}
        <div className="space-y-4">
          {/* Top Risky Zones */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Top Risky Zones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hotspots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No zone data available
                </p>
              ) : (
                hotspots.map((spot, i) => (
                  <button
                    key={spot.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                      i === 0 ? "bg-destructive/10 text-destructive" :
                      i < 3 ? "bg-warning/10 text-warning-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{spot.name}</p>
                      <p className="text-xs text-muted-foreground">{spot.crimeCount} incidents - {spot.topCrime}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        spot.risk >= 70 ? "text-destructive" :
                        spot.risk >= 50 ? "text-warning-foreground" :
                        "text-success"
                      }`}>
                        {spot.risk}%
                      </p>
                      <p className={`text-xs ${spot.trend.startsWith("+") ? "text-destructive" : "text-success"}`}>
                        {spot.trend}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Crime Type Trends */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Crime Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {crimeTypeTrends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No FIR data available
                </p>
              ) : (
                crimeTypeTrends.map((crime) => (
                  <div key={crime.type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{crime.type}</span>
                      <span className="text-muted-foreground">{crime.count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${crime.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Time-Based Risk */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Time-Based Risk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {timeBasedRisk.map((slot) => (
                <div key={slot.time} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    {slot.time.includes("AM") && slot.time.includes("12 AM") || slot.time.includes("6 PM") ? (
                      <Moon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Sun className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm text-foreground">{slot.time}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    slot.color === "destructive" ? "bg-destructive/10 text-destructive" :
                    slot.color === "warning" ? "bg-warning/10 text-warning-foreground" :
                    "bg-success/10 text-success"
                  }`}>
                    {slot.risk}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Prediction */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">AI Prediction</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {highestRiskZone 
                      ? `High risk predicted for ${highestRiskZone.name} tonight (10 PM - 2 AM). Consider increasing patrol coverage.`
                      : "No predictions available yet. Add more zone data."}
                  </p>
                  <Button size="sm" className="mt-3 gap-1">
                    Generate Patrol Plan
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
