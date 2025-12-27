"use client"

"use client"

import { useMemo, useState } from "react"
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
  Link,
  Mic,
  Image,
  FileText,
  Calendar,
  Video,
  Send,
  Heart,
  Reply,
} from "lucide-react"

type Conversation = {
  id: string
  title: string
  preview: string
  time: string
}

type ChatMessage = {
  id: number
  type: "user" | "bot"
  text: string
  time: string
  avatar?: string
  currentPage?: number
  totalPages?: number
}

const mockConversations: Conversation[] = [
  { id: "chat-1", title: "Design Thinking Discussion", preview: "Tell me about Design Thinking...", time: "2 min ago" },
  { id: "chat-2", title: "UI/UX Best Practices", preview: "What are the key principles...", time: "1 hour ago" },
  { id: "chat-3", title: "React Component Design", preview: "How to structure components...", time: "3 hours ago" },
  { id: "chat-4", title: "Color Theory Basics", preview: "Explain color psychology...", time: "Yesterday" },
  { id: "chat-5", title: "Responsive Web Design", preview: "Best practices for mobile...", time: "2 days ago" },
]

const mockMessages: ChatMessage[] = [
  { id: 1, type: "user", text: "Tell me about Design Thinking.", time: "2 min ago", avatar: "🧑" },
  {
    id: 2,
    type: "bot",
    text: "Design thinking is a problem-solving approach that emphasizes empathy, creativity, and collaboration. It involves understanding the needs and perspectives of users, generating innovative ideas, and rapidly prototyping and testing solutions.",
    time: "2 min ago",
    currentPage: 1,
    totalPages: 3,
  },
  { id: 3, type: "user", text: "What are the key principles of design?", time: "2 min ago", avatar: "🧑" },
]

export default function ChatbotPage() {
  const [selectedChat, setSelectedChat] = useState("chat-1")
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"prompt" | "upload">("prompt")
  const [showDrawer, setShowDrawer] = useState(false)

  const conversations = useMemo(() => mockConversations.map((c) => ({ ...c, active: c.id === selectedChat })), [selectedChat])

  const handleSend = () => {
    if (!message.trim()) return
    setMessage("")
  }

  return (
    <div className="relative flex h-screen bg-gray-50">
      {/* Mobile overlay backdrop */}
      {showDrawer && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setShowDrawer(false)}
          aria-hidden
        />
      )}

      {/* Conversation History Panel */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 md:static md:translate-x-0 ${
          showDrawer ? "fixed inset-y-0 left-0 z-40 w-80 max-w-[80vw] translate-x-0" : "hidden md:flex w-80"
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Conversations</h2>
            <button className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors">
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Close drawer on mobile */}
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
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className={`w-full text-left p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                conv.active ? "bg-indigo-50 border-l-4 border-indigo-600" : ""
              }`}
              onClick={() => setSelectedChat(conv.id)}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{conv.title}</h3>
                <span className="text-xs text-gray-500">{conv.time}</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">{conv.preview}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Section */}
      <main className="flex-1 flex flex-col bg-gray-50 min-w-0">
        {/* Chat Header */}
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

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {mockMessages.map((msg) => (
            <div key={msg.id}>
              {msg.type === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-2xl">
                    <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl rounded-tr-sm p-4 shadow-sm">
                      <div className="flex items-start space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                          {msg.avatar || "U"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">You</span>
                            <div className="flex items-center space-x-2">
                              <button className="p-1 hover:bg-pink-300 rounded transition-colors" type="button">
                                <Reply className="w-4 h-4 text-gray-600" />
                              </button>
                              <button className="p-1 hover:bg-pink-300 rounded transition-colors" type="button">
                                <Heart className="w-4 h-4 text-gray-600" />
                              </button>
                              <span className="text-xs text-gray-500">{msg.time}</span>
                            </div>
                          </div>
                          <p className="text-gray-800">{msg.text}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-pink-300">
                        <button className="flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg text-xs hover:bg-pink-50 transition-colors" type="button">
                          <Bookmark className="w-3 h-3" />
                          <span>Save Question</span>
                        </button>
                        <button className="flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg text-xs hover:bg-pink-50 transition-colors" type="button">
                          <Copy className="w-3 h-3" />
                          <span>Copy Question</span>
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
                    <div className="bg-gray-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 hover:bg-gray-300 rounded transition-colors" type="button">
                            <Reply className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-300 rounded transition-colors" type="button">
                            <Heart className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </div>

                      <p className="text-gray-800 leading-relaxed mb-4">{msg.text}</p>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-300">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 hover:bg-gray-300 rounded-lg transition-colors" type="button">
                            <ThumbsUp className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-300 rounded-lg transition-colors" type="button">
                            <ThumbsDown className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>

                        {msg.totalPages && (
                          <div className="flex items-center space-x-2">
                            <button className="p-1 hover:bg-gray-300 rounded transition-colors" type="button" aria-label="Previous page">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <span className="text-sm text-gray-600">
                              {msg.currentPage}/{msg.totalPages}
                            </span>
                            <button className="p-1 hover:bg-gray-300 rounded transition-colors" type="button" aria-label="Next page">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mt-3">
                        <button className="flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg text-xs hover:bg-gray-100 transition-colors" type="button">
                          <Copy className="w-3 h-3" />
                          <span>Copy Text</span>
                        </button>
                        <button className="flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg text-xs hover:bg-gray-100 transition-colors" type="button">
                          <RefreshCw className="w-3 h-3" />
                          <span>Regenerate</span>
                        </button>
                        <button className="flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg text-xs hover:bg-gray-100 transition-colors" type="button">
                          <Link className="w-3 h-3" />
                          <span>Copy Link</span>
                        </button>
                        <button className="flex items-center space-x-1 px-3 py-1.5 bg-white rounded-lg text-xs hover:bg-gray-100 transition-colors" type="button">
                          <Share2 className="w-3 h-3" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Area */}
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
                  className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
                  type="button"
                  onClick={handleSend}
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
