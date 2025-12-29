"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import * as QRCode from "qrcode"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Upload,
  Plus,
  Filter,
  Search,
  QrCode,
  Phone,
  Mail,
  MapPin,
  Paperclip,
  CheckCircle2,
  UserPlus,
  Droplets,
  Ruler,
  Weight,
} from "lucide-react"

type Attachment = { name: string; size: string; url?: string }
type RecordItem = {
  id: string
  patient_name: string
  patient_email?: string
  patient_phone?: string
  patient_address?: string
  avatar_url?: string
  patient_external_id?: string
  on_platform: boolean
  qr_code?: string
  consultations: number
  treatments: string[]
  prescriptions: string[]
  attachments: Attachment[]
  notes?: string
  blood_group?: string | null
  height?: number | null
  weight?: number | null
}

export default function RecordsPage() {
  const searchParams = useSearchParams()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
  const apiBase = useMemo(() => {
    if (API_URL) return API_URL
    if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "")
    return ""
  }, [API_URL])
  const patientQuery = searchParams?.get("patient")

  const [records, setRecords] = useState<RecordItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "platform" | "off">("all")
  const [form, setForm] = useState<Partial<RecordItem>>({
    patient_name: "",
    patient_email: "",
    patient_phone: "",
    patient_address: "",
    on_platform: true,
    qr_code: "",
    consultations: 0,
    treatments: [],
    prescriptions: [],
    attachments: [],
    notes: "",
  })
  const [newTreatment, setNewTreatment] = useState("")
  const [newRx, setNewRx] = useState("")
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!apiBase || !token) return
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const res = await fetch(`${apiBase}/records`, { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (res.ok) {
          const list: RecordItem[] = json.data || []
          setRecords(list)
          if (patientQuery) {
            const match = list.find(
              (r) =>
                r.patient_external_id === patientQuery ||
                r.id === patientQuery ||
                (r.qr_code && r.qr_code.toLowerCase() === patientQuery.toLowerCase()),
            )
            if (match) {
              setSelectedId(match.id)
              return
            }
          }
          if (list.length) setSelectedId(list[0].id)
        } else {
          setError(json?.message || "Unable to load records")
        }
      } catch (err) {
        setError("Unable to load records. Please check your connection.")
      } finally {
        setLoading(false)
      }
    })()
  }, [token, apiBase, patientQuery])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch = `${r.patient_name} ${r.patient_email || ""} ${r.qr_code || ""} ${r.patient_external_id || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesFilter =
        filter === "all" ? true : filter === "platform" ? r.on_platform === true : r.on_platform === false
      return matchesSearch && matchesFilter
    })
  }, [records, search, filter])

  const selected = records.find((r) => r.id === selectedId) || null

  useEffect(() => {
    if (!selected) {
      setQrDataUrl(null)
      return
    }
    const code = selected.qr_code || selected.id
    const link =
      typeof window !== "undefined"
        ? `${window.location.origin.replace(/\/$/, "")}/public/record?id=${encodeURIComponent(code)}`
        : code
    QRCode.toDataURL(link, { width: 180, margin: 1, color: { dark: "#111827", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [selected])

  const addTreatment = () => {
    if (!newTreatment.trim()) return
    if (selected) {
      setRecords((prev) =>
        prev.map((r) => (r.id === selected.id ? { ...r, treatments: [...r.treatments, newTreatment.trim()] } : r)),
      )
    }
    setForm((p) => ({ ...p, treatments: [...(p.treatments || []), newTreatment.trim()] }))
    setNewTreatment("")
  }

  const addPrescription = () => {
    if (!newRx.trim()) return
    if (selected) {
      setRecords((prev) =>
        prev.map((r) => (r.id === selected.id ? { ...r, prescriptions: [...r.prescriptions, newRx.trim()] } : r)),
      )
    }
    setForm((p) => ({ ...p, prescriptions: [...(p.prescriptions || []), newRx.trim()] }))
    setNewRx("")
  }

  const resetForm = () =>
    setForm({
      patient_name: "",
      patient_email: "",
      patient_phone: "",
      patient_address: "",
      on_platform: true,
      qr_code: "",
      consultations: 0,
      treatments: [],
      prescriptions: [],
      attachments: [],
      notes: "",
    })

  const addRecord = async () => {
    if (!form.patient_name?.trim()) return
    if (apiBase && token) {
      try {
        const res = await fetch(`${apiBase}/records`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            patient_name: form.patient_name,
            patient_email: form.patient_email,
            patient_phone: form.patient_phone,
            patient_address: form.patient_address,
            avatar_url: form.avatar_url,
            on_platform: form.on_platform,
            qr_code: form.qr_code,
            consultations: form.consultations,
            treatments: form.treatments,
            prescriptions: form.prescriptions,
            attachments: form.attachments,
            notes: form.notes,
          }),
        })
        const json = await res.json()
        if (res.ok && json?.data) {
          let newRecord = json.data
          // upload avatar file if provided
          if (newAvatarFile) {
            newRecord = await uploadAvatar(newRecord.id, newAvatarFile, json.data)
          }
          setRecords((prev) => [newRecord, ...prev])
          setSelectedId(newRecord.id)
          resetForm()
          setNewAvatarFile(null)
        }
      } catch (err) {
        // ignore for now
      }
    }
  }

  const uploadAvatar = async (recordId: string, file: File, fallback?: RecordItem) => {
    if (!token) return fallback || null
    const formData = new FormData()
    formData.append("avatar", file)
    const res = await fetch(`${apiBase}/records/${recordId}/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    const json = await res.json()
    if (res.ok && json?.data) {
      setRecords((prev) => prev.map((r) => (r.id === recordId ? json.data : r)))
      return json.data
    }
    return fallback || null
  }

  const updateRecord = async () => {
    if (!selected || !token) return
    try {
      const res = await fetch(`${apiBase}/records/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patient_name: form.patient_name || selected.patient_name,
          patient_email: form.patient_email || selected.patient_email,
          patient_phone: form.patient_phone || selected.patient_phone,
          patient_address: form.patient_address || selected.patient_address,
          avatar_url: form.avatar_url || selected.avatar_url,
          on_platform: form.on_platform ?? selected.on_platform,
          qr_code: form.qr_code || selected.qr_code,
          consultations: form.consultations ?? selected.consultations,
          notes: form.notes ?? selected.notes,
        }),
      })
      const json = await res.json()
      if (res.ok && json?.data) {
        let updated = json.data
        if (newAvatarFile) {
          updated = await uploadAvatar(selected.id, newAvatarFile, json.data)
          setNewAvatarFile(null)
        }
        if (updated) setRecords((prev) => prev.map((r) => (r.id === selected.id ? updated : r)))
      }
    } catch (err) {
      // ignore
    }
  }

  const addAttachment = async (file: File) => {
    if (!selected || !token) return
    setUploadingAttachment(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch(`${apiBase}/records/${selected.id}/attachments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const json = await res.json()
      if (res.ok && json?.data) {
        setRecords((prev) => prev.map((r) => (r.id === selected.id ? json.data : r)))
      }
    } catch (err) {
      // ignore
    } finally {
      setUploadingAttachment(false)
    }
  }

  const handleSelect = (rec: RecordItem) => {
    setSelectedId(rec.id)
    setForm({
      patient_name: rec.patient_name,
      patient_email: rec.patient_email,
      patient_phone: rec.patient_phone,
      patient_address: rec.patient_address,
      avatar_url: rec.avatar_url,
      on_platform: rec.on_platform,
      qr_code: rec.qr_code,
      consultations: rec.consultations,
      treatments: rec.treatments,
      prescriptions: rec.prescriptions,
      attachments: rec.attachments,
      notes: rec.notes,
    })
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Records" />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!token && <p className="text-sm text-muted-foreground">Please sign in again to load your patient records.</p>}
        {loading && <p className="text-sm text-muted-foreground">Loading records...</p>}
        <Card className="relative overflow-hidden border border-border bg-card">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="relative grid gap-4 p-6 lg:grid-cols-2 lg:p-8">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Patient Records</p>
              <h1 className="text-2xl font-bold text-foreground">Secure records for every patient</h1>
              <p className="text-sm text-muted-foreground">
                Keep platform and off-platform patients organized with QR codes, treatments, prescriptions, and uploads.
              </p>
              <div className="flex gap-3">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={addRecord}>
                  <Plus className="h-4 w-4 mr-2" />
                  Quick create
                </Button>
                {selected && (
                  <Button variant="outline" onClick={() => setSelectedId(null)}>
                    Clear selection
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-4">
              <div className="flex flex-col items-start rounded-lg border border-border bg-card/70 px-4 py-3 shadow-sm">
                <p className="text-xs text-muted-foreground">On-platform</p>
                <p className="text-xl font-semibold text-foreground">{records.filter((r) => r.on_platform).length}</p>
              </div>
              <div className="flex flex-col items-start rounded-lg border border-border bg-card/70 px-4 py-3 shadow-sm">
                <p className="text-xs text-muted-foreground">Off-platform</p>
                <p className="text-xl font-semibold text-foreground">{records.filter((r) => !r.on_platform).length}</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 border border-border bg-card">
            <p className="text-xs text-muted-foreground">Total Records</p>
            <p className="text-3xl font-bold text-foreground">{records.length}</p>
          </Card>
          <Card className="p-4 border border-border bg-card">
            <p className="text-xs text-muted-foreground">On-platform</p>
            <p className="text-3xl font-bold text-foreground">{records.filter((r) => r.on_platform).length}</p>
          </Card>
          <Card className="p-4 border border-border bg-card">
            <p className="text-xs text-muted-foreground">Off-platform</p>
            <p className="text-3xl font-bold text-foreground">{records.filter((r) => !r.on_platform).length}</p>
          </Card>
          <Card className="p-4 border border-border bg-card">
            <p className="text-xs text-muted-foreground">Attachments</p>
            <p className="text-3xl font-bold text-foreground">
              {records.reduce((sum, r) => sum + (r.attachments?.length || 0), 0)}
            </p>
          </Card>
        </div>

        <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
          <Card className="p-4 sm:p-6 border border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Create or update</p>
                <h3 className="text-lg font-semibold text-foreground">Record</h3>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={form.patient_name || ""}
                  onChange={(e) => setForm((p) => ({ ...p, patient_name: e.target.value }))}
                  placeholder="Patient full name"
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  value={form.patient_email || ""}
                  onChange={(e) => setForm((p) => ({ ...p, patient_email: e.target.value }))}
                  placeholder="patient@email.com"
                />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={form.patient_phone || ""}
                  onChange={(e) => setForm((p) => ({ ...p, patient_phone: e.target.value }))}
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div className="space-y-1">
                <Label>Address</Label>
                <Input
                  value={form.patient_address || ""}
                  onChange={(e) => setForm((p) => ({ ...p, patient_address: e.target.value }))}
                  placeholder="City, Country"
                />
              </div>
              <div className="space-y-1">
                <Label>Profile photo</Label>
                <label className="flex h-10 cursor-pointer items-center rounded-md border border-dashed border-border bg-muted/30 px-3 text-xs text-muted-foreground">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setNewAvatarFile(file)
                      const reader = new FileReader()
                      reader.onload = () => setForm((p) => ({ ...p, avatar_url: reader.result as string }))
                      reader.readAsDataURL(file)
                    }}
                  />
                  Upload from device
                </label>
                {form.avatar_url && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.avatar_url} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
                    <span>Preview</span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label>QR code</Label>
                <Input
                  value={form.qr_code || ""}
                  onChange={(e) => setForm((p) => ({ ...p, qr_code: e.target.value }))}
                  placeholder="Auto or manual QR"
                />
              </div>
              <div className="space-y-1">
                <Label>Consultations</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.consultations ?? 0}
                  onChange={(e) => setForm((p) => ({ ...p, consultations: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1">
                <Label>On platform?</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  value={form.on_platform ? "yes" : "no"}
                  onChange={(e) => setForm((p) => ({ ...p, on_platform: e.target.value === "yes" }))}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes || ""}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Reason, history, etc."
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Treatments</Label>
              <div className="flex gap-2">
                <Input
                  value={newTreatment}
                  onChange={(e) => setNewTreatment(e.target.value)}
                  placeholder="e.g., Antibiotics 7 days"
                />
                <Button variant="outline" onClick={addTreatment}>
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prescriptions</Label>
              <div className="flex gap-2">
                <Input value={newRx} onChange={(e) => setNewRx(e.target.value)} placeholder="e.g., Ibuprofen 400mg" />
                <Button variant="outline" onClick={addPrescription}>
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attachments (selected record)</Label>
              <label className="flex h-28 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/40">
                <div className="flex flex-col items-center text-xs text-muted-foreground">
                  <Upload className="h-5 w-5 mb-2" />
                  {uploadingAttachment ? "Uploading..." : "Upload file"}
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) addAttachment(file)
                  }}
                  disabled={!selected}
                />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <Button className="w-full bg-primary text-primary-foreground" onClick={addRecord} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Save record
              </Button>
              {selected && (
                <Button variant="outline" className="w-full" onClick={updateRecord} disabled={loading}>
                  Update selected record
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-6 border border-border bg-card lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, QR..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                >
                  <option value="all">All</option>
                  <option value="platform">On platform</option>
                  <option value="off">Off platform</option>
                </select>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              {filtered.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handleSelect(rec)}
                  className={`rounded-lg border p-4 transition-colors ${
                    rec.id === selectedId ? "border-primary bg-primary/5" : "border-border bg-card"
                  } cursor-pointer`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {rec.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={rec.avatar_url} alt={rec.patient_name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs text-foreground">
                          {rec.patient_name?.slice(0, 2).toUpperCase() || "PT"}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{rec.patient_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          {rec.patient_email && (
                            <>
                              <Mail className="h-3 w-3" />
                              {rec.patient_email}
                            </>
                          )}
                          {rec.patient_phone && (
                            <>
                              <Phone className="h-3 w-3" />
                              {rec.patient_phone}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <QrCode className="h-3 w-3" />
                      {rec.qr_code || "QR pending"}
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        rec.on_platform ? "bg-green-500/15 text-green-600" : "bg-amber-500/15 text-amber-600"
                      }`}
                    >
                      {rec.on_platform ? "On platform" : "Off platform"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {rec.consultations} consultations
                    </span>
                    <span className="flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      {rec.attachments?.length || 0} files
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selected ? (
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selected.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selected.avatar_url} alt={selected.patient_name} className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-sm text-foreground">
                        {selected.patient_name?.slice(0, 2).toUpperCase() || "PT"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Record detail</p>
                      <h4 className="text-lg font-semibold text-foreground">{selected.patient_name}</h4>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">QR: {selected.qr_code}</span>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  {selected.patient_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {selected.patient_email}
                    </div>
                  )}
                  {selected.patient_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selected.patient_phone}
                    </div>
                  )}
                  {selected.patient_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selected.patient_address}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    {selected.on_platform ? "Linked to platform patient" : "Manual record"}
                  </div>
                </div>
                {(selected.blood_group || selected.height || selected.weight) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="rounded-lg border border-border bg-white p-3 flex items-center gap-3">
                      <div className="rounded-full bg-emerald-100 text-emerald-700 p-2">
                        <Droplets className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Blood Group</p>
                        <p className="text-sm font-semibold text-foreground">{selected.blood_group || "N/A"}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-3 flex items-center gap-3">
                      <div className="rounded-full bg-emerald-100 text-emerald-700 p-2">
                        <Ruler className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Height</p>
                        <p className="text-sm font-semibold text-foreground">
                          {selected.height ? `${selected.height} cm` : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-3 flex items-center gap-3">
                      <div className="rounded-full bg-emerald-100 text-emerald-700 p-2">
                        <Weight className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Weight</p>
                        <p className="text-sm font-semibold text-foreground">
                          {selected.weight ? `${selected.weight} kg` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {selected.notes && <p className="text-sm text-foreground">Notes: {selected.notes}</p>}

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Treatments</p>
                  {selected.treatments.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selected.treatments.map((t, i) => (
                        <span key={i} className="rounded-full bg-card px-3 py-1 text-xs text-foreground border border-border">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No treatments logged.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Prescriptions</p>
                  {selected.prescriptions.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selected.prescriptions.map((t, i) => (
                        <span key={i} className="rounded-full bg-card px-3 py-1 text-xs text-foreground border border-border">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No prescriptions logged.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Attachments</p>
                  {selected.attachments.length ? (
                    selected.attachments.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Paperclip className="h-4 w-4" />
                        <a href={a.url || "#"} className="text-foreground underline" target="_blank" rel="noreferrer">
                          {a.name}
                        </a>
                        <span className="text-xs">{a.size}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No files uploaded.</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 border border-border rounded-lg bg-white">
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrDataUrl} alt="Patient QR" className="h-36 w-36 object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Generating QR...</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="font-semibold text-foreground">Patient QR</div>
                    <div>Share or scan to retrieve this record.</div>
                    <div className="text-[11px] text-muted-foreground/80">{selected.qr_code || selected.id}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a record to view details.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
