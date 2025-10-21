"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"
import { Upload, Send, Calendar, FileText, Search, MoreVertical, Eye, Mail, Clock, CheckCircle2 } from "lucide-react"

interface PatientRecord {
  id: string
  patientName: string
  recordType: string
  date: string
  size: string
  sentTo?: { email: string; date: string }[]
}

const mockRecords: PatientRecord[] = [
  {
    id: "1",
    patientName: "John Smith",
    recordType: "Lab Results",
    date: "2025-10-15",
    size: "2.4 MB",
    sentTo: [{ email: "specialist@hospital.com", date: "2025-10-16" }],
  },
  {
    id: "2",
    patientName: "Sarah Johnson",
    recordType: "X-Ray Report",
    date: "2025-10-18",
    size: "5.1 MB",
  },
  {
    id: "3",
    patientName: "Michael Brown",
    recordType: "Prescription",
    date: "2025-10-20",
    size: "156 KB",
    sentTo: [
      { email: "pharmacy@medstore.com", date: "2025-10-20" },
      { email: "patient@email.com", date: "2025-10-20" },
    ],
  },
]

export default function PatientRecordsPage() {
  const [records] = useState<PatientRecord[]>(mockRecords)
  const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredRecords = records.filter(
    (record) =>
      record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.recordType.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Patient Records" />

      <div className="p-4 sm:p-6 lg:p-8 bg-background">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Patient Records Management</h1>
          <p className="text-muted-foreground">
            Securely store, manage, and share patient medical records with confidentiality protection
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Section - Upload & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload New Record */}
            <Card className="p-6 border border-border bg-card">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload New Record
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input id="patientName" placeholder="Enter patient name" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="recordType">Record Type</Label>
                  <select
                    id="recordType"
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option>Lab Results</option>
                    <option>X-Ray Report</option>
                    <option>Prescription</option>
                    <option>Medical History</option>
                    <option>Consultation Notes</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="file">Upload File</Label>
                  <div className="mt-1 flex items-center justify-center w-full">
                    <label
                      htmlFor="file"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 10MB)</p>
                      </div>
                      <input id="file" type="file" className="hidden" />
                    </label>
                  </div>
                </div>
                <Button className="w-full bg-primary text-primary-foreground">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Record
                </Button>
              </div>
            </Card>

            {/* Schedule Physical Appointment */}
            <Card className="p-6 border border-border bg-card">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Schedule Appointment
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Schedule a physical appointment with a patient and send them a notification
              </p>
              <Button
                onClick={() => setShowAppointmentModal(true)}
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary/10"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Create Appointment
              </Button>
            </Card>
          </div>

          {/* Right Section - Records List */}
          <div className="lg:col-span-2">
            <Card className="p-6 border border-border bg-card">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-lg font-bold text-foreground">Stored Records</h3>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{record.patientName}</h4>
                        <p className="text-sm text-muted-foreground">{record.recordType}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {record.date}
                          </span>
                          <span>{record.size}</span>
                          {record.sentTo && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Sent to {record.sentTo.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedRecord(record)
                          setShowSendModal(true)
                        }}
                        title="Send via email"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="View record (protected)">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedRecord && selectedRecord.sentTo && selectedRecord.sentTo.length > 0 && (
                <div className="mt-6 p-4 border border-border rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Sharing History for {selectedRecord.patientName}
                  </h4>
                  <div className="space-y-2">
                    {selectedRecord.sentTo.map((sent, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{sent.email}</span>
                        <span className="text-muted-foreground">{sent.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Send Record Modal */}
        {showSendModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6 border border-border bg-card">
              <h3 className="text-lg font-bold text-foreground mb-4">Send Record via Email</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sending: <span className="font-semibold text-foreground">{selectedRecord.recordType}</span> for{" "}
                {selectedRecord.patientName}
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipientEmail">Recipient Email</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="recipient@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    <strong>Confidentiality Protection:</strong> Recipients cannot download or screenshot this record.
                    Access is view-only and tracked.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowSendModal(false)
                      setRecipientEmail("")
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-primary text-primary-foreground">
                    <Send className="h-4 w-4 mr-2" />
                    Send Record
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Appointment Modal */}
        {showAppointmentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg p-6 border border-border bg-card">
              <h3 className="text-lg font-bold text-foreground mb-4">Schedule Physical Appointment</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="appointmentPatient">Patient Name</Label>
                  <Input id="appointmentPatient" placeholder="Select or enter patient name" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointmentDate">Date</Label>
                    <Input id="appointmentDate" type="date" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="appointmentTime">Time</Label>
                    <Input id="appointmentTime" type="time" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="appointmentType">Appointment Type</Label>
                  <select
                    id="appointmentType"
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground mt-1"
                  >
                    <option>General Consultation</option>
                    <option>Follow-up</option>
                    <option>Specialist Referral</option>
                    <option>Lab Results Review</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="appointmentNotes">Notes (Optional)</Label>
                  <textarea
                    id="appointmentNotes"
                    rows={3}
                    placeholder="Add any additional notes..."
                    className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground mt-1"
                  />
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Patient will receive an email notification with appointment details
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowAppointmentModal(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-primary text-primary-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule & Send
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
