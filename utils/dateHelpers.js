/**
 * Utility functions for date manipulation
 * Ensuring Monday is the start of the week for all calculations
 */

// Helper to get today's date in YYYY-MM-DD format using local timezone
export const getToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to get current date string in local timezone (alias for getToday)
export const getLocalDateString = () => {
    return getToday();
};

// Parse YYYY-MM-DD string as local date (avoids UTC conversion issues)
export const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day); // Create as local time (midnight)
    }
    return new Date(dateString); // Fallback for other formats
};

// Start of Week (Monday)
export const getStartOfWeek = (dateParam = new Date()) => {
    const date = new Date(dateParam);
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)

    // Adjust so that Monday is 0, Sunday is 6
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);

    const startOfWeek = new Date(date.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
};

// Start of Month
export const getStartOfMonth = (dateParam = new Date()) => {
    const date = new Date(dateParam);
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Start of Year
export const getStartOfYear = (dateParam = new Date()) => {
    const date = new Date(dateParam);
    return new Date(date.getFullYear(), 0, 1);
};

// Format date to YYYY-MM-DD string using local timezone
export const formatDateToISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Get period dates based on type
export const getPeriodDates = (periodType, customStart, customEnd) => {
    const today = new Date();
    const todayStr = formatDateToISO(today);

    let startDate;
    let endDate = todayStr;

    switch (periodType) {
        case 'today':
            startDate = todayStr;
            break;
        case 'week':
            startDate = formatDateToISO(getStartOfWeek(today));
            break;
        case 'month':
            startDate = formatDateToISO(getStartOfMonth(today));
            break;
        case 'year':
            startDate = formatDateToISO(getStartOfYear(today));
            break;
        case 'custom':
            startDate = customStart;
            endDate = customEnd;
            break;
        default:
            // Default to month if unknown
            startDate = formatDateToISO(getStartOfMonth(today));
    }

    return { startDate, endDate };
};
