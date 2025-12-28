"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Globe2,
  Languages,
  MapPin,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type AvailabilitySlot = { day: string; start: string; end: string }

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const SPECIALTIES = [
  "General Practitioner",
  "Pediatrics",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Psychiatry",
  "Orthopedics",
  "Gynecology",
  "Oncology",
  "Radiology",
  "Anesthesiology",
  "Nurse Practitioner",
  "Physiotherapy",
  "Dentistry",
  "Ophthalmology",
]
const TIMEZONES = [
  "UTC-8 (PST)",
  "UTC-5 (EST)",
  "UTC+0 (GMT)",
  "UTC+1 (CET)",
  "UTC+2 (CAT)",
  "UTC+3 (EAT)",
  "UTC+5:30 (IST)",
  "UTC+8 (CST)",
  "UTC+10 (AEST)",
]
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  USA: ["New York", "San Francisco", "Austin"],
  UK: ["London", "Manchester", "Birmingham"],
  Nigeria: ["Lagos", "Abuja", "Port Harcourt"],
  "South Africa": ["Cape Town", "Johannesburg", "Durban"],
  Kenya: ["Nairobi", "Mombasa", "Kisumu"],
  India: ["Mumbai", "Bangalore", "Delhi"],
}
const DEFAULT_AVAILABILITY: AvailabilitySlot[] = DAYS.map((day) => ({ day, start: "09:00", end: "17:00" }))

