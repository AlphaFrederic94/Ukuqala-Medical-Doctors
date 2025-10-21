import { Calendar, Armchair as Wheelchair, Bookmark, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"

export default function DashboardPage() {
  return (
    <div className="flex flex-col">
      <Header title="Dashboard" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Welcome Banner */}
        <Card className="relative mb-8 overflow-hidden border-0 bg-card p-4 sm:p-6 lg:p-8">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-2 text-sm font-medium text-muted-foreground">Welcome!</p>
            <h2 className="mb-4 text-2xl sm:text-3xl font-bold text-foreground">Dr. Ukuqala</h2>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Thanks for joining with us. We are always trying to get you a complete service
              <br className="hidden sm:block" />
              You can view your daily schedule, Reach Patients Appointment at home!
            </p>
            <Button className="bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90">
              View My Appointments
            </Button>
          </div>
          <div
            className="absolute right-0 top-0 h-full w-1/2 bg-cover bg-center opacity-20"
            style={{
              backgroundImage:
                "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/doctor%20pannel-mNH6Ombb9kWmJ6x1FPBnG8RLRa7BWP.png')",
              backgroundPosition: "right center",
            }}
          />
        </Card>

        {/* Status Section */}
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-semibold text-foreground">Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {/* All Doctors Card */}
            <Card className="flex items-center justify-between border border-border bg-card p-6">
              <div>
                <p className="text-3xl font-bold text-foreground">1</p>
                <p className="text-sm font-medium text-muted-foreground">All Doctors</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
            </Card>

            {/* All Patients Card */}
            <Card className="flex items-center justify-between border border-border bg-card p-6">
              <div>
                <p className="text-3xl font-bold text-foreground">2</p>
                <p className="text-sm font-medium text-muted-foreground">All Patients</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-500/10">
                <Wheelchair className="h-6 w-6 text-blue-500" />
              </div>
            </Card>

            {/* New Booking Card */}
            <Card className="flex items-center justify-between border border-border bg-card p-6">
              <div>
                <p className="text-3xl font-bold text-foreground">1</p>
                <p className="text-sm font-medium text-muted-foreground">NewBooking</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-purple-500/10">
                <Bookmark className="h-6 w-6 text-purple-500" />
              </div>
            </Card>

            {/* Today Sessions Card */}
            <Card className="flex items-center justify-between border border-border bg-card p-6">
              <div>
                <p className="text-3xl font-bold text-foreground">0</p>
                <p className="text-sm font-medium text-muted-foreground">Today Sessions</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-orange-500/10">
                <Calendar className="h-6 w-6 text-orange-500" />
              </div>
            </Card>
          </div>
        </div>

        {/* Upcoming Sessions Section */}
        <div>
          <h3 className="mb-4 text-lg sm:text-xl font-semibold text-foreground">
            Your Up Coming Sessions until Next week
          </h3>
          <Card className="border border-border bg-card overflow-x-auto">
            <div className="hidden sm:grid grid-cols-3 border-b border-border bg-muted/50 px-6 py-4">
              <p className="text-sm font-semibold text-foreground">Session Title</p>
              <p className="text-sm font-semibold text-foreground">Scheduled Date</p>
              <p className="text-sm font-semibold text-foreground">Time</p>
            </div>

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="mb-4 h-32 w-32" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="100" r="8" fill="#10b981" />
                <circle cx="140" cy="100" r="8" fill="#10b981" />
                <path d="M100 50 L95 80 L105 80 Z" fill="#10b981" />
                <circle cx="100" cy="45" r="5" fill="#10b981" />
                <path d="M50 100 Q50 70 60 60 L65 65" stroke="#10b981" strokeWidth="2" fill="none" />
                <path d="M150 100 Q150 70 140 60 L135 65" stroke="#10b981" strokeWidth="2" fill="none" />
              </svg>
              <p className="text-lg font-medium text-foreground">We couldn't find anything related to your</p>
              <p className="mt-1 text-sm text-muted-foreground">keywords</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
