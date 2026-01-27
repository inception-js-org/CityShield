"use client"

import { useState } from "react"
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
  const completedCount = checkpoints.filter(c => c.completed).length

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
          <div className="relative h-[250px] rounded-lg bg-muted overflow-hidden">
            {/* Simple route visualization */}
            <div className="absolute inset-0 p-4">
              {/* Grid background */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full">
                  <defs>
                    <pattern id="routeGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#routeGrid)" />
                </svg>
              </div>

              {/* Route line */}
              <svg className="absolute inset-4" viewBox="0 0 300 200">
                <path
                  d="M 30 40 L 100 60 L 180 80 L 220 140 L 270 160"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  className="text-primary"
                />
              </svg>

              {/* Checkpoint markers */}
              {checkpoints.map((checkpoint, i) => {
                const positions = [
                  { x: "10%", y: "20%" },
                  { x: "33%", y: "30%" },
                  { x: "55%", y: "40%" },
                  { x: "70%", y: "65%" },
                  { x: "88%", y: "75%" },
                ]
                return (
                  <div
                    key={checkpoint.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: positions[i].x, top: positions[i].y }}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      checkpoint.completed
                        ? "bg-success border-success text-success-foreground"
                        : "bg-card border-border text-muted-foreground"
                    }`}>
                      {checkpoint.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-medium">{checkpoint.id}</span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Hotspot markers */}
              <div className="absolute top-[45%] left-[40%] transform -translate-x-1/2 -translate-y-1/2">
                <div className="h-6 w-6 rounded-full bg-destructive/30 animate-pulse flex items-center justify-center">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-2 left-2 flex gap-3 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-card/90">
                <CheckCircle className="h-3 w-3 text-success" />
                <span className="text-muted-foreground">Visited</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-card/90">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-muted-foreground">Hotspot</span>
              </div>
            </div>
          </div>
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
