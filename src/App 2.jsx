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
import { calculateTotals } from './utils/calculations';

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
    redistributeBudget
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

  // Redistribution modal state
  const [showRedistributeModal, setShowRedistributeModal] = useState(false);
  const [redistributeAmount, setRedistributeAmount] = useState(0);
  const [redistributeFromFlightId, setRedistributeFromFlightId] = useState(null);

  // Refs
  const tacticDropdownRef = useRef(null);

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

  // Handle selection toggle
  const handleToggleSelect = (flightId) => {
    setSelectedFlights(prev => {
      const next = new Set(prev);
      if (next.has(flightId)) {
        next.delete(flightId);
      } else {
        next.add(flightId);
      }
      return next;
    });
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

  // Get active campaign and calculate totals
  const activeCampaign = campaigns[activeTab];
  const totals = activeCampaign
    ? calculateTotals(activeCampaign.flights, activeCampaign.templateType)
    : { budget: 0 };

  return (
    <div className="min-h-screen bg-gray-50">
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
          >
            {/* Lumina Import - FIRST */}
            <LuminaImport
              orderLink={orderLink}
              isLoading={luminaLoading}
              error={luminaError}
              onOrderLinkChange={setOrderLink}
              onImport={handleLuminaImport}
            />

            {/* Tactic Selector - SECOND */}
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
          </CampaignForm>
        )}

        {/* Campaign Tabs */}
        {campaigns.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between border-b border-gray-200">
              <div className="flex space-x-2 overflow-x-auto">
                {campaigns.map((campaign, index) => (
                  <button
                    key={campaign.id}
                    onClick={() => setActiveTab(index)}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
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
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + New Campaign
              </button>
            </div>
          </div>
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

        {/* Active Campaign */}
        {activeCampaign && !showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{activeCampaign.name}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    if (confirm(`Delete campaign "${activeCampaign.name}"?`)) {
                      deleteCampaign(activeTab);
                      setActiveTab(Math.max(0, activeTab - 1));
                    }
                  }}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
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
      </div>
    </div>
  );
}
