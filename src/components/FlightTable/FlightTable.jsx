/**
 * FlightTable Component
 *
 * Main table component that combines header, body, and footer
 * Wrapper for the complete flight table with all interactions
 *
 * Props:
 * - campaign: object - Campaign with flights array
 * - campaignIndex: number - Index in campaigns array
 * - templateType: 'sem-social' | 'programmatic' | 'youtube'
 * - totals: object - Calculated totals for footer
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
import { FlightTableHeader } from './FlightTableHeader';
import { FlightTableBody } from './FlightTableBody';
import { FlightTableFooter } from './FlightTableFooter';

export function FlightTable({
  campaign,
  campaignIndex,
  templateType,
  totals,
  collapsedFlights = new Set(),
  selectedFlights = new Set(),
  onUpdateFlight,
  onSplitFlight,
  onLockFlight,
  onZeroOutFlight,
  onToggleCollapse,
  onToggleSelect
}) {
  return (
    <div>
      <table className="w-full table-fixed bg-white border border-gray-200">
        <FlightTableHeader templateType={templateType} />
        <FlightTableBody
          flights={campaign.flights}
          templateType={templateType}
          campaignIndex={campaignIndex}
          collapsedFlights={collapsedFlights}
          selectedFlights={selectedFlights}
          onUpdateFlight={onUpdateFlight}
          onSplitFlight={onSplitFlight}
          onLockFlight={onLockFlight}
          onZeroOutFlight={onZeroOutFlight}
          onToggleCollapse={onToggleCollapse}
          onToggleSelect={onToggleSelect}
        />
        <FlightTableFooter totals={totals} templateType={templateType} />
      </table>
    </div>
  );
}
