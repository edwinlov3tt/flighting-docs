// Test integration of Excel export with the main application
const fetch = require('node-fetch');

const EXPORT_SERVER = 'http://localhost:3001';

// Test campaign data matching the structure used in the main app
const testCampaign = {
    name: "Integration Test Campaign",
    templateType: "programmatic",
    formData: {
        startDate: "2025-01-01",
        endDate: "2025-03-31",
        rate: 15.0
    },
    flights: [
        {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            budget: 10000,
            impressions: 666667
        },
        {
            startDate: "2025-02-01", 
            endDate: "2025-02-28",
            budget: 15000,
            impressions: 1000000
        },
        {
            startDate: "2025-03-01",
            endDate: "2025-03-31", 
            budget: 8000,
            impressions: 533333
        }
    ]
};

async function testIntegration() {
    console.log('🔗 Testing Excel Export Integration');
    
    // Test server health
    try {
        const health = await fetch(`${EXPORT_SERVER}/health`);
        const healthData = await health.json();
        console.log(`✅ Export server healthy: ${healthData.status}`);
    } catch (error) {
        console.log(`❌ Export server not available: ${error.message}`);
        return;
    }

    // Test single campaign export (what the "Export" button does)
    console.log('\n🧪 Testing single campaign export...');
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
            console.log(`✅ Single export successful: ${result.fileName}`);
            console.log(`📁 Download URL: ${EXPORT_SERVER}${result.downloadUrl}`);
        } else {
            console.log(`❌ Single export failed: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Single export error: ${error.message}`);
    }

    // Test bulk export (what the "Export All" button does)
    console.log('\n🧪 Testing bulk campaign export...');
    try {
        const campaigns = [
            testCampaign,
            { ...testCampaign, name: "Test Campaign 2", templateType: "youtube" }
        ];

        const response = await fetch(`${EXPORT_SERVER}/api/export/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ campaigns })
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Bulk export successful: ${result.fileName}`);
            console.log(`📁 Download URL: ${EXPORT_SERVER}${result.downloadUrl}`);
        } else {
            console.log(`❌ Bulk export failed: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Bulk export error: ${error.message}`);
    }

    console.log('\n🎉 Integration testing complete!');
    console.log('📝 Both "Export" and "Export All" buttons should now work in the main app.');
}

testIntegration().catch(console.error);