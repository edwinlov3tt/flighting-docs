// Test the updated integration with new ports
const fetch = require('node-fetch');

const EXPORT_SERVER = 'http://localhost:3002';

async function testNewPortsIntegration() {
    console.log('🔗 Testing Excel Export Integration on New Ports');
    console.log('📍 Main App: http://localhost:9000');
    console.log('📍 Export Server: http://localhost:3002');
    
    // Test server health
    try {
        const health = await fetch(`${EXPORT_SERVER}/health`);
        const healthData = await health.json();
        console.log(`✅ Export server healthy: ${healthData.status}`);
        console.log(`📋 Templates available: ${healthData.templates.join(', ')}`);
    } catch (error) {
        console.log(`❌ Export server not available: ${error.message}`);
        return;
    }

    // Test a quick export
    const testCampaign = {
        name: "Port Test Campaign",
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

    console.log('\n🧪 Testing export functionality...');
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
            console.log(`✅ Export successful: ${result.fileName}`);
            console.log(`📁 Download URL: ${EXPORT_SERVER}${result.downloadUrl}`);
        } else {
            console.log(`❌ Export failed: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Export error: ${error.message}`);
    }

    console.log('\n🎉 Integration test complete!');
    console.log('🌐 You can now access the updated application at: http://localhost:9000');
    console.log('💡 The "Export" and "Export All" buttons should now work with the new server setup!');
}

testNewPortsIntegration().catch(console.error);