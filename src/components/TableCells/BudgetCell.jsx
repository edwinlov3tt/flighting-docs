/**
 * BudgetCell Component
 *
 * Editable budget cell with the CRITICAL FIX for typing bugs
 * Uses edit buffer pattern: string buffer while editing, parse only on blur/Enter
 *
 * Props:
 * - value: number - Current budget value
 * - onCommit: (newValue: number) => void - Called when value is committed
 * - locked: boolean - Whether the cell is locked
 * - selected: boolean - Whether the row is selected (for multi-select)
 */

import React from 'react';
import { useEditBuffer, parseToCents } from '../../hooks/useEditBuffer';
import { tableStyles } from '../../utils/constants';

export function BudgetCell({ value, onCommit, locked = false, selected = false }) {
  const { editing, buffer, setBuffer, start, commit, cancel, handleKeyDown } = useEditBuffer(
    value?.toFixed(2) || '0.00',
    onCommit,
    parseToCents // Round to cents on commit
  );

  // Determine background color based on state
  const bgClass = locked
    ? tableStyles.inputLocked
    : selected
      ? 'bg-blue-50'
      : '';

  if (editing) {
    return (
      <input
        type="text"
        inputMode="decimal"
        className={`${tableStyles.input} ${bgClass}`}
        value={buffer}
        autoFocus
        onChange={(e) => setBuffer(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        disabled={locked}
      />
    );
  }

  return (
    <button
      className={`w-full text-left px-2 py-1 rounded ${locked ? 'cursor-not-allowed' : 'hover:bg-gray-100'} ${bgClass}`}
      onClick={() => !locked && start(parseToCents(value))}
      disabled={locked}
      title={locked ? 'Locked' : 'Click to edit'}
    >
      ${value?.toFixed(2) || '0.00'}
    </button>
  );
}
