/** Pure snake-draft rules. Draft positions are 0-based; pick indexes are 0-based (pick number − 1). */

export const TOTAL_PICKS = 30;

export function picksPerPlayer(size: number): number {
  return TOTAL_PICKS / size;
}

/** Round (0-based) that a pick index falls in. */
export function roundOf(pickIndex: number, size: number): number {
  return Math.floor(pickIndex / size);
}

/** Draft position on the clock for a pick index: forward in even rounds, reversed in odd rounds. */
export function positionForPick(pickIndex: number, size: number): number {
  const i = pickIndex % size;
  return roundOf(pickIndex, size) % 2 === 0 ? i : size - 1 - i;
}

/** Fisher–Yates shuffle using the supplied random source (0 <= r < 1). */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** True when `order` contains exactly the ids in `ids`, each once. */
export function isPermutationOf(order: readonly string[], ids: readonly string[]): boolean {
  if (order.length !== ids.length || new Set(order).size !== order.length) return false;
  const set = new Set(ids);
  return order.every((id) => set.has(id));
}
