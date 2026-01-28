"use client"

import { useState } from "react"
import { 
  Bell,
  AlertTriangle,
  MessageSquare,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  ChevronRight,
  Filter,
  Link as LinkIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock complaints data
const complaints = [
  { id: "C-001", type: "Noise", description: "Loud music from neighboring building", location: "Sector 15, Block A", time: "2 hours ago", status: "Open", priority: "Low" },
  { id: "C-002", type: "Suspicious Activity", description: "Unknown person loitering near school", location: "Downtown, Main Street", time: "3 hours ago", status: "Investigating", priority: "High" },
  { id: "C-003", type: "Traffic", description: "Illegal parking blocking road", location: "Sector 7, Industrial Road", time: "5 hours ago", status: "Open", priority: "Medium" },
  { id: "C-004", type: "Public Safety", description: "Street light not working", location: "Railway Area, Platform 2", time: "8 hours ago", status: "Resolved", priority: "Low" },
  { id: "C-005", type: "Vandalism", description: "Graffiti on public property", location: "City Park", time: "1 day ago", status: "Resolved", priority: "Low" },
]

// Mock alerts data
const alerts = [
  { id: 1, type: "emergency", message: "Backup requested by Unit P-03 at Railway Station", time: "5 min ago", acknowledged: false },
  { id: 2, type: "hotspot", message: "New high-risk zone detected in Sector 7", time: "15 min ago", acknowledged: true },
  { id: 3, type: "system", message: "Patrol P-05 has ended shift", time: "1 hour ago", acknowledged: true },
  { id: 4, type: "fir", message: "New FIR filed - Theft reported at Mall", time: "2 hours ago", acknowledged: true },
  { id: 5, type: "patrol", message: "Unit P-02 checkpoint completed", time: "3 hours ago", acknowledged: true },
]

export default function ComplaintsAlerts() {
  const [activeTab, setActiveTab] = useState<"complaints" | "alerts">("complaints")
  const [statusFilter, setStatusFilter] = useState("All")
  const [priorityFilter, setPriorityFilter] = useState("All")

  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = statusFilter === "All" || c.status === statusFilter
    const matchesPriority = priorityFilter === "All" || c.priority === priorityFilter
    return matchesStatus && matchesPriority
  })

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Complaints & Alerts</h1>
          <p className="text-muted-foreground">Public feedback and system notifications</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "complaints" ? "default" : "outline"}
          onClick={() => setActiveTab("complaints")}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Complaints
          <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
            {complaints.filter(c => c.status !== "Resolved").length}
          </span>
        </Button>
        <Button
          variant={activeTab === "alerts" ? "default" : "outline"}
          onClick={() => setActiveTab("alerts")}
          className="gap-2"
        >
          <Bell className="h-4 w-4" />
          Alerts
          {unacknowledgedAlerts > 0 && (
            <span className="ml-1 rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
              {unacknowledgedAlerts}
            </span>
          )}
        </Button>
      </div>

      {/* Content */}
      {activeTab === "complaints" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Complaints List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filters:</span>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Status</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Investigating">Investigating</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Priority</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Complaints Cards */}
            <div className="space-y-3">
              {filteredComplaints.map((complaint) => (
                <Card key={complaint.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        complaint.priority === "High" ? "bg-destructive/10" :
                        complaint.priority === "Medium" ? "bg-warning/10" :
                        "bg-muted"
                      }`}>
                        <MessageSquare className={`h-5 w-5 ${
                          complaint.priority === "High" ? "text-destructive" :
                          complaint.priority === "Medium" ? "text-warning-foreground" :
                          "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">{complaint.id}</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                complaint.status === "Open" ? "bg-destructive/10 text-destructive" :
                                complaint.status === "Investigating" ? "bg-warning/10 text-warning-foreground" :
                                "bg-success/10 text-success"
                              }`}>
                                {complaint.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-medium text-foreground">{complaint.type}</p>
                            <p className="text-sm text-muted-foreground">{complaint.description}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                            complaint.priority === "High" ? "bg-destructive/10 text-destructive" :
                            complaint.priority === "Medium" ? "bg-warning/10 text-warning-foreground" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {complaint.priority}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {complaint.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {complaint.time}
                          </span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          {complaint.status !== "Resolved" && (
                            <>
                              <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                                <CheckCircle className="h-3 w-3" />
                                Resolve
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                                <AlertTriangle className="h-3 w-3" />
                                Escalate
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                                <LinkIcon className="h-3 w-3" />
                                Link to Zone
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Complaint Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Open</span>
                  <span className="text-sm font-medium text-destructive">
                    {complaints.filter(c => c.status === "Open").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Investigating</span>
                  <span className="text-sm font-medium text-warning-foreground">
                    {complaints.filter(c => c.status === "Investigating").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resolved</span>
                  <span className="text-sm font-medium text-success">
                    {complaints.filter(c => c.status === "Resolved").length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">By Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {["Noise", "Suspicious Activity", "Traffic", "Public Safety", "Vandalism"].map(type => {
                  const count = complaints.filter(c => c.type === type).length
                  return (
                    <div key={type} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="text-sm text-foreground">{type}</span>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Alerts Tab */
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Alert Timeline</CardTitle>
              <Button variant="outline" size="sm">
                Mark All Read
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert, i) => (
                  <div key={alert.id} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        alert.type === "emergency" ? "bg-destructive/10" :
                        alert.type === "hotspot" ? "bg-warning/10" :
                        "bg-muted"
                      }`}>
                        {alert.type === "emergency" ? (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        ) : alert.type === "hotspot" ? (
                          <MapPin className="h-4 w-4 text-warning-foreground" />
                        ) : (
                          <Bell className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      {i < alerts.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-6 ${!alert.acknowledged ? "opacity-100" : "opacity-70"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm ${!alert.acknowledged ? "font-medium text-foreground" : "text-foreground"}`}>
                            {alert.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                        </div>
                        {!alert.acknowledged && (
                          <Button size="sm" variant="outline">
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
