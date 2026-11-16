import { useEffect, useState } from 'react'
import { OnboardingStep } from '../../components/guards'
import PhotoCapture from '../../components/PhotoCapture'
import { Button, ErrorText, Heading, Page, errorMessage } from '../../components/ui'
import { useAuth, useProfile, useUpdateProfile } from '../../lib/auth'
import { PHOTO_SLOTS, type PhotoSlot } from '../../lib/constants'
import { prepareImage } from '../../lib/image'
import { deletePhotos, listPhotos, signedUrl, uploadPhoto } from '../../lib/photos'

export default function Photos() {
  return (
    <OnboardingStep path="/onboarding/photos">
      <PhotoStep />
    </OnboardingStep>
  )
}

type SlotState = { path: string; previewUrl: string }

function PhotoStep() {
  const userId = useAuth().session!.user.id
  const profile = useProfile().data!
  const updateProfile = useUpdateProfile()
  const [consent, setConsent] = useState(Boolean(profile.photo_consent_at))
  const [slots, setSlots] = useState<Partial<Record<PhotoSlot, SlotState>>>({})
  const [busySlot, setBusySlot] = useState<PhotoSlot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)

  // Restore photos uploaded earlier (e.g. after a refresh).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const photos = await listPhotos(userId, ['selfie', 'body'])
        const selfie = photos.find((p) => p.folder === 'selfie')
        const bodies = photos.filter((p) => p.folder === 'body').slice(0, 2)
        const picks: [PhotoSlot, string | undefined][] = [
          ['selfie', selfie?.path],
          ['body1', bodies[0]?.path],
          ['body2', bodies[1]?.path],
        ]
        const restored: Partial<Record<PhotoSlot, SlotState>> = {}
        for (const [slot, path] of picks) {
          if (path) restored[slot] = { path, previewUrl: await signedUrl(path) }
        }
        if (!cancelled) setSlots((s) => ({ ...restored, ...s }))
      } catch {
        // Non-fatal: the user can simply upload again.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  async function giveConsent(checked: boolean) {
    setConsent(checked)
    if (checked && !profile.photo_consent_at) {
      try {
        await updateProfile({ photo_consent_at: new Date().toISOString() })
      } catch (err) {
        setConsent(false)
        setError(errorMessage(err))
      }
    }
  }

  async function addPhoto(slot: PhotoSlot, file: File) {
    const folder = PHOTO_SLOTS.find((s) => s.id === slot)!.folder
    setError(null)
    setBusySlot(slot)
    try {
      const { blob } = await prepareImage(file)
      const path = await uploadPhoto(userId, folder, blob)
      const previous = slots[slot]
      setSlots((s) => ({ ...s, [slot]: { path, previewUrl: URL.createObjectURL(blob) } }))
      if (previous) await deletePhotos([previous.path]).catch(() => {})
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusySlot(null)
    }
  }

  async function removePhoto(slot: PhotoSlot) {
    const current = slots[slot]
    if (!current) return
    setBusySlot(slot)
    try {
      await deletePhotos([current.path])
      setSlots((s) => {
        const next = { ...s }
        delete next[slot]
        return next
      })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusySlot(null)
    }
  }

  const missing = PHOTO_SLOTS.filter((s) => s.required && !slots[s.id])
  const ready = consent && missing.length === 0

  async function finish() {
    if (!ready) {
      return setError(
        !consent ? 'Please agree to photo analysis first.' : `Please add your ${missing.map((m) => m.label.toLowerCase()).join(' and ')}.`,
      )
    }
    setFinishing(true)
    try {
      await updateProfile({ onboarding_completed_at: new Date().toISOString() })
    } catch (err) {
      setError(errorMessage(err))
      setFinishing(false)
    }
  }

  return (
    <Page>
      <Heading
        title="Now, a few photos"
        subtitle="Good, natural light makes your color and fit analysis much more accurate."
      />

      <label className="mb-5 flex items-start gap-3 rounded-2xl bg-stone-100 p-4 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-ink"
          checked={consent}
          onChange={(e) => giveConsent(e.target.checked)}
        />
        <span>
          I agree that my photos are analyzed by AI to create my style profile. They stay private, are never used to
          train AI models, and I can delete them any time.
        </span>
      </label>

      <div className="space-y-3">
        {PHOTO_SLOTS.map((s) => (
          <PhotoCapture
            key={s.id}
            label={s.label}
            tips={s.tips}
            required={s.required}
            capture={s.capture}
            previewUrl={slots[s.id]?.previewUrl}
            busy={busySlot === s.id}
            disabled={!consent || (busySlot !== null && busySlot !== s.id)}
            onFile={(f) => addPhoto(s.id, f)}
            onRemove={() => removePhoto(s.id)}
          />
        ))}
      </div>

      <ErrorText>{error}</ErrorText>

      <Button className="mt-6 w-full" onClick={finish} busy={finishing} disabled={busySlot !== null}>
        Finish
      </Button>
    </Page>
  )
}
