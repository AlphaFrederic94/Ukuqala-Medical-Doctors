import { Calendar, Clock, Video, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"

export default function SessionsPage() {
  return (
    <div className="flex flex-col">
      <Header title="My Sessions" />

      <div className="p-8">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <Card className="border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Today's Sessions</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Video className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">5</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground">Total Patients</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Sessions List */}
        <div>
          <h3 className="mb-4 text-xl font-semibold text-foreground">Upcoming Sessions</h3>
          <div className="space-y-4">
            {/* Sample Session Card */}
            <Card className="border border-border bg-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">General Consultation</h3>
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/20">Scheduled</Badge>
                  </div>
                  <div className="mb-3 flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>June 10, 2022</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>2:00 PM - 3:00 PM</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>3 Patients</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Regular checkup and consultation session for scheduled patients
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-border bg-transparent">
                    Cancel
                  </Button>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Start Session
                  </Button>
                </div>
              </div>
            </Card>

            {/* Empty State */}
            <Card className="border border-border bg-card py-16">
              <div className="flex flex-col items-center justify-center">
                <svg className="mb-4 h-32 w-32" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="100" r="8" fill="#10b981" />
                  <circle cx="140" cy="100" r="8" fill="#10b981" />
                  <path d="M100 50 L95 80 L105 80 Z" fill="#10b981" />
                  <circle cx="100" cy="45" r="5" fill="#10b981" />
                  <path d="M50 100 Q50 70 60 60 L65 65" stroke="#10b981" strokeWidth="2" fill="none" />
                  <path d="M150 100 Q150 70 140 60 L135 65" stroke="#10b981" strokeWidth="2" fill="none" />
                </svg>
                <p className="text-lg font-medium text-foreground">No more sessions scheduled</p>
                <p className="mt-1 text-sm text-muted-foreground">Your upcoming sessions will appear here</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
