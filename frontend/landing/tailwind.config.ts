import type { Config } from "tailwindcss";
import { themeColors } from "./utils/theme";

export default <Partial<Config>>{
  theme: {
    extend: {
      colors: themeColors,


      backgroundImage: {
        "gradient-gold":
          `linear-gradient(135deg, ${themeColors.brand.DEFAULT} 0%, ${themeColors.brand[600]} 100%)`,
        "gradient-gold-hover":
          `linear-gradient(135deg, ${themeColors.brand[300]} 0%, ${themeColors.brand[500]} 100%)`,
      },

      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "gold-glow": "0 0 15px rgba(245, 158, 11, 0.5)",
      },

      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },

      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
    },
  },
};
