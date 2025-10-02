/**
 * Calculation utilities for Media Flight Planner
 * Extracted from index.html - no logic changes
 */

// Enhanced rounding and calculation functions
export const roundToCents = (value) => {
    if (!value || isNaN(value)) return 0;
    return Math.round(parseFloat(value) * 100) / 100;
};

export const gracefulRound = (value) => {
    if (!value || isNaN(value)) return 0;
    return Math.round(parseFloat(value));
};

// Calculate impressions from budget
export const calculateImpressions = (budget, rate) => {
    if (!rate || rate <= 0) return 0;
    return Math.floor((budget / rate) * 1000);
};

// Calculate budget from impressions
export const calculateBudget = (impressions, rate) => {
    if (!rate || rate <= 0) return 0;
    return roundToCents((impressions * rate) / 1000);
};

// Calculate active days in a flight
export const getActiveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

// Calculate totals for table footer
export const calculateTotals = (flights, templateType) => {
    const totals = {
        budget: roundToCents(flights.reduce((sum, flight) => sum + flight.budget, 0))
    };

    if (templateType === 'programmatic') {
        totals.impressions = gracefulRound(flights.reduce((sum, flight) => sum + (flight.impressions || 0), 0));
        totals.trafficBudget = roundToCents(flights.reduce((sum, flight) => sum + (flight.trafficBudget || 0), 0));
        totals.trafficImpressions = gracefulRound(flights.reduce((sum, flight) => sum + (flight.trafficImpressions || 0), 0));
    } else if (templateType === 'youtube') {
        totals.totalViews = gracefulRound(flights.reduce((sum, flight) => sum + (flight.totalViews || 0), 0));
        totals.totalRetail = roundToCents(flights.reduce((sum, flight) => sum + (flight.totalRetail || 0), 0));
    }

    return totals;
};

// Calculate budget status for validation (original vs current)
export const calculateBudgetStatus = (campaign) => {
    if (!campaign || !campaign.flights) {
        return { isValid: false, difference: 0, totalBudget: 0, originalBudget: 0 };
    }

    const totalBudget = campaign.flights.reduce((sum, flight) => sum + flight.budget, 0);
    const originalBudget = parseFloat(campaign.formData.totalBudget) || 0;
    const difference = totalBudget - originalBudget;
    const isValid = Math.abs(difference) < 0.01; // Within 1 cent

    return {
        isValid,
        difference: roundToCents(difference),
        totalBudget: roundToCents(totalBudget),
        originalBudget: roundToCents(originalBudget)
    };
};
