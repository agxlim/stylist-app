import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Page, Spinner } from '../components/ui'

// supabase-js exchanges the ?code= in the URL for a session automatically
// (detectSessionInUrl + PKCE). We just wait for it, then continue.
export default function AuthCallback() {
  const { session, loading } = useAuth()
  const [timedOut, setTimedOut] = useState(false)
  const urlError = new URLSearchParams(window.location.search).get('error_description')

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 10_000)
    return () => clearTimeout(t)
  }, [])

  if (session) return <Navigate to="/app" replace />
  if (urlError || (timedOut && !loading)) {
    return (
      <Page>
        <p role="alert" className="mb-4">
          {urlError ?? 'That sign-in link didn’t work. It may have expired or been opened on another device.'}
        </p>
        <a href="/sign-in" className="underline">
          Try again
        </a>
      </Page>
    )
  }
  return <Spinner label="Signing you in…" />
}
