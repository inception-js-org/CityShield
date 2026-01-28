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
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { patrolsAPI, zonesAPI, officersAPI } from "@/lib/api"
import type { Patrol, Zone, PoliceOfficer } from "@/app/api/index"

export default function PatrolManagement() {
  const [isAddPatrolOpen, setIsAddPatrolOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data from API
  const [patrols, setPatrols] = useState<Patrol[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [officers, setOfficers] = useState<PoliceOfficer[]>([])

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

  useEffect(() => {
    fetchData()
  }, [])

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
          <h1 className="text-2xl font-bold text-foreground">Patrol Management</h1>
          <p className="text-muted-foreground">Resource allocation and patrol deployment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Send className="h-4 w-4" />
            Send Plan to Leaders
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

          {/* Patrol Units Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patrol Units</CardTitle>
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
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patrols.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No patrols found. Create one to get started.
                        </td>
                      </tr>
                    ) : (
                      patrols.map((patrol) => (
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
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
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
                      ))
                    )}
                  </tbody>
                </table>
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
              {zones.map((zone) => {
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

          {/* Intensity Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Patrol Intensity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {zones.slice(0, 3).map((zone) => {
                const patrolCount = getPatrolCountForZone(zone.id)
                return (
                  <div key={zone.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-foreground truncate">{zone.name}</p>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-6 w-6 bg-transparent">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{patrolCount}</span>
                        <Button variant="outline" size="icon" className="h-6 w-6 bg-transparent">
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Schedule */}
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
        </div>
      </div>
    </div>
  )
}
