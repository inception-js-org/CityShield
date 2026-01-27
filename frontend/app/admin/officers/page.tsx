"use client"

import { useState } from "react"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  User,
  Shield,
  Phone,
  Mail,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Edit,
  Eye
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock officers data
const officers = [
  { id: 1, name: "John Smith", rank: "Inspector", badge: "INS-001", status: "On Duty", patrol: "P-01", phone: "+1 555-0101", email: "john.smith@police.gov", active: true },
  { id: 2, name: "Sarah Johnson", rank: "Sergeant", badge: "SGT-012", status: "On Duty", patrol: "P-02", phone: "+1 555-0102", email: "sarah.j@police.gov", active: true },
  { id: 3, name: "Mike Brown", rank: "Constable", badge: "CON-045", status: "On Duty", patrol: "P-01", phone: "+1 555-0103", email: "mike.b@police.gov", active: true },
  { id: 4, name: "Emily Davis", rank: "Sergeant", badge: "SGT-008", status: "On Duty", patrol: "P-04", phone: "+1 555-0104", email: "emily.d@police.gov", active: true },
  { id: 5, name: "David Lee", rank: "Constable", badge: "CON-067", status: "Break", patrol: "P-03", phone: "+1 555-0105", email: "david.l@police.gov", active: true },
  { id: 6, name: "Chris Wilson", rank: "Constable", badge: "CON-089", status: "Break", patrol: "P-03", phone: "+1 555-0106", email: "chris.w@police.gov", active: true },
  { id: 7, name: "Lisa Chen", rank: "Inspector", badge: "INS-003", status: "Available", patrol: "-", phone: "+1 555-0107", email: "lisa.c@police.gov", active: true },
  { id: 8, name: "Tom Anderson", rank: "Constable", badge: "CON-112", status: "Available", patrol: "-", phone: "+1 555-0108", email: "tom.a@police.gov", active: true },
  { id: 9, name: "Maria Garcia", rank: "Sergeant", badge: "SGT-015", status: "Off Duty", patrol: "-", phone: "+1 555-0109", email: "maria.g@police.gov", active: false },
]

const ranks = ["All Ranks", "Inspector", "Sergeant", "Constable"]
const statusFilters = ["All Status", "On Duty", "Available", "Break", "Off Duty"]

export default function OfficersManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRank, setSelectedRank] = useState("All Ranks")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredOfficers = officers.filter(officer => {
    const matchesSearch = officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         officer.badge.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRank = selectedRank === "All Ranks" || officer.rank === selectedRank
    const matchesStatus = selectedStatus === "All Status" || officer.status === selectedStatus
    return matchesSearch && matchesRank && matchesStatus
  })

  const stats = {
    total: officers.length,
    onDuty: officers.filter(o => o.status === "On Duty").length,
    available: officers.filter(o => o.status === "Available").length,
    offDuty: officers.filter(o => o.status === "Off Duty").length,
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Officers Management</h1>
          <p className="text-muted-foreground">Manage personnel and assignments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Officer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Officer</DialogTitle>
              <DialogDescription>
                Register a new officer in the system
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="badge">Badge Number</Label>
                  <Input id="badge" placeholder="XXX-000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rank">Rank</Label>
                  <Select>
                    <SelectTrigger id="rank">
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                    <SelectContent>
                      {ranks.slice(1).map(rank => (
                        <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="+1 555-0000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="officer@police.gov" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Officer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Officers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.onDuty}</p>
                <p className="text-xs text-muted-foreground">On Duty</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <User className="h-5 w-5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.available}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.offDuty}</p>
                <p className="text-xs text-muted-foreground">Off Duty</p>
              </div>
            </div>
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
                placeholder="Search by name or badge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedRank} onValueChange={setSelectedRank}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ranks.map(rank => (
                  <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Officers Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredOfficers.map((officer) => (
          <Card key={officer.id} className={!officer.active ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                    {officer.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{officer.name}</p>
                    <p className="text-sm text-muted-foreground">{officer.rank}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Eye className="h-4 w-4" /> View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <Edit className="h-4 w-4" /> Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <MapPin className="h-4 w-4" /> Assign to Patrol
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      {officer.active ? (
                        <><ToggleLeft className="h-4 w-4" /> Deactivate</>
                      ) : (
                        <><ToggleRight className="h-4 w-4" /> Activate</>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Badge</span>
                  <span className="font-mono text-foreground">{officer.badge}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    officer.status === "On Duty" ? "bg-success/10 text-success" :
                    officer.status === "Available" ? "bg-primary/10 text-primary" :
                    officer.status === "Break" ? "bg-warning/10 text-warning-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {officer.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Patrol</span>
                  <span className="text-foreground">{officer.patrol}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                <a href={`tel:${officer.phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Phone className="h-3 w-3" />
                  {officer.phone}
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
