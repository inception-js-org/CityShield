"use client"

import { useState, useEffect, useRef } from "react"
import { 
  MapPin, 
  Navigation,
  AlertTriangle,
  CheckCircle,
  Circle,
  Play,
  Pause,
  Flag,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Mock route data
const checkpoints = [
  { id: 1, name: "Main Gate", completed: true, time: "06:15" },
  { id: 2, name: "Warehouse A", completed: true, time: "06:32" },
  { id: 3, name: "Loading Bay", completed: false, time: null },
  { id: 4, name: "Parking Area", completed: false, time: null },
  { id: 5, name: "Exit Point", completed: false, time: null },
]

const hotspots = [
  { name: "Behind Warehouse A", risk: "High", description: "Multiple incidents reported" },
  { name: "Dark Alley near Gate 2", risk: "Medium", description: "Poor visibility at night" },
]

const timeAlerts = [
  { time: "06:00 - 08:00", risk: "Medium", message: "Shift change activity" },
  { time: "22:00 - 02:00", risk: "High", message: "Peak incident hours" },
]

export default function PatrolRoute() {
  const [isPatrolling, setIsPatrolling] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  const completedCount = checkpoints.filter(c => c.completed).length

  // Coordinates for Sector 7 - Industrial Area
  const routeCoordinates = [
    { lat: 19.04, lng: 72.82, name: "Main Gate" },           // Checkpoint 1
    { lat: 19.045, lng: 72.825, name: "Warehouse A" },       // Checkpoint 2
    { lat: 19.050, lng: 72.830, name: "Loading Bay" },       // Checkpoint 3
    { lat: 19.055, lng: 72.835, name: "Parking Area" },      // Checkpoint 4
    { lat: 19.060, lng: 72.840, name: "Exit Point" },        // Checkpoint 5
  ]

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
    }

    const timer = setTimeout(() => {
      initializeMap()
    }, 100)

    return () => clearTimeout(timer)
  }, [completedCount])

  return (
    <div className="p-4 space-y-4">
      {/* Header Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Sector 7 Route</p>
              <p className="text-sm text-muted-foreground">
                {completedCount}/{checkpoints.length} checkpoints visited
              </p>
            </div>
            <Button 
              onClick={() => setIsPatrolling(!isPatrolling)}
              className={`gap-2 ${isPatrolling ? "bg-warning hover:bg-warning/90" : ""}`}
            >
              {isPatrolling ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start
                </>
              )}
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 space-y-2">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${(completedCount / checkpoints.length) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Map */}
      <Card>
        <CardContent className="p-0">
          <div 
            ref={mapRef}
            className="relative h-[400px] rounded-lg bg-muted overflow-hidden"
          />
        </CardContent>
      </Card>

      {/* Checkpoints List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Checkpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {checkpoints.map((checkpoint, i) => (
              <div key={checkpoint.id}>
                <div className="flex items-center gap-3 py-3">
                  {checkpoint.completed ? (
                    <CheckCircle className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${checkpoint.completed ? "text-success" : "text-foreground"}`}>
                      {checkpoint.name}
                    </p>
                    {checkpoint.completed && checkpoint.time && (
                      <p className="text-xs text-muted-foreground">Visited at {checkpoint.time}</p>
                    )}
                  </div>
                  {!checkpoint.completed && (
                    <Button size="sm" variant="outline">
                      Mark Visited
                    </Button>
                  )}
                </div>
                {i < checkpoints.length - 1 && (
                  <div className="ml-2.5 h-4 w-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Highlighted Hotspots */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Risk Hotspots on Route
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hotspots.map((spot, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <MapPin className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{spot.name}</p>
                <p className="text-xs text-muted-foreground">{spot.description}</p>
              </div>
              <span className={`ml-auto shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                spot.risk === "High" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning-foreground"
              }`}>
                {spot.risk}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Time-Based Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time-Based Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {timeAlerts.map((alert, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium text-foreground">{alert.time}</p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                alert.risk === "High" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning-foreground"
              }`}>
                {alert.risk}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
