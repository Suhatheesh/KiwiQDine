import { toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Timezone utility for consistent date/time handling across the application
 * Default timezone: Asia/Kolkata (IST - UTC+5:30)
 */
export class TimezoneUtil {
    private static readonly TIMEZONE = 'Asia/Kolkata';

    /**
     * Convert UTC date to IST
     */
    static toIST(date: Date): Date {
        return toZonedTime(date, this.TIMEZONE);
    }

    /**
     * Convert IST date to UTC
     */
    static toUTC(date: Date): Date {
        return fromZonedTime(date, this.TIMEZONE);
    }

    /**
     * Get current date/time in IST
     */
    static now(): Date {
        return this.toIST(new Date());
    }

    /**
     * Get start of today in IST (00:00:00)
     */
    static startOfToday(): Date {
        const now = this.now();
        now.setHours(0, 0, 0, 0);
        return this.toUTC(now); // Return as UTC for database queries
    }

    /**
     * Get end of today in IST (23:59:59.999)
     */
    static endOfToday(): Date {
        const now = this.now();
        now.setHours(23, 59, 59, 999);
        return this.toUTC(now); // Return as UTC for database queries
    }

    /**
     * Get start of tomorrow in IST (00:00:00)
     */
    static startOfTomorrow(): Date {
        const tomorrow = this.now();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return this.toUTC(tomorrow); // Return as UTC for database queries
    }

    /**
     * Extract hour from UTC date in IST timezone
     */
    static getHourIST(utcDate: Date): number {
        const istDate = this.toIST(utcDate);
        return istDate.getHours();
    }

    /**
     * Extract date string (YYYY-MM-DD) from UTC date in IST timezone
     */
    static getDateStringIST(utcDate: Date): string {
        const istDate = this.toIST(utcDate);
        const year = istDate.getFullYear();
        const month = (istDate.getMonth() + 1).toString().padStart(2, '0');
        const day = istDate.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Get start of date in IST
     */
    static startOfDate(date: Date): Date {
        const istDate = this.toIST(date);
        istDate.setHours(0, 0, 0, 0);
        return this.toUTC(istDate);
    }

    /**
     * Get end of date in IST
     */
    static endOfDate(date: Date): Date {
        const istDate = this.toIST(date);
        istDate.setHours(23, 59, 59, 999);
        return this.toUTC(istDate);
    }
}
