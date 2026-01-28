"use client"

import { useState, useEffect, useRef } from "react"
import { 
  MapPin, 
  Navigation,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Flag,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronLeft,
  Search,
  Users,
  ShieldCheck,
  Zap,
  X,
  Phone,
  Calendar,
  Circle
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Mock route data
const checkpoints = [
  { id: 1, name: "Main Gate", completed: true, time: "06:15", officer: "Off. Kumar", image: "/images/analyst.png" },
  { id: 2, name: "Warehouse A", completed: true, time: "06:32", officer: "Off. Kumar", image: "/images/analyst.png" },
  { id: 3, name: "Loading Bay", completed: false, time: null, officer: "Off. Singh", image: "/images/analyst.png" },
  { id: 4, name: "Parking Area", completed: false, time: null, officer: "Off. Patel", image: "/images/analyst.png" },
  { id: 5, name: "Exit Point", completed: false, time: null, officer: "Off. Sharma", image: "/images/analyst.png" },
]

const hotspots = [
  { id: "HS001", name: "Behind Warehouse A", risk: "High", description: "Multiple incidents reported", officer: "Off. Kumar", phone: "+91 9876543210", date: "28 Jan 2026", status: "Active" },
  { id: "HS002", name: "Dark Alley Gate 2", risk: "Medium", description: "Poor visibility at night", officer: "Off. Singh", phone: "+91 9876543211", date: "27 Jan 2026", status: "Monitoring" },
]

const timeAlerts = [
  { time: "06:00 - 08:00", risk: "Medium", message: "Shift change activity" },
  { time: "22:00 - 02:00", risk: "High", message: "Peak incident hours" },
]

// Schedule data for Gantt chart
const scheduleData = [
  { id: 1, checkpoint: "Main Gate", officer: "Off. Kumar", assignments: [{ start: 0, end: 2, color: "bg-emerald-500" }] },
  { id: 2, checkpoint: "Warehouse A", officer: "Off. Singh", assignments: [{ start: 1, end: 3, color: "bg-amber-500" }, { start: 4, end: 6, color: "bg-blue-500" }] },
  { id: 3, checkpoint: "Loading Bay", officer: "Off. Patel", assignments: [{ start: 2, end: 5, color: "bg-purple-500" }] },
  { id: 4, checkpoint: "Parking Area", officer: "Off. Sharma", assignments: [{ start: 5, end: 7, color: "bg-rose-500" }] },
]

const stats = [
  { label: "Checkpoints", value: "5", change: "+2", trend: "up", icon: Flag },
  { label: "Officers", value: "4", change: "+1", trend: "up", icon: Users },
  { label: "Incidents", value: "3", change: "-40%", trend: "down", icon: AlertTriangle },
  { label: "Coverage", value: "87%", change: "+12%", trend: "up", icon: ShieldCheck },
]

export default function PatrolRoute() {
  const [isPatrolling, setIsPatrolling] = useState(false)
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<typeof checkpoints[0] | null>(checkpoints[0])
  const [scheduleView, setScheduleView] = useState<"day" | "week" | "month">("week")
  const [alertTab, setAlertTab] = useState<"active" | "upcoming">("active")
  const [currentWeek, setCurrentWeek] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [checkpointPositions, setCheckpointPositions] = useState<Array<{ x: number; y: number }>>([])
  const [routePath, setRoutePath] = useState<string>("")
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  const completedCount = checkpoints.filter(c => c.completed).length
  const timeSlots = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"]

  // Coordinates for Sector 7 - Industrial Area
  const routeCoordinates = [
    { lat: 19.04, lng: 72.82, name: "Main Gate" },
    { lat: 19.045, lng: 72.825, name: "Warehouse A" },
    { lat: 19.050, lng: 72.830, name: "Loading Bay" },
    { lat: 19.055, lng: 72.835, name: "Parking Area" },
    { lat: 19.060, lng: 72.840, name: "Exit Point" },
  ]

  // Helper function to convert lat/lng to pixel coordinates on map
  const getPixelPosition = (lat: number, lng: number, map: google.maps.Map): { x: number; y: number } | null => {
    const projection = map.getProjection()
    if (!projection) return null

    const bounds = map.getBounds()
    if (!bounds) return null

    const point = projection.fromLatLngToPoint(new google.maps.LatLng(lat, lng))
    const swPoint = projection.fromLatLngToPoint(bounds.getSouthWest())
    const nePoint = projection.fromLatLngToPoint(bounds.getNorthEast())

    const worldWidth = Math.pow(2, map.getZoom() + 8)
    const mapWidth = 800 // actual map width in pixels (from h-[350px] and proportional width)
    const mapHeight = 350

    const x = Math.round(((point.x - swPoint.x) / (nePoint.x - swPoint.x)) * mapWidth)
    const y = Math.round(((point.y - nePoint.y) / (swPoint.y - nePoint.y)) * mapHeight)

    return { x, y }
  }

  // Initialize map with route
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || !window.google) return

      const routeCenter = { lat: 19.0475, lng: 72.8325 }

      const map = new google.maps.Map(mapRef.current, {
        center: routeCenter,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
      })

      mapInstanceRef.current = map

      // Draw polyline for the route
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
      }

      const polyline = new google.maps.Polyline({
        path: routeCoordinates.map(c => ({ lat: c.lat, lng: c.lng })),
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map,
      })
      polylineRef.current = polyline

      // Calculate pixel positions for checkpoints
      const positions: Array<{ x: number; y: number }> = []
      routeCoordinates.forEach((checkpoint) => {
        const pos = getPixelPosition(checkpoint.lat, checkpoint.lng, map)
        if (pos) {
          positions.push(pos)
        }
      })
      setCheckpointPositions(positions)

      // Generate SVG path from coordinates
      if (positions.length > 0) {
        const pathData = positions
          .map((pos, idx) => {
            if (idx === 0) return `M ${pos.x} ${pos.y}`
            return `L ${pos.x} ${pos.y}`
          })
          .join(" ")
        setRoutePath(pathData)
      }

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []

      // Add markers for each checkpoint
      routeCoordinates.forEach((checkpoint, index) => {
        const isCompleted = index < completedCount
        const isCurrent = index === completedCount && index < routeCoordinates.length

        const marker = new google.maps.Marker({
          position: { lat: checkpoint.lat, lng: checkpoint.lng },
          map: map,
          title: checkpoint.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: isCompleted ? "#10b981" : isCurrent ? "#f59e0b" : "#e5e7eb",
            fillOpacity: 1,
            strokeColor: isCompleted ? "#059669" : isCurrent ? "#d97706" : "#9ca3af",
            strokeWeight: 2,
          },
        })

        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding:8px;"><strong>${checkpoint.name}</strong><br/>${isCompleted ? "✓ Visited" : isCurrent ? "Current" : "Pending"}</div>`,
        })

        marker.addListener("click", () => {
          infoWindow.open(map, marker)
        })

        markersRef.current.push(marker)
      })

      // Add markers for hotspots
      const hotspotLocations = [
        { lat: 19.047, lng: 72.828, name: "Behind Warehouse A" },
        { lat: 19.053, lng: 72.837, name: "Dark Alley near Gate 2" },
      ]

      hotspotLocations.forEach(hotspot => {
        const hotspotMarker = new google.maps.Marker({
          position: { lat: hotspot.lat, lng: hotspot.lng },
          map: map,
          title: hotspot.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#ef4444",
            fillOpacity: 0.6,
            strokeColor: "#dc2626",
            strokeWeight: 2,
          },
        })

        const hotspotInfo = new google.maps.InfoWindow({
          content: `<div style="padding:8px;"><strong>${hotspot.name}</strong><br/><span style="color:#ef4444;">⚠ Risk Hotspot</span></div>`,
        })

        hotspotMarker.addListener("click", () => {
          hotspotInfo.open(map, hotspotMarker)
        })

        markersRef.current.push(hotspotMarker)
      })

      // Recalculate on zoom/pan changes
      const updatePositions = () => {
        const newPositions: Array<{ x: number; y: number }> = []
        routeCoordinates.forEach((checkpoint) => {
          const pos = getPixelPosition(checkpoint.lat, checkpoint.lng, map)
          if (pos) {
            newPositions.push(pos)
          }
        })
        setCheckpointPositions(newPositions)

        if (newPositions.length > 0) {
          const pathData = newPositions
            .map((pos, idx) => {
              if (idx === 0) return `M ${pos.x} ${pos.y}`
              return `L ${pos.x} ${pos.y}`
            })
            .join(" ")
          setRoutePath(pathData)
        }
      }

      map.addListener("zoom_changed", updatePositions)
      map.addListener("bounds_changed", updatePositions)
    }

    const timer = setTimeout(() => {
      initializeMap()
    }, 100)

    return () => clearTimeout(timer)
  }, [completedCount])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Top Section: Map + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Tracking - Takes 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header with search */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Route Tracking</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search checkpoint, officer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Map Area */}
          <div className="relative h-[430px] rounded-xl bg-card border border-border overflow-hidden">
            <div 
              ref={mapRef}
              className="relative w-full h-full bg-muted"
            />

            {/* Route Overlay - Visual Routing Display */}
            {routePath && (
              <svg className="absolute inset-0" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
                <path
                  d={routePath}
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </svg>
            )}

            {/* Checkpoint markers overlay */}
            {checkpoints.map((checkpoint, i) => {
              const pos = checkpointPositions[i]
              if (!pos) return null
              
              return (
                <button
                  key={checkpoint.id}
                  onClick={() => setSelectedCheckpoint(checkpoint)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                    selectedCheckpoint?.id === checkpoint.id ? "z-20 scale-110" : "z-10 hover:scale-105"
                  }`}
                  style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 shadow-lg ${
                      checkpoint.completed
                        ? "bg-emerald-500/20 border-emerald-400"
                        : "bg-card border-border"
                    } ${selectedCheckpoint?.id === checkpoint.id ? "ring-2 ring-primary/30" : ""}`}>
                      {checkpoint.completed ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">{checkpoint.id}</span>
                      )}
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-card/90 border border-border text-xs font-medium text-foreground">
                      {checkpoint.name.split(' ')[0]}
                    </div>
                  </div>
                </button>
              )
            })}

            {/* Selected Checkpoint Popup */}
            {selectedCheckpoint && (
              <div 
                className="absolute z-30 w-64 bg-card rounded-xl border border-border shadow-2xl overflow-hidden"
                style={{ 
                  top: "15%",
                  left: "35%",
                }}
              >
                {/* Image header */}
                <div className="relative h-24 bg-muted">
                  <img 
                    src={selectedCheckpoint.image || "/placeholder.svg"} 
                    alt={selectedCheckpoint.name}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium ${
                    selectedCheckpoint.completed ? "bg-emerald-500 text-white" : "bg-muted-foreground text-white"
                  }`}>
                    {selectedCheckpoint.completed ? "Visited" : "Pending"}
                  </div>
                  <button 
                    onClick={() => setSelectedCheckpoint(null)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-card/80 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                
                {/* Content */}
                <div className="p-3 space-y-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{selectedCheckpoint.name}</h3>
                    <p className="text-xs text-muted-foreground">Checkpoint #{selectedCheckpoint.id}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{selectedCheckpoint.officer}</span>
                    </div>
                    {selectedCheckpoint.time && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{selectedCheckpoint.time}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Time left: <span className="text-foreground font-medium">120 hr - 52 min - 12 sec</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button className="p-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors">
                <Navigation className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="absolute bottom-4 right-4 flex flex-col gap-1">
              <button className="p-2 bg-card border border-border rounded-t-lg hover:bg-secondary transition-colors text-lg font-medium text-muted-foreground">+</button>
              <button className="p-2 bg-card border border-border rounded-b-lg hover:bg-secondary transition-colors text-lg font-medium text-muted-foreground">-</button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/95 border border-border">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                <span className="text-muted-foreground">Visited</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/95 border border-border">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-muted-foreground">Hotspot</span>
              </div>
            </div>

            {/* Patrol Control */}
            <div className="absolute top-4 left-4">
              <Button 
                onClick={() => setIsPatrolling(!isPatrolling)}
                size="sm"
                className={`gap-2 shadow-lg ${isPatrolling ? "bg-amber-500 hover:bg-amber-600" : ""}`}
              >
                {isPatrolling ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause Patrol
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Patrol
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Panel - Takes 1 column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Statistics</h2>
            <select className="text-xs bg-card border border-border rounded-lg px-1.5 py-0.5 text-muted-foreground focus:outline-none">
              <option>Past 7 days</option>
              <option>Past 30 days</option>
              <option>This month</option>
            </select>
          </div>

          {/* Stat Cards */}
          <div className="space-y-2">
            {stats.map((stat, i) => (
              <div key={i} className="p-2.5 bg-card border border-border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <div className={`flex items-center gap-0.5 mt-0.5 text-xs ${
                      stat.trend === "up" ? "text-emerald-500" : "text-destructive"
                    }`}>
                      {stat.trend === "up" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{stat.change}</span>
                      <span className="text-muted-foreground text-xs">vs last mo.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="p-1.5 bg-secondary rounded-lg">
                      <stat.icon className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <button className="mt-1.5 text-xs text-primary hover:underline flex items-center gap-0.5">
                  See Detail <ChevronRight className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Schedule + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Section - Takes 2 columns */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Schedule</h2>
            <div className="flex items-center gap-2">
              <div className="flex bg-secondary rounded-lg p-0.5">
                {(["day", "week", "month"] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setScheduleView(view)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      scheduleView === view
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                className="p-1 rounded hover:bg-secondary text-muted-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-8 text-sm">
                <span className={`font-medium ${currentWeek === 1 ? "text-foreground" : "text-muted-foreground"}`}>Week 1</span>
                <span className={`font-medium ${currentWeek === 2 ? "text-foreground" : "text-muted-foreground"}`}>Week 2</span>
              </div>
              <button 
                onClick={() => setCurrentWeek(Math.min(2, currentWeek + 1))}
                className="p-1 rounded hover:bg-secondary text-muted-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 w-32 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Gantt Chart */}
          <div className="overflow-x-auto">
            {/* Time headers */}
            <div className="flex items-center mb-2 pl-40">
              {timeSlots.map((time, i) => (
                <div key={i} className="flex-1 text-xs text-muted-foreground">
                  {time}
                </div>
              ))}
            </div>

            {/* Schedule rows */}
            <div className="space-y-2">
              {scheduleData.map((row) => (
                <div key={row.id} className="flex items-center gap-4">
                  {/* Checkpoint info */}
                  <div className="w-36 flex-shrink-0">
                    <p className="text-sm font-medium text-foreground truncate">{row.checkpoint}</p>
                    <p className="text-xs text-muted-foreground">{row.officer}</p>
                  </div>
                  
                  {/* Timeline */}
                  <div className="flex-1 relative h-10 bg-muted/30 rounded-lg">
                    {row.assignments.map((assignment, i) => (
                      <div
                        key={i}
                        className={`absolute top-1 bottom-1 ${assignment.color} rounded-md flex items-center px-2`}
                        style={{
                          left: `${(assignment.start / 7) * 100}%`,
                          width: `${((assignment.end - assignment.start) / 7) * 100}%`,
                        }}
                      >
                        <span className="text-xs text-white font-medium truncate">
                          {row.officer}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts/Orders Section */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Alerts</h2>
            <button className="text-xs text-primary hover:underline">View All</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAlertTab("active")}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                alertTab === "active"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setAlertTab("upcoming")}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                alertTab === "upcoming"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Time Alerts
            </button>
          </div>

          {/* Alert Cards */}
          <div className="space-y-3">
            {alertTab === "active" ? (
              hotspots.map((spot) => (
                <div key={spot.id} className="p-3 bg-background border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-lg font-bold text-foreground">{spot.id}</p>
                      <p className="text-sm text-muted-foreground">{spot.name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      spot.status === "Active" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
                    }`}>
                      {spot.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span>{spot.officer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{spot.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{spot.date}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              timeAlerts.map((alert, i) => (
                <div key={i} className="p-3 bg-background border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-foreground">{alert.time}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      alert.risk === "High" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
                    }`}>
                      {alert.risk}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    {alert.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
