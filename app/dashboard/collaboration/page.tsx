"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Send,
  Paperclip,
  Mic,
  Search,
  Share2,
  Users,
  MessageSquare,
  FileText,
  Link2,
  X,
  ChevronRight,
  NotebookPen,
  ArrowLeft,
  Info,
  Plus,
  FilePlus,
  Stethoscope,
} from "lucide-react"
import { jwtDecode } from "jwt-decode"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

type Doctor = {
  id: number
  name: string
  specialty: string
  status: "online" | "offline" | "busy"
  avatar: string
  lastMessage?: string
  time?: string
  unread?: number
}

type Message = {
  id: number
  sender: string
  content: string
  time: string
  isOwn: boolean
  type?: "text" | "patient_card"
  patient?: Patient
  notes?: string
}

type Patient = {
  id: number
  patientName: string
  patientAge: number
  bloodGroup: string
  medicalCondition: string
  height: string
  weight: string
  avatar: string
  medicalFileUrl: string
}

const chatList: Doctor[] = [
  {
    id: 1,
    name: "Dr. Michael Chen",
    specialty: "Neurologist",
    lastMessage: "I reviewed the MRI scans you sent...",
    time: "10:30",
    unread: 2,
    avatar: "MC",
    status: "online",
  },
  {
    id: 2,
    name: "Dr. Emily Roberts",
    specialty: "Orthopedic Surgeon",
    lastMessage: "The patient's recovery is progressing well",
    time: "09:15",
    unread: 0,
    avatar: "ER",
    status: "online",
  },
  {
    id: 3,
    name: "Dr. James Wilson",
    specialty: "Radiologist",
    lastMessage: "I can take a look at those X-rays tomorrow",
    time: "Yesterday",
    unread: 0,
    avatar: "JW",
    status: "offline",
  },
]

const availableDoctors: Doctor[] = [
  { id: 4, name: "Dr. Amanda Foster", specialty: "Endocrinologist", status: "online", avatar: "AF" },
  { id: 5, name: "Dr. Robert Kumar", specialty: "Gastroenterologist", status: "online", avatar: "RK" },
  { id: 6, name: "Dr. Lisa Martinez", specialty: "Pulmonologist", status: "online", avatar: "LM" },
  { id: 7, name: "Dr. David Park", specialty: "Oncologist", status: "busy", avatar: "DP" },
]

const initialMessages: Message[] = [
  {
    id: 1,
    sender: "Dr. Michael Chen",
    content: "Good morning! I wanted to consult with you about a patient case.",
    time: "10:15",
    isOwn: false,
  },
  { id: 2, sender: "You", content: "Of course! What can I help you with?", time: "10:16", isOwn: true },
  {
    id: 3,
    sender: "Dr. Michael Chen",
    content:
      "I have a 45-year-old patient presenting with cardiac symptoms. Could you review the ECG results I'm about to share?",
    time: "10:18",
    isOwn: false,
  },
  {
    id: 4,
    sender: "You",
    content: "Absolutely. Please share the patient information and I'll review it right away.",
    time: "10:20",
    isOwn: true,
  },
]

const savedNotes = [
  { id: 1, content: "Patient case discussion: Atrial fibrillation management strategies", date: "28 Dec, 2024" },
  { id: 2, content: "Follow-up required on post-operative care protocol", date: "27 Dec, 2024" },
]

const sharedFiles = [
  { id: 1, name: "ECG_Report_Patient_1234.pdf", size: "2.4 MB", date: "28 Dec, 2024" },
  { id: 2, name: "Lab_Results_Analysis.pdf", size: "1.8 MB", date: "27 Dec, 2024" },
]

