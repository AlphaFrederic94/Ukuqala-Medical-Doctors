const { createClient } = require("@supabase/supabase-js")
const path = require("path")
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY")
}

// Shared client (no session) for admin-like calls such as getUser(token)
const supabase = createClient(supabaseUrl, supabaseKey)

// Create a client bound to a specific access token (for RLS)
function supabaseForToken(accessToken) {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

module.exports = { supabase, supabaseForToken }
