/**
 * Player colors, shared by the History chart and the scoreboard cards.
 * The 90s-arcade neons: the theme's yellow, pink and light blue, plus neon green and electric purple.
 * Assigned by draft order so a player's color never changes.
 */
export const SERIES_COLORS = ["#ffe53b", "#ff2e88", "#22e4ff", "#4dff6a", "#b061ff"];

export function playerColor(draftIndex: number): string {
  return SERIES_COLORS[draftIndex % SERIES_COLORS.length];
}
