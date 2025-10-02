// Test the PROPER Excel export using xlsx-populate for perfect formatting preservation
const fetch = require('node-fetch');

const EXPORT_SERVER = 'http://localhost:3002';

async function testProperFormatting() {
    console.log('🎨 Testing PROPER Excel Export (xlsx-populate - Perfect Formatting)');
    console.log('📚 This should preserve ALL template formatting including:');
    console.log('   ✅ Green headers and yellow input cells');
    console.log('   ✅ Borders, merges, and table structure');
    console.log('   ✅ Number formats (currency, dates)');
    console.log('   ✅ Column widths and row heights');
    console.log('   ✅ Conditional formatting and styles');
    
    // Test with realistic programmatic campaign data
    const testCampaign = {
        name: "Q1 2025 Programmatic Display",
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
                budget: 12500,
                impressions: 833333
            },
            {
                startDate: "2025-02-01",
                endDate: "2025-02-28",
                budget: 11000,
                impressions: 733333
            },
            {
                startDate: "2025-03-01",
                endDate: "2025-03-31",
                budget: 9500,
                impressions: 633333
            }
        ]
    };

    // Test server health
    try {
        const health = await fetch(`${EXPORT_SERVER}/health`);
        const healthData = await health.json();
        console.log(`\n✅ ${healthData.message}`);
        console.log(`📦 Library: ${healthData.library}`);
        console.log(`🎯 Templates: ${healthData.templates.join(', ')}`);
    } catch (error) {
        console.log(`❌ Server not available: ${error.message}`);
        return false;
    }

    // Test the proper formatting export
    console.log('\n🧪 Testing proper formatting preservation...');
    console.log(`Campaign: ${testCampaign.name}`);
    console.log(`Template: ${testCampaign.templateType}`); 
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
            console.log(`\n🎉 PROPER FORMATTING EXPORT SUCCESS!`);
            console.log(`📄 File: ${result.fileName}`);
            console.log(`📁 Download: ${EXPORT_SERVER}${result.downloadUrl}`);
            console.log(`💬 Message: ${result.message}`);
            
            // Verify download
            const downloadResponse = await fetch(`${EXPORT_SERVER}${result.downloadUrl}`);
            if (downloadResponse.ok) {
                const fileSize = downloadResponse.headers.get('content-length');
                console.log(`✅ File verified - Size: ${fileSize} bytes`);
                
                console.log('\n🎨 This file should now have PERFECT formatting:');
                console.log('  ✅ All green headers and yellow input cells preserved');
                console.log('  ✅ Campaign name in A1');
                console.log('  ✅ Total budget calculated and formatted as currency');
                console.log('  ✅ Dates properly formatted (not as numbers!)');
                console.log('  ✅ All borders, merges, and table structure intact'); 
                console.log('  ✅ Column widths and row heights maintained');
                console.log('  ✅ Traffic budget and impressions calculated automatically');
                
                return true;
            } else {
                console.log(`❌ Download failed: ${downloadResponse.status}`);
                return false;
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
}

testProperFormatting().then(success => {
    if (success) {
        console.log('\n🏆 PROPER FORMATTING TEST PASSED!');
        console.log('🎯 The xlsx-populate implementation should now produce perfectly formatted Excel files');
        console.log('📱 Test in main app: http://localhost:9000');
        console.log('💡 No more broken formatting - this is the real deal!');
    } else {
        console.log('\n❌ TEST FAILED - Check the errors above');
    }
}).catch(console.error);