export default function DoctorOnboardingPage() {
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
  const [token, setToken] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [infoOpen, setInfoOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    specialty: "",
    country: "",
    city: "",
    timezone: "",
    languages: "",
    bio: "",
    consultationMode: "both",
    availability: DEFAULT_AVAILABILITY as AvailabilitySlot[],
  })

  const progress = useMemo(() => Math.round(((step + 1) / 3) * 100), [step])
  const cityOptions = useMemo(() => CITIES_BY_COUNTRY[form.country] || [], [form.country])

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedToken = localStorage.getItem("doctorToken")
    if (!storedToken) {
      router.replace("/auth/signin")
      return
    }
    setToken(storedToken)

    const loadProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_URL}/onboarding`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
        if (res.status === 401) {
          router.replace("/auth/signin")
          return
        }
        const payload = await res.json()
        const doctor = payload?.data?.doctor
        if (doctor?.onboarding_completed) {
          router.replace("/dashboard")
          return
        }
        if (doctor) {
          setForm((prev) => ({
            ...prev,
            name: `${doctor.first_name || ""} ${doctor.last_name || ""}`.trim(),
            specialty: doctor.specialty || "",
            country: doctor.country || "",
            city: doctor.city || "",
            timezone: doctor.timezone || "",
            languages: Array.isArray(doctor.languages) ? doctor.languages.join(", ") : doctor.languages || "",
            bio: doctor.bio || "",
            consultationMode: doctor.consultation_mode || prev.consultationMode,
            availability:
              doctor.availability && Array.isArray(doctor.availability) && doctor.availability.length > 0
                ? doctor.availability
                : prev.availability,
          }))
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load onboarding"
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [API_URL, router])

  const handleAvailabilityChange = (index: number, field: "start" | "end", value: string) => {
    setForm((prev) => {
      const next = [...prev.availability]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, availability: next }
    })
  }

  const handleNext = () => setStep((s) => Math.min(s + 1, 2))
  const handleBack = () => setStep((s) => Math.max(s - 1, 0))
  const languagesArray = () =>
    form.languages
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

  const handleSubmit = async () => {
    if (!token) {
      router.replace("/auth/signin")
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const onboardingPayload = {
        specialty: form.specialty,
        country: form.country,
        city: form.city,
        timezone: form.timezone,
        languages: languagesArray(),
        bio: form.bio,
        consultation_mode: form.consultationMode,
        availability: form.availability,
      }

      const onboardingRes = await fetch(`${API_URL}/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(onboardingPayload),
      })
      const onboardingJson = await onboardingRes.json()
      if (!onboardingRes.ok) {
        throw new Error(onboardingJson?.message || "Unable to save onboarding")
      }

      if (form.name.trim()) {
        const [first_name, ...rest] = form.name.trim().split(" ")
        const last_name = rest.join(" ")
        if (first_name) {
          const profileRes = await fetch(`${API_URL}/profile`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ first_name, last_name }),
          })
          if (!profileRes.ok) {
            const profileJson = await profileRes.json().catch(() => ({}))
            throw new Error(profileJson?.message || "Profile saved, but we could not update your name.")
          }
        }
      }

      localStorage.setItem("doctorOnboardingCompleted", "true")
      setSuccess("Profile saved successfully.")
      router.replace("/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save onboarding"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handlePrimaryAction = () => {
    if (step < 2) handleNext()
    else handleSubmit()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-24 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Doctor Onboarding
            </Badge>
            <span className="text-sm text-muted-foreground">Create your professional profile</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Step {step + 1} of 3</span>
            <div className="w-28 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
                aria-hidden="true"
              />
            </div>
            <span>{progress}%</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-4 sm:gap-6 lg:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6 border border-border/70 bg-card shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Create your professional profile</h1>
                  <p className="text-sm text-muted-foreground">
                    We use this information to verify your account and match you with the right patients.
                  </p>
                </div>
                <div className="hidden lg:flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground">Secure and private</span>
                </div>
              </div>

              {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
              {success && <p className="mb-4 text-sm text-green-600">{success}</p>}

              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading your profile...</div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  {step === 0 && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <div className="relative">
                          <User className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                          <Input
                            id="name"
                            placeholder="Dr. Jane Doe"
                            className="pl-9 h-11"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="specialty">Specialty</Label>
                          <div className="relative">
                            <Stethoscope className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                            <select
                              id="specialty"
                              className="flex h-11 w-full rounded-lg border border-border bg-background px-10 py-2 text-sm text-foreground"
                              value={form.specialty}
                              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                            >
                              <option value="">Select your specialty</option>
                              {SPECIALTIES.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <div className="relative">
                            <MapPin className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                            <select
                              id="country"
                              className="flex h-11 w-full rounded-lg border border-border bg-background px-10 py-2 text-sm text-foreground"
                              value={form.country}
                              onChange={(e) => setForm({ ...form, country: e.target.value, city: "" })}
                            >
                              <option value="">Select country</option>
                              {Object.keys(CITIES_BY_COUNTRY).map((country) => (
                                <option key={country} value={country}>
                                  {country}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <div className="relative">
                            <MapPin className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                            <select
                              id="city"
                              className="flex h-11 w-full rounded-lg border border-border bg-background px-10 py-2 text-sm text-foreground"
                              value={form.city}
                              onChange={(e) => setForm({ ...form, city: e.target.value })}
                              disabled={!form.country}
                            >
                              <option value="">{form.country ? "Select city" : "Select a country first"}</option>
                              {cityOptions.map((city) => (
                                <option key={city} value={city}>
                                  {city}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timezone">Timezone</Label>
                          <div className="relative">
                            <Globe2 className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                            <select
                              id="timezone"
                              className="flex h-11 w-full rounded-lg border border-border bg-background px-10 py-2 text-sm text-foreground"
                              value={form.timezone}
                              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                            >
                              <option value="">Select timezone</option>
                              {TIMEZONES.map((zone) => (
                                <option key={zone} value={zone}>
                                  {zone}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2 lg:col-span-2">
                          <Label htmlFor="languages">Languages</Label>
                          <div className="relative">
                            <Languages className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                            <Input
                              id="languages"
                              placeholder="English, French"
                              className="pl-9 h-11"
                              value={form.languages}
                              onChange={(e) => setForm({ ...form, languages: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="bio">Professional bio</Label>
                        <div className="relative">
                          <FileText className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                          <Textarea
                            id="bio"
                            placeholder="Share your experience, certifications, and approach to patient care."
                            className="pl-9 min-h-[140px]"
                            value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Consultation mode</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { value: "virtual", label: "Virtual" },
                            { value: "in_person", label: "In-person" },
                            { value: "both", label: "Both" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setForm({ ...form, consultationMode: option.value })}
                              className={`rounded-xl border p-3 text-sm transition hover:border-primary hover:bg-primary/5 ${
                                form.consultationMode === option.value ? "border-primary bg-primary/10" : "border-border"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold text-foreground">Set weekly availability</h3>
                          <p className="text-sm text-muted-foreground">Adjust the start/end time for each day.</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {form.availability.map((slot, idx) => (
                          <Card key={slot.day} className="border border-border/70 bg-muted/30 p-3 flex items-center gap-4">
                            <div className="w-12 text-sm font-semibold text-foreground">{slot.day}</div>
                            <div className="flex items-center gap-2 flex-1">
                              <div className="relative flex-1">
                                <Clock className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                                <Input
                                  type="time"
                                  className="pl-9"
                                  value={slot.start}
                                  onChange={(e) => handleAvailabilityChange(idx, "start", e.target.value)}
                                />
                              </div>
                              <span className="text-muted-foreground text-sm">to</span>
                              <div className="relative flex-1">
                                <Clock className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                                <Input
                                  type="time"
                                  className="pl-9"
                                  value={slot.end}
                                  onChange={(e) => handleAvailabilityChange(idx, "end", e.target.value)}
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="hidden lg:flex items-center justify-between pt-2">
                    <Button variant="outline" onClick={handleBack} disabled={step === 0 || saving}>
                      Back
                    </Button>
                    {step < 2 ? (
                      <Button onClick={handleNext} disabled={saving}>
                        Continue
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? "Saving..." : "Finish and go to dashboard"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>

            <Card className="lg:hidden border border-border/70 bg-card">
              <button
                type="button"
                onClick={() => setInfoOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm text-foreground">Why complete onboarding?</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${infoOpen ? "rotate-180" : ""}`}
                />
              </button>
              {infoOpen && (
                <div className="border-t border-border px-4 pb-4 pt-3 space-y-2 text-sm text-muted-foreground">
                  <p>Patients find you by specialty, language, and location.</p>
                  <p>Availability powers bookings across the platform.</p>
                  <p>A clear bio builds trust and improves conversions.</p>
                </div>
              )}
            </Card>
          </div>

          <div className="hidden lg:flex flex-col gap-4">
            <Card className="p-4 bg-primary text-primary-foreground border-none shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4" />
                <p className="text-sm uppercase tracking-wide">Why complete onboarding?</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  <span>Patients discover you by specialty, language, and location.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  <span>Availability powers instant booking across products.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  <span>A strong bio increases booking confidence and conversions.</span>
                </li>
              </ul>
            </Card>

            <Card className="p-4 border border-border/60 bg-card">
              <h3 className="font-semibold text-foreground mb-2">Profile preview</h3>
              <p className="text-sm text-muted-foreground">
                Your details update live as you fill the form. Complete onboarding to publish your profile.
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{form.name || "Dr. Your Name"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{form.specialty || "Specialty"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    {(form.city && form.country && `${form.city}, ${form.country}`) || "Location"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{form.languages || "Languages"}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Button variant="outline" className="w-28" onClick={handleBack} disabled={step === 0 || saving || loading}>
            Back
          </Button>
          <Button className="flex-1" onClick={handlePrimaryAction} disabled={saving || loading}>
            {step < 2 ? "Continue" : saving ? "Saving..." : "Finish and go to dashboard"}
          </Button>
        </div>
      </div>
    </div>
  )
}
