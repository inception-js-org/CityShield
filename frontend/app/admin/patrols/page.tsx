"use client"

import { useState } from "react"
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
  Clock
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

// Mock patrol units data
const patrolUnits = [
  { id: "P-01", zone: "Sector 7", status: "Active", officers: ["John Smith", "Mike Brown"], startTime: "06:00", coverage: 85 },
  { id: "P-02", zone: "Downtown", status: "Active", officers: ["Sarah Johnson"], startTime: "08:00", coverage: 72 },
  { id: "P-03", zone: "Railway Area", status: "Break", officers: ["David Lee", "Chris Wilson"], startTime: "06:00", coverage: 65 },
  { id: "P-04", zone: "Sector 15", status: "Active", officers: ["Emily Davis"], startTime: "10:00", coverage: 90 },
  { id: "P-05", zone: "Highway Exit", status: "Inactive", officers: [], startTime: "-", coverage: 0 },
]

const zones = [
  { name: "Sector 7 - Industrial", risk: "High", patrols: 2, recommended: 3 },
  { name: "Downtown Market", risk: "Medium", patrols: 1, recommended: 2 },
  { name: "Railway Station", risk: "Medium", patrols: 1, recommended: 2 },
  { name: "Sector 15 - Residential", risk: "Low", patrols: 1, recommended: 1 },
  { name: "Highway Exit 4", risk: "Low", patrols: 0, recommended: 1 },
]

const availableOfficers = [
  { id: 1, name: "Tom Anderson", rank: "Constable", available: true },
  { id: 2, name: "Lisa Chen", rank: "Sergeant", available: true },
  { id: 3, name: "James Wilson", rank: "Constable", available: false },
  { id: 4, name: "Maria Garcia", rank: "Inspector", available: true },
]

export default function PatrolManagement() {
  const [isAddPatrolOpen, setIsAddPatrolOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patrol Management</h1>
          <p className="text-muted-foreground">Resource allocation and patrol deployment</p>
        </div>
        <div className="flex gap-2">
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
              <form className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Patrol Unit ID</Label>
                  <Input placeholder="P-XX" />
                </div>
                <div className="space-y-2">
                  <Label>Assigned Zone</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map(zone => (
                        <SelectItem key={zone.name} value={zone.name}>{zone.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assign Officers</Label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {availableOfficers.map(officer => (
                      <label key={officer.id} className={`flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 ${!officer.available && "opacity-50"}`}>
                        <input type="checkbox" disabled={!officer.available} className="rounded" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{officer.name}</p>
                          <p className="text-xs text-muted-foreground">{officer.rank}</p>
                        </div>
                        {officer.available ? (
                          <span className="text-xs text-success">Available</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">On Duty</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" />
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

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map with Zones */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Zone Map</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Active Patrols:</span>
                <span className="text-sm font-semibold text-foreground">4/5</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative h-[400px] rounded-lg bg-muted overflow-hidden">
                {/* Zone visualization */}
                <div className="absolute inset-4 grid grid-cols-3 grid-rows-2 gap-2">
                  {zones.map((zone, i) => (
                    <button
                      key={zone.name}
                      onClick={() => setSelectedZone(zone.name)}
                      className={`rounded-lg border-2 p-3 text-left transition-all ${
                        selectedZone === zone.name ? "border-primary bg-primary/10" :
                        zone.risk === "High" ? "border-destructive/50 bg-destructive/10 hover:bg-destructive/20" :
                        zone.risk === "Medium" ? "border-warning/50 bg-warning/10 hover:bg-warning/20" :
                        "border-success/50 bg-success/10 hover:bg-success/20"
                      }`}
                    >
                      <p className="text-xs font-medium text-foreground truncate">{zone.name}</p>
                      <div className="mt-2 flex items-center gap-1">
                        <Car className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{zone.patrols}/{zone.recommended}</span>
                      </div>
                    </button>
                  ))}
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Coverage</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patrolUnits.map((unit) => (
                      <tr key={unit.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{unit.id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-foreground">{unit.zone}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground text-sm">
                              {unit.officers.length > 0 ? unit.officers.join(", ") : "-"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            unit.status === "Active" ? "bg-success/10 text-success" :
                            unit.status === "Break" ? "bg-warning/10 text-warning-foreground" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {unit.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  unit.coverage >= 80 ? "bg-success" :
                                  unit.coverage >= 50 ? "bg-warning" :
                                  "bg-destructive"
                                }`}
                                style={{ width: `${unit.coverage}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{unit.coverage}%</span>
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
                    ))}
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
              {zones.map((zone) => (
                <div 
                  key={zone.name} 
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedZone === zone.name ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedZone(zone.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground truncate">{zone.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      zone.risk === "High" ? "bg-destructive/10 text-destructive" :
                      zone.risk === "Medium" ? "bg-warning/10 text-warning-foreground" :
                      "bg-success/10 text-success"
                    }`}>
                      {zone.risk}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Patrols: {zone.patrols}/{zone.recommended}</span>
                    {zone.patrols < zone.recommended && (
                      <span className="text-destructive">Understaffed</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Intensity Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Patrol Intensity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {zones.slice(0, 3).map((zone) => (
                <div key={zone.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-foreground truncate">{zone.name.split(" - ")[0]}</p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-6 w-6 bg-transparent">
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{zone.patrols}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6 bg-transparent">
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
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
                  <span className="text-xs text-success font-medium">4 Units</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-primary/10">
                  <span className="text-sm text-foreground">Evening (2PM-10PM)</span>
                  <span className="text-xs text-primary font-medium">3 Units</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-warning/10">
                  <span className="text-sm text-foreground">Night (10PM-6AM)</span>
                  <span className="text-xs text-warning-foreground font-medium">5 Units</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
