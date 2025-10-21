"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Bookmark,
  Video,
  Users,
  Settings,
  MessageSquare,
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Appointments", href: "/dashboard/appointments", icon: Bookmark },
  { name: "My Sessions", href: "/dashboard/sessions", icon: Video },
  { name: "My Patients", href: "/dashboard/patients", icon: Users },
  { name: "Medical Chatbot", href: "/dashboard/chatbot", icon: Bot },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Patient Records", href: "/dashboard/records", icon: FileText },
  { name: "Profile", href: "/dashboard/profile", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <div
        className={`flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 ${
          isCollapsed ? "w-[80px]" : "w-[285px]"
        } ${isMobileMenuOpen ? "fixed inset-y-0 left-0 z-50" : "hidden lg:flex"}`}
      >
        <div className="flex flex-col items-center gap-4 border-b border-border px-6 py-6">
          <div className="flex w-full items-center justify-between">
            {!isCollapsed && <div className="text-xs font-medium text-muted-foreground">PROFILE</div>}
            {!isCollapsed && <ThemeToggle />}
          </div>
          <Avatar
            className={`border-2 border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 ${isCollapsed ? "h-12 w-12" : "h-20 w-20"}`}
          >
            <AvatarFallback className="bg-transparent text-2xl font-bold text-primary">UM</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="text-center">
                <p className="text-lg font-bold text-sidebar-foreground">Dr. Ukuqala</p>
                <p className="text-xs text-muted-foreground">doctor@ukuqala.com</p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Active
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full border-border bg-card hover:bg-accent">
                Log out
              </Button>
            </>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full justify-center"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </>
  )
}
