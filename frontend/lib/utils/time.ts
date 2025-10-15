/**
 * Time utility functions for PSRA-LTSD Platform
 * Provides date formatting, time calculations, and relative time displays
 */

import { format, formatDistanceToNow, parseISO, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { nl } from 'date-fns/locale';

/**
 * Format date to human-readable string
 * @param date - Date string or Date object
 * @param formatString - Format pattern (default: 'PPp' = "Apr 29, 2025, 10:30 AM")
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, formatString: string = 'PPp'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString, { locale: nl });
}

/**
 * Format date to short format (e.g., "29-04-2025")
 */
export function formatDateShort(date: string | Date): string {
  return formatDate(date, 'dd-MM-yyyy');
}

/**
 * Format date to long format (e.g., "29 april 2025")
 */
export function formatDateLong(date: string | Date): string {
  return formatDate(date, 'dd MMMM yyyy');
}

/**
 * Format time only (e.g., "10:30")
 */
export function formatTime(date: string | Date): string {
  return formatDate(date, 'HH:mm');
}

/**
 * Format datetime (e.g., "29-04-2025 10:30")
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd-MM-yyyy HH:mm');
}

/**
 * Get relative time (e.g., "3 minutes ago", "in 2 hours")
 * @param date - Date string or Date object
 * @returns Relative time string in Dutch
 */
export function getRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: nl });
}

/**
 * Calculate time remaining until a deadline
 * @param deadline - Deadline date
 * @returns Object with days, hours, minutes remaining
 */
export function getTimeRemaining(deadline: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  isOverdue: boolean;
} {
  const deadlineObj = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  const now = new Date();

  const days = differenceInDays(deadlineObj, now);
  const hours = differenceInHours(deadlineObj, now) % 24;
  const minutes = differenceInMinutes(deadlineObj, now) % 60;
  const isOverdue = deadlineObj < now;

  return {
    days,
    hours,
    minutes,
    isOverdue
  };
}

/**
 * Format time remaining as human-readable string
 * @param deadline - Deadline date
 * @returns Formatted string (e.g., "2 dagen, 5 uur resterend")
 */
export function formatTimeRemaining(deadline: string | Date): string {
  const { days, hours, minutes, isOverdue } = getTimeRemaining(deadline);

  if (isOverdue) {
    return 'Verlopen';
  }

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} dag${days > 1 ? 'en' : ''}`);
  if (hours > 0) parts.push(`${hours} uur`);
  if (minutes > 0 && days === 0) parts.push(`${minutes} minuten`);

  return parts.length > 0 ? `${parts.join(', ')} resterend` : 'Minder dan 1 minuut resterend';
}

/**
 * Check if a date is in the past
 */
export function isPast(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj < new Date();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj > new Date();
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Get time since (e.g., "Updated 2 hours ago")
 * @param date - Past date
 * @returns Formatted string
 */
export function getTimeSince(date: string | Date): string {
  return getRelativeTime(date);
}

/**
 * Format duration in milliseconds to human-readable string
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "2h 30m")
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Parse ISO date string safely
 * @param dateString - ISO date string
 * @returns Date object or null if invalid
 */
export function parseISOSafe(dateString: string): Date | null {
  try {
    return parseISO(dateString);
  } catch {
    return null;
  }
}

// Export alias for compatibility
export { getRelativeTime as formatRelativeTimeFromNow };
