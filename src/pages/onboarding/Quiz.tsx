import { useState } from 'react'
import { OnboardingStep } from '../../components/guards'
import { Button, Chip, ErrorText, Heading, Page, ProgressDots, errorMessage } from '../../components/ui'
import { useProfile, useUpdateProfile } from '../../lib/auth'
import {
  BUDGETS,
  DRESS_CODES,
  GOALS,
  INSPIRATIONS,
  MAX_GOALS,
  MAX_INSPIRATIONS,
  STYLE_DIRECTIONS,
  WEEK_ACTIVITIES,
} from '../../lib/constants'
import { QUIZ_STEPS, quizSchema, toggle, validateQuizStep, type QuizAnswers } from '../../lib/onboarding'

export default function Quiz() {
  return (
    <OnboardingStep path="/onboarding/quiz">
      <QuizFlow />
    </OnboardingStep>
  )
}

type Draft = {
  style_directions: QuizAnswers['style_directions']
  lifestyle: { week: QuizAnswers['lifestyle']['week']; dress_code?: QuizAnswers['lifestyle']['dress_code'] }
  budget_range?: QuizAnswers['budget_range']
  goals: QuizAnswers['goals']
  inspiration_ids: QuizAnswers['inspiration_ids']
}

function QuizFlow() {
  const profile = useProfile().data!
  const updateProfile = useUpdateProfile()
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState<Draft>({
    style_directions: [],
    lifestyle: { week: [] },
    goals: [],
    inspiration_ids: [],
  })

  const meta = QUIZ_STEPS[step]
  const last = step === QUIZ_STEPS.length - 1

  async function next() {
    const problem = validateQuizStep(step, draft as Partial<QuizAnswers>)
    if (problem) return setError(problem)
    setError(null)
    if (!last) return setStep(step + 1)

    const parsed = quizSchema.safeParse(draft)
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    setBusy(true)
    try {
      await updateProfile({ ...parsed.data, quiz_completed_at: new Date().toISOString() })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Page>
      <ProgressDots step={step} total={QUIZ_STEPS.length} />
      {step === 0 && profile.display_name && (
        <p className="mb-2 text-stone-600">Hi {profile.display_name.split(' ')[0]} 👋</p>
      )}
      <Heading title={meta.title} subtitle={meta.subtitle} />

      <div className="space-y-3">
        {meta.key === 'style_directions' &&
          STYLE_DIRECTIONS.map((o) => (
            <Chip
              key={o.id}
              hint={o.hint}
              selected={draft.style_directions.includes(o.id)}
              onClick={() => setDraft({ ...draft, style_directions: toggle(draft.style_directions, o.id) })}
            >
              {o.label}
            </Chip>
          ))}

        {meta.key === 'lifestyle' && (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Most weeks I’m… (pick all that apply)</legend>
              <div className="grid grid-cols-2 gap-2">
                {WEEK_ACTIVITIES.map((o) => (
                  <Chip
                    key={o.id}
                    selected={draft.lifestyle.week.includes(o.id)}
                    onClick={() =>
                      setDraft({ ...draft, lifestyle: { ...draft.lifestyle, week: toggle(draft.lifestyle.week, o.id) } })
                    }
                  >
                    <span className="text-sm">{o.label}</span>
                  </Chip>
                ))}
              </div>
            </fieldset>
            <fieldset className="pt-4">
              <legend className="mb-2 text-sm font-medium">Dress code at work or school</legend>
              <div role="radiogroup" aria-label="Dress code" className="grid grid-cols-2 gap-2">
                {DRESS_CODES.map((o) => (
                  <Chip
                    key={o.id}
                    single
                    selected={draft.lifestyle.dress_code === o.id}
                    onClick={() => setDraft({ ...draft, lifestyle: { ...draft.lifestyle, dress_code: o.id } })}
                  >
                    <span className="text-sm">{o.label}</span>
                  </Chip>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {meta.key === 'budget_range' && (
          <div role="radiogroup" aria-label="Budget" className="space-y-3">
          {BUDGETS.map((o) => (
            <Chip
              key={o.id}
              single
              hint={o.hint}
              selected={draft.budget_range === o.id}
              onClick={() => setDraft({ ...draft, budget_range: o.id })}
            >
              {o.label}
            </Chip>
          ))}
          </div>
        )}

        {meta.key === 'goals' &&
          GOALS.map((o) => (
            <Chip
              key={o.id}
              selected={draft.goals.includes(o.id)}
              onClick={() => setDraft({ ...draft, goals: toggle(draft.goals, o.id, MAX_GOALS) })}
            >
              {o.label}
            </Chip>
          ))}

        {meta.key === 'inspiration_ids' && (
          <div className="grid grid-cols-3 gap-2">
            {INSPIRATIONS.map((o) => {
              const selected = draft.inspiration_ids.includes(o.id)
              return (
                <button
                  key={o.id}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() =>
                    setDraft({ ...draft, inspiration_ids: toggle(draft.inspiration_ids, o.id, MAX_INSPIRATIONS) })
                  }
                  className={`relative flex aspect-[3/4] items-end rounded-2xl p-2 text-left text-sm font-medium text-white ring-offset-2 transition ${
                    selected ? 'ring-3 ring-ink' : ''
                  }`}
                  style={{ background: `linear-gradient(160deg, ${o.from}, ${o.to})` }}
                >
                  <span className="rounded-full bg-black/45 px-2 py-0.5">{o.label}</span>
                  {selected && (
                    <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-ink text-xs">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <ErrorText>{error}</ErrorText>

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button variant="secondary" onClick={() => { setError(null); setStep(step - 1) }}>
            Back
          </Button>
        )}
        <Button className="flex-1" onClick={next} busy={busy}>
          {last ? 'Save and continue' : 'Next'}
        </Button>
      </div>
    </Page>
  )
}
