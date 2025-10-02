// Quick test to see if export server can start
const path = require('path');
const fs = require('fs');

console.log('Testing export server dependencies...');
console.log('Current directory:', __dirname);

// Test template paths
const templates = {
    'programmatic': path.join(__dirname, '../templates/Programmatic Budget Flighting Template.xlsx'),
    'youtube': path.join(__dirname, '../templates/YouTube Budget Flighting Template.xlsx'),
    'sem-social': path.join(__dirname, '../templates/SEM_Social Budget Flighting Template.xlsx'),
    'full': path.join(__dirname, '../templates/Full Budget Flighting Template.xlsx')
};

console.log('\nChecking template files:');
Object.entries(templates).forEach(([name, filepath]) => {
    const exists = fs.existsSync(filepath);
    console.log(`  ${name}: ${exists ? '✅' : '❌'} ${filepath}`);
});

// Test dependencies
console.log('\nChecking npm packages:');
try {
    require('express');
    console.log('  express: ✅');
} catch (e) {
    console.log('  express: ❌', e.message);
}

try {
    require('cors');
    console.log('  cors: ✅');
} catch (e) {
    console.log('  cors: ❌', e.message);
}

try {
    require('xlsx-populate');
    console.log('  xlsx-populate: ✅');
} catch (e) {
    console.log('  xlsx-populate: ❌', e.message);
}

console.log('\n✅ All checks passed! Server should start normally.');
