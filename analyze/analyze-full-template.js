const XlsxPopulate = require('xlsx-populate');

async function analyzeFullTemplate() {
    console.log('🔍 Analyzing Full Budget Flighting Template');
    
    try {
        const workbook = await XlsxPopulate.fromFileAsync('./templates/Full Budget Flighting Template.xlsx');
        const sheetNames = workbook.sheets().map(sheet => sheet.name());
        
        console.log('📊 Sheets found in Full template:');
        sheetNames.forEach((name, index) => {
            console.log(`   ${index + 1}. "${name}"`);
        });
        
        console.log('\n🎯 This is perfect for the master template approach!');
        console.log('✅ Load this template, fill each sheet with data, remove unused sheets');
        
        return sheetNames;
    } catch (error) {
        console.error('❌ Error analyzing template:', error.message);
        return null;
    }
}

analyzeFullTemplate();