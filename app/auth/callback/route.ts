/**
 * OAuth Callback Handler
 *
 * Handles redirects from OAuth providers (Google, etc.)
 * Exchanges authorization code for session
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/users/login?error=${encodeURIComponent(error_description || error)}`
    )
  }

  // Exchange code for session
  if (code) {
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(
          `${requestUrl.origin}/users/login?error=${encodeURIComponent(exchangeError.message)}`
        )
      }

      // Successfully authenticated via OAuth
      // Redirect to home page
      return NextResponse.redirect(`${requestUrl.origin}/`)
    } catch (err) {
      console.error('Callback handler error:', err)
      return NextResponse.redirect(
        `${requestUrl.origin}/users/login?error=Authentication failed`
      )
    }
  }

  // No code or error, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/users/login`)
}
