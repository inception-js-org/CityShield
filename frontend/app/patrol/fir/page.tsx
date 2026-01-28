"use client"

import React from "react"

import { useState } from "react"
import { 
  FileText, 
  MapPin, 
  Camera, 
  Send,
  Save,
  Navigation,
  CheckCircle
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
  "Other"
]

export default function FieldFIR() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [location, setLocation] = useState("")
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const handleGetLocation = () => {
    setIsGettingLocation(true)
    // Simulate GPS fetch
    setTimeout(() => {
      setLocation("28.6139° N, 77.2090° E - Sector 7, Industrial Area")
      setIsGettingLocation(false)
    }, 1000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="p-4 space-y-4">
        <Card className="border-success/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">FIR Submitted Successfully</h2>
            <p className="text-muted-foreground mt-2">Reference: FIR-2024-089</p>
            <p className="text-sm text-muted-foreground mt-1">
              The report has been sent to the Command Center
            </p>
            <Button onClick={() => setIsSubmitted(false)} className="mt-6">
              File Another Report
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
              <h1 className="font-semibold text-foreground">Field FIR</h1>
              <p className="text-sm text-muted-foreground">On-ground incident reporting</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FIR Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">New Incident Report</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Crime Type */}
            <div className="space-y-2">
              <Label htmlFor="crimeType">Incident Type *</Label>
              <Select required>
                <SelectTrigger id="crimeType">
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  {crimeTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter location or use GPS"
                    className="pr-10"
                    required
                  />
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  className="gap-2 bg-transparent"
                >
                  <Navigation className="h-4 w-4" />
                  {isGettingLocation ? "Getting..." : "GPS"}
                </Button>
              </div>
              {location && (
                <p className="text-xs text-success flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Location captured
                </p>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input 
                  id="date" 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input 
                  id="time" 
                  type="time" 
                  defaultValue={new Date().toTimeString().slice(0, 5)}
                  required 
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Detailed description of the incident..."
                required
              />
            </div>

            {/* Involved Parties */}
            <div className="space-y-2">
              <Label htmlFor="parties">Involved Parties (optional)</Label>
              <Input 
                id="parties" 
                placeholder="Names or descriptions of people involved"
              />
            </div>

            {/* Media Upload */}
            <div className="space-y-2">
              <Label>Attach Evidence (optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Take a photo or upload from gallery
                </p>
                <div className="flex justify-center gap-2">
                  <Button type="button" variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
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
              <Button type="button" variant="outline" className="flex-1 gap-2 bg-transparent">
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button type="submit" className="flex-1 gap-2">
                <Send className="h-4 w-4" />
                Submit FIR
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
