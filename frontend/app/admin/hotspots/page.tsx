"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  Search,
  MapPin, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  SlidersHorizontal,
  Bookmark,
  X,
  Layers,
  Info,
  RefreshCw,
  Shield,
  Users,
  Eye,
  Zap,
  Sun,
  Moon,
  ChevronRight,
  BarChart3,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { zonesAPI, hotspotsAPI } from "@/lib/api"
import type { Zone } from "@/app/api/index"

// Crime record from CSV
interface Crime {
  id: number
  timestamp: string
  hour: number
  dayOfWeek: number
  isWeekend: boolean
  month: number
  zoneId: string
  zoneType: string
  latitude: number
  longitude: number
  category: string
  subtype: string
  severity: number
  season: string
  weather: string
  isHoliday: boolean
  holidayName: string
}

// Crime summary stats
interface CrimeSummary {
  totalCrimes: number
  byCategory: Record<string, number>
  byZone: Record<string, { count: number; avgSeverity: number }>
  byHour: Record<string, number>
  bySeverity: Record<string, number>
  byWeather: Record<string, number>
}

// Processed zone with crime stats
interface ZoneWithStats extends Zone {
  crimeCount: number
  avgSeverity: number
  topCrime: string
  riskLevel: "high" | "medium" | "low"
  trend: string
}

type FilterStatus = "all" | "high" | "medium" | "low"
type SortBy = "risk" | "incidents" | "name"
type MapLayer = "heatmap" | "crimes" | "zones"

// Borivali bounds
const BORIVALI_BOUNDS = {
  north: 19.255,
  south: 19.210,
  west: 72.800,
  east: 72.875,
}
const BORIVALI_CENTER = { lat: 19.23, lng: 72.86 }

// Helper to wait for Google Maps
function waitForGoogleMaps(timeout = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.maps?.Map) {
      console.log("✅ Google Maps already loaded")
      resolve()
      return
    }

    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      if (window.google?.maps?.Map) {
        console.log("✅ Google Maps API ready")
        clearInterval(checkInterval)
        resolve()
        return
      }

      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval)
        reject(new Error(`Google Maps failed to load within ${timeout/1000}s`))
      }
    }, 200)
  })
}

// Extract coordinates from zone coords field
function getZoneCenter(coords: any): { lat: number; lng: number } {
  if (!coords) return BORIVALI_CENTER
  
  try {
    // Handle array of [lat, lng] pairs (polygon)
    if (Array.isArray(coords) && coords.length > 0) {
      if (Array.isArray(coords[0])) {
        // Calculate centroid
        let sumLat = 0, sumLng = 0
        coords.forEach((point: number[]) => {
          sumLat += point[0] || 0
          sumLng += point[1] || 0
        })
        return {
          lat: sumLat / coords.length,
          lng: sumLng / coords.length
        }
      }
      // Single [lat, lng]
      return { lat: coords[0], lng: coords[1] }
    }
    
    // Handle {lat, lng} object
    if (typeof coords === 'object' && 'lat' in coords) {
      return { lat: coords.lat, lng: coords.lng }
    }
  } catch (e) {
    console.warn("Error parsing coords:", e)
  }
  
  return BORIVALI_CENTER
}

