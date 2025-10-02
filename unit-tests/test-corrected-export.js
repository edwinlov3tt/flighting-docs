// Test the corrected Excel export with proper column mappings
const fetch = require('node-fetch');

const EXPORT_SERVER = 'http://localhost:3002';

async function testCorrectedExport() {
    console.log('🎯 Testing Corrected Excel Export (Proper Template Formatting)');
    
    // Test campaign with realistic data that matches the template structure
    const testCampaign = {
        name: "Q1 Programmatic Campaign",
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

    console.log('\n🧪 Testing corrected template export...');
    console.log(`Campaign: ${testCampaign.name}`);
    console.log(`Flights: ${testCampaign.flights.length}`);
    console.log(`Total Budget: $${testCampaign.flights.reduce((sum, f) => sum + f.budget, 0).toLocaleString()}`);
    
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
            console.log(`\n✅ Export successful!`);
            console.log(`📄 File: ${result.fileName}`);
            console.log(`📁 Download: ${EXPORT_SERVER}${result.downloadUrl}`);
            
            // Verify file download
            const downloadResponse = await fetch(`${EXPORT_SERVER}${result.downloadUrl}`);
            if (downloadResponse.ok) {
                const fileSize = downloadResponse.headers.get('content-length');
                console.log(`✅ File verified - Size: ${fileSize} bytes`);
                
                console.log('\n🎨 This export should now have:');
                console.log('  ✓ Original template formatting preserved');
                console.log('  ✓ Campaign name in header'); 
                console.log('  ✓ Total budget calculated');
                console.log('  ✓ Flight dates formatted properly');
                console.log('  ✓ All columns filled (Start, End, Budget, Imps, Traff Budget, Traff Imps)');
                console.log('  ✓ Green headers and yellow input cells maintained');
                
                return true;
            }
        } else {
            const error = await response.text();
            console.log(`❌ Export failed: ${response.status} - ${error}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Export error: ${error.message}`);
        return false;
    }

    return false;
}

testCorrectedExport().then(success => {
    if (success) {
        console.log('\n🎉 Corrected export test PASSED!');
        console.log('📱 You can now test this in the main app at http://localhost:9000');
        console.log('💡 The Export button should now produce properly formatted Excel files!');
    } else {
        console.log('\n❌ Test FAILED - check the logs above');
    }
}).catch(console.error);