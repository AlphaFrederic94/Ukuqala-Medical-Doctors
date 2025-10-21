"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Send, User, Clock, CheckCheck } from "lucide-react"

interface Patient {
  id: string
  name: string
  lastMessage: string
  timestamp: string
  unread: number
  avatar: string
}

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: Date
  read: boolean
}

const patients: Patient[] = [
  {
    id: "1",
    name: "John Smith",
    lastMessage: "Thank you for the prescription",
    timestamp: "10:30 AM",
    unread: 2,
    avatar: "JS",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    lastMessage: "When is my next appointment?",
    timestamp: "Yesterday",
    unread: 0,
    avatar: "SJ",
  },
  {
    id: "3",
    name: "Michael Brown",
    lastMessage: "I'm feeling much better now",
    timestamp: "2 days ago",
    unread: 0,
    avatar: "MB",
  },
]

export default function MessagesPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patients[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: "1",
      content: "Hello Doctor, I wanted to ask about my medication",
      timestamp: new Date(Date.now() - 3600000),
      read: true,
    },
    {
      id: "2",
      senderId: "doctor",
      content: "Of course! What would you like to know?",
      timestamp: new Date(Date.now() - 3000000),
      read: true,
    },
    {
      id: "3",
      senderId: "1",
      content: "Should I take it before or after meals?",
      timestamp: new Date(Date.now() - 2400000),
      read: true,
    },
    {
      id: "4",
      senderId: "doctor",
      content: "Take it after meals, twice a day. Let me send you the prescription details.",
      timestamp: new Date(Date.now() - 1800000),
      read: true,
    },
    {
      id: "5",
      senderId: "1",
      content: "Thank you for the prescription",
      timestamp: new Date(Date.now() - 600000),
      read: false,
    },
  ])

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedPatient) return

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "doctor",
      content: messageInput,
      timestamp: new Date(),
      read: false,
    }

    setMessages((prev) => [...prev, newMessage])
    setMessageInput("")
  }

  const filteredPatients = patients.filter((patient) => patient.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex h-screen flex-col">
      <Header title="Messages" />

      <div className="flex flex-1 overflow-hidden">
        {/* Patient List */}
        <div className="w-80 border-r border-border bg-card">
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
            {filteredPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`w-full border-b border-border p-4 text-left transition-colors hover:bg-accent ${
                  selectedPatient?.id === patient.id ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    {patient.avatar}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{patient.name}</p>
                      <span className="text-xs text-muted-foreground">{patient.timestamp}</span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{patient.lastMessage}</p>
                  </div>
                  {patient.unread > 0 && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {patient.unread}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {selectedPatient ? (
          <div className="flex flex-1 flex-col">
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                {selectedPatient.avatar}
              </div>
              <div>
                <p className="font-semibold text-foreground">{selectedPatient.name}</p>
                <p className="text-xs text-muted-foreground">Patient ID: {selectedPatient.id}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-background p-6">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isDoctor = message.senderId === "doctor"
                  return (
                    <div key={message.id} className={`flex gap-3 ${isDoctor ? "justify-end" : "justify-start"}`}>
                      {!isDoctor && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {selectedPatient.avatar}
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          isDoctor ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs opacity-70">
                          <Clock className="h-3 w-3" />
                          {message.timestamp.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
              <div className="flex gap-3">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-background"
                />
                <Button onClick={handleSendMessage} className="bg-primary hover:bg-primary/90">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-background">
            <p className="text-muted-foreground">Select a patient to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}
