export const themeColors = {
    // Brand Colors
    core: {
        950: "#0A0A0A", // Main Background
        900: "#141414", // Surface/Card - slightly transparent later via bg-core-900/60
        800: "#1F1F1F", // Inputs
    },
    // Semantic Tokens
    brand: {
        DEFAULT: "#10B981", // Emerald 500 (Primary Accent)
        300: "#6EE7B7", // Emerald 300
        400: "#34D399", // Emerald 400
        500: "#10B981", // Emerald 500
        600: "#059669", // Emerald 600
        secondary: "#F59E0B", // Amber 500 (Warning/Secondary)
    },
    surface: {
        DEFAULT: "#0A0A0A",
        soft: "#141414",
        card: "#1F1F1F",
    },
    content: {
        DEFAULT: "#F8FAFC", // Slate 50
        muted: "#94A3B8", // Slate 400
        subtle: "#64748B", // Slate 500
    },
} as const
