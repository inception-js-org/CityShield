"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const API_BASE = "http://localhost:8000/api"

type Officer = {
  id: string
  name: string
  email: string
  rank: string
  badge?: string
  phone?: string
  status: "ACTIVE" | "INVITED" | "SUSPENDED"
}

export default function OfficersManagement() {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRank, setSelectedRank] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const [form, setForm] = useState({
    name: "",
    email: "",
    rank: "",
    badge: "",
    phone: "",
  })

  /* ================= FETCH OFFICERS ================= */

  async function fetchOfficers() {
    try {
      const res = await fetch(`${API_BASE}/officers`)
      const data = await res.json()

      // ✅ HARD GUARANTEE: officers is always an array
      if (Array.isArray(data)) {
        setOfficers(data)
      } else if (Array.isArray(data.data)) {
        setOfficers(data.data)
      } else {
        console.warn("Unexpected officers response:", data)
        setOfficers([])
      }
    } catch (err) {
      console.error(err)
      setOfficers([])
    }
  }

  useEffect(() => {
    fetchOfficers()
  }, [])

  /* ================= ADD OFFICER ================= */

  async function handleAddOfficer(e: React.FormEvent) {
    e.preventDefault()

    await fetch(`${API_BASE}/officers/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    setIsAddDialogOpen(false)
    setForm({ name: "", email: "", rank: "", badge: "", phone: "" })

    await fetchOfficers()
  }

  /* ================= FILTERING ================= */

  const filteredOfficers = officers.filter(o => {
    const matchSearch =
      o.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.badge?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchRank = selectedRank === "All" || o.rank === selectedRank
    const matchStatus = selectedStatus === "All" || o.status === selectedStatus

    return matchSearch && matchRank && matchStatus
  })

  /* ================= STATS ================= */

  const stats = {
    total: officers.length,
    active: officers.filter(o => o.status === "ACTIVE").length,
    invited: officers.filter(o => o.status === "INVITED").length,
    suspended: officers.filter(o => o.status === "SUSPENDED").length,
  }

  /* ================= UI ================= */

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Officers Management</h1>
          <p className="text-muted-foreground">
            Invite and manage police officers
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Officer
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Officer</DialogTitle>
              <DialogDescription>
                This will send an invitation email.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddOfficer} className="space-y-4">
              <Input placeholder="Full Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />

              <Input placeholder="Email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />

              <Input placeholder="Rank"
                value={form.rank}
                onChange={e => setForm({ ...form, rank: e.target.value })}
              />

              <Input placeholder="Badge"
                value={form.badge}
                onChange={e => setForm({ ...form, badge: e.target.value })}
              />

              <Input placeholder="Phone"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />

              <Button type="submit">Send Invitation</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="Active" value={stats.active} />
        <Stat label="Invited" value={stats.invited} />
        <Stat label="Suspended" value={stats.suspended} />
      </div>

      {/* SEARCH */}
      <Input
        placeholder="Search officers..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      {/* OFFICERS GRID */}
      <div className="grid grid-cols-3 gap-4">
        {filteredOfficers.map(o => (
          <Card key={o.id}>
            <CardContent className="p-4 space-y-2">
              <div className="font-semibold">{o.name}</div>
              <div className="text-sm text-muted-foreground">{o.rank}</div>
              <div className="text-xs">{o.email}</div>
              <div className="text-xs">Badge: {o.badge || "-"}</div>

              <span className={`text-xs px-2 py-1 rounded
                ${o.status === "ACTIVE" ? "bg-green-100 text-green-700"
                  : o.status === "INVITED" ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"}`}>
                {o.status}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}