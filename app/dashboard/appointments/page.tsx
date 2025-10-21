import { Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import { Calendar, Clock } from "lucide-react"

export default function AppointmentsPage() {
  return (
    <div className="flex flex-col">
      <Header title="My Appointments" />

      <div className="p-8">
        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search appointments by patient name..." className="pl-10 bg-card border-border" />
          </div>
          <Button variant="outline" className="gap-2 border-border bg-card">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {/* Sample Appointment Card */}
          <Card className="border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <span className="text-lg font-semibold text-primary">JD</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">John Doe</h3>
                  <p className="text-sm text-muted-foreground">Patient ID: #12345</p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>June 15, 2022</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>10:00 AM</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-border bg-transparent">
                  Reschedule
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  View Details
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
              <p className="text-lg font-medium text-foreground">No more appointments for today</p>
              <p className="mt-1 text-sm text-muted-foreground">Check back later for new appointments</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
