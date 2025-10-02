/**
 * Formatting utilities for Media Flight Planner
 * Extracted from index.html - no logic changes
 */

// Format date to MM/DD/YYYY (with proper timezone handling)
export const formatDate = (dateString) => {
    if (!dateString) return '';

    // Handle different date formats and ensure local timezone
    let date;
    if (dateString.includes('T') || dateString.includes('Z')) {
        // ISO string - extract just the date part to avoid timezone issues
        const datePart = dateString.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        date = new Date(year, month - 1, day); // month is 0-based
    } else {
        // Already a date string in YYYY-MM-DD format
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day); // month is 0-based
    }

    return date.toLocaleDateString('en-US');
};

// Format date for form inputs (YYYY-MM-DD)
export const formatDateForInput = (date) => {
    if (!date) return '';

    let dateObj;
    if (typeof date === 'string') {
        // If it's already a string in YYYY-MM-DD format, return as-is
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return date;
        }
        // Handle ISO datetime format
        if (date.includes('T') || date.includes('Z')) {
            const datePart = date.split('T')[0];
            return datePart;
        }
        dateObj = new Date(date);
    } else {
        dateObj = date;
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

// Format currency
export const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0.00';
    return `$${parseFloat(value).toFixed(2)}`;
};

// Format number with commas
export const formatNumber = (value) => {
    if (!value && value !== 0) return '0';
    return value.toLocaleString('en-US');
};
