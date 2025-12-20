const { createClient } = require("@supabase/supabase-js")
const path = require("path")
require("dotenv").config({ path: path.join(__dirname, "..", ".env") })

async function main() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY missing")
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase.from("profiles").select("*").limit(5)
  if (error) {
    throw error
  }
  console.log("Fetched profiles sample:", data)
}

main().catch((err) => {
  console.error("Supabase check failed:", err.message)
  process.exit(1)
})
