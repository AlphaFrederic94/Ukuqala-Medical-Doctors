# Agora Video Call Debugging Guide

## Overview
This guide helps diagnose issues with Agora video calls on the Ukuqala Medical Doctors platform.

## Issue: Instant Meeting/Doctor Lounge Not Responding on Deployment

### Root Causes Identified & Fixed

1. **Missing Error Logging** - Frontend had no detailed error messages
2. **No Timeout Handling** - API calls could hang indefinitely
3. **SDK Load Failures** - No error handling for Agora SDK import
4. **Missing Environment Variables** - No validation at startup
5. **Page Visibility Issues** - Mobile browsers pause operations when tab is hidden
6. **Insufficient Backend Logging** - Token generation failures weren't logged

## How to Debug

### Step 1: Check Browser Console
Open DevTools (F12) and look for logs starting with:
- `[SessionsPage]` - Frontend initialization
- `[joinCall]` - Call joining process
- `[Agora]` - SDK operations

### Step 2: Check Backend Logs
On Render, view logs for messages starting with:
- `[Schedule]` - Fetching appointments
- `[DoctorLounge]` - Doctor lounge operations
- `[Instant]` - Instant call creation
- `[Token]` - Token generation
- `[Agora/RTC]` - RTC token requests

### Step 3: Verify Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=https://ukuqala-medical-doctors-backend.onrender.com
NEXT_PUBLIC_AGORA_APP_ID=c130fe8e3c70445ca7c686db911f1f37
```

**Backend (.env):**
```
AGORA_APP_ID=c130fe8e3c70445ca7c686db911f1f37
AGORA_APP_CERTIFICATE=c1fb0ea174894fba8417903c2d99eeb8
```

### Step 4: Test Token Generation Manually

```bash
# 1. Sign in to get token
curl -X POST https://ukuqala-medical-doctors-backend.onrender.com/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"noafrederic91@gmail.com","password":"Hello@94fbr"}'

# 2. Create instant call (use doctorToken from response)
curl -X POST https://ukuqala-medical-doctors-backend.onrender.com/calls/instant \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# 3. Get Agora token (use callId from response)
curl -X POST https://ukuqala-medical-doctors-backend.onrender.com/calls/CALL_ID/token \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uid":12345,"role":"publisher"}'
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Missing: API_URL" | Env var not set | Check NEXT_PUBLIC_API_URL in deployment |
| "Missing: APP_ID" | Env var not set | Check NEXT_PUBLIC_AGORA_APP_ID in deployment |
| "Failed to load SDK" | Network issue | Check browser network tab, retry |
| "Unable to fetch token" | Backend error | Check backend logs for [Token] messages |
| "Call not found" | Call ID invalid | Verify call was created successfully |
| Page hidden warning | Mobile tab switched | Keep app in foreground during call |

## Improvements Made

✅ Comprehensive error logging at every step
✅ 15-second timeout on all API calls
✅ Agora SDK load error handling
✅ Environment variable validation
✅ Page visibility monitoring
✅ Detailed backend logging for debugging

