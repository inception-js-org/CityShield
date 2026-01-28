"use client"

import { useState, useEffect } from "react"
import { 
  Plus, 
  Upload, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  Trash2,
  MapPin,
  Calendar,
  FileText,
  RefreshCw,
  UserPlus
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { firsAPI, zonesAPI, officersAPI } from "@/lib/api"

// Types
interface FIR {
  id: string
  firNumber: string
  status: string
  incidentType: string
  incidentDate: string
  incidentTime?: string
  location: string
  latitude?: number
  longitude?: number
  description: string
  complainantName: string
  complainantPhone?: string
  complainantEmail?: string
  accusedName?: string
  registeredById: string
  registeredBy?: { name?: string; email: string }
  assignedToId?: string
  assignedTo?: { name?: string; email: string }
  zoneId?: string
  zone?: { name: string }
  createdAt: string
}

interface Zone {
  id: string
  name: string
}

interface Officer {
  id: string
  name?: string
  email: string
}

const crimeTypes = ["All Types", "Theft", "Assault", "Robbery", "Vandalism", "Burglary", "Vehicle Theft", "Fraud", "Murder", "Kidnapping"]
const statuses = ["All Status", "DRAFT", "FILED", "UNDER_INVESTIGATION", "CLOSED", "TRANSFERRED"]

export default function FIRManagement() {
  const [firs, setFirs] = useState<FIR[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [officers, setOfficers] = useState<Officer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCrimeType, setSelectedCrimeType] = useState("All Types")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    incidentType: "",
    incidentDate: "",
    incidentTime: "",
    location: "",
    description: "",
    complainantName: "",
    complainantPhone: "",
    complainantEmail: "",
    accusedName: "",
    zoneId: "",
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [firsData, zonesData, officersData] = await Promise.all([
        firsAPI.getAll(),
        zonesAPI.getAll(),
        officersAPI.getAll()
      ])
      setFirs(Array.isArray(firsData) ? firsData : [])
      setZones(Array.isArray(zonesData) ? zonesData : [])
      setOfficers(Array.isArray(officersData) ? officersData : [])
    } catch (err) {
      console.error("Failed to fetch data:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateFIR = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await firsAPI.create({
        incidentType: formData.incidentType,
        incidentDate: formData.incidentDate,
        incidentTime: formData.incidentTime || undefined,
        location: formData.location,
        description: formData.description,
        complainantName: formData.complainantName,
        complainantPhone: formData.complainantPhone || undefined,
        complainantEmail: formData.complainantEmail || undefined,
        accusedName: formData.accusedName || undefined,
        zoneId: formData.zoneId || undefined,
      })
      setIsAddDialogOpen(false)
      setFormData({
        incidentType: "",
        incidentDate: "",
        incidentTime: "",
        location: "",
        description: "",
        complainantName: "",
        complainantPhone: "",
        complainantEmail: "",
        accusedName: "",
        zoneId: "",
      })
      fetchData()
    } catch (err) {
      console.error("Failed to create FIR:", err)
    }
  }

  const filteredFirs = firs.filter(fir => {
    const matchesSearch = fir.firNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fir.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fir.complainantName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCrimeType = selectedCrimeType === "All Types" || fir.incidentType === selectedCrimeType
    const matchesStatus = selectedStatus === "All Status" || fir.status === selectedStatus
    return matchesSearch && matchesCrimeType && matchesStatus
  })

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "DRAFT": return "Draft"
      case "FILED": return "Filed"
      case "UNDER_INVESTIGATION": return "Under Investigation"
      case "CLOSED": return "Closed"
      case "TRANSFERRED": return "Transferred"
      default: return status
    }
  }

  const stats = {
    total: firs.length,
    filed: firs.filter(f => f.status === "FILED").length,
    investigating: firs.filter(f => f.status === "UNDER_INVESTIGATION").length,
    closed: firs.filter(f => f.status === "CLOSED").length,
  }

  if (loading) {
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
          <h1 className="text-2xl font-bold text-foreground">FIR Management</h1>
          <p className="text-muted-foreground">Manage and track First Information Reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Upload className="h-4 w-4" />
                Upload CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload FIR Data</DialogTitle>
                <DialogDescription>
                  Upload a CSV file containing FIR records
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <Button variant="outline" size="sm">Select File</Button>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button>Upload</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add FIR
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New FIR</DialogTitle>
                <DialogDescription>
                  Create a new First Information Report
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateFIR} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crimeType">Crime Type</Label>
                    <Select 
                      value={formData.incidentType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, incidentType: value }))}
                    >
                      <SelectTrigger id="crimeType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {crimeTypes.slice(1).map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.incidentDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, incidentDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={formData.incidentTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, incidentTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zone">Zone</Label>
                    <Select 
                      value={formData.zoneId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, zoneId: value }))}
                    >
                      <SelectTrigger id="zone">
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map(zone => (
                          <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <Input 
                      id="location" 
                      placeholder="Enter location or address" 
                      className="pr-10" 
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      required
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complainantName">Complainant Name</Label>
                  <Input 
                    id="complainantName" 
                    placeholder="Full name of complainant" 
                    value={formData.complainantName}
                    onChange={(e) => setFormData(prev => ({ ...prev, complainantName: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complainantPhone">Phone</Label>
                    <Input 
                      id="complainantPhone" 
                      placeholder="Phone number" 
                      value={formData.complainantPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, complainantPhone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complainantEmail">Email</Label>
                    <Input 
                      id="complainantEmail" 
                      type="email"
                      placeholder="Email address" 
                      value={formData.complainantEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, complainantEmail: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accusedName">Accused Name (if known)</Label>
                  <Input 
                    id="accusedName" 
                    placeholder="Name of accused" 
                    value={formData.accusedName}
                    onChange={(e) => setFormData(prev => ({ ...prev, accusedName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea 
                    id="description"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Detailed description of the incident..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create FIR</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total FIRs</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Filed</div>
            <div className="text-2xl font-bold text-destructive">{stats.filed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Under Investigation</div>
            <div className="text-2xl font-bold text-warning">{stats.investigating}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Closed</div>
            <div className="text-2xl font-bold text-success">{stats.closed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by FIR ID, location, or complainant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCrimeType} onValueChange={setSelectedCrimeType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {crimeTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status === "All Status" ? status : getStatusDisplay(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FIR Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">FIR Records ({filteredFirs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">FIR ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Crime Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date & Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden xl:table-cell">Complainant</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFirs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No FIRs found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  filteredFirs.map((fir) => (
                    <tr key={fir.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{fir.firNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground">{fir.incidentType}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(fir.incidentDate).toLocaleDateString()} {fir.incidentTime || ""}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                        <div className="flex items-center gap-1 max-w-[200px] truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {fir.location}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden xl:table-cell">
                        {fir.complainantName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          fir.status === "FILED" ? "bg-destructive/10 text-destructive" :
                          fir.status === "UNDER_INVESTIGATION" ? "bg-warning/10 text-warning-foreground" :
                          fir.status === "CLOSED" ? "bg-success/10 text-success" :
                          fir.status === "DRAFT" ? "bg-muted text-muted-foreground" :
                          "bg-primary/10 text-primary"
                        }`}>
                          {getStatusDisplay(fir.status)}
                        </span>
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
                              <Eye className="h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <MapPin className="h-4 w-4" /> View on Map
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <UserPlus className="h-4 w-4" /> Assign Officer
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive">
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
