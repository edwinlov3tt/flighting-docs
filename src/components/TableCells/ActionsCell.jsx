/**
 * ActionsCell Component
 *
 * Displays action buttons for flight rows:
 * - Split: Split flight into two periods
 * - Lock: Lock/unlock fields (budget, impressions, or all)
 * - Zero Out: Set budget to zero and redistribute
 *
 * Props:
 * - flight: object - Flight data with lock state
 * - onSplit: () => void - Called when Split clicked
 * - onLock: () => void - Called when Lock clicked
 * - onZeroOut: () => void - Called when Zero Out clicked
 * - disabled: boolean - Disable all actions
 */

import React from 'react';
import { tableStyles } from '../../utils/constants';

export function ActionsCell({
  flight,
  onSplit,
  onLock,
  onZeroOut,
  disabled = false
}) {
  const isLocked = flight.locked === 'all';

  const getLockTitle = () => {
    if (flight.locked === 'all') {
      return 'Unlock All';
    } else if (flight.locked === 'budget') {
      return 'Locked: Budget';
    } else if (flight.locked === 'impressions') {
      return 'Locked: Impressions';
    }
    return 'Lock All';
  };

  return (
    <td className="border border-gray-200 px-4 py-3">
      <div className="flex space-x-1">
        {/* Lock Button */}
        <button
          onClick={onLock}
          className={`${tableStyles.button} ${
            isLocked ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } transition-all duration-200`}
          title={getLockTitle()}
          disabled={disabled}
        >
          {isLocked ? (
            <svg
              className="w-4 h-4 animate-pulse"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"
              />
            </svg>
          )}
        </button>

        {/* Split Button */}
        <button
          onClick={onSplit}
          className={`${tableStyles.button} ${tableStyles.buttonPrimary}`}
          title="Split Flight"
          disabled={disabled}
        >
          Split
        </button>

        {/* Zero Out Button */}
        <button
          onClick={onZeroOut}
          className={`${tableStyles.button} ${tableStyles.buttonDanger}`}
          title="Zero Out"
          disabled={disabled}
        >
          Zero
        </button>
      </div>
    </td>
  );
}

/**
 * BulkActionsToolbar Component
 *
 * Appears when multiple flights are selected
 * Provides bulk actions: Lock All, Lock Budget, Lock Impressions, etc.
 */
export function BulkActionsToolbar({
  selectedCount,
  onLockAll,
  onLockBudget,
  onLockImpressions,
  onUnlockAll,
  onClearSelection
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-20 bg-blue-100 border-b-2 border-blue-300 px-4 py-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blue-900">
          {selectedCount} flight{selectedCount > 1 ? 's' : ''} selected
        </span>
        <div className="flex space-x-2">
          <button
            onClick={onLockAll}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔒 Lock All
          </button>
          <button
            onClick={onLockBudget}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Lock Budget
          </button>
          <button
            onClick={onLockImpressions}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Lock Impressions
          </button>
          <button
            onClick={onUnlockAll}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            🔓 Unlock All
          </button>
          <button
            onClick={onClearSelection}
            className="px-3 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
