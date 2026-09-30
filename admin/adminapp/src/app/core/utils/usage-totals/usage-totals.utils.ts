import { UsageDay } from '../../../data';

/** Counting operations across the archived days. */
export class UsageTotals {
  /** What one day holds for a set of operations, which is how a stacked segment is measured. */
  public static countOn(day: UsageDay, names: readonly string[]): number {
    return day.operations
      .filter((operation) => names.includes(operation.name))
      .reduce((sum, operation) => sum + operation.count, 0);
  }

  /** The same across a run of days, one number per day, in the order the days were given. */
  public static countPerDay(days: readonly UsageDay[], names: readonly string[]): number[] {
    return days.map((day) => UsageTotals.countOn(day, names));
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
