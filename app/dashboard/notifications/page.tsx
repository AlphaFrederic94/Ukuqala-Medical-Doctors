"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle2, Clock } from "lucide-react"

type Notification = {
  id: string
  type: string
  title: string
  message?: string
  unread: boolean
  created_at: string
  meta?: any
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null

  const load = () => {
    if (!token || !API_URL) return
    setLoading(true)
    fetch(`${API_URL}/notifications${filter === "unread" ? "?unread=true" : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) setItems(json.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [filter])

  const unreadCount = useMemo(() => items.filter((n) => n.unread).length, [items])

  const markRead = async (id: string) => {
    if (!token || !API_URL) return
    await fetch(`${API_URL}/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Notifications" />
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">Reminders, unread messages, and updates.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
              All
            </Button>
            <Button variant={filter === "unread" ? "default" : "outline"} onClick={() => setFilter("unread")}>
              Unread {unreadCount ? `(${unreadCount})` : ""}
            </Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        <Card className="p-4 border border-border bg-card space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Loading notifications...</p>}
          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-6 w-6 mb-2" />
              <p className="text-sm">No notifications</p>
            </div>
          )}
          {!loading &&
            items.map((n) => {
              const date = new Date(n.created_at)
              return (
                <div
                  key={n.id}
                  className={`rounded-md border px-4 py-3 ${n.unread ? "border-primary/40 bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{n.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {n.type}
                        </Badge>
                      </div>
                      {n.message && <p className="text-sm text-muted-foreground">{n.message}</p>}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {date.toLocaleString()}
                        {!n.unread && (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                    {n.unread && (
                      <Button size="sm" variant="outline" onClick={() => markRead(n.id)}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
        </Card>
      </div>
    </div>
  )
}
