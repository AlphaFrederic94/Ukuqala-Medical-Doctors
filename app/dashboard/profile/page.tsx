"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Header } from "@/components/header"
import {
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  MoreVertical,
  Search,
  Calendar,
  Activity,
  Users,
  FileText,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const consultationsData = [
  { day: "Mon", consultations: 12, followUps: 8 },
  { day: "Tue", consultations: 15, followUps: 10 },
  { day: "Wed", consultations: 10, followUps: 12 },
  { day: "Thu", consultations: 18, followUps: 9 },
  { day: "Fri", consultations: 14, followUps: 11 },
]

const patientData = [
  { month: "Jan", newPatients: 45, returning: 120, total: 165 },
  { month: "Feb", newPatients: 52, returning: 135, total: 187 },
  { month: "Mar", newPatients: 38, returning: 142, total: 180 },
  { month: "Apr", newPatients: 61, returning: 128, total: 189 },
  { month: "May", newPatients: 48, returning: 155, total: 203 },
]

const activityData = [
  { name: "Completed", value: 88 },
  { name: "Remaining", value: 12 },
]

const COLORS = ["#10b981", "#e5e7eb"]

export default function ProfilePage() {
  const [timeFilter, setTimeFilter] = useState("This Week")

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Doctor Profile" />

      <div className="p-4 sm:p-6 lg:p-8 bg-background">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Doctor Profile</h1>
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="search..." className="pl-10 w-full sm:w-64" />
            </div>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Calendar className="h-4 w-4" />
              All time
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <Card className="p-6 border border-border bg-card">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-bold text-foreground">Profile</h3>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-2xl font-bold text-primary-foreground">
                    UM
                  </AvatarFallback>
                </Avatar>
                <h4 className="text-xl font-bold text-foreground mb-1">Dr. Ukuqala</h4>
                <p className="text-sm text-muted-foreground">Medical Professional</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Email</p>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>doctor@ukuqala.com</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Phone</p>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>+01 923 456 78</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Location</p>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>7839 Williams Dr, Columbus, GA 31904</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Contacts</p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Avatar key={i} className="h-10 w-10 border-2 border-card">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">U{i}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    +75
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Activity</p>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-3">
                  ACTIVE
                </div>
                <p className="text-sm text-foreground mb-2">2 hours response time</p>
                <div className="w-full bg-muted rounded-full h-2 mb-1">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "86%" }} />
                </div>
                <p className="text-xs text-muted-foreground text-right">86/100%</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Patients</p>
                  <p className="text-2xl font-bold text-foreground">1,245</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Appointments</p>
                  <p className="text-2xl font-bold text-foreground">324</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-9 space-y-6">
            <Card className="p-6 border border-border bg-card">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg font-bold text-foreground">Consultations Report</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-muted-foreground">Consultations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-sm text-muted-foreground">Follow-ups</span>
                  </div>
                  <Button variant="outline" size="sm">
                    {timeFilter}
                  </Button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={consultationsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="consultations" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="followUps" fill="#a855f7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 border border-border bg-card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">1,245</p>
                      <p className="text-sm text-muted-foreground">Total Patients</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-500 font-semibold">+12.5 %</span>
                </div>
              </Card>

              <Card className="p-6 border border-border bg-card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">324</p>
                      <p className="text-sm text-muted-foreground">Appointments</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-500 font-semibold">+8.2 %</span>
                </div>
              </Card>

              <Card className="p-6 border border-border bg-card sm:col-span-2 lg:col-span-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">98.5%</p>
                      <p className="text-sm text-muted-foreground">Satisfaction</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-6 border border-border bg-card">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h3 className="text-lg font-bold text-foreground">Patient Analytics</h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-muted-foreground">New Patients</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400" />
                      <span className="text-sm text-muted-foreground">Returning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      <span className="text-sm text-muted-foreground">Total</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={patientData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Bar dataKey="newPatients" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="returning" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="total" fill="#9ca3af" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 border border-border bg-card">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-lg font-bold text-foreground">Activity Stats</h3>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex flex-col items-center">
                  <div className="relative w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {activityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-foreground">88%</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Your activity rate is
                    <br />
                    It depends on your real response
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
