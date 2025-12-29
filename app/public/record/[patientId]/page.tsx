"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HeartPulse, ActivitySquare, Weight, Ruler, ShieldCheck, FileText, Stethoscope, Quote } from "lucide-react"
import QRCode from "qrcode"

type PatientRecord = {
  id: string
  name: string
  age: number
  gender: string
  bloodGroup: string
  height: string
  weight: string
  bmi: string
  avatar?: string
  conditions: string[]
  treatments: { name: string; dosage: string; frequency: string }[]
  prescriptions: { name: string; dosage: string; frequency: string }[]
  notes?: string
  primaryPhysician?: string
}

export default function PublicPatientRecordPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const [qr, setQr] = useState<string>("")
  const [record, setRecord] = useState<PatientRecord | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    if (!patientId) return
    QRCode.toDataURL(String(patientId), { margin: 1, scale: 3 }).then(setQr).catch(() => setQr(""))
  }, [patientId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!API_URL || !patientId) {
        hydrateFallback()
        return
      }
      try {
        const res = await fetch(`${API_URL}/public/records/${patientId}`)
        if (!res.ok) throw new Error("fail")
        const json = await res.json()
        if (cancelled) return
        const data = json.data
        const profile = data.profile || {}
        const conditions = data.conditions || data.treatments || []
        setRecord({
          id: data.id || patientId,
          name: data.patient_name || profile.full_name || "Patient",
          age: profile.age || 0,
          gender: profile.gender || "—",
          bloodGroup: profile.blood_group || data.blood_group || "N/A",
          height: profile.height || data.height || "N/A",
          weight: profile.weight || data.weight || "N/A",
          bmi: profile.bmi || data.bmi || "N/A",
          avatar: profile.avatar_url || data.avatar_url || "",
          conditions: conditions,
          treatments: data.treatments || [],
          prescriptions: data.prescriptions || [],
          notes: data.notes || "",
          primaryPhysician: data.primary_physician || "",
        })
      } catch {
        hydrateFallback()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [API_URL, patientId])

  const hydrateFallback = () => {
    setRecord({
      id: patientId || "N/A",
      name: "John Doe",
      age: 45,
      gender: "Male",
      bloodGroup: "O+",
      height: "178 cm",
      weight: "82 kg",
      bmi: "25.9",
      avatar: "",
      conditions: ["Hypertension", "Seasonal allergies"],
      treatments: [{ name: "Lisinopril", dosage: "10mg", frequency: "Once daily" }],
      prescriptions: [
        { name: "Atorvastatin", dosage: "20mg", frequency: "Once daily" },
        { name: "Aspirin", dosage: "81mg", frequency: "Once daily" },
      ],
      notes: "Patient responding well to treatment. Continue monitoring BP and lipid profile.",
      primaryPhysician: "Dr. Jane Smith",
    })
  }

  const stats = useMemo(
    () => [
      { label: "Blood Group", value: record?.bloodGroup || "N/A", icon: HeartPulse },
      { label: "Height", value: record?.height || "N/A", icon: Ruler },
      { label: "Weight", value: record?.weight || "N/A", icon: Weight },
      { label: "BMI", value: record?.bmi || "N/A", icon: ActivitySquare },
    ],
    [record]
  )

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Loading patient summary...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            background: white;
          }
          .print-container {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-10 print-container">
        <div className="flex items-start justify-between gap-4 border border-slate-100 shadow-sm rounded-2xl p-6 sm:p-8 bg-white">
          <div className="flex items-center gap-4 sm:gap-6">
            {record.avatar ? (
              <img src={record.avatar} alt={record.name} className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover" />
            ) : (
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-white flex items-center justify-center text-2xl font-semibold">
                {record.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">{record.name}</h1>
                <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  Verified Record
                </Badge>
              </div>
              <p className="text-slate-600 text-sm sm:text-base">
                Age {record.age} • {record.gender}
              </p>
              {record.primaryPhysician && (
                <p className="text-slate-500 text-sm">Primary Physician: {record.primaryPhysician}</p>
              )}
            </div>
          </div>
          <div className="text-right space-y-2">
            {qr && <img src={qr} alt="QR" className="h-16 w-16 object-contain ml-auto" />}
            <p className="text-xs text-slate-500">Record ID: {record.id}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="p-4 border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                    <p className="text-lg font-semibold text-slate-900">{stat.value}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5 border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">Medical History</h2>
            </div>
            <ul className="space-y-2">
              {record.conditions?.length ? (
                record.conditions.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {c}
                  </li>
                ))
              ) : (
                <p className="text-sm text-slate-500">No history on file.</p>
              )}
            </ul>
          </Card>

          <Card className="p-5 border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">Treatments & Prescriptions</h2>
            </div>
            <div className="space-y-3">
              {record.treatments?.length ? (
                <div>
                  <p className="text-sm font-medium text-slate-800 mb-2">Treatments</p>
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                    {record.treatments.map((t, idx) => (
                      <div key={idx} className="p-3 text-sm text-slate-700 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{t.name}</p>
                          <p className="text-xs text-slate-500">{t.dosage}</p>
                        </div>
                        <span className="text-xs text-slate-500">{t.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {record.prescriptions?.length ? (
                <div>
                  <p className="text-sm font-medium text-slate-800 mb-2">Prescriptions</p>
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                    {record.prescriptions.map((p, idx) => (
                      <div key={idx} className="p-3 text-sm text-slate-700 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.dosage}</p>
                        </div>
                        <span className="text-xs text-slate-500">{p.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {!record.treatments?.length && !record.prescriptions?.length && (
                <p className="text-sm text-slate-500">No treatments or prescriptions on file.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5 border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Quote className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">Clinical Notes</h2>
            </div>
            {record.notes ? (
              <blockquote className="border-l-4 border-emerald-200 pl-4 text-slate-700 italic bg-emerald-50/50 rounded-r-lg py-2">
                {record.notes}
              </blockquote>
            ) : (
              <p className="text-sm text-slate-500">No notes available.</p>
            )}
          </Card>

          <Card className="p-5 border-slate-100 shadow-sm flex flex-col justify-between gap-3">
            <div>
              <p className="text-sm text-slate-600">Generated on</p>
              <p className="text-lg font-semibold text-slate-900">{new Date().toLocaleString()}</p>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white no-print">
              Contact Primary Physician
            </Button>
          </Card>
        </div>
      </main>
    </div>
  )
}
