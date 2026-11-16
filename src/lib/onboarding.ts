import { z } from 'zod'
import {
  BUDGETS,
  DRESS_CODES,
  GOALS,
  INSPIRATIONS,
  MAX_GOALS,
  MAX_INSPIRATIONS,
  MIN_AGE,
  MIN_INSPIRATIONS,
  STYLE_DIRECTIONS,
  WEEK_ACTIVITIES,
} from './constants'

export interface Profile {
  id: string
  display_name: string | null
  birth_year: number | null
  style_directions: string[]
  lifestyle: { week?: string[]; dress_code?: string }
  budget_range: string | null
  goals: string[]
  inspiration_ids: string[]
  role: 'user' | 'stylist' | 'admin'
  age_confirmed_at: string | null
  photo_consent_at: string | null
  quiz_completed_at: string | null
  onboarding_completed_at: string | null
}

/** Where a signed-in user should be, given how far through onboarding they are. */
export function nextOnboardingPath(profile: Pick<
  Profile,
  'age_confirmed_at' | 'quiz_completed_at' | 'onboarding_completed_at'
>): string {
  if (!profile.age_confirmed_at) return '/onboarding/age'
  if (!profile.quiz_completed_at) return '/onboarding/quiz'
  if (!profile.onboarding_completed_at) return '/onboarding/photos'
  return '/app'
}

/** True if someone born in `birthYear` is at least MIN_AGE at some point this year. */
export function isOldEnough(birthYear: number, now = new Date()): boolean {
  return now.getUTCFullYear() - birthYear >= MIN_AGE
}

export function birthYearSchema(now = new Date()) {
  const year = now.getUTCFullYear()
  return z.coerce
    .number({ error: 'Enter your birth year' })
    .int('Enter a 4-digit year')
    .min(year - 110, 'Enter a valid year')
    .max(year, 'Enter a valid year')
    .refine((y) => isOldEnough(y, now), `You must be ${MIN_AGE} or older to use Stylist.`)
}

const ids = <T extends readonly { id: string }[]>(items: T) =>
  items.map((i) => i.id) as [T[number]['id'], ...T[number]['id'][]]

export const quizSchema = z.object({
  display_name: z.string().trim().max(60).optional(),
  style_directions: z
    .array(z.enum(ids(STYLE_DIRECTIONS)))
    .min(1, 'Pick at least one')
    .max(3),
  lifestyle: z.object({
    week: z.array(z.enum(ids(WEEK_ACTIVITIES))).min(1, 'Pick at least one'),
    dress_code: z.enum(ids(DRESS_CODES), { error: 'Pick one' }),
  }),
  budget_range: z.enum(ids(BUDGETS), { error: 'Pick one' }),
  goals: z
    .array(z.enum(ids(GOALS)))
    .min(1, 'Pick at least one')
    .max(MAX_GOALS, `Pick up to ${MAX_GOALS}`),
  inspiration_ids: z
    .array(z.enum(ids(INSPIRATIONS)))
    .min(MIN_INSPIRATIONS, `Pick at least ${MIN_INSPIRATIONS}`)
    .max(MAX_INSPIRATIONS, `Pick up to ${MAX_INSPIRATIONS}`),
})

export type QuizAnswers = z.infer<typeof quizSchema>

/** The quiz is split into steps; each step validates only its own fields. */
export const QUIZ_STEPS = [
  { key: 'style_directions', title: 'Which styles do you shop?', subtitle: 'Pick any that apply. We’ll never assume based on your photos.' },
  { key: 'lifestyle', title: 'What does your week look like?', subtitle: 'So advice fits your real life.' },
  { key: 'budget_range', title: 'What’s your usual budget?', subtitle: 'Per item, roughly.' },
  { key: 'goals', title: 'What do you want help with?', subtitle: `Pick up to ${MAX_GOALS}.` },
  { key: 'inspiration_ids', title: 'Which looks inspire you?', subtitle: `Pick ${MIN_INSPIRATIONS}–${MAX_INSPIRATIONS}.` },
] as const satisfies readonly { key: keyof QuizAnswers; title: string; subtitle: string }[]

export function validateQuizStep(step: number, answers: Partial<QuizAnswers>): string | null {
  const key = QUIZ_STEPS[step].key
  const result = quizSchema.shape[key].safeParse(answers[key])
  if (result.success) return null
  return result.error.issues[0]?.message ?? 'Please answer this question'
}

/** Toggle `id` in `list`, respecting a maximum selection count. */
export function toggle<T>(list: T[], id: T, max = Infinity): T[] {
  if (list.includes(id)) return list.filter((x) => x !== id)
  if (list.length >= max) return list
  return [...list, id]
}
