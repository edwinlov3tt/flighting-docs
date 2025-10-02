/**
 * Date manipulation utilities for Media Flight Planner
 * Extracted from index.html - no logic changes
 * All functions handle timezone-safe date parsing
 */

// Parse date string safely (handles both YYYY-MM-DD and ISO datetime formats)
export const parseDate = (dateString) => {
    if (!dateString) return null;

    // Handle ISO datetime format (YYYY-MM-DDTHH:mm:ss or with Z)
    if (typeof dateString === 'string' && (dateString.includes('T') || dateString.includes('Z'))) {
        const datePart = dateString.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    // Handle simple YYYY-MM-DD format
    if (typeof dateString === 'string' && dateString.includes('-')) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    return new Date(dateString);
};

// Calculate months between dates (timezone-safe)
export const getMonthsBetween = (startDate, endDate) => {
    // Parse dates safely to avoid timezone issues
    let start, end;

    if (typeof startDate === 'string') {
        if (startDate.includes('T') || startDate.includes('Z')) {
            const datePart = startDate.split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            start = new Date(year, month - 1, day);
        } else {
            const [year, month, day] = startDate.split('-').map(Number);
            start = new Date(year, month - 1, day);
        }
    } else {
        start = new Date(startDate);
    }

    if (typeof endDate === 'string') {
        if (endDate.includes('T') || endDate.includes('Z')) {
            const datePart = endDate.split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            end = new Date(year, month - 1, day);
        } else {
            const [year, month, day] = endDate.split('-').map(Number);
            end = new Date(year, month - 1, day);
        }
    } else {
        end = new Date(endDate);
    }

    const months = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= lastMonth) {
        months.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
    }

    return months;
};

// Get first day of month
export const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Get last day of month
export const getLastDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};
