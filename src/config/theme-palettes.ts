import type { CSSProperties } from "react";

export type ThemePalette = {
  slug: string;
  name: string;
  description: string;
  values: {
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
};

export const themePalettes: ThemePalette[] = [
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

export const defaultThemePaletteSlug = themePalettes[0]?.slug ?? "terracotta-spice";

export function getThemePalette(slug?: string | null) {
  return themePalettes.find((palette) => palette.slug === slug) ?? themePalettes[0];
}

export function getThemePaletteCssVariables(slug?: string | null) {
  const palette = getThemePalette(slug);

  return {
    "--background": palette.values.background,
    "--foreground": palette.values.foreground,
    "--muted": palette.values.muted,
    "--card": palette.values.card,
    "--border": palette.values.border,
    "--primary": palette.values.primary,
    "--secondary": palette.values.secondary,
    "--accent": palette.values.accent,
    "--ring": palette.values.ring,
    "--shadow-soft": palette.values.shadowSoft,
    "--surface-card": palette.values.surfaceCard,
    "--shell-glow-primary": palette.values.shellGlowPrimary,
    "--shell-glow-secondary": palette.values.shellGlowSecondary,
    "--shell-base-start": palette.values.shellBaseStart,
    "--shell-base-middle": palette.values.shellBaseMiddle,
    "--shell-base-end": palette.values.shellBaseEnd,
  } as CSSProperties;
}
