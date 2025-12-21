"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Calendar, Armchair as Wheelchair, Bookmark, Star, Activity } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"

type Stats = {
  totalPatients: number
  totalAppointments: number
  confirmedAppointments: number
  avgRating: number
  dailyAppointments: { day: string; count: number }[]
  monthlyPatients: { month: string; patients: number }[]
}

type Appointment = { id: string; scheduled_at: string; status: string; type: string }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    totalAppointments: 0,
    confirmedAppointments: 0,
    avgRating: 0,
    dailyAppointments: [],
    monthlyPatients: [],
  })
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctorName, setDoctorName] = useState("Doctor")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null
    if (!token) return
    setLoading(true)
    ;(async () => {
      try {
        const [statsRes, apptRes, profileRes] = await Promise.all([
          fetch(`${API_URL}/stats/doctor`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/appointments`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (!statsRes.ok || !apptRes.ok) {
          throw new Error("Failed to load dashboard data")
        }
        const [statsJson, apptJson, profileJson] = await Promise.all([
          statsRes.json(),
          apptRes.json(),
          profileRes.ok ? profileRes.json() : Promise.resolve({}),
        ])
        setStats({
          totalPatients: statsJson?.data?.totalPatients || 0,
          totalAppointments: statsJson?.data?.totalAppointments || 0,
          confirmedAppointments: statsJson?.data?.confirmedAppointments || 0,
          avgRating: statsJson?.data?.avgRating || 0,
          dailyAppointments: statsJson?.data?.dailyAppointments || [],
          monthlyPatients: statsJson?.data?.monthlyPatients || [],
        })
        setAppointments(apptJson?.data || [])
        const name = `${profileJson?.data?.first_name || ""} ${profileJson?.data?.last_name || ""}`.trim()
        setDoctorName(name || profileJson?.data?.email || "Doctor")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load dashboard"
        setError(message)
      } finally {
        setLoading(false)
      }
    })()
  }, [API_URL])

  const upcoming = useMemo(() => appointments.slice(0, 10), [appointments])
  const pendingCount = useMemo(
    () => Math.max(stats.totalAppointments - stats.confirmedAppointments, 0),
    [stats.totalAppointments, stats.confirmedAppointments]
  )

  return (
    <div className="flex flex-col">
      <Header title="Dashboard" />

        <div className="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Welcome Banner */}
        <Card className="relative overflow-hidden border-0 bg-card p-4 sm:p-6 lg:p-8">
          <div className="relative z-10 max-w-2xl space-y-2 sm:space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
            <h2 className="text-xl sm:text-3xl font-bold text-foreground">{doctorName}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Manage your day: review appointments, monitor patient flow, and keep conversations moving.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button asChild className="bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90">
                <Link href="/dashboard/appointments">View my appointments</Link>
              </Button>
              <Button asChild variant="outline" className="border-border">
                <Link href="/dashboard/messages">Open messages</Link>
              </Button>
            </div>
          </div>
          <div
            className="absolute right-0 top-0 h-full w-1/2 bg-cover bg-center opacity-15 sm:opacity-20"
            style={{
              backgroundImage:
                "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/doctor%20pannel-mNH6Ombb9kWmJ6x1FPBnG8RLRa7BWP.png')",
              backgroundPosition: "right center",
            }}
          />
        </Card>

        {/* Status Section */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">Status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="flex items-center justify-between border border-border bg-card p-4 sm:p-6">
                <div>
                  <p className="text-3xl font-bold text-foreground">{stats.totalPatients}</p>
                  <p className="text-sm font-medium text-muted-foreground">Patients</p>
                </div>
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-blue-500/10">
                  <Wheelchair className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
              </Card>

              <Card className="flex items-center justify-between border border-border bg-card p-4 sm:p-6">
                <div>
                  <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
                  <p className="text-sm font-medium text-muted-foreground">Pending bookings</p>
                </div>
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-purple-500/10">
                  <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                </div>
              </Card>

              <Card className="flex items-center justify-between border border-border bg-card p-4 sm:p-6">
                <div>
                  <p className="text-3xl font-bold text-foreground">{stats.confirmedAppointments}</p>
                  <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                </div>
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-orange-500/10">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                </div>
              </Card>

              <Card className="flex items-center justify-between border border-border bg-card p-4 sm:p-6">
                <div>
                  <p className="text-3xl font-bold text-foreground">{stats.avgRating.toFixed(1)}</p>
                  <p className="text-sm font-medium text-muted-foreground">Avg. rating</p>
                </div>
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-amber-400/15">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
                </div>
              </Card>
            </div>
          </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border border-border bg-card p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last 14 days</p>
                <h4 className="text-lg font-semibold text-foreground">Consultations</h4>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="h-64">
              {stats.dailyAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent appointments yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.dailyAppointments}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value: number) => [`${value} appointments`, "Count"]}
                      labelFormatter={(d) => new Date(d).toLocaleDateString()}
                    />
                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="border border-border bg-card p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Patients per month</p>
                <h4 className="text-lg font-semibold text-foreground">Engagement</h4>
              </div>
            </div>
            <div className="h-64">
              {stats.monthlyPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No monthly data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyPatients}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value: number) => [`${value} patients`, "Patients"]} />
                    <Bar dataKey="patients" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Upcoming Sessions Section */}
        <div className="space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">Your upcoming sessions</h3>
          <Card className="border border-border bg-card">
            <div className="hidden sm:grid grid-cols-3 border-b border-border bg-muted/50 px-4 sm:px-6 py-4">
              <p className="text-sm font-semibold text-foreground">Type</p>
              <p className="text-sm font-semibold text-foreground">Scheduled Date</p>
              <p className="text-sm font-semibold text-foreground">Status</p>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-10">
                <p className="text-sm text-muted-foreground">Loading sessions...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-10">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {!loading && !error && upcoming.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-lg font-medium text-foreground">No upcoming sessions</p>
                <p className="mt-1 text-sm text-muted-foreground">New bookings will appear here</p>
              </div>
            )}

            {!loading && !error && upcoming.length > 0 && (
              <div className="divide-y divide-border">
                {upcoming.map((appt) => {
                  const date = new Date(appt.scheduled_at)
                  return (
                    <div
                      key={appt.id}
                      className="px-4 sm:px-6 py-4 flex flex-col sm:grid sm:grid-cols-3 gap-2"
                    >
                      <div className="flex items-center justify-between sm:block">
                        <p className="text-xs text-muted-foreground sm:hidden">Type</p>
                        <p className="text-sm text-foreground capitalize">{appt.type}</p>
                      </div>
                      <div className="flex items-center justify-between sm:block">
                        <p className="text-xs text-muted-foreground sm:hidden">Scheduled</p>
                        <p className="text-sm text-foreground">
                          {date.toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:block">
                        <p className="text-xs text-muted-foreground sm:hidden">Status</p>
                        <p className="text-sm text-muted-foreground capitalize">{appt.status}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
