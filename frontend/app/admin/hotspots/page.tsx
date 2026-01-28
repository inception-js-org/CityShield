"use client"

import { useState, useEffect, useRef } from "react"
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
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface Hotspot {
  id: number
  name: string
  zone_id: string
  risk: number
  crimeCount: number
  trend: string
  topCrime: string
  status: string
  coordinates: {
    latitude: number
    longitude: number
    top: string
    left: string
  }
  timeActive: string
  zoneType: string
  incidentCount: number
  averageSeverity: number
}

interface CrimeCoordinate {
  latitude: number
  longitude: number
  severity: number
  category: string
  count: number
}

type FilterStatus = "all" | "high" | "medium" | "low"
type SortBy = "risk" | "incidents" | "name"

export default function HotspotAnalysis() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [allCoordinates, setAllCoordinates] = useState<CrimeCoordinate[]>([])
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [sortBy, setSortBy] = useState<SortBy>("risk")
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([])
  const [activeLayer, setActiveLayer] = useState<"heatmap" | "points" | "predicted">("heatmap")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // State for storing map projection for converting lat/lng to screen coordinates
  const [mapProjection, setMapProjection] = useState<google.maps.Projection | null>(null)
  const [screenPos, setScreenPos] = useState<{x: number, y: number} | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)

  // Borivali bounds
  const BORIVALI_BOUNDS = {
    north: 19.255,
    south: 19.210,
    west: 72.800,
    east: 72.875,
  }

  const BORIVALI_CENTER = { lat: 19.23, lng: 72.86 }

  // Initialize map and fetch hotspots
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || !window.google) return

      const map = new google.maps.Map(mapRef.current, {
        center: BORIVALI_CENTER,
        zoom: 14,
        restriction: {
          latLngBounds: BORIVALI_BOUNDS,
          strictBounds: true,
        },
        mapTypeControl: true,
        streetViewControl: false,
      })

      mapInstanceRef.current = map
      
      // Store projection for converting lat/lng to screen coordinates
      // Try to get projection immediately, then listen for changes
      const projection = map.getProjection()
      if (projection) {
        console.log("✓ Map projection captured immediately")
        setMapProjection(projection)
      }
      
      map.addListener('projection_changed', () => {
        const newProjection = map.getProjection()
        if (newProjection) {
          console.log("✓ Map projection updated (projection_changed event)")
          setMapProjection(newProjection)
        }
      })
    }

    const fetchHotspots = async () => {
      try {
        setIsLoading(true)
        console.log("🔄 Fetching hotspots from backend...")
        const response = await fetch("http://localhost:8000/api/hotspots/data")
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ Hotspots API error (${response.status}):`, errorText)
          throw new Error(`Failed to fetch hotspots: ${response.status}`)
        }
        const data = await response.json()
        
        // Transform API data to match interface
        const transformedData: Hotspot[] = data.map((item: any) => {
          // Ensure coordinates are valid numbers with fallbacks
          const latitude = Number(item.latitude) || Number(item.coordinates?.latitude) || BORIVALI_CENTER.lat
          const longitude = Number(item.longitude) || Number(item.coordinates?.longitude) || BORIVALI_CENTER.lng
          
          return {
            id: item.id,
            name: item.name,
            zone_id: item.zone_id,
            risk: Number(item.risk || 0),
            crimeCount: Number(item.crimeCount || 0),
            trend: item.trend || "+12%",
            topCrime: item.topCrime || "Unknown",
            status: item.status || "Active",
            coordinates: {
              latitude: isNaN(latitude) ? BORIVALI_CENTER.lat : latitude,
              longitude: isNaN(longitude) ? BORIVALI_CENTER.lng : longitude,
              top: item.coordinates?.top || "50%",
              left: item.coordinates?.left || "50%",
            },
            timeActive: item.timeActive || "Active 24/7",
            zoneType: item.zoneType || "urban",
            incidentCount: Number(item.incidentCount || item.crimeCount || 0),
            averageSeverity: Number(item.averageSeverity || 2.5),
          }
        })
        
        setHotspots(transformedData)
        console.log(`✓ Loaded ${transformedData.length} hotspots from API`)
        if (transformedData.length > 0) {
          console.log(`→ First hotspot selected: ${transformedData[0].name}`)
          setSelectedHotspot(transformedData[0])
          setBookmarkedIds([transformedData[0].id, transformedData[2]?.id].filter(Boolean) as number[])
        }
        setError(null)
      } catch (err) {
        console.error("Error fetching hotspots:", err)
        setError("Failed to load hotspots data. Please check if the backend is running.")
        console.warn("⚠️ Start backend with: cd backend && python app.py")
        setHotspots([])
      } finally {
        setIsLoading(false)
      }
    }

    const fetchAllCoordinates = async () => {
      try {
        console.log("🔄 Fetching all coordinates from backend...")
        const response = await fetch("http://localhost:8000/api/hotspots/all-coordinates", {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ Coordinates API error (${response.status}):`, errorText)
          console.warn("⚠️ Using hotspots as fallback for coordinates")
          // Fallback: derive coordinates from hotspots
          if (hotspots.length > 0) {
            const fallbackCoords = hotspots.map(spot => ({
              latitude: spot.coordinates.latitude,
              longitude: spot.coordinates.longitude,
              severity: spot.averageSeverity,
              category: spot.topCrime,
              count: spot.crimeCount
            }))
            console.log(`✓ Using ${fallbackCoords.length} hotspots as coordinate source`)
            setAllCoordinates(fallbackCoords)
          }
          return
        }
        
        const data = await response.json()
        console.log(`✓ Fetched ${data.length} unique crime coordinates from API`)
        setAllCoordinates(data)
      } catch (err) {
        console.error("❌ Failed to fetch coordinates. Backend may not be running.", err)
        console.warn("ℹ️ To start backend: cd backend && python app.py")
      }
    }

    fetchHotspots()
    fetchAllCoordinates()
    
    // Initialize map after DOM is ready
    const timer = setTimeout(() => {
      initializeMap()
    }, 100)

    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    if (!mapInstanceRef.current || hotspots.length === 0) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Clear heatmap
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null)
      heatmapRef.current = null
    }

    if (activeLayer === "heatmap") {
      // Create heatmap layer from aggregated hotspots
      const heatmapData = hotspots.map(spot => ({
        location: new google.maps.LatLng(spot.coordinates.latitude, spot.coordinates.longitude),
        weight: spot.risk / 100,
      }))

      const heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapInstanceRef.current,
        radius: 30,
        maxIntensity: 1,
      })
      heatmapRef.current = heatmap
    } else if (activeLayer === "points") {
      // Show all individual crime coordinates
      const pointsData = allCoordinates.length > 0 ? allCoordinates : hotspots
      
      pointsData.forEach(point => {
        const lat = point.latitude || (point as any).coordinates?.latitude
        const lng = point.longitude || (point as any).coordinates?.longitude
        const severity = (point as any).severity || (point as any).averageSeverity || 2.5
        
        if (!lat || !lng) return
        
        // Color based on severity
        const severityColor = severity >= 3.5 ? "#ef4444" : severity >= 2.5 ? "#f59e0b" : "#22c55e"
        
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          title: (point as any).category || (point as any).name || "Crime Incident",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: severityColor,
            fillOpacity: 0.8,
            strokeColor: "white",
            strokeWeight: 1,
          },
        })

        marker.addListener("click", () => {
          // Show info window on click
          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="padding:8px;"><strong>${(point as any).category || "Crime"}</strong><br/>Severity: ${Math.round(severity * 10) / 10}<br/>Incidents: ${(point as any).count || 1}</div>`,
          })
          infoWindow.open(mapInstanceRef.current, marker)
        })

        markersRef.current.push(marker)
      })
    } else {
      // Add markers for aggregated hotspots (default)
      hotspots.forEach(spot => {
        const riskColor = spot.risk >= 70 ? "#ef4444" : spot.risk >= 50 ? "#f59e0b" : "#22c55e"
        
        const marker = new google.maps.Marker({
          position: {
            lat: spot.coordinates.latitude,
            lng: spot.coordinates.longitude,
          },
          map: mapInstanceRef.current,
          title: spot.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
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
  }, [hotspots, allCoordinates, activeLayer, selectedHotspot?.id])

  // Update card positions when zoom changes
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const handleZoomChange = () => {
      const newZoom = mapInstanceRef.current.getZoom()
      console.log(`🔍 Zoom changed to level ${newZoom} - updating card positions`)
      // Force re-render by updating screen position
      setScreenPos(prev => ({ ...prev, x: (prev?.x || 0) + 0.001 }))
    }

    const zoomListener = mapInstanceRef.current.addListener('zoom_changed', handleZoomChange)

    return () => {
      if (zoomListener) zoomListener.remove()
    }
  }, [])

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

  // Debug logging for filter changes
  useEffect(() => {
    console.log(`🔍 Filter changed:`, {
      filterStatus,
      totalHotspots: hotspots.length,
      filteredCount: filteredHotspots.length,
      hotspotRisks: hotspots.map(h => ({ name: h.name, risk: h.risk }))
    })
  }, [filterStatus, hotspots, filteredHotspots])

  const toggleBookmark = (id: number) => {
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

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-90 flex-shrink-0 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Crime Hotspots</span>
            </div>
            <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
              <Info className="h-4 w-4" />
            </button>
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
                <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                  {filterStatus === "all" ? "All Zones" : filterStatus === "high" ? "High Risk" : filterStatus === "medium" ? "Medium Risk" : "Low Risk"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  console.log("→ Filter: All Zones")
                  setFilterStatus("all")
                }}>All Zones</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  console.log("→ Filter: High Risk")
                  setFilterStatus("high")
                }}>High Risk</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  console.log("→ Filter: Medium Risk")
                  setFilterStatus("medium")
                }}>Medium Risk</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  console.log("→ Filter: Low Risk")
                  setFilterStatus("low")
                }}>Low Risk</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                  {sortBy === "risk" ? "Risk Level" : sortBy === "incidents" ? "Incidents" : "Name"}
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
              Filters
            </Button>
          </div>
        </div>

        {/* Hotspot List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">Loading hotspots...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p>{error}</p>
            </div>
          ) : filteredHotspots.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">No hotspots found</p>
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
                    <span className="text-muted-foreground/50">-</span>
                    <span className={getRiskColor(spot.risk)}>{spot.timeActive}</span>
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
              variant={activeLayer === "points" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveLayer("points")}
              className="flex-1"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Points
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
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-muted/30">
        {/* Google Maps Container */}
        <div
          ref={mapRef}
          className="absolute inset-0"
        />

        {/* Hotspot Cards Overlay */}
        {mapInstanceRef.current && hotspots.length > 0 && mapProjection && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {hotspots.map((spot) => {
              try {
                const point = mapProjection.fromLatLngToPoint(
                  new google.maps.LatLng(spot.coordinates.latitude, spot.coordinates.longitude)
                )
                if (!point) {
                  console.warn(`⚠️ Could not calculate projection for ${spot.name}`)
                  return null
                }
                
                const scale = Math.pow(2, mapInstanceRef.current.getZoom())
                const mapDiv = mapRef.current?.getBoundingClientRect()
                if (!mapDiv) {
                  console.warn(`⚠️ Map div bounding rect not available`)
                  return null
                }
                
                const x = (point.x * scale)
                const y = (point.y * scale)
                
                // Debug first card position
                if (spot.id === 1) {
                  console.log(`📍 Card #${spot.id} (${spot.name}):`, {
                    lat: spot.coordinates.latitude,
                    lng: spot.coordinates.longitude,
                    projectionPoint: { px: point.x, py: point.y },
                    scale: scale,
                    zoom: mapInstanceRef.current.getZoom(),
                    finalPos: { x, y },
                    mapDivSize: { w: mapDiv.width, h: mapDiv.height }
                  })
                }

                return (
                  <div
                    key={spot.id}
                    className="absolute pointer-events-auto transition-all duration-300 hover:scale-110"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: selectedHotspot?.id === spot.id ? 40 : 20,
                    }}
                    onClick={() => {
                      console.log(`→ Selected card: ${spot.name}`)
                      setSelectedHotspot(spot)
                    }}
                  >
                    <div className={`rounded-xl border-2 shadow-xl overflow-hidden cursor-pointer transition-all duration-300 ${getRiskBgColor(spot.risk)}`}>
                      <div className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-lg flex items-center justify-center border text-xs font-bold flex-shrink-0 ${getRiskBgColor(spot.risk)}`}>
                            <span className={getRiskColor(spot.risk)}>{spot.risk}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{spot.name}</p>
                            <p className="text-xs text-muted-foreground/80">{spot.crimeCount} incidents</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              } catch (err) {
                console.error(`❌ Error rendering card for ${spot.name}:`, err)
                return null
              }
            })}
          </div>
        )}

        {/* Selected Hotspot Popup */}
        {selectedHotspot && mapInstanceRef.current && mapProjection && (
          <div 
            className="absolute z-30 w-72 transform transition-all duration-300"
            style={{
              left: mapRef.current?.getBoundingClientRect().left || 0,
              top: mapRef.current?.getBoundingClientRect().top || 0,
              position: 'fixed',
              marginLeft: '-144px',
              marginTop: '-100px'
            }}
            ref={(el) => {
              // Update position based on Google Maps projection
              if (el && mapInstanceRef.current && mapProjection) {
                const point = mapProjection.fromLatLngToPoint(
                  new google.maps.LatLng(
                    selectedHotspot.coordinates.latitude,
                    selectedHotspot.coordinates.longitude
                  )
                )
                if (point) {
                  const scale = Math.pow(2, mapInstanceRef.current.getZoom())
                  const mapDiv = mapRef.current?.getBoundingClientRect()
                  if (mapDiv) {
                    const x = (point.x * scale) - (mapDiv.left || 0)
                    const y = (point.y * scale) - (mapDiv.top || 0) + 80
                    console.log(`🎯 Popup position for ${selectedHotspot.name}:`, { x, y, zoom: mapInstanceRef.current.getZoom() })
                    el.style.left = `calc(${x}px - 144px)`
                    el.style.top = `${y}px`
                    el.style.position = 'absolute'
                  }
                }
              }
            }}
          >
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
                  Risk score is <span className={`font-medium ${getRiskColor(selectedHotspot.risk)}`}>{selectedHotspot.risk}%</span> based on historical data and AI analysis.
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
        <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur border border-border rounded-xl p-4">
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

        {/* AI Prediction Badge */}
        <div className="absolute top-6 right-6 bg-primary/10 border border-primary/20 rounded-xl p-4 max-w-xs">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-primary">AI Prediction</p>
              <p className="text-xs text-muted-foreground mt-1">
                High risk predicted for Borivali tonight. Consider increased patrol.
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}
