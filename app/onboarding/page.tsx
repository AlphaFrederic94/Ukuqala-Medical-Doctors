"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock, MapPin, Sparkles, Stethoscope, User, Globe2, Languages, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

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

export default function DoctorOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: "",
    specialty: "",
    country: "",
    city: "",
    timezone: "",
    languages: "",
    bio: "",
    consultationMode: "both",
    availability: DAYS.map((day) => ({ day, start: "09:00", end: "17:00" })) as AvailabilitySlot[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const progress = useMemo(() => Math.round(((step + 1) / 3) * 100), [step])
  const cityOptions = useMemo(() => CITIES_BY_COUNTRY[form.country] || [], [form.country])

  const handleAvailabilityChange = (index: number, field: "start" | "end", value: string) => {
    setForm((prev) => {
      const next = [...prev.availability]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, availability: next }
    })
  }

  const handleNext = () => setStep((s) => Math.min(s + 1, 2))
  const handleBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // TODO: POST to /api/onboarding when backend is ready
    setTimeout(() => {
      setIsSubmitting(false)
      router.push("/dashboard")
    }, 600)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
        <div className="flex items-center gap-3 mb-6">
          <Badge variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Doctor Onboarding
          </Badge>
          <div className="text-sm text-muted-foreground">Finish setting up your profile</div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <Card className="flex-1 p-6 border border-border/60 bg-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Step {step + 1} of 3</p>
                <h1 className="text-2xl font-semibold text-foreground">Create your professional profile</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-40 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
            </div>

            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <div className="mt-2 relative">
                    <User className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                    <Input
                      id="name"
                      placeholder="Dr. Jane Doe"
                      className="pl-9"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specialty">Specialty</Label>
                    <div className="mt-2 relative">
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
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <div className="mt-2 relative">
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
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <div className="mt-2 relative">
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
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <div className="mt-2 relative">
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
                  <div>
                    <Label htmlFor="languages">Languages</Label>
                    <div className="mt-2 relative">
                      <Languages className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                      <Input
                        id="languages"
                        placeholder="English, French..."
                        className="pl-9"
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
                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <div className="mt-2 relative">
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
                <div>
                  <Label>Consultation Mode</Label>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {[
                      { value: "virtual", label: "Virtual" },
                      { value: "in_person", label: "In-Person" },
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
                    <h3 className="font-semibold text-foreground">Set Weekly Availability</h3>
                    <p className="text-sm text-muted-foreground">Quickly adjust your start/end times for each day.</p>
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

            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={handleBack} disabled={step === 0}>
                Back
              </Button>
              {step < 2 ? (
                <Button onClick={handleNext}>Continue</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Finish & Go to Dashboard"}
                </Button>
              )}
            </div>
          </Card>

          <div className="w-full lg:w-80 space-y-4">
            <Card className="p-4 bg-primary text-primary-foreground border-none shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4" />
                <p className="text-sm uppercase tracking-wide">Why complete onboarding?</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li>• Patients discover you by specialty, language, and location.</li>
                <li>• Availability powers instant booking across products.</li>
                <li>• A strong bio increases booking confidence and conversions.</li>
              </ul>
            </Card>
            <Card className="overflow-hidden border border-border/60 bg-card">
              <img
                src="/doctor-patient-consultation.svg"
                alt="Doctor and patient consultation"
                className="w-full h-48 object-cover bg-muted"
              />
              <div className="p-4 space-y-2 text-sm">
                <p className="font-semibold text-foreground">Stand out with a complete profile</p>
                <p className="text-muted-foreground">
                  Add your specialty, languages, and availability so patients and admins can match you quickly.
                </p>
              </div>
            </Card>
            <Card className="p-4 border border-border/60 bg-card">
              <h3 className="font-semibold text-foreground mb-2">Profile Preview</h3>
              <p className="text-sm text-muted-foreground">
                Your details update live as you fill the form. Complete onboarding to publish your profile.
              </p>
              <div className="mt-4 space-y-2 text-sm">
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
    </div>
  )
}
