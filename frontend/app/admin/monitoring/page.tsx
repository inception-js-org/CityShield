"use client"

import { useState, useEffect } from "react"
import { 
  Video,
  Radio,
  MapPin,
  AlertTriangle,
  Phone,
  MessageSquare,
  Car,
  User,
  Play,
  Pause,
  Volume2,
  Maximize,
  Signal,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { patrolsAPI, alertsAPI } from "@/lib/api"
import type { Patrol, SignalStrength, BodycamStatus } from "@/app/api/index"

export default function LiveMonitoring() {
  const [patrols, setPatrols] = useState<Patrol[]>([])
  const [selectedPatrol, setSelectedPatrol] = useState<Patrol | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPatrols = async () => {
    try {
      setLoading(true)
      const data = await patrolsAPI.getActive()
      setPatrols(data)
      if (data.length > 0 && !selectedPatrol) {
        setSelectedPatrol(data[0])
      }
    } catch (err) {
      setError("Failed to fetch patrols")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatrols()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchPatrols, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleAlertPatrol = async () => {
    if (!selectedPatrol) return
    try {
      await alertsAPI.createEmergency(
        `Alert sent to patrol ${selectedPatrol.patrolNumber}`,
        selectedPatrol.id,
        selectedPatrol.zoneId || undefined
      )
      alert("Alert sent successfully!")
    } catch (err) {
      console.error("Failed to send alert:", err)
    }
  }

  const getSignalColor = (signal: SignalStrength) => {
    switch (signal) {
      case "STRONG": return "text-success"
      case "MEDIUM": return "text-warning"
      case "WEAK": return "text-destructive"
      default: return "text-muted-foreground"
    }
  }

  const isBodycamActive = (status: BodycamStatus) => {
    return status === "RECORDING"
  }

  if (loading && patrols.length === 0) {
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
          <h1 className="text-2xl font-bold text-foreground">Live Monitoring</h1>
          <p className="text-muted-foreground">Bodycam feeds and patrol tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={fetchPatrols} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            {patrols.filter(p => isBodycamActive(p.bodycamStatus)).length} Active Feeds
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Feed */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-foreground/5 rounded-t-lg overflow-hidden">
                {/* Video placeholder */}
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  {selectedPatrol && isBodycamActive(selectedPatrol.bodycamStatus) ? (
                    <div className="text-center">
                      <div className="relative">
                        <div className="h-20 w-20 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                          <Video className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        {isPlaying && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive animate-pulse" />
                        )}
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">
                        Live Feed - {selectedPatrol.patrolNumber}
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        {selectedPatrol.zone?.name || "Unassigned Zone"}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Video className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        {selectedPatrol ? "Bodycam Offline" : "No patrol selected"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Recording indicator */}
                {selectedPatrol && isBodycamActive(selectedPatrol.bodycamStatus) && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-foreground/80 px-3 py-1.5 text-background text-xs font-medium">
                    <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    REC
                  </div>
                )}

                {/* Patrol info overlay */}
                {selectedPatrol && (
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div className="rounded-lg bg-foreground/80 px-3 py-2 text-background">
                      <p className="text-sm font-medium">
                        {selectedPatrol.patrolNumber} - {selectedPatrol.zone?.name || "Unassigned"}
                      </p>
                      <p className="text-xs opacity-80">
                        {selectedPatrol.officers.map(o => o.name || o.email).join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Signal className={`h-4 w-4 ${getSignalColor(selectedPatrol.signalStrength)}`} />
                      <span className="text-xs text-card">{selectedPatrol.signalStrength}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 bg-transparent"
                    onClick={handleAlertPatrol}
                    disabled={!selectedPatrol}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Alert Patrol
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Phone className="h-4 w-4" />
                    Contact
                  </Button>
                  <Button variant="outline" size="icon">
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Patrol Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-[250px] rounded-lg bg-muted overflow-hidden">
                {/* Simple map visualization */}
                <div className="absolute inset-0">
                  {/* Grid */}
                  <div className="absolute inset-0 opacity-20">
                    <svg className="w-full h-full">
                      <defs>
                        <pattern id="monitorGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#monitorGrid)" />
                    </svg>
                  </div>

                  {/* Patrol markers */}
                  {patrols.map((patrol, i) => (
                    <button
                      key={patrol.id}
                      onClick={() => setSelectedPatrol(patrol)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                        selectedPatrol?.id === patrol.id ? "scale-125 z-10" : ""
                      }`}
                      style={{
                        top: `${20 + i * 20}%`,
                        left: `${20 + i * 18}%`,
                      }}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        selectedPatrol?.id === patrol.id 
                          ? "bg-primary border-primary text-primary-foreground" 
                          : isBodycamActive(patrol.bodycamStatus) 
                            ? "bg-card border-success text-success" 
                            : "bg-card border-muted-foreground text-muted-foreground"
                      }`}>
                        <Car className="h-4 w-4" />
                      </div>
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap">
                        {patrol.patrolNumber}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Active Patrols List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active Patrols</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {patrols.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active patrols
                </p>
              ) : (
                patrols.map((patrol) => (
                  <button
                    key={patrol.id}
                    onClick={() => setSelectedPatrol(patrol)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                      selectedPatrol?.id === patrol.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className={`relative flex h-10 w-10 items-center justify-center rounded-full ${
                      isBodycamActive(patrol.bodycamStatus) ? "bg-success/10" : "bg-muted"
                    }`}>
                      <Car className={`h-5 w-5 ${
                        isBodycamActive(patrol.bodycamStatus) ? "text-success" : "text-muted-foreground"
                      }`} />
                      {isBodycamActive(patrol.bodycamStatus) && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{patrol.patrolNumber}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isBodycamActive(patrol.bodycamStatus) 
                            ? "bg-success/10 text-success" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {patrol.bodycamStatus}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {patrol.zone?.name || "Unassigned Zone"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {patrol.officers.map(o => o.name || o.email).join(", ")}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <MessageSquare className="h-4 w-4" />
                Broadcast Message
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Radio className="h-4 w-4" />
                Open Radio Channel
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 text-destructive hover:text-destructive bg-transparent"
                onClick={async () => {
                  await alertsAPI.createEmergency("Emergency alert to all patrols")
                  alert("Emergency alert sent to all patrols!")
                }}
              >
                <AlertTriangle className="h-4 w-4" />
                Emergency Alert All
              </Button>
            </CardContent>
          </Card>

          {/* Selected Patrol Details */}
          {selectedPatrol && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Patrol Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Unit</span>
                  <span className="font-medium text-foreground">{selectedPatrol.patrolNumber}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Zone</span>
                  <span className="text-foreground">{selectedPatrol.zone?.name || "Unassigned"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Officers</span>
                  <span className="text-foreground">{selectedPatrol.officers.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Signal</span>
                  <span className={`flex items-center gap-1 ${getSignalColor(selectedPatrol.signalStrength)}`}>
                    <Signal className="h-3 w-3" />
                    {selectedPatrol.signalStrength}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Checkpoints</span>
                  <span className="text-foreground">
                    {selectedPatrol.completedCheckpoints}/{selectedPatrol.totalCheckpoints}
                  </span>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Officers on duty:</p>
                  {selectedPatrol.officers.map((officer) => (
                    <div key={officer.id} className="flex items-center gap-2 py-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{officer.name || officer.email}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
