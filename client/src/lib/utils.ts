import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL', 'MLS', 'WNBA', 'Other'] as const

export const SPORT_COLORS: Record<string, string> = {
  NFL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  NBA: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MLB: 'bg-red-500/20 text-red-400 border-red-500/30',
  NHL: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  MLS: 'bg-green-500/20 text-green-400 border-green-500/30',
  WNBA: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Other: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

export const PAYMENT_METHODS = ['Venmo', 'Zelle', 'Cash', 'PayPal', 'Apple Pay', 'Other']
