"use client"

import { useState } from "react"
import { 
  Settings,
  MapPin,
  AlertTriangle,
  Sliders,
  FileText,
  Save
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function AdminSettings() {
  const [riskThreshold, setRiskThreshold] = useState(70)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">System configuration and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Zone Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Zone Management
            </CardTitle>
            <CardDescription>Configure patrol zones and boundaries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {["Sector 7", "Downtown", "Railway Area", "Sector 15", "Highway Exit"].map((zone, i) => (
                <div key={zone} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-sm font-medium">
                      {i + 1}
                    </div>
                    <span className="text-sm text-foreground">{zone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Switch defaultChecked />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              <MapPin className="h-4 w-4 mr-2" />
              Add New Zone
            </Button>
          </CardContent>
        </Card>

        {/* Crime Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Crime Categories
            </CardTitle>
            <CardDescription>Manage crime type classifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {["Theft", "Assault", "Robbery", "Vandalism", "Burglary", "Vehicle Theft", "Fraud"].map((crime) => (
                <div key={crime} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm text-foreground">{crime}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Switch defaultChecked />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              <FileText className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </CardContent>
        </Card>

        {/* Risk Threshold */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sliders className="h-5 w-5" />
              Risk Threshold Tuning
            </CardTitle>
            <CardDescription>Adjust AI prediction sensitivity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>High Risk Threshold</Label>
                  <span className="text-sm font-medium text-foreground">{riskThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="90"
                  value={riskThreshold}
                  onChange={(e) => setRiskThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Zones with risk score above this threshold will be marked as high-risk
                </p>
              </div>

              <div className="space-y-2">
                <Label>Medium Risk Range</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="px-2 py-1 rounded bg-muted">50%</span>
                  <span>to</span>
                  <span className="px-2 py-1 rounded bg-muted">{riskThreshold - 1}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Low Risk Range</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="px-2 py-1 rounded bg-muted">0%</span>
                  <span>to</span>
                  <span className="px-2 py-1 rounded bg-muted">49%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alert Settings
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">New Hotspot Alerts</p>
                <p className="text-xs text-muted-foreground">Get notified when new hotspots are detected</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Backup Requests</p>
                <p className="text-xs text-muted-foreground">Alert when patrol units request backup</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">FIR Submissions</p>
                <p className="text-xs text-muted-foreground">Notify on new FIR submissions</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Shift Changes</p>
                <p className="text-xs text-muted-foreground">Alert on patrol shift changes</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">System Logs</p>
                <p className="text-xs text-muted-foreground">Include system events in alerts</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
