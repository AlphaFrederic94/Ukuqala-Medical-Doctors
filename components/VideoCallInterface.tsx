"use client"

import React, { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Video, VideoOff, Share2, Phone, Users, MessageSquare, Send, Bell, ChevronDown, X, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MainVideoTile, ThumbnailRow, ControlBar, ChatSidebar } from "@/components/VideoCallComponents"

interface ChatMessage {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  text: string
  timestamp: Date
  isOwn: boolean
}

interface ParticipantData {
  uid: string
  displayName: string
  avatarUrl?: string
  isMuted: boolean
  isVideoOff: boolean
  isPresenter?: boolean
  joinedAt: Date
}

interface VideoCallInterfaceProps {
  localUser: ParticipantData
  remoteUsers: ParticipantData[]
  onToggleMute: (muted: boolean) => void
  onToggleVideo: (videoOff: boolean) => void
  onShareScreen?: () => void
  onLeaveCall: () => void
  onSendMessage: (message: string) => void
  channelName: string
  callDuration: number
  doctorProfile?: any
}

export default function VideoCallInterface({
  localUser,
  remoteUsers,
  onToggleMute,
  onToggleVideo,
  onShareScreen,
  onLeaveCall,
  onSendMessage,
  channelName,
  callDuration,
  doctorProfile,
}: VideoCallInterfaceProps) {
  const [isMuted, setIsMuted] = useState(localUser.isMuted)
  const [isVideoOff, setIsVideoOff] = useState(localUser.isVideoOff)
  const [message, setMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mainParticipantUid, setMainParticipantUid] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const thumbnailScrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleToggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    onToggleMute(newMutedState)
  }

  const handleToggleVideo = () => {
    const newVideoOffState = !isVideoOff
    setIsVideoOff(newVideoOffState)
    onToggleVideo(newVideoOffState)
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        userId: "local",
        userName: doctorProfile?.first_name || "You",
        userAvatar: doctorProfile?.avatar_url,
        text: message,
        timestamp: new Date(),
        isOwn: true,
      }
      setChatMessages([...chatMessages, newMessage])
      onSendMessage(message)
      setMessage("")
    }
  }

  const allParticipants = [localUser, ...remoteUsers]
  const mainParticipant = allParticipants.find((p) => p.uid === mainParticipantUid) || remoteUsers[0] || localUser
  const thumbnailParticipants = allParticipants.filter((p) => p.uid !== mainParticipant.uid)

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800 z-20">
        <div className="flex items-center gap-3">
          <button className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2">
            <ChevronDown size={20} className="rotate-90" />
            <span className="text-sm font-medium">{channelName}</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-300">{formatDuration(callDuration)}</span>
          </div>
          <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <Bell size={20} className="text-slate-400" />
          </button>
          {doctorProfile?.avatar_url ? (
            <img src={doctorProfile.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white font-semibold">
              {doctorProfile?.first_name?.charAt(0) || "D"}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 bg-slate-950 p-4 flex flex-col gap-4 overflow-hidden">
          {/* Main Video */}
          <MainVideoTile participant={mainParticipant} />

          {/* Participant Thumbnails */}
          <ThumbnailRow
            participants={thumbnailParticipants}
            onSelectParticipant={(uid) => setMainParticipantUid(uid)}
            scrollRef={thumbnailScrollRef}
          />

          {/* Control Bar */}
          <ControlBar
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            onToggleMute={handleToggleMute}
            onToggleVideo={handleToggleVideo}
            onShareScreen={onShareScreen}
            onLeaveCall={onLeaveCall}
          />
        </div>

        {/* Chat Sidebar */}
        {sidebarOpen && (
          <ChatSidebar
            messages={chatMessages}
            message={message}
            onMessageChange={setMessage}
            onSendMessage={handleSendMessage}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar Toggle */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute bottom-24 right-4 p-3 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white shadow-lg lg:hidden"
          >
            <MessageSquare size={20} />
          </button>
        )}
      </div>
    </div>
  )
}

