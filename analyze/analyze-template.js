const XLSX = require('xlsx');
const fs = require('fs');

const templatePath = './templates/Programmatic Budget Flighting Template.xlsx';

if (!fs.existsSync(templatePath)) {
    console.log('Template file not found:', templatePath);
    process.exit(1);
}

console.log('=== Programmatic Template Analysis ===\n');

const workbook = XLSX.readFile(templatePath);
console.log('Sheet Names:', workbook.SheetNames);

const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Get the range of the sheet
const range = XLSX.utils.decode_range(sheet['!ref']);
console.log(`\nSheet Range: ${sheet['!ref']}`);
console.log(`Rows: ${range.e.r + 1}, Columns: ${range.e.c + 1}`);

console.log('\n=== Key Cells Analysis ===');

// Look at cells around the expected fillable area
for (let row = 10; row <= 20; row++) {
    const aVal = sheet[`A${row}`]?.v;
    const bVal = sheet[`B${row}`]?.v;
    const cVal = sheet[`C${row}`]?.v;
    const dVal = sheet[`D${row}`]?.v;
    
    if (aVal || bVal || cVal || dVal) {
        console.log(`Row ${row}: A="${aVal || ''}" | B="${bVal || ''}" | C="${cVal || ''}" | D="${dVal || ''}"`);
    }
}

console.log('\n=== Looking for header patterns ===');

// Search for common header words
const searchTerms = ['Flight', 'Start', 'End', 'Budget', 'Monthly', 'Custom'];
Object.keys(sheet).forEach(cellAddr => {
    const cell = sheet[cellAddr];
    if (cell && cell.v && typeof cell.v === 'string') {
        searchTerms.forEach(term => {
            if (cell.v.toLowerCase().includes(term.toLowerCase())) {
                console.log(`Found "${term}" in ${cellAddr}: "${cell.v}"`);
            }
        });
    }
});

console.log('\n=== Column headers around row 12 ===');
for (let col = 0; col < 10; col++) {
    const colLetter = String.fromCharCode(65 + col); // A, B, C, etc.
    const cell12 = sheet[`${colLetter}12`];
    const cell13 = sheet[`${colLetter}13`];
    
    if (cell12?.v || cell13?.v) {
        console.log(`${colLetter}12: "${cell12?.v || ''}" | ${colLetter}13: "${cell13?.v || ''}"`);
    }
}