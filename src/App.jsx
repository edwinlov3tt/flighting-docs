/**
 * App Component (Main Application)
 *
 * Root component for Media Flight Planner
 * Integrates all sub-components and manages application-level state
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTactics } from './hooks/useTactics';
import { useCampaigns } from './hooks/useCampaigns';
import { useFlightGenerator } from './hooks/useFlightGenerator';
import { useLuminaImport } from './hooks/useLuminaImport';
import { CampaignForm } from './components/CampaignSetup/CampaignForm';
import { TacticSelector } from './components/CampaignSetup/TacticSelector';
import { LuminaImport } from './components/CampaignSetup/LuminaImport';
import { FlightTable } from './components/FlightTable/FlightTable';
import { BudgetRedistributionModal } from './components/Modals/BudgetRedistributionModal';
import { LuminaTacticsModal } from './components/Modals/LuminaTacticsModal';
import { ViewAllModal } from './components/Modals/ViewAllModal';
import { EditCampaignModal } from './components/Modals/EditCampaignModal';
import { BudgetStatusTracker } from './components/BudgetStatusTracker/BudgetStatusTracker';
import { ExportLoadingOverlay } from './components/ExportLoadingOverlay/ExportLoadingOverlay';
import { calculateTotals, calculateBudgetStatus } from './utils/calculations';
import { exportCampaignToExcel, exportCampaignsToExcel } from './utils/excelExport';

export default function App() {
  // Tactics data
  const { tactics, loading: tacticsLoading, error: tacticsError } = useTactics();

  // Campaign management
  const {
    campaigns,
    addCampaign,
    updateCampaignName,
    deleteCampaign,
    updateFlightValue,
    splitFlight,
    toggleFlightLock,
    zeroOutFlight,
    redistributeBudget,
    resetCampaign,
    undo,
    redo,
    canUndo,
    canRedo,
    hasHistory
  } = useCampaigns();

  // Flight generation
  const {
    formData,
    validationErrors,
    setFormData,
    handleBudgetChange,
    handleImpressionsChange,
    handleViewsChange,
    handleRateChange,
    generateFlights,
    resetForm
  } = useFlightGenerator(tactics);

  // Lumina import
  const {
    orderLink,
    setOrderLink,
    loading: luminaLoading,
    error: luminaError,
    tactics: luminaTactics,
    selectedTacticIds,
    showTactics: showLuminaTactics,
    handleImport: handleLuminaImport,
    toggleTacticSelection,
    generateCampaigns: generateLuminaCampaigns,
    clearImport: clearLuminaImport
  } = useLuminaImport();

  // UI State
  const [showForm, setShowForm] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTacticDropdown, setShowTacticDropdown] = useState(false);
  const [collapsedFlights, setCollapsedFlights] = useState(new Set());
  const [selectedFlights, setSelectedFlights] = useState(new Set());
  const [lastSelectedFlightId, setLastSelectedFlightId] = useState(null);

  // Redistribution modal state
  const [showRedistributeModal, setShowRedistributeModal] = useState(false);
  const [redistributeAmount, setRedistributeAmount] = useState(0);
  const [redistributeFromFlightId, setRedistributeFromFlightId] = useState(null);

  // Export loading state
  const [exportLoading, setExportLoading] = useState(false);

  // View All modal state
  const [showViewAllModal, setShowViewAllModal] = useState(false);

  // Edit Campaign modal state
  const [showEditModal, setShowEditModal] = useState(false);

  // Inline campaign name editing
  const [editingCampaignName, setEditingCampaignName] = useState(false);
  const [tempCampaignName, setTempCampaignName] = useState('');

  // Refs
  const tacticDropdownRef = useRef(null);
  const campaignNameInputRef = useRef(null);

  // Handle tactic selection
  const handleTacticSelect = (tactic) => {
    const tacticName = `${tactic.product} - ${tactic.subProduct}`;
    const rateValue = parseFloat(tactic.rate.replace('$', '')) || 0;

    setFormData(prev => ({
      ...prev,
      tactic: tacticName,
      rate: rateValue.toString(),
      metricType: tactic.kpi
    }));

    setSearchTerm(tacticName);
    setShowTacticDropdown(false);
  };

  // Handle Lumina campaigns generation
  const handleGenerateLuminaCampaigns = () => {
    const newCampaigns = generateLuminaCampaigns();

    // Add each campaign to state
    newCampaigns.forEach(campaign => {
      addCampaign(campaign);
    });

    // Switch to first new campaign tab
    if (newCampaigns.length > 0) {
      setActiveTab(campaigns.length);
      setShowForm(false);
    }

    // Clear import state
    clearLuminaImport();
  };

  // Handle form field change
  const handleFormFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle generate flight
  const handleGenerateFlight = () => {
    const newCampaign = generateFlights();
    if (newCampaign) {
      addCampaign(newCampaign);
      setActiveTab(campaigns.length);
      setShowForm(false);
      resetForm();
      setSearchTerm('');
    }
  };

  // Check if generate button should be disabled
  const isGenerateDisabled = () => {
    return !formData.tactic ||
           !formData.startDate ||
           !formData.endDate ||
           !formData.totalBudget;
  };

  // Handle collapse toggle
  const handleToggleCollapse = (flightId) => {
    setCollapsedFlights(prev => {
      const next = new Set(prev);
      if (next.has(flightId)) {
        next.delete(flightId);
      } else {
        next.add(flightId);
      }
      return next;
    });
  };

  // Handle selection toggle with shift-click support
  const handleToggleSelect = (flightId, shiftKey = false) => {
    if (!activeCampaign) return;

    if (shiftKey && lastSelectedFlightId) {
      // Shift-click: select range from last selected to current
      const flights = activeCampaign.flights;
      const lastIndex = flights.findIndex(f => f.id === lastSelectedFlightId);
      const currentIndex = flights.findIndex(f => f.id === flightId);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeFlightIds = flights.slice(start, end + 1).map(f => f.id);

        setSelectedFlights(prev => {
          const next = new Set(prev);
          rangeFlightIds.forEach(id => next.add(id));
          return next;
        });
      }
    } else {
      // Normal click: toggle single selection
      setSelectedFlights(prev => {
        const next = new Set(prev);
        if (next.has(flightId)) {
          next.delete(flightId);
        } else {
          next.add(flightId);
        }
        return next;
      });
    }

    // Update last selected flight
    setLastSelectedFlightId(flightId);
  };

  // Handle zero out with redistribution modal
  const handleZeroOutFlight = (campaignIndex, flightId) => {
    const campaign = campaigns[campaignIndex];
    const flight = campaign.flights.find(f => f.id === flightId);

    if (flight && flight.budget > 0) {
      // Open redistribution modal with the zeroed budget
      setRedistributeAmount(flight.budget);
      setRedistributeFromFlightId(flightId);
      setShowRedistributeModal(true);

      // Zero out the flight immediately
      zeroOutFlight(campaignIndex, flightId);
    }
  };

  // Handle redistribution execution
  const handleRedistribute = (method, selectedFlightIds) => {
    redistributeBudget(activeTab, redistributeAmount, method, selectedFlightIds, redistributeFromFlightId);
    setShowRedistributeModal(false);
  };

  // Handle redistribute from budget tracker
  const handleTrackerRedistribute = (amount) => {
    setRedistributeAmount(amount);
    setRedistributeFromFlightId(null); // No specific source flight
    setShowRedistributeModal(true);
  };

  // Handle Excel export
  const handleExportCampaign = async () => {
    if (!activeCampaign) return;
    await exportCampaignToExcel(activeCampaign, setExportLoading);
  };

  // Handle bulk Excel export
  const handleExportAllCampaigns = async () => {
    if (campaigns.length === 0) return;
    await exportCampaignsToExcel(campaigns, setExportLoading);
  };

  // Handle Start Over - Reset everything
  const handleStartOver = () => {
    if (campaigns.length > 0) {
      const confirmMsg = 'This will delete all campaigns and reset the form. Are you sure?';
      if (!window.confirm(confirmMsg)) return;
    }

    // Clear all campaigns
    while (campaigns.length > 0) {
      deleteCampaign(0);
    }

    // Reset form
    resetForm();
    setSearchTerm('');
    setShowForm(true);
    setActiveTab(0);
  };

  // Handle Reset Campaign - Reset active campaign to original state
  const handleResetCampaign = () => {
    if (!activeCampaign || !activeCampaign.originalFlights) return;

    const confirmMsg = `Reset "${activeCampaign.name}" to its original state?`;
    if (!window.confirm(confirmMsg)) return;

    // Restore original flights using the hook function
    resetCampaign(activeTab);
  };

  // Handle Edit Campaign - Update campaign budget, dates, CPM, and template type
  const handleEditCampaign = (updates) => {
    if (!activeCampaign) return;

    const {
      totalBudget,
      rate,
      startDate,
      endDate,
      templateType
    } = updates;

    // Check if dates or budget changed (requires regeneration)
    const budgetChanged = totalBudget !== activeCampaign.totalBudget;
    const datesChanged = startDate !== activeCampaign.startDate || endDate !== activeCampaign.endDate;
    const rateChanged = rate !== activeCampaign.rate;

    if (budgetChanged || datesChanged || rateChanged) {
      // Regenerate flights with new data
      const updatedFormData = {
        tactic: activeCampaign.tactic,
        startDate,
        endDate,
        totalBudget: totalBudget.toString(),
        rate: rate.toString(),
        totalImpressions: activeCampaign.totalImpressions,
        totalViews: activeCampaign.totalViews,
        metricType: activeCampaign.metricType
      };

      setFormData(updatedFormData);
      const newCampaign = generateFlights();

      if (newCampaign) {
        // Update existing campaign with regenerated flights
        setCampaigns(prev => {
          const updated = [...prev];
          updated[activeTab] = {
            ...newCampaign,
            id: activeCampaign.id,
            name: activeCampaign.name,
            templateType: templateType
          };
          return updated;
        });
      }
    } else {
      // Only template type changed, no regeneration needed
      setCampaigns(prev => {
        const updated = [...prev];
        updated[activeTab] = {
          ...updated[activeTab],
          templateType: templateType
        };
        return updated;
      });
    }
  };

  // Handle start inline campaign rename
  const handleStartRenameCampaign = () => {
    setTempCampaignName(activeCampaign.name);
    setEditingCampaignName(true);
    // Focus input after render
    setTimeout(() => {
      if (campaignNameInputRef.current) {
        campaignNameInputRef.current.focus();
        campaignNameInputRef.current.select();
      }
    }, 0);
  };

  // Handle save inline campaign rename
  const handleSaveRenameCampaign = () => {
    if (tempCampaignName.trim()) {
      updateCampaignName(activeTab, tempCampaignName.trim());
    }
    setEditingCampaignName(false);
  };

  // Handle cancel inline campaign rename
  const handleCancelRenameCampaign = () => {
    setEditingCampaignName(false);
    setTempCampaignName('');
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tacticDropdownRef.current && !tacticDropdownRef.current.contains(event.target)) {
        setShowTacticDropdown(false);
      }
    };

    if (showTacticDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showTacticDropdown]);

  // Listen for export loading events from excel-export-client.js
  useEffect(() => {
    const handleExportLoading = (event) => {
      setExportLoading(event.detail.show);
    };
    window.addEventListener('exportLoading', handleExportLoading);
    return () => window.removeEventListener('exportLoading', handleExportLoading);
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) undo();
      }
      // Ctrl+Y or Cmd+Shift+Z for redo
      if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.shiftKey && event.key === 'z'))) {
        event.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // Get active campaign and calculate totals
  const activeCampaign = campaigns[activeTab];
  const totals = activeCampaign
    ? calculateTotals(activeCampaign.flights, activeCampaign.templateType)
    : { budget: 0 };
  const budgetStatus = activeCampaign
    ? calculateBudgetStatus(activeCampaign)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Media Flight Planner</h1>
          <p className="text-gray-600 mt-2">Plan and manage your media flight campaigns</p>
        </div>

        {/* Campaign Form */}
        {showForm && (
          <CampaignForm
            formData={formData}
            validationErrors={validationErrors}
            onFormDataChange={handleFormFieldChange}
            onBudgetChange={handleBudgetChange}
            onImpressionsChange={handleImpressionsChange}
            onViewsChange={handleViewsChange}
            onRateChange={handleRateChange}
            onGenerateFlight={handleGenerateFlight}
            isGenerateDisabled={isGenerateDisabled()}
            showStartOver={campaigns.length > 0}
            onStartOver={handleStartOver}
          >
            {/* Tactic Selector */}
            <TacticSelector
              tactics={tactics}
              searchTerm={searchTerm}
              showDropdown={showTacticDropdown}
              isLoading={tacticsLoading}
              error={tacticsError}
              validationError={validationErrors.tactic}
              onSearchChange={setSearchTerm}
              onTacticSelect={handleTacticSelect}
              onDropdownToggle={setShowTacticDropdown}
              dropdownRef={tacticDropdownRef}
            />

            {/* Lumina Import */}
            <LuminaImport
              orderLink={orderLink}
              isLoading={luminaLoading}
              error={luminaError}
              onOrderLinkChange={setOrderLink}
              onImport={handleLuminaImport}
            />
          </CampaignForm>
        )}

        {/* No Campaigns Message */}
        {campaigns.length === 0 && !showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No campaigns yet</h3>
            <p className="mt-1 text-gray-500">Get started by creating your first campaign</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Create Campaign
            </button>
          </div>
        )}

        {/* Active Campaign with Tabs */}
        {activeCampaign && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Campaign Tabs */}
            <div className="flex items-center border-b border-gray-200 px-6 py-0">
              <div className="flex space-x-0 overflow-x-auto">
                {campaigns.map((campaign, index) => (
                  <button
                    key={campaign.id}
                    onClick={() => setActiveTab(index)}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === index
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {campaign.name}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="ml-4 px-3 py-1 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
              >
                + Add Campaign
              </button>
            </div>

            {/* Campaign Content */}
            <div className="p-6">
            {/* Campaign Header with Title and Action Buttons */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                {editingCampaignName ? (
                  <div className="flex items-center space-x-2">
                    <input
                      ref={campaignNameInputRef}
                      type="text"
                      value={tempCampaignName}
                      onChange={(e) => setTempCampaignName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRenameCampaign();
                        if (e.key === 'Escape') handleCancelRenameCampaign();
                      }}
                      onBlur={handleSaveRenameCampaign}
                      style={{ width: `${Math.max(tempCampaignName.length * 10, 200)}px` }}
                      className="px-2 py-1 text-lg font-semibold border-2 border-blue-500 rounded focus:outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {activeCampaign.name} Flight Plan
                    </h3>
                    <svg
                      onClick={handleStartRenameCampaign}
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </>
                )}
              </div>

              <div className="flex space-x-2">
                {/* Undo/Redo Buttons - Only show after first edit */}
                {hasHistory && (
                  <>
                    <button
                      onClick={undo}
                      disabled={!canUndo}
                      className={`p-2 border border-gray-300 rounded-lg transition-colors ${
                        canUndo ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'
                      }`}
                      title="Undo (Ctrl+Z)"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                    <button
                      onClick={redo}
                      disabled={!canRedo}
                      className={`p-2 border border-gray-300 rounded-lg transition-colors ${
                        canRedo ? 'text-gray-700 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'
                      }`}
                      title="Redo (Ctrl+Y)"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                      </svg>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowViewAllModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  View All
                </button>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Plan
                </button>
                <button
                  onClick={handleResetCampaign}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  title="Reset to original state"
                >
                  Reset
                </button>
                <button
                  onClick={handleExportCampaign}
                  disabled={exportLoading}
                  className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ${exportLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {exportLoading ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>

            {/* Budget Summary Cards */}
            <div className={`mb-6 grid gap-4 ${
              activeCampaign.templateType === 'programmatic' ? 'grid-cols-4' : 'grid-cols-3'
            }`}>
              {/* Total Budget Card */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-600">Total Budget</div>
                <div className="text-2xl font-bold text-blue-900">
                  ${totals.budget.toLocaleString()}
                </div>
              </div>

              {/* Total Impressions Card - Only for Programmatic */}
              {activeCampaign.templateType === 'programmatic' && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-orange-600">Total Impressions</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {(totals.impressions || 0).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Active Flights Card */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-green-600">Active Flights</div>
                <div className="text-2xl font-bold text-green-900">
                  {activeCampaign.flights.filter(f => f.budget > 0).length}
                </div>
              </div>

              {/* Template Type Card */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-600">Template Type</div>
                <div className="text-lg font-bold text-purple-900 capitalize">
                  {activeCampaign?.templateType?.replace('-', ' / ') || 'Not Set'}
                </div>
              </div>
            </div>

            {/* Flight Count and Multi-Select Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-700">
                  <span className="font-semibold">{activeCampaign.flights.length}</span> total flights
                </span>
                <span className="text-gray-700">
                  <span className="font-semibold">
                    {activeCampaign.flights.filter(f => !f.isChild || !collapsedFlights.has(f.parentId)).length}
                  </span> visible
                </span>
                {selectedFlights.size > 0 && (
                  <span className="text-blue-600 font-medium">
                    {selectedFlights.size} selected
                  </span>
                )}
              </div>
              {selectedFlights.size > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      selectedFlights.forEach(flightId => {
                        toggleFlightLock(activeTab, flightId);
                      });
                    }}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    title="Lock all selected flights"
                  >
                    Lock
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Zero out ${selectedFlights.size} selected flights?`)) {
                        selectedFlights.forEach(flightId => {
                          handleZeroOutFlight(activeTab, flightId);
                        });
                        setSelectedFlights(new Set());
                      }
                    }}
                    className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                    title="Zero out all selected flights"
                  >
                    Zero
                  </button>
                  <button
                    onClick={() => setSelectedFlights(new Set())}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>

            {/* Flight Table */}
            <FlightTable
              campaign={activeCampaign}
              campaignIndex={activeTab}
              templateType={activeCampaign.templateType}
              totals={totals}
              collapsedFlights={collapsedFlights}
              selectedFlights={selectedFlights}
              onUpdateFlight={updateFlightValue}
              onSplitFlight={splitFlight}
              onLockFlight={toggleFlightLock}
              onZeroOutFlight={handleZeroOutFlight}
              onToggleCollapse={handleToggleCollapse}
              onToggleSelect={handleToggleSelect}
            />
            </div>
          </div>
        )}

        {/* Budget Redistribution Modal */}
        <BudgetRedistributionModal
          isOpen={showRedistributeModal}
          amount={redistributeAmount}
          flights={activeCampaign?.flights || []}
          fromFlightId={redistributeFromFlightId}
          onClose={() => setShowRedistributeModal(false)}
          onRedistribute={handleRedistribute}
        />

        {/* Lumina Tactics Selection Modal */}
        <LuminaTacticsModal
          isOpen={showLuminaTactics}
          tactics={luminaTactics}
          selectedIds={selectedTacticIds}
          onToggleSelect={toggleTacticSelection}
          onGenerate={handleGenerateLuminaCampaigns}
          onClose={clearLuminaImport}
        />

        {/* View All Campaigns Modal */}
        <ViewAllModal
          isOpen={showViewAllModal}
          campaigns={campaigns}
          activeTab={activeTab}
          exportLoading={exportLoading}
          onClose={() => setShowViewAllModal(false)}
          onSelectCampaign={setActiveTab}
          onDeleteCampaign={deleteCampaign}
          onRenameCampaign={updateCampaignName}
          onExportAll={handleExportAllCampaigns}
        />

        {/* Edit Campaign Modal */}
        <EditCampaignModal
          isOpen={showEditModal}
          campaign={activeCampaign}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditCampaign}
        />
      </div>

      {/* Budget Status Tracker - Sticky Footer */}
      {campaigns.length > 0 && (
        <BudgetStatusTracker
          campaign={activeCampaign}
          budgetStatus={budgetStatus}
          onRedistribute={handleTrackerRedistribute}
        />
      )}

      {/* Export Loading Overlay */}
      <ExportLoadingOverlay isLoading={exportLoading} />
    </div>
  );
}
