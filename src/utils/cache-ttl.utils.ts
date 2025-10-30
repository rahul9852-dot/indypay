import * as dayjs from "dayjs";

/**
 * Smart TTL Calculator for Stats Caching
 *
 * Philosophy:
 * - Current day data: 5 minutes (frequently changing)
 * - Yesterday's data: 1 hour (moderate changes)
 * - Last 7 days: 4 hours (mostly stable)
 * - Last 30 days: 12 hours (very stable)
 * - Older data: 24 hours (historical, rarely changes)
 */
export class CacheTTLCalculator {
  private static readonly TTL = {
    CURRENT_DAY: 5 * 60 * 1000, // 5 minutes
    YESTERDAY: 60 * 60 * 1000, // 1 hour
    LAST_7_DAYS: 4 * 60 * 60 * 1000, // 4 hours
    LAST_30_DAYS: 12 * 60 * 60 * 1000, // 12 hours
    HISTORICAL: 24 * 60 * 60 * 1000, // 24 hours
  };

  /**
   * Calculate smart TTL based on date range
   * @param startDate - Start date of the query
   * @param endDate - End date of the query
   * @returns TTL in milliseconds
   */
  static calculateTTL(startDate: Date, endDate: Date): number {
    const now = dayjs();
    const end = dayjs(endDate);

    // Check if the date range includes today
    const includesCurrentDay =
      end.isSame(now, "day") || end.isAfter(now, "day");

    if (includesCurrentDay) {
      // If querying current day data, use shortest TTL
      return this.TTL.CURRENT_DAY;
    }

    // Calculate how old the most recent date in the range is
    const daysOld = now.diff(end, "day");

    if (daysOld === 1) {
      // Yesterday's data
      return this.TTL.YESTERDAY;
    } else if (daysOld <= 7) {
      // Last week's data
      return this.TTL.LAST_7_DAYS;
    } else if (daysOld <= 30) {
      // Last month's data
      return this.TTL.LAST_30_DAYS;
    } else {
      // Historical data (older than 30 days)
      return this.TTL.HISTORICAL;
    }
  }

  /**
   * Get TTL in human-readable format for logging
   */
  static getTTLDescription(ttl: number): string {
    const minutes = Math.floor(ttl / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day(s)`;
    if (hours > 0) return `${hours} hour(s)`;

    return `${minutes} minute(s)`;
  }
}
