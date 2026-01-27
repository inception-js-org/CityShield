"use client"

import { useState } from "react"
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
  FileText
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

// Mock FIR data
const mockFirs = [
  { id: "FIR-2024-001", crimeType: "Theft", date: "2024-01-15", time: "14:30", location: "Sector 7, Main Road", status: "Open" },
  { id: "FIR-2024-002", crimeType: "Assault", date: "2024-01-15", time: "18:45", location: "Downtown Market", status: "Under Investigation" },
  { id: "FIR-2024-003", crimeType: "Robbery", date: "2024-01-14", time: "22:10", location: "Railway Station", status: "Open" },
  { id: "FIR-2024-004", crimeType: "Vandalism", date: "2024-01-14", time: "03:20", location: "Sector 15, Park Area", status: "Closed" },
  { id: "FIR-2024-005", crimeType: "Burglary", date: "2024-01-13", time: "01:15", location: "Industrial Zone", status: "Under Investigation" },
  { id: "FIR-2024-006", crimeType: "Vehicle Theft", date: "2024-01-13", time: "11:00", location: "City Mall Parking", status: "Open" },
  { id: "FIR-2024-007", crimeType: "Fraud", date: "2024-01-12", time: "16:30", location: "Commercial District", status: "Closed" },
  { id: "FIR-2024-008", crimeType: "Theft", date: "2024-01-12", time: "09:45", location: "Sector 3, Residential", status: "Open" },
]

const crimeTypes = ["All Types", "Theft", "Assault", "Robbery", "Vandalism", "Burglary", "Vehicle Theft", "Fraud"]
const statuses = ["All Status", "Open", "Under Investigation", "Closed"]

export default function FIRManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCrimeType, setSelectedCrimeType] = useState("All Types")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const filteredFirs = mockFirs.filter(fir => {
    const matchesSearch = fir.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fir.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCrimeType = selectedCrimeType === "All Types" || fir.crimeType === selectedCrimeType
    const matchesStatus = selectedStatus === "All Status" || fir.status === selectedStatus
    return matchesSearch && matchesCrimeType && matchesStatus
  })

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FIR Management</h1>
          <p className="text-muted-foreground">Manage and track First Information Reports</p>
        </div>
        <div className="flex gap-2">
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
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New FIR</DialogTitle>
                <DialogDescription>
                  Create a new First Information Report
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crimeType">Crime Type</Label>
                    <Select>
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
                    <Label htmlFor="date">Date & Time</Label>
                    <Input id="date" type="datetime-local" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <Input id="location" placeholder="Enter location or use GPS" className="pr-10" />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea 
                    id="description"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Detailed description of the incident..."
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by FIR ID or location..."
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
                  <SelectItem key={status} value={status}>{status}</SelectItem>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFirs.map((fir) => (
                  <tr key={fir.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{fir.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground">{fir.crimeType}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {fir.date} {fir.time}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {fir.location}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        fir.status === "Open" ? "bg-destructive/10 text-destructive" :
                        fir.status === "Under Investigation" ? "bg-warning/10 text-warning-foreground" :
                        "bg-success/10 text-success"
                      }`}>
                        {fir.status}
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
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive">
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
