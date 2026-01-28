"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  Search,
  Layers, 
  MapPin, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Sun,
  Moon,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Bookmark,
  X,
  Info
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { zonesAPI, firsAPI, complaintsAPI } from "@/lib/api"
import type { Zone, FIR, Complaint } from "@/app/api/index"

interface Hotspot {
  id: string
  name: string
  risk: number
  crimeCount: number
  trend: string
  topCrime: string
  coords: any
  timeActive: string
  zoneType: string
}

type FilterStatus = "all" | "high" | "medium" | "low"
type SortBy = "risk" | "incidents" | "name"

export default function HotspotAnalysis() {
  const [activeLayer, setActiveLayer] = useState<"fir" | "heatmap" | "predicted">("heatmap")
  const [loading, setLoading] = useState(true)
  const [zones, setZones] = useState<Zone[]>([])
  const [firs, setFirs] = useState<FIR[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  
  // New UI state from pasted code
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [sortBy, setSortBy] = useState<SortBy>("risk")
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  
  // Map refs
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)
  const [mapProjection, setMapProjection] = useState<google.maps.Projection | null>(null)

  // Borivali bounds
  const BORIVALI_BOUNDS = {
    north: 19.255,
    south: 19.210,
    west: 72.800,
    east: 72.875,
  }
  const BORIVALI_CENTER = { lat: 19.23, lng: 72.86 }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching zones, FIRs, and complaints...")
      const [zonesData, firsData, complaintsData] = await Promise.all([
        zonesAPI.getAll(),
        firsAPI.getRecent(50),
        complaintsAPI.getAll()
      ])
      
      const zonesArray = Array.isArray(zonesData) ? zonesData : []
      const firsArray = Array.isArray(firsData) ? firsData : []
      const complaintsArray = Array.isArray(complaintsData) ? complaintsData : []
      
      console.log(`✓ Fetched: ${zonesArray.length} zones, ${firsArray.length} FIRs, ${complaintsArray.length} complaints`)
      
      setZones(zonesArray)
      setFirs(firsArray)
      setComplaints(complaintsArray)
    } catch (err) {
      console.error("❌ Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load Google Maps Script
  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        console.log("✓ Google Maps already loaded")
        setMapLoaded(true)
        return
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        console.log("⏳ Google Maps script already loading...")
        const checkLoaded = setInterval(() => {
          if (window.google && window.google.maps) {
            console.log("✓ Google Maps finished loading")
            setMapLoaded(true)
            clearInterval(checkLoaded)
          }
        }, 100)
        return
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        console.error("❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set in .env")
        return
      }

      console.log("🔄 Loading Google Maps script...")
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization&loading=async&callback=initGoogleMaps`
      script.async = true
      script.defer = true

      // Define callback
      ;(window as any).initGoogleMaps = () => {
        console.log("✓ Google Maps loaded via callback")
        setMapLoaded(true)
      }

      script.onerror = () => {
        console.error("❌ Failed to load Google Maps script")
      }

      document.head.appendChild(script)
    }

    loadGoogleMaps()
    fetchData()
  }, [fetchData])

  // Initialize map once Google Maps is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) {
      return
    }

    console.log("🗺️ Initializing Google Maps...")

    try {
      const map = new google.maps.Map(mapRef.current, {
        center: BORIVALI_CENTER,
        zoom: 14,
        restriction: {
          latLngBounds: BORIVALI_BOUNDS,
          strictBounds: true,
        },
        mapTypeControl: true,
        streetViewControl: false,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#8b8b8b" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d44" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e1a" }] },
        ]
      })

      mapInstanceRef.current = map
      
      // Wait for map to be fully loaded
      google.maps.event.addListenerOnce(map, 'idle', () => {
        console.log("✓ Google Maps fully initialized and idle")
        setMapReady(true)
      })
      
      const projection = map.getProjection()
      if (projection) {
        setMapProjection(projection)
      }
      
      map.addListener('projection_changed', () => {
        const newProjection = map.getProjection()
        if (newProjection) {
          setMapProjection(newProjection)
        }
      })

      console.log("✓ Google Maps instance created")
    } catch (error) {
      console.error("❌ Error initializing Google Maps:", error)
    }
  }, [mapLoaded])

  // Calculate hotspots from zones data
  const hotspots: Hotspot[] = zones
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
        risk: Math.round((zone.riskBase || 0.5) * 100),
        crimeCount: incidentCount,
        trend: zone.riskScore && zone.riskScore > zone.riskBase ? `+${Math.round((zone.riskScore - zone.riskBase) * 100)}%` : "-5%",
        topCrime,
        coords: zone.coords,
        timeActive: "Active 24/7",
        zoneType: "urban"
      }
    })
    .sort((a, b) => b.risk - a.risk)

  // Set initial selected hotspot
  useEffect(() => {
    if (hotspots.length > 0 && !selectedHotspot) {
      console.log(`📍 Setting initial hotspot: ${hotspots[0].name}`)
      setSelectedHotspot(hotspots[0])
      setBookmarkedIds([hotspots[0].id, hotspots[2]?.id].filter(Boolean) as string[])
    }
  }, [hotspots.length]) // Only depend on length to avoid infinite loops

  // Update map markers/heatmap when data changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) {
      console.log("⏳ Map not ready yet, waiting...")
      return
    }

    console.log(`🔄 Updating map layer: ${activeLayer}`)
    console.log(`   - Zones: ${zones.length}, Hotspots: ${hotspots.length}, FIRs: ${firs.length}`)

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Clear heatmap
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null)
      heatmapRef.current = null
    }

    // If no data, add default markers for demo
    if (hotspots.length === 0 && zones.length === 0) {
      console.log("⚠️ No hotspots/zones available, showing default marker")
      const defaultMarker = new google.maps.Marker({
        position: BORIVALI_CENTER,
        map: mapInstanceRef.current,
        title: "Borivali Center",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3b82f6",
          fillOpacity: 0.8,
          strokeColor: "white",
          strokeWeight: 2,
        },
      })
      markersRef.current.push(defaultMarker)
      return
    }

    if (activeLayer === "heatmap") {
      // Create heatmap layer
      const heatmapData = hotspots.map(spot => {
        // Handle different coord formats
        let lat = BORIVALI_CENTER.lat
        let lng = BORIVALI_CENTER.lng
        
        if (spot.coords) {
          if (Array.isArray(spot.coords) && spot.coords[0]) {
            if (Array.isArray(spot.coords[0])) {
              lat = spot.coords[0][0] || BORIVALI_CENTER.lat
              lng = spot.coords[0][1] || BORIVALI_CENTER.lng
            } else if (typeof spot.coords[0] === 'number') {
              lat = spot.coords[0]
              lng = spot.coords[1] || BORIVALI_CENTER.lng
            }
          }
        }
        
        return {
          location: new google.maps.LatLng(lat, lng),
          weight: spot.risk / 100,
        }
      })

      console.log(`🔥 Creating heatmap with ${heatmapData.length} points`)

      if (heatmapData.length > 0) {
        const heatmap = new google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: mapInstanceRef.current,
          radius: 40,
          maxIntensity: 1,
          gradient: [
            'rgba(0, 255, 0, 0)',
            'rgba(0, 255, 0, 1)',
            'rgba(255, 255, 0, 1)',
            'rgba(255, 128, 0, 1)',
            'rgba(255, 0, 0, 1)'
          ]
        })
        heatmapRef.current = heatmap
      }
    } else if (activeLayer === "fir") {
      // Show FIR points
      const firsToShow = firs.slice(0, 50)
      console.log(`📍 Adding ${firsToShow.length} FIR markers`)
      
      firsToShow.forEach((fir) => {
        const zone = zones.find(z => z.id === fir.zoneId)
        let lat = BORIVALI_CENTER.lat + (Math.random() - 0.5) * 0.03
        let lng = BORIVALI_CENTER.lng + (Math.random() - 0.5) * 0.03
        
        if (zone?.coords) {
          if (Array.isArray(zone.coords) && zone.coords[0]) {
            if (Array.isArray(zone.coords[0])) {
              lat = zone.coords[0][0] || lat
              lng = zone.coords[0][1] || lng
            }
          }
        }
        
        const severityColor = fir.status === "FILED" ? "#ef4444" : 
                              fir.status === "UNDER_INVESTIGATION" ? "#f59e0b" : "#22c55e"
        
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          title: fir.incidentType,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: severityColor,
            fillOpacity: 0.8,
            strokeColor: "white",
            strokeWeight: 2,
          },
        })

        marker.addListener("click", () => {
          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="padding:8px;color:#000;"><strong>${fir.incidentType}</strong><br/>Status: ${fir.status}<br/>FIR: ${fir.firNumber}</div>`,
          })
          infoWindow.open(mapInstanceRef.current, marker)
        })

        markersRef.current.push(marker)
      })
    } else {
      // Predicted risk zones - show hotspot markers
      console.log(`🎯 Adding ${hotspots.length} AI prediction markers`)
      
      hotspots.forEach(spot => {
        let lat = BORIVALI_CENTER.lat
        let lng = BORIVALI_CENTER.lng
        
        if (spot.coords) {
          if (Array.isArray(spot.coords) && spot.coords[0]) {
            if (Array.isArray(spot.coords[0])) {
              lat = spot.coords[0][0] || BORIVALI_CENTER.lat
              lng = spot.coords[0][1] || BORIVALI_CENTER.lng
            } else if (typeof spot.coords[0] === 'number') {
              lat = spot.coords[0]
              lng = spot.coords[1] || BORIVALI_CENTER.lng
            }
          }
        }
        
        const riskColor = spot.risk >= 70 ? "#ef4444" : spot.risk >= 50 ? "#f59e0b" : "#22c55e"
        
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          title: spot.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: riskColor,
            fillOpacity: spot.id === selectedHotspot?.id ? 1 : 0.7,
            strokeColor: "white",
            strokeWeight: 2,
          },
        })

        marker.addListener("click", () => {
          setSelectedHotspot(spot)
        })

        markersRef.current.push(marker)
      })
    }
  }, [mapReady, zones, firs, activeLayer, selectedHotspot?.id])

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
  const highestRiskZone = zones.length > 0 
    ? zones.reduce((max, zone) => (zone.riskBase || 0) > (max?.riskBase || 0) ? zone : max, zones[0])
    : null

  // Filter and sort hotspots
  const filteredHotspots = hotspots
    .filter(spot => {
      const matchesSearch = spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.topCrime.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterStatus === "all" ||
        (filterStatus === "high" && spot.risk >= 70) ||
        (filterStatus === "medium" && spot.risk >= 50 && spot.risk < 70) ||
        (filterStatus === "low" && spot.risk < 50)
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === "risk") return b.risk - a.risk
      if (sortBy === "incidents") return b.crimeCount - a.crimeCount
      return a.name.localeCompare(b.name)
    })

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return "text-red-400"
    if (risk >= 50) return "text-amber-400"
    return "text-emerald-400"
  }

  const getRiskBgColor = (risk: number) => {
    if (risk >= 70) return "bg-red-500/20 border-red-500/30"
    if (risk >= 50) return "bg-amber-500/20 border-amber-500/30"
    return "bg-emerald-500/20 border-emerald-500/30"
  }

  const getStatusLabel = (risk: number) => {
    if (risk >= 70) return "High Risk"
    if (risk >= 50) return "Medium Risk"
    return "Low Risk"
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-80 flex-shrink-0 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Crime Hotspots</span>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search zones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span>Show me:</span>
            <span className="ml-auto">Sort by:</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 bg-transparent text-xs">
                  {filterStatus === "all" ? "All Zones" : filterStatus === "high" ? "High Risk" : filterStatus === "medium" ? "Medium Risk" : "Low Risk"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>All Zones</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("high")}>High Risk</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("medium")}>Medium Risk</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("low")}>Low Risk</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 bg-transparent text-xs">
                  {sortBy === "risk" ? "Risk" : sortBy === "incidents" ? "Incidents" : "Name"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("risk")}>Risk Level</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("incidents")}>Incidents</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>Name</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" className="gap-1 ml-auto bg-transparent">
              <SlidersHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Hotspot List */}
        <div className="flex-1 overflow-y-auto">
          {filteredHotspots.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">
                {zones.length === 0 ? "Loading zones..." : "No hotspots found"}
              </p>
            </div>
          ) : (
            filteredHotspots.map((spot) => (
              <button
                key={spot.id}
                onClick={() => setSelectedHotspot(spot)}
                className={`w-full flex items-center gap-3 p-4 border-l-2 transition-all text-left ${
                  selectedHotspot?.id === spot.id 
                    ? "bg-primary/10 border-l-primary" 
                    : "border-l-transparent hover:bg-secondary/50"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${getRiskBgColor(spot.risk)} border`}>
                  <span className={getRiskColor(spot.risk)}>{spot.risk}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{spot.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    {spot.crimeCount} incidents
                    <span className="text-muted-foreground/50">•</span>
                    <span className={getRiskColor(spot.risk)}>{spot.topCrime}</span>
                  </p>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleBookmark(spot.id)
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    bookmarkedIds.includes(spot.id) 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${bookmarkedIds.includes(spot.id) ? "fill-current" : ""}`} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Layer Controls */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Map Layer</p>
          <div className="flex gap-2">
            <Button
              variant={activeLayer === "heatmap" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveLayer("heatmap")}
              className="flex-1"
            >
              <Layers className="h-3 w-3 mr-1" />
              Heatmap
            </Button>
            <Button
              variant={activeLayer === "fir" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveLayer("fir")}
              className="flex-1"
            >
              <MapPin className="h-3 w-3 mr-1" />
              FIRs
            </Button>
            <Button
              variant={activeLayer === "predicted" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveLayer("predicted")}
              className="flex-1"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              AI
            </Button>
          </div>
        </div>

        {/* Crime Type Distribution */}
        <div className="p-4 border-t border-border max-h-48 overflow-y-auto">
          <p className="text-xs font-medium text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-primary" />
            Crime Distribution
          </p>
          <div className="space-y-2">
            {crimeTypeTrends.length === 0 ? (
              <p className="text-xs text-muted-foreground">No crime data available</p>
            ) : (
              crimeTypeTrends.slice(0, 4).map((crime) => (
                <div key={crime.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground truncate">{crime.type}</span>
                    <span className="text-muted-foreground">{crime.count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${crime.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-muted/30">
        {/* Google Maps Container */}
        <div
          ref={mapRef}
          className="absolute inset-0 w-full h-full"
          style={{ minHeight: '400px' }}
        />

        {/* Loading overlay for map */}
        {(!mapLoaded || !mapReady) && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {!mapLoaded ? "Loading Google Maps..." : "Initializing map..."}
              </p>
            </div>
          </div>
        )}

        {/* Debug info - remove in production */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded z-50">
          Zones: {zones.length} | FIRs: {firs.length} | Map: {mapReady ? "Ready" : "Loading"}
        </div>

        {/* Selected Hotspot Popup */}
        {selectedHotspot && (
          <div className="absolute top-12 left-6 z-30 w-72">
            <div className="bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${getRiskBgColor(selectedHotspot.risk)}`}>
                    <AlertTriangle className={`h-5 w-5 ${getRiskColor(selectedHotspot.risk)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{selectedHotspot.name}</h3>
                    <p className={`text-xs mt-0.5 ${getRiskColor(selectedHotspot.risk)}`}>{getStatusLabel(selectedHotspot.risk)}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedHotspot(null)}
                    className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{selectedHotspot.crimeCount} incidents</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{selectedHotspot.timeActive}</span>
                </div>
                <div className={`flex items-center gap-1 ${selectedHotspot.trend.startsWith("+") ? "text-red-400" : "text-emerald-400"}`}>
                  <TrendingUp className="h-3 w-3" />
                  <span>{selectedHotspot.trend}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Primary Crime Type</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The most common crime in this zone is <span className="text-foreground font-medium">{selectedHotspot.topCrime}</span>. 
                  Risk score is <span className={`font-medium ${getRiskColor(selectedHotspot.risk)}`}>{selectedHotspot.risk}%</span> based on historical data.
                </p>
              </div>

              {/* Action Button */}
              <div className="px-4 pb-4">
                <Button variant="outline" className="w-full bg-transparent">
                  View Full Details
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Map Legend */}
        <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur border border-border rounded-xl p-4 z-20">
          <p className="text-xs font-medium text-foreground mb-3">Risk Level</p>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="text-muted-foreground">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <span className="text-muted-foreground">High</span>
            </div>
          </div>
        </div>

        {/* Time-Based Risk Card */}
        <div className="absolute bottom-6 right-6 bg-card/95 backdrop-blur border border-border rounded-xl p-4 w-56 z-20">
          <p className="text-xs font-medium text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-3 w-3 text-primary" />
            Time-Based Risk
          </p>
          <div className="space-y-2">
            {timeBasedRisk.map((slot) => (
              <div key={slot.time} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {slot.time.includes("12 AM") || slot.time.includes("6 PM") ? (
                    <Moon className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Sun className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-muted-foreground">{slot.time}</span>
                </div>
                <span className={`font-medium px-2 py-0.5 rounded-full text-[10px] ${
                  slot.color === "destructive" ? "bg-destructive/10 text-destructive" :
                  slot.color === "warning" ? "bg-warning/10 text-warning-foreground" :
                  "bg-success/10 text-success"
                }`}>
                  {slot.risk}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Prediction Badge */}
        <div className="absolute top-12 right-6 bg-primary/10 border border-primary/20 rounded-xl p-4 max-w-xs z-20">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-primary">AI Prediction</p>
              <p className="text-xs text-muted-foreground mt-1">
                {highestRiskZone 
                  ? `High risk predicted for ${highestRiskZone.name} tonight (10 PM - 2 AM). Consider increasing patrol coverage.`
                  : "No predictions available yet."}
              </p>
              <Button size="sm" className="mt-2 gap-1 h-7 text-xs">
                Generate Patrol Plan
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}