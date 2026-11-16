import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button, ErrorText, Heading, Page, errorMessage } from '../../components/ui'
import { signOut, useAuth, useProfile, useUpdateProfile } from '../../lib/auth'
import { deletePhotos, listPhotos } from '../../lib/photos'

export default function Settings() {
  const { session } = useAuth()
  const userId = session!.user.id
  const profile = useProfile().data!
  const updateProfile = useUpdateProfile()
  const queryClient = useQueryClient()
  const [name, setName] = useState(profile.display_name ?? '')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'name' | 'photos' | 'signout' | null>(null)

  async function saveName(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy('name')
    try {
      await updateProfile({ display_name: name.trim().slice(0, 60) || null })
      setStatus('Name saved.')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function deleteAllPhotos() {
    if (!window.confirm('Delete all your photos? Your style profile will need new photos to be analyzed again.')) return
    setError(null)
    setBusy('photos')
    try {
      const photos = await listPhotos(userId, ['selfie', 'body', 'outfit', 'chat'])
      await deletePhotos(photos.map((p) => p.path))
      // Without photos, send the user back through the photo step.
      await updateProfile({ onboarding_completed_at: null })
      await queryClient.invalidateQueries({ queryKey: ['photos'] })
      setStatus(`Deleted ${photos.length} photo${photos.length === 1 ? '' : 's'}.`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Page>
      <Link to="/app" className="mb-4 inline-block text-sm text-stone-600 underline">
        ← Back
      </Link>
      <Heading title="Settings" subtitle={session?.user.email ?? undefined} />

      <form onSubmit={saveName} className="rounded-3xl border border-stone-200 bg-white p-5">
        <label htmlFor="name" className="mb-2 block font-medium">
          Display name
        </label>
        <input
          id="name"
          value={name}
          maxLength={60}
          autoComplete="given-name"
          onChange={(e) => setName(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-stone-300 px-4 text-base"
        />
        <Button type="submit" variant="secondary" className="mt-3" busy={busy === 'name'}>
          Save
        </Button>
      </form>

      <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5">
        <h2 className="font-medium">Your photos & data</h2>
        <p className="mt-1 text-sm text-stone-600">
          Photos are stored privately and are never used to train AI models.
        </p>
        <Button variant="danger" className="mt-4 w-full" onClick={deleteAllPhotos} busy={busy === 'photos'}>
          Delete all my photos
        </Button>
        <p className="mt-3 text-sm text-stone-500">
          To delete your whole account, email support. One-tap account deletion is coming soon.
        </p>
      </section>

      <p role="status" className="mt-4 text-sm text-green-800">{status}</p>
      <ErrorText>{error}</ErrorText>

      <Button
        variant="ghost"
        className="mt-6 w-full"
        busy={busy === 'signout'}
        onClick={async () => {
          setBusy('signout')
          await signOut()
        }}
      >
        Sign out
      </Button>
    </Page>
  )
}
