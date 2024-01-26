export namespace RandomUtils {
  export function range(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  export function within(max: number): number {
    return Math.floor(Math.random() * max);
  }
}
