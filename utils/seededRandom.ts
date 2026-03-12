
/**
 * Linear Congruential Generator (LCG) for deterministic pseudo-random numbers.
 * Parameters from numerical recipes.
 */
class LCG {
  private m = 4294967296;
  private a = 1664525;
  private c = 1013904223;
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  nextFloat(): number {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state / this.m;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }
}

/**
 * Generates a stable hash code from a string.
 */
export const stringHash = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const createDeterministicRandom = (seed: number) => {
  return new LCG(seed);
};
