"use client"

import React, { useRef, useEffect } from "react"
import { Mic, MicOff, Video, VideoOff, Share2, Phone, Users, MessageSquare, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ParticipantData {
  uid: string
  displayName: string
  avatarUrl?: string
  isMuted: boolean
  isVideoOff: boolean
  isPresenter?: boolean
  joinedAt: Date
}

interface MainVideoTileProps {
  participant: ParticipantData
}

export function MainVideoTile({ participant }: MainVideoTileProps) {
  const getInitial = (name: string) => name?.charAt(0).toUpperCase() || "U"

  const getAvatarBgColor = (name: string) => {
    const colors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-green-500", "bg-orange-500", "bg-red-500", "bg-cyan-500", "bg-indigo-500"]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-900 shadow-2xl group">
      {/* Video Stream or Avatar */}
      {!participant.isVideoOff ? (
        <div id={`video-${participant.uid}`} className="absolute inset-0 w-full h-full" />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            {participant.avatarUrl ? (
              <img src={participant.avatarUrl} alt={participant.displayName} className="w-32 h-32 rounded-full object-cover border-4 border-slate-700 shadow-lg" />
            ) : (
              <div className={cn("w-32 h-32 rounded-full flex items-center justify-center border-4 border-slate-700 shadow-lg", getAvatarBgColor(participant.displayName))}>
                <span className="text-5xl font-bold text-white">{getInitial(participant.displayName)}</span>
              </div>
            )}
            <p className="text-lg font-medium text-white text-center">{participant.displayName}</p>
          </div>
        </div>
      )}

      {/* Mute Indicator */}
      {participant.isMuted && (
        <div className="absolute bottom-6 left-6 z-10">
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg border-2 border-white/20">
            <MicOff className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {/* Participant Name */}
      <div className="absolute bottom-6 left-6 z-10">
        {!participant.isMuted && (
          <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-sm font-medium text-white">{participant.displayName}</p>
          </div>
        )}
      </div>

      {/* Presenter Badge */}
      {participant.isPresenter && (
        <div className="absolute top-6 right-6 z-10 bg-emerald-500/80 backdrop-blur-sm px-3 py-1 rounded-full">
          <p className="text-xs font-semibold text-white">Presenter</p>
        </div>
      )}
    </div>
  )
}

interface ThumbnailRowProps {
  participants: ParticipantData[]
  onSelectParticipant: (uid: string) => void
  scrollRef: React.RefObject<HTMLDivElement>
}

export function ThumbnailRow({ participants, onSelectParticipant, scrollRef }: ThumbnailRowProps) {
  const getInitial = (name: string) => name?.charAt(0).toUpperCase() || "U"

  const getAvatarBgColor = (name: string) => {
    const colors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-green-500", "bg-orange-500", "bg-red-500", "bg-cyan-500", "bg-indigo-500"]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (participants.length === 0) return null

  const visibleParticipants = participants.slice(0, 5)
  const hiddenCount = Math.max(0, participants.length - 5)

  return (
    <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {visibleParticipants.map((participant) => (
        <button
          key={participant.uid}
          onClick={() => onSelectParticipant(participant.uid)}
          className="flex-shrink-0 w-40 h-28 rounded-lg overflow-hidden relative group cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
        >
          {!participant.isVideoOff ? (
            <div id={`thumb-${participant.uid}`} className="absolute inset-0 w-full h-full" />
          ) : (
            <div className={cn("absolute inset-0 w-full h-full flex items-center justify-center", getAvatarBgColor(participant.displayName))}>
              {participant.avatarUrl ? (
                <img src={participant.avatarUrl} alt={participant.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{getInitial(participant.displayName)}</span>
              )}
            </div>
          )}

          {/* Thumbnail Label */}
          <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-white text-xs truncate flex items-center gap-1">
            <span className="truncate">{participant.displayName}</span>
            {participant.isMuted && <MicOff size={12} className="flex-shrink-0" />}
          </div>
        </button>
      ))}

      {hiddenCount > 0 && (
        <div className="flex-shrink-0 w-40 h-28 rounded-lg bg-slate-800 flex flex-col items-center justify-center text-slate-400 border border-slate-700">
          <Users size={24} />
          <span className="text-sm mt-1 font-medium">+{hiddenCount}</span>
        </div>
      )}
    </div>
  )
}

interface ControlBarProps {
  isMuted: boolean
  isVideoOff: boolean
  onToggleMute: () => void
  onToggleVideo: () => void
  onShareScreen?: () => void
  onLeaveCall: () => void
}

export function ControlBar({ isMuted, isVideoOff, onToggleMute, onToggleVideo, onShareScreen, onLeaveCall }: ControlBarProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <button
        onClick={onToggleMute}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg",
          isMuted ? "bg-red-500 hover:bg-red-600" : "bg-slate-700 hover:bg-slate-600",
        )}
      >
        {isMuted ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
      </button>

      <button
        onClick={onToggleVideo}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg",
          isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-slate-700 hover:bg-slate-600",
        )}
      >
        {isVideoOff ? <VideoOff size={24} className="text-white" /> : <Video size={24} className="text-white" />}
      </button>

      {onShareScreen && (
        <button className="w-14 h-14 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-all shadow-lg">
          <Share2 size={24} />
        </button>
      )}

      <button onClick={onLeaveCall} className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-all shadow-lg">
        <Phone size={24} className="rotate-135" />
      </button>
    </div>
  )
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  text: string
  timestamp: Date
  isOwn: boolean
}

interface ChatSidebarProps {
  messages: ChatMessage[]
  message: string
  onMessageChange: (message: string) => void
  onSendMessage: () => void
  onClose: () => void
}

export function ChatSidebar({ messages, message, onMessageChange, onSendMessage, onClose }: ChatSidebarProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col hidden lg:flex">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
        <h3 className="font-semibold text-white">Chat</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded transition-colors">
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
              {!msg.isOwn && msg.userAvatar && <img src={msg.userAvatar} alt={msg.userName} className="w-8 h-8 rounded-full mr-2 flex-shrink-0 object-cover" />}
              <div className={cn("max-w-xs px-4 py-2 rounded-2xl", msg.isOwn ? "bg-emerald-600 text-white rounded-tr-sm" : "bg-slate-800 text-slate-100 rounded-tl-sm")}>
                {!msg.isOwn && <p className="text-xs font-semibold text-slate-400 mb-1">{msg.userName}</p>}
                <p className="text-sm">{msg.text}</p>
              </div>
              {msg.isOwn && msg.userAvatar && <img src={msg.userAvatar} alt={msg.userName} className="w-8 h-8 rounded-full ml-2 flex-shrink-0 object-cover" />}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-full text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button onClick={onSendMessage} className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-full text-white transition-colors">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

