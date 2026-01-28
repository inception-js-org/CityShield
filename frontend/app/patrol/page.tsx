"use client"

import Link from "next/link"
import { 
  MapPin, 
  AlertTriangle, 
  Navigation,
  Play,
  Bell,
  Shield,
  ChevronRight,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Mock data for the patrol leader
const assignedZone = {
  name: "Sector 7 - Industrial Area",
  risk: "High",
  checkpoints: 5,
  completedCheckpoints: 2,
}

const activeAlerts = [
  { id: 1, message: "Suspicious activity reported near warehouse", time: "5 min ago", priority: "High" },
  { id: 2, message: "Traffic congestion at main intersection", time: "15 min ago", priority: "Medium" },
]

const riskSpots = [
  { name: "Warehouse District", risk: 85 },
  { name: "Loading Bay Area", risk: 72 },
  { name: "Junction Point", risk: 58 },
]

export default function PatrolDashboard() {
  return (
    <div className="p-4 space-y-4">
      {/* Status Banner */}
      <Card className="border-success/50 bg-success/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">On Duty</p>
                <p className="text-xs text-muted-foreground">Shift started at 06:00 AM</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">Unit P-01</p>
              <p className="text-xs text-muted-foreground">2 Officers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Zone */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Assigned Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{assignedZone.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    assignedZone.risk === "High" ? "bg-destructive/10 text-destructive" :
                    assignedZone.risk === "Medium" ? "bg-warning/10 text-warning-foreground" :
                    "bg-success/10 text-success"
                  }`}>
                    {assignedZone.risk} Risk
                  </span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Checkpoints Progress</span>
                <span className="font-medium text-foreground">
                  {assignedZone.completedCheckpoints}/{assignedZone.checkpoints}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full rounded-full bg-success"
                  style={{ width: `${(assignedZone.completedCheckpoints / assignedZone.checkpoints) * 100}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/patrol/route">
                <Button className="w-full gap-2">
                  <Navigation className="h-4 w-4" />
                  View Route
                </Button>
              </Link>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Play className="h-4 w-4" />
                Start Patrol
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Risk Level */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning-foreground" />
            High-Risk Spots in Your Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riskSpots.map((spot) => (
              <div key={spot.name} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{spot.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        spot.risk >= 70 ? "bg-destructive" :
                        spot.risk >= 50 ? "bg-warning" :
                        "bg-success"
                      }`}
                      style={{ width: `${spot.risk}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium w-8 ${
                    spot.risk >= 70 ? "text-destructive" :
                    spot.risk >= 50 ? "text-warning-foreground" :
                    "text-success"
                  }`}>
                    {spot.risk}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-destructive" />
            Active Alerts
          </CardTitle>
          <Link href="/patrol/alerts">
            <Button variant="ghost" size="sm" className="text-primary">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeAlerts.map((alert) => (
            <div key={alert.id} className="flex gap-3 p-3 rounded-lg border border-border">
              <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                alert.priority === "High" ? "bg-destructive" : "bg-warning"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{alert.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                </div>
              </div>
            </div>
          ))}
          {activeAlerts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No active alerts</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Link href="/patrol/fir">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 bg-transparent">
              <MapPin className="h-5 w-5" />
              <span className="text-xs">File FIR</span>
            </Button>
          </Link>
          <Link href="/patrol/alerts">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-xs">Request Backup</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
