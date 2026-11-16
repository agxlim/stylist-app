import { Heading, Page } from '../components/ui'

export default function SetupNeeded() {
  return (
    <Page>
      <Heading title="Connect Supabase" subtitle="This app needs a Supabase project before it can run." />
      <ol className="list-decimal space-y-2 pl-5 text-stone-700">
        <li>Create a project at supabase.com (or connect Supabase in Bolt).</li>
        <li>Run the SQL files in <code>supabase/migrations</code> in order.</li>
        <li>
          Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (see <code>.env.example</code>), then
          restart.
        </li>
      </ol>
    </Page>
  )
}
