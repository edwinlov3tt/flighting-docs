/**
 * LineCell Component
 *
 * Displays line number with collapse/expand icon for parent rows
 * Handles click to toggle collapse or enter multi-select mode
 *
 * Props:
 * - flight: object - Flight data with line, isParent, isChild, parentId
 * - isCollapsed: boolean - Whether parent is collapsed
 * - isSelected: boolean - Whether row is selected in multi-select
 * - onToggleCollapse: () => void - Called when parent collapse icon clicked
 * - onToggleSelect: () => void - Called when line number clicked for selection
 */

import React from 'react';

export function LineCell({
  flight,
  isCollapsed = false,
  isSelected = false,
  onToggleCollapse,
  onToggleSelect
}) {
  const isClickable = flight.isParent || (flight.line !== '-' && !flight.isChild);

  const handleClick = (e) => {
    if (flight.isParent) {
      onToggleCollapse?.();
    } else if (flight.line !== '-' && !flight.isChild) {
      onToggleSelect?.(e.shiftKey);
    }
  };

  const cellClasses = [
    'border border-gray-200 px-4 py-3 text-sm text-gray-900 text-center',
    isClickable ? 'cursor-pointer hover:bg-blue-100' : '',
    isSelected ? 'bg-blue-200' : ''
  ].filter(Boolean).join(' ');

  return (
    <td className={cellClasses} onClick={handleClick}>
      <div className="flex items-center justify-center space-x-1">
        {flight.isParent && (
          <svg
            className={`w-3 h-3 transform transition-transform ${
              isCollapsed ? 'rotate-0' : 'rotate-90'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span>{flight.line}</span>
      </div>
    </td>
  );
}
