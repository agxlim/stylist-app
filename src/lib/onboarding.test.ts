import { describe, expect, it } from 'vitest'
import { birthYearSchema, isOldEnough, nextOnboardingPath, quizSchema, toggle, validateQuizStep } from './onboarding'
import { PLAN_LIMITS } from './constants'

const now = new Date('2026-11-16T12:00:00Z')

describe('age gate', () => {
  it('accepts people who turn 18 this year', () => {
    expect(isOldEnough(2008, now)).toBe(true)
    expect(birthYearSchema(now).safeParse('2008').success).toBe(true)
  })
  it('rejects under-18s with a clear message', () => {
    const r = birthYearSchema(now).safeParse('2010')
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toMatch(/18 or older/)
  })
  it('rejects nonsense years', () => {
    expect(birthYearSchema(now).safeParse('1800').success).toBe(false)
    expect(birthYearSchema(now).safeParse('abcd').success).toBe(false)
    expect(birthYearSchema(now).safeParse('').success).toBe(false)
  })
})

describe('nextOnboardingPath', () => {
  const blank = { age_confirmed_at: null, quiz_completed_at: null, onboarding_completed_at: null }
  it('walks through each step in order', () => {
    expect(nextOnboardingPath(blank)).toBe('/onboarding/age')
    expect(nextOnboardingPath({ ...blank, age_confirmed_at: 'x' })).toBe('/onboarding/quiz')
    expect(nextOnboardingPath({ ...blank, age_confirmed_at: 'x', quiz_completed_at: 'x' })).toBe('/onboarding/photos')
    expect(nextOnboardingPath({ age_confirmed_at: 'x', quiz_completed_at: 'x', onboarding_completed_at: 'x' })).toBe('/app')
  })
})

describe('quiz', () => {
  const valid = {
    style_directions: ['menswear', 'gender_neutral'],
    lifestyle: { week: ['remote', 'social'], dress_code: 'casual' },
    budget_range: 'mid',
    goals: ['find_colors'],
    inspiration_ids: ['minimal', 'streetwear', 'utility'],
  }
  it('accepts a complete answer set', () => {
    expect(quizSchema.safeParse(valid).success).toBe(true)
  })
  it('requires 3–5 inspirations', () => {
    expect(quizSchema.safeParse({ ...valid, inspiration_ids: ['minimal'] }).success).toBe(false)
  })
  it('rejects unknown option ids', () => {
    expect(quizSchema.safeParse({ ...valid, style_directions: ['other'] }).success).toBe(false)
  })
  it('validates one step at a time', () => {
    expect(validateQuizStep(0, {})).toBeTruthy()
    expect(validateQuizStep(0, { style_directions: ['womenswear'] })).toBeNull()
    expect(validateQuizStep(3, { goals: ['find_colors', 'try_new', 'capsule', 'event'] as never })).toMatch(/up to 3/)
  })
})

describe('toggle', () => {
  it('adds, removes and respects a max', () => {
    expect(toggle(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggle(['a', 'b'], 'a')).toEqual(['b'])
    expect(toggle(['a', 'b'], 'c', 2)).toEqual(['a', 'b'])
  })
})

describe('plan limits', () => {
  it('matches the PRD free tier (and the database)', () => {
    expect(PLAN_LIMITS.free).toEqual({ outfitReviewsPerMonth: 3, chatMessagesPerMonth: 20 })
    expect(PLAN_LIMITS.dailyAiCallCap).toBe(50)
  })
})
