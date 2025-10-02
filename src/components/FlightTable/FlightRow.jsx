/**
 * FlightRow Component
 *
 * Renders a single flight row with appropriate cells based on template type
 * Combines all cell components into a complete row
 *
 * Props:
 * - flight: object - Flight data
 * - templateType: 'sem-social' | 'programmatic' | 'youtube'
 * - campaignIndex: number - Index of campaign in campaigns array
 * - isCollapsed: boolean - Whether parent is collapsed
 * - isSelected: boolean - Whether row is selected
 * - onUpdateFlight: (campaignIndex, flightId, field, value) => void
 * - onSplitFlight: (campaignIndex, flightId) => void
 * - onLockFlight: (campaignIndex, flightId) => void
 * - onZeroOutFlight: (campaignIndex, flightId) => void
 * - onToggleCollapse: (parentId) => void
 * - onToggleSelect: (flightId) => void
 */

import React from 'react';
import { TEMPLATE_TYPES, tableStyles } from '../../utils/constants';
import { LineCell } from '../TableCells/LineCell';
import { DateCell } from '../TableCells/DateCell';
import { BudgetCell } from '../TableCells/BudgetCell';
import { NumberCell } from '../TableCells/NumberCell';
import { DerivedCell } from '../TableCells/DerivedCell';
import { ActionsCell } from '../TableCells/ActionsCell';

export function FlightRow({
  flight,
  templateType,
  campaignIndex,
  isCollapsed = false,
  isSelected = false,
  onUpdateFlight,
  onSplitFlight,
  onLockFlight,
  onZeroOutFlight,
  onToggleCollapse,
  onToggleSelect
}) {
  // Row classes based on flight state
  const rowClasses = [
    tableStyles.row,
    flight.isChild ? tableStyles.rowChild : '',
    flight.locked === 'all' ? 'bg-gray-100 opacity-60' : ''
  ].filter(Boolean).join(' ');

  // Handler for budget updates
  const handleBudgetCommit = (newValue) => {
    onUpdateFlight(campaignIndex, flight.id, 'budget', newValue);
  };

  // Handler for impressions/views updates
  const handleNumberCommit = (field) => (newValue) => {
    onUpdateFlight(campaignIndex, flight.id, field, newValue);
  };

  // Render cells based on template type
  const renderCells = () => {
    switch (templateType) {
      case TEMPLATE_TYPES.SEM_SOCIAL:
        return (
          <>
            <LineCell
              flight={flight}
              isCollapsed={isCollapsed}
              isSelected={isSelected}
              onToggleCollapse={onToggleCollapse}
              onToggleSelect={onToggleSelect}
            />
            <DateCell
              startDate={flight.startDate}
              endDate={flight.endDate}
            />
            <td className={tableStyles.td}>
              <BudgetCell
                value={flight.budget}
                onCommit={handleBudgetCommit}
                locked={flight.locked === 'all' || flight.locked === 'budget'}
                selected={isSelected}
              />
            </td>
            <ActionsCell
              flight={flight}
              onSplit={() => onSplitFlight(campaignIndex, flight.id)}
              onLock={() => onLockFlight(campaignIndex, flight.id)}
              onZeroOut={() => onZeroOutFlight(campaignIndex, flight.id)}
            />
          </>
        );

      case TEMPLATE_TYPES.PROGRAMMATIC:
        return (
          <>
            <LineCell
              flight={flight}
              isCollapsed={isCollapsed}
              isSelected={isSelected}
              onToggleCollapse={onToggleCollapse}
              onToggleSelect={onToggleSelect}
            />
            <DateCell
              startDate={flight.startDate}
              endDate={flight.endDate}
            />
            <td className={tableStyles.td}>
              <BudgetCell
                value={flight.budget}
                onCommit={handleBudgetCommit}
                locked={flight.locked === 'all' || flight.locked === 'budget'}
                selected={isSelected}
              />
            </td>
            <td className={tableStyles.td}>
              <NumberCell
                value={flight.impressions}
                onCommit={handleNumberCommit('impressions')}
                locked={flight.locked === 'all' || flight.locked === 'impressions'}
                selected={isSelected}
                label="impressions"
              />
            </td>
            <DerivedCell
              value={flight.trafficBudget}
              type="currency"
              locked={flight.locked === 'all'}
              selected={isSelected}
            />
            <DerivedCell
              value={flight.trafficImpressions}
              type="number"
              locked={flight.locked === 'all'}
              selected={isSelected}
            />
            <ActionsCell
              flight={flight}
              onSplit={() => onSplitFlight(campaignIndex, flight.id)}
              onLock={() => onLockFlight(campaignIndex, flight.id)}
              onZeroOut={() => onZeroOutFlight(campaignIndex, flight.id)}
            />
          </>
        );

      case TEMPLATE_TYPES.YOUTUBE:
        return (
          <>
            <LineCell
              flight={flight}
              isCollapsed={isCollapsed}
              isSelected={isSelected}
              onToggleCollapse={onToggleCollapse}
              onToggleSelect={onToggleSelect}
            />
            <DateCell
              startDate={flight.startDate}
              endDate={flight.endDate}
            />
            <td className={tableStyles.td}>
              <NumberCell
                value={flight.totalViews || flight.views}
                onCommit={handleNumberCommit('totalViews')}
                locked={flight.locked === 'all'}
                selected={isSelected}
                label="total views"
              />
            </td>
            <DerivedCell
              value={flight.daysInFlight}
              type="integer"
              locked={flight.locked === 'all'}
              selected={isSelected}
            />
            <DerivedCell
              value={flight.dailyViews}
              type="integer"
              locked={flight.locked === 'all'}
              selected={isSelected}
            />
            <DerivedCell
              value={flight.dailyPlatformBudget}
              type="currency"
              locked={flight.locked === 'all'}
              selected={isSelected}
            />
            <DerivedCell
              value={flight.totalRetail}
              type="currency"
              locked={flight.locked === 'all'}
              selected={isSelected}
            />
            <ActionsCell
              flight={flight}
              onSplit={() => onSplitFlight(campaignIndex, flight.id)}
              onLock={() => onLockFlight(campaignIndex, flight.id)}
              onZeroOut={() => onZeroOutFlight(campaignIndex, flight.id)}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <tr className={rowClasses}>
      {renderCells()}
    </tr>
  );
}
