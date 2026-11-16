import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Page } from '../components/ui'

const FEATURES = [
  { title: 'Your style profile', body: 'Your best colors, the cuts that flatter you, and a style identity, from a few photos.' },
  { title: 'Outfit feedback', body: 'Snap what you’re wearing and get honest, specific tweaks in seconds.' },
  { title: 'Ask anything', body: 'Chat with a stylist that knows your profile, any time.' },
  { title: 'Real stylists', body: 'Book a 30-minute video session with a vetted stylist when you want more.' },
]

export default function Landing() {
  const { session } = useAuth()
  if (session) return <Navigate to="/app" replace />

  return (
    <Page>
      <div className="flex min-h-[85vh] flex-col justify-between">
        <div>
          <p className="text-sm font-medium tracking-widest text-accent uppercase">Stylist</p>
          <h1 className="font-display mt-6 text-5xl leading-[1.05]">A personal stylist that actually knows you.</h1>
          <p className="mt-5 text-lg text-stone-600">
            Find what suits you, get feedback on any outfit, and talk to a real stylist when you need one.
          </p>
          <ul className="mt-10 space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="border-l-2 border-stone-300 pl-4">
                <p className="font-medium">{f.title}</p>
                <p className="text-stone-600">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10">
          <Link
            to="/sign-in"
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-6 font-medium text-paper"
          >
            Get started free
          </Link>
          <p className="mt-3 text-center text-sm text-stone-500">
            For adults 18+. Your photos are private and never used to train AI.
          </p>
        </div>
      </div>
    </Page>
  )
}
