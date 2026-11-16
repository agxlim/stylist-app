import { useState, type FormEvent } from 'react'
import { OnboardingStep } from '../../components/guards'
import { Button, ErrorText, Heading, Page, errorMessage } from '../../components/ui'
import { useUpdateProfile } from '../../lib/auth'
import { birthYearSchema } from '../../lib/onboarding'

export default function AgeGate() {
  return (
    <OnboardingStep path="/onboarding/age">
      <AgeForm />
    </OnboardingStep>
  )
}

function AgeForm() {
  const updateProfile = useUpdateProfile()
  const [year, setYear] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const parsed = birthYearSchema().safeParse(year)
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    setBusy(true)
    try {
      // The database re-checks this (see validate_profile trigger).
      await updateProfile({ birth_year: parsed.data, age_confirmed_at: new Date().toISOString() })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Page>
      <Heading title="First, a quick check" subtitle="Stylist is for adults 18 and over." />
      <form onSubmit={submit} noValidate>
        <label htmlFor="birth-year" className="mb-2 block text-sm font-medium">
          What year were you born?
        </label>
        <input
          id="birth-year"
          inputMode="numeric"
          autoComplete="bday-year"
          maxLength={4}
          placeholder="YYYY"
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))}
          className="min-h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base tracking-widest"
        />
        <Button type="submit" className="mt-4 w-full" busy={busy}>
          Continue
        </Button>
      </form>
      <ErrorText>{error}</ErrorText>
    </Page>
  )
}
