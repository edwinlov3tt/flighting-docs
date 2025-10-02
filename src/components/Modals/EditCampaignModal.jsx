/**
 * EditCampaignModal Component
 *
 * Modal for editing campaign budget, CPM, dates, and template type
 *
 * Props:
 * - isOpen: boolean - Whether modal is visible
 * - campaign: object - Campaign to edit
 * - onClose: () => void - Close modal
 * - onSave: (updates) => void - Save changes
 */

import React, { useState, useEffect } from 'react';

export function EditCampaignModal({
  isOpen,
  campaign,
  onClose,
  onSave
}) {
  const [totalBudget, setTotalBudget] = useState('');
  const [cpm, setCpm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [templateType, setTemplateType] = useState('programmatic');
  const [editingEnabled, setEditingEnabled] = useState(false);

  // Update state when campaign changes
  useEffect(() => {
    if (campaign && campaign.formData) {
      setTotalBudget(campaign.formData.totalBudget?.toString() || '');
      setCpm(campaign.formData.rate?.toString() || '');
      setStartDate(campaign.formData.startDate || '');
      setEndDate(campaign.formData.endDate || '');
      setTemplateType(campaign.templateType || 'programmatic');
      setEditingEnabled(false);
    }
  }, [campaign]);

  if (!isOpen || !campaign) return null;

  const handleSave = () => {
    const updates = {
      totalBudget: parseFloat(totalBudget) || parseFloat(campaign.formData?.totalBudget) || 0,
      rate: parseFloat(cpm) || parseFloat(campaign.formData?.rate) || 0,
      startDate: startDate || campaign.formData?.startDate || '',
      endDate: endDate || campaign.formData?.endDate || '',
      templateType
    };

    onSave(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Edit Campaign Plan</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Total Budget */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Budget
          </label>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            disabled={!editingEnabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !editingEnabled ? 'bg-gray-50 text-gray-500' : ''
            }`}
            step="0.01"
          />
        </div>

        {/* CPM with Enable Editing Checkbox */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              CPM
            </label>
            <label className="flex items-center text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={editingEnabled}
                onChange={(e) => setEditingEnabled(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              Enable editing
            </label>
          </div>
          <input
            type="number"
            value={cpm}
            onChange={(e) => setCpm(e.target.value)}
            disabled={!editingEnabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !editingEnabled ? 'bg-gray-50 text-gray-500' : ''
            }`}
            step="0.01"
          />
        </div>

        {/* Campaign Start Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={!editingEnabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !editingEnabled ? 'bg-gray-50 text-gray-500' : ''
            }`}
          />
        </div>

        {/* Campaign End Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={!editingEnabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              !editingEnabled ? 'bg-gray-50 text-gray-500' : ''
            }`}
          />
        </div>

        {/* Template Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template Type
          </label>
          <select
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="programmatic">Programmatic</option>
            <option value="youtube">YouTube</option>
            <option value="sem-social">SEM / Social</option>
          </select>
        </div>

        {/* Warning Message */}
        {editingEnabled && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Changing dates or budget will regenerate all flight lines with even distribution.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
