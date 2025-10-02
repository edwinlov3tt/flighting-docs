/**
 * TacticSelector Component
 *
 * Searchable dropdown for selecting media tactics
 * Displays tactics with category, product, subProduct, rate, and KPI
 *
 * Props:
 * - tactics: array - Available tactics from API or defaults
 * - searchTerm: string - Current search input
 * - showDropdown: boolean - Whether dropdown is visible
 * - isLoading: boolean - Loading state for tactics fetch
 * - error: string - Error message if tactics fetch failed
 * - validationError: string - Validation error for tactic field
 * - onSearchChange: (value) => void - Handle search input change
 * - onTacticSelect: (tactic) => void - Handle tactic selection
 * - onDropdownToggle: (show) => void - Toggle dropdown visibility
 * - dropdownRef: ref - Ref for click-outside detection
 */

import React, { useMemo } from 'react';

export function TacticSelector({
  tactics = [],
  searchTerm = '',
  showDropdown = false,
  isLoading = false,
  error = '',
  validationError = '',
  onSearchChange,
  onTacticSelect,
  onDropdownToggle,
  dropdownRef
}) {
  // Filter tactics based on search term
  const filteredTactics = useMemo(() => {
    if (!searchTerm) return tactics;

    const lowerSearch = searchTerm.toLowerCase();
    return tactics.filter(tactic =>
      tactic.product?.toLowerCase().includes(lowerSearch) ||
      tactic.subProduct?.toLowerCase().includes(lowerSearch) ||
      tactic.category?.toLowerCase().includes(lowerSearch) ||
      tactic.kpi?.toLowerCase().includes(lowerSearch)
    );
  }, [tactics, searchTerm]);

  return (
    <div>
      {/* Error notification if tactics failed to load */}
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-yellow-800">{error}</span>
        </div>
      )}

      {/* Tactic Search/Dropdown */}
      <div className="relative md:col-span-2 lg:col-span-1 mb-6" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tactic *
        </label>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onDropdownToggle(true);
            }}
            onFocus={() => onDropdownToggle(true)}
            placeholder="Search tactics..."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              validationError ? 'border-red-500' : 'border-gray-300'
            }`}
          />

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Loading tactics...</div>
              ) : filteredTactics.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No matching tactics found</div>
              ) : (
                filteredTactics.map((tactic, index) => (
                  <button
                    key={index}
                    onClick={() => onTacticSelect(tactic)}
                    className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  >
                    <div className="font-medium text-gray-900">
                      {tactic.product} - {tactic.subProduct}
                    </div>
                    <div className="text-sm text-gray-500">
                      {tactic.category} • {tactic.rate} {tactic.kpi}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {validationError && (
          <p className="text-red-500 text-sm mt-1">{validationError}</p>
        )}
      </div>
    </div>
  );
}
