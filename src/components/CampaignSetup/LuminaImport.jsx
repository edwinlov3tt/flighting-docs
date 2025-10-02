/**
 * LuminaImport Component
 *
 * Import campaign data from Lumina order or line item links
 * Fetches data from API and populates form with tactic, dates, and budget
 *
 * Props:
 * - orderLink: string - Lumina URL input value
 * - isLoading: boolean - Loading state during import
 * - error: string - Error message if import failed
 * - onOrderLinkChange: (value) => void - Handle link input change
 * - onImport: () => void - Trigger import action
 */

import React from 'react';

export function LuminaImport({
  orderLink = '',
  isLoading = false,
  error = '',
  onOrderLinkChange,
  onImport
}) {
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-lg font-medium text-blue-900 mb-3">
        Import from Lumina
      </h3>

      <div>
        <label className="block text-sm font-medium text-blue-700 mb-2">
          Lumina Order or Line Item Link
        </label>

        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-3">
            <input
              type="url"
              value={orderLink}
              onChange={(e) => {
                onOrderLinkChange(e.target.value);
              }}
              placeholder="https://townsquarelumina.com/lumina/view/order/... or lineitem/..."
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="col-span-1">
            <button
              onClick={onImport}
              disabled={!orderLink || isLoading}
              className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                (!orderLink || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Loading...' : 'Import'}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm mt-1">{error}</p>
        )}
      </div>
    </div>
  );
}
