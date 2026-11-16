import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Heading, Page } from '../../components/ui'
import { useAuth, useProfile } from '../../lib/auth'
import { GOALS, INSPIRATIONS, STYLE_DIRECTIONS } from '../../lib/constants'
import { listPhotos, signedUrl } from '../../lib/photos'
import { useUsage } from '../../lib/usage'

export default function Home() {
  const userId = useAuth().session!.user.id
  const profile = useProfile().data!
  const usage = useUsage()
  const photos = useQuery({
    queryKey: ['photos', userId, 'profile-inputs'],
    queryFn: async () => {
      const list = await listPhotos(userId, ['selfie', 'body'])
      return Promise.all(list.slice(0, 3).map(async (p) => ({ ...p, url: await signedUrl(p.path) })))
    },
  })

  const firstName = profile.display_name?.split(' ')[0]
  const label = <T extends { id: string; label: string }>(items: readonly T[], ids: string[]) =>
    items.filter((i) => ids.includes(i.id)).map((i) => i.label)

  return (
    <Page>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium tracking-widest text-accent uppercase">Stylist</span>
        <Link to="/app/settings" className="rounded-full px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">
          Settings
        </Link>
      </div>
      <Heading title={firstName ? `Hi, ${firstName}` : 'Welcome'} />

      <section className="rounded-3xl bg-ink p-5 text-paper">
        <p className="text-sm text-stone-300">Your style profile</p>
        <p className="font-display mt-1 text-2xl">We’re getting it ready</p>
        <p className="mt-2 text-sm text-stone-300">
          Your photos and answers are saved. AI analysis of your colors, proportions and style identity is switching on
          soon. We’ll show your profile here.
        </p>
        {photos.data && photos.data.length > 0 && (
          <div className="mt-4 flex gap-2">
            {photos.data.map((p) => (
              <img key={p.path} src={p.url} alt="" className="aspect-[3/4] w-16 rounded-xl bg-stone-700 object-cover" />
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5">
        <h2 className="font-medium">What you told us</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="text-stone-500">Styles</dt>
            <dd>{label(STYLE_DIRECTIONS, profile.style_directions).join(', ') || '—'}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Goals</dt>
            <dd>{label(GOALS, profile.goals).join(', ') || '—'}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Inspiration</dt>
            <dd>{label(INSPIRATIONS, profile.inspiration_ids).join(', ') || '—'}</dd>
          </div>
        </dl>
      </section>

      {usage.data && (
        <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 text-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">This month</h2>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium uppercase">{usage.data.tier}</span>
          </div>
          <UsageRow label="Outfit feedback" used={usage.data.outfit_reviews} limit={usage.data.outfit_review_limit} />
          <UsageRow label="Chat messages" used={usage.data.chat_messages} limit={usage.data.chat_message_limit} />
        </section>
      )}
    </Page>
  )
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0
  return (
    <div className="mt-3">
      <div className="flex justify-between">
        <span>{label}</span>
        <span className="text-stone-500">{limit === null ? 'Unlimited' : `${used} of ${limit}`}</span>
      </div>
      {limit !== null && (
        <div className="mt-1 h-1.5 rounded-full bg-stone-100" role="progressbar" aria-valuenow={used} aria-valuemax={limit} aria-label={label}>
          <div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}