export default function CollaborationPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
  const [tab, setTab] = useState<"chat" | "directory">("chat")
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [showSharePatient, setShowSharePatient] = useState(false)
  const [shareNotes, setShareNotes] = useState("")
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [patientSearch, setPatientSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [directory, setDirectory] = useState<Doctor[]>([])
  const [chats, setChats] = useState<any[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null
  const currentDoctorId = useMemo(() => {
    if (!token) return null
    try {
      const payload: any = jwtDecode(token)
      return payload?.id || payload?.sub || null
    } catch {
      return null
    }
  }, [token])

  const doctorStatusBadge = (status: Doctor["status"]) => {
    if (status === "online") return "bg-emerald-100 text-emerald-700"
    if (status === "busy") return "bg-amber-100 text-amber-700"
    return "bg-gray-100 text-gray-700"
  }

  const handleSendMessage = () => {
    if (!message.trim()) return
    if (!selectedDoctor) return

    const newMessage: Message = {
      id: Date.now(),
      sender: "You",
      content: message,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
      type: "text",
    }

    setMessages((prev) => [...prev, newMessage])
    setMessage("")
  }

  const handleSharePatient = async () => {
    if (!selectedDoctor || !selectedPatient || !selectedChatId || !token || !API_URL) return
    const payload = {
      type: "patient_card",
      content: "",
      patientPayload: selectedPatient,
      notes: shareNotes.trim(),
    }
    try {
      const res = await fetch(`${API_URL}/collaboration/chats/${selectedChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const json = await res.json()
        const m = json.data
        const msg: Message = {
          id: m.id,
          sender: "You",
          content: "",
          time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isOwn: true,
          type: "patient_card",
          patient: m.metadata?.patient || selectedPatient,
          notes: m.metadata?.notes || shareNotes.trim(),
        }
        setMessages((prev) => [...prev, msg])
        setToast(`Patient Case shared successfully with ${selectedDoctor.name}.`)
        setTimeout(() => setToast(null), 2500)
        setSelectedPatient(null)
        setShareNotes("")
        setShowSharePatient(false)
      }
    } catch {
      // ignore for now
    }
  }

  const sidebarList = useMemo(() => (tab === "chat" ? chats : directory), [tab, chats, directory])
  const filteredPatients = useMemo(
    () =>
      patients.filter((p) => {
        const hay = `${p.patientName} ${p.medicalCondition} ${p.bloodGroup}`.toLowerCase()
        return hay.includes(patientSearch.toLowerCase())
      }),
    [patientSearch]
  )

  useEffect(() => {
    if (!token || !API_URL) return
    ;(async () => {
      try {
        const [doctorsRes, chatsRes, patientsRes] = await Promise.all([
          fetch(`${API_URL}/doctors?onboardingCompleted=true`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/collaboration/chats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/patients/doctor/list`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (doctorsRes.ok) {
          const json = await doctorsRes.json()
          const mapped: Doctor[] = (json.data || [])
            .filter((d: any) => d.id !== currentDoctorId)
            .map((d: any) => ({
            id: d.id,
            name: `${d.first_name || ""} ${d.last_name || ""}`.trim() || d.email,
            specialty: d.specialty || "Doctor",
            avatar: d.avatar_url || (d.first_name || "DR")[0],
            status: "online",
          }))
          setDirectory(mapped)
        }
        if (chatsRes.ok) {
          const json = await chatsRes.json()
          const mapped = (json.data || []).map((c: any) => {
            const peerId = c.doctor_id === currentDoctorId ? c.peer_doctor_id : c.doctor_id
            return {
              id: c.id,
              peerDoctorId: peerId,
              name: `${c.peer_first || ""} ${c.peer_last || ""}`.trim() || c.peer_email,
              specialty: "",
              avatar: c.peer_avatar || (c.peer_first || "DR")[0],
              status: "online",
              time: "",
              lastMessage: "",
            }
          })
          setChats(mapped)
          if (mapped.length && !selectedChatId) {
            setSelectedChatId(mapped[0].id)
          }
        }
        if (patientsRes.ok) {
          const json = await patientsRes.json()
          const mapped: Patient[] = (json.data || []).map((p: any) => ({
            id: p.id,
            patientName: p.full_name || p.name || "Patient",
            patientAge: p.age || 0,
            bloodGroup: p.blood_group || "N/A",
            medicalCondition: p.primary_condition || "N/A",
            height: p.height || "N/A",
            weight: p.weight || "N/A",
            avatar: p.avatar_url || p.image_url || "",
            medicalFileUrl: p.medical_file_url || "#",
          }))
          setPatients(mapped)
        }
      } catch (err) {
        // swallow fetch errors for now
      }
    })()
  }, [API_URL, token, selectedChatId])

  useEffect(() => {
    if (!selectedChatId || !token || !API_URL) return
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/collaboration/chats/${selectedChatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const json = await res.json()
        const mapped: Message[] = (json.data || []).map((m: any) => ({
          id: m.id,
          sender: m.doctor_id === currentDoctorId ? "You" : "Peer",
          content: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isOwn: m.doctor_id === currentDoctorId,
          type: m.type,
          patient: m.metadata?.patient,
          notes: m.metadata?.notes,
        }))
        setMessages(mapped)
      } catch {
        // ignore
      }
    })()
  }, [selectedChatId, selectedDoctor, API_URL, token])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">Doctor Collaboration</h1>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
            Beta
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <NotebookPen className="h-4 w-4" />
          Peer consults and secure case sharing
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left list */}
        <div
          className={`border-r border-border bg-muted/20 flex-col min-h-0 ${
            selectedDoctor ? "hidden lg:flex w-80" : "flex w-full lg:w-80"
          }`}
        >
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex gap-2">
              <Button
                variant={tab === "chat" ? "default" : "outline"}
                size="sm"
                className="flex-1 min-h-[44px]"
                onClick={() => setTab("chat")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Active chats
              </Button>
              <Button
                variant={tab === "directory" ? "default" : "outline"}
                size="sm"
                className="flex-1 min-h-[44px]"
                onClick={() => setTab("directory")}
              >
                <Users className="h-4 w-4 mr-2" />
                Directory
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search doctors" className="pl-9 min-h-[44px]" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sidebarList.map((doctor) => (
              <button
                key={doctor.id}
                onClick={() => setSelectedDoctor(doctor)}
                className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors ${
                  selectedDoctor?.id === doctor.id ? "bg-card shadow-sm" : "hover:bg-muted"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center text-sm font-semibold">
                      {doctor.avatar}
                    </div>
                    <span
                      className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-card ${doctor.status === "online" ? "bg-emerald-500" : doctor.status === "busy" ? "bg-amber-500" : "bg-gray-400"}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground truncate">{doctor.name}</p>
                      {doctor.time && <span className="text-xs text-muted-foreground">{doctor.time}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                    {doctor.lastMessage && <p className="text-sm text-foreground truncate">{doctor.lastMessage}</p>}
                  </div>
                  {doctor.unread ? (
                    <Badge className="bg-primary text-primary-foreground px-2 py-0.5 text-[11px]">{doctor.unread}</Badge>
                  ) : null}
                </div>
              </button>
            ))}

            {tab === "directory" && !sidebarList.length && (
              <div className="p-6 text-sm text-muted-foreground">No doctors found in directory.</div>
            )}
          </div>
        </div>

        {/* Center chat */}
        <div
          className={`min-w-0 flex-col ${selectedDoctor ? "flex flex-1" : "hidden lg:flex lg:flex-1"}`}
        >
          {selectedDoctor ? (
            <>
              <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden min-h-[44px]"
                    onClick={() => setSelectedDoctor(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="ml-1 text-sm">Back</span>
                  </Button>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center text-sm font-semibold">
                      {selectedDoctor.avatar}
                    </div>
                    <span
                      className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${selectedDoctor.status === "online" ? "bg-emerald-500" : selectedDoctor.status === "busy" ? "bg-amber-500" : "bg-gray-400"}`}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedDoctor.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden min-h-[44px] h-11 w-11"
                    onClick={() => setShowInfoPanel(true)}
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                  <Button variant="default" size="sm" className="min-h-[44px]" onClick={() => setShowSharePatient(true)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share patient
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-muted/20">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
                    {msg.type === "patient_card" && msg.patient ? (
                      <div className="w-[90%] sm:w-[80%] lg:max-w-[60%] ml-auto">
                        <PatientShareCard patient={msg.patient} notes={msg.notes} alignRight />
                        {msg.content && (
                          <p className="text-sm text-muted-foreground mt-2 text-right">{msg.content}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-1 text-right">{msg.time}</p>
                      </div>
                    ) : (
                      <div
                        className={`max-w-xl space-y-2 rounded-2xl px-4 py-3 shadow-sm ${
                          msg.isOwn ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border"
                        }`}
                      >
                        {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                        <p
                          className={`text-[11px] ${
                            msg.isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}
                        >
                          {msg.time}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-border bg-card p-3 sm:p-4 sticky bottom-0">
                <div className="relative flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 min-h-[48px]"
                      onClick={() => setShowActionMenu((prev) => !prev)}
                    >
                      <Plus className="h-5 w-5 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-12 w-12 min-h-[48px]">
                      <Mic className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </div>

                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message"
                    className="flex-1 min-h-[48px] rounded-full px-4"
                  />

                  <Button
                    onClick={handleSendMessage}
                    className="h-12 w-12 min-h-[48px] rounded-full p-0"
                    title="Send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>

                  {showActionMenu && (
                    <div className="absolute bottom-14 left-2 z-20 w-52 rounded-xl border border-border bg-card shadow-lg">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                        <p className="text-sm font-semibold text-foreground">Share</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowActionMenu(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="divide-y divide-border">
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-3 text-sm hover:bg-muted transition-colors"
                      onClick={() => {
                        setShowActionMenu(false)
                        setShowSharePatient(true)
                      }}
                        >
                          <Stethoscope className="h-4 w-4 text-primary" />
                          <div className="text-left">
                            <p className="font-medium text-foreground">Share patient</p>
                            <p className="text-xs text-muted-foreground">Send case ID + notes</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-3 text-sm hover:bg-muted transition-colors"
                        >
                          <FilePlus className="h-4 w-4 text-indigo-600" />
                          <div className="text-left">
                            <p className="font-medium text-foreground">Share lab/DICOM</p>
                            <p className="text-xs text-muted-foreground">Upload imaging or labs</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-3 text-sm hover:bg-muted transition-colors"
                        >
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <div className="text-left">
                            <p className="font-medium text-foreground">Attach document</p>
                            <p className="text-xs text-muted-foreground">PDF, DOC, etc.</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm">Select a doctor to start collaborating</p>
              </div>
            </div>
          )}
        </div>

        {/* Right context */}
        {selectedDoctor && (
          <div className="hidden lg:flex w-80 border-l border-border bg-card flex-col min-h-0">
            <div className="p-4 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Doctor profile</p>
              <p className="text-xs text-muted-foreground">Private to you</p>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto">
              <div className="text-center space-y-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center text-2xl font-semibold mx-auto">
                  {selectedDoctor.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedDoctor.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
                </div>
                <Badge className={doctorStatusBadge(selectedDoctor.status)}>
                  {selectedDoctor.status === "online" ? "Available" : selectedDoctor.status === "busy" ? "In consult" : "Offline"}
                </Badge>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Saved notes</p>
                </div>
                <div className="space-y-2">
                  {savedNotes.map((note) => (
                    <Card key={note.id} className="p-3">
                      <p className="text-sm text-foreground">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{note.date}</p>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Shared files</p>
                </div>
                <div className="space-y-2">
                  {sharedFiles.map((file) => (
                    <Card key={file.id} className="p-3 hover:bg-muted/60 cursor-pointer transition-colors">
                      <p className="text-sm font-semibold text-foreground">{file.name}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>{file.size}</span>
                        <span>{file.date}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Shared links</p>
                </div>
                <p className="text-sm text-muted-foreground">No links shared yet</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showSharePatient} onOpenChange={setShowSharePatient}>
        <DialogContent className="backdrop-blur-sm sm:max-w-lg sm:rounded-2xl sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:rounded-t-2xl">
          <DialogHeader>
            <DialogTitle>Share patient information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Select patient</label>
              <div className="mt-2">
                <Input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search by name, condition, or blood group"
                  className="min-h-[44px]"
                />
              </div>
              <div className="mt-3 max-h-[300px] overflow-y-auto border border-border rounded-lg divide-y divide-border">
                {filteredPatients.map((patient) => (
                  <button
                    type="button"
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-muted transition-colors ${
                      selectedPatient?.id === patient.id ? "bg-emerald-50 border-l-4 border-emerald-500" : ""
                    }`}
                  >
                    <img
                      src={patient.avatar}
                      alt={patient.patientName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{patient.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient.patientAge} yrs • {patient.bloodGroup} • {patient.medicalCondition}
                      </p>
                    </div>
                  </button>
                ))}
                {!filteredPatients.length && (
                  <p className="p-3 text-sm text-muted-foreground">No patients match your search.</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Notes (optional)</label>
              <Textarea
                value={shareNotes}
                onChange={(e) => setShareNotes(e.target.value)}
                placeholder="Add clinical context or requests"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="ghost" className="min-h-[44px]" onClick={() => setShowSharePatient(false)}>
              Cancel
            </Button>
            <Button onClick={handleSharePatient} disabled={!selectedPatient} className="min-h-[44px]">
              <Share2 className="h-4 w-4 mr-2" />
              Share patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInfoPanel} onOpenChange={setShowInfoPanel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Doctor profile</DialogTitle>
          </DialogHeader>
          {selectedDoctor ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center text-2xl font-semibold mx-auto">
                  {selectedDoctor.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedDoctor.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
                </div>
                <Badge className={doctorStatusBadge(selectedDoctor.status)}>
                  {selectedDoctor.status === "online" ? "Available" : selectedDoctor.status === "busy" ? "In consult" : "Offline"}
                </Badge>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Saved notes</p>
                </div>
                <div className="space-y-2">
                  {savedNotes.map((note) => (
                    <Card key={note.id} className="p-3">
                      <p className="text-sm text-foreground">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{note.date}</p>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Shared files</p>
                </div>
                <div className="space-y-2">
                  {sharedFiles.map((file) => (
                    <Card key={file.id} className="p-3 hover:bg-muted/60 cursor-pointer transition-colors">
                      <p className="text-sm font-semibold text-foreground">{file.name}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>{file.size}</span>
                        <span>{file.date}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a doctor to view info.</p>
          )}
        </DialogContent>
      </Dialog>

      {toast && (
        <div className="fixed bottom-5 inset-x-0 z-50 flex justify-center px-4">
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>
        </div>
      )}
    </div>
  )
}

function PatientShareCard({ patient, notes, alignRight }: { patient: Patient; notes?: string; alignRight?: boolean }) {
  return (
    <Card
      className={`border-emerald-100 bg-emerald-50 text-foreground p-4 space-y-3 shadow-sm w-full ${
        alignRight ? "ml-auto" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {patient.avatar ? (
          <img src={patient.avatar} alt={patient.patientName} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center text-base font-semibold">
            {patient.patientName?.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{patient.patientName}</p>
              <p className="text-xs text-muted-foreground">{patient.patientAge} yrs</p>
            </div>
            <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-700">
              {patient.medicalCondition}
            </Badge>
          </div>
          <div className="grid grid-cols-2 max-[380px]:grid-cols-1 gap-3 text-xs text-muted-foreground">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Blood Group</p>
              <p className="text-sm font-medium text-foreground">{patient.bloodGroup}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Height</p>
              <p className="text-sm font-medium text-foreground">{patient.height}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Weight</p>
              <p className="text-sm font-medium text-foreground">{patient.weight}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Condition</p>
              <p className="text-sm font-medium text-foreground">{patient.medicalCondition}</p>
            </div>
          </div>
          {notes && <p className="text-sm text-foreground mt-1">Notes: {notes}</p>}
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="min-h-[40px]" asChild>
          <a href={patient.medicalFileUrl} target="_blank" rel="noreferrer">
            Access medical records
          </a>
        </Button>
      </div>
    </Card>
  )
}
