"use client"

import { useState } from "react"
import { 
  AlertTriangle, 
  Phone,
  MapPin,
  Navigation,
  Shield,
  Radio,
  Send,
  Users
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Mock nearby units
const nearbyUnits = [
  { id: "P-02", distance: "1.2 km", officers: 1, status: "Available" },
  { id: "P-04", distance: "2.5 km", officers: 1, status: "On Patrol" },
  { id: "P-03", distance: "3.8 km", officers: 2, status: "On Break" },
]

export default function AlertsBackup() {
  const [emergencySent, setEmergencySent] = useState(false)
  const [backupRequested, setBackupRequested] = useState(false)

  const handleEmergency = () => {
    setEmergencySent(true)
    // Reset after 5 seconds for demo
    setTimeout(() => setEmergencySent(false), 5000)
  }

  const handleBackupRequest = () => {
    setBackupRequested(true)
    // Reset after 5 seconds for demo
    setTimeout(() => setBackupRequested(false), 5000)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Emergency Button */}
      <Card className={`border-2 ${emergencySent ? "border-success bg-success/5" : "border-destructive"}`}>
        <CardContent className="p-6 text-center">
          {emergencySent ? (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 mb-4">
                <Shield className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-xl font-bold text-success">Alert Sent!</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Command Center has been notified. Help is on the way.
              </p>
            </>
          ) : (
            <>
              <Button
                onClick={handleEmergency}
                className="h-24 w-24 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground mb-4"
              >
                <AlertTriangle className="h-12 w-12" />
              </Button>
              <h2 className="text-xl font-bold text-destructive">Emergency Alert</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Press to immediately alert Command Center and share your location
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Request Backup */}
      <Card className={backupRequested ? "border-success/50 bg-success/5" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Request Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backupRequested ? (
            <div className="text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-3">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm font-medium text-success">Backup Requested</p>
              <p className="text-xs text-muted-foreground mt-1">Nearby units have been notified</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Request additional patrol units to your location
              </p>
              <Button onClick={handleBackupRequest} className="w-full gap-2">
                <Send className="h-4 w-4" />
                Request Backup
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Nearby Patrol Units */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Nearby Patrol Units
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {nearbyUnits.map((unit) => (
            <div key={unit.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Unit {unit.id}</p>
                  <p className="text-xs text-muted-foreground">{unit.officers} officer(s)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{unit.distance}</p>
                <p className={`text-xs ${
                  unit.status === "Available" ? "text-success" :
                  unit.status === "On Patrol" ? "text-primary" :
                  "text-muted-foreground"
                }`}>
                  {unit.status}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact Admin */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Contact Command Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
            <Phone className="h-4 w-4" />
            Call Command Center
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
            <Radio className="h-4 w-4" />
            Open Radio Channel
          </Button>
        </CardContent>
      </Card>

      {/* Share Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location Sharing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Live Location</p>
              <p className="text-xs text-muted-foreground">Sharing with Command Center</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-success">Active</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted text-sm">
            <p className="font-mono text-xs text-foreground">28.6139° N, 77.2090° E</p>
            <p className="text-xs text-muted-foreground mt-1">Sector 7, Industrial Area</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
