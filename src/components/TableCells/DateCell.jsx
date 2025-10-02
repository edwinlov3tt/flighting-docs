/**
 * DateCell Component
 *
 * Displays start and end dates (read-only for now)
 * Future enhancement: Click to edit with popover containing date inputs
 *
 * Props:
 * - startDate: string - Start date (YYYY-MM-DD format)
 * - endDate: string - End date (YYYY-MM-DD format)
 * - onCommit: (startDate, endDate) => void - Called when dates are updated (future)
 * - locked: boolean - Whether dates are locked
 */

import React from 'react';
import { formatDate } from '../../utils/formatters';

export function DateCell({ startDate, endDate, onCommit, locked = false }) {
  // For now, just display the dates
  // TODO: Add edit functionality with popover (Phase 4)

  return (
    <>
      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
        {formatDate(startDate)}
      </td>
      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
        {formatDate(endDate)}
      </td>
    </>
  );
}

/**
 * DateRangeCell Component (Alternative - Single Cell)
 *
 * Displays both dates in a single cell with a separator
 * Useful for condensed views
 */
export function DateRangeCell({ startDate, endDate, onCommit, locked = false }) {
  return (
    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
      {formatDate(startDate)} - {formatDate(endDate)}
    </td>
  );
}
