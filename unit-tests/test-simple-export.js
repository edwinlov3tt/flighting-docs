// Test the simplified Excel export that preserves template formatting
const fetch = require('node-fetch');

const EXPORT_SERVER = 'http://localhost:3002';

async function testSimpleExport() {
    console.log('🧪 Testing Simplified Excel Export (Template Preservation)');
    
    // Test campaign matching the programmatic template
    const testCampaign = {
        name: "Template Test Campaign",
        templateType: "programmatic",
        formData: {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            rate: 15.0
        },
        flights: [
            {
                startDate: "2025-01-01",
                endDate: "2025-01-15",
                budget: 5000,
                impressions: 333333
            },
            {
                startDate: "2025-01-16",
                endDate: "2025-01-31",
                budget: 7500,
                impressions: 500000
            }
        ]
    };

    // Test server health
    try {
        const health = await fetch(`${EXPORT_SERVER}/health`);
        const healthData = await health.json();
        console.log(`✅ Simple export server healthy: ${healthData.status}`);
    } catch (error) {
        console.log(`❌ Server not available: ${error.message}`);
        return;
    }

    // Test single campaign export
    console.log('\n🎯 Testing template preservation export...');
    try {
        const response = await fetch(`${EXPORT_SERVER}/api/export/single`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ campaign: testCampaign })
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Template preservation export successful!`);
            console.log(`📄 File: ${result.fileName}`);
            console.log(`📁 Download: ${EXPORT_SERVER}${result.downloadUrl}`);
            
            // Verify the file can be downloaded
            const downloadResponse = await fetch(`${EXPORT_SERVER}${result.downloadUrl}`);
            if (downloadResponse.ok) {
                console.log(`✅ Download verified - file size: ${downloadResponse.headers.get('content-length')} bytes`);
            }
        } else {
            const error = await response.text();
            console.log(`❌ Export failed: ${response.status} - ${error}`);
        }
    } catch (error) {
        console.log(`❌ Export error: ${error.message}`);
    }

    console.log('\n🎉 Simple export test complete!');
    console.log('📝 This approach should preserve ALL original template formatting');
    console.log('🎨 Including colors, borders, headers, and styling');
}

testSimpleExport().catch(console.error);