"use client"

import { 
  History, 
  MapPin, 
  Clock,
  FileText,
  ChevronRight,
  CheckCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Mock patrol history
const patrolHistory = [
  {
    id: 1,
    date: "Today",
    zone: "Sector 7 - Industrial",
    startTime: "06:00",
    endTime: "14:00",
    checkpoints: 5,
    completedCheckpoints: 5,
    incidents: 1,
    status: "Completed"
  },
  {
    id: 2,
    date: "Yesterday",
    zone: "Downtown Market",
    startTime: "14:00",
    endTime: "22:00",
    checkpoints: 6,
    completedCheckpoints: 6,
    incidents: 2,
    status: "Completed"
  },
  {
    id: 3,
    date: "Jan 24, 2024",
    zone: "Sector 7 - Industrial",
    startTime: "06:00",
    endTime: "14:00",
    checkpoints: 5,
    completedCheckpoints: 4,
    incidents: 0,
    status: "Completed"
  },
  {
    id: 4,
    date: "Jan 23, 2024",
    zone: "Railway Station",
    startTime: "22:00",
    endTime: "06:00",
    checkpoints: 4,
    completedCheckpoints: 4,
    incidents: 3,
    status: "Completed"
  },
]

export default function PatrolHistory() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Patrol History</h1>
              <p className="text-sm text-muted-foreground">View your past patrol records</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">24</p>
            <p className="text-xs text-muted-foreground">Patrols This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">96%</p>
            <p className="text-xs text-muted-foreground">Checkpoint Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">186</p>
            <p className="text-xs text-muted-foreground">Hours Patrolled</p>
          </CardContent>
        </Card>
      </div>

      {/* Patrol Records */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Patrols</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {patrolHistory.map((patrol) => (
            <button
              key={patrol.id}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 shrink-0">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{patrol.zone}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{patrol.date}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {patrol.startTime} - {patrol.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {patrol.completedCheckpoints}/{patrol.checkpoints} checkpoints
                  </span>
                  {patrol.incidents > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {patrol.incidents} incident(s)
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Submit Report */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Submit Patrol Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Complete your patrol summary for today&apos;s shift
          </p>
          <Button className="w-full gap-2">
            <FileText className="h-4 w-4" />
            Submit Today&apos;s Report
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
