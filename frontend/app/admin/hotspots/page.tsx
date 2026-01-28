"use client"

import { useState } from "react"
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

// Mock data for hotspots
const hotspots = [
  { id: 1, name: "Sector 7 - Industrial Area", risk: 87, crimeCount: 23, trend: "+12%", topCrime: "Theft" },
  { id: 2, name: "Downtown Market", risk: 72, crimeCount: 18, trend: "-5%", topCrime: "Pickpocketing" },
  { id: 3, name: "Railway Station", risk: 68, crimeCount: 15, trend: "+8%", topCrime: "Assault" },
  { id: 4, name: "Sector 15 - Residential", risk: 54, crimeCount: 12, trend: "-2%", topCrime: "Burglary" },
  { id: 5, name: "Highway Exit 4", risk: 45, crimeCount: 8, trend: "+3%", topCrime: "Vehicle Theft" },
]

const crimeTypeTrends = [
  { type: "Theft", count: 45, percentage: 28 },
  { type: "Assault", count: 32, percentage: 20 },
  { type: "Burglary", count: 28, percentage: 17 },
  { type: "Vehicle Theft", count: 24, percentage: 15 },
  { type: "Vandalism", count: 18, percentage: 11 },
  { type: "Other", count: 15, percentage: 9 },
]

const timeBasedRisk = [
  { time: "12 AM - 6 AM", risk: "High", color: "destructive" },
  { time: "6 AM - 12 PM", risk: "Low", color: "success" },
  { time: "12 PM - 6 PM", risk: "Medium", color: "warning" },
  { time: "6 PM - 12 AM", risk: "High", color: "destructive" },
]

export default function HotspotAnalysis() {
  const [activeLayer, setActiveLayer] = useState<"fir" | "heatmap" | "predicted">("heatmap")

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
          <Button className="gap-2">
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
                  FIR Points
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
                  {activeLayer === "heatmap" && (
                    <>
                      <div className="absolute top-1/4 left-1/3 h-32 w-32 rounded-full bg-destructive/30 blur-xl" />
                      <div className="absolute top-1/2 right-1/4 h-24 w-24 rounded-full bg-warning/30 blur-xl" />
                      <div className="absolute bottom-1/3 left-1/2 h-20 w-20 rounded-full bg-warning/20 blur-xl" />
                      <div className="absolute top-2/3 left-1/4 h-16 w-16 rounded-full bg-success/30 blur-xl" />
                    </>
                  )}

                  {/* FIR Points */}
                  {activeLayer === "fir" && (
                    <>
                      <div className="absolute top-[20%] left-[30%] h-4 w-4 rounded-full bg-destructive border-2 border-card shadow-lg" />
                      <div className="absolute top-[35%] left-[45%] h-4 w-4 rounded-full bg-destructive border-2 border-card shadow-lg" />
                      <div className="absolute top-[50%] right-[25%] h-4 w-4 rounded-full bg-warning border-2 border-card shadow-lg" />
                      <div className="absolute bottom-[30%] left-[40%] h-4 w-4 rounded-full bg-warning border-2 border-card shadow-lg" />
                      <div className="absolute top-[60%] left-[25%] h-4 w-4 rounded-full bg-success border-2 border-card shadow-lg" />
                    </>
                  )}

                  {/* Predicted zones */}
                  {activeLayer === "predicted" && (
                    <>
                      <div className="absolute top-[15%] left-[25%] h-24 w-24 rounded-lg border-2 border-dashed border-destructive bg-destructive/10" />
                      <div className="absolute top-[45%] right-[20%] h-20 w-20 rounded-lg border-2 border-dashed border-warning bg-warning/10" />
                      <div className="absolute bottom-[25%] left-[35%] h-16 w-16 rounded-lg border-2 border-dashed border-warning bg-warning/10" />
                    </>
                  )}
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
              {hotspots.map((spot, i) => (
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
              ))}
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
              {crimeTypeTrends.map((crime) => (
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
              ))}
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
                    High risk predicted for Sector 7 tonight (10 PM - 2 AM). Consider increasing patrol coverage.
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
