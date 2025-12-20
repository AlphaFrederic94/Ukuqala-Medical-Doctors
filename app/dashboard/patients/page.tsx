"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
  const detailRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null
    if (!token) return
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/patients/doctor/list`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || "Failed to load patients")
        setPatients(data.data || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load patients"
        setError(message)
      } finally {
        setLoading(false)
      }
    })()
  }, [API_URL])

  const activeCount = useMemo(() => patients.filter((p) => p.onboarding_completed).length, [patients])
  const newThisMonth = useMemo(() => {
    const now = new Date()
    return patients.filter((p) => {
      if (!p.created_at) return false
      const created = new Date(p.created_at)
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()
    }).length
  }, [patients])
  const pendingCount = useMemo(() => Math.max(patients.length - activeCount, 0), [patients.length, activeCount])

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const hay = `${p.full_name || ""} ${p.email || ""} ${p.phone || ""}`.toLowerCase()
      return hay.includes(searchQuery.toLowerCase())
    })
  }, [patients, searchQuery])

  return (
    <div className="flex flex-col">
      <Header title="My Patients" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients by name, ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">{patients.length}</p>
            <p className="text-sm text-muted-foreground">Total Patients</p>
          </Card>
          <Card className="border border-border bg-card p-4">
            <p className="text-2xl font-bold text-primary">{activeCount}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </Card>
          <Card className="border border-border bg-card p-4">
            <p className="text-2xl font-bold text-blue-500">{newThisMonth}</p>
            <p className="text-sm text-muted-foreground">New This Month</p>
          </Card>
          <Card className="border border-border bg-card p-4">
            <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </Card>
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Loading patients...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!loading &&
            !error &&
            filtered.map((p) => {
              const initials = (p.full_name || "P").split(" ").map((x: string) => x[0]).join("").slice(0, 2).toUpperCase()
              return (
                <Card key={p.id} className="border border-border bg-card p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-blue-500/20">
                        <span className="text-xl font-semibold text-blue-500">{initials || "PT"}</span>
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">{p.full_name || "Patient"}</h3>
                          <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                            {p.onboarding_completed ? "Active" : "Pending"}
                          </Badge>
                        </div>
                        <p className="mb-3 text-sm text-muted-foreground">Patient ID: {p.id}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{p.email || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{p.phone || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{p.address || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border bg-transparent w-full sm:w-auto"
                        onClick={() => {
                          setSelected(p)
                          requestAnimationFrame(() => {
                            detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                          })
                        }}
                      >
                        View History
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                        onClick={() =>
                          router.push(`/dashboard/records?patient=${encodeURIComponent(p.patient_external_id || p.id)}`)
                        }
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
        </div>

        {selected && (
          <Card ref={detailRef} className="mt-6 border border-border bg-card p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Patient Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Full Name</p>
                <p className="text-foreground font-semibold">{selected.full_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="text-foreground font-semibold">{selected.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="text-foreground font-semibold">{selected.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Address</p>
                <p className="text-foreground font-semibold">{selected.address || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Onboarding</p>
                <p className="text-foreground font-semibold">{selected.onboarding_completed ? "Completed" : "Pending"}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              History view will link to medical records; use Records for full patient timeline.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
