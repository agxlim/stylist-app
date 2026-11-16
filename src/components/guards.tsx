import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, useProfile } from '../lib/auth'
import { nextOnboardingPath } from '../lib/onboarding'
import { Page, Spinner } from './ui'

export function RequireSignedIn() {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!session) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Sends users who haven't finished onboarding to the right step. */
export function RequireOnboarded() {
  const profile = useProfile()
  if (profile.isPending) return <Spinner />
  if (profile.isError) {
    return (
      <Page>
        <p role="alert">We couldn’t load your profile. Check your connection and refresh.</p>
      </Page>
    )
  }
  const next = nextOnboardingPath(profile.data)
  if (next !== '/app') return <Navigate to={next} replace />
  return <Outlet />
}

/** Keeps users on the onboarding step they're actually up to. Once a step is saved,
 *  the profile changes and this automatically moves them to the next one. */
export function OnboardingStep({ path, children }: { path: string; children: React.ReactNode }) {
  const profile = useProfile()
  if (profile.isPending) return <Spinner />
  if (profile.isError) {
    return (
      <Page>
        <p role="alert">We couldn’t load your profile. Check your connection and refresh.</p>
      </Page>
    )
  }
  const next = nextOnboardingPath(profile.data)
  if (next !== path) return <Navigate to={next} replace />
  return <>{children}</>
}
