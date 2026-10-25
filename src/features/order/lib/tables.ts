export const QR_TABLE_CODES = ["1", "2", "3", "4", "5"] as const;

export type QrTableCode = (typeof QR_TABLE_CODES)[number];

export function getTableCode(value: unknown, fallback = "A12") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized ? normalized : fallback;
}
