/**
 * FlightTableBody Component
 *
 * Renders table body with all flight rows for a campaign
 * Handles collapse state for parent/child relationships
 *
 * Props:
 * - flights: array - Array of flight objects
 * - templateType: 'sem-social' | 'programmatic' | 'youtube'
 * - campaignIndex: number - Index of campaign in campaigns array
 * - collapsedFlights: Set - Set of collapsed parent flight IDs
 * - selectedFlights: Set - Set of selected flight IDs
 * - onUpdateFlight: (campaignIndex, flightId, field, value) => void
 * - onSplitFlight: (campaignIndex, flightId) => void
 * - onLockFlight: (campaignIndex, flightId) => void
 * - onZeroOutFlight: (campaignIndex, flightId) => void
 * - onToggleCollapse: (flightId) => void
 * - onToggleSelect: (flightId) => void
 */

import React from 'react';
import { FlightRow } from './FlightRow';

export function FlightTableBody({
  flights,
  templateType,
  campaignIndex,
  collapsedFlights = new Set(),
  selectedFlights = new Set(),
  onUpdateFlight,
  onSplitFlight,
  onLockFlight,
  onZeroOutFlight,
  onToggleCollapse,
  onToggleSelect
}) {
  // Filter out child flights if parent is collapsed
  const visibleFlights = flights.filter(flight => {
    if (!flight.isChild) return true;
    return !collapsedFlights.has(flight.parentId);
  });

  return (
    <tbody>
      {visibleFlights.map((flight) => (
        <FlightRow
          key={flight.id}
          flight={flight}
          templateType={templateType}
          campaignIndex={campaignIndex}
          isCollapsed={flight.isParent && collapsedFlights.has(flight.id)}
          isSelected={selectedFlights.has(flight.id)}
          onUpdateFlight={onUpdateFlight}
          onSplitFlight={onSplitFlight}
          onLockFlight={onLockFlight}
          onZeroOutFlight={onZeroOutFlight}
          onToggleCollapse={() => onToggleCollapse(flight.id)}
          onToggleSelect={(shiftKey) => onToggleSelect(flight.id, shiftKey)}
        />
      ))}
    </tbody>
  );
}