export default function HotspotAnalysis() {
  // Data state
  const [zones, setZones] = useState<ZoneWithStats[]>([])
  const [crimes, setCrimes] = useState<Crime[]>([])
  const [crimeSummary, setCrimeSummary] = useState<CrimeSummary | null>(null)
  const [selectedZone, setSelectedZone] = useState<ZoneWithStats | null>(null)
  
  // UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [sortBy, setSortBy] = useState<SortBy>("risk")
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  const [activeLayer, setActiveLayer] = useState<MapLayer>("heatmap")
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [mapsApiLoaded, setMapsApiLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Map refs
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)
  const polygonsRef = useRef<google.maps.Polygon[]>([])
  const initAttempted = useRef(false)

  // Fetch all data
  const fetchData = useCallback(async () => {
    console.log("🔄 Fetching zones and crime data...")
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch zones from database and crime summary
      const [zonesData, summaryData, crimesData] = await Promise.all([
        zonesAPI.getAll(),
        hotspotsAPI.getCrimesSummary(),
        hotspotsAPI.getCrimes()
      ])
      
      console.log(`✅ Fetched ${zonesData?.length || 0} zones, ${crimesData?.length || 0} crimes`)
      
      // Process zones with crime stats
      const processedZones: ZoneWithStats[] = (zonesData || []).map((zone: Zone) => {
        const zoneStats = summaryData?.byZone?.[zone.zoneId] || { count: 0, avgSeverity: 0 }
        const riskScore = zone.riskBase || 0.5
        
        // Find top crime for this zone
        const zoneCrimes = crimesData?.filter((c: Crime) => c.zoneId === zone.zoneId) || []
        const crimeCategories: Record<string, number> = {}
        zoneCrimes.forEach((c: Crime) => {
          crimeCategories[c.subtype] = (crimeCategories[c.subtype] || 0) + 1
        })
        const topCrime = Object.entries(crimeCategories).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
        
        return {
          ...zone,
          crimeCount: zoneStats.count,
          avgSeverity: zoneStats.avgSeverity,
          topCrime: topCrime.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          riskLevel: riskScore >= 0.7 ? "high" : riskScore >= 0.4 ? "medium" : "low",
          trend: riskScore > 0.5 ? `+${Math.round((riskScore - 0.5) * 100)}%` : `-${Math.round((0.5 - riskScore) * 100)}%`
        }
      })
      
      // Sort by risk
      processedZones.sort((a, b) => (b.riskBase || 0) - (a.riskBase || 0))
      
      setZones(processedZones)
      setCrimes(crimesData || [])
      setCrimeSummary(summaryData)
      
      // Select first zone if none selected
      if (processedZones.length > 0 && !selectedZone) {
        setSelectedZone(processedZones[0])
        setBookmarkedIds([processedZones[0].id, processedZones[2]?.id].filter(Boolean))
      }
      
    } catch (err) {
      console.error("❌ Error fetching data:", err)
      setError("Failed to load data. Please ensure the backend is running.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedZone])

  // Load Google Maps API
  useEffect(() => {
    console.log("🚀 Starting Google Maps load...")
    
    const loadMaps = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        console.log("🔑 API Key:", apiKey ? `${apiKey.slice(0, 15)}...` : "NOT FOUND")
        
        if (!apiKey) {
          throw new Error("Google Maps API key not configured")
        }

        // Check if script exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
        
        if (!existingScript) {
          console.log("📜 Loading Google Maps script...")
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script")
            const callbackName = `__gmapsCallback_${Date.now()}`
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization&callback=${callbackName}`
            script.async = true
            
            ;(window as any)[callbackName] = () => {
              console.log("✅ Google Maps callback fired")
              delete (window as any)[callbackName]
              resolve()
            }
            
            script.onerror = () => reject(new Error("Failed to load Google Maps"))
            document.head.appendChild(script)
          })
        } else {
          console.log("⏳ Waiting for existing script...")
          await waitForGoogleMaps(15000)
        }
        
        console.log("✅ Google Maps API loaded!")
        setMapsApiLoaded(true)
        
      } catch (err) {
        console.error("❌ Maps load error:", err)
        setError(err instanceof Error ? err.message : "Failed to load maps")
      }
    }
    
    loadMaps()
    fetchData()
  }, [fetchData])

  // Initialize map once API is ready
  useEffect(() => {
    if (!mapsApiLoaded || !mapRef.current || initAttempted.current) return
    
    initAttempted.current = true
    console.log("🗺️ Initializing map...")
    
    try {
      const map = new google.maps.Map(mapRef.current, {
        center: BORIVALI_CENTER,
        zoom: 14,
        restriction: {
          latLngBounds: BORIVALI_BOUNDS,
          strictBounds: false,
        },
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#8b8b8b" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d44" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e1a" }] },
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        ]
      })

      mapInstanceRef.current = map
      
      map.addListener("idle", () => {
        console.log("✅ Map ready!")
        setMapReady(true)
      })

      // Trigger resize
      setTimeout(() => {
        google.maps.event.trigger(map, 'resize')
        map.setCenter(BORIVALI_CENTER)
      }, 100)
      
    } catch (err) {
      console.error("❌ Map init error:", err)
      setError("Failed to initialize map")
    }
  }, [mapsApiLoaded])

  // Update map visualization when data or layer changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return
    
    console.log(`🎨 Updating layer: ${activeLayer}`)
    
    // Clear existing
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
    
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null)
      heatmapRef.current = null
    }
    
    polygonsRef.current.forEach(p => p.setMap(null))
    polygonsRef.current = []
    
    const map = mapInstanceRef.current
    
    if (activeLayer === "heatmap") {
      // Create heatmap from crime locations
      if (crimes.length > 0) {
        const heatmapData = crimes.map(crime => ({
          location: new google.maps.LatLng(crime.latitude, crime.longitude),
          weight: crime.severity / 4,
        }))
        
        const heatmap = new google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: map,
          radius: 25,
          maxIntensity: 1,
          gradient: [
            'rgba(0, 255, 0, 0)',
            'rgba(0, 255, 0, 0.6)',
            'rgba(255, 255, 0, 0.8)',
            'rgba(255, 128, 0, 0.9)',
            'rgba(255, 0, 0, 1)'
          ]
        })
        heatmapRef.current = heatmap
        console.log(`🔥 Heatmap created with ${crimes.length} points`)
      }
      
    } else if (activeLayer === "crimes") {
      // Show individual crime markers
      const limitedCrimes = crimes.slice(0, 500) // Limit for performance
      
      limitedCrimes.forEach(crime => {
        const color = crime.severity >= 4 ? "#ef4444" : 
                      crime.severity >= 3 ? "#f59e0b" : 
                      crime.severity >= 2 ? "#eab308" : "#22c55e"
        
        const marker = new google.maps.Marker({
          position: { lat: crime.latitude, lng: crime.longitude },
          map: map,
          title: `${crime.category} - ${crime.subtype}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5 + crime.severity,
            fillColor: color,
            fillOpacity: 0.7,
            strokeColor: "white",
            strokeWeight: 1,
          },
        })
        
        marker.addListener("click", () => {
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding:10px;color:#000;min-width:200px;">
                <strong style="font-size:14px;">${crime.subtype.replace(/_/g, " ").toUpperCase()}</strong>
                <br/><span style="color:#666;">${crime.category}</span>
                <hr style="margin:8px 0;border-color:#eee;"/>
                <div style="font-size:12px;">
                  <div>📅 ${crime.timestamp.split(" ")[0]}</div>
                  <div>⏰ Hour: ${crime.hour}:00</div>
                  <div>📍 Zone: ${crime.zoneId.replace(/_/g, " ")}</div>
                  <div>⚠️ Severity: ${crime.severity}/4</div>
                  <div>🌤️ Weather: ${crime.weather}</div>
                </div>
              </div>
            `,
          })
          infoWindow.open(map, marker)
        })
        
        markersRef.current.push(marker)
      })
      console.log(`📍 Added ${limitedCrimes.length} crime markers`)
      
    } else if (activeLayer === "zones") {
      // Show zone markers with risk indicators
      zones.forEach(zone => {
        const center = getZoneCenter(zone.coords)
        const riskScore = Math.round((zone.riskBase || 0.5) * 100)
        const color = zone.riskLevel === "high" ? "#ef4444" : 
                      zone.riskLevel === "medium" ? "#f59e0b" : "#22c55e"
        
        const marker = new google.maps.Marker({
          position: center,
          map: map,
          title: zone.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: color,
            fillOpacity: zone.id === selectedZone?.id ? 1 : 0.7,
            strokeColor: "white",
            strokeWeight: zone.id === selectedZone?.id ? 3 : 2,
          },
          label: {
            text: String(riskScore),
            color: "white",
            fontSize: "10px",
            fontWeight: "bold"
          }
        })
        
        marker.addListener("click", () => {
          setSelectedZone(zone)
        })
        
        markersRef.current.push(marker)
      })
      console.log(`🏘️ Added ${zones.length} zone markers`)
    }
    
  }, [mapReady, crimes, zones, activeLayer, selectedZone?.id])

  // Filter and sort zones
  const filteredZones = zones
    .filter(zone => {
      const matchesSearch = zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.topCrime.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.type.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterStatus === "all" ||
        (filterStatus === "high" && zone.riskLevel === "high") ||
        (filterStatus === "medium" && zone.riskLevel === "medium") ||
        (filterStatus === "low" && zone.riskLevel === "low")
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === "risk") return (b.riskBase || 0) - (a.riskBase || 0)
      if (sortBy === "incidents") return b.crimeCount - a.crimeCount
      return a.name.localeCompare(b.name)
    })

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const getRiskColor = (level: string) => {
    if (level === "high") return "text-red-400"
    if (level === "medium") return "text-amber-400"
    return "text-emerald-400"
  }

  const getRiskBgColor = (level: string) => {
    if (level === "high") return "bg-red-500/20 border-red-500/30"
    if (level === "medium") return "bg-amber-500/20 border-amber-500/30"
    return "bg-emerald-500/20 border-emerald-500/30"
  }

  // Calculate stats
  const stats = {
    totalCrimes: crimeSummary?.totalCrimes || 0,
    highRiskZones: zones.filter(z => z.riskLevel === "high").length,
    avgSeverity: crimes.length > 0 
      ? (crimes.reduce((sum, c) => sum + c.severity, 0) / crimes.length).toFixed(1)
      : "0",
    topCategory: crimeSummary?.byCategory 
      ? Object.entries(crimeSummary.byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
      : "N/A"
  }

  // Time-based risk
  const timeBasedRisk = [
    { time: "12 AM - 6 AM", risk: "High", color: "destructive" },
    { time: "6 AM - 12 PM", risk: "Low", color: "success" },
    { time: "12 PM - 6 PM", risk: "Medium", color: "warning" },
    { time: "6 PM - 12 AM", risk: "High", color: "destructive" },
  ]

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
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Total Crimes</p>
              <p className="text-lg font-bold text-foreground">{stats.totalCrimes.toLocaleString()}</p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">High Risk Zones</p>
              <p className="text-lg font-bold text-red-400">{stats.highRiskZones}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search zones, crimes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span>Filter:</span>
            <span className="ml-auto">Sort:</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 bg-transparent text-xs">
                  {filterStatus === "all" ? "All Zones" : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Risk`}
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

        {/* Zone List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                <p className="text-muted-foreground text-sm">Loading zones...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button size="sm" className="mt-3" onClick={fetchData}>Retry</Button>
            </div>
          ) : filteredZones.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">No zones found</p>
            </div>
          ) : (
            filteredZones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone)}
                className={`w-full flex items-center gap-3 p-4 border-l-2 transition-all text-left ${
                  selectedZone?.id === zone.id 
                    ? "bg-primary/10 border-l-primary" 
                    : "border-l-transparent hover:bg-secondary/50"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${getRiskBgColor(zone.riskLevel)} border`}>
                  <span className={getRiskColor(zone.riskLevel)}>{Math.round((zone.riskBase || 0.5) * 100)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{zone.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span>{zone.crimeCount} incidents</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className={getRiskColor(zone.riskLevel)}>{zone.type}</span>
                  </p>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleBookmark(zone.id)
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    bookmarkedIds.includes(zone.id) 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${bookmarkedIds.includes(zone.id) ? "fill-current" : ""}`} />
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
              Heat
            </Button>
            <Button
              variant={activeLayer === "crimes" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveLayer("crimes")}
              className="flex-1"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Crimes
            </Button>
            <Button
              variant={activeLayer === "zones" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveLayer("zones")}
              className="flex-1"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Zones
            </Button>
          </div>
        </div>

        {/* Crime Distribution */}
        {crimeSummary && (
          <div className="p-4 border-t border-border max-h-40 overflow-y-auto">
            <p className="text-xs font-medium text-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="h-3 w-3 text-primary" />
              Crime Categories
            </p>
            <div className="space-y-2">
              {Object.entries(crimeSummary.byCategory)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([category, count]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground capitalize">{category.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(count / stats.totalCrimes) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-muted/30">
        {/* Google Maps Container */}
        <div
          ref={mapRef}
          className="absolute inset-0 w-full h-full"
          style={{ minHeight: '400px' }}
        />

        {/* Loading overlay */}
        {(!mapReady || isLoading) && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {!mapsApiLoaded ? "Loading Google Maps..." : !mapReady ? "Initializing map..." : "Loading data..."}
              </p>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-20">
            <div className="bg-card p-6 rounded-lg border border-destructive/50 max-w-md text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Error</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Reload Page</Button>
            </div>
          </div>
        )}

        {/* Debug bar */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg z-50 font-mono">
          API: {mapsApiLoaded ? "✅" : "⏳"} | Map: {mapReady ? "✅" : "⏳"} | Zones: {zones.length} | Crimes: {crimes.length}
        </div>

        {/* Selected Zone Detail Panel */}
        {selectedZone && mapReady && (
          <div className="absolute top-14 left-6 z-30 w-80">
            <div className="bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${getRiskBgColor(selectedZone.riskLevel)}`}>
                    <span className={`text-lg font-bold ${getRiskColor(selectedZone.riskLevel)}`}>
                      {Math.round((selectedZone.riskBase || 0.5) * 100)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{selectedZone.name}</h3>
                    <p className={`text-xs mt-0.5 ${getRiskColor(selectedZone.riskLevel)}`}>
                      {selectedZone.riskLevel.charAt(0).toUpperCase() + selectedZone.riskLevel.slice(1)} Risk Zone
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Type: {selectedZone.type}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedZone(null)}
                    className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 p-4 border-b border-border">
                <div className="text-center">
                  <AlertTriangle className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold text-foreground">{selectedZone.crimeCount}</p>
                  <p className="text-xs text-muted-foreground">Incidents</p>
                </div>
                <div className="text-center">
                  <Activity className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold text-foreground">{selectedZone.avgSeverity.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Avg Severity</p>
                </div>
                <div className="text-center">
                  <TrendingUp className={`h-4 w-4 mx-auto mb-1 ${selectedZone.trend.startsWith("+") ? "text-red-400" : "text-emerald-400"}`} />
                  <p className={`text-lg font-bold ${selectedZone.trend.startsWith("+") ? "text-red-400" : "text-emerald-400"}`}>
                    {selectedZone.trend}
                  </p>
                  <p className="text-xs text-muted-foreground">Trend</p>
                </div>
              </div>

              {/* Zone Metadata */}
              <div className="p-4 space-y-3">
                <h4 className="text-xs font-medium text-foreground flex items-center gap-2">
                  <Info className="h-3 w-3" />
                  Zone Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Population:</span>
                    <span className="text-foreground font-medium">{selectedZone.popDensity?.toLocaleString() || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">CCTV:</span>
                    <span className="text-foreground font-medium">{((selectedZone.cctvDensity || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Lighting:</span>
                    <span className="text-foreground font-medium">{((selectedZone.lighting || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Police:</span>
                    <span className="text-foreground font-medium">{((selectedZone.policeScore || 0) * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Top crime: <span className="text-foreground font-medium">{selectedZone.topCrime}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Patrol frequency: <span className="text-foreground font-medium">{selectedZone.patrolFreq || 0}x daily</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  View Details
                </Button>
                <Button size="sm" className="flex-1">
                  <Shield className="h-3 w-3 mr-1" />
                  Deploy Patrol
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
              <span className="text-muted-foreground">Low (&lt;40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="text-muted-foreground">Medium (40-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <span className="text-muted-foreground">High (&gt;70%)</span>
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
                  slot.color === "destructive" ? "bg-red-500/20 text-red-400" :
                  slot.color === "warning" ? "bg-amber-500/20 text-amber-400" :
                  "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {slot.risk}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Prediction Badge */}
        <div className="absolute top-14 right-6 bg-primary/10 border border-primary/20 rounded-xl p-4 max-w-xs z-20">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
