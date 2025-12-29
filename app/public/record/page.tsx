"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Droplets,
  Activity,
  Ruler,
  Weight,
  FileText,
  Stethoscope,
  CalendarDays,
} from "lucide-react"

type Attachment = { name?: string; url?: string; size?: string }

type PublicProfile = {
  full_name?: string | null
  age?: number | null
  gender?: string | null
  blood_group?: string | null
  height?: number | null
  weight?: number | null
  avatar_url?: string | null
  primary_condition?: string | null
  medical_file_url?: string | null
}

type PublicRecord = {
  id: string
  qr_code?: string | null
  patient_name: string
  patient_email?: string | null
  patient_phone?: string | null
  patient_address?: string | null
  avatar_url?: string | null
  on_platform?: boolean
  consultations?: number | null
  treatments: string[]
  prescriptions: string[]
  attachments: Attachment[]
  notes?: string | null
  created_at?: string | null
  profile?: PublicProfile | null
}

function formatDate(dateString?: string | null) {
  if (!dateString) return ""
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export default function PublicRecordPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [record, setRecord] = useState<PublicRecord | null>(null)

  useEffect(() => {
    setMounted(true)
    const params = new URLSearchParams(window.location.search)
    const id = params.get("id")?.trim()

    if (!id) {
      setError("Missing record identifier from QR code.")
      setLoading(false)
      return
    }
    if (!apiBase) {
      setError("API base URL is not configured.")
      setLoading(false)
      return
    }

    const fetchRecord = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${apiBase}/public/records/${encodeURIComponent(id)}`)
        const json = await res.json()
        if (!res.ok || !json?.data) {
          throw new Error(json?.message || "Could not load record.")
        }
        setRecord(json.data as PublicRecord)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load record.")
      } finally {
        setLoading(false)
      }
    }

    fetchRecord()
  }, [apiBase])

  const avatar = useMemo(() => {
    if (!record) return null
    return record.profile?.avatar_url || record.avatar_url || null
  }, [record])

  const initials = useMemo(() => {
    if (!record) return ""
    const base = record.profile?.full_name || record.patient_name
    return base
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("")
  }, [record])

  const vitalStats = useMemo(() => {
    const profile = record?.profile
    return [
      { label: "Blood Group", value: profile?.blood_group || "N/A", icon: Droplets },
      { label: "Height", value: profile?.height ? `${profile.height} cm` : "N/A", icon: Ruler },
      { label: "Weight", value: profile?.weight ? `${profile.weight} kg` : "N/A", icon: Weight },
      { label: "Consultations", value: record?.consultations ?? 0, icon: Activity },
    ]
  }, [record])

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style jsx global>{`
        @media print {
          body {
            background: #fff;
          }
          .record-shell {
            box-shadow: none !important;
            border-color: #e2e8f0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-4 no-print">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">Patient record</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Summary</h1>
          </div>
          {record?.qr_code && (
            <div className="text-right">
              <p className="text-xs text-slate-500">QR reference</p>
              <p className="text-sm font-semibold text-slate-800">QR-{record.qr_code}</p>
            </div>
          )}
        </div>

        <div className="record-shell bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
          {loading && (
            <div className="text-center text-slate-500 text-sm">Loading record details...</div>
          )}

          {error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}

          {!loading && !error && record && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-4">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt={record.patient_name}
                      className="h-16 w-16 rounded-full object-cover ring-2 ring-emerald-100"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-semibold">
                      {initials || "PT"}
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-900">
                        {record.profile?.full_name || record.patient_name}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <ShieldCheck className="h-4 w-4" />
                        Verified record
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                      {record.profile?.age ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-4 w-4 text-emerald-500" />
                          {record.profile.age} yrs
                        </span>
                      ) : null}
                      {record.profile?.gender ? (
                        <span className="inline-flex items-center gap-1">
                          <Stethoscope className="h-4 w-4 text-emerald-500" />
                          {record.profile.gender}
                        </span>
                      ) : null}
                      {record.patient_email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-4 w-4 text-emerald-500" />
                          {record.patient_email}
                        </span>
                      ) : null}
                      {record.patient_phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-4 w-4 text-emerald-500" />
                          {record.patient_phone}
                        </span>
                      ) : null}
                      {record.patient_address ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-emerald-500" />
                          {record.patient_address}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {vitalStats.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-3"
                    >
                      <span className="rounded-full bg-emerald-100 text-emerald-700 p-2">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs text-slate-500">{item.label}</p>
                        <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    Medical History
                  </div>
                  {record.notes ? (
                    <p className="text-sm leading-relaxed text-slate-700">{record.notes}</p>
                  ) : (
                    <p className="text-sm text-slate-500">No notes provided.</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <Stethoscope className="h-4 w-4 text-emerald-600" />
                    Primary Condition
                  </div>
                  <p className="text-sm text-slate-700">
                    {record.profile?.primary_condition || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                      <Activity className="h-4 w-4 text-emerald-600" />
                      Treatments
                    </div>
                  </div>
                  {record.treatments?.length ? (
                    <ul className="space-y-2">
                      {record.treatments.map((t, i) => (
                        <li key={i} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                          {t}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No treatments logged.</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    Prescriptions
                  </div>
                  {record.prescriptions?.length ? (
                    <ul className="space-y-2">
                      {record.prescriptions.map((p, i) => (
                        <li key={i} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                          {p}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No prescriptions logged.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Attachments
                </div>
                {record.attachments?.length ? (
                  <div className="space-y-2">
                    {record.attachments.map((a, i) => (
                      <div
                        key={`${a.url || a.name || i}-${i}`}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-600" />
                          <span>{a.name || "Attachment"}</span>
                        </div>
                        {a.url ? (
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 font-semibold hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-slate-500">Unavailable</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No attachments uploaded.</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Generated on {formatDate(record.created_at) || formatDate(record.updated_at) || "—"}
                </div>
                {record.profile?.medical_file_url ? (
                  <a
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                    href={record.profile.medical_file_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText className="h-4 w-4" />
                    Contact primary physician
                  </a>
                ) : record.patient_email ? (
                  <a
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                    href={`mailto:${record.patient_email}`}
                  >
                    <Mail className="h-4 w-4" />
                    Contact primary physician
                  </a>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
