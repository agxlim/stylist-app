import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireOnboarded, RequireSignedIn } from './components/guards'
import { isSupabaseConfigured } from './lib/supabase'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import AuthCallback from './pages/AuthCallback'
import AgeGate from './pages/onboarding/AgeGate'
import Quiz from './pages/onboarding/Quiz'
import Photos from './pages/onboarding/Photos'
import Home from './pages/app/Home'
import Settings from './pages/app/Settings'
import NotFound from './pages/NotFound'
import SetupNeeded from './pages/SetupNeeded'

export default function App() {
  if (!isSupabaseConfigured) return <SetupNeeded />

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route element={<RequireSignedIn />}>
        <Route path="/onboarding" element={<Navigate to="/onboarding/age" replace />} />
        <Route path="/onboarding/age" element={<AgeGate />} />
        <Route path="/onboarding/quiz" element={<Quiz />} />
        <Route path="/onboarding/photos" element={<Photos />} />

        <Route element={<RequireOnboarded />}>
          <Route path="/app" element={<Home />} />
          <Route path="/app/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
