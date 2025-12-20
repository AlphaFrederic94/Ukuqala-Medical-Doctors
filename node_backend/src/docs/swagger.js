const swaggerJsdoc = require("swagger-jsdoc")

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Ukuqala Medical Doctors API",
    version: "1.0.0",
    description: "Authentication, onboarding, and doctors directory endpoints.",
  },
  servers: [
    {
      url: "http://localhost:8000",
      description: "Local server",
    },
  ],
  tags: [
    { name: "Auth" },
    { name: "Onboarding" },
    { name: "Doctors" },
    { name: "Profile" },
    { name: "Appointments" },
    { name: "Patients" },
    { name: "PatientProfile" },
    { name: "PatientsDoctor" },
    { name: "Conversations" },
    { name: "Messages" },
    { name: "Ratings" },
    { name: "Stats" },
    { name: "Records" },
    { name: "Notifications" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Doctor: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string" },
          first_name: { type: "string" },
          last_name: { type: "string" },
          specialty: { type: "string" },
          country: { type: "string" },
          city: { type: "string" },
          timezone: { type: "string" },
          languages: { type: "array", items: { type: "string" } },
          bio: { type: "string" },
          consultation_mode: { type: "string" },
          availability: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                start: { type: "string" },
                end: { type: "string" },
              },
            },
          },
          onboarding_completed: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
    },
    Appointment: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        doctor_id: { type: "string", format: "uuid" },
        patient_external_id: { type: "string", format: "uuid" },
        scheduled_at: { type: "string", format: "date-time" },
        duration_minutes: { type: "integer" },
        type: { type: "string" },
        status: { type: "string" },
        location: { type: "string" },
        meeting_url: { type: "string" },
        reason: { type: "string" },
        attachments: {
          type: "array",
          items: {
            type: "object",
            properties: { name: { type: "string" }, url: { type: "string" } },
          },
        },
        created_at: { type: "string", format: "date-time" },
      },
    },
    Conversation: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        doctor_id: { type: "string", format: "uuid" },
        patient_external_id: { type: "string", format: "uuid" },
        status: { type: "string", enum: ["active", "concluded", "blocked"] },
        reason: { type: "string" },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
      },
    },
    Message: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        conversation_id: { type: "string", format: "uuid" },
        sender_type: { type: "string", enum: ["doctor", "patient"] },
        sender_id: { type: "string" },
        content: { type: "string" },
        attachments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              url: { type: "string" },
            },
          },
        },
        delivered_at: { type: "string", format: "date-time" },
        read_at: { type: "string", format: "date-time" },
        created_at: { type: "string", format: "date-time" },
      },
    },
  },
}

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.js"],
}

const swaggerSpec = swaggerJsdoc(options)

module.exports = { swaggerSpec }
