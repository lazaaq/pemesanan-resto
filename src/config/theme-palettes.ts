import type { CSSProperties } from "react";

export type ThemePaletteValues = {
  background: string;
  foreground: string;
  muted: string;
  card: string;
  border: string;
  primary: string;
  secondary: string;
  accent: string;
  ring: string;
  shadowSoft: string;
  surfaceCard: string;
  shellGlowPrimary: string;
  shellGlowSecondary: string;
  shellBaseStart: string;
  shellBaseMiddle: string;
  shellBaseEnd: string;
};

/** The 8 tokens an admin can edit manually in the UI. */
export const EDITABLE_TOKENS = [
  { key: "background",  label: "Background" },
  { key: "foreground",  label: "Teks Utama" },
  { key: "muted",       label: "Teks Redup" },
  { key: "card",        label: "Kartu" },
  { key: "border",      label: "Border" },
  { key: "primary",     label: "Warna Primer" },
  { key: "secondary",   label: "Warna Sekunder" },
  { key: "accent",      label: "Aksen" },
] as const satisfies readonly { key: keyof ThemePaletteValues; label: string }[];

export type EditableTokenKey = (typeof EDITABLE_TOKENS)[number]["key"];

export type ThemePalette = {
  slug: string;
  name: string;
  description: string;
  values: ThemePaletteValues;
};

export const themePalettes: ThemePalette[] = [
  {
    slug: "midnight-sage",
    name: "Midnight Sage",
    description: "Elegan dan segar dengan forest green, warm cream, dan gold accent.",
    values: {
      background: "#f2f4f0",
      foreground: "#1a1f1c",
      muted: "#5e6b63",
      card: "#fafcf9",
      border: "rgba(30, 48, 38, 0.10)",
      primary: "#2d6a4f",
      secondary: "#1b3b2f",
      accent: "#d4a853",
      ring: "rgba(45, 106, 79, 0.22)",
      shadowSoft: "0 24px 80px rgba(20, 44, 30, 0.12)",
      surfaceCard: "rgba(250, 252, 249, 0.86)",
      shellGlowPrimary: "rgba(212, 168, 83, 0.16)",
      shellGlowSecondary: "rgba(45, 106, 79, 0.12)",
      shellBaseStart: "#f5f8f4",
      shellBaseMiddle: "#edf1ea",
      shellBaseEnd: "#e5ebe2",
    },
  },
  {
    slug: "terracotta-spice",
    name: "Terracotta Spice",
    description: "Hangat dan earthy untuk nuansa resto rumahan premium.",
    values: {
      background: "#f7efe4",
      foreground: "#1f1a17",
      muted: "#61574d",
      card: "#fffaf3",
      border: "rgba(54, 38, 23, 0.12)",
      primary: "#b24a32",
      secondary: "#21473f",
      accent: "#ecb15f",
      ring: "rgba(178, 74, 50, 0.24)",
      shadowSoft: "0 24px 80px rgba(80, 44, 16, 0.12)",
      surfaceCard: "rgba(255, 250, 243, 0.84)",
      shellGlowPrimary: "rgba(236, 177, 95, 0.18)",
      shellGlowSecondary: "rgba(33, 71, 63, 0.14)",
      shellBaseStart: "#fbf6ee",
      shellBaseMiddle: "#f7efe4",
      shellBaseEnd: "#f4ecdf",
    },
  },
  {
    slug: "forest-tea",
    name: "Forest Tea",
    description: "Segar dan natural dengan aksen hijau teh yang kalem.",
    values: {
      background: "#edf5ef",
      foreground: "#16241c",
      muted: "#54645d",
      card: "#f9fdf8",
      border: "rgba(31, 67, 52, 0.14)",
      primary: "#2f6f55",
      secondary: "#123d33",
      accent: "#dba85f",
      ring: "rgba(47, 111, 85, 0.2)",
      shadowSoft: "0 24px 80px rgba(22, 59, 45, 0.12)",
      surfaceCard: "rgba(249, 253, 248, 0.86)",
      shellGlowPrimary: "rgba(219, 168, 95, 0.2)",
      shellGlowSecondary: "rgba(47, 111, 85, 0.14)",
      shellBaseStart: "#f7fbf7",
      shellBaseMiddle: "#edf5ef",
      shellBaseEnd: "#e4efe8",
    },
  },
  {
    slug: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Bersih dan ringan dengan biru laut untuk brand modern.",
    values: {
      background: "#ecf5f8",
      foreground: "#16242f",
      muted: "#5c6973",
      card: "#f9fdff",
      border: "rgba(27, 77, 105, 0.12)",
      primary: "#1e7294",
      secondary: "#18465c",
      accent: "#ffb86b",
      ring: "rgba(30, 114, 148, 0.2)",
      shadowSoft: "0 24px 80px rgba(24, 70, 92, 0.12)",
      surfaceCard: "rgba(249, 253, 255, 0.88)",
      shellGlowPrimary: "rgba(255, 184, 107, 0.18)",
      shellGlowSecondary: "rgba(30, 114, 148, 0.14)",
      shellBaseStart: "#f8fcfd",
      shellBaseMiddle: "#ecf5f8",
      shellBaseEnd: "#e3eef4",
    },
  },
  {
    slug: "sunset-pop",
    name: "Sunset Pop",
    description: "Lebih playful dengan kombinasi coral dan peach yang cerah.",
    values: {
      background: "#fff1ea",
      foreground: "#311d18",
      muted: "#7a625a",
      card: "#fffaf7",
      border: "rgba(125, 68, 52, 0.12)",
      primary: "#dd6b4d",
      secondary: "#6c3f34",
      accent: "#f5a623",
      ring: "rgba(221, 107, 77, 0.22)",
      shadowSoft: "0 24px 80px rgba(101, 55, 40, 0.14)",
      surfaceCard: "rgba(255, 250, 247, 0.88)",
      shellGlowPrimary: "rgba(245, 166, 35, 0.2)",
      shellGlowSecondary: "rgba(221, 107, 77, 0.16)",
      shellBaseStart: "#fff8f3",
      shellBaseMiddle: "#fff1ea",
      shellBaseEnd: "#ffe8de",
    },
  },
];

