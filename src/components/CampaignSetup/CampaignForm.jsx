/**
 * CampaignForm Component
 *
 * Main form for creating new flight campaigns
 * Handles tactic selection, date range, budget/impressions with auto-calculation
 *
 * Props:
 * - formData: object - Form state { tactic, startDate, endDate, totalBudget, rate, totalImpressions, totalViews, metricType }
 * - validationErrors: object - Field-level validation errors
 * - onFormDataChange: (field, value) => void - Update form field
 * - onBudgetChange: (value) => void - Handle budget change with auto-calc
 * - onImpressionsChange: (value) => void - Handle impressions change with auto-calc
 * - onViewsChange: (value) => void - Handle views change with auto-calc
 * - onRateChange: (value) => void - Handle rate change with auto-calc
 * - onGenerateFlight: () => void - Generate flight plan
 * - isGenerateDisabled: boolean - Whether generate button is disabled
 * - tacticSelectorProps: object - Props to pass to TacticSelector
 * - luminaImportProps: object - Props to pass to LuminaImport
 */

import React from 'react';

export function CampaignForm({
  formData,
  validationErrors = {},
  onFormDataChange,
  onBudgetChange,
  onImpressionsChange,
  onViewsChange,
  onRateChange,
  onGenerateFlight,
  isGenerateDisabled,
  showStartOver = false,
  onStartOver,
  children // For TacticSelector and LuminaImport
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Setup</h2>

      {/* Lumina Import Section - AT THE TOP */}
      {React.Children.toArray(children)[1]}

      {/* Tactic Selector + Date Range Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tactic Selector - 1 column */}
        {React.Children.toArray(children)[0]}

        {/* Date Range - 2 columns */}
        <div className="grid grid-cols-2 gap-4 md:col-span-2 lg:col-span-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Flight Start *
            </label>
            <input
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => onFormDataChange('startDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.startDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.startDate && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.startDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Flight End *
            </label>
            <input
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => onFormDataChange('endDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.endDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.endDate && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.endDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Budget, Rate, and Impressions/Views Row */}
      {formData.tactic && (
        <div className="mt-6">
          <div className="mb-2 text-xs text-blue-600 font-medium">
            Budget and {formData.metricType === 'CPV' ? 'Views' : 'Impressions'} auto-calculate based on your {formData.metricType} rate
          </div>

          <div className="grid grid-cols-10 gap-4">
            {/* Total Budget - 40% width */}
            <div className="col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Budget *
              </label>
              <input
                type="number"
                value={formData.totalBudget || ''}
                onChange={(e) => onBudgetChange(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.totalBudget ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.totalBudget && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.totalBudget}</p>
              )}
            </div>

            {/* Rate - 20% width */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.metricType} Rate *
              </label>
              <input
                type="number"
                value={formData.rate || ''}
                onChange={(e) => onRateChange(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.rate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.rate && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.rate}</p>
              )}
            </div>

            {/* Impressions/Views - 40% width */}
            <div className="col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total {formData.metricType === 'CPV' ? 'Views' : 'Impressions'} *
              </label>
              <input
                type="number"
                value={formData.metricType === 'CPV' ? (formData.totalViews || '') : (formData.totalImpressions || '')}
                onChange={(e) => {
                  if (formData.metricType === 'CPV') {
                    onViewsChange(e.target.value);
                  } else {
                    onImpressionsChange(e.target.value);
                  }
                }}
                placeholder="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.totalViews || validationErrors.totalImpressions ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {(validationErrors.totalViews || validationErrors.totalImpressions) && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.totalViews || validationErrors.totalImpressions}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate Flight Button and Start Over - LEFT SIDE */}
      <div className="mt-6 flex space-x-3">
        <button
          onClick={onGenerateFlight}
          disabled={isGenerateDisabled}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isGenerateDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
          title={isGenerateDisabled ? 'Please fill in tactic, dates, and budget first' : ''}
        >
          Generate Flight
        </button>

        {showStartOver && (
          <button
            onClick={onStartOver}
            className="px-6 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            title="Delete all campaigns and reset form"
          >
            Start Over
          </button>
        )}
      </div>
    </div>
  );
}
