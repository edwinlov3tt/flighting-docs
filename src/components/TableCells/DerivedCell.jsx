/**
 * DerivedCell Component
 *
 * Displays calculated/derived values (read-only by default)
 * Used for: traffic budget, traffic impressions, daily budget, total retail, etc.
 *
 * These values are calculated from other fields and typically not directly editable
 *
 * Props:
 * - value: number - The derived value to display
 * - type: 'currency' | 'number' | 'integer' - How to format the value
 * - locked: boolean - Whether the field is locked (visual indicator)
 * - selected: boolean - Whether row is selected (for multi-select)
 * - editable: boolean - Whether to allow editing (default: false)
 * - onCommit: (value) => void - Called if editable and value changes
 */

import React from 'react';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { tableStyles } from '../../utils/constants';

export function DerivedCell({
  value,
  type = 'number',
  locked = false,
  selected = false,
  editable = false,
  onCommit
}) {
  // Format value based on type
  const formattedValue = formatValue(value, type);

  // Determine background color
  const bgClass = locked
    ? tableStyles.inputLocked
    : selected
      ? 'bg-blue-50'
      : '';

  return (
    <td className={`${tableStyles.td} ${bgClass}`}>
      {editable ? (
        // TODO: Add edit functionality if needed in future
        <span className="px-2 py-1">{formattedValue}</span>
      ) : (
        <span className="px-2 py-1">{formattedValue}</span>
      )}
    </td>
  );
}

/**
 * Format value based on type
 */
function formatValue(value, type) {
  if (value === null || value === undefined || value === '') {
    return type === 'currency' ? '$0.00' : '0';
  }

  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'number':
      return formatNumber(value);
    case 'integer':
      return formatNumber(Math.floor(value));
    default:
      return String(value);
  }
}
