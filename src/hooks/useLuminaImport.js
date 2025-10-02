/**
 * useLuminaImport Hook
 *
 * Manages Lumina order/lineitem import functionality
 * Handles API fetching, tactic parsing, and campaign generation
 *
 * Returns:
 * - orderLink: string - Current order link input
 * - setOrderLink: function - Update order link
 * - loading: boolean - Loading state
 * - error: string - Error message
 * - tactics: array - Parsed tactics from Lumina
 * - selectedTacticIds: array - IDs of selected tactics
 * - showTactics: boolean - Whether to show tactics selector
 * - handleImport: function - Trigger import
 * - toggleTacticSelection: function - Toggle tactic selection
 * - generateCampaigns: function - Generate campaigns from selected tactics
 * - clearImport: function - Clear import state
 */

import { useState } from 'react';
import {
  extractLuminaInfo,
  fetchLuminaData,
  processLuminaData,
  getTemplateTypeFromLuminaTactic
} from '../utils/luminaHelpers';
import { getMonthsBetween } from '../utils/dateHelpers';
import { parseDate } from '../utils/dateHelpers';
import { formatDateForInput } from '../utils/formatters';
import { gracefulRound } from '../utils/calculations';

export function useLuminaImport() {
  const [orderLink, setOrderLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tactics, setTactics] = useState([]);
  const [selectedTacticIds, setSelectedTacticIds] = useState([]);
  const [showTactics, setShowTactics] = useState(false);

  // Handle import from Lumina
  const handleImport = async () => {
    const luminaInfo = extractLuminaInfo(orderLink);
    if (!luminaInfo.id) {
      setError('Invalid Lumina link format. Please use an order or lineitem URL.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const luminaData = await fetchLuminaData(luminaInfo.id, luminaInfo.type);
      const parsedTactics = processLuminaData(luminaData);

      if (parsedTactics.length === 0) {
        setError('No valid tactics found in this order/lineitem.');
        return;
      }

      setTactics(parsedTactics);
      setSelectedTacticIds(parsedTactics.map(t => t.id));
      setShowTactics(true);
    } catch (err) {
      setError(err.message || 'Failed to import from Lumina');
    } finally {
      setLoading(false);
    }
  };

  // Toggle tactic selection
  const toggleTacticSelection = (tacticId) => {
    setSelectedTacticIds(prev =>
      prev.includes(tacticId)
        ? prev.filter(id => id !== tacticId)
        : [...prev, tacticId]
    );
  };

  // Update tactic name type
  const updateTacticNameType = (tacticId, nameType) => {
    setTactics(prev => prev.map(tactic =>
      tactic.id === tacticId
        ? { ...tactic, nameType }
        : tactic
    ));
  };

  // Get the effective name for a tactic based on its nameType
  const getTacticName = (tactic) => {
    const nameType = tactic.nameType || 'displayName';
    return nameType === 'campaignInitiative' && tactic.campaignInitiative
      ? tactic.campaignInitiative
      : tactic.displayName;
  };

  // Generate campaigns from selected tactics
  const generateCampaigns = () => {
    const selectedTactics = tactics.filter(tactic =>
      selectedTacticIds.includes(tactic.id)
    );

    const newCampaigns = selectedTactics.map(tactic => {
      const templateType = getTemplateTypeFromLuminaTactic(tactic);

      const months = getMonthsBetween(tactic.startDate, tactic.endDate);
      const budgetPerMonth = tactic.totalBudget / months.length;

      const flightData = months.map((month, index) => {
        // Preserve original Lumina dates for first and last flights
        let startDate, endDate;

        if (index === 0) {
          // First flight: use original Lumina start date
          startDate = parseDate(tactic.startDate);
        } else {
          // Subsequent flights: use first of month
          startDate = new Date(month.getFullYear(), month.getMonth(), 1);
        }

        if (index === months.length - 1) {
          // Last flight: use original Lumina end date
          endDate = parseDate(tactic.endDate);
        } else {
          // Other flights: use last day of month
          endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        }

        const flight = {
          id: Date.now() + index + Math.random(),
          line: index + 1,
          startDate: formatDateForInput(startDate),
          endDate: formatDateForInput(endDate),
          budget: budgetPerMonth
        };

        if (templateType === 'programmatic') {
          const impressionsPerMonth = gracefulRound(tactic.contractedImpressions / months.length);
          flight.impressions = impressionsPerMonth;
          flight.trafficBudget = budgetPerMonth * 1.01;
          flight.trafficImpressions = gracefulRound((flight.trafficBudget / (tactic.cpm || 10)) * 1000);
        } else if (templateType === 'youtube') {
          const viewsPerMonth = gracefulRound(tactic.contractedKpiGoal / months.length);
          const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

          flight.totalViews = viewsPerMonth;
          flight.daysInFlight = daysInMonth;
          flight.dailyViews = Math.round((viewsPerMonth / daysInMonth) * 100) / 100;
          flight.dailyPlatformBudget = flight.dailyViews * (tactic.cpm || 0.05);
          flight.totalRetail = viewsPerMonth * (tactic.cpm || 0.05);
        }

        return flight;
      });

      const tacticName = getTacticName(tactic);

      return {
        id: Date.now() + Math.random(),
        name: tacticName,
        templateType: templateType,
        flights: flightData,
        formData: {
          tactic: tacticName,
          startDate: tactic.startDate,
          endDate: tactic.endDate,
          totalBudget: tactic.totalBudget.toString(),
          totalImpressions: tactic.contractedImpressions.toString(),
          totalViews: tactic.contractedKpiGoal.toString(),
          rate: tactic.cpm.toString(),
          metricType: tactic.kpi
        },
        originalFlights: JSON.parse(JSON.stringify(flightData)),
        luminaTactic: tactic // Store original tactic data for later reference
      };
    });

    return newCampaigns;
  };

  // Clear import state
  const clearImport = () => {
    setOrderLink('');
    setError('');
    setTactics([]);
    setSelectedTacticIds([]);
    setShowTactics(false);
  };

  return {
    orderLink,
    setOrderLink,
    loading,
    error,
    tactics,
    selectedTacticIds,
    showTactics,
    handleImport,
    toggleTacticSelection,
    updateTacticNameType,
    generateCampaigns,
    clearImport
  };
}
