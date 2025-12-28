"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import remarkGfm from "remark-gfm"
import {
  Search,
  Menu,
  X,
  Plus,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Share2,
  Bookmark,
  Edit,
  RefreshCw,
  Link as LinkIcon,
  Mic,
  Image,
  FileText,
  Calendar,
  Video,
  Send,
  Heart,
  Reply,
  Loader2,
} from "lucide-react"

type Conversation = {
  id: string
  title: string
  created_at?: string
}

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  created_at?: string
  thinking?: boolean
}

type Toast = { id: number; message: string; variant?: "default" | "error" | "success" }

const Markdown = dynamic(() => import("react-markdown"), { ssr: false })
const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
const WELCOME_MESSAGE =
  "Sawubona! Ngiyabona. I'm Qala-lwazi, your medical assistant. Ask anything and I'll help with evidence-based answers."

export default function ChatbotPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"prompt" | "upload">("prompt")
  const [showDrawer, setShowDrawer] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [reactions, setReactions] = useState<Record<string, { liked?: boolean; saved?: boolean }>>({})
  const [toasts, setToasts] = useState<Toast[]>([])
  const streamingInterval = useRef<NodeJS.Timeout | null>(null)

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null), [])

  const formatTime = (iso?: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    return d.toLocaleString()
  }

  const pushToast = (message: string, variant: Toast["variant"] = "default") => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2400)
  }

  const fetchConversations = useCallback(async () => {
    if (!token || !API_URL) return
    try {
      const res = await fetch(`${API_URL}/chatbot/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || "Failed to load conversations")
      setConversations(json.data || [])
      if (json.data?.length && !selectedChat) setSelectedChat(json.data[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load conversations")
    }
  }, [API_URL, token, selectedChat])

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!token || !API_URL || !conversationId) return
      setLoadingMessages(true)
      try {
        const res = await fetch(`${API_URL}/chatbot/conversations/${conversationId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.message || "Failed to load messages")
        setMessages(json.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load messages")
      } finally {
        setLoadingMessages(false)
      }
    },
    [API_URL, token]
  )

  useEffect(() => {
    fetchConversations()
    return () => {
      if (streamingInterval.current) clearInterval(streamingInterval.current)
    }
  }, [fetchConversations])

  useEffect(() => {
    if (selectedChat) fetchMessages(selectedChat)
  }, [selectedChat, fetchMessages])

  const createConversation = async () => {
    if (!token || !API_URL) return
    try {
      const res = await fetch(`${API_URL}/chatbot/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: "New chat" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || "Failed to create conversation")
      const newConv = json.data
      const newList = [newConv, ...(conversations || [])]
      setConversations(newList)
      setSelectedChat(newConv?.id || null)
      setMessages([{ id: "welcome", role: "assistant", content: WELCOME_MESSAGE }])
      setShowDrawer(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create conversation")
    }
  }

  const maybeRenameConversation = (content: string) => {
    if (!selectedChat) return
    const conv = conversations.find((c) => c.id === selectedChat)
    if (!conv) return
    const titleIsNew = !conv.title || conv.title.toLowerCase().includes("new chat")
    const noPriorUser = !messages.some((m) => m.role === "user")
    if (titleIsNew && noPriorUser) {
      const words = content.trim().split(/\s+/).slice(0, 5).join(" ")
      const newTitle = words.length ? words : "Conversation"
      setConversations((prev) => prev.map((c) => (c.id === selectedChat ? { ...c, title: newTitle } : c)))
    }
  }

  const streamText = (messageId: string, fullText: string) => {
    if (streamingInterval.current) clearInterval(streamingInterval.current)
    const words = fullText.split(" ")
    let idx = 0
    streamingInterval.current = setInterval(() => {
      idx += 1
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: words.slice(0, idx).join(" "), thinking: false } : m
        )
      )
      if (idx >= words.length) {
        if (streamingInterval.current) clearInterval(streamingInterval.current)
      }
    }, 30)
  }

  const sendMessage = async (content: string, options?: { skipEcho?: boolean; thinkingLabel?: string }) => {
    if (!content.trim() || !selectedChat || !token || !API_URL) return
    const thinkingLabel = options?.thinkingLabel || "Qala-lwazi is thinking..."
    const hasUserBefore = messages.some((m) => m.role === "user")
    const userId = `user-${Date.now()}`
    const thinkingId = `assistant-thinking-${Date.now()}`

    setSending(true)
    setError(null)
    setMessages((prev) => [
      ...prev,
      ...(options?.skipEcho ? [] : [{ id: userId, role: "user", content, created_at: new Date().toISOString() }]),
      { id: thinkingId, role: "assistant", content: thinkingLabel, thinking: true, created_at: new Date().toISOString() },
    ])

    try {
      const res = await fetch(`${API_URL}/chatbot/conversations/${selectedChat}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || "Failed to send message")

      const serverMessages: ChatMessage[] = json.data || []
      const lastAssistant = [...serverMessages].reverse().find((m) => m.role === "assistant")
      if (lastAssistant) {
        const rest = serverMessages.filter((m) => m.id !== lastAssistant.id)
        setMessages([...rest, { ...lastAssistant, content: "", thinking: true }])
        streamText(lastAssistant.id, lastAssistant.content || "")
      } else {
        setMessages(serverMessages)
      }

      if (!hasUserBefore && !options?.skipEcho) {
        maybeRenameConversation(content)
      }
      setMessage("")
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "Unable to send message"
      setError(messageText)
      pushToast(messageText, "error")
    } finally {
      setSending(false)
    }
  }

  const handleSend = () => sendMessage(message)

  const toggleReaction = async (messageId: string, type: "like" | "save") => {
    if (!token || !API_URL) return
    setReactions((prev) => {
      const current = prev[messageId] || {}
      return {
        ...prev,
        [messageId]: {
          ...current,
          [type === "like" ? "liked" : "saved"]: !current[type === "like" ? "liked" : "saved"],
        },
      }
    })
    try {
      await fetch(`${API_URL}/chatbot/messages/${messageId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reaction: type, active: true }),
      })
      pushToast(type === "like" ? "Liked" : "Saved", "success")
    } catch {
      // ignore
    }
  }

  const handleCopy = async (text: string) => {
    if (!navigator.clipboard) return
    await navigator.clipboard.writeText(text)
    pushToast("Copied!", "success")
  }

  const handleRegenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    if (!lastUser) {
      pushToast("No prompt to regenerate", "error")
      return
    }
    sendMessage(lastUser.content, { skipEcho: true, thinkingLabel: "Regenerating response..." })
  }

  const handleShare = async (conversationId: string) => {
    if (typeof window === "undefined") return
    const shareLink = `${window.location.origin}/dashboard/chatbot?conversation=${conversationId}`
    try {
      if (navigator.share) {
        await navigator.share({ title: "Conversation", url: shareLink })
      } else {
        await navigator.clipboard.writeText(shareLink)
      }
      pushToast("Share link ready", "success")
    } catch {
      pushToast("Unable to share right now", "error")
    }
  }

  const markdownComponents = {
    p: (props: any) => <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-2 last:mb-0" {...props} />,
    strong: (props: any) => <strong className="font-semibold text-gray-900" {...props} />,
    table: (props: any) => (
      <div className="overflow-x-auto rounded-lg border border-gray-200 mb-3">
        <table className="min-w-full text-sm text-left" {...props} />
      </div>
    ),
    thead: (props: any) => <thead className="bg-gray-100" {...props} />,
    th: (props: any) => <th className="px-3 py-2 font-semibold text-gray-900 border-b border-gray-200" {...props} />,
    td: (props: any) => <td className="px-3 py-2 text-gray-800 border-b border-gray-100" {...props} />,
    tr: (props: any) => <tr className="odd:bg-white even:bg-gray-50" {...props} />,
    hr: () => <hr className="my-3 border-gray-200" />,
    ul: (props: any) => <ul className="list-disc pl-5 space-y-1 text-gray-800 mb-2" {...props} />,
    ol: (props: any) => <ol className="list-decimal pl-5 space-y-1 text-gray-800 mb-2" {...props} />,
    code: (props: any) => (
      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-900" {...props} />
    ),
  }

  const renderEmptyState = () => (
    <div className="h-full flex flex-col items-center justify-center text-center text-gray-700 space-y-3 bg-white rounded-2xl border border-dashed border-gray-200 p-8">
      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-semibold">
        QL
      </div>
      <div>
        <h3 className="text-lg font-semibold">Hello, I'm Qala-lwazi</h3>
        <p className="text-sm text-gray-500">How can I help you today?</p>
      </div>
      <button
        type="button"
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        onClick={() => {
          setMessage("Tell me about your symptoms")
        }}
      >
        Ask a question
      </button>
    </div>
  )

  return (
    <div className="relative flex h-screen bg-gray-50">
      {showDrawer && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setShowDrawer(false)} aria-hidden />
      )}

      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
          showDrawer ? "fixed inset-y-0 left-0 z-40 w-80 max-w-[80vw] translate-x-0" : "hidden md:flex w-80"
        }`}
      >
        <div className="p-4 border-b border-gray-200 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Conversations</h2>
            <button
              className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors"
              onClick={createConversation}
              type="button"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
          <button
            type="button"
            className="absolute right-3 top-3 p-2 rounded-full hover:bg-gray-100 md:hidden"
            onClick={() => setShowDrawer(false)}
            aria-label="Close conversations"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {(conversations || [])
            .filter((c) => {
              if (!searchTerm.trim()) return true
              const hay = `${c.title || ""} ${formatTime(c.created_at)}`.toLowerCase()
              return hay.includes(searchTerm.toLowerCase())
            })
            .map((conv) => (
              <button
                key={conv.id}
                className={`w-full text-left p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  conv.id === selectedChat ? "bg-indigo-50 border-l-4 border-indigo-600" : ""
                }`}
                onClick={() => {
                  setSelectedChat(conv.id)
                  setShowDrawer(false)
                }}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{conv.title || "Untitled"}</h3>
                  <span className="text-xs text-gray-500">{formatTime(conv.created_at)}</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">Tap to load messages</p>
              </button>
            ))}
          {!conversations.length && (
            <div className="p-4 text-sm text-muted-foreground">No conversations yet. Create one to get started.</div>
          )}
        </div>
      </div>

      <main className="flex-1 flex flex-col bg-gray-50 min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setShowDrawer(true)}
              aria-label="Open conversations"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full" />
            <div>
              <h3 className="font-semibold text-gray-800">AI Assistant</h3>
              <p className="text-xs text-green-600">● Online</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" type="button">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" type="button">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!selectedChat && renderEmptyState()}

          {selectedChat && loadingMessages && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading messages...
            </div>
          )}

          {selectedChat && !loadingMessages && messages.length === 0 && renderEmptyState()}

          {selectedChat &&
            !loadingMessages &&
            messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-2xl">
                      <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl rounded-tr-sm p-4 shadow-sm">
                        <div className="flex items-start space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                            U
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">You</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                              </div>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-pink-300">
                          <button
                            className="flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg text-xs hover:bg-pink-50 transition-colors"
                            type="button"
                            onClick={() => toggleReaction(msg.id, "save")}
                          >
                            <Bookmark
                              className={`w-3 h-3 ${
                                reactions[msg.id]?.saved ? "text-indigo-600 fill-indigo-600" : "text-gray-700"
                              }`}
                            />
                            <span>Save</span>
                          </button>
                          <button
                            className="flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg text-xs hover:bg-pink-50 transition-colors"
                            type="button"
                            onClick={() => handleCopy(msg.content)}
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                          <button className="flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg text-xs hover:bg-pink-50 transition-colors" type="button">
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-2xl w-full">
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 hover:bg-gray-100 rounded transition-colors" type="button">
                              <Reply className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded transition-colors" type="button">
                              <Heart className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                          <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                        </div>

                        {msg.thinking ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Loader2 className="h-4 w-4 animate-spin" /> {msg.content || "Qala-lwazi is thinking..."}
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none prose-p:mb-3 prose-headings:mb-2 prose-ul:mb-3 prose-ol:mb-3">
                            <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents as any}>
                              {msg.content}
                            </Markdown>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            <button
                              className={`p-2 rounded-lg transition-colors ${
                                reactions[msg.id]?.liked ? "bg-indigo-100 text-indigo-600" : "hover:bg-gray-100"
                              }`}
                              type="button"
                              onClick={() => toggleReaction(msg.id, "like")}
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              className={`p-2 rounded-lg transition-colors ${
                                reactions[msg.id]?.saved ? "bg-indigo-100 text-indigo-600" : "hover:bg-gray-100"
                              }`}
                              type="button"
                              onClick={() => toggleReaction(msg.id, "save")}
                            >
                              <Bookmark className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                              type="button"
                              onClick={() => setReactions((prev) => ({ ...prev, [msg.id]: { ...prev[msg.id], liked: false } }))}
                            >
                              <ThumbsDown className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              className="flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg text-xs hover:bg-gray-100 transition-colors"
                              type="button"
                              onClick={() => handleCopy(msg.content)}
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                            <button
                              className="flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg text-xs hover:bg-gray-100 transition-colors"
                              type="button"
                              onClick={handleRegenerate}
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Regenerate</span>
                            </button>
                            <button
                              className="flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg text-xs hover:bg-gray-100 transition-colors"
                              type="button"
                              onClick={() => handleShare(selectedChat)}
                            >
                              <LinkIcon className="w-3 h-3" />
                              <span>Copy Link</span>
                            </button>
                            <button
                              className="flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg text-xs hover:bg-gray-100 transition-colors"
                              type="button"
                              onClick={() => handleShare(selectedChat)}
                            >
                              <Share2 className="w-3 h-3" />
                              <span>Share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>

        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-2 mb-3">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "prompt" ? "bg-black text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setActiveTab("prompt")}
                type="button"
              >
                Prompt
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "upload" ? "bg-black text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setActiveTab("upload")}
                type="button"
              >
                Upload File
              </button>
            </div>

            <div className="bg-gray-100 rounded-2xl p-3">
              <div className="flex items-center space-x-3 mb-3">
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" type="button">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" type="button">
                  <FileText className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" type="button">
                  <Bookmark className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" type="button">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" type="button">
                  <Image className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="flex items-end space-x-3">
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors mb-1" type="button">
                  <Mic className="w-5 h-5 text-gray-600" />
                </button>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent resize-none focus:outline-none text-gray-800 placeholder-gray-400 max-h-32"
                  rows={1}
                  onInput={(e) => {
                    const el = e.currentTarget
                    el.style.height = "auto"
                    el.style.height = `${el.scrollHeight}px`
                  }}
                />

                <button
                  className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-60"
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !selectedChat}
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm text-white ${
              toast.variant === "error"
                ? "bg-red-500"
                : toast.variant === "success"
                  ? "bg-emerald-600"
                  : "bg-gray-900"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
