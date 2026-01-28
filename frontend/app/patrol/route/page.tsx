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
  Clock,
  Brain,
  Shield,
  TrendingUp,
  Eye,
  RefreshCw,
  Sparkles,
  Target,
  Zap,
  ChevronRight,
  BarChart3
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { patrolsAPI, predictionsAPI, zonesAPI } from "@/lib/api"
import type { Patrol, Zone } from "@/app/api/index"

interface Checkpoint {
  id: number
  name: string
  lat: number
  lng: number
  zone: string
  completed?: boolean
  time?: string
}

interface ZoneTimeline {
  zone_id: string
  zone_name: string
  date: string
  is_holiday: boolean
  holiday_name: string | null
  weather: string
  timeline: Array<{
    hour: number
    time: string
    predicted_category: string
    confidence: number
    risk_level: string
    combined_risk: number
  }>
}

interface RouteData {
  ai_generated: boolean
  prediction_date: string
  time_slot: string
  assigned_zones: Array<{
    zone_id: string
    zone_name: string
    risk_level: string
    predicted_crime: string
    confidence: number
    center: [number, number]
  }>
  predicted_crimes: string[]
  risk_score: number
  route_coords: number[][]
}

export default function PatrolRoute() {
  const [isPatrolling, setIsPatrolling] = useState(false)
  const [loading, setLoading] = useState(true)
  const [patrol, setPatrol] = useState<Patrol | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [zoneTimeline, setZoneTimeline] = useState<ZoneTimeline | null>(null)
  const [currentHour, setCurrentHour] = useState(new Date().getHours())
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  const completedCount = checkpoints.filter(c => c.completed).length

  // Fetch patrol data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Get active patrols
        const patrolsData = await patrolsAPI.getActive()
        const activePatrol = Array.isArray(patrolsData) && patrolsData.length > 0 
          ? patrolsData[0] 
          : null
        
        if (activePatrol) {
          setPatrol(activePatrol)
          
          // Parse checkpoints from patrol data
          if (activePatrol.checkpoints && Array.isArray(activePatrol.checkpoints)) {
            const mappedCheckpoints = activePatrol.checkpoints.map((cp: any, idx: number) => ({
              ...cp,
              completed: idx < activePatrol.completedCheckpoints
            }))
            setCheckpoints(mappedCheckpoints)
          }
          
          // Parse route data
          if (activePatrol.routeData) {
            setRouteData(activePatrol.routeData as RouteData)
          }
          
          // Fetch zone timeline if we have a zone
          if (activePatrol.zoneId) {
            try {
              const timeline = await predictionsAPI.getZoneTimeline(
                activePatrol.zoneId,
                new Date().toISOString().split('T')[0]
              )
              setZoneTimeline(timeline)
            } catch (err) {
              console.error("Failed to fetch zone timeline:", err)
            }
          }
        }
        
        // Fetch zones
        const zonesData = await zonesAPI.getAll()
        setZones(Array.isArray(zonesData) ? zonesData : [])
        
      } catch (err) {
        console.error("Failed to fetch patrol data:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    
    // Update current hour every minute
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours())
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

  // Initialize map
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || !window.google) return

      // Default coordinates (Mumbai)
      let routeCenter = { lat: 19.23, lng: 72.85 }
      
      // Calculate center from checkpoints or route data
      if (checkpoints.length > 0) {
        const lats = checkpoints.map(c => c.lat)
        const lngs = checkpoints.map(c => c.lng)
        routeCenter = {
          lat: lats.reduce((a, b) => a + b, 0) / lats.length,
          lng: lngs.reduce((a, b) => a + b, 0) / lngs.length
        }
      } else if (routeData?.route_coords && routeData.route_coords.length > 0) {
        const lats = routeData.route_coords.map(c => c[0])
        const lngs = routeData.route_coords.map(c => c[1])
        routeCenter = {
          lat: lats.reduce((a, b) => a + b, 0) / lats.length,
          lng: lngs.reduce((a, b) => a + b, 0) / lngs.length
        }
      }

      const map = new google.maps.Map(mapRef.current, {
        center: routeCenter,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: "poi", stylers: [{ visibility: "off" }] }
        ]
      })

      mapInstanceRef.current = map

      // Clear existing polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
      }

      // Draw route polyline
      const routeCoords = checkpoints.length > 0
        ? checkpoints.map(c => ({ lat: c.lat, lng: c.lng }))
        : routeData?.route_coords?.map(c => ({ lat: c[0], lng: c[1] })) || []

      if (routeCoords.length > 0) {
        const polyline = new google.maps.Polyline({
          path: routeCoords,
          geodesic: true,
          strokeColor: "#6366f1",
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map: map,
        })
        polylineRef.current = polyline
      }

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []

      // Add checkpoint markers
      checkpoints.forEach((checkpoint, index) => {
        const isCompleted = checkpoint.completed
        const isCurrent = index === completedCount && index < checkpoints.length

        const marker = new google.maps.Marker({
          position: { lat: checkpoint.lat, lng: checkpoint.lng },
          map: map,
          title: checkpoint.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: isCompleted ? "#10b981" : isCurrent ? "#f59e0b" : "#e5e7eb",
            fillOpacity: 1,
            strokeColor: isCompleted ? "#059669" : isCurrent ? "#d97706" : "#9ca3af",
            strokeWeight: 3,
          },
        })

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding:12px; max-width: 200px;">
              <strong style="font-size: 14px;">${checkpoint.name}</strong>
              <br/>
              <span style="color: ${isCompleted ? '#10b981' : isCurrent ? '#f59e0b' : '#6b7280'}; font-size: 12px;">
                ${isCompleted ? "✓ Visited" : isCurrent ? "⬤ Current" : "○ Pending"}
              </span>
              ${checkpoint.zone ? `<br/><span style="font-size: 11px; color: #6b7280;">Zone: ${checkpoint.zone}</span>` : ''}
            </div>
          `,
        })

        marker.addListener("click", () => {
          infoWindow.open(map, marker)
        })

        markersRef.current.push(marker)
      })

      // Add zone markers for AI-assigned zones
      if (routeData?.assigned_zones) {
        routeData.assigned_zones.forEach(zone => {
          const zoneMarker = new google.maps.Marker({
            position: { lat: zone.center[0], lng: zone.center[1] },
            map: map,
            title: zone.zone_name,
            icon: {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: zone.risk_level === 'High' || zone.risk_level === 'Critical' ? "#ef4444" : 
                         zone.risk_level === 'Medium' ? "#f59e0b" : "#10b981",
              fillOpacity: 0.8,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          })

          const zoneInfo = new google.maps.InfoWindow({
            content: `
              <div style="padding:12px; max-width: 220px;">
                <strong style="font-size: 14px;">${zone.zone_name}</strong>
                <br/>
                <span style="color: #ef4444; font-size: 12px;">⚠ ${zone.risk_level} Risk</span>
                <br/>
                <span style="font-size: 11px; color: #6b7280;">
                  Predicted: ${zone.predicted_crime}
                  <br/>
                  Confidence: ${(zone.confidence * 100).toFixed(0)}%
                </span>
              </div>
            `,
          })

          zoneMarker.addListener("click", () => {
            zoneInfo.open(map, zoneMarker)
          })

          markersRef.current.push(zoneMarker)
        })
      }
    }

    const timer = setTimeout(() => {
      initializeMap()
    }, 100)

    return () => clearTimeout(timer)
  }, [checkpoints, routeData, completedCount])

  const handleCheckpointComplete = async (checkpointId: number) => {
    if (!patrol) return
    
    try {
      await patrolsAPI.completeCheckpoint(patrol.id)
      setCheckpoints(prev => prev.map(cp => 
        cp.id === checkpointId ? { ...cp, completed: true, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } : cp
      ))
    } catch (err) {
      console.error("Failed to complete checkpoint:", err)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Critical": return "bg-red-500/20 text-red-400 border-red-500/30"
      case "High": return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "Medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Low": return "bg-green-500/20 text-green-400 border-green-500/30"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getCurrentPrediction = () => {
    if (!zoneTimeline) return null
    return zoneTimeline.timeline.find(t => t.hour === currentHour)
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentPrediction = getCurrentPrediction()
  const isAIGenerated = routeData?.ai_generated || patrol?.patrolNumber?.startsWith("AI-")

  return (
    <div className="p-4 space-y-4">
      {/* AI Badge for AI-Generated Routes */}
      {isAIGenerated && (
        <Card className="bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-purple-600/10 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm flex items-center gap-2">
                  AI-Optimized Route
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                </p>
                <p className="text-xs text-muted-foreground">
                  This patrol route was generated by our crime prediction AI
                </p>
              </div>
              {routeData && (
                <Badge variant="secondary" className="gap-1">
                  <Target className="h-3 w-3" />
                  {routeData.time_slot}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground flex items-center gap-2">
                {patrol?.patrolNumber || "Patrol Route"}
                {patrol?.zone && (
                  <Badge variant="outline" className="text-xs">
                    {patrol.zone.name}
                  </Badge>
                )}
              </p>
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
                style={{ width: checkpoints.length > 0 ? `${(completedCount / checkpoints.length) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Prediction Alert */}
      {currentPrediction && (
        <Card className={`border-2 ${getRiskColor(currentPrediction.risk_level)}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                currentPrediction.risk_level === 'High' || currentPrediction.risk_level === 'Critical' 
                  ? 'bg-red-500/20' 
                  : currentPrediction.risk_level === 'Medium' 
                    ? 'bg-yellow-500/20' 
                    : 'bg-green-500/20'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${
                  currentPrediction.risk_level === 'High' || currentPrediction.risk_level === 'Critical' 
                    ? 'text-red-500' 
                    : currentPrediction.risk_level === 'Medium' 
                      ? 'text-yellow-500' 
                      : 'text-green-500'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">Current Hour Prediction</p>
                  <Badge variant={currentPrediction.risk_level === 'High' ? 'destructive' : 'secondary'}>
                    {currentPrediction.risk_level} Risk
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">{currentPrediction.predicted_category}</span>
                  {" • "}
                  Confidence: {(currentPrediction.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{currentPrediction.time}</p>
                <p className="text-xs text-muted-foreground">Current Time Slot</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Map */}
      <Card>
        <CardContent className="p-0">
          <div 
            ref={mapRef}
            className="relative h-[400px] rounded-lg bg-muted overflow-hidden"
          >
            {/* Fallback if Google Maps not loaded */}
            {!window.google && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Assigned Zones */}
      {routeData?.assigned_zones && routeData.assigned_zones.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-violet-500" />
              AI-Assigned Coverage Zones
            </CardTitle>
            <CardDescription>
              Zones selected based on crime predictions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {routeData.assigned_zones.map((zone, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border ${getRiskColor(zone.risk_level)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium text-sm">{zone.zone_name}</span>
                  </div>
                  <Badge variant="outline" className={getRiskColor(zone.risk_level)}>
                    {zone.risk_level}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Predicted Crime:</span>
                    <p className="font-medium">{zone.predicted_crime}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">AI Confidence:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={zone.confidence * 100} className="h-1.5 flex-1" />
                      <span className="font-medium">{(zone.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Checkpoints List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Patrol Checkpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkpoints.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No checkpoints assigned</p>
            </div>
          ) : (
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
                      {checkpoint.zone && (
                        <p className="text-xs text-muted-foreground">Zone: {checkpoint.zone}</p>
                      )}
                    </div>
                    {!checkpoint.completed && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCheckpointComplete(checkpoint.id)}
                      >
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
          )}
        </CardContent>
      </Card>

      {/* 24-Hour Timeline */}
      {zoneTimeline && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              24-Hour Risk Timeline
            </CardTitle>
            <CardDescription>
              {zoneTimeline.zone_name} • {zoneTimeline.date}
              {zoneTimeline.is_holiday && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  🎉 {zoneTimeline.holiday_name}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Scrollable timeline */}
              <div className="flex gap-1 overflow-x-auto pb-2">
                {zoneTimeline.timeline.map((hour, idx) => (
                  <div
                    key={idx}
                    className={`flex-shrink-0 w-12 p-2 rounded text-center ${
                      hour.hour === currentHour 
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' 
                        : getRiskColor(hour.risk_level)
                    }`}
                  >
                    <p className="text-xs font-medium">{hour.time}</p>
                    <div className={`mt-1 h-8 w-full rounded flex items-center justify-center ${
                      hour.risk_level === 'High' || hour.risk_level === 'Critical' ? 'bg-red-500/30' :
                      hour.risk_level === 'Medium' ? 'bg-yellow-500/30' : 'bg-green-500/30'
                    }`}>
                      <span className="text-[10px] font-bold">
                        {(hour.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500/30" />
                  <span>Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-yellow-500/30" />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500/30" />
                  <span>High</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predicted Crimes Alert */}
      {routeData?.predicted_crimes && routeData.predicted_crimes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Watch For These Crimes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {routeData.predicted_crimes.map((crime, idx) => (
                <Badge key={idx} variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                  {crime}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              AI has predicted these crime types are most likely in your patrol area during this time slot.
              Stay vigilant and report any suspicious activity.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Patrol Stats */}
      {patrol && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Patrol Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Distance Covered</p>
                <p className="text-lg font-bold">{patrol.distanceCovered?.toFixed(1) || '0'} km</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Incidents Reported</p>
                <p className="text-lg font-bold">{patrol.incidentsReported || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Started</p>
                <p className="text-lg font-bold">
                  {patrol.startTime 
                    ? new Date(patrol.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Signal</p>
                <p className={`text-lg font-bold ${
                  patrol.signalStrength === 'STRONG' ? 'text-green-500' :
                  patrol.signalStrength === 'MEDIUM' ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {patrol.signalStrength || 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
