// Test script for enhanced Excel export functionality
const fetch = require('node-fetch');

const EXPORT_SERVER = 'http://localhost:3001';

// Test data: Small programmatic campaign (within template range)
const smallProgrammaticCampaign = {
    name: "Small Programmatic Test",
    templateType: "programmatic",
    formData: {
        startDate: "2025-01-01",
        endDate: "2025-03-31",
        rate: 12.5
    },
    flights: [
        {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            budget: 10000,
            impressions: 800000
        },
        {
            startDate: "2025-02-01", 
            endDate: "2025-02-28",
            budget: 15000,
            impressions: 1200000
        },
        {
            startDate: "2025-03-01",
            endDate: "2025-03-31", 
            budget: 8000,
            impressions: 640000
        }
    ]
};

// Test data: Large programmatic campaign (exceeding template range)
const largeProgrammaticCampaign = {
    name: "Large Programmatic Test",
    templateType: "programmatic", 
    formData: {
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        rate: 15.0
    },
    flights: Array(60).fill().map((_, i) => ({
        startDate: `2025-${String(Math.floor(i/5) + 1).padStart(2, '0')}-01`,
        endDate: `2025-${String(Math.floor(i/5) + 1).padStart(2, '0')}-${i % 5 === 4 ? '31' : String((i % 5 + 1) * 6).padStart(2, '0')}`,
        budget: 5000 + (i * 100),
        impressions: 400000 + (i * 8000)
    }))
};

// Test data: YouTube campaign
const youtubeCampaign = {
    name: "YouTube Test Campaign",
    templateType: "youtube",
    formData: {
        startDate: "2025-01-01", 
        endDate: "2025-02-28",
        rate: 0.05,
        metricType: "CPV"
    },
    flights: [
        {
            startDate: "2025-01-01",
            endDate: "2025-01-15", 
            budget: 5000,
            views: 100000,
            line: "Week 1"
        },
        {
            startDate: "2025-01-16",
            endDate: "2025-01-31",
            budget: 6000,
            views: 120000,
            line: "Week 2"
        },
        {
            startDate: "2025-02-01",
            endDate: "2025-02-14",
            budget: 5500,
            views: 110000,
            line: "Week 3"
        }
    ]
};

// Test data: SEM/Social campaign  
const semSocialCampaign = {
    name: "SEM Social Test",
    templateType: "sem-social",
    formData: {
        startDate: "2025-01-01",
        endDate: "2025-01-31", 
        rate: 8.0
    },
    flights: [
        {
            startDate: "2025-01-01",
            endDate: "2025-01-07",
            budget: 2000
        },
        {
            startDate: "2025-01-08", 
            endDate: "2025-01-14",
            budget: 2500
        },
        {
            startDate: "2025-01-15",
            endDate: "2025-01-21",
            budget: 2200
        },
        {
            startDate: "2025-01-22",
            endDate: "2025-01-31",
            budget: 1800
        }
    ]
};

async function testExport(campaign, testName) {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`   Campaign: ${campaign.name} (${campaign.templateType})`);
    console.log(`   Flights: ${campaign.flights.length}`);
    
    try {
        const response = await fetch(`${EXPORT_SERVER}/api/export/single`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ campaign })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`HTTP ${response.status}: ${error}`);
        }

        const result = await response.json();
        
        if (result.success) {
            console.log(`   ✅ Success: ${result.fileName}`);
            console.log(`   📁 Download: ${EXPORT_SERVER}${result.downloadUrl}`);
            return true;
        } else {
            console.log(`   ❌ Failed: ${result.message}`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }
}

async function testBulkExport() {
    console.log(`\n🧪 Testing: Bulk Export`);
    console.log(`   Campaigns: 4 (mixed types)`);
    
    const campaigns = [
        smallProgrammaticCampaign,
        youtubeCampaign,
        semSocialCampaign,
        { ...largeProgrammaticCampaign, name: "Large Prog for Bulk" }
    ];
    
    try {
        const response = await fetch(`${EXPORT_SERVER}/api/export/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ campaigns })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`HTTP ${response.status}: ${error}`);
        }

        const result = await response.json();
        
        if (result.success) {
            console.log(`   ✅ Success: ${result.fileName}`);
            console.log(`   📁 Download: ${EXPORT_SERVER}${result.downloadUrl}`);
            return true;
        } else {
            console.log(`   ❌ Failed: ${result.message}`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Enhanced Excel Export Tests');
    
    // Check server health
    console.log('\n🏥 Checking server health...');
    try {
        const health = await fetch(`${EXPORT_SERVER}/health`);
        const healthData = await health.json();
        console.log(`   ✅ Server Status: ${healthData.status}`);
        console.log(`   📋 Templates: ${healthData.templates.join(', ')}`);
    } catch (error) {
        console.log(`   ❌ Server not available: ${error.message}`);
        return;
    }

    const results = [];
    
    // Test individual campaigns
    results.push(await testExport(smallProgrammaticCampaign, "Small Programmatic (3 flights)"));
    results.push(await testExport(largeProgrammaticCampaign, "Large Programmatic (60 flights)"));
    results.push(await testExport(youtubeCampaign, "YouTube Campaign (3 flights)"));
    results.push(await testExport(semSocialCampaign, "SEM/Social Campaign (4 flights)"));
    
    // Test bulk export
    results.push(await testBulkExport());
    
    // Summary
    const successful = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\n📊 Test Summary: ${successful}/${total} tests passed`);
    
    if (successful === total) {
        console.log('🎉 All tests passed! Enhanced Excel export is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Check the errors above.');
    }
}

// Add global fetch if running in Node.js without it
if (typeof fetch === 'undefined') {
    console.log('Installing node-fetch...');
    try {
        global.fetch = require('node-fetch');
    } catch (e) {
        console.log('Please install node-fetch: npm install node-fetch');
        process.exit(1);
    }
}

runTests().catch(console.error);