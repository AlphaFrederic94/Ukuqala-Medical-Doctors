"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, Clock, Search, Filter, MapPin, Video, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"

type Appointment = {
  id: string
  doctor_id: string
  patient_external_id: string
  scheduled_at: string
  status: string
  type: string
  location?: string
  meeting_url?: string
  reason?: string
  duration_minutes?: number
  attachments?: { name: string; url: string }[]
}

type Patient = { id: string; full_name?: string; email?: string }

const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Record<string, Patient>>({})
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [reschedule, setReschedule] = useState<{ id: string | null; scheduledAt: string; duration: number; reason: string }>({
    id: null,
    scheduledAt: "",
    duration: 30,
    reason: "",
  })

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null
    if (!token) return
    setLoading(true)
    ;(async () => {
      try {
        const [apptRes, patRes] = await Promise.all([
          fetch(`${API_URL}/appointments`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/patients/doctor/list`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const apptJson = await apptRes.json()
        const patJson = await patRes.json()
        if (!apptRes.ok) throw new Error(apptJson?.message || "Failed to load appointments")
        setAppointments(apptJson.data || [])
        if (patRes.ok) {
          const map: Record<string, Patient> = {}
          ;(patJson.data || []).forEach((p: Patient) => (map[p.id] = p))
          setPatients(map)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load appointments"
        setError(message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    return appointments.filter((appt) => {
      if (statusFilter !== "all" && appt.status !== statusFilter) return false
      if (!search.trim()) return true
      const patient = patients[appt.patient_external_id]
      const hay = `${patient?.full_name || ""} ${patient?.email || ""} ${appt.type}`.toLowerCase()
      return hay.includes(search.toLowerCase())
    })
  }, [appointments, patients, search, statusFilter])

  const setUpdatedAppointment = (updated: Appointment) => {
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)))
  }

  const handleStatusChange = async (
    appt: Appointment,
    status: "confirmed" | "canceled" | "rescheduled" | "completed",
    extra: { scheduledAt?: string; durationMinutes?: number; meetingUrl?: string; reason?: string } = {}
  ) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null
    if (!token) return
    setUpdatingId(appt.id)
    try {
      const res = await fetch(`${API_URL}/appointments/${appt.id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || "Failed to update appointment")
      setUpdatedAppointment(json.data)
      setReschedule({ id: null, scheduledAt: "", duration: 30, reason: "" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update appointment"
      setError(message)
    } finally {
      setUpdatingId(null)
    }
  }

  const startReschedule = (appt: Appointment) => {
    setReschedule({
      id: appt.id,
      scheduledAt: appt.scheduled_at ? appt.scheduled_at.slice(0, 16) : "",
      duration: appt.duration_minutes || 30,
      reason: "",
    })
  }

  const submitReschedule = (appt: Appointment) => {
    if (!reschedule.scheduledAt) {
      setError("Please choose a new date & time for the reschedule.")
      return
    }
    handleStatusChange(appt, "rescheduled", {
      scheduledAt: reschedule.scheduledAt,
      durationMinutes: reschedule.duration,
      reason: reschedule.reason || "Rescheduled by doctor",
    })
  }

  const humanDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

  return (
    <div className="flex flex-col">
      <Header title="My Appointments" />

      <div className="p-8 space-y-6">
        {/* Search and Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search appointments by patient, email, or type..."
              className="pl-10 bg-card border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="canceled">Canceled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading appointments...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && filtered.length === 0 && (
          <Card className="border border-border bg-card py-16">
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-lg font-medium text-foreground">No appointments found</p>
              <p className="text-sm text-muted-foreground">Try adjusting filters or check back later.</p>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {filtered.map((appt) => {
            const patient = patients[appt.patient_external_id]
            const initials = (patient?.full_name || "P")
              .split(" ")
              .map((x) => x[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()

            return (
              <Card key={appt.id} className="border border-border bg-card p-6 space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                      <span className="text-lg font-semibold text-primary">{initials}</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">{patient?.full_name || "Patient"}</h3>
                      <p className="text-sm text-muted-foreground">{patient?.email || "No email"}</p>
                      <p className="text-xs text-muted-foreground">Patient ID: {appt.patient_external_id}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {humanDate(appt.scheduled_at)}
                        </span>
                        <span className="inline-flex items-center gap-1 capitalize">
                          <Clock className="h-4 w-4" />
                          {appt.type}
                        </span>
                        {appt.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {appt.location}
                          </span>
                        )}
                        {appt.meeting_url && (
                          <span className="inline-flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            <a href={appt.meeting_url} target="_blank" rel="noreferrer" className="underline">
                              Join link
                            </a>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <Badge
                      className={`capitalize ${
                        appt.status === "confirmed"
                          ? "bg-green-500/15 text-green-700"
                          : appt.status === "canceled"
                            ? "bg-red-500/15 text-red-700"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {appt.status}
                    </Badge>
                    {appt.reason && <p className="text-xs text-muted-foreground max-w-xs text-right">{appt.reason}</p>}
                    <div className="flex flex-wrap gap-2">
                      {appt.status !== "canceled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border"
                          onClick={() => handleStatusChange(appt, "confirmed")}
                          disabled={updatingId === appt.id || appt.status === "confirmed"}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Confirm
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border"
                        onClick={() => startReschedule(appt)}
                        disabled={updatingId === appt.id}
                      >
                        Reschedule
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          const reason = window.prompt("Reason for cancellation?") || "Canceled by doctor"
                          handleStatusChange(appt, "canceled", { reason })
                        }}
                        disabled={updatingId === appt.id || appt.status === "canceled"}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>

              </Card>
            )
          })}
        </div>
      </div>

      {reschedule.id && (
        <RescheduleModal
          appointment={appointments.find((a) => a.id === reschedule.id) || null}
          patient={patients[appointments.find((a) => a.id === reschedule.id)?.patient_external_id || ""]}
          values={reschedule}
          onChange={setReschedule}
          onClose={() => setReschedule({ id: null, scheduledAt: "", duration: 30, reason: "" })}
          onSubmit={submitReschedule}
          loading={updatingId === reschedule.id}
          humanDate={humanDate}
        />
      )}
    </div>
  )
}

type RescheduleProps = {
  appointment: Appointment | null
  patient?: Patient
  values: { id: string | null; scheduledAt: string; duration: number; reason: string }
  onChange: React.Dispatch<React.SetStateAction<{ id: string | null; scheduledAt: string; duration: number; reason: string }>>
  onClose: () => void
  onSubmit: (appt: Appointment) => void
  loading: boolean
  humanDate: (iso: string) => string
}

function RescheduleModal({ appointment, patient, values, onChange, onClose, onSubmit, loading, humanDate }: RescheduleProps) {
  if (!appointment || !values.id) return null
  const initials = (patient?.full_name || "P")
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold">
              {initials}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reschedule</p>
              <h3 className="text-xl font-semibold text-foreground">{patient?.full_name || "Patient"}</h3>
              <p className="text-xs text-muted-foreground">Current: {humanDate(appointment.scheduled_at)}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">New date & time</label>
            <Input
              type="datetime-local"
              value={values.scheduledAt}
              onChange={(e) => onChange((prev) => ({ ...prev, scheduledAt: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Duration (minutes)</label>
            <Input
              type="number"
              min={15}
              value={values.duration}
              onChange={(e) => onChange((prev) => ({ ...prev, duration: Number(e.target.value) || prev.duration }))}
            />
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <label className="text-xs text-muted-foreground">Reason</label>
          <Input
            placeholder="Reason for rescheduling"
            value={values.reason}
            onChange={(e) => onChange((prev) => ({ ...prev, reason: e.target.value }))}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onSubmit(appointment)}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </Card>
    </div>
  )
}

