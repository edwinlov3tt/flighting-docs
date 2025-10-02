const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('LINE ITEM_Budget Flighting_20221201 R1.xlsx');

console.log('=== Excel Template Analysis ===\n');
console.log('Sheet Names:', workbook.SheetNames.filter(name => !name.includes('microsoft')));
console.log('');

// Analyze each template sheet
const templates = ['PRG Standard Template', 'YouTube Template', 'SEM + Social Template'];

templates.forEach(sheetName => {
    console.log(`\n=== ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    
    // Get the range of the sheet
    const range = XLSX.utils.decode_range(sheet['!ref']);
    console.log(`Rows: ${range.e.r + 1}, Columns: ${range.e.c + 1}`);
    
    // Extract headers and structure
    console.log('\nHeader Row (Row 1-10):');
    for (let row = 0; row < Math.min(10, range.e.r + 1); row++) {
        const rowData = [];
        for (let col = 0; col <= Math.min(10, range.e.c); col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = sheet[cellAddress];
            rowData.push(cell ? (cell.v || '').toString().substring(0, 20) : '');
        }
        console.log(`Row ${row + 1}:`, rowData.filter(v => v).join(' | '));
    }
    
    // Look for flight data rows
    console.log('\nFlight Data Structure (Rows 11-15):');
    for (let row = 10; row < Math.min(15, range.e.r + 1); row++) {
        const rowData = [];
        for (let col = 0; col <= Math.min(10, range.e.c); col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = sheet[cellAddress];
            if (cell) {
                // Check if it's a formula
                if (cell.f) {
                    rowData.push(`[Formula: ${cell.f.substring(0, 15)}...]`);
                } else {
                    rowData.push((cell.v || '').toString().substring(0, 15));
                }
            } else {
                rowData.push('');
            }
        }
        console.log(`Row ${row + 1}:`, rowData.filter(v => v).join(' | '));
    }
});

// Create a summary of the structure
console.log('\n\n=== Template Structure Summary ===');
templates.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    console.log(`\n${sheetName}:`);
    
    // Find key cells
    const keyLocations = {};
    const range = XLSX.utils.decode_range(sheet['!ref']);
    
    for (let row = 0; row <= Math.min(15, range.e.r); row++) {
        for (let col = 0; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = sheet[cellAddress];
            if (cell && cell.v) {
                const value = cell.v.toString();
                if (value.includes('Flight Start') || value.includes('Start')) {
                    keyLocations['Flight Start'] = cellAddress;
                }
                if (value.includes('Total Budget') || value.includes('Budget')) {
                    keyLocations['Total Budget'] = cellAddress;
                }
                if (value.includes('CPM') || value.includes('CPV')) {
                    keyLocations['Rate'] = cellAddress;
                }
                if (value.includes('Impressions') || value.includes('Views')) {
                    keyLocations['Metrics'] = cellAddress;
                }
            }
        }
    }
    
    console.log('  Key Locations:', keyLocations);
});