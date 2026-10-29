import { defineSettings } from "@getpaseo/plugin";
import { z } from "zod";

/**
 * How the answer-stats row sits under a completed turn's footer.
 *
 * Both values are ratios, not pixels: a fixed pixel gap only reads as "one
 * block" at one text size, and the text size is not ours — a theme plugin
 * redraws that footer, Paseo's appearance settings scale it, and iOS/Android
 * apply their own font scaling on top. A gap measured in em (a multiple of the
 * row's own font size) keeps the same optical rhythm at every size, on every
 * screen, without a number that has to be re-tuned per device.
 *
 * The defaults reproduce the geometry Paseo's own footer draws with:
 * `STREAM_METADATA_FONT_SIZE` = 13px and a 6px gap, i.e. 6/13 em.
 */
export const streamStatsSettings = defineSettings({
  id: "stream-stats",
  scope: "host",
  version: 1,
  schema: z.object({
    /** Gap under the footer, as a multiple of the row's font size (6/13 ≈ 0.46). */
    gapEm: z.number().min(0).max(2).default(0.46),
    /** The row's text size relative to Paseo's footer text (13px → 1). */
    fontScale: z.number().min(0.75).max(1.5).default(1),
  }),
});

export type StreamStatsSettings = z.output<typeof streamStatsSettings.schema>;

/** What the row falls back to while the settings are still loading. */
export const DEFAULT_STREAM_STATS: StreamStatsSettings = { gapEm: 0.46, fontScale: 1 };

/** Paseo's `STREAM_METADATA_FONT_SIZE`: the size its completed-turn footer draws at. */
export const FOOTER_FONT_SIZE = 13;

/** Round to two decimals, so a ratio cannot produce 12.999999 in a style. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * The pixels these ratios resolve to at the row's text size. The gap follows
 * the size the row actually renders at, so a reader who enlarges the text gets
 * the same 0.46em of air under the footer instead of a fixed 6px that shrinks
 * into the glyphs.
 */
export function statsGeometry(settings: StreamStatsSettings): { fontSize: number; gap: number } {
  const fontSize = round(FOOTER_FONT_SIZE * settings.fontScale);
  // Whole pixels for the gap: 13 * 0.46 is 5.98, and "6px of air" should not
  // depend on floating-point drift in a style object.
  return { fontSize, gap: Math.round(fontSize * settings.gapEm) };
}
