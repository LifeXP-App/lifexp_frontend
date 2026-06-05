# Supabase Migration Guide

## Overview

Login has been migrated from Django to Supabase. The user data and profile still live in Django, but authentication (signup/login/password reset) now goes through Supabase.

## Architecture

```
Browser
   ↓
[/api/auth/login/supabase] ← client calls with email/password
   ↓
Supabase (authentication) ← returns JWT
   ↓
[/api/auth/me] ← calls Django with Supabase JWT
   ↓
Django (user data)
```

## Environment Variables

Add these to `.env.local`:

```bash
# Existing
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

# New - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY  # Server-side only
```

Get these from your Supabase project settings:
- Dashboard → Project Settings → API
- Copy the `URL` and `anon` public key
- Copy the `service_role` secret key (keep this secret!)

## What Changed

### 1. **Login Page** (`app/(fullscreen)/users/login/page.tsx`)
- Changed from username/password to email/password
- Calls `/api/auth/login/supabase` instead of `/api/auth/login`

### 2. **Auth Context** (`src/context/AuthContext.tsx`)
- Now listens to Supabase auth state changes
- Fetches user data from Django with Supabase JWT
- Calls `/api/auth/logout-supabase` on logout

### 3. **Middleware** (`middleware.ts`)
- Checks for `sb-access-token` cookie instead of `access` cookie

### 4. **API Routes**
- `/api/auth/login/supabase` - Supabase login → Django user fetch
- `/api/auth/refresh-supabase` - Refresh Supabase JWT
- `/api/auth/logout-supabase` - Clear Supabase session
- `/api/auth/me` - Updated to use Supabase tokens

## Django Changes Needed

Django needs to:
1. Accept Supabase JWTs in the `Authorization: Bearer` header
2. Validate the Supabase JWT signature
3. Map the Supabase user ID/email to Django user

Example Django middleware/decorator:

```python
# Verify Supabase JWT and attach user
def verify_supabase_token(token):
    # Use Supabase client to verify JWT
    # Map to Django User model
    pass
```

## Cookies

These httpOnly cookies are set after login:
- `sb-access-token` - Supabase JWT (short-lived)
- `sb-refresh-token` - Supabase refresh token (long-lived)

The browser can never access these; they're used server-side only.

## Flow Examples

### Login
```
1. User enters email/password
2. POST /api/auth/login/supabase
3. Server authenticates with Supabase
4. Server fetches user from Django using Supabase JWT
5. Server sets sb-access-token and sb-refresh-token cookies
6. Browser redirected to /
```

### Page Load (AuthContext)
```
1. AuthProvider calls refreshMe()
2. Gets Supabase session from browser client
3. Calls /api/auth/me with Supabase JWT in Authorization header
4. Server forwards to Django
5. User data updated in context
```

### Token Expiration
```
1. Django returns 401 for user request
2. /api/auth/me detects 401
3. Calls Supabase to refresh JWT
4. Retries Django request with new token
5. Updates cookies with new tokens
```

## Troubleshooting

### "Missing Supabase env vars"
- Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Don't forget `.local` - Next.js won't load `.env` for browser code

### Login fails with "Failed to fetch user from Django"
- Check Django is validating Supabase JWTs correctly
- Check token format being sent to Django

### Session not persisting
- Check cookies are being set in browser DevTools (Application → Cookies)
- Verify `sb-access-token` exists after login

### Infinite redirect loop
- Check middleware is correctly looking for `sb-access-token`
- Check `/users/login` is excluded from middleware matcher
