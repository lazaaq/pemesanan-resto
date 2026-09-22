"use client";

import { useState } from "react";
import {
  EDITABLE_TOKENS,
  type EditableTokenKey,
  type ThemePaletteValues,
  deriveShellTokens,
} from "@/config/theme-palettes";
import {
  resetCustomPaletteAction,
  saveCustomPaletteAction,
} from "@/app/admin/actions";
import { ThemePreviewCard } from "@/features/admin/components/theme-preview-card";

interface ColorPaletteEditorProps {
  initialPresetValues: ThemePaletteValues;
  currentCustomValues?: Partial<ThemePaletteValues> | null;
  isCustomActive: boolean;
}

export function ColorPaletteEditor({
  initialPresetValues,
  currentCustomValues,
  isCustomActive,
}: ColorPaletteEditorProps) {
  // Extract initial 8 editable token values
  const getInitialColors = (): Record<EditableTokenKey, string> => {
    const res = {} as Record<EditableTokenKey, string>;
    for (const { key } of EDITABLE_TOKENS) {
      res[key] = currentCustomValues?.[key] ?? initialPresetValues[key];
    }
    return res;
  };

  const [colors, setColors] = useState<Record<EditableTokenKey, string>>(getInitialColors);

  const handleColorChange = (key: EditableTokenKey, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  // Calculate live preview CSS variables dynamically
  const derived = deriveShellTokens(colors.primary, colors.accent, colors.background);
  const liveCssVars = {
    "--background": colors.background,
    "--foreground": colors.foreground,
    "--muted": colors.muted,
    "--card": colors.card,
    "--border": colors.border,
    "--primary": colors.primary,
    "--secondary": colors.secondary,
    "--accent": colors.accent,
    "--ring": derived.ring,
    "--shadow-soft": derived.shadowSoft,
    "--surface-card": derived.surfaceCard,
    "--shell-glow-primary": derived.shellGlowPrimary,
    "--shell-glow-secondary": derived.shellGlowSecondary,
    "--shell-base-start": derived.shellBaseStart,
    "--shell-base-middle": derived.shellBaseMiddle,
    "--shell-base-end": derived.shellBaseEnd,
  } as React.CSSProperties;

  return (
    <div className="admin-card space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--admin-primary)" }}
          >
            Custom Palette
          </p>
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--admin-foreground)" }}
          >
            Konfigurasi Palet Warna Lengkap
          </h2>
          <p className="max-w-3xl text-sm leading-6" style={{ color: "var(--admin-muted)" }}>
            Kustomisasi setiap warna secara individual. Perubahan dapat dilihat langsung pada Live Preview di samping sebelum disimpan.
          </p>
        </div>
        {isCustomActive && (
          <span
            className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold"
            style={{
              background: "rgba(255,200,30,0.15)",
              color: "#92700a",
              border: "1px solid rgba(255,200,30,0.5)",
            }}
          >
            ★ Palet Custom Aktif
          </span>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Editor Form */}
        <form action={saveCustomPaletteAction} className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {EDITABLE_TOKENS.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl p-3"
                style={{ border: "1px solid var(--admin-border)", background: "#f8fafc" }}
              >
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`color-${key}`}
                    className="block text-xs font-medium"
                    style={{ color: "var(--admin-foreground)" }}
                  >
                    {label}
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      id={`color-${key}`}
                      type="color"
                      value={colors[key] || "#000000"}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="h-7 w-7 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      name={key}
                      value={colors[key] || ""}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="admin-input w-28 font-mono text-xs py-1"
                      style={{ borderRadius: "0.5rem" }}
                    />
                  </div>
                </div>
                <div
                  className="h-9 w-9 shrink-0 rounded-xl shadow-sm"
                  style={{
                    backgroundColor: colors[key],
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" className="admin-btn-primary px-6 py-2.5 text-sm">
              Simpan Custom Palette
            </button>
            {isCustomActive && (
              <button
                type="button"
                onClick={async () => {
                  await resetCustomPaletteAction();
                }}
                className="admin-btn-ghost px-5 py-2.5 text-sm"
              >
                Reset ke Palet Preset
              </button>
            )}
          </div>
        </form>

        {/* Live Preview Card */}
        <ThemePreviewCard cssVariables={liveCssVars} />
      </div>
    </div>
  );
}
