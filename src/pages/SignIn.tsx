import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Button, ErrorText, Heading, Page, errorMessage } from '../components/ui'

const emailSchema = z.email('Enter a valid email address')
const redirectTo = () => `${window.location.origin}/auth/callback`

export default function SignIn() {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [busy, setBusy] = useState<'email' | 'google' | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (session) return <Navigate to="/app" replace />

  async function sendLink(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const parsed = emailSchema.safeParse(email.trim())
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    setBusy('email')
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { emailRedirectTo: redirectTo() },
    })
    setBusy(null)
    if (error) return setError(errorMessage(error))
    setSentTo(parsed.data)
  }

  async function google() {
    setError(null)
    setBusy('google')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo() },
    })
    if (error) {
      setBusy(null)
      setError(errorMessage(error))
    }
  }

  if (sentTo) {
    return (
      <Page>
        <Heading title="Check your email" subtitle={`We sent a sign-in link to ${sentTo}. Open it on this device.`} />
        <Button variant="ghost" onClick={() => setSentTo(null)}>
          Use a different email
        </Button>
      </Page>
    )
  }

  return (
    <Page>
      <Heading title="Welcome" subtitle="Sign in or create an account. No password needed." />
      <Button variant="secondary" className="w-full" onClick={google} busy={busy === 'google'}>
        Continue with Google
      </Button>
      <div className="my-6 flex items-center gap-3 text-sm text-stone-500">
        <span className="h-px flex-1 bg-stone-200" /> or <span className="h-px flex-1 bg-stone-200" />
      </div>
      <form onSubmit={sendLink} noValidate>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base"
          placeholder="you@example.com"
        />
        <Button type="submit" className="mt-4 w-full" busy={busy === 'email'}>
          Email me a sign-in link
        </Button>
      </form>
      <ErrorText>{error}</ErrorText>
      <p className="mt-8 text-xs text-stone-500">
        By continuing you confirm you’re 18 or older and agree to our Terms and Privacy Policy.
      </p>
    </Page>
  )
}
