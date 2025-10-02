/**
 * BudgetRedistributionModal Component
 *
 * Modal for redistributing budget from zeroed flights or budget discrepancies
 * Supports three distribution methods:
 * - Even: Distribute equally across unlocked flights
 * - Weighted: Distribute based on active days in each flight
 * - Custom: User selects specific flights
 *
 * Props:
 * - isOpen: boolean - Whether modal is visible
 * - amount: number - Amount to redistribute
 * - flights: array - All flights in campaign
 * - fromFlightId: string - Source flight ID (null if from footer)
 * - onClose: () => void - Close modal
 * - onRedistribute: (method, selectedFlightIds) => void - Execute redistribution
 */

import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatters';

export function BudgetRedistributionModal({
  isOpen,
  amount,
  flights = [],
  fromFlightId = null,
  onClose,
  onRedistribute
}) {
  const [method, setMethod] = useState('even');
  const [selectedFlightIds, setSelectedFlightIds] = useState([]);

  // Get eligible flights (unlocked and not the source flight)
  const eligibleFlights = flights.filter(
    f => f.id !== fromFlightId && !f.locked
  );

  // Pre-select all eligible flights for custom method
  useEffect(() => {
    if (isOpen) {
      setSelectedFlightIds(eligibleFlights.map(f => f.id));
    }
  }, [isOpen]);

  const handleToggleFlight = (flightId) => {
    setSelectedFlightIds(prev =>
      prev.includes(flightId)
        ? prev.filter(id => id !== flightId)
        : [...prev, flightId]
    );
  };

  const handleRedistribute = () => {
    onRedistribute(method, selectedFlightIds);
  };

  const isRedistributeDisabled = method === 'custom' && selectedFlightIds.length === 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Redistribute ${amount.toLocaleString()}
        </h3>

        <div className="space-y-4">
          {/* Distribution Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distribution Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="even"
                  checked={method === 'even'}
                  onChange={(e) => setMethod(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Even distribution across unlocked flights</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  value="weighted"
                  checked={method === 'weighted'}
                  onChange={(e) => setMethod(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Weighted by active days in each flight</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  value="custom"
                  checked={method === 'custom'}
                  onChange={(e) => setMethod(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Custom selection</span>
              </label>
            </div>
          </div>

          {/* Custom Flight Selection */}
          {method === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Target Flights
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {eligibleFlights.map(flight => (
                  <label
                    key={flight.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFlightIds.includes(flight.id)}
                      onChange={() => handleToggleFlight(flight.id)}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      Line {flight.line}: {formatDate(flight.startDate)} - {formatDate(flight.endDate)}
                      {' '}(${flight.budget.toLocaleString()})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Skip
          </button>
          <button
            onClick={handleRedistribute}
            disabled={isRedistributeDisabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Redistribute
          </button>
        </div>
      </div>
    </div>
  );
}
