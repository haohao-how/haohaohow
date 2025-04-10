/* eslint-disable @typescript-eslint/unbound-method */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`./src/**/*.{js,jsx,ts,tsx}`],
  darkMode: `class`,
  presets: [
    // @ts-expect-error this is correct as per the docs, but the TS config seems
    // wrong I guess.
    require(`nativewind/preset`),
  ],
  theme: {
    screens: {
      sm: `640px`,
      // => @media (min-width: 640px) { ... }

      md: `768px`,
      // => @media (min-width: 768px) { ... }

      lg: `1024px`,
      // => @media (min-width: 1024px) { ... }

      xl: `1280px`,
      // => @media (min-width: 1280px) { ... }

      "2xl": `1536px`,
      // => @media (min-width: 1536px) { ... }
    },
    colors: {
      background: `rgb(var(--color-primary-2) / <alpha-value>)`,
      text: `rgb(var(--color-primary-12) / <alpha-value>)`,

      primary: {
        1: `rgb(var(--color-primary-1) / <alpha-value>)`,
        2: `rgb(var(--color-primary-2) / <alpha-value>)`,
        3: `rgb(var(--color-primary-3) / <alpha-value>)`,
        4: `rgb(var(--color-primary-4) / <alpha-value>)`,
        5: `rgb(var(--color-primary-5) / <alpha-value>)`,
        6: `rgb(var(--color-primary-6) / <alpha-value>)`,
        7: `rgb(var(--color-primary-7) / <alpha-value>)`,
        8: `rgb(var(--color-primary-8) / <alpha-value>)`,
        9: `rgb(var(--color-primary-9) / <alpha-value>)`,
        10: `rgb(var(--color-primary-10) / <alpha-value>)`,
        11: `rgb(var(--color-primary-11) / <alpha-value>)`,
        12: `rgb(var(--color-primary-12) / <alpha-value>)`,
      },

      accent: {
        1: `rgb(var(--color-accent-1) / <alpha-value>)`,
        2: `rgb(var(--color-accent-2) / <alpha-value>)`,
        3: `rgb(var(--color-accent-3) / <alpha-value>)`,
        4: `rgb(var(--color-accent-4) / <alpha-value>)`,
        5: `rgb(var(--color-accent-5) / <alpha-value>)`,
        6: `rgb(var(--color-accent-6) / <alpha-value>)`,
        7: `rgb(var(--color-accent-7) / <alpha-value>)`,
        8: `rgb(var(--color-accent-8) / <alpha-value>)`,
        9: `rgb(var(--color-accent-9) / <alpha-value>)`,
        10: `rgb(var(--color-accent-10) / <alpha-value>)`,
        11: `rgb(var(--color-accent-11) / <alpha-value>)`,
        12: `rgb(var(--color-accent-12) / <alpha-value>)`,
      },

      cyan: {
        1: `rgb(var(--color-cyan-1) / <alpha-value>)`,
        2: `rgb(var(--color-cyan-2) / <alpha-value>)`,
        3: `rgb(var(--color-cyan-3) / <alpha-value>)`,
        4: `rgb(var(--color-cyan-4) / <alpha-value>)`,
        5: `rgb(var(--color-cyan-5) / <alpha-value>)`,
        6: `rgb(var(--color-cyan-6) / <alpha-value>)`,
        7: `rgb(var(--color-cyan-7) / <alpha-value>)`,
        8: `rgb(var(--color-cyan-8) / <alpha-value>)`,
        9: `rgb(var(--color-cyan-9) / <alpha-value>)`,
        10: `rgb(var(--color-cyan-10) / <alpha-value>)`,
        11: `rgb(var(--color-cyan-11) / <alpha-value>)`,
        12: `rgb(var(--color-cyan-12) / <alpha-value>)`,
      },

      slate: {
        1: `rgb(var(--color-slate-1) / <alpha-value>)`,
        2: `rgb(var(--color-slate-2) / <alpha-value>)`,
        3: `rgb(var(--color-slate-3) / <alpha-value>)`,
        4: `rgb(var(--color-slate-4) / <alpha-value>)`,
        5: `rgb(var(--color-slate-5) / <alpha-value>)`,
        6: `rgb(var(--color-slate-6) / <alpha-value>)`,
        7: `rgb(var(--color-slate-7) / <alpha-value>)`,
        8: `rgb(var(--color-slate-8) / <alpha-value>)`,
        9: `rgb(var(--color-slate-9) / <alpha-value>)`,
        10: `rgb(var(--color-slate-10) / <alpha-value>)`,
        11: `rgb(var(--color-slate-11) / <alpha-value>)`,
        12: `rgb(var(--color-slate-12) / <alpha-value>)`,
      },

      red: {
        1: `rgb(var(--color-red-1) / <alpha-value>)`,
        2: `rgb(var(--color-red-2) / <alpha-value>)`,
        3: `rgb(var(--color-red-3) / <alpha-value>)`,
        4: `rgb(var(--color-red-4) / <alpha-value>)`,
        5: `rgb(var(--color-red-5) / <alpha-value>)`,
        6: `rgb(var(--color-red-6) / <alpha-value>)`,
        7: `rgb(var(--color-red-7) / <alpha-value>)`,
        8: `rgb(var(--color-red-8) / <alpha-value>)`,
        9: `rgb(var(--color-red-9) / <alpha-value>)`,
        10: `rgb(var(--color-red-10) / <alpha-value>)`,
        11: `rgb(var(--color-red-11) / <alpha-value>)`,
        12: `rgb(var(--color-red-12) / <alpha-value>)`,
      },

      amber: {
        1: `rgb(var(--color-amber-1) / <alpha-value>)`,
        2: `rgb(var(--color-amber-2) / <alpha-value>)`,
        3: `rgb(var(--color-amber-3) / <alpha-value>)`,
        4: `rgb(var(--color-amber-4) / <alpha-value>)`,
        5: `rgb(var(--color-amber-5) / <alpha-value>)`,
        6: `rgb(var(--color-amber-6) / <alpha-value>)`,
        7: `rgb(var(--color-amber-7) / <alpha-value>)`,
        8: `rgb(var(--color-amber-8) / <alpha-value>)`,
        9: `rgb(var(--color-amber-9) / <alpha-value>)`,
        10: `rgb(var(--color-amber-10) / <alpha-value>)`,
        11: `rgb(var(--color-amber-11) / <alpha-value>)`,
        12: `rgb(var(--color-amber-12) / <alpha-value>)`,
      },

      lime: {
        1: `rgb(var(--color-lime-1) / <alpha-value>)`,
        2: `rgb(var(--color-lime-2) / <alpha-value>)`,
        3: `rgb(var(--color-lime-3) / <alpha-value>)`,
        4: `rgb(var(--color-lime-4) / <alpha-value>)`,
        5: `rgb(var(--color-lime-5) / <alpha-value>)`,
        6: `rgb(var(--color-lime-6) / <alpha-value>)`,
        7: `rgb(var(--color-lime-7) / <alpha-value>)`,
        8: `rgb(var(--color-lime-8) / <alpha-value>)`,
        9: `rgb(var(--color-lime-9) / <alpha-value>)`,
        10: `rgb(var(--color-lime-10) / <alpha-value>)`,
        11: `rgb(var(--color-lime-11) / <alpha-value>)`,
        12: `rgb(var(--color-lime-12) / <alpha-value>)`,
      },
    },
    extend: {
      fontFamily: {
        chinese: `MaShanZheng-Regular`,
        cursive: `ui-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
        sans: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
        karla: `Karla`,
      },

      spacing: {
        "quiz-px": `16px`,
        "www-col": `988px`,
      },
    },
  },
  plugins: [
    /** @param {import('tailwindcss/types/config.d.ts').PluginAPI} api */
    ({ addBase }) => {
      // Set a default value on the `:root` element
      addBase({
        ":root": {
          "--color-lime-light-1": `252 253 250`,
          "--color-lime-light-2": `247 252 240`,
          "--color-lime-light-3": `238 250 220`,
          "--color-lime-light-4": `228 247 199`,
          "--color-lime-light-5": `215 242 176`,
          "--color-lime-light-6": `202 232 148`,
          "--color-lime-light-7": `177 209 106`,
          "--color-lime-light-8": `148 186 44`,
          "--color-lime-light-9": `153 213 42`,
          "--color-lime-light-10": `147 201 38`,
          "--color-lime-light-11": `93 119 13`,
          "--color-lime-light-12": `38 50 9`,
          "--color-lime-dark-1": `2 24 7`,
          "--color-lime-dark-2": `2 29 8`,
          "--color-lime-dark-3": `3 38 13`,
          "--color-lime-dark-4": `3 46 15`,
          "--color-lime-dark-5": `4 55 17`,
          "--color-lime-dark-6": `5 66 19`,
          "--color-lime-dark-7": `6 82 21`,
          "--color-lime-dark-8": `8 103 22`,
          "--color-lime-dark-9": `15 213 42`,
          "--color-lime-dark-10": `19 240 66`,
          "--color-lime-dark-11": `47 245 89`,
          "--color-lime-dark-12": `23 251 221`,

          "--color-red-light-1": `255 252 252`,
          "--color-red-light-2": `255 248 248`,
          "--color-red-light-3": `255 239 239`,
          "--color-red-light-4": `255 229 229`,
          "--color-red-light-5": `253 216 216`,
          "--color-red-light-6": `249 199 199`,
          "--color-red-light-7": `243 174 175`,
          "--color-red-light-8": `235 144 145`,
          "--color-red-light-9": `229 72 77`,
          "--color-red-light-10": `220 62 67`,
          "--color-red-light-11": `205 44 49`,
          "--color-red-light-12": `56 19 22`,
          "--color-red-dark-1": `31 19 21`,
          "--color-red-dark-2": `41 20 21`,
          "--color-red-dark-3": `60 24 26`,
          "--color-red-dark-4": `72 26 29`,
          "--color-red-dark-5": `84 27 31`,
          "--color-red-dark-6": `103 30 34`,
          "--color-red-dark-7": `130 32 37`,
          "--color-red-dark-8": `170 36 41`,
          "--color-red-dark-9": `229 72 77`,
          "--color-red-dark-10": `242 85 90`,
          "--color-red-dark-11": `255 100 105`,
          "--color-red-dark-12": `254 236 238`,

          "--color-slate-light-1": `251 252 253`,
          "--color-slate-light-2": `248 249 250`,
          "--color-slate-light-3": `241 243 245`,
          "--color-slate-light-4": `236 238 240`,
          "--color-slate-light-5": `230 233 235`,
          "--color-slate-light-6": `224 227 230`,
          "--color-slate-light-7": `215 219 223`,
          "--color-slate-light-8": `193 200 205`,
          "--color-slate-light-9": `136 144 150`,
          "--color-slate-light-10": `126 134 140`,
          "--color-slate-light-11": `104 112 118`,
          "--color-slate-light-12": `17 24 29`,
          "--color-slate-dark-1": `21 23 24`,
          "--color-slate-dark-2": `26 29 30`,
          "--color-slate-dark-3": `32 36 37`,
          "--color-slate-dark-4": `38 41 43`,
          "--color-slate-dark-5": `43 47 49`,
          "--color-slate-dark-6": `49 53 56`,
          "--color-slate-dark-7": `58 63 66`,
          "--color-slate-dark-8": `76 81 85`,
          "--color-slate-dark-9": `105 113 119`,
          "--color-slate-dark-10": `120 127 133`,
          "--color-slate-dark-11": `155 161 166`,
          "--color-slate-dark-12": `236 237 238`,

          "--color-amber-light-1": `254 253 251`,
          "--color-amber-light-2": `255 249 237`,
          "--color-amber-light-3": `255 244 213`,
          "--color-amber-light-4": `255 236 188`,
          "--color-amber-light-5": `255 227 162`,
          "--color-amber-light-6": `255 211 134`,
          "--color-amber-light-7": `243 186 99`,
          "--color-amber-light-8": `238 157 43`,
          "--color-amber-light-9": `255 178 36`,
          "--color-amber-light-10": `255 160 28`,
          "--color-amber-light-11": `173 87 0`,
          "--color-amber-light-12": `78 32 9`,
          "--color-amber-dark-1": `31 19 0`,
          "--color-amber-dark-2": `39 23 0`,
          "--color-amber-dark-3": `52 28 0`,
          "--color-amber-dark-4": `63 34 0`,
          "--color-amber-dark-5": `75 41 0`,
          "--color-amber-dark-6": `87 51 0`,
          "--color-amber-dark-7": `105 63 5`,
          "--color-amber-dark-8": `130 78 0`,
          "--color-amber-dark-9": `255 178 36`,
          "--color-amber-dark-10": `255 203 71`,
          "--color-amber-dark-11": `241 161 13`,
          "--color-amber-dark-12": `255 243 221`,

          "--color-cyan-light-1": `250 253 254`,
          "--color-cyan-light-2": `242 252 253`,
          "--color-cyan-light-3": `231 249 251`,
          "--color-cyan-light-4": `216 243 246`,
          "--color-cyan-light-5": `196 234 240`,
          "--color-cyan-light-6": `170 222 230`,
          "--color-cyan-light-7": `132 205 218`,
          "--color-cyan-light-8": `61 185 207`,
          "--color-cyan-light-9": `5 162 194`,
          "--color-cyan-light-10": `8 148 179`,
          "--color-cyan-light-11": `12 119 146`,
          "--color-cyan-light-12": `4 49 60`,
          "--color-cyan-dark-1": `7 25 29`,
          "--color-cyan-dark-2": `6 30 36`,
          "--color-cyan-dark-3": `7 40 48`,
          "--color-cyan-dark-4": `7 48 59`,
          "--color-cyan-dark-5": `7 56 68`,
          "--color-cyan-dark-6": `6 66 80`,
          "--color-cyan-dark-7": `4 80 99`,
          "--color-cyan-dark-8": `0 100 125`,
          "--color-cyan-dark-9": `5 162 194`,
          "--color-cyan-dark-10": `0 177 204`,
          "--color-cyan-dark-11": `0 194 215`,
          "--color-cyan-dark-12": `225 248 250`,
        },
      });
    },
  ],
  corePlugins: {
    // Required until https://github.com/nativewind/nativewind/pull/1144 is merged
    backgroundOpacity: true,

    // Keep native and web consistent so that testing on web is closer to native
    // (this list is taken from https://github.com/nativewind/nativewind/blob/main/packages/nativewind/src/tailwind/native.ts)
    preflight: false,
    borderOpacity: false,
    boxShadow: false,
    caretColor: false,
    divideOpacity: false,
    fill: false,
    placeholderColor: false,
    placeholderOpacity: false,
    lineClamp: false,
    ringOpacity: false,
    stroke: false,
    strokeWidth: false,
    textOpacity: false,
    translate: false,
    pointerEvents: false,
    visibility: false,
  },
};
