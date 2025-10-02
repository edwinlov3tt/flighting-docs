/**
 * LuminaTacticsModal Component
 *
 * Modal for selecting which tactics from Lumina import to create as campaigns
 * Shows all tactics from order/lineitem in a table with checkboxes
 *
 * Props:
 * - isOpen: boolean - Whether modal is visible
 * - tactics: array - Parsed tactics from Lumina
 * - selectedIds: array - IDs of selected tactics
 * - onToggleSelect: (tacticId) => void - Toggle tactic selection
 * - onGenerate: () => void - Generate campaigns from selected
 * - onClose: () => void - Close modal
 */

import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export function LuminaTacticsModal({
  isOpen,
  tactics = [],
  selectedIds = [],
  onToggleSelect,
  onGenerate,
  onClose
}) {
  if (!isOpen) return null;

  const isGenerateDisabled = selectedIds.length === 0;

  // Toggle all checkboxes
  const handleSelectAll = (checked) => {
    if (checked) {
      tactics.forEach(tactic => {
        if (!selectedIds.includes(tactic.id)) {
          onToggleSelect(tactic.id);
        }
      });
    } else {
      tactics.forEach(tactic => {
        if (selectedIds.includes(tactic.id)) {
          onToggleSelect(tactic.id);
        }
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Select Order Tactics</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Found {tactics.length} tactic(s) in the order. Select which ones to generate flight plans for:
        </p>

        {/* Tactics Table */}
        {tactics.length > 0 && (
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === tactics.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Status
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Tactic
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Start Date
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                    End Date
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Budget
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                    KPI Goal
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                    CPM
                  </th>
                </tr>
              </thead>
              <tbody>
                {tactics.map((tactic) => (
                  <tr
                    key={tactic.id}
                    className={`hover:bg-gray-50 ${
                      selectedIds.includes(tactic.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="border border-gray-200 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(tactic.id)}
                        onChange={() => onToggleSelect(tactic.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          tactic.status === 'Live' ? 'bg-green-100 text-green-800' :
                          tactic.status === 'Complete' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tactic.status}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm font-medium">
                      <div>{tactic.displayName}</div>
                      <div className="text-xs text-gray-500">
                        {tactic.product}{tactic.subProduct ? ` - ${tactic.subProduct}` : ''}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                      {formatDate(tactic.startDate)}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                      {formatDate(tactic.endDate)}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(tactic.totalBudget)}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                      {tactic.contractedKpiGoal ? tactic.contractedKpiGoal.toLocaleString() :
                       tactic.contractedImpressions ? tactic.contractedImpressions.toLocaleString() : '-'}
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                      {tactic.cpm ? formatCurrency(tactic.cpm) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onGenerate}
            disabled={isGenerateDisabled}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
              isGenerateDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Generate {selectedIds.length} Flight Plan(s)
          </button>
        </div>
      </div>
    </div>
  );
}
