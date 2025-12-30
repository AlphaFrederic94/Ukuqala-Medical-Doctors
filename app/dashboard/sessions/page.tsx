"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Calendar, Clock, Video, Users, Mic, MicOff, VideoOff, Phone, Sparkles, Radio, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"

type SessionItem = {
  id: string
  title?: string
  scheduled_at?: string
  duration_minutes?: number
  patient_external_id?: string
  channel_name?: string
  call_id?: string
}

type Lounge = {
  id: string
  channel_name: string
  title?: string
}

type RemoteUser = { uid: string; videoTrack?: any; audioTrack?: any }

export default function SessionsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
  const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || ""
  const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null

  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [lounge, setLounge] = useState<Lounge | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState<string | null>(null)
  const [activeCall, setActiveCall] = useState<{ callId: string; channel: string; uid: number } | null>(null)
  const [localTracks, setLocalTracks] = useState<{ audio: any; video: any } | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])
  const [rtcLib, setRtcLib] = useState<any>(null)
  const clientRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const doctorIdRef = useRef<string | null>(null)

  useEffect(() => {
    const fetchProfileAndSchedule = async () => {
      if (!API_URL || !token) return
      setLoading(true)
      try {
        const profileRes = await fetch(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } })
        const profileJson = await profileRes.json()
        if (profileRes.ok) {
          doctorIdRef.current = profileJson?.data?.id || null
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
    import("agora-rtc-sdk-ng").then((m) => setRtcLib(m.default))
  }, [])

  // Init Agora client
  useEffect(() => {
    if (!APP_ID || !rtcLib) return
    const createClient = async () => {
      const c = rtcLib.createClient({ mode: "rtc", codec: "vp8" })
      clientRef.current = c
      c.enableAudioVolumeIndicator()
      c.on("user-published", async (user: any, mediaType: any) => {
        await c.subscribe(user, mediaType)
        setRemoteUsers((prev) => {
          const existing = prev.find((u) => u.uid === String(user.uid))
          const next = existing
            ? prev.map((u) => (u.uid === String(user.uid) ? { uid: String(user.uid), videoTrack: user.videoTrack, audioTrack: user.audioTrack } : u))
            : [...prev, { uid: String(user.uid), videoTrack: user.videoTrack, audioTrack: user.audioTrack }]
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
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== String(user.uid)))
      })
    }
    createClient()
  }, [APP_ID, rtcLib])

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => (a.scheduled_at || "").localeCompare(b.scheduled_at || ""))
  }, [sessions])

  const formatDate = (iso?: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const joinCall = async (opts: { callId?: string; appointmentId?: string; channel?: string; type: "appointment" | "instant" | "doctor_lounge" }) => {
    if (!API_URL || !token || !APP_ID || !rtcLib) return
    if (!clientRef.current) return
    setJoining(opts.callId || opts.channel || "joining")
    try {
      let callId = opts.callId
      let channel = opts.channel
      if (opts.type === "appointment" && opts.appointmentId) {
        const res = await fetch(`${API_URL}/calls/appointment/${opts.appointmentId}/start`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.message || "Unable to start call")
        callId = json.data.id
        channel = json.data.channel_name
      }
      if (opts.type === "instant" && !callId) {
        const res = await fetch(`${API_URL}/calls/instant`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.message || "Unable to create instant call")
        callId = json.data.id
        channel = json.data.channel_name
      }
      if (opts.type === "doctor_lounge" && lounge && !callId) {
        callId = lounge.id
        channel = lounge.channel_name
      }
      if (!callId || !channel) throw new Error("Missing call details")

      const uid = Math.floor(Math.random() * 100000)
      const tokenRes = await fetch(`${API_URL}/calls/${callId}/token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uid, role: "publisher" }),
      })
      const tokenJson = await tokenRes.json()
      if (!tokenRes.ok) throw new Error(tokenJson?.message || "Unable to fetch token")

      const localMic = await rtcLib.createMicrophoneAudioTrack()
      const localCam = await rtcLib.createCameraVideoTrack()
      const c = clientRef.current
      await c.join(APP_ID, channel, tokenJson.token, uid)
      await c.publish([localMic, localCam])
      setLocalTracks({ audio: localMic, video: localCam })
      setActiveCall({ callId, channel, uid })
      startTimeRef.current = Date.now()
      await fetch(`${API_URL}/calls/${callId}/participants/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          participantType: "doctor",
          participantId: doctorIdRef.current || "doctor",
          uid: String(uid),
          role: "host",
        }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join call")
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
    <div className="flex flex-col">
      <Header title="My Sessions" />
      <div className="p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Video Sessions</h1>
            <p className="text-sm text-muted-foreground">Join scheduled appointments, the doctor lounge, or start an instant meeting.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => lounge && joinCall({ type: "doctor_lounge", callId: lounge.id, channel: lounge.channel_name })}
              disabled={!lounge || joining !== null}
              className="border-border bg-card"
            >
              <Radio className="mr-2 h-4 w-4" />
              Doctor Lounge
            </Button>
            <Button onClick={() => joinCall({ type: "instant" })} disabled={joining !== null}>
              <Sparkles className="mr-2 h-4 w-4" />
              Start Instant Meeting
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">Upcoming</p>
                <p className="text-sm text-muted-foreground">Sessions ready to join</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Video className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold text-foreground">{sessions.length}</div>
          </Card>
          <Card className="border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">Doctor Lounge</p>
                <p className="text-sm text-muted-foreground">Always-on room</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Radio className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold text-emerald-700">Live</div>
          </Card>
          <Card className="border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">Instant Call</p>
                <p className="text-sm text-muted-foreground">Start any time</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold text-blue-700">Ready</div>
          </Card>
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Upcoming sessions</h3>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {sortedSessions.length === 0 && !loading && (
            <Card className="border border-border bg-card p-6 text-sm text-muted-foreground">No sessions scheduled.</Card>
          )}
          {sortedSessions.map((s) => (
            <Card key={s.id} className="border border-border bg-card p-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-foreground">{s.title || "Appointment"}</h4>
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Scheduled</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(s.scheduled_at)}
                  </span>
                  {s.duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {s.duration_minutes} min
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={() => joinCall({ type: "appointment", appointmentId: s.id, callId: s.call_id, channel: s.channel_name })}
                disabled={joining !== null}
                className="shrink-0"
              >
                {joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                Join
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {activeCall && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-background/80 border-b border-border">
            <div>
              <p className="text-sm text-muted-foreground">Channel</p>
              <p className="text-lg font-semibold text-foreground">{activeCall.channel}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (localTracks?.audio) localTracks.audio.setEnabled(!localTracks.audio.isEnabled)
                }}
              >
                {localTracks?.audio?.isEnabled === false ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (localTracks?.video) localTracks.video.setEnabled(!localTracks.video.isEnabled)
                }}
              >
                {localTracks?.video?.isEnabled === false ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
              <Button variant="destructive" size="sm" onClick={leaveCall} className="bg-red-600 hover:bg-red-700 text-white">
                <Phone className="h-4 w-4 mr-1 rotate-135" />
                Leave
              </Button>
            </div>
          </div>
          <div ref={containerRef} className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            <div className={cn("relative rounded-xl overflow-hidden bg-muted/30 border border-border", localTracks ? "shadow-inner" : "")}>
              <div id="local-player" className="h-full w-full" />
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">You</div>
            </div>
            {remoteUsers.map((user) => (
              <div key={user.uid} className="relative rounded-xl overflow-hidden bg-muted/30 border border-border">
                <div id={`remote-${user.uid}`} className="h-full w-full" />
                <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">Remote {user.uid}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
