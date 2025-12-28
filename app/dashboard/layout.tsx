import type React from "react"
import { Sidebar } from "@/components/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto pt-16 lg:pt-0 lg:ml-72"
        style={{ marginLeft: "var(--sidebar-width, 0px)" }}
      >
        {children}
      </main>
    </div>
  )
}
