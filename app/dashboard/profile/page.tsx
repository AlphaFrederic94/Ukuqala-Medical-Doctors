"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle2, AlertCircle, Star } from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts"

type DoctorProfile = {
  id?: string
  email?: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  specialty?: string
  bio?: string
  consultation_mode?: string
  availability?: { day: string; start: string; end: string }[]
  onboarding_completed?: boolean
}

type DoctorStats = {
  totalPatients: number
  totalAppointments: number
  confirmedAppointments: number
  avgRating: number
  ratingsCount?: number
  dailyAppointments?: { day: string; count: number }[]
  monthlyPatients?: { month: string; patients: number }[]
  concludedConversations?: number
  monthlyConcluded?: { month: string; concluded: number }[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

export default function ProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [stats, setStats] = useState<DoctorStats>({
    totalPatients: 0,
    totalAppointments: 0,
    confirmedAppointments: 0,
    avgRating: 0,
    ratingsCount: 0,
    dailyAppointments: [],
    monthlyPatients: [],
    concludedConversations: 0,
    monthlyConcluded: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<DoctorProfile>>({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [hoursOpen, setHoursOpen] = useState(false)

  const loadProfile = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null
    if (!token) {
      setError("No active session found. Please sign in again.")
      return
    }
    setLoading(true)
    ;(async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/stats/doctor`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const profileJson = await profileRes.json()
        const statsJson = await statsRes.json()
        if (!profileRes.ok) throw new Error(profileJson?.message || "Failed to load profile")
        if (!statsRes.ok) throw new Error(statsJson?.message || "Failed to load stats")

        setProfile(profileJson.data || {})
        setEditForm({
          first_name: profileJson.data?.first_name || "",
          last_name: profileJson.data?.last_name || "",
          specialty: profileJson.data?.specialty || "",
          bio: profileJson.data?.bio || "",
          consultation_mode: profileJson.data?.consultation_mode || "",
          availability: profileJson.data?.availability || [],
        })
        setStats({
          totalPatients: statsJson?.data?.totalPatients || 0,
          totalAppointments: statsJson?.data?.totalAppointments || 0,
          confirmedAppointments: statsJson?.data?.confirmedAppointments || 0,
          avgRating: statsJson?.data?.avgRating || 0,
          ratingsCount: statsJson?.data?.ratingsCount || 0,
          dailyAppointments: statsJson?.data?.dailyAppointments || [],
          monthlyPatients: statsJson?.data?.monthlyPatients || [],
          concludedConversations: statsJson?.data?.concludedConversations || 0,
          monthlyConcluded: statsJson?.data?.monthlyConcluded || [],
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load profile"
        setError(message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const fullName = useMemo(() => {
    const name = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
    return name || profile?.email || "Doctor"
  }, [profile])

  const consultationsData = useMemo(() => {
    const days = stats.dailyAppointments || []
    return days.map((d) => {
      const date = new Date(d.day)
      const label = date.toLocaleDateString(undefined, { weekday: "short" })
      const followUps = Math.max(Math.floor((d.count || 0) * 0.5), 0)
      return { label, consultations: d.count || 0, followUps }
    })
  }, [stats.dailyAppointments])

  const patientAnalytics = useMemo(() => {
    const months = stats.monthlyPatients || []
    const concludedMap: Record<string, number> = {}
    ;(stats.monthlyConcluded || []).forEach((c) => {
      concludedMap[c.month] = c.concluded || 0
    })
    return months.map((m) => ({
      month: m.month,
      newPatients: m.patients || 0,
      returning: Math.max(Math.floor((m.patients || 0) * 0.4), 0),
      concludedChats: concludedMap[m.month] || 0,
      total: m.patients || 0,
    }))
  }, [stats.monthlyPatients, stats.monthlyConcluded])

  const activityPercent = useMemo(() => {
    if (!stats.totalAppointments) return 0
    return Math.round((stats.confirmedAppointments / stats.totalAppointments) * 100)
  }, [stats.confirmedAppointments, stats.totalAppointments])

  const practiceHours = useMemo(() => {
    if (profile?.availability && profile.availability.length > 0) {
      return profile.availability.map((slot) => ({
        day: slot.day,
        range: `${slot.start} - ${slot.end}`,
      }))
    }
    return [
      { day: "Mon", range: "09:00 AM - 05:00 PM" },
      { day: "Tue", range: "09:00 AM - 05:00 PM" },
      { day: "Wed", range: "09:00 AM - 05:00 PM" },
      { day: "Thu", range: "09:00 AM - 05:00 PM" },
      { day: "Fri", range: "09:00 AM - 05:00 PM" },
    ]
  }, [profile?.availability])

  return (
    <div className="flex flex-col">
      <Header title="Doctor Profile" />

      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-foreground">Doctor Profile</h2>
            {profile?.email && <p className="text-sm text-muted-foreground">{profile.email}</p>}
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setEditing((prev) => !prev)}
          >
            {editing ? "Close editor" : "Edit profile"}
          </Button>
        </div>

        <div className="grid gap-3 lg:gap-4 xl:grid-cols-10 items-stretch">
          {/* Left identity column */}
          <div className="xl:col-span-3 space-y-3 flex flex-col h-full">
            <Card className="border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-col items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-muted overflow-hidden border border-border">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl sm:text-2xl font-semibold text-muted-foreground">
                      {fullName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-foreground">{fullName}</h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {profile?.specialty || "Cardiologist"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    <CheckCircle2 className="mr-1 h-4 w-4 text-green-600" />
                    {profile?.onboarding_completed ? "Active" : "Pending"}
                  </Badge>
                </div>
                {profile?.bio && <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>}
              </div>
            </Card>

            <Card className="border border-border bg-card p-4 sm:p-5 flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm sm:text-base font-semibold text-foreground">Practice Hours</h3>
                <button
                  type="button"
                  className="text-xs text-primary sm:hidden"
                  onClick={() => setHoursOpen((prev) => !prev)}
                >
                  {hoursOpen ? "Hide" : "Show"}
                </button>
              </div>
              <div className={`${hoursOpen ? "block" : "hidden"} sm:block space-y-1.5 text-sm text-muted-foreground`}>
                {practiceHours.map((slot) => (
                  <div
                    key={`${slot.day}-${slot.range}`}
                    className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1 sm:px-3 sm:py-2"
                  >
                    <span className="font-semibold text-foreground">{slot.day}:</span>
                    <span className="ml-2">{slot.range}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right performance column */}
          <div className="xl:col-span-7 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <Card className="border border-border bg-card p-3 sm:p-4">
                <p className="text-[11px] sm:text-xs text-muted-foreground">Total Patients</p>
                <p className="mt-2 text-xl sm:text-2xl font-semibold text-foreground">{stats.totalPatients}</p>
              </Card>
              <Card className="border border-border bg-card p-3 sm:p-4">
                <p className="text-[11px] sm:text-xs text-muted-foreground">Appointments</p>
                <p className="mt-2 text-xl sm:text-2xl font-semibold text-foreground">{stats.totalAppointments}</p>
              </Card>
              <Card className="border border-border bg-card p-3 sm:p-4">
                <p className="text-[11px] sm:text-xs text-muted-foreground">Satisfaction</p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-xl sm:text-2xl font-semibold text-foreground">
                    {stats.avgRating ? `${((stats.avgRating / 5) * 100).toFixed(1)}%` : "—"}
                  </p>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground">{stats.ratingsCount} reviews</span>
                </div>
              </Card>
              <Card className="border border-border bg-card p-3 sm:p-4">
                <p className="text-[11px] sm:text-xs text-muted-foreground">Concluded Chats</p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-xl sm:text-2xl font-semibold text-foreground">{stats.concludedConversations || 0}</p>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground">Engagement</span>
                </div>
              </Card>
            </div>

            <div className="grid gap-3 lg:grid-cols-3 items-stretch">
              <Card className="border border-border bg-card p-4 sm:p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">Consultations Report</p>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">This Week</h3>
                  </div>
                </div>
                <div className="mt-3 h-64 max-h-64">
                  {consultationsData.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-6 w-6" />
                      <p className="text-sm">No data yet.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={consultationsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="consultations" fill="#2563eb" radius={[4, 4, 0, 0]} name="Consultations" />
                        <Bar dataKey="followUps" fill="#a855f7" radius={[4, 4, 0, 0]} name="Follow-ups" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              <Card className="border border-border bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">Activity Stats</h3>
                  <Star className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-24 w-24">
                    <svg viewBox="0 0 36 36" className="h-24 w-24">
                      <path
                        className="text-muted"
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        strokeDasharray="100, 100"
                        strokeLinecap="round"
                      />
                      <path
                        className="text-green-500"
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        strokeDasharray={`${activityPercent}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-semibold text-foreground">{activityPercent}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {stats.confirmedAppointments} confirmed out of {stats.totalAppointments} appointments
                  </p>
                </div>
              </Card>
            </div>

            <Card className="border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Patient Analytics</h3>
              </div>
              <div className="h-72 max-h-72">
                {patientAnalytics.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-6 w-6" />
                    <p className="text-sm">No monthly data yet.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={patientAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="newPatients" fill="#2563eb" radius={[4, 4, 0, 0]} name="New Patients" />
                      <Bar dataKey="returning" fill="#9ca3af" radius={[4, 4, 0, 0]} name="Returning" />
                      <Bar dataKey="concludedChats" fill="#a855f7" radius={[4, 4, 0, 0]} name="Concluded Chats" />
                      <Bar dataKey="total" fill="#22c55e" radius={[4, 4, 0, 0]} name="Total Patients" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        </div>

        {editing && (
          <Card className="border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Edit profile</h3>
              <span className="text-xs text-muted-foreground">Update key details and save</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">First name</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={editForm.first_name || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Last name</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={editForm.last_name || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, last_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Specialty</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={editForm.specialty || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, specialty: e.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-muted-foreground">Bio</label>
                <textarea
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  rows={3}
                  value={editForm.bio || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={savingProfile}
                onClick={async () => {
                  const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null
                  if (!token) return
                  setSavingProfile(true)
                  setError(null)
                  try {
                    const res = await fetch(`${API_URL}/profile`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(editForm),
                    })
                    const json = await res.json()
                    if (!res.ok) throw new Error(json?.message || "Failed to update profile")
                    setProfile(json.data)
                    setEditing(false)
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Unable to update profile"
                    setError(message)
                  } finally {
                    setSavingProfile(false)
                  }
                }}
              >
                {savingProfile ? "Saving..." : "Save changes"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={savingProfile}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  )
}
