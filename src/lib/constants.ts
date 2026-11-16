// Product constants. Plan limits must match public.plan_limit() in
// supabase/migrations/*_storage_and_functions.sql (the database is the source of truth).

export const PLAN_LIMITS = {
  free: { outfitReviewsPerMonth: 3, chatMessagesPerMonth: 20 },
  plus: { outfitReviewsPerMonth: null, chatMessagesPerMonth: null },
  dailyAiCallCap: 50,
} as const

export const MIN_AGE = 18

export type StyleDirection = 'womenswear' | 'menswear' | 'gender_neutral'
export type BudgetRange = 'budget' | 'mid' | 'premium' | 'luxury'

export const STYLE_DIRECTIONS: { id: StyleDirection; label: string; hint: string }[] = [
  { id: 'womenswear', label: 'Womenswear', hint: 'Dresses, skirts, tailored and feminine cuts' },
  { id: 'menswear', label: 'Menswear', hint: 'Suiting, shirting, classic masculine cuts' },
  { id: 'gender_neutral', label: 'Gender-neutral', hint: 'Relaxed, unisex and androgynous shapes' },
]

export const WEEK_ACTIVITIES = [
  { id: 'office', label: 'Office or in-person work' },
  { id: 'remote', label: 'Working from home' },
  { id: 'student', label: 'Classes / campus' },
  { id: 'active', label: 'Gym and outdoors' },
  { id: 'social', label: 'Nights out and dates' },
  { id: 'events', label: 'Weddings and events' },
  { id: 'travel', label: 'Travel' },
  { id: 'caregiving', label: 'Running around with kids' },
] as const

export const DRESS_CODES = [
  { id: 'none', label: 'No dress code' },
  { id: 'casual', label: 'Casual' },
  { id: 'smart_casual', label: 'Smart casual' },
  { id: 'business', label: 'Business / formal' },
  { id: 'uniform', label: 'Uniform' },
] as const

export const BUDGETS: { id: BudgetRange; label: string; hint: string }[] = [
  { id: 'budget', label: '$', hint: 'Mostly under $50 an item' },
  { id: 'mid', label: '$$', hint: 'Around $50–150 an item' },
  { id: 'premium', label: '$$$', hint: 'Around $150–400 an item' },
  { id: 'luxury', label: '$$$$', hint: 'Designer pieces' },
]

export const GOALS = [
  { id: 'find_colors', label: 'Find my best colors' },
  { id: 'flattering_fits', label: 'Know which fits flatter me' },
  { id: 'more_polished', label: 'Look more polished' },
  { id: 'work_wardrobe', label: 'Dress better for work' },
  { id: 'define_style', label: 'Define my personal style' },
  { id: 'try_new', label: 'Try something new' },
  { id: 'capsule', label: 'Build a smaller, smarter wardrobe' },
  { id: 'event', label: 'Get ready for an event' },
] as const

export const MAX_GOALS = 3

// Curated inspiration set. Shown as color tiles at MVP; swap in licensed images later.
export const INSPIRATIONS = [
  { id: 'minimal', label: 'Minimal', from: '#e7e5e4', to: '#a8a29e' },
  { id: 'classic', label: 'Classic', from: '#1e3a5f', to: '#c2b280' },
  { id: 'streetwear', label: 'Streetwear', from: '#111827', to: '#f97316' },
  { id: 'romantic', label: 'Romantic', from: '#fbcfe8', to: '#be185d' },
  { id: 'edgy', label: 'Edgy', from: '#0a0a0a', to: '#525252' },
  { id: 'boho', label: 'Boho', from: '#d6a77a', to: '#7c4a2d' },
  { id: 'preppy', label: 'Preppy', from: '#1d4ed8', to: '#f5f5f4' },
  { id: 'sporty', label: 'Sporty', from: '#22c55e', to: '#0f172a' },
  { id: 'avant_garde', label: 'Avant-garde', from: '#7c3aed', to: '#facc15' },
  { id: 'vintage', label: 'Vintage', from: '#b45309', to: '#fde68a' },
  { id: 'quiet_luxury', label: 'Quiet luxury', from: '#d6d3d1', to: '#78716c' },
  { id: 'utility', label: 'Utility', from: '#4d5d3a', to: '#a3a380' },
] as const

export const MIN_INSPIRATIONS = 3
export const MAX_INSPIRATIONS = 5

export type PhotoSlot = 'selfie' | 'body1' | 'body2'

export const PHOTO_SLOTS: {
  id: PhotoSlot
  folder: 'selfie' | 'body'
  label: string
  required: boolean
  capture: 'user' | 'environment'
  tips: string[]
}[] = [
  {
    id: 'selfie',
    folder: 'selfie',
    label: 'Face selfie',
    required: true,
    capture: 'user',
    tips: ['Face a window in daylight', 'No filters or heavy makeup', 'Hair off your face'],
  },
  {
    id: 'body1',
    folder: 'body',
    label: 'Full-body photo',
    required: true,
    capture: 'environment',
    tips: ['Head to toe in frame', 'Fitted, simple clothes', 'Stand straight, arms relaxed'],
  },
  {
    id: 'body2',
    folder: 'body',
    label: 'Side view (optional)',
    required: false,
    capture: 'environment',
    tips: ['Turn 90°', 'Same outfit and lighting'],
  },
]
