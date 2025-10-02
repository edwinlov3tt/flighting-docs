/**
 * ViewAllModal Component
 *
 * Modal showing all campaigns with bulk export functionality
 * Allows switching between campaigns, editing names, and deleting
 *
 * Props:
 * - isOpen: boolean - Whether modal is visible
 * - campaigns: array - All campaigns
 * - activeTab: number - Currently active campaign index
 * - exportLoading: boolean - Export loading state
 * - onClose: () => void - Close modal
 * - onSelectCampaign: (index) => void - Switch to campaign
 * - onDeleteCampaign: (index) => void - Delete campaign
 * - onRenameCampaign: (index, newName) => void - Rename campaign
 * - onExportAll: () => void - Export all campaigns
 */

import React, { useState } from 'react';

export function ViewAllModal({
  isOpen,
  campaigns = [],
  activeTab,
  exportLoading,
  onClose,
  onSelectCampaign,
  onDeleteCampaign,
  onRenameCampaign,
  onExportAll
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (index, currentName) => {
    setEditingIndex(index);
    setEditingName(currentName);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingName.trim()) {
      onRenameCampaign(editingIndex, editingName.trim());
    }
    setEditingIndex(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingName('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">All Flight Plans</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Action Buttons */}
        {campaigns.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              onClick={onExportAll}
              disabled={exportLoading}
              className={`px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors ${
                exportLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{exportLoading ? 'Exporting...' : `Export All to Excel`}</span>
              </div>
            </button>

            {/* Open All Lumina Links button - only show if any campaigns have Lumina URLs */}
            {campaigns.some(c => c.luminaTactic?.luminaUrl) && (
              <button
                onClick={() => {
                  const luminaUrls = campaigns
                    .filter(c => c.luminaTactic?.luminaUrl)
                    .map(c => c.luminaTactic.luminaUrl);

                  luminaUrls.forEach(url => window.open(url, '_blank'));
                }}
                className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Open All in Lumina</span>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Campaign List */}
        <div className="space-y-4">
          {campaigns.map((campaign, index) => (
            <div
              key={campaign.id}
              className={`p-4 border rounded-lg hover:bg-gray-50 ${
                activeTab === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      onBlur={handleSaveEdit}
                      autoFocus
                      style={{ width: `${Math.max(editingName.length * 10, 200)}px` }}
                      className="px-2 py-1 text-lg font-semibold border-2 border-blue-500 rounded focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        onSelectCampaign(index);
                        onClose();
                      }}
                      className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {campaign.name}
                    </button>
                  )}
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {campaign.templateType?.replace('-', ' / ') || 'Not Set'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleStartEdit(index, campaign.name)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Rename campaign"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
                        onDeleteCampaign(index);
                        if (campaigns.length <= 1) onClose();
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete campaign"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-600">
                <span>{campaign.flights.length} flights</span>
                <span>${campaign.flights.reduce((sum, flight) => sum + flight.budget, 0).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No flight plans created yet.
          </div>
        )}
      </div>
    </div>
  );
}
