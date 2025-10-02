/**
 * useFlightGenerator Hook
 *
 * Handles flight generation logic including:
 * - Form state management
 * - Auto-calculation between budget/impressions/views
 * - Flight data generation from form inputs
 * - Validation
 *
 * Returns:
 * - formData: object - Current form state
 * - validationErrors: object - Field-level validation errors
 * - setFormData: function - Update form state
 * - handleBudgetChange: function - Budget change with auto-calc
 * - handleImpressionsChange: function - Impressions change with auto-calc
 * - handleViewsChange: function - Views change with auto-calc
 * - handleRateChange: function - Rate change with auto-calc
 * - generateFlights: function - Generate flight array from form data
 * - resetForm: function - Clear form state
 */

import { useState } from 'react';
import { gracefulRound, roundToCents } from '../utils/calculations';
import { getMonthsBetween } from '../utils/dateHelpers';
import { formatDateForInput } from '../utils/formatters';
import { getTemplateType, TEMPLATE_TYPES } from '../utils/constants';

export function useFlightGenerator(tacticData) {
  const [formData, setFormData] = useState({
    tactic: '',
    startDate: '',
    endDate: '',
    totalBudget: '',
    rate: '',
    totalImpressions: '',
    totalViews: '',
    metricType: 'CPM'
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Validate form inputs
  const validateInputs = () => {
    const errors = {};

    if (!formData.tactic) errors.tactic = 'Please select a tactic';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    if (!formData.endDate) errors.endDate = 'End date is required';
    if (!formData.totalBudget) errors.totalBudget = 'Total budget is required';
    if (!formData.rate) errors.rate = 'Rate is required';

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      errors.endDate = 'End date must be after start date';
    }

    if (formData.tactic && formData.metricType === 'CPV' && !formData.totalViews) {
      errors.totalViews = 'Total views required';
    } else if (formData.tactic && formData.metricType === 'CPM' && !formData.totalImpressions) {
      errors.totalImpressions = 'Total impressions required';
    }

    return errors;
  };

  // Handle budget change with auto-calculation
  const handleBudgetChange = (value) => {
    const budget = parseFloat(value) || 0;
    const rate = parseFloat(formData.rate) || 0;

    if (rate > 0) {
      let calculatedValue = 0;
      if (formData.metricType === 'CPM') {
        calculatedValue = Math.round((budget * 1000) / rate);
        setFormData(prev => ({
          ...prev,
          totalBudget: value,
          totalImpressions: calculatedValue.toString()
        }));
      } else if (formData.metricType === 'CPV') {
        calculatedValue = Math.round(budget / rate);
        setFormData(prev => ({
          ...prev,
          totalBudget: value,
          totalViews: calculatedValue.toString()
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, totalBudget: value }));
    }
  };

  // Handle impressions change with auto-calculation
  const handleImpressionsChange = (value) => {
    const impressions = parseFloat(value) || 0;
    const rate = parseFloat(formData.rate) || 0;

    if (rate > 0 && formData.metricType === 'CPM') {
      const calculatedBudget = ((impressions * rate) / 1000).toFixed(2);
      setFormData(prev => ({
        ...prev,
        totalImpressions: value,
        totalBudget: calculatedBudget
      }));
    } else {
      setFormData(prev => ({ ...prev, totalImpressions: value }));
    }
  };

  // Handle views change with auto-calculation
  const handleViewsChange = (value) => {
    const views = parseFloat(value) || 0;
    const rate = parseFloat(formData.rate) || 0;

    if (rate > 0 && formData.metricType === 'CPV') {
      const calculatedBudget = (views * rate).toFixed(2);
      setFormData(prev => ({
        ...prev,
        totalViews: value,
        totalBudget: calculatedBudget
      }));
    } else {
      setFormData(prev => ({ ...prev, totalViews: value }));
    }
  };

  // Handle rate change with recalculation
  const handleRateChange = (value) => {
    setFormData(prev => ({ ...prev, rate: value }));

    if (formData.totalBudget) {
      handleBudgetChange(formData.totalBudget);
    }
  };

  // Generate flights from form data
  const generateFlights = () => {
    const errors = validateInputs();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return null;
    }

    setValidationErrors({});

    const months = getMonthsBetween(formData.startDate, formData.endDate);
    const budgetPerMonth = parseFloat(formData.totalBudget) / months.length;

    const flightData = months.map((month, index) => {
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const flight = {
        id: Date.now() + index,
        line: index + 1,
        startDate: formatDateForInput(startDate),
        endDate: formatDateForInput(endDate),
        budget: budgetPerMonth
      };

      const templateType = getTemplateType(formData.tactic, tacticData);

      if (templateType === TEMPLATE_TYPES.PROGRAMMATIC) {
        const impressionsPerMonth = gracefulRound(parseFloat(formData.totalImpressions) / months.length);
        flight.impressions = impressionsPerMonth;
        flight.trafficBudget = budgetPerMonth * 1.01;
        flight.trafficImpressions = gracefulRound((flight.trafficBudget / parseFloat(formData.rate)) * 1000);
      } else if (templateType === TEMPLATE_TYPES.YOUTUBE) {
        const viewsPerMonth = gracefulRound(parseFloat(formData.totalViews || formData.totalImpressions) / months.length);
        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

        flight.totalViews = viewsPerMonth;
        flight.daysInFlight = daysInMonth;
        flight.dailyViews = Math.round((viewsPerMonth / daysInMonth) * 100) / 100;

        if (formData.metricType === 'CPV') {
          flight.dailyPlatformBudget = flight.dailyViews * parseFloat(formData.rate);
          flight.totalRetail = viewsPerMonth * parseFloat(formData.rate);
        } else {
          flight.dailyPlatformBudget = flight.dailyViews * (parseFloat(formData.rate) / 1000);
          flight.totalRetail = viewsPerMonth * (parseFloat(formData.rate) / 1000);
        }
      }

      return flight;
    });

    const newCampaign = {
      id: Date.now(),
      name: formData.tactic,
      templateType: getTemplateType(formData.tactic, tacticData),
      flights: flightData,
      formData: { ...formData },
      originalFlights: JSON.parse(JSON.stringify(flightData))
    };

    return newCampaign;
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      tactic: '',
      startDate: '',
      endDate: '',
      totalBudget: '',
      rate: '',
      totalImpressions: '',
      totalViews: '',
      metricType: 'CPM'
    });
    setValidationErrors({});
  };

  return {
    formData,
    validationErrors,
    setFormData,
    handleBudgetChange,
    handleImpressionsChange,
    handleViewsChange,
    handleRateChange,
    generateFlights,
    resetForm
  };
}