export const defaultThemePaletteSlug = themePalettes[0]?.slug ?? "midnight-sage";

export function getThemePalette(slug?: string | null) {
  return themePalettes.find((palette) => palette.slug === slug) ?? themePalettes[0];
}

/**
 * Derive secondary shell / shadow tokens automatically from primary & accent hex values.
 * Used when only the 8 editable tokens are stored; the remaining tokens are computed.
 */
export function deriveShellTokens(
  primary: string,
  accent: string,
  background: string,
): Pick<
  ThemePaletteValues,
  | "ring"
  | "shadowSoft"
  | "surfaceCard"
  | "shellGlowPrimary"
  | "shellGlowSecondary"
  | "shellBaseStart"
  | "shellBaseMiddle"
  | "shellBaseEnd"
> {
  return {
    ring: `${primary}38`,           // primary at ~22% opacity
    shadowSoft: `0 24px 80px ${primary}1f`,
    surfaceCard: `${background}dc`,
    shellGlowPrimary: `${accent}29`,
    shellGlowSecondary: `${primary}1f`,
    shellBaseStart: background,
    shellBaseMiddle: background,
    shellBaseEnd: background,
  };
}

/**
 * Resolve the final CSS-variable map for a restaurant.
 * If `customValues` (the DB JSONB column) is present it overrides the preset palette.
 */
export function resolveThemeCssVariables(
  paletteSlug?: string | null,
  customValues?: Partial<ThemePaletteValues> | null,
): CSSProperties {
  const preset = getThemePalette(paletteSlug);

  // Merge: custom values win where present
  const merged: ThemePaletteValues = customValues
    ? {
        ...preset.values,
        ...customValues,
        // Recompute derived tokens when primary/accent/background are customised
        ...deriveShellTokens(
          customValues.primary ?? preset.values.primary,
          customValues.accent ?? preset.values.accent,
          customValues.background ?? preset.values.background,
        ),
      }
    : preset.values;

  return {
    "--background": merged.background,
    "--foreground": merged.foreground,
    "--muted": merged.muted,
    "--card": merged.card,
    "--border": merged.border,
    "--primary": merged.primary,
    "--secondary": merged.secondary,
    "--accent": merged.accent,
    "--ring": merged.ring,
    "--shadow-soft": merged.shadowSoft,
    "--surface-card": merged.surfaceCard,
    "--shell-glow-primary": merged.shellGlowPrimary,
    "--shell-glow-secondary": merged.shellGlowSecondary,
    "--shell-base-start": merged.shellBaseStart,
    "--shell-base-middle": merged.shellBaseMiddle,
    "--shell-base-end": merged.shellBaseEnd,
  } as CSSProperties;
}

/** @deprecated Use resolveThemeCssVariables instead */
export function getThemePaletteCssVariables(slug?: string | null) {
  return resolveThemeCssVariables(slug, null);
}
