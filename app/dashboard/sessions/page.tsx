"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Calendar, Clock, Video, Users, Mic, MicOff, VideoOff, Phone, Sparkles, Radio, Loader2, MessageSquare, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type SessionItem = {
  id: string
  title?: string
  scheduled_at?: string
  duration_minutes?: number
  patient_external_id?: string
  channel_name?: string
  call_id?: string
  started_at?: string
  ended_at?: string
  duration_seconds?: number
}

type Lounge = {
  id: string
  channel_name: string
  title?: string
}

type Participant = {
  id: string
  call_id: string
  participant_type: string
  participant_id: string
  uid: string
  role: string
  joined_at: string
  left_at?: string
  duration_seconds?: number
  display_name: string
  avatar_url?: string
  email?: string
}

type RemoteUser = {
  uid: string
  videoTrack?: any
  audioTrack?: any
  display_name?: string
  avatar_url?: string
  isMuted?: boolean
}

export default function SessionsPage() {
  const { toast } = useToast()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
  const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || ""
  const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null

  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [pastSessions, setPastSessions] = useState<SessionItem[]>([])
  const [lounge, setLounge] = useState<Lounge | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState<string | null>(null)
  const [activeCall, setActiveCall] = useState<{ callId: string; channel: string; uid: number } | null>(null)
  const [localTracks, setLocalTracks] = useState<{ audio: any; video: any } | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])
  const [rtcLib, setRtcLib] = useState<any>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [doctorProfile, setDoctorProfile] = useState<any>(null)
  const [callParticipants, setCallParticipants] = useState<string[]>([])
  const clientRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const doctorIdRef = useRef<string | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Validate environment variables on mount
  useEffect(() => {
    if (!API_URL) {
      console.error("[SessionsPage] NEXT_PUBLIC_API_URL is not configured")
      setError("API URL not configured. Please contact support.")
    }
    if (!APP_ID) {
      console.error("[SessionsPage] NEXT_PUBLIC_AGORA_APP_ID is not configured")
      setError("Agora App ID not configured. Please contact support.")
    }
  }, [])

  useEffect(() => {
    const fetchProfileAndSchedule = async () => {
      if (!API_URL || !token) return
      setLoading(true)
      try {
        const profileRes = await fetch(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } })
        const profileJson = await profileRes.json()
        if (profileRes.ok) {
          doctorIdRef.current = profileJson?.data?.id || null
          setDoctorProfile(profileJson?.data || null)
        }
        const res = await fetch(`${API_URL}/calls/schedule`, { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.message || "Unable to load sessions")
        setSessions(
          (json.data?.upcoming || []).map((r: any) => ({
            id: r.id,
            title: r.title || "Appointment",
            scheduled_at: r.scheduled_at,
            duration_minutes: r.duration_minutes,
            patient_external_id: r.patient_external_id,
            channel_name: r.channel_name,
            call_id: r.call_id,
          })),
        )
        setPastSessions(
          (json.data?.past || []).map((r: any) => ({
            id: r.id,
            title: r.title || "Appointment",
            scheduled_at: r.scheduled_at,
            duration_minutes: r.duration_minutes,
            patient_external_id: r.patient_external_id,
            channel_name: r.channel_name,
            call_id: r.call_id,
            started_at: r.started_at,
            ended_at: r.ended_at,
            duration_seconds: r.duration_seconds,
          })),
        )
        if (json.data?.lounge) {
          setLounge({ id: json.data.lounge.id, channel_name: json.data.lounge.channel_name, title: json.data.lounge.title })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load sessions")
      } finally {
        setLoading(false)
      }
    }
    fetchProfileAndSchedule()
  }, [API_URL, token])

  // Load Agora lib
  useEffect(() => {
    import("agora-rtc-sdk-ng")
      .then((m) => {
        setRtcLib(m.default)
        console.log("[Agora] SDK loaded successfully")
      })
      .catch((err) => {
        console.error("[Agora] Failed to load SDK:", err)
        setError("Failed to load video SDK. Please refresh the page.")
      })
  }, [])

  // Monitor page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.warn("[SessionsPage] Page hidden - video operations may be paused")
      } else {
        console.log("[SessionsPage] Page visible - resuming operations")
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  // Call duration timer
  useEffect(() => {
    if (!activeCall || !startTimeRef.current) return
    durationIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000)
      setCallDuration(elapsed)
    }, 1000)
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current)
    }
  }, [activeCall])

  useEffect(() => {
    if (!activeCall) return
    const updateParticipants = async () => {
      const participantMap = await fetchParticipants(activeCall.callId)
      if (!participantMap) return

      setRemoteUsers((prev) =>
        prev.map((user) => {
          const participant = participantMap.get(user.uid)
          return {
            ...user,
            display_name: participant?.display_name || user.display_name || `User ${user.uid}`,
            avatar_url: participant?.avatar_url || user.avatar_url,
          }
        }),
      )
    }

    updateParticipants()
    const interval = setInterval(updateParticipants, 5000)
    return () => clearInterval(interval)
  }, [activeCall, API_URL, token])

  // Init Agora client
  useEffect(() => {
    if (!APP_ID || !rtcLib) return
    const createClient = async () => {
      const c = rtcLib.createClient({ mode: "rtc", codec: "vp8" })
      clientRef.current = c
      c.enableAudioVolumeIndicator()
      c.on("user-published", async (user: any, mediaType: any) => {
        await c.subscribe(user, mediaType)
        const userUid = String(user.uid)
        setRemoteUsers((prev) => {
          const existing = prev.find((u) => u.uid === userUid)
          const isNewUser = !existing
          const next = existing
            ? prev.map((u) =>
                u.uid === userUid
                  ? {
                      uid: userUid,
                      videoTrack: user.videoTrack,
                      audioTrack: user.audioTrack,
                      display_name: u.display_name,
                      avatar_url: u.avatar_url,
                      isMuted: u.isMuted,
                    }
                  : u,
              )
            : [
                ...prev,
                {
                  uid: userUid,
                  videoTrack: user.videoTrack,
                  audioTrack: user.audioTrack,
                  display_name: `User ${userUid}`,
                  avatar_url: undefined,
                  isMuted: false,
                },
              ]

          if (isNewUser && mediaType === "video") {
            const displayName = next.find((u) => u.uid === userUid)?.display_name || `User ${userUid}`
            toast({
              title: "Participant joined",
              description: `${displayName} has joined the call`,
              duration: 3000,
            })
            setCallParticipants((prev) => [...prev, userUid])
          }
          return next
        })
        if (mediaType === "audio") {
          try {
            user.audioTrack.play()
          } catch (err) {
            // ignore autoplay issues here; handled via UI
          }
        }
      })
      c.on("user-unpublished", (user: any) => {
        const userUid = String(user.uid)
        setRemoteUsers((prev) => {
          const participant = prev.find((u) => u.uid === userUid)
          const displayName = participant?.display_name || `User ${userUid}`
          toast({
            title: "Participant left",
            description: `${displayName} has left the call`,
            duration: 3000,
          })
          return prev.filter((u) => u.uid !== userUid)
        })
        setCallParticipants((prev) => prev.filter((u) => u !== userUid))
      })
    }
    createClient()
  }, [APP_ID, rtcLib, toast])

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => (a.scheduled_at || "").localeCompare(b.scheduled_at || ""))
  }, [sessions])

  const formatDate = (iso?: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    }
    return `${minutes}:${String(secs).padStart(2, "0")}`
  }

  const toggleMute = () => {
    if (!localTracks?.audio) return
    const newMutedState = !isMuted
    localTracks.audio.setEnabled(!newMutedState)
    setIsMuted(newMutedState)
    console.log(`[Audio] ${newMutedState ? "Muted" : "Unmuted"}`)
  }

  const toggleCamera = () => {
    if (!localTracks?.video) return
    const newCameraState = !isCameraOff
    localTracks.video.setEnabled(!newCameraState)
    setIsCameraOff(newCameraState)
    console.log(`[Camera] ${newCameraState ? "Off" : "On"}`)
  }

  const fetchParticipants = async (callId: string) => {
    if (!API_URL || !token) return
    try {
      console.log(`[Participants] Fetching for call: ${callId}`)
      const res = await fetchWithTimeout(`${API_URL}/calls/${callId}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        console.warn(`[Participants] Failed to fetch: ${res.status}`)
        return
      }
      const json = await res.json()
      const participantMap = new Map<string, Participant>()
      json.data?.forEach((p: Participant) => {
        participantMap.set(p.uid, p)
      })
      console.log(`[Participants] Fetched ${participantMap.size} participants`)
      return participantMap
    } catch (err) {
      console.error(`[Participants] Error:`, err)
      return null
    }
  }

  // Helper function for fetch with timeout
  const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 15000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const joinCall = async (opts: { callId?: string; appointmentId?: string; channel?: string; type: "appointment" | "instant" | "doctor_lounge" }) => {
    // Validate prerequisites
    const missingItems: string[] = []
    if (!API_URL) missingItems.push("API_URL")
    if (!token) missingItems.push("token")
    if (!APP_ID) missingItems.push("APP_ID")
    if (!rtcLib) missingItems.push("rtcLib")
    if (!clientRef.current) missingItems.push("clientRef")

    if (missingItems.length > 0) {
      const msg = `Cannot join call - missing: ${missingItems.join(", ")}`
      console.error("[joinCall]", msg)
      setError(msg)
      return
    }

    setJoining(opts.callId || opts.channel || "joining")
    try {
      let callId = opts.callId
      let channel = opts.channel

      console.log(`[joinCall] Starting ${opts.type} call`, { callId, channel })

      // Step 1: Create or get call
      if (opts.type === "appointment" && opts.appointmentId) {
        console.log("[joinCall] Starting appointment call for:", opts.appointmentId)
        const res = await fetchWithTimeout(`${API_URL}/calls/appointment/${opts.appointmentId}/start`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.message || "Unable to start call")
        callId = json.data.id
        channel = json.data.channel_name
        console.log("[joinCall] Appointment call created:", { callId, channel })
      }

      if (opts.type === "instant" && !callId) {
        console.log("[joinCall] Creating instant call")
        const res = await fetchWithTimeout(`${API_URL}/calls/instant`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.message || "Unable to create instant call")
        callId = json.data.id
        channel = json.data.channel_name
        console.log("[joinCall] Instant call created:", { callId, channel })
      }

      if (opts.type === "doctor_lounge" && lounge && !callId) {
        console.log("[joinCall] Joining doctor lounge")
        callId = lounge.id
        channel = lounge.channel_name
        console.log("[joinCall] Doctor lounge details:", { callId, channel })
      }

      if (!callId || !channel) throw new Error("Missing call details - unable to proceed")

      // Step 2: Get Agora token
      console.log("[joinCall] Requesting Agora token for channel:", channel)
      const uid = Math.floor(Math.random() * 100000)
      const tokenRes = await fetchWithTimeout(`${API_URL}/calls/${callId}/token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uid, role: "publisher" }),
      })

      if (!tokenRes.ok) {
        const errorJson = await tokenRes.json().catch(() => ({}))
        throw new Error(errorJson?.message || `Token request failed with status ${tokenRes.status}`)
      }

      const tokenJson = await tokenRes.json()
      if (!tokenJson.token) throw new Error("No token received from server")
      console.log("[joinCall] Token received successfully")

      // Step 3: Create local tracks
      console.log("[joinCall] Creating local audio/video tracks")
      const localMic = await rtcLib.createMicrophoneAudioTrack()
      const localCam = await rtcLib.createCameraVideoTrack()
      console.log("[joinCall] Local tracks created")

      // Step 4: Join Agora channel
      console.log("[joinCall] Joining Agora channel:", { channel, uid })
      const c = clientRef.current
      await c.join(APP_ID, channel, tokenJson.token, uid)
      console.log("[joinCall] Successfully joined Agora channel")

      // Step 5: Publish tracks
      console.log("[joinCall] Publishing local tracks")
      await c.publish([localMic, localCam])
      console.log("[joinCall] Tracks published successfully")

      setLocalTracks({ audio: localMic, video: localCam })
      setActiveCall({ callId, channel, uid })
      setCallDuration(0)
      setIsMuted(false)
      setIsCameraOff(false)
      startTimeRef.current = Date.now()

      // Step 6: Register participant
      console.log("[joinCall] Registering participant")
      await fetchWithTimeout(`${API_URL}/calls/${callId}/participants/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          participantType: "doctor",
          participantId: doctorIdRef.current || "doctor",
          uid: String(uid),
          role: "host",
        }),
      })
      console.log("[joinCall] Participant registered successfully")

      // Show success toast
      toast({
        title: "Call started",
        description: `You've joined the call. Channel: ${channel}`,
        duration: 3000,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to join call"
      console.error("[joinCall] Error:", errorMsg, err)
      setError(errorMsg)
      toast({
        title: "Failed to join call",
        description: errorMsg,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setJoining(null)
    }
  }

  const leaveCall = async () => {
    if (!activeCall || !clientRef.current) return
    const durationSeconds = startTimeRef.current ? Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)) : undefined
    try {
      await fetch(`${API_URL}/calls/${activeCall.callId}/participants/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ participantType: "doctor", participantId: doctorIdRef.current || "doctor" }),
      })
      await fetch(`${API_URL}/calls/${activeCall.callId}/end`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ durationSeconds }),
      })
    } catch (err) {
      // non-blocking
    }
    try {
      if (localTracks?.audio) localTracks.audio.close()
      if (localTracks?.video) localTracks.video.close()
      await clientRef.current.leave()
    } catch (err) {
      // ignore
    }
    setLocalTracks(null)
    setRemoteUsers([])
    setActiveCall(null)
    startTimeRef.current = null
  }

  useEffect(() => {
    if (localTracks?.video) {
      localTracks.video.play("local-player")
    }
  }, [localTracks])

  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        const elId = `remote-${user.uid}`
        user.videoTrack.play(elId)
      }
    })
  }, [remoteUsers])

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Header title="My Sessions" />
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">My Sessions</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Manage your video consultations and meetings</p>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-2">
          <Button
            onClick={() => lounge && joinCall({ type: "doctor_lounge", callId: lounge.id, channel: lounge.channel_name })}
            disabled={!lounge || joining !== null}
            className="h-auto py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <Radio className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm font-semibold">Doctor Lounge</span>
            </div>
          </Button>
          <Button
            onClick={() => joinCall({ type: "instant" })}
            disabled={joining !== null}
            className="h-auto py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-xs sm:text-sm font-semibold">Instant Call</span>
            </div>
          </Button>
        </div>

        {/* Status Cards - Soft UI Design */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Upcoming Sessions Card */}
          <Card className="rounded-2xl border-0 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Upcoming</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">{sessions.length}</p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-1">Ready to join</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          {/* Doctor Lounge Card */}
          <Card className="rounded-2xl border-0 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Lounge</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">Live</p>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-1">Always available</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Radio className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>

          {/* Instant Call Card */}
          <Card className="rounded-2xl border-0 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Instant</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">Ready</p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-1">Start anytime</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Sessions Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-white dark:bg-slate-800 p-1 shadow-sm">
            <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Past Sessions
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Sessions Tab */}
          <TabsContent value="upcoming" className="mt-6 space-y-3">
            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{error}</p>}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            )}
            {sortedSessions.length === 0 && !loading && (
              <Card className="rounded-2xl border-0 bg-white dark:bg-slate-800 shadow-sm p-8 text-center">
                <Video className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">No upcoming sessions</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Your scheduled appointments will appear here</p>
              </Card>
            )}
            {sortedSessions.map((s) => (
              <Card key={s.id} className="rounded-2xl border-0 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">{s.title || "Appointment"}</h4>
                      <Badge className="shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0">Scheduled</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 shrink-0" />
                        {formatDate(s.scheduled_at)}
                      </span>
                      {s.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 shrink-0" />
                          {s.duration_minutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => joinCall({ type: "appointment", appointmentId: s.id, callId: s.call_id, channel: s.channel_name })}
                    disabled={joining !== null}
                    className="w-full sm:w-auto rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    {joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                    Join
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Past Sessions Tab */}
          <TabsContent value="past" className="mt-6 space-y-3">
            {pastSessions.length === 0 && !loading && (
              <Card className="rounded-2xl border-0 bg-white dark:bg-slate-800 shadow-sm p-8 text-center">
                <Clock className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">No past sessions</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Your completed sessions will appear here</p>
              </Card>
            )}
            {pastSessions.map((s) => {
              const actualDuration = s.duration_seconds ? Math.floor(s.duration_seconds / 60) : s.duration_minutes || 0
              return (
                <Card key={s.id} className="rounded-2xl border-0 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{s.title || "Appointment"}</h4>
                      <Badge className="w-fit bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-0">Completed</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                      <div>
                        <p className="text-slate-500 dark:text-slate-500 font-medium">Meeting ID</p>
                        <p className="text-slate-900 dark:text-white font-mono text-xs mt-1">{s.id.slice(0, 8)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-500 font-medium">Date & Time</p>
                        <p className="text-slate-900 dark:text-white mt-1">{formatDate(s.scheduled_at)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-500 font-medium">Duration</p>
                        <p className="text-slate-900 dark:text-white mt-1">{actualDuration} min</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-500 font-medium">Participants</p>
                        <p className="text-slate-900 dark:text-white mt-1 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          2
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <Button variant="ghost" size="sm" className="flex-1 rounded-lg text-xs sm:text-sm">
                        <MessageSquare className="mr-1 h-4 w-4" />
                        Chat
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 rounded-lg text-xs sm:text-sm">
                        <Download className="mr-1 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </TabsContent>
        </Tabs>
      </div>

      {activeCall && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-background/80 border-b border-border">
            <div>
              <p className="text-sm text-muted-foreground">Channel</p>
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-foreground">{activeCall.channel}</p>
                <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  {formatDuration(callDuration)}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="sm"
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                variant={isCameraOff ? "destructive" : "outline"}
                size="sm"
                onClick={toggleCamera}
                title={isCameraOff ? "Turn on camera" : "Turn off camera"}
              >
                {isCameraOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
              <Button variant="destructive" size="sm" onClick={leaveCall} className="bg-red-600 hover:bg-red-700 text-white">
                <Phone className="h-4 w-4 mr-1 rotate-135" />
                Leave
              </Button>
            </div>
          </div>
          <div ref={containerRef} className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            <div className={cn("relative rounded-xl overflow-hidden bg-muted/30 border border-border", localTracks ? "shadow-inner" : "")}>
              {isCameraOff && doctorProfile ? (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                  <div className="flex flex-col items-center gap-2">
                    {doctorProfile.avatar_url ? (
                      <img src={doctorProfile.avatar_url} alt={doctorProfile.first_name} className="h-24 w-24 rounded-full object-cover" />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-2xl font-semibold text-primary">{doctorProfile.first_name?.charAt(0) || "D"}</span>
                      </div>
                    )}
                    <p className="text-sm text-white text-center">{doctorProfile.first_name || "You"}</p>
                  </div>
                </div>
              ) : (
                <div id="local-player" className="h-full w-full" />
              )}
              {isMuted && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500/80 rounded-lg px-2 py-1">
                  <MicOff className="h-3 w-3 text-white" />
                  <span className="text-xs text-white font-medium">Muted</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">You</div>
            </div>
            {remoteUsers.map((user) => (
              <div key={user.uid} className="relative rounded-xl overflow-hidden bg-muted/30 border border-border">
                {user.videoTrack ? (
                  <div id={`remote-${user.uid}`} className="h-full w-full" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                    <div className="flex flex-col items-center gap-2">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.display_name} className="h-20 w-20 rounded-full object-cover" />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xl font-semibold text-primary">{user.display_name?.charAt(0) || "U"}</span>
                        </div>
                      )}
                      <p className="text-xs text-white text-center px-2">{user.display_name || `User ${user.uid}`}</p>
                    </div>
                  </div>
                )}
                {user.isMuted && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500/80 rounded-lg px-2 py-1">
                    <MicOff className="h-3 w-3 text-white" />
                    <span className="text-xs text-white font-medium">Muted</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">{user.display_name || `User ${user.uid}`}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
