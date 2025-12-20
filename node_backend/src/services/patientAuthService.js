const bcrypt = require("bcryptjs")
const { supabase } = require("../config/supabase")

async function signInPatient({ email, password, pin }) {
  // Supabase auth sign-in
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data?.user || !data?.session) {
    const err = new Error(error?.message || "Invalid email or password")
    err.status = 401
    throw err
  }

  // Use the session for RLS-protected tables
  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })

  const userId = data.user.id

  // Fetch profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (profileErr) {
    const err = new Error("Failed to fetch patient profile")
    err.status = 500
    throw err
  }

  // Fetch and verify app pin (hashed)
  const { data: pinRow, error: pinErr } = await supabase
    .from("app_pins")
    .select("pin_hash")
    .eq("user_id", userId)
    .maybeSingle()

  if (pinErr) {
    const err = new Error("Failed to fetch app pin")
    err.status = 500
    throw err
  }

  if (!pinRow?.pin_hash) {
    const err = new Error("App pin not set")
    err.status = 401
    throw err
  }

  const validPin = await bcrypt.compare(pin || "", pinRow.pin_hash)
  if (!validPin) {
    const err = new Error("Invalid app pin")
    err.status = 401
    throw err
  }

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: {
      id: userId,
      email: data.user.email,
      profile,
    },
  }
}

module.exports = { signInPatient }
