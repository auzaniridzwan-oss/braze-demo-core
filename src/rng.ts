import seedrandom from "seedrandom";

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  chance(percent: number): boolean;
  pick<T>(arr: T[]): T;
  weighted<T>(items: T[], weights: number[]): T;
  normal(): number;
}

/** One independent stream per (seed, user index), so a user doesn't change when others do. */
export function createRng(seed: number | string, stream: number | string): Rng {
  const prng = seedrandom(`${seed}:${stream}`);
  const next = () => prng.quick();
  return {
    next,
    int: (min, max) => (max <= min ? min : min + Math.floor(next() * (max - min + 1))),
    chance: (percent) => (percent >= 100 ? true : percent <= 0 ? false : next() * 100 < percent),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    weighted: (items, weights) => {
      const ws = items.map((_, i) => Math.max(0, weights[i] ?? 1));
      const total = ws.reduce((a, b) => a + b, 0);
      if (total <= 0) return items[Math.floor(next() * items.length)];
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= ws[i];
        if (r < 0) return items[i];
      }
      return items[items.length - 1];
    },
    // Box-Muller
    normal: () => {
      const u = 1 - next();
      const v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
}
