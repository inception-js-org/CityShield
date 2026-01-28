"use client"

import { useState } from "react"
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
  Signal
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Mock patrol data with bodycam status
const activePatrols = [
  { id: "P-01", officers: ["John Smith", "Mike Brown"], zone: "Sector 7", bodycam: true, status: "Recording", signal: "Strong", location: { lat: "28.6139", lng: "77.2090" } },
  { id: "P-02", officers: ["Sarah Johnson"], zone: "Downtown", bodycam: true, status: "Recording", signal: "Medium", location: { lat: "28.6280", lng: "77.2150" } },
  { id: "P-03", officers: ["David Lee", "Chris Wilson"], zone: "Railway Area", bodycam: false, status: "Offline", signal: "Weak", location: { lat: "28.6425", lng: "77.2195" } },
  { id: "P-04", officers: ["Emily Davis"], zone: "Sector 15", bodycam: true, status: "Recording", signal: "Strong", location: { lat: "28.5900", lng: "77.2300" } },
]

export default function LiveMonitoring() {
  const [selectedPatrol, setSelectedPatrol] = useState(activePatrols[0])
  const [isPlaying, setIsPlaying] = useState(true)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Monitoring</h1>
          <p className="text-muted-foreground">Bodycam feeds and patrol tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            {activePatrols.filter(p => p.bodycam).length} Active Feeds
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Feed */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-foreground/5 rounded-t-lg overflow-hidden">
                {/* Video placeholder */}
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  {selectedPatrol.bodycam ? (
                    <div className="text-center">
                      <div className="relative">
                        <div className="h-20 w-20 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                          <Video className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        {isPlaying && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive animate-pulse" />
                        )}
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">Live Feed - {selectedPatrol.id}</p>
                      <p className="text-xs text-muted-foreground/60">{selectedPatrol.zone}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Video className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                      <p className="mt-2 text-sm text-muted-foreground">Bodycam Offline</p>
                    </div>
                  )}
                </div>

                {/* Recording indicator */}
                {selectedPatrol.bodycam && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-foreground/80 px-3 py-1.5 text-background text-xs font-medium">
                    <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    REC
                  </div>
                )}

                {/* Patrol info overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="rounded-lg bg-foreground/80 px-3 py-2 text-background">
                    <p className="text-sm font-medium">{selectedPatrol.id} - {selectedPatrol.zone}</p>
                    <p className="text-xs opacity-80">{selectedPatrol.officers.join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Signal className={`h-4 w-4 ${
                      selectedPatrol.signal === "Strong" ? "text-success" :
                      selectedPatrol.signal === "Medium" ? "text-warning" :
                      "text-destructive"
                    }`} />
                    <span className="text-xs text-card">{selectedPatrol.signal}</span>
                  </div>
                </div>
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
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
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
                  {activePatrols.map((patrol, i) => (
                    <button
                      key={patrol.id}
                      onClick={() => setSelectedPatrol(patrol)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                        selectedPatrol.id === patrol.id ? "scale-125 z-10" : ""
                      }`}
                      style={{
                        top: `${20 + i * 20}%`,
                        left: `${20 + i * 18}%`,
                      }}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        selectedPatrol.id === patrol.id 
                          ? "bg-primary border-primary text-primary-foreground" 
                          : patrol.bodycam 
                            ? "bg-card border-success text-success" 
                            : "bg-card border-muted-foreground text-muted-foreground"
                      }`}>
                        <Car className="h-4 w-4" />
                      </div>
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap">
                        {patrol.id}
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
              {activePatrols.map((patrol) => (
                <button
                  key={patrol.id}
                  onClick={() => setSelectedPatrol(patrol)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    selectedPatrol.id === patrol.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className={`relative flex h-10 w-10 items-center justify-center rounded-full ${
                    patrol.bodycam ? "bg-success/10" : "bg-muted"
                  }`}>
                    <Car className={`h-5 w-5 ${patrol.bodycam ? "text-success" : "text-muted-foreground"}`} />
                    {patrol.bodycam && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{patrol.id}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        patrol.bodycam 
                          ? "bg-success/10 text-success" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {patrol.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{patrol.zone}</p>
                    <p className="text-xs text-muted-foreground truncate">{patrol.officers.join(", ")}</p>
                  </div>
                </button>
              ))}
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
              <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive bg-transparent">
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
                  <span className="font-medium text-foreground">{selectedPatrol.id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Zone</span>
                  <span className="text-foreground">{selectedPatrol.zone}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Officers</span>
                  <span className="text-foreground">{selectedPatrol.officers.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Signal</span>
                  <span className={`flex items-center gap-1 ${
                    selectedPatrol.signal === "Strong" ? "text-success" :
                    selectedPatrol.signal === "Medium" ? "text-warning-foreground" :
                    "text-destructive"
                  }`}>
                    <Signal className="h-3 w-3" />
                    {selectedPatrol.signal}
                  </span>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Officers on duty:</p>
                  {selectedPatrol.officers.map((officer, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{officer}</span>
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
