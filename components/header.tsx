"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Calendar, Bell } from "lucide-react"

export function Header({ title }: { title: string }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notifCount, setNotifCount] = useState<number | null>(null)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null
    if (!token || !API_URL) return
    ;(async () => {
      try {
        const res = await fetch(`${API_URL}/notifications?unread=true`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (res.ok) {
          setNotifCount((json.data || []).length)
        }
      } catch {
        setNotifCount(null)
      }
    })()
  }, [API_URL])

  const badge = useMemo(() => {
    if (notifCount === null) return null
    if (notifCount <= 0) return null
    return (
      <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
        {notifCount}
      </span>
    )
  }, [notifCount])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border bg-card px-4 sm:px-8 py-2.5 sm:py-4 gap-1 sm:gap-3">
      <div className="flex items-center gap-2">
        <h1 className="text-base sm:text-2xl font-bold text-foreground">{title}</h1>
        <Link href="/dashboard/notifications" className="relative inline-flex items-center justify-center sm:hidden">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          {badge}
        </Link>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
        <Link href="/dashboard/notifications" className="relative hidden sm:inline-flex items-center justify-center">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          {badge}
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="text-left sm:text-right leading-tight">
            <p className="text-[11px] sm:text-sm text-muted-foreground">Today's Date</p>
            <p className="text-sm sm:text-lg font-semibold text-foreground">{formatDate(currentTime)}</p>
          </div>
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}
