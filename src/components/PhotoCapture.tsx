import { useId, useRef } from 'react'
import { Button } from './ui'

interface Props {
  label: string
  tips: string[]
  required: boolean
  capture: 'user' | 'environment'
  previewUrl?: string
  busy: boolean
  disabled?: boolean
  onFile: (file: File) => void
  onRemove?: () => void
}

/** One photo slot. "Take photo" opens the camera on phones; "Upload" opens the photo library. */
export default function PhotoCapture({ label, tips, required, capture, previewUrl, busy, disabled, onFile, onRemove }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)
  const headingId = useId()

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow choosing the same file again
    if (file) onFile(file)
  }

  return (
    <section aria-labelledby={headingId} className="rounded-3xl border border-stone-200 bg-white p-4">
      <div className="flex gap-4">
        <div className="grid aspect-[3/4] w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-stone-100">
          {previewUrl ? (
            <img src={previewUrl} alt={`${label} preview`} className="size-full object-cover" />
          ) : (
            <span className="text-3xl text-stone-400" aria-hidden>
              {capture === 'user' ? '☺' : '⌂'}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="font-medium">
            {label} {required && <span className="text-sm font-normal text-stone-500">· required</span>}
          </h2>
          <ul className="mt-1 space-y-0.5 text-sm text-stone-600">
            {tips.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" className="flex-1" busy={busy} disabled={disabled} onClick={() => cameraRef.current?.click()}>
          {previewUrl ? 'Retake' : 'Take photo'}
        </Button>
        <Button variant="ghost" className="flex-1" disabled={disabled || busy} onClick={() => libraryRef.current?.click()}>
          Upload
        </Button>
        {previewUrl && onRemove && (
          <Button variant="ghost" disabled={busy} onClick={onRemove} aria-label={`Remove ${label}`}>
            Remove
          </Button>
        )}
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture={capture} className="hidden" onChange={handle} />
      <input ref={libraryRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handle} />
    </section>
  )
}
