/** The small numeric helpers the motion directives share */
export class MathUtils {
  /** Constrains a value to a range */
  public static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /** Constrains a value to a range centred on zero */
  public static clampAround(value: number, limit: number): number {
    return MathUtils.clamp(value, -limit, limit);
  }

  /** Moves a value from one range to another, clamped to the output range */
  public static mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
  ): number {
    if (inMax === inMin) {
      return outMin;
    }

    const t = MathUtils.clamp((value - inMin) / (inMax - inMin), 0, 1);
    return outMin + (outMax - outMin) * t;
  }

  /** Eases 0..1 with a soft finish */
  public static easeOutCubic(t: number): number {
    return 1 - (1 - t) ** 3;
  }

  /** Moves `from` a fraction of the way toward `to` */
  public static lerp(from: number, to: number, amount: number): number {
    return from + (to - from) * amount;
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
