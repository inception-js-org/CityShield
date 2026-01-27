"use client"

import { useState } from "react"
import { 
  Video, 
  VideoOff,
  AlertTriangle,
  Signal,
  Battery,
  HardDrive,
  Send
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function BodycamControl() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true)
      // Start timer
      const interval = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
      // Store interval ID for cleanup
      ;(window as Window & { recordingInterval?: ReturnType<typeof setInterval> }).recordingInterval = interval
    } else {
      setIsRecording(false)
      setRecordingTime(0)
      // Clear timer
      const interval = (window as Window & { recordingInterval?: ReturnType<typeof setInterval> }).recordingInterval
      if (interval) clearInterval(interval)
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-4 space-y-4">
      {/* Camera Preview */}
      <Card>
        <CardContent className="p-0">
          <div className="relative aspect-video bg-foreground/5 rounded-t-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              {isRecording ? (
                <div className="text-center">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
                      <Video className="h-12 w-12 text-destructive" />
                    </div>
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-destructive-foreground animate-pulse" />
                    </span>
                  </div>
                  <p className="mt-4 text-lg font-mono font-medium text-foreground">{formatTime(recordingTime)}</p>
                  <p className="text-sm text-destructive">Recording in progress</p>
                </div>
              ) : (
                <div className="text-center">
                  <VideoOff className="h-16 w-16 text-muted-foreground/40 mx-auto" />
                  <p className="mt-4 text-sm text-muted-foreground">Camera standby</p>
                  <p className="text-xs text-muted-foreground/60">Tap Start to begin recording</p>
                </div>
              )}
            </div>

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-destructive px-3 py-1.5 text-destructive-foreground text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-destructive-foreground animate-pulse" />
                REC
              </div>
            )}

            {/* Time overlay */}
            <div className="absolute bottom-4 right-4 text-sm font-mono text-card bg-foreground/70 px-2 py-1 rounded">
              {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={toggleRecording}
              className={`gap-2 px-8 ${isRecording ? "bg-destructive hover:bg-destructive/90" : ""}`}
            >
              {isRecording ? (
                <>
                  <VideoOff className="h-5 w-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Video className="h-5 w-5" />
                  Start Recording
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Camera Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Camera Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Signal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Signal Strength</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((bar) => (
                  <div 
                    key={bar} 
                    className={`w-1 rounded-full ${
                      bar <= 3 ? "bg-success" : "bg-muted"
                    }`}
                    style={{ height: `${bar * 4 + 4}px` }}
                  />
                ))}
              </div>
              <span className="text-sm text-success ml-2">Good</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Battery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-3/4 rounded-full bg-success" />
              </div>
              <span className="text-sm text-foreground">75%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-primary" />
              </div>
              <span className="text-sm text-foreground">12.4 GB free</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Status</span>
            </div>
            <span className={`text-sm font-medium ${isRecording ? "text-destructive" : "text-success"}`}>
              {isRecording ? "Recording" : "Ready"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
            disabled={!isRecording}
          >
            <AlertTriangle className="h-4 w-4" />
            Send Live Alert to Admin
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
            <Send className="h-4 w-4" />
            Stream to Command Center
          </Button>
        </CardContent>
      </Card>

      {/* Recording Info */}
      {isRecording && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                <Video className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Recording Active</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Video is being saved locally and synced to Command Center. 
                  Do not turn off the device.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
