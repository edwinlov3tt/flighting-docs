/**
 * useCampaigns Hook
 *
 * Manages campaign state and operations
 * Handles flight generation, updates, splitting, locking, etc.
 *
 * Returns:
 * - campaigns: array - All campaigns
 * - addCampaign: (campaign) => void
 * - updateCampaignName: (index, name) => void
 * - deleteCampaign: (index) => void
 * - updateFlightValue: (campaignIndex, flightId, field, value) => void
 * - splitFlight: (campaignIndex, flightId) => void
 * - toggleFlightLock: (campaignIndex, flightId) => void
 * - zeroOutFlight: (campaignIndex, flightId) => void
 */

import { useState, useRef } from 'react';
import { roundToCents, gracefulRound, calculateImpressions } from '../utils/calculations';
import { formatDateForInput } from '../utils/formatters';

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lockToggleTimeoutRef = useRef(null);
  const skipHistoryRef = useRef(false);

  // Wrap setCampaigns to track history
  const setCampaignsWithHistory = (updater) => {
    setCampaigns(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;

      // Save to history unless we're undoing/redoing
      if (!skipHistoryRef.current) {
        setHistory(currentHistory => {
          setHistoryIndex(currentIndex => {
            const newHistory = currentHistory.slice(0, currentIndex + 1);
            newHistory.push(JSON.parse(JSON.stringify(newState)));

            // Limit history to 50 states
            if (newHistory.length > 50) {
              newHistory.shift();
              return Math.min(currentIndex, 49);
            }
            return currentIndex + 1;
          });

          const newHistory = currentHistory.slice(0, historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newState)));

          if (newHistory.length > 50) {
            newHistory.shift();
          }
          return newHistory;
        });
      }

      return newState;
    });
  };

  // Undo
  const undo = () => {
    if (historyIndex > 0 && history[historyIndex - 1]) {
      skipHistoryRef.current = true;
      const prevState = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCampaigns(JSON.parse(JSON.stringify(prevState)));
      setTimeout(() => { skipHistoryRef.current = false; }, 0);
    }
  };

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1 && history[historyIndex + 1]) {
      skipHistoryRef.current = true;
      const nextState = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setCampaigns(JSON.parse(JSON.stringify(nextState)));
      setTimeout(() => { skipHistoryRef.current = false; }, 0);
    }
  };

  const canUndo = historyIndex > 0 && history.length > 0;
  const canRedo = historyIndex < history.length - 1 && history.length > 0;
  const hasHistory = history.length > 0;

  // Add new campaign
  const addCampaign = (campaign) => {
    setCampaignsWithHistory(prev => [...prev, campaign]);
  };

  // Update campaign name
  const updateCampaignName = (campaignIndex, newName) => {
    setCampaignsWithHistory(prev => {
      const updated = [...prev];
      updated[campaignIndex].name = newName;
      return updated;
    });
  };

  // Delete campaign
  const deleteCampaign = (campaignIndex) => {
    setCampaigns(prev => prev.filter((_, index) => index !== campaignIndex));
  };

  // Update individual flight value with recalculation
  const updateFlightValue = (campaignIndex, flightId, field, value) => {
    setCampaignsWithHistory(prev => {
      const updated = [...prev];
      const campaign = updated[campaignIndex];
      const flightIndex = campaign.flights.findIndex(f => f.id === flightId);

      if (flightIndex === -1) return updated;

      const flight = campaign.flights[flightIndex];
      if (flight.locked === 'all') return updated;

      const rate = parseFloat(campaign.formData.rate) || 0;

      if (field === 'budget' && flight.locked !== 'budget') {
        const budget = roundToCents(parseFloat(value) || 0);
        flight.budget = budget;

        if (rate > 0) {
          flight.impressions = calculateImpressions(budget, rate);
          if (campaign.templateType === 'programmatic') {
            flight.trafficBudget = roundToCents(budget * 1.01);
            flight.trafficImpressions = calculateImpressions(flight.trafficBudget, rate);
          }
        }
      } else if (field === 'impressions' && flight.locked !== 'impressions') {
        const impressions = gracefulRound(parseFloat(value) || 0);
        flight.impressions = impressions;

        if (rate > 0) {
          flight.budget = roundToCents((impressions * rate) / 1000);
          if (campaign.templateType === 'programmatic') {
            flight.trafficBudget = roundToCents(flight.budget * 1.01);
            flight.trafficImpressions = calculateImpressions(flight.trafficBudget, rate);
          }
        }
      } else if (field === 'totalViews') {
        const totalViews = gracefulRound(parseFloat(value) || 0);
        flight.totalViews = totalViews;

        if (campaign.templateType === 'youtube' && flight.daysInFlight) {
          flight.dailyViews = Math.round((totalViews / flight.daysInFlight) * 100) / 100;
          if (campaign.formData.metricType === 'CPV' && rate > 0) {
            flight.dailyPlatformBudget = flight.dailyViews * rate;
            flight.totalRetail = totalViews * rate;
          } else if (rate > 0) {
            flight.dailyPlatformBudget = flight.dailyViews * (rate / 1000);
            flight.totalRetail = totalViews * (rate / 1000);
          }
        }
      }

      return updated;
    });
  };

  // Split flight into two
  const splitFlight = (campaignIndex, flightId) => {
    setCampaignsWithHistory(prev => {
      const updated = [...prev];
      const campaign = updated[campaignIndex];
      const flightIndex = campaign.flights.findIndex(f => f.id === flightId);

      if (flightIndex !== -1) {
        const flight = campaign.flights[flightIndex];
        const startDate = new Date(flight.startDate);
        const endDate = new Date(flight.endDate);

        // Calculate midpoint
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const halfDays = Math.ceil(totalDays / 2);
        const midDate = new Date(startDate);
        midDate.setDate(startDate.getDate() + halfDays);

        // Split budget and other metrics in half
        const halfBudget = flight.budget / 2;
        const halfImpressions = Math.round((flight.impressions || 0) / 2);

        // Helper for date formatting
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Determine parent ID and line number behavior
        let parentId, firstFlightLine, firstFlightIsParent, firstFlightIsChild;

        if (flight.isParent || flight.isChild) {
          // Already part of a group - use existing parentId
          parentId = flight.parentId;
          firstFlightLine = flight.isParent ? flight.line : '-'; // Keep original line if parent, '-' if child
          firstFlightIsParent = flight.isParent; // Maintain parent status
          firstFlightIsChild = flight.isChild; // If splitting a child, first stays child
        } else {
          // Regular flight - create new parent group
          parentId = Date.now() + Math.random();
          firstFlightLine = flight.line; // Keep original line number
          firstFlightIsParent = true; // First flight becomes parent
          firstFlightIsChild = false;
        }

        // Create first flight
        const firstFlight = {
          ...flight,
          id: flight.isParent ? flight.id : Date.now() + Math.random(), // Keep parent ID if already parent
          isParent: firstFlightIsParent,
          isChild: firstFlightIsChild,
          parentId: parentId,
          line: firstFlightLine,
          endDate: formatDate(new Date(midDate.getTime() - 24 * 60 * 60 * 1000)),
          budget: halfBudget,
          impressions: halfImpressions,
          trafficBudget:
            campaign.templateType === 'programmatic' ? halfBudget * 1.01 : undefined,
          trafficImpressions:
            campaign.templateType === 'programmatic'
              ? gracefulRound(
                  (halfBudget * 1.01 / parseFloat(campaign.formData.rate)) * 1000
                )
              : undefined
        };

        // Create second flight (always a child with '-')
        const secondFlight = {
          ...flight,
          id: Date.now() + Math.random() + 1,
          isChild: true,
          isParent: false,
          parentId: parentId,
          line: '-',
          startDate: formatDate(midDate),
          budget: halfBudget,
          impressions: halfImpressions,
          trafficBudget:
            campaign.templateType === 'programmatic' ? halfBudget * 1.01 : undefined,
          trafficImpressions:
            campaign.templateType === 'programmatic'
              ? gracefulRound(
                  (halfBudget * 1.01 / parseFloat(campaign.formData.rate)) * 1000
                )
              : undefined
        };

        // Replace original flight with two new flights
        campaign.flights.splice(flightIndex, 1, firstFlight, secondFlight);
      }

      return updated;
    });
  };

  // Toggle flight lock (all/budget/impressions)
  const toggleFlightLock = (campaignIndex, flightId) => {
    // Debounce to prevent React Strict Mode double-firing
    const lockKey = `${campaignIndex}-${flightId}`;
    const now = Date.now();

    if (lockToggleTimeoutRef.current?.[lockKey] && now - lockToggleTimeoutRef.current[lockKey] < 100) {
      return; // Ignore rapid double-clicks within 100ms
    }

    if (!lockToggleTimeoutRef.current) {
      lockToggleTimeoutRef.current = {};
    }
    lockToggleTimeoutRef.current[lockKey] = now;

    setCampaignsWithHistory(prev => {
      const updated = [...prev];
      const campaign = { ...updated[campaignIndex] };
      const flights = [...campaign.flights];
      const flightIndex = flights.findIndex(f => f.id === flightId);

      if (flightIndex !== -1) {
        const flight = { ...flights[flightIndex] };

        // Toggle lock state
        if (flight.locked === 'all') {
          delete flight.locked;
        } else {
          flight.locked = 'all';
        }

        flights[flightIndex] = flight;
      }

      campaign.flights = flights;
      updated[campaignIndex] = campaign;
      return updated;
    });
  };

  // Reset campaign to original flights
  const resetCampaign = (campaignIndex) => {
    setCampaignsWithHistory(prev => {
      const updated = [...prev];
      const campaign = updated[campaignIndex];

      if (campaign && campaign.originalFlights) {
        updated[campaignIndex] = {
          ...campaign,
          flights: JSON.parse(JSON.stringify(campaign.originalFlights))
        };
      }

      return updated;
    });
  };

  // Zero out flight budget and lock it
  const zeroOutFlight = (campaignIndex, flightId) => {
    setCampaignsWithHistory(prev => {
      const updated = [...prev];
      const campaign = updated[campaignIndex];
      const flightIndex = campaign.flights.findIndex(f => f.id === flightId);

      if (flightIndex !== -1) {
        const flight = campaign.flights[flightIndex];
        flight.budget = 0;
        if (flight.impressions !== undefined) flight.impressions = 0;
        if (flight.trafficBudget !== undefined) flight.trafficBudget = 0;
        if (flight.trafficImpressions !== undefined) flight.trafficImpressions = 0;
        if (flight.totalViews !== undefined) flight.totalViews = 0;
        if (flight.dailyViews !== undefined) flight.dailyViews = 0;
        if (flight.dailyPlatformBudget !== undefined) flight.dailyPlatformBudget = 0;
        if (flight.totalRetail !== undefined) flight.totalRetail = 0;

        // Lock the flight to prevent budget redistribution to it
        flight.locked = 'all';
      }

      return updated;
    });
  };

  // Redistribute budget across flights
  const redistributeBudget = (campaignIndex, amount, method, selectedFlightIds = [], fromFlightId = null) => {
    setCampaignsWithHistory(prev => {
      const updated = [...prev];
      const campaign = updated[campaignIndex];

      // Determine target flights based on method
      let targetFlights = [];
      if (method === 'custom') {
        targetFlights = campaign.flights.filter(f => selectedFlightIds.includes(f.id));
      } else {
        // Include all unlocked flights except the source flight
        targetFlights = campaign.flights.filter(f =>
          f.id !== fromFlightId && !f.locked
        );
      }

      if (targetFlights.length === 0) return updated;

      const rate = parseFloat(campaign.formData.rate) || 0;

      if (method === 'weighted') {
        // Weight by active days
        const weights = targetFlights.map(f => {
          const start = new Date(f.startDate);
          const end = new Date(f.endDate);
          return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        });
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        targetFlights.forEach((flight, index) => {
          const weightedAmount = roundToCents((amount * weights[index]) / totalWeight);
          flight.budget += weightedAmount;

          if (rate > 0) {
            flight.impressions = calculateImpressions(flight.budget, rate);
            if (campaign.templateType === 'programmatic') {
              flight.trafficBudget = roundToCents(flight.budget * 1.01);
              flight.trafficImpressions = calculateImpressions(flight.trafficBudget, rate);
            }
          }
        });
      } else {
        // Even distribution
        const amountPerFlight = Math.floor((amount * 100) / targetFlights.length) / 100;
        let remainderCents = Math.round((amount * 100) % targetFlights.length);

        targetFlights.forEach((flight, index) => {
          flight.budget += amountPerFlight;
          if (index < remainderCents) {
            flight.budget += 0.01;
          }
          flight.budget = roundToCents(flight.budget);

          if (rate > 0) {
            flight.impressions = calculateImpressions(flight.budget, rate);
            if (campaign.templateType === 'programmatic') {
              flight.trafficBudget = roundToCents(flight.budget * 1.01);
              flight.trafficImpressions = calculateImpressions(flight.trafficBudget, rate);
            }
          }
        });
      }

      return updated;
    });
  };

  return {
    campaigns,
    addCampaign,
    updateCampaignName,
    deleteCampaign,
    updateFlightValue,
    splitFlight,
    toggleFlightLock,
    zeroOutFlight,
    redistributeBudget,
    resetCampaign,
    undo,
    redo,
    canUndo,
    canRedo,
    hasHistory
  };
}
