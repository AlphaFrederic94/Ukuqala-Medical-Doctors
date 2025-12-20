"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Send, User, Clock, CheckCheck, Paperclip } from "lucide-react"

type Conversation = {
  id: string
  patient_external_id: string
  status: "active" | "concluded" | "blocked"
  reason?: string | null
  updated_at?: string
}

type Message = {
  id: string
  sender_type: "doctor" | "patient"
  content: string
  created_at: string
  attachments?: { name: string; url: string }[]
}

type PatientProfile = {
  id: string
  full_name?: string
  email?: string
  phone?: string
  avatar_url?: string
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [patients, setPatients] = useState<Record<string, PatientProfile>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingList, setLoadingList] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<"list" | "chat">("list")

  const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
  const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId]
  )
  const selectedPatient = selectedConversation ? patients[selectedConversation.patient_external_id] : null

  useEffect(() => {
    if (!token) return
    setLoadingList(true)
    ;(async () => {
      try {
        // fetch conversations
        const convRes = await fetch(`${API_URL}/conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const convJson = await convRes.json()
        if (!convRes.ok) throw new Error(convJson?.message || "Failed to load conversations")
        const convs: Conversation[] = convJson.data || []
        setConversations(convs)
        if (convs.length && !selectedId) setSelectedId(convs[0].id)

        // fetch patients for doctor
        const patRes = await fetch(`${API_URL}/patients/doctor/list`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const patJson = await patRes.json()
        if (patRes.ok) {
          const map: Record<string, PatientProfile> = {}
          ;(patJson.data || []).forEach((p: any) => (map[p.id] = p))
          setPatients(map)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load conversations"
        setError(message)
      } finally {
        setLoadingList(false)
      }
    })()
  }, [API_URL, token, selectedId])

  useEffect(() => {
    if (!token || !selectedId) return
    setLoadingMessages(true)
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/conversations/${selectedId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.message || "Failed to load messages")
        setMessages(json.data || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load messages"
        setError(message)
      } finally {
        setLoadingMessages(false)
      }
    })()
  }, [API_URL, token, selectedId])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedId || !token) return
    if (selectedConversation?.status !== "active") return
    setSending(true)
    try {
      const res = await fetch(`${API_URL}/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: messageInput, attachments: [] }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || "Failed to send message")
      setMessages((prev) => [...prev, json.data])
      setMessageInput("")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message"
      setError(message)
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return conversations.filter((c) => {
      const p = patients[c.patient_external_id]
      const hay = `${p?.full_name || ""} ${p?.email || ""}`.toLowerCase()
      return hay.includes(q)
    })
  }, [conversations, patients, searchQuery])

  const updateConversationState = (updated: Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
    if (selectedId === updated.id) {
      setSelectedId(updated.id)
    }
  }

  useEffect(() => {
    if (selectedId && typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileView("chat")
    }
  }, [selectedId])

  const handleBlock = async () => {
    if (!selectedId || !token) return
    const reason = window.prompt("Reason for blocking this conversation? (optional)") || undefined
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/conversations/${selectedId}/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || "Failed to block conversation")
      updateConversationState(json.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to block conversation"
      setError(message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReopen = async () => {
    if (!selectedId || !token) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/conversations/${selectedId}/reopen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || "Failed to reopen conversation")
      updateConversationState(json.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reopen conversation"
      setError(message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <Header title="Messages" />

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div
          className={`w-full md:w-80 border-r border-border bg-card ${
            mobileView === "chat" ? "hidden md:block" : "block"
          }`}
        >
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patients..."
                className="pl-9 bg-background"
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            {loadingList && <p className="p-4 text-sm text-muted-foreground">Loading conversations...</p>}
            {error && <p className="p-4 text-sm text-red-500">{error}</p>}
            {!loadingList &&
              !error &&
              filteredConversations.map((c) => {
                const p = patients[c.patient_external_id]
                const initials =
                  (p?.full_name || "P")
                    .split(" ")
                    .map((x) => x[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full border-b border-border p-4 text-left transition-colors hover:bg-accent ${
                      selectedId === c.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold overflow-hidden">
                        {p?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt={p?.full_name || "Patient"} className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground">{p?.full_name || "Patient"}</p>
                          <span className="text-xs text-muted-foreground capitalize">{c.status}</span>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">{p?.email || "No email"}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            {!loadingList && !error && filteredConversations.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">No conversations found.</p>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation && selectedPatient ? (
          <div
            className={`flex flex-1 flex-col ${mobileView === "list" ? "hidden md:flex" : "flex"}`}
          >
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-border bg-card p-4">
              <button
                className="md:hidden text-sm text-muted-foreground"
                onClick={() => setMobileView("list")}
              >
                ← Chats
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                {selectedPatient.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedPatient.avatar_url} alt={selectedPatient.full_name || "Patient"} className="h-full w-full object-cover rounded-full" />
                ) : (
                  (selectedPatient.full_name || "P")
                    .split(" ")
                    .map((x) => x[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{selectedPatient.full_name || "Patient"}</p>
                <p className="text-xs text-muted-foreground">Patient ID: {selectedPatient.id}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground capitalize hidden md:inline">
                  Status: {selectedConversation.status}
                </span>
                <div className="hidden md:flex items-center gap-2">
                  {selectedConversation.status !== "blocked" && (
                    <Button variant="outline" size="sm" onClick={handleBlock} disabled={actionLoading}>
                      Block chat
                    </Button>
                  )}
                  {selectedConversation.status !== "active" && (
                    <Button variant="ghost" size="sm" onClick={handleReopen} disabled={actionLoading}>
                      Reopen
                    </Button>
                  )}
                </div>
                <div className="md:hidden">
                  <details className="relative">
                    <summary className="text-xs text-muted-foreground cursor-pointer select-none">Options</summary>
                    <div className="absolute right-0 mt-1 w-32 rounded-md border border-border bg-card shadow-md z-10">
                      {selectedConversation.status !== "blocked" && (
                        <button
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={handleBlock}
                          disabled={actionLoading}
                        >
                          Block chat
                        </button>
                      )}
                      {selectedConversation.status !== "active" && (
                        <button
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={handleReopen}
                          disabled={actionLoading}
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-background p-6">
              {selectedConversation.reason && selectedConversation.status !== "active" && (
                <div className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  Conversation paused: {selectedConversation.reason}
                </div>
              )}
              {selectedConversation.status === "blocked" && (
                <div className="mb-4 rounded-lg border border-destructive/40 bg-red-50 p-3 text-sm text-red-700">
                  This conversation is blocked. Reopen to continue messaging.
                </div>
              )}
              {loadingMessages && <p className="text-sm text-muted-foreground">Loading messages...</p>}
              {!loadingMessages && messages.length === 0 && (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              )}
              <div className="space-y-4">
                {messages.map((message) => {
                  const isDoctor = message.sender_type === "doctor"
                  const created = new Date(message.created_at)
                  return (
                    <div key={message.id} className={`flex gap-3 ${isDoctor ? "justify-end" : "justify-start"}`}>
                      {!isDoctor && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {selectedPatient.full_name?.[0] || "P"}
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          isDoctor ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1 text-xs underline">
                            {message.attachments.map((att, idx) => (
                              <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                                <Paperclip className="h-3 w-3" />
                                {att.name}
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-1 text-xs opacity-70">
                          <Clock className="h-3 w-3" />
                          {created.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          {isDoctor && <CheckCheck className="ml-1 h-3 w-3" />}
                        </div>
                      </div>
                      {isDoctor && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-border bg-card p-4">
              {selectedConversation.status !== "active" ? (
                <p className="text-sm text-muted-foreground">Conversation is {selectedConversation.status}.</p>
              ) : (
                <div className="flex gap-3">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 bg-background"
                  />
                  <Button onClick={handleSendMessage} disabled={sending} className="bg-primary hover:bg-primary/90">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={`flex flex-1 items-center justify-center bg-background ${mobileView === "list" ? "block" : "hidden md:flex"}`}>
            <p className="text-muted-foreground">{error || "Select a conversation to start messaging"}</p>
          </div>
        )}
      </div>
    </div>
  )
}
