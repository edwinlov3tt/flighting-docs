/**
 * NumberCell Component
 *
 * Editable number cell for impressions/views (integers only)
 * Uses edit buffer pattern to prevent typing bugs
 *
 * Props:
 * - value: number - Current value
 * - onCommit: (newValue: number) => void - Called when value is committed
 * - locked: boolean - Whether the cell is locked
 * - selected: boolean - Whether the row is selected
 * - label: string - Accessibility label (e.g., "impressions", "views")
 */

import React from 'react';
import { useEditBuffer, parseToInteger } from '../../hooks/useEditBuffer';
import { tableStyles } from '../../utils/constants';
import { formatNumber } from '../../utils/formatters';

export function NumberCell({ value, onCommit, locked = false, selected = false, label = 'value' }) {
  const { editing, buffer, setBuffer, start, commit, cancel, handleKeyDown } = useEditBuffer(
    value?.toString() || '0',
    onCommit,
    parseToInteger // Parse to integer on commit
  );

  const bgClass = locked
    ? tableStyles.inputLocked
    : selected
      ? 'bg-blue-50'
      : '';

  if (editing) {
    return (
      <input
        type="text"
        inputMode="numeric"
        className={`${tableStyles.input} ${bgClass}`}
        value={buffer}
        autoFocus
        onChange={(e) => setBuffer(e.target.value.replace(/[^0-9]/g, ''))} // Only allow digits
        onBlur={commit}
        onKeyDown={handleKeyDown}
        disabled={locked}
        aria-label={`Edit ${label}`}
      />
    );
  }

  return (
    <button
      className={`w-full text-left px-2 py-1 rounded ${locked ? 'cursor-not-allowed' : 'hover:bg-gray-100'} ${bgClass}`}
      onClick={() => !locked && start(value)}
      disabled={locked}
      title={locked ? 'Locked' : 'Click to edit'}
      aria-label={`${label}: ${formatNumber(value || 0)}`}
    >
      {formatNumber(value || 0)}
    </button>
  );
}
