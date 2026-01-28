"use client"

import React, { useEffect, useState } from "react"
import {
  FileText,
  Camera,
  Send,
  Save,
  CheckCircle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const crimeTypes = [
  "Theft",
  "Assault",
  "Robbery",
  "Vandalism",
  "Burglary",
  "Vehicle Theft",
  "Fraud",
  "Suspicious Activity",
  "Other",
]

/* ---------------- Types ---------------- */

interface Zone {
  id: string | number
  name: string
  type: string
  coords: string
}

/* ---------------- Component ---------------- */

export default function FieldFIR() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [crimeType, setCrimeType] = useState("")
  const [location, setLocation] = useState("")
  const [zones, setZones] = useState<Zone[]>([])
  const [loadingZones, setLoadingZones] = useState(true)

  /* -------- Fetch zones -------- */
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await fetch("http://localhost:8000/zones")

        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`)
        }

        const data = await res.json()
        console.log("Zones API response:", data)
        setZones(data)
      } catch (err) {
        console.error("Failed to load zones:", err)
        setZones([])
      } finally {
        setLoadingZones(false)
      }
    }

    fetchZones()
  }, [])

  /* -------- Submit -------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!crimeType || !location) {
      alert("Please fill all required fields")
      return
    }

    setIsSubmitted(true)
  }

  /* -------- Success Screen -------- */
  if (isSubmitted) {
    return (
      <div className="p-4 space-y-4">
        <Card className="border-success/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold">FIR Submitted Successfully</h2>
            <p className="text-muted-foreground mt-2">
              Reference: FIR-2024-089
            </p>
            <Button onClick={() => setIsSubmitted(false)} className="mt-6">
              File Another Report
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* -------- Form -------- */
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">Field FIR</h1>
              <p className="text-sm text-muted-foreground">
                On-ground incident reporting
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>New Incident Report</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Crime Type */}
            <div className="space-y-2">
              <Label>Incident Type *</Label>
              <Select value={crimeType} onValueChange={setCrimeType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  {crimeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location *</Label>
              <Select
                value={location}
                onValueChange={setLocation}
                disabled={loadingZones}
                required
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingZones
                        ? "Loading zones..."
                        : "Select location zone"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {zones.length === 0 && !loadingZones && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No zones available
                    </div>
                  )}

                  {zones.map((zone, idx) => {
  const display = `${zone.name}, ${zone.type}, ${zone.coords}`
  return (
    <SelectItem key={idx} value={display}>
      {display}
    </SelectItem>
  )
})}

                </SelectContent>
              </Select>

              {location && (
                <p className="text-xs text-success flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Location selected
                </p>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input
                  type="time"
                  defaultValue={new Date().toTimeString().slice(0, 5)}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description *</Label>
              <textarea
                className="w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Detailed description of the incident..."
                required
              />
            </div>

            {/* Involved Parties */}
            <div className="space-y-2">
              <Label>Involved Parties (optional)</Label>
              <Input placeholder="Names or descriptions" />
            </div>

            {/* Media */}
            <div className="space-y-2">
              <Label>Attach Evidence (optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Take a photo or upload
                </p>
                <div className="flex justify-center gap-2">
                  <Button type="button" variant="outline" size="sm">
                    Camera
                  </Button>
                  <Button type="button" variant="outline" size="sm">
                    Upload
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button type="submit" className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Submit FIR
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
