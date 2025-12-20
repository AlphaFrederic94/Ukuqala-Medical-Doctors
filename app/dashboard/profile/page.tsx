"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, MapPin, Clock, CheckCircle2, AlertCircle, Upload, Star, Activity } from "lucide-react"
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
  phone?: string
  address?: string
  education?: string
  experience_years?: number
  specialty?: string
  country?: string
  city?: string
  timezone?: string
  languages?: string[]
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
  const [avatarInput, setAvatarInput] = useState("")
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<DoctorProfile>>({})
  const [savingProfile, setSavingProfile] = useState(false)

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
        setAvatarInput(profileJson.data?.avatar_url || "")
        setEditForm({
          first_name: profileJson.data?.first_name || "",
          last_name: profileJson.data?.last_name || "",
          phone: profileJson.data?.phone || "",
          address: profileJson.data?.address || "",
          education: profileJson.data?.education || "",
          experience_years: profileJson.data?.experience_years || 0,
          specialty: profileJson.data?.specialty || "",
          country: profileJson.data?.country || "",
          city: profileJson.data?.city || "",
          timezone: profileJson.data?.timezone || "",
          consultation_mode: profileJson.data?.consultation_mode || "",
          bio: profileJson.data?.bio || "",
          languages: profileJson.data?.languages || [],
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

  return (
    <div className="flex flex-col">
      <Header title="Doctor Profile" />

      <div className="p-6 lg:p-10 space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted overflow-hidden border border-border">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted-foreground">
                    {fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{fullName}</h1>
                <p className="text-sm text-muted-foreground">{profile?.specialty || "Medical Professional"}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {profile?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> {profile.email}
                </div>
              )}
              {profile?.timezone && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {profile.timezone}
                </div>
              )}
              {profile?.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {profile.city}
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Phone:</span> {profile.phone}
                </div>
              )}
              {profile?.address && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Address:</span> {profile.address}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-green-500 text-green-600">
                <CheckCircle2 className="mr-1 h-4 w-4 text-green-600" />
                {profile?.onboarding_completed ? "Active" : "Pending"}
              </Badge>
              {profile?.consultation_mode && (
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 capitalize">
                  {profile.consultation_mode} consults
                </Badge>
              )}
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Total Patients: <span className="font-semibold text-foreground">{stats.totalPatients}</span> • Appointments:{" "}
              <span className="font-semibold text-foreground">{stats.totalAppointments}</span>
            </div>
            {(profile?.education || profile?.bio || profile?.experience_years) && (
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                {profile.education && (
                  <div>
                    <span className="font-semibold text-foreground">Education: </span>
                    {profile.education}
                  </div>
                )}
                {profile.experience_years !== undefined && (
                  <div>
                    <span className="font-semibold text-foreground">Experience: </span>
                    {profile.experience_years} years
                  </div>
                )}
                {profile.bio && (
                  <div>
                    <span className="font-semibold text-foreground">Bio: </span>
                    {profile.bio}
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 border-t border-border pt-4">
              <div className="text-sm font-semibold text-foreground mb-2">Update photo</div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Image URL"
                    value={avatarInput}
                    onChange={(e) => setAvatarInput(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={savingAvatar || !avatarInput}
                    onClick={async () => {
                      if (!avatarInput) return
                      const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null
                      if (!token) return
                      setSavingAvatar(true)
                      try {
                        const res = await fetch(`${API_URL}/profile`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ avatar_url: avatarInput }),
                        })
                        const json = await res.json()
                        if (!res.ok) throw new Error(json?.message || "Failed to update avatar")
                        setProfile((prev) => ({ ...prev, avatar_url: avatarInput }))
                      } catch (err) {
                        const message = err instanceof Error ? err.message : "Unable to update avatar"
                        setError(message)
                      } finally {
                        setSavingAvatar(false)
                      }
                    }}
                  >
                    {savingAvatar ? "Saving..." : "Save"}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    Upload from device
                  </label>
                  {file && <span className="text-xs text-muted-foreground truncate max-w-[180px]">{file.name}</span>}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!file || uploadingFile}
                    onClick={async () => {
                      if (!file) return
                      const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null
                      if (!token) return
                      setUploadingFile(true)
                      setError(null)
                      try {
                        const formData = new FormData()
                        formData.append("avatar", file)
                        const res = await fetch(`${API_URL}/profile/avatar`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` },
                          body: formData,
                        })
                        const json = await res.json()
                        if (!res.ok) throw new Error(json?.message || "Failed to upload avatar")
                        setProfile((prev) => ({ ...prev, avatar_url: json?.data?.avatar_url }))
                        setAvatarInput(json?.data?.avatar_url || "")
                        setFile(null)
                      } catch (err) {
                        const message = err instanceof Error ? err.message : "Unable to upload avatar"
                        setError(message)
                      } finally {
                        setUploadingFile(false)
                      }
                    }}
                  >
                    {uploadingFile ? "Uploading..." : "Upload"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Max 5MB. Images only.</p>
              </div>
            </div>
          </Card>

          <Card className="border border-border bg-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consultations Report</p>
                <h3 className="text-lg font-semibold text-foreground">This Week</h3>
              </div>
            </div>
            <div className="mt-4 h-64">
              {consultationsData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
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
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Patients</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold text-foreground">{stats.totalPatients}</p>
              <span className="text-xs text-green-600">+12.5%</span>
            </div>
          </Card>
          <Card className="border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Appointments</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold text-foreground">{stats.totalAppointments}</p>
              <span className="text-xs text-green-600">+8.2%</span>
            </div>
          </Card>
          <Card className="border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Satisfaction</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold text-foreground">
                {stats.avgRating ? `${((stats.avgRating / 5) * 100).toFixed(1)}%` : "—"}
              </p>
              <span className="text-xs text-muted-foreground">{stats.ratingsCount} reviews</span>
            </div>
          </Card>
          <Card className="border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Concluded Chats</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-bold text-foreground">{stats.concludedConversations || 0}</p>
              <span className="text-xs text-green-600">Engagement</span>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border border-border bg-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground">Patient Analytics</h3>
            </div>
            <div className="h-64">
              {patientAnalytics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No monthly data yet.</p>
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

          <Card className="border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Activity Stats</h3>
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

        <div className="flex gap-2">
          <Button variant="outline" className="border-border" onClick={loadProfile} disabled={loading}>
            <Activity className="mr-2 h-4 w-4" />
            {loading ? "Refreshing..." : "Refresh data"}
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setEditing((prev) => !prev)}
          >
            {editing ? "Close editor" : "Edit profile"}
          </Button>
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
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Phone</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Address</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={editForm.address || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Education</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={editForm.education || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, education: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Experience (years)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={editForm.experience_years ?? ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, experience_years: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Country</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={editForm.country || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, country: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">City</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={editForm.city || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Timezone</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={editForm.timezone || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, timezone: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Consultation mode</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={editForm.consultation_mode || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, consultation_mode: e.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-muted-foreground">Languages (comma separated)</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={Array.isArray(editForm.languages) ? editForm.languages.join(", ") : ""}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      languages: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
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
