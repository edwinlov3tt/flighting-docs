// Enhanced Excel Export Client Functions
// This file should be included in index.html to enable Excel export functionality
// Supports dynamic row generation with alternating colors and individual template files

const EXCEL_EXPORT_SERVER = 'http://localhost:3001'; // Excel export server

// Retry helper function with exponential backoff
async function retryFetch(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;

            // Exponential backoff: wait 1s, 2s, 4s
            const delay = Math.pow(2, i) * 1000;
            console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Export single campaign to Excel with enhanced features
async function exportCampaignToExcel(campaign) {
    try {
        // Show loading indicator
        showExportLoading(true);
        
        // Validate campaign data before sending
        if (!campaign.templateType || !campaign.flights || !Array.isArray(campaign.flights)) {
            throw new Error('Campaign must have templateType and flights array');
        }
        
        console.log(`Exporting campaign: ${campaign.name} (${campaign.templateType}) with ${campaign.flights.length} flights`);

        const response = await retryFetch(`${EXCEL_EXPORT_SERVER}/api/export/single`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ campaign })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Export failed with status ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            // Download the file
            downloadExcelFile(result.downloadUrl, result.fileName);
            console.log(`Successfully exported: ${result.fileName}`);
        } else {
            throw new Error(result.message || 'Export failed');
        }
    } catch (error) {
        console.error('Export error:', error);
        let errorMessage = 'Failed to export campaign.\n\n';

        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            errorMessage += '❌ Cannot connect to export server.\n';
            errorMessage += `Please ensure the server is running on port 3001.\n\n`;
            errorMessage += 'Start server: npm run start-export';
        } else if (error.message.includes('templateType') || error.message.includes('validation')) {
            errorMessage += '❌ Invalid campaign data.\n';
            errorMessage += error.message;
        } else {
            errorMessage += `❌ ${error.message}`;
        }

        alert(errorMessage);
    } finally {
        showExportLoading(false);
    }
}

