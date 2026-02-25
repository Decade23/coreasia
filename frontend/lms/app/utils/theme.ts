/**
 * CoreAsia LMS — Unified Design Tokens
 *
 * Design Direction: Dark Glassmorphism — modern, clean, bold & soft
 * Base: Deep navy (#050814)
 * Primary: Cyan (#06B6D4)
 * Secondary: Emerald (#10B981)
 * Accent: Amber (#F59E0B)
 */
export const themeColors = {
    // Surface Scale — deep navy progression
    core: {
        950: '#050814', // Page background
        900: '#0A0F1D', // Recessed areas
        800: '#0F1423', // Cards / panels
        700: '#1A2235', // Inputs / elevated surfaces
        600: '#243049', // Hover states / active inputs
    },
    // Brand — Cyan primary
    brand: {
        DEFAULT: '#06B6D4',
        50: '#ECFEFF',
        100: '#CFFAFE',
        200: '#A5F3FC',
        300: '#67E8F9',
        400: '#22D3EE',
        500: '#06B6D4',
        600: '#0891B2',
        700: '#0E7490',
        secondary: '#10B981', // Emerald — success / secondary accent
        accent: '#F59E0B', // Amber — warning / highlight
    },
    // Content — text hierarchy
    content: {
        DEFAULT: '#F8FAFC', // Primary text (white-ish)
        muted: '#94A3B8',   // Secondary text
        subtle: '#64748B',  // Tertiary / labels
        faint: '#475569',   // Disabled / placeholder
    },
} as const
