import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string consistently without timezone conversion
 * This ensures dates display the same regardless of browser timezone
 * Parses the ISO string directly to avoid timezone conversion
 */
export function formatDate(dateString: string | Date): string {
  if (typeof dateString === 'string') {
    // Parse ISO string directly to avoid timezone conversion
    // Handle formats like:
    // - "2025-11-26T19:48" (no timezone - treat as literal time)
    // - "2025-11-26T19:48:00" (no timezone - treat as literal time)
    // - "2025-11-26T19:48:00.000Z" (UTC)
    // - "2025-11-26T19:48:00+00:00" (with timezone)
    
    // Try to match ISO format: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:\d{2})?/);
    
    if (isoMatch) {
      const [, year, month, day, hour, minute, second = '00'] = isoMatch;
      const hours = parseInt(hour, 10);
      const minutes = minute.padStart(2, '0');
      const seconds = (second || '00').padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      
      // If no timezone specified (like "2025-11-26T19:48"), use the literal time
      // If timezone is Z or specified, we still use the literal time from the string
      return `${month}/${day}/${year}, ${displayHours}:${minutes}:${seconds} ${ampm}`;
    }
    
    // Fallback: try to parse as Date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      // If it's a valid date, extract parts directly from the original string if possible
      // Otherwise use the date object
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${month}/${day}/${year}, ${displayHours}:${minutes}:${seconds} ${ampm}`;
    }
  } else {
    // Date object - use local time methods (not UTC) to preserve the intended time
    const year = dateString.getFullYear();
    const month = String(dateString.getMonth() + 1).padStart(2, '0');
    const day = String(dateString.getDate()).padStart(2, '0');
    const hours = dateString.getHours();
    const minutes = String(dateString.getMinutes()).padStart(2, '0');
    const seconds = String(dateString.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${month}/${day}/${year}, ${displayHours}:${minutes}:${seconds} ${ampm}`;
  }
  
  return 'Invalid Date';
}

/**
 * Parse a date string and treat it as local time (no timezone conversion)
 * For dates like "2025-11-26T19:48", extracts the literal time values
 */
function parseDateAsLocal(dateString: string): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  // Match ISO format: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
  const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?/);
  
  if (isoMatch) {
    const [, year, month, day, hour, minute, second = '00'] = isoMatch;
    return {
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      day: parseInt(day, 10),
      hour: parseInt(hour, 10),
      minute: parseInt(minute, 10),
      second: parseInt(second, 10),
    };
  }
  
  // Fallback: parse as regular date and extract local components
  const date = new Date(dateString);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
  };
}

/**
 * Check if current time is within a date range
 * Compares dates as literal times without timezone conversion
 */
export function isDateInRange(rangeStart: string, rangeEnd: string): boolean {
  const now = new Date();
  const nowParts = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds(),
  };
  
  const startParts = parseDateAsLocal(rangeStart);
  const endParts = parseDateAsLocal(rangeEnd);
  
  // Compare as timestamps (year, month, day, hour, minute, second)
  const nowTimestamp = `${nowParts.year}-${String(nowParts.month).padStart(2, '0')}-${String(nowParts.day).padStart(2, '0')}T${String(nowParts.hour).padStart(2, '0')}:${String(nowParts.minute).padStart(2, '0')}:${String(nowParts.second).padStart(2, '0')}`;
  const startTimestamp = `${startParts.year}-${String(startParts.month).padStart(2, '0')}-${String(startParts.day).padStart(2, '0')}T${String(startParts.hour).padStart(2, '0')}:${String(startParts.minute).padStart(2, '0')}:${String(startParts.second).padStart(2, '0')}`;
  const endTimestamp = `${endParts.year}-${String(endParts.month).padStart(2, '0')}-${String(endParts.day).padStart(2, '0')}T${String(endParts.hour).padStart(2, '0')}:${String(endParts.minute).padStart(2, '0')}:${String(endParts.second).padStart(2, '0')}`;
  
  return nowTimestamp >= startTimestamp && nowTimestamp <= endTimestamp;
}
