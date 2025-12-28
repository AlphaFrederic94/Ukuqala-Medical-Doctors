"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Video,
  Users,
  MessageSquare,
  FileText,
  User,
  Settings,
  Bot,
  LogOut,
  Sun,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Appointments", href: "/dashboard/appointments", icon: Calendar },
  { name: "My Sessions", href: "/dashboard/sessions", icon: Video },
  { name: "My Patients", href: "/dashboard/patients", icon: Users },
  { name: "Medical Chatbot", href: "/dashboard/chatbot", icon: Bot, featured: true },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Patient Records", href: "/dashboard/records", icon: FileText },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [darkToggle, setDarkToggle] = useState(false)
  const [doctor, setDoctor] = useState<{ fullName: string; email: string; avatar?: string }>({
    fullName: "Doctor",
    email: "",
  })

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null
    const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
    if (!token || !API_URL) return
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (!res.ok || !json?.data) return
        const d = json.data
        const name = `${d.first_name || ""} ${d.last_name || ""}`.trim() || d.email || "Doctor"
        setDoctor({ fullName: name, email: d.email, avatar: d.avatar_url })
      } catch {
        // ignore profile fetch errors
      }
    })()
  }, [])

  const initials = useMemo(
    () => doctor.fullName.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase() || "DR",
    [doctor.fullName]
  )

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("doctorToken")
      localStorage.removeItem("doctorRemember")
    }
    router.push("/auth/signin")
  }

  const SidebarNavItem = ({ name, href, icon: Icon, featured }: any) => {
    const active = pathname === href
    if (featured) {
      return (
        <Link
          href={href}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all mb-2 ${
            active
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
              : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
          } ${collapsed ? "justify-center" : ""}`}
          onClick={() => setMobileOpen(false)}
          title={collapsed ? name : undefined}
        >
          <Icon size={20} />
          {!collapsed && <span>{name}</span>}
        </Link>
      )
    }
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors mb-1 ${
          active ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        } ${collapsed ? "justify-center" : ""}`}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? name : undefined}
      >
        <Icon size={20} />
        {!collapsed && <span>{name}</span>}
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow-lg"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </button>
      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`flex h-screen flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-200 ${
          collapsed ? "w-20" : "w-72"
        } ${mobileOpen ? "fixed inset-y-0 left-0 z-50" : "hidden lg:flex"}`}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {!collapsed && <span className="text-xs font-semibold tracking-wide uppercase text-gray-600">Profile</span>}
              <button
                type="button"
                onClick={() => setDarkToggle((p) => !p)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Toggle dark mode"
              >
                <Sun size={18} className={darkToggle ? "text-amber-500" : "text-gray-500"} />
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4">
              {initials}
            </div>
            {!collapsed && (
              <>
                <h3 className="text-lg font-semibold text-gray-900">{doctor.fullName}</h3>
                <p className="text-sm text-gray-500 mb-3">{doctor.email}</p>
              </>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {!collapsed && <span>Active</span>}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem key={item.name} {...item} />
          ))}
        </nav>

        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-red-600 hover:bg-red-50 hover:text-red-700 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={20} />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>

        <div className="border-t border-gray-100">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3"
            onClick={() => setCollapsed((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold">
                N
              </div>
            </div>
            {collapsed ? (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
