// Excel Export Utility Functions for Vercel Serverless Function

const EXCEL_EXPORT_SERVER = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : '';

// Track active exports to prevent duplicate requests
let activeExportRequest = null;

// Sanitize campaign data before export
// Removes UI-only properties that shouldn't be sent to server
function sanitizeCampaign(campaign) {
    const sanitized = {
        ...campaign,
        flights: campaign.flights.map(flight => {
            // Remove UI-only properties
            const { locked, isChild, isParent, parentId, ...cleanFlight } = flight;
            return cleanFlight;
        })
    };
    return sanitized;
}

// Sanitize multiple campaigns
function sanitizeCampaigns(campaigns) {
    return campaigns.map(sanitizeCampaign);
}

// Retry helper with exponential backoff
async function retryFetch(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Download file from blob with proper cleanup
function downloadBlob(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL after a short delay
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
    }, 100);
}

// Export single campaign to Excel
export async function exportCampaignToExcel(campaign, setLoading) {
    // Prevent concurrent exports
    if (activeExportRequest) {
        return;
    }

    try {
        setLoading(true);

        if (!campaign.templateType || !campaign.flights || !Array.isArray(campaign.flights)) {
            throw new Error('Campaign must have templateType and flights array');
        }

        // Sanitize campaign data before sending
        const cleanCampaign = sanitizeCampaign(campaign);

        activeExportRequest = retryFetch(`${EXCEL_EXPORT_SERVER}/api/excel-export`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ campaign: cleanCampaign })
        });

        const response = await activeExportRequest;

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Export failed with status ${response.status}`);
        }

        // Download file with proper cleanup
        const blob = await response.blob();
        const sanitizedName = campaign.name.replace(/[^\w\s-]/g, '').trim() || 'Campaign';
        const fileName = `${sanitizedName}.xlsx`;
        downloadBlob(blob, fileName);

    } catch (error) {
        console.error('Export error:', error);
        let errorMessage = 'Failed to export campaign.\n\n';

        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            errorMessage += '❌ Cannot connect to export server.\n';
            errorMessage += 'Please check your connection and try again.';
        } else {
            errorMessage += `❌ ${error.message}`;
        }

        alert(errorMessage);
    } finally {
        activeExportRequest = null;
        setLoading(false);
    }
}

// Export multiple campaigns to Excel (ZIP file)
export async function exportCampaignsToExcel(campaigns, setLoading) {
    // Prevent concurrent exports
    if (activeExportRequest) {
        return;
    }

    try {
        setLoading(true);

        if (!Array.isArray(campaigns) || campaigns.length === 0) {
            throw new Error('Please provide campaigns to export');
        }

        const invalidCampaigns = campaigns.filter(c =>
            !c.templateType || !c.flights || !Array.isArray(c.flights)
        );

        if (invalidCampaigns.length > 0) {
            throw new Error(`Invalid campaigns found: ${invalidCampaigns.map(c => c.name || 'Unknown').join(', ')}`);
        }

        // Sanitize all campaigns before sending
        const cleanCampaigns = sanitizeCampaigns(campaigns);

        activeExportRequest = retryFetch(`${EXCEL_EXPORT_SERVER}/api/excel-export`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ campaigns: cleanCampaigns })
        });

        const response = await activeExportRequest;

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Export failed with status ${response.status}`);
        }

        // Download ZIP file with proper cleanup
        const blob = await response.blob();
        const fileName = 'Media_Flight_Plans.zip';
        downloadBlob(blob, fileName);

    } catch (error) {
        console.error('Bulk export error:', error);
        alert(`Failed to export campaigns.\n\n❌ ${error.message}`);
    } finally {
        activeExportRequest = null;
        setLoading(false);
    }
}
