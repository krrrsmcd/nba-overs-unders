/**
 * Player colors, shared by the History chart and the scoreboard cards.
 * Categorical slots validated (color-vision deficiency + contrast) on the dark panel surface #15152e.
 * Assigned by draft order so a player's color never changes.
 */
export const SERIES_COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"];

export function playerColor(draftIndex: number): string {
  return SERIES_COLORS[draftIndex % SERIES_COLORS.length];
}
