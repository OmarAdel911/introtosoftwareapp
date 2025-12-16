"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, Clock, Calendar, Image as ImageIcon } from "lucide-react"

interface TimeEntry {
  id: string
  jobId: string
  jobTitle: string
  startTime: Date
  endTime?: Date
  duration?: number
  description?: string
  screenshots: string[]
}

export default function TimeTrackingPage() {
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    {
      id: "1",
      jobId: "1",
      jobTitle: "Website Development",
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(),
      duration: 60,
      description: "Working on the homepage design",
      screenshots: ["/screenshots/homepage1.jpg"]
    },
    {
      id: "2",
      jobId: "2",
      jobTitle: "Mobile App Development",
      startTime: new Date(Date.now() - 7200000),
      endTime: new Date(Date.now() - 3600000),
      duration: 120,
      description: "Implementing user authentication",
      screenshots: ["/screenshots/auth1.jpg", "/screenshots/auth2.jpg"]
    }
  ])

  const [selectedJob, setSelectedJob] = useState("")
  const [description, setDescription] = useState("")
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeTimer) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeTimer])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startTimer = () => {
    if (!selectedJob) return
    setActiveTimer({
      id: Date.now().toString(),
      jobId: selectedJob,
      jobTitle: "Current Project", // This would come from job selection
      startTime: new Date(),
      screenshots: []
    })
  }

  const stopTimer = () => {
    if (activeTimer) {
      const endTime = new Date()
      const duration = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 60000)
      const newEntry = {
        ...activeTimer,
        endTime,
        duration,
        description
      }
      setTimeEntries([newEntry, ...timeEntries])
      setActiveTimer(null)
      setElapsedTime(0)
      setDescription("")
    }
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Time Tracking</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Timer Card */}
        <Card>
          <CardHeader>
            <CardTitle>Timer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Website Development</SelectItem>
                  <SelectItem value="2">Mobile App Development</SelectItem>
                </SelectContent>
              </Select>

              <Textarea
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="text-4xl font-mono text-center py-4">
                {formatTime(elapsedTime)}
              </div>

              <div className="flex justify-center">
                {!activeTimer ? (
                  <Button
                    size="lg"
                    onClick={startTimer}
                    disabled={!selectedJob}
                    className="w-32"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={stopTimer}
                    variant="destructive"
                    className="w-32"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{entry.jobTitle}</h3>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {entry.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{entry.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {entry.startTime.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {entry.screenshots.length > 0 && (
                    <div className="flex-shrink-0">
                      <img
                        src={entry.screenshots[0]}
                        alt="Screenshot"
                        className="w-16 h-16 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 