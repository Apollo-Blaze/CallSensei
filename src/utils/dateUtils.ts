/**
 * Utility functions for handling timestamps in ISO string format
 */

/**
 * Formats an ISO timestamp string to a human-readable date string
 * @param isoString - ISO timestamp string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatTimestamp = (
    isoString: string,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }
): string => {
    try {
        const date = new Date(isoString);
        return date.toLocaleString(undefined, options);
    } catch (error) {
        console.warn('Invalid ISO timestamp:', isoString);
        return 'Invalid Date';
    }
};

/**
 * Formats an ISO timestamp string to a relative time string (e.g., "2 minutes ago")
 * @param isoString - ISO timestamp string
 * @returns Relative time string
 */
export const formatRelativeTime = (isoString: string): string => {
    try {
        const date = new Date(isoString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    } catch (error) {
        console.warn('Invalid ISO timestamp:', isoString);
        return 'Invalid Date';
    }
};

/**
 * Gets the current timestamp as an ISO string
 * @returns Current timestamp in ISO format
 */
export const getCurrentTimestamp = (): string => {
    return new Date().toISOString();
};

/**
 * Validates if a string is a valid ISO timestamp
 * @param isoString - String to validate
 * @returns True if valid ISO timestamp
 */
export const isValidISOTimestamp = (isoString: string): boolean => {
    try {
        const date = new Date(isoString);
        return date.toISOString() === isoString;
    } catch {
        return false;
    }
};

