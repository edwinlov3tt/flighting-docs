/**
 * BudgetStatusTracker Component
 *
 * Sticky footer showing budget status and validation
 * Displays original vs current budget with difference indicator
 * Shows redistribute button when budget is under
 *
 * Props:
 * - campaign: object - Current active campaign
 * - budgetStatus: object - Budget validation status { isValid, difference, totalBudget, originalBudget }
 * - onRedistribute: (amount) => void - Trigger budget redistribution
 */

import React from 'react';

export function BudgetStatusTracker({
  campaign,
  budgetStatus,
  onRedistribute
}) {
  if (!campaign || !budgetStatus) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Left Side - Budget Info */}
        <div className="flex items-center space-x-6">
          <div className="text-sm">
            <span className="text-gray-600">Campaign: </span>
            <span className="font-medium">{campaign?.name || 'Unknown'}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Original: </span>
            <span className="font-medium">${budgetStatus.originalBudget.toLocaleString()}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Current: </span>
            <span className="font-medium">${budgetStatus.totalBudget.toLocaleString()}</span>
          </div>
          <div
            className={`text-sm px-3 py-1 rounded-full ${
              budgetStatus.isValid ? 'bg-green-100 text-green-800' :
              budgetStatus.difference > 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {budgetStatus.isValid ? 'Balanced' :
             budgetStatus.difference > 0 ? `Over $${Math.abs(budgetStatus.difference).toLocaleString()}` :
             `Under $${Math.abs(budgetStatus.difference).toLocaleString()}`}
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center space-x-3">
          {budgetStatus.difference < 0 && (
            <button
              onClick={() => onRedistribute(Math.abs(budgetStatus.difference))}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Redistribute ${Math.abs(budgetStatus.difference).toLocaleString()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