// Export multiple campaigns to Excel with enhanced features
async function exportCampaignsToExcel(campaigns) {
    try {
        // Show loading indicator
        showExportLoading(true);
        
        // Validate campaigns data
        if (!Array.isArray(campaigns) || campaigns.length === 0) {
            throw new Error('Please provide an array of campaigns to export');
        }
        
        const invalidCampaigns = campaigns.filter(c => 
            !c.templateType || !c.flights || !Array.isArray(c.flights)
        );
        
        if (invalidCampaigns.length > 0) {
            throw new Error(`Invalid campaigns found: ${invalidCampaigns.map(c => c.name || 'Unknown').join(', ')}`);
        }
        
        console.log(`Exporting ${campaigns.length} campaigns:`);
        campaigns.forEach(c => console.log(`  - ${c.name} (${c.templateType}, ${c.flights.length} flights)`));

        const response = await retryFetch(`${EXCEL_EXPORT_SERVER}/api/export/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ campaigns })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Export failed with status ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            // Download the file
            downloadExcelFile(result.downloadUrl, result.fileName);
            console.log(`Successfully exported: ${result.fileName}`);
        } else {
            throw new Error(result.message || 'Export failed');
        }
    } catch (error) {
        console.error('Bulk export error:', error);
        let errorMessage = 'Failed to export campaigns.\n\n';

        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            errorMessage += '❌ Cannot connect to export server.\n';
            errorMessage += `Please ensure the server is running on port 3001.\n\n`;
            errorMessage += 'Start server: npm run start-export';
        } else if (error.message.includes('Invalid campaigns')) {
            errorMessage += '❌ Some campaigns have invalid data.\n';
            errorMessage += error.message;
        } else {
            errorMessage += `❌ ${error.message}`;
        }

        alert(errorMessage);
    } finally {
        showExportLoading(false);
    }
}

// Download Excel file from server
function downloadExcelFile(downloadUrl, fileName) {
    const link = document.createElement('a');
    link.href = `${EXCEL_EXPORT_SERVER}${downloadUrl}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Check if export server is running and get template information
async function checkExportServerHealth() {
    try {
        const response = await fetch(`${EXCEL_EXPORT_SERVER}/health`);
        if (response.ok) {
            const data = await response.json();
            console.log('Export server status:', data);
            return data;
        }
        throw new Error('Server not responding');
    } catch (error) {
        console.error('Export server health check failed:', error);
        return null;
    }
}

// Get available templates and their fillable ranges
async function getTemplateInfo() {
    try {
        const response = await fetch(`${EXCEL_EXPORT_SERVER}/api/templates/info`);
        if (response.ok) {
            const data = await response.json();
            console.log('Available templates:', data);
            return data;
        }
        throw new Error('Failed to get template info');
    } catch (error) {
        console.error('Failed to get template information:', error);
        return null;
    }
}

// Show/hide loading indicator
function showExportLoading(show) {
    // This will be implemented in the React component
    const event = new CustomEvent('exportLoading', { detail: { show } });
    window.dispatchEvent(event);
}

// React component additions for index.html
const ExcelExportFeatures = {
    // Add this to your MediaFlightPlanner component
    
    // State for export loading
    useState: () => {
        const [exportLoading, setExportLoading] = React.useState(false);
        
        // Listen for export loading events
        React.useEffect(() => {
            const handleExportLoading = (event) => {
                setExportLoading(event.detail.show);
            };
            window.addEventListener('exportLoading', handleExportLoading);
            return () => window.removeEventListener('exportLoading', handleExportLoading);
        }, []);
        
        return { exportLoading, setExportLoading };
    },
    
    // Export Options Modal Component
    ExportOptionsModal: ({ campaigns, onClose, onExport }) => {
        const [selectedCampaigns, setSelectedCampaigns] = React.useState(
            campaigns.map((_, index) => index)
        );
        const [exportMode, setExportMode] = React.useState('all');
        
        const handleExport = async () => {
            const campaignsToExport = exportMode === 'selected' 
                ? campaigns.filter((_, index) => selectedCampaigns.includes(index))
                : campaigns;
                
            if (campaignsToExport.length === 1) {
                await exportCampaignToExcel(campaignsToExport[0]);
            } else {
                await exportCampaignsToExcel(campaignsToExport);
            }
            onClose();
        };
        
        return React.createElement('div', { 
            className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
        },
            React.createElement('div', { className: "bg-white rounded-lg p-6 max-w-2xl w-full mx-4" },
                React.createElement('div', { className: "flex justify-between items-center mb-6" },
                    React.createElement('h3', { className: "text-xl font-semibold text-gray-900" }, 
                        "Export to Excel"
                    ),
                    React.createElement('button', {
                        onClick: onClose,
                        className: "text-gray-400 hover:text-gray-600 text-2xl"
                    }, "×")
                ),
                
                // Export mode selection
                React.createElement('div', { className: "mb-6" },
                    React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-2" }, 
                        "Export Mode"
                    ),
                    React.createElement('div', { className: "space-y-2" },
                        React.createElement('label', { className: "flex items-center" },
                            React.createElement('input', {
                                type: "radio",
                                name: "exportMode",
                                value: "all",
                                checked: exportMode === 'all',
                                onChange: (e) => setExportMode(e.target.value),
                                className: "mr-2"
                            }),
                            "Export all campaigns"
                        ),
                        React.createElement('label', { className: "flex items-center" },
                            React.createElement('input', {
                                type: "radio",
                                name: "exportMode",
                                value: "selected",
                                checked: exportMode === 'selected',
                                onChange: (e) => setExportMode(e.target.value),
                                className: "mr-2"
                            }),
                            "Select campaigns to export"
                        )
                    )
                ),
                
                // Campaign selection (if selected mode)
                exportMode === 'selected' && React.createElement('div', { className: "mb-6" },
                    React.createElement('label', { className: "block text-sm font-medium text-gray-700 mb-2" }, 
                        "Select Campaigns"
                    ),
                    React.createElement('div', { className: "space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3" },
                        campaigns.map((campaign, index) =>
                            React.createElement('label', { 
                                key: campaign.id, 
                                className: "flex items-center p-2 hover:bg-gray-50 rounded" 
                            },
                                React.createElement('input', {
                                    type: "checkbox",
                                    checked: selectedCampaigns.includes(index),
                                    onChange: (e) => {
                                        if (e.target.checked) {
                                            setSelectedCampaigns([...selectedCampaigns, index]);
                                        } else {
                                            setSelectedCampaigns(selectedCampaigns.filter(i => i !== index));
                                        }
                                    },
                                    className: "mr-3"
                                }),
                                React.createElement('div', null,
                                    React.createElement('div', { className: "font-medium" }, campaign.name),
                                    React.createElement('div', { className: "text-sm text-gray-500" }, 
                                        `${campaign.templateType} • ${campaign.flights.length} flights • $${
                                            campaign.flights.reduce((sum, f) => sum + f.budget, 0).toLocaleString()
                                        }`
                                    )
                                )
                            )
                        )
                    )
                ),
                
                // Export information
                React.createElement('div', { className: "mb-6 p-4 bg-blue-50 rounded-lg" },
                    React.createElement('h4', { className: "font-medium text-blue-900 mb-2" }, 
                        "Export Information"
                    ),
                    React.createElement('ul', { className: "text-sm text-blue-700 space-y-1" },
                        React.createElement('li', null, 
                            "• Each campaign will be exported to its own sheet"
                        ),
                        React.createElement('li', null, 
                            "• Sheet names will match campaign names"
                        ),
                        React.createElement('li', null, 
                            "• Templates are automatically selected based on campaign type"
                        ),
                        React.createElement('li', null, 
                            "• All formulas and formatting from the template will be preserved"
                        )
                    )
                ),
                
                // Action buttons
                React.createElement('div', { className: "flex justify-end space-x-3" },
                    React.createElement('button', {
                        onClick: onClose,
                        className: "px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    }, "Cancel"),
                    React.createElement('button', {
                        onClick: handleExport,
                        disabled: exportMode === 'selected' && selectedCampaigns.length === 0,
                        className: `px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ${
                            exportMode === 'selected' && selectedCampaigns.length === 0 
                                ? 'opacity-50 cursor-not-allowed' : ''
                        }`
                    }, `Export ${
                        exportMode === 'all' 
                            ? campaigns.length 
                            : selectedCampaigns.length
                    } Campaign(s)`)
                )
            )
        );
    },
    
    // Loading Overlay Component
    ExportLoadingOverlay: ({ show }) => {
        if (!show) return null;
        
        return React.createElement('div', { 
            className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" 
        },
            React.createElement('div', { className: "bg-white rounded-lg p-6 flex items-center space-x-4" },
                React.createElement('div', { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" }),
                React.createElement('span', { className: "text-lg font-medium" }, "Exporting to Excel...")
            )
        );
    }
};

// Helper function to add Excel export buttons to the UI
function addExcelExportButtons() {
    // This function will be called from the main React component
    // to add the export buttons to the campaign actions
    return {
        singleExportButton: (campaign) => React.createElement('button', {
            onClick: () => exportCampaignToExcel(campaign),
            className: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700",
            title: "Export this campaign to Excel"
        },
            React.createElement('span', { className: "flex items-center" },
                React.createElement('svg', { 
                    className: "w-4 h-4 mr-2", 
                    fill: "none", 
                    stroke: "currentColor", 
                    viewBox: "0 0 24 24" 
                },
                    React.createElement('path', { 
                        strokeLinecap: "round", 
                        strokeLinejoin: "round", 
                        strokeWidth: "2", 
                        d: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    })
                ),
                "Export Excel"
            )
        ),
        
        bulkExportButton: (showModal) => React.createElement('button', {
            onClick: showModal,
            className: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700",
            title: "Export multiple campaigns to Excel"
        },
            React.createElement('span', { className: "flex items-center" },
                React.createElement('svg', { 
                    className: "w-4 h-4 mr-2", 
                    fill: "none", 
                    stroke: "currentColor", 
                    viewBox: "0 0 24 24" 
                },
                    React.createElement('path', { 
                        strokeLinecap: "round", 
                        strokeLinejoin: "round", 
                        strokeWidth: "2", 
                        d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    })
                ),
                "Export All Excel"
            )
        )
    };
}

// Initialize export client
async function initializeExportClient() {
    console.log('Excel export client loaded. Checking server health...');
    const serverHealth = await checkExportServerHealth();
    if (serverHealth) {
        console.log('✅ Export server is running and ready');
        const templateInfo = await getTemplateInfo();
        if (templateInfo) {
            console.log('📋 Available templates:', templateInfo.supportedTypes);
            console.log('📊 Fillable ranges:', templateInfo.fillableRanges);
        }
    } else {
        console.warn('⚠️ Export server is not running. Start with: node excel-export-server-enhanced.js');
    }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    // Delay initialization to allow other scripts to load
    setTimeout(initializeExportClient, 1000);
}

console.log('Enhanced Excel export client loaded. Start the export server with: node excel-export-server-enhanced.js');