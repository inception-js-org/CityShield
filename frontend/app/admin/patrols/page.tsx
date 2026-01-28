"use client"

import { useState, useEffect } from "react"
import { 
  Car, 
  Plus, 
  MapPin, 
  Users, 
  Send, 
  MoreHorizontal,
  Route,
  ChevronUp,
  ChevronDown,
  Clock,
  RefreshCw,
  Brain,
  Sparkles,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Shield,
  Zap,
  Target,
  BarChart3,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Play,
  Eye
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { patrolsAPI, zonesAPI, officersAPI, predictionsAPI } from "@/lib/api"
import type { Patrol, Zone, PoliceOfficer } from "@/app/api/index"

// Types for predictions
interface TimeSlotPrediction {
  slot_start: string
  slot_end: string
  slot_label: string
  zone_id: string
  zone_name: string
  zone_type: string
  predicted_category: string
  confidence: number
  risk_level: string
  base_risk: number
  patrol_priority: number
}

interface PatrolRecommendation {
  patrol_id: number
  name: string
  assigned_zones: Array<{
    zone_id: string
    zone_name: string
    risk_level: string
    predicted_crime: string
    confidence: number
    center: [number, number]
  }>
  time_slot: string
  start_time: string
  end_time: string
  predicted_crimes: string[]
  total_risk_score: number
  recommended_officers: number
  checkpoints: Array<{
    id: number
    name: string
    lat: number
    lng: number
    zone: string
  }>
  route_coords: number[][]
}

interface DayPredictions {
  date: string
  is_holiday: boolean
  holiday_name: string | null
  weather: string
  total_predictions: number
  high_risk_count: number
  time_slots: Array<{
    slot_start: string
    slot_end: string
    slot_label: string
    hour: number
    predictions: TimeSlotPrediction[]
    high_risk_zones: TimeSlotPrediction[]
  }>
  patrol_recommendations: PatrolRecommendation[]
  model_info: {
    model_type: string
    version: string
    last_trained: string
  }
}

export default function PatrolManagement() {
  const [isAddPatrolOpen, setIsAddPatrolOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // Data from API
  const [patrols, setPatrols] = useState<Patrol[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [officers, setOfficers] = useState<PoliceOfficer[]>([])

  // AI Predictions
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [predictions, setPredictions] = useState<DayPredictions | null>(null)
  const [predictionsLoading, setPredictionsLoading] = useState(false)
  const [generatingPatrols, setGeneratingPatrols] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number>(0)

  // Form state for creating patrol
  const [formData, setFormData] = useState({
    zoneId: "",
    officerIds: [] as string[],
    scheduledStart: "",
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [patrolsData, zonesData, officersData] = await Promise.all([
        patrolsAPI.getAll(),
        zonesAPI.getAll(),
        officersAPI.getAll()
      ])
      setPatrols(Array.isArray(patrolsData) ? patrolsData : [])
      setZones(Array.isArray(zonesData) ? zonesData : [])
      setOfficers(Array.isArray(officersData) ? officersData : [])
    } catch (err) {
      console.error("Failed to fetch data:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const fetchPredictions = async () => {
    try {
      setPredictionsLoading(true)
      const data = await predictionsAPI.getDayPredictions(selectedDate, 10)
      setPredictions(data)
    } catch (err) {
      console.error("Failed to fetch predictions:", err)
    } finally {
      setPredictionsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === "ai-predictions" && selectedDate) {
      fetchPredictions()
    }
  }, [activeTab, selectedDate])

  const handleCreatePatrol = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await patrolsAPI.create({
        zoneId: formData.zoneId || undefined,
        officerIds: formData.officerIds,
        scheduledStart: formData.scheduledStart ? new Date(formData.scheduledStart).toISOString() : undefined,
      })
      setIsAddPatrolOpen(false)
      setFormData({ zoneId: "", officerIds: [], scheduledStart: "" })
      fetchData()
    } catch (err) {
      console.error("Failed to create patrol:", err)
    }
  }

  const handleGenerateAIPatrols = async (autoAssign: boolean = false) => {
    try {
      setGeneratingPatrols(true)
      await predictionsAPI.generatePatrols(selectedDate, 10, autoAssign)
      await fetchData()
      await fetchPredictions()
    } catch (err) {
      console.error("Failed to generate patrols:", err)
    } finally {
      setGeneratingPatrols(false)
    }
  }

  const handleOfficerToggle = (officerId: string) => {
    setFormData(prev => ({
      ...prev,
      officerIds: prev.officerIds.includes(officerId)
        ? prev.officerIds.filter(id => id !== officerId)
        : [...prev.officerIds, officerId]
    }))
  }

  const getZoneRisk = (zone: Zone): "High" | "Medium" | "Low" => {
    if (zone.riskBase >= 0.6) return "High"
    if (zone.riskBase >= 0.4) return "Medium"
    return "Low"
  }

  const getPatrolCountForZone = (zoneId: string) => {
    return patrols.filter(p => p.zoneId === zoneId && p.status === "ACTIVE").length
  }

  const getOfficerAvailability = (officer: PoliceOfficer) => {
    const isOnPatrol = patrols.some(
      p => p.status === "ACTIVE" && p.officers.some(o => o.id === officer.id)
    )
    return !isOnPatrol && officer.status === "ACTIVE"
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

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case "rain": return "🌧️"
      case "storm": return "⛈️"
      case "fog": return "🌫️"
      case "cloudy": return "☁️"
      default: return "☀️"
    }
  }

  const activePatrolsCount = patrols.filter(p => p.status === "ACTIVE").length

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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Patrol Management
          </h1>
          <p className="text-muted-foreground">AI-powered resource allocation and patrol deployment</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="gap-2 bg-transparent" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Send className="h-4 w-4" />
            Send Plan
          </Button>
          <Dialog open={isAddPatrolOpen} onOpenChange={setIsAddPatrolOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Patrol
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Patrol</DialogTitle>
                <DialogDescription>
                  Assign officers and zone for a new patrol unit
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePatrol} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Assigned Zone</Label>
                  <Select 
                    value={formData.zoneId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, zoneId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map(zone => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name} ({getZoneRisk(zone)} Risk)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assign Officers</Label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {officers.map(officer => {
                      const isAvailable = getOfficerAvailability(officer)
                      return (
                        <label 
                          key={officer.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 ${!isAvailable && "opacity-50"}`}
                        >
                          <input 
                            type="checkbox" 
                            disabled={!isAvailable}
                            checked={formData.officerIds.includes(officer.id)}
                            onChange={() => handleOfficerToggle(officer.id)}
                            className="rounded" 
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{officer.name || officer.email}</p>
                            <p className="text-xs text-muted-foreground">{officer.rank || "Officer"}</p>
                          </div>
                          {isAvailable ? (
                            <span className="text-xs text-success">Available</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">On Duty</span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={formData.scheduledStart}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledStart: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddPatrolOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Patrol</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="ai-predictions" className="gap-2">
            <Brain className="h-4 w-4" />
            AI Predictions
          </TabsTrigger>
          <TabsTrigger value="patrols" className="gap-2">
            <Car className="h-4 w-4" />
            Patrols
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Patrols</p>
                    <p className="text-3xl font-bold text-primary">{activePatrolsCount}</p>
                  </div>
                  <Car className="h-10 w-10 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Zones Covered</p>
                    <p className="text-3xl font-bold text-green-500">
                      {zones.filter(z => getPatrolCountForZone(z.id) > 0).length}/{zones.length}
                    </p>
                  </div>
                  <MapPin className="h-10 w-10 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">High Risk Zones</p>
                    <p className="text-3xl font-bold text-orange-500">
                      {zones.filter(z => z.riskBase >= 0.6).length}
                    </p>
                  </div>
                  <AlertTriangle className="h-10 w-10 text-orange-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Officers On Duty</p>
                    <p className="text-3xl font-bold text-blue-500">
                      {officers.filter(o => !getOfficerAvailability(o)).length}
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Map with Zones */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg">Zone Map</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active Patrols:</span>
                    <span className="text-sm font-semibold text-foreground">{activePatrolsCount}/{patrols.length}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative h-[400px] rounded-lg bg-muted overflow-hidden">
                    {/* Zone visualization */}
                    <div className="absolute inset-4 grid grid-cols-3 grid-rows-2 gap-2">
                      {zones.slice(0, 6).map((zone) => {
                        const risk = getZoneRisk(zone)
                        const patrolCount = getPatrolCountForZone(zone.id)
                        return (
                          <button
                            key={zone.id}
                            onClick={() => setSelectedZone(zone.id)}
                            className={`rounded-lg border-2 p-3 text-left transition-all ${
                              selectedZone === zone.id ? "border-primary bg-primary/10" :
                              risk === "High" ? "border-destructive/50 bg-destructive/10 hover:bg-destructive/20" :
                              risk === "Medium" ? "border-warning/50 bg-warning/10 hover:bg-warning/20" :
                              "border-success/50 bg-success/10 hover:bg-success/20"
                            }`}
                          >
                            <p className="text-xs font-medium text-foreground truncate">{zone.name}</p>
                            <div className="mt-2 flex items-center gap-1">
                              <Car className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{patrolCount}/{zone.patrolFreq}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel */}
            <div className="space-y-4">
              {/* Zone Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Zone Coverage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {zones.slice(0, 5).map((zone) => {
                    const risk = getZoneRisk(zone)
                    const patrolCount = getPatrolCountForZone(zone.id)
                    return (
                      <div 
                        key={zone.id} 
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedZone === zone.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedZone(zone.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-foreground truncate">{zone.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            risk === "High" ? "bg-destructive/10 text-destructive" :
                            risk === "Medium" ? "bg-warning/10 text-warning-foreground" :
                            "bg-success/10 text-success"
                          }`}>
                            {risk}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Patrols: {patrolCount}/{zone.patrolFreq}</span>
                          {patrolCount < zone.patrolFreq && (
                            <span className="text-destructive">Understaffed</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    onClick={() => setActiveTab("ai-predictions")}
                  >
                    <Brain className="h-4 w-4" />
                    Generate AI Patrols
                  </Button>
                  <Button variant="outline" className="w-full gap-2" onClick={() => setIsAddPatrolOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Manual Patrol
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* AI Predictions Tab */}
        <TabsContent value="ai-predictions" className="space-y-6">
          {/* AI Header */}
          <Card className="bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-purple-600/10 border-violet-500/20">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      AI Crime Prediction Engine
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      ML-powered predictions using CatBoost/XGBoost ensemble models
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                  <Button 
                    onClick={() => fetchPredictions()} 
                    disabled={predictionsLoading}
                    variant="outline"
                    className="gap-2"
                  >
                    {predictionsLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Analyze
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {predictions && (
            <>
              {/* Prediction Stats */}
              <div className="grid gap-4 md:grid-cols-5">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${predictions.is_holiday ? "bg-green-500/20" : "bg-muted"}`}>
                        <Calendar className={`h-5 w-5 ${predictions.is_holiday ? "text-green-500" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Holiday</p>
                        <p className="font-semibold text-sm">
                          {predictions.is_holiday ? predictions.holiday_name : "Regular Day"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <span className="text-2xl">{getWeatherIcon(predictions.weather)}</span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Weather</p>
                        <p className="font-semibold capitalize">{predictions.weather}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Target className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Predictions</p>
                        <p className="font-semibold">{predictions.total_predictions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">High Risk</p>
                        <p className="font-semibold">{predictions.high_risk_count}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/20">
                        <Car className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Patrols</p>
                        <p className="font-semibold">{predictions.patrol_recommendations.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Time Slots Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    24-Hour Prediction Timeline
                  </CardTitle>
                  <CardDescription>
                    Crime predictions for 2-hour time slots throughout the day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Time Slot Selector */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {predictions.time_slots.map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTimeSlot(idx)}
                          className={`flex-shrink-0 px-3 py-2 rounded-lg border transition-all ${
                            selectedTimeSlot === idx
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <p className="text-xs font-medium">{slot.slot_label}</p>
                          <p className="text-xs text-muted-foreground">
                            {slot.slot_start} - {slot.slot_end}
                          </p>
                          {slot.high_risk_zones.length > 0 && (
                            <Badge variant="destructive" className="mt-1 text-[10px] px-1.5 py-0">
                              {slot.high_risk_zones.length} High Risk
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Selected Slot Details */}
                    {predictions.time_slots[selectedTimeSlot] && (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {predictions.time_slots[selectedTimeSlot].predictions.map((pred, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border ${getRiskColor(pred.risk_level)}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm">{pred.zone_name}</p>
                                <p className="text-xs opacity-80">{pred.zone_type}</p>
                              </div>
                              <Badge variant="outline" className={getRiskColor(pred.risk_level)}>
                                {pred.risk_level}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span>Predicted Crime:</span>
                                <span className="font-medium">{pred.predicted_category}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span>Confidence:</span>
                                <span className="font-medium">{(pred.confidence * 100).toFixed(1)}%</span>
                              </div>
                              <Progress value={pred.confidence * 100} className="h-1.5" />
                              <div className="flex items-center justify-between text-xs">
                                <span>Patrol Priority:</span>
                                <span className="font-medium">{(pred.patrol_priority * 100).toFixed(0)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Patrol Recommendations */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      AI-Generated Patrol Recommendations
                    </CardTitle>
                    <CardDescription>
                      Top {predictions.patrol_recommendations.length} optimal patrol routes based on predictions
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleGenerateAIPatrols(false)}
                      disabled={generatingPatrols}
                      className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600"
                    >
                      {generatingPatrols ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Deploy Patrols
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleGenerateAIPatrols(true)}
                            disabled={generatingPatrols}
                            variant="outline"
                            className="gap-2"
                          >
                            <Users className="h-4 w-4" />
                            Auto-Assign
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Deploy patrols with automatic officer assignment</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {predictions.patrol_recommendations.map((patrol) => (
                      <Card key={patrol.patrol_id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                <Car className="h-4 w-4 text-primary" />
                                {patrol.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">{patrol.time_slot}</p>
                            </div>
                            <Badge 
                              variant={patrol.total_risk_score > 0.6 ? "destructive" : patrol.total_risk_score > 0.4 ? "default" : "secondary"}
                            >
                              Risk: {(patrol.total_risk_score * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {/* Assigned Zones */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Assigned Zones:</p>
                              <div className="flex flex-wrap gap-1">
                                {patrol.assigned_zones.map((zone, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {zone.zone_name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {/* Predicted Crimes */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Expected Crimes:</p>
                              <div className="flex flex-wrap gap-1">
                                {patrol.predicted_crimes.map((crime, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {crime}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {/* Stats */}
                            <div className="flex items-center justify-between text-xs border-t pt-2 mt-2">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span>{patrol.checkpoints.length} checkpoints</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span>{patrol.recommended_officers} officers needed</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Model Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Brain className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Model: {predictions.model_info.model_type}</p>
                        <p className="text-xs text-muted-foreground">
                          Version {predictions.model_info.version} • Last trained: {predictions.model_info.last_trained}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!predictions && !predictionsLoading && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Brain className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Predictions Loaded</h3>
                <p className="text-muted-foreground mb-4">
                  Select a date and click &quot;Analyze&quot; to generate AI crime predictions
                </p>
                <Button onClick={fetchPredictions} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Predictions
                </Button>
              </CardContent>
            </Card>
          )}

          {predictionsLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <RefreshCw className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analyzing Crime Patterns...</h3>
                <p className="text-muted-foreground">
                  Running ML models on zone data for {selectedDate}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Patrols Tab */}
        <TabsContent value="patrols" className="space-y-6">
          {/* Patrol Units Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">All Patrol Units</CardTitle>
                <CardDescription>
                  {patrols.length} total patrols • {activePatrolsCount} active
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddPatrolOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Patrol
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Unit</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Zone</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Officers</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Checkpoints</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Type</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patrols.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No patrols found. Create one to get started.
                        </td>
                      </tr>
                    ) : (
                      patrols.map((patrol) => {
                        const isAIGenerated = patrol.patrolNumber.startsWith("AI-")
                        return (
                          <tr key={patrol.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-foreground">{patrol.patrolNumber}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-foreground">{patrol.zone?.name || "Unassigned"}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground text-sm">
                                  {patrol.officers.length > 0 
                                    ? patrol.officers.map(o => o.name || o.email).join(", ") 
                                    : "-"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                patrol.status === "ACTIVE" ? "bg-success/10 text-success" :
                                patrol.status === "PAUSED" ? "bg-warning/10 text-warning-foreground" :
                                patrol.status === "COMPLETED" ? "bg-muted text-muted-foreground" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {patrol.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      patrol.totalCheckpoints > 0 
                                        ? (patrol.completedCheckpoints / patrol.totalCheckpoints) >= 0.8 ? "bg-success" :
                                          (patrol.completedCheckpoints / patrol.totalCheckpoints) >= 0.5 ? "bg-warning" :
                                          "bg-destructive"
                                        : "bg-muted"
                                    }`}
                                    style={{ 
                                      width: patrol.totalCheckpoints > 0 
                                        ? `${(patrol.completedCheckpoints / patrol.totalCheckpoints) * 100}%` 
                                        : "0%" 
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {patrol.completedCheckpoints}/{patrol.totalCheckpoints}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell">
                              {isAIGenerated ? (
                                <Badge variant="secondary" className="gap-1 text-xs">
                                  <Brain className="h-3 w-3" />
                                  AI
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Manual</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="gap-2">
                                    <Eye className="h-4 w-4" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2">
                                    <Route className="h-4 w-4" /> View Route
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2">
                                    <Users className="h-4 w-4" /> Reassign Officers
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2">
                                    <MapPin className="h-4 w-4" /> Change Zone
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Shift Schedule */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Shift Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-success/10">
                    <span className="text-sm text-foreground">Morning (6AM-2PM)</span>
                    <span className="text-xs text-success font-medium">
                      {patrols.filter(p => p.status === "ACTIVE").length} Units
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-primary/10">
                    <span className="text-sm text-foreground">Evening (2PM-10PM)</span>
                    <span className="text-xs text-primary font-medium">
                      {patrols.filter(p => p.status === "PAUSED").length} Units
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-warning/10">
                    <span className="text-sm text-foreground">Night (10PM-6AM)</span>
                    <span className="text-xs text-warning-foreground font-medium">
                      {patrols.filter(p => p.status === "COMPLETED").length} Units
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Patrol Intensity by Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {zones.slice(0, 5).map((zone) => {
                  const patrolCount = getPatrolCountForZone(zone.id)
                  const coverage = (patrolCount / zone.patrolFreq) * 100
                  return (
                    <div key={zone.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-foreground truncate">{zone.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {patrolCount}/{zone.patrolFreq} patrols
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(coverage, 100)} 
                        className={`h-2 ${coverage >= 100 ? "[&>div]:bg-success" : coverage >= 50 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"}`}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
