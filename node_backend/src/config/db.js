const { Pool } = require("pg")
const path = require("path")
const fs = require("fs")
const { logger } = require("../utils/logger")
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") })

const connectionInfo = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  ssl: process.env.PGSSLMODE || "disable",
}

logger.info({ connectionInfo }, "Initializing Postgres pool")

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 20000),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
  ssl: {
    rejectUnauthorized: false,
  },
})

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected PG pool error")
})

async function ensureSchema() {
  const ddl = `
    CREATE TABLE IF NOT EXISTS doctors (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      avatar_url TEXT,
      phone TEXT,
      address TEXT,
      education TEXT,
      experience_years INT,
      specialty TEXT,
      country TEXT,
      city TEXT,
      timezone TEXT,
      languages JSONB DEFAULT '[]',
      bio TEXT,
      consultation_mode TEXT DEFAULT 'both',
      availability JSONB DEFAULT '[]',
      onboarding_completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);

    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY,
      doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      patient_external_id UUID NOT NULL,
      scheduled_at TIMESTAMPTZ NOT NULL,
      duration_minutes INT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('physical','virtual','follow-up')),
      status TEXT NOT NULL CHECK (status IN ('pending','confirmed','rescheduled','canceled','completed')) DEFAULT 'pending',
      location TEXT,
      meeting_url TEXT,
      reason TEXT,
      attachments JSONB DEFAULT '[]',
      reschedule_reason TEXT,
      cancel_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_external_id);

    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY,
      doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      patient_external_id UUID NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active','concluded','blocked')) DEFAULT 'active',
      reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      closed_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_conversations_doctor ON conversations(doctor_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_patient ON conversations(patient_external_id);

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY,
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_type TEXT NOT NULL CHECK (sender_type IN ('doctor','patient')),
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      attachments JSONB DEFAULT '[]',
      delivered_at TIMESTAMPTZ DEFAULT NOW(),
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted_payload JSONB;

    CREATE TABLE IF NOT EXISTS doctor_ratings (
      id UUID PRIMARY KEY,
      doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      patient_external_id UUID NOT NULL,
      conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
      score INT NOT NULL CHECK (score >= 1 AND score <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ratings_doctor ON doctor_ratings(doctor_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_conv_patient ON doctor_ratings(conversation_id, patient_external_id);

    ALTER TABLE doctors ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE doctors ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE doctors ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE doctors ADD COLUMN IF NOT EXISTS education TEXT;
    ALTER TABLE doctors ADD COLUMN IF NOT EXISTS experience_years INT;

    CREATE TABLE IF NOT EXISTS patient_records (
      id UUID PRIMARY KEY,
      doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      patient_name TEXT NOT NULL,
      patient_email TEXT,
      patient_phone TEXT,
      patient_address TEXT,
      avatar_url TEXT,
      patient_external_id UUID,
      on_platform BOOLEAN DEFAULT FALSE,
      qr_code TEXT,
      consultations INT DEFAULT 0,
      treatments JSONB DEFAULT '[]',
      prescriptions JSONB DEFAULT '[]',
      attachments JSONB DEFAULT '[]',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_patient_records_doctor ON patient_records(doctor_id);
    CREATE INDEX IF NOT EXISTS idx_patient_records_external ON patient_records(patient_external_id);

    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY,
      doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      unread BOOLEAN DEFAULT TRUE,
      meta JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_doctor ON notifications(doctor_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(doctor_id, unread);
  `
  logger.info({ connectionInfo }, "Ensuring database schema")
  const client = await pool.connect()
  try {
    await client.query(ddl)
    logger.info("Database schema ensured")
  } catch (err) {
    logger.error({ err }, "Failed to ensure schema")
    throw err
  } finally {
    client.release()
  }
}

module.exports = {
  pool,
  ensureSchema,
}
