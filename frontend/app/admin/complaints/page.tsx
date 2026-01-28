"use client"

import { useState, useEffect } from "react"
import { 
  Bell,
  AlertTriangle,
  MessageSquare,
  Clock,
  MapPin,
  CheckCircle,
  Filter,
  Link as LinkIcon,
  RefreshCw
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
import { complaintsAPI, alertsAPI } from "@/lib/api"
import type { Complaint, Alert } from "@/app/api/index"

export default function ComplaintsAlerts() {
  const [activeTab, setActiveTab] = useState<"complaints" | "alerts">("complaints")
  const [statusFilter, setStatusFilter] = useState("All")
  const [priorityFilter, setPriorityFilter] = useState("All")
  
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [complaintsData, alertsData, statsData] = await Promise.all([
        complaintsAPI.getAll({
          status: statusFilter !== "All" ? statusFilter : undefined,
          priority: priorityFilter !== "All" ? priorityFilter : undefined
        }),
        alertsAPI.getAll({ limit: 20 }),
        complaintsAPI.getStats()
      ])
      setComplaints(complaintsData)
      setAlerts(alertsData)
      setStats(statsData)
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter, priorityFilter])

  const handleResolve = async (id: string) => {
    const resolution = prompt("Enter resolution notes:")
    if (resolution) {
      await complaintsAPI.resolve(id, resolution)
      fetchData()
    }
  }

  const handleAcknowledge = async (id: string) => {
    await alertsAPI.acknowledge(id)
    fetchData()
  }

  const handleMarkAllRead = async () => {
    await alertsAPI.acknowledgeAll()
    fetchData()
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const minutes = Math.floor(diff / (1000 * 60))
    return `${minutes} min ago`
  }

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Complaints & Alerts</h1>
          <p className="text-muted-foreground">Public feedback and system notifications</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
            {stats?.open || 0}
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
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Priority</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Complaints Cards */}
            <div className="space-y-3">
              {complaints.map((complaint) => (
                <Card key={complaint.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        complaint.priority === "HIGH" ? "bg-destructive/10" :
                        complaint.priority === "MEDIUM" ? "bg-warning/10" :
                        "bg-muted"
                      }`}>
                        <MessageSquare className={`h-5 w-5 ${
                          complaint.priority === "HIGH" ? "text-destructive" :
                          complaint.priority === "MEDIUM" ? "text-warning-foreground" :
                          "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                {complaint.complaintNumber}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                complaint.status === "OPEN" ? "bg-destructive/10 text-destructive" :
                                complaint.status === "INVESTIGATING" ? "bg-warning/10 text-warning-foreground" :
                                "bg-success/10 text-success"
                              }`}>
                                {complaint.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-medium text-foreground">{complaint.type}</p>
                            <p className="text-sm text-muted-foreground">{complaint.description}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                            complaint.priority === "HIGH" ? "bg-destructive/10 text-destructive" :
                            complaint.priority === "MEDIUM" ? "bg-warning/10 text-warning-foreground" :
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
                            {formatTime(complaint.createdAt)}
                          </span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          {complaint.status !== "RESOLVED" && complaint.status !== "CLOSED" && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1 bg-transparent"
                                onClick={() => handleResolve(complaint.id)}
                              >
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
                    {stats?.open || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Investigating</span>
                  <span className="text-sm font-medium text-warning-foreground">
                    {stats?.investigating || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resolved</span>
                  <span className="text-sm font-medium text-success">
                    {stats?.resolved || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">By Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats?.byType && Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm text-foreground">{type}</span>
                    <span className="text-sm text-muted-foreground">{count as number}</span>
                  </div>
                ))}
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
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
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
                        alert.type === "EMERGENCY" ? "bg-destructive/10" :
                        alert.type === "HOTSPOT" ? "bg-warning/10" :
                        "bg-muted"
                      }`}>
                        {alert.type === "EMERGENCY" ? (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        ) : alert.type === "HOTSPOT" ? (
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
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(alert.createdAt)}
                          </p>
                        </div>
                        {!alert.acknowledged && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAcknowledge(alert.id)}
                          >
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
