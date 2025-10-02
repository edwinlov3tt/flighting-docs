// Excel Export Utility Functions for Vercel Serverless Function

const EXCEL_EXPORT_SERVER = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : '';

// Retry helper with exponential backoff
async function retryFetch(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = Math.pow(2, i) * 1000;
            console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Export single campaign to Excel
export async function exportCampaignToExcel(campaign, setLoading) {
    try {
        setLoading(true);

        if (!campaign.templateType || !campaign.flights || !Array.isArray(campaign.flights)) {
            throw new Error('Campaign must have templateType and flights array');
        }

        console.log(`Exporting campaign: ${campaign.name} (${campaign.templateType}) with ${campaign.flights.length} flights`);

        const response = await retryFetch(`${EXCEL_EXPORT_SERVER}/api/excel-export`, {
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

        // Direct file download (serverless function)
        const blob = await response.blob();
        const fileName = `${campaign.name}.xlsx`;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log(`Successfully exported: ${fileName}`);
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
        setLoading(false);
    }
}

// Export multiple campaigns to Excel
export async function exportCampaignsToExcel(campaigns, setLoading) {
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

        console.log(`Exporting ${campaigns.length} campaigns`);

        const response = await retryFetch(`${EXCEL_EXPORT_SERVER}/api/excel-export`, {
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

        const blob = await response.blob();
        const fileName = 'Media_Flight_Plans.xlsx';
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log(`Successfully exported: ${fileName}`);
    } catch (error) {
        console.error('Bulk export error:', error);
        alert(`Failed to export campaigns.\n\n❌ ${error.message}`);
    } finally {
        setLoading(false);
    }
}
