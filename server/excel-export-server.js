const express = require('express');
const XlsxPopulate = require('xlsx-populate');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();

// CORS middleware
app.use(cors());

// Request size limit and JSON parsing
app.use(express.json({ limit: '10mb' }));

// Request timeout middleware (30 seconds)
app.use((req, res, next) => {
    req.setTimeout(30000);
    res.setTimeout(30000);
    next();
});

// Temporary storage for generated files
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

class ProperExcelExporter {
    constructor() {
        // Template paths for individual files
        this.templatePaths = {
            'programmatic': path.join(__dirname, '../templates/Programmatic Budget Flighting Template.xlsx'),
            'youtube': path.join(__dirname, '../templates/YouTube Budget Flighting Template.xlsx'),
            'sem-social': path.join(__dirname, '../templates/SEM_Social Budget Flighting Template.xlsx'),
            'full': path.join(__dirname, '../templates/Full Budget Flighting Template.xlsx')
        };
        
        // Define exactly where data goes in each template
        this.templateConfigs = {
            'programmatic': {
                campaignNameCell: 'A1',
                totalBudgetCell: 'C4',           // Fixed: Total Budget goes in C4
                totalImpressionsCell: 'C5',      // Fixed: Total Impressions goes in C5  
                startDateHeaderCell: 'F3',
                endDateHeaderCell: 'F4',
                evenMonthlyCell: 'F5',           // Fixed: Even Monthly (Y/N) cell
                dataStartRow: 13,
                monthlyColumns: {                // Fixed: Monthly budget columns (when Even Monthly = Y)
                    start: 'B',      // Start date
                    end: 'C',        // End date  
                    budget: 'D',     // Budget
                    imps: 'E',       // Impressions
                    traffBudget: 'F', // Traffic Budget
                    traffImps: 'G'   // Traffic Impressions
                },
                customColumns: {                 // Fixed: Custom budget columns (when Even Monthly = N)
                    start: 'H',      // Start date
                    end: 'I',        // End date  
                    budget: 'J',     // Budget
                    imps: 'K',       // Impressions
                    traffBudget: 'L', // Traffic Budget
                    traffImps: 'M'   // Traffic Impressions
                }
            },
            'youtube': {
                campaignNameCell: 'A1',
                totalBudgetCell: 'B3',
                startDateHeaderCell: 'F3',
                endDateHeaderCell: 'F4',
                dataStartRow: 9,
                columns: {
                    line: 'B',       // Line item
                    start: 'C',      // Start date
                    end: 'D',        // End date
                    budget: 'E'      // Budget
                }
            },
            'sem-social': {
                campaignNameCell: 'A1', 
                totalBudgetCell: 'B3',
                startDateHeaderCell: 'F3',
                endDateHeaderCell: 'F4',
                dataStartRow: 11,
                columns: {
                    start: 'B',      // Start date
                    end: 'C',        // End date
                    budget: 'D'      // Budget
                }
            }
        };
    }

    // Convert date string to JS Date object (fix timezone offset issues)
    parseDate(dateString) {
        if (!dateString) return null;
        // Parse the date and adjust for timezone to avoid off-by-one errors
        const date = new Date(dateString + 'T00:00:00');
        return date;
    }
    
    // Check if all budgets are the same (even monthly) or different (custom)
    isEvenMonthly(flights) {
        if (flights.length <= 1) return true;
        const firstBudget = flights[0].budget || 0;
        return flights.every(flight => (flight.budget || 0) === firstBudget);
    }

    // Export single campaign with perfect formatting preservation
    async exportSingleCampaign(campaign) {
        const templateType = campaign.templateType || 'programmatic';
        const templatePath = this.templatePaths[templateType];
        const config = this.templateConfigs[templateType];
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templatePath}`);
        }

        if (!config) {
            throw new Error(`No configuration found for template type: ${templateType}`);
        }

        console.log(`Loading template: ${templatePath}`);
        console.log(`Campaign: ${campaign.name} (${templateType}) with ${campaign.flights.length} flights`);

        // Load the template workbook with xlsx-populate (preserves ALL styles)
        const workbook = await XlsxPopulate.fromFileAsync(templatePath);
        const sheet = workbook.sheet(0); // Use first sheet

        // Fill campaign header information
        const totalBudget = campaign.flights.reduce((sum, flight) => sum + (flight.budget || 0), 0);
        const totalImpressions = campaign.flights.reduce((sum, flight) => sum + (flight.impressions || 0), 0);
        
        // Set campaign name
        if (config.campaignNameCell) {
            sheet.cell(config.campaignNameCell).value(campaign.name);
        }
        
        // Set total budget in correct cell (C4 for programmatic)
        if (config.totalBudgetCell) {
            sheet.cell(config.totalBudgetCell).value(totalBudget);
        }
        
        // Set total impressions in correct cell (C5 for programmatic)  
        if (config.totalImpressionsCell && templateType === 'programmatic') {
            sheet.cell(config.totalImpressionsCell).value(totalImpressions);
        }
        
        // Set campaign date range in header
        if (campaign.formData) {
            if (config.startDateHeaderCell && campaign.formData.startDate) {
                sheet.cell(config.startDateHeaderCell).value(this.parseDate(campaign.formData.startDate));
            }
            if (config.endDateHeaderCell && campaign.formData.endDate) {
                sheet.cell(config.endDateHeaderCell).value(this.parseDate(campaign.formData.endDate));
            }
        }

        // Fill flight data rows - ONLY VALUES, preserving all existing formatting
        campaign.flights.forEach((flight, index) => {
            const rowNum = config.dataStartRow + index;
            
            if (templateType === 'programmatic') {
                // Determine if budgets are even (same) or custom (different)
                const evenMonthly = this.isEvenMonthly(campaign.flights);
                const columns = evenMonthly ? config.monthlyColumns : config.customColumns;
                
                // Set Even Monthly Y/N in F5
                if (config.evenMonthlyCell) {
                    sheet.cell(config.evenMonthlyCell).value(evenMonthly ? 'Y' : 'N');
                }
                
                // Fill flight data in appropriate columns (B13:G52 for even, H13:M52 for custom)
                sheet.cell(`${columns.start}${rowNum}`).value(this.parseDate(flight.startDate));
                sheet.cell(`${columns.end}${rowNum}`).value(this.parseDate(flight.endDate));
                sheet.cell(`${columns.budget}${rowNum}`).value(flight.budget || 0);
                sheet.cell(`${columns.imps}${rowNum}`).value(flight.impressions || 0);
                // Traffic budget is typically 1% more than regular budget
                sheet.cell(`${columns.traffBudget}${rowNum}`).value(Math.round((flight.budget || 0) * 1.01));
                // Traffic impressions match regular impressions  
                sheet.cell(`${columns.traffImps}${rowNum}`).value(flight.impressions || 0);
                
            } else if (templateType === 'youtube') {
                // Fill YouTube columns
                sheet.cell(`${config.columns.line}${rowNum}`).value(flight.line || `Week ${index + 1}`);
                sheet.cell(`${config.columns.start}${rowNum}`).value(this.parseDate(flight.startDate));
                sheet.cell(`${config.columns.end}${rowNum}`).value(this.parseDate(flight.endDate));
                sheet.cell(`${config.columns.budget}${rowNum}`).value(flight.budget || 0);
                
            } else if (templateType === 'sem-social') {
                // Fill SEM/Social columns
                sheet.cell(`${config.columns.start}${rowNum}`).value(this.parseDate(flight.startDate));
                sheet.cell(`${config.columns.end}${rowNum}`).value(this.parseDate(flight.endDate));
                sheet.cell(`${config.columns.budget}${rowNum}`).value(flight.budget || 0);
            }
        });

        // Generate unique filename
        const timestamp = Date.now();
        const safeName = campaign.name.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${safeName}_${timestamp}.xlsx`;
        const filePath = path.join(TEMP_DIR, fileName);

        // Write the workbook - xlsx-populate preserves ALL original formatting!
        await workbook.toFileAsync(filePath);
        
        console.log(`Excel file generated with proper formatting: ${filePath}`);
        
        return {
            success: true,
            fileName,
            downloadUrl: `/api/export/download/${fileName}`,
            message: `Excel export completed for ${campaign.name} with preserved formatting`
        };
    }

    // Export multiple campaigns using master template approach (preserves ALL formatting)
    async exportMultipleCampaigns(campaigns) {
        if (!campaigns || campaigns.length === 0) {
            throw new Error('No campaigns provided for export');
        }

        console.log(`Bulk export: ${campaigns.length} campaigns using master template approach`);
        
        // Load the master template that contains all pre-styled sheets
        const masterTemplatePath = './templates/Full Budget Flighting Template.xlsx';
        if (!fs.existsSync(masterTemplatePath)) {
            throw new Error(`Master template not found: ${masterTemplatePath}`);
        }
        
        const workbook = await XlsxPopulate.fromFileAsync(masterTemplatePath);
        
        // Template type to sheet name mapping (based on analysis)
        const templateToSheetName = {
            'programmatic': 'PRG Standard Template',
            'youtube': 'YouTube Template', 
            'sem-social': 'SEM + Social Template'
        };
        
        // Track which sheets we're using
        const usedSheets = new Set();
        
        // Group campaigns by template type
        const campaignsByTemplate = {};
        campaigns.forEach(campaign => {
            const templateType = campaign.templateType || 'programmatic';
            if (!campaignsByTemplate[templateType]) {
                campaignsByTemplate[templateType] = [];
            }
            campaignsByTemplate[templateType].push(campaign);
        });
        
        // Process each template type
        Object.entries(campaignsByTemplate).forEach(([templateType, campaignsOfType]) => {
            const sheetName = templateToSheetName[templateType];
            const config = this.templateConfigs[templateType];
            
            if (!sheetName || !config) {
                console.warn(`No sheet mapping for template type: ${templateType}`);
                return;
            }
            
            console.log(`Processing ${campaignsOfType.length} campaigns of type: ${templateType} → "${sheetName}"`);
            usedSheets.add(sheetName);
            
            const sheet = workbook.sheet(sheetName);
            
            // If multiple campaigns of same type, we'll fill the first one and duplicate the sheet for others
            campaignsOfType.forEach((campaign, index) => {
                let targetSheet = sheet;
                
                if (index > 0) {
                    // Create a copy of the sheet for additional campaigns of same type
                    try {
                        const clonedSheet = sheet.clone();
                        const campaignSheetName = campaign.name.substring(0, 31);
                        clonedSheet.name(campaignSheetName);
                        workbook.addSheet(clonedSheet);
                        targetSheet = clonedSheet;
                        usedSheets.add(campaignSheetName);
                    } catch (error) {
                        console.warn(`Could not clone sheet for ${campaign.name}:`, error.message);
                        return;
                    }
                } else {
                    // Rename the original sheet to the campaign name
                    targetSheet.name(campaign.name.substring(0, 31));
                }
                
                // Fill campaign data into the pre-styled sheet (preserves ALL formatting)
                const totalBudget = campaign.flights.reduce((sum, flight) => sum + (flight.budget || 0), 0);
                const totalImpressions = campaign.flights.reduce((sum, flight) => sum + (flight.impressions || 0), 0);
                
                // Fill header information
                if (config.campaignNameCell) {
                    targetSheet.cell(config.campaignNameCell).value(campaign.name);
                }
                if (config.totalBudgetCell) {
                    targetSheet.cell(config.totalBudgetCell).value(totalBudget);
                }
                if (config.totalImpressionsCell && templateType === 'programmatic') {
                    targetSheet.cell(config.totalImpressionsCell).value(totalImpressions);
                }
                if (campaign.formData) {
                    if (config.startDateHeaderCell && campaign.formData.startDate) {
                        targetSheet.cell(config.startDateHeaderCell).value(this.parseDate(campaign.formData.startDate));
                    }
                    if (config.endDateHeaderCell && campaign.formData.endDate) {
                        targetSheet.cell(config.endDateHeaderCell).value(this.parseDate(campaign.formData.endDate));
                    }
                }

                // Fill flight data with proper template logic
                campaign.flights.forEach((flight, flightIndex) => {
                    const rowNum = config.dataStartRow + flightIndex;
                    
                    if (templateType === 'programmatic') {
                        // Determine if budgets are even (same) or custom (different)
                        const evenMonthly = this.isEvenMonthly(campaign.flights);
                        const columns = evenMonthly ? config.monthlyColumns : config.customColumns;
                        
                        // Set Even Monthly Y/N in F5
                        if (config.evenMonthlyCell) {
                            targetSheet.cell(config.evenMonthlyCell).value(evenMonthly ? 'Y' : 'N');
                        }
                        
                        // Fill flight data in appropriate columns
                        targetSheet.cell(`${columns.start}${rowNum}`).value(this.parseDate(flight.startDate));
                        targetSheet.cell(`${columns.end}${rowNum}`).value(this.parseDate(flight.endDate));
                        targetSheet.cell(`${columns.budget}${rowNum}`).value(flight.budget || 0);
                        targetSheet.cell(`${columns.imps}${rowNum}`).value(flight.impressions || 0);
                        targetSheet.cell(`${columns.traffBudget}${rowNum}`).value(Math.round((flight.budget || 0) * 1.01));
                        targetSheet.cell(`${columns.traffImps}${rowNum}`).value(flight.impressions || 0);
                    } else if (templateType === 'youtube') {
                        targetSheet.cell(`${config.columns.line}${rowNum}`).value(flight.line || `Week ${flightIndex + 1}`);
                        targetSheet.cell(`${config.columns.start}${rowNum}`).value(this.parseDate(flight.startDate));
                        targetSheet.cell(`${config.columns.end}${rowNum}`).value(this.parseDate(flight.endDate));
                        targetSheet.cell(`${config.columns.budget}${rowNum}`).value(flight.budget || 0);
                    } else if (templateType === 'sem-social') {
                        targetSheet.cell(`${config.columns.start}${rowNum}`).value(this.parseDate(flight.startDate));
                        targetSheet.cell(`${config.columns.end}${rowNum}`).value(this.parseDate(flight.endDate));
                        targetSheet.cell(`${config.columns.budget}${rowNum}`).value(flight.budget || 0);
                    }
                });
                
                console.log(`✅ Filled ${templateType} sheet "${targetSheet.name()}" with ${campaign.flights.length} flights`);
            });
        });
        
        // Remove unused template sheets to clean up the workbook
        const allSheetNames = Object.values(templateToSheetName);
        allSheetNames.forEach(sheetName => {
            if (!usedSheets.has(sheetName)) {
                try {
                    workbook.deleteSheet(sheetName);
                    console.log(`🗑️ Removed unused template sheet: ${sheetName}`);
                } catch (error) {
                    console.warn(`Could not remove sheet ${sheetName}:`, error.message);
                }
            }
        });
        
        // Generate filename for bulk export
        const timestamp = Date.now();
        const fileName = `FlightPlans_AllFormatted_${timestamp}.xlsx`;
        const filePath = path.join(TEMP_DIR, fileName);

        // Write the workbook - ALL sheets preserve their original formatting!
        await workbook.toFileAsync(filePath);
        
        console.log(`🎨 Bulk Excel file with PERFECT formatting for all sheets: ${filePath}`);
        
        return {
            success: true,
            fileName,
            downloadUrl: `/api/export/download/${fileName}`,
            message: `Bulk export completed for ${campaigns.length} campaigns - ALL sheets preserve perfect formatting`
        };
    }
}

const exporter = new ProperExcelExporter();

// Validation helper functions
function validateCampaign(campaign) {
    const errors = [];

    if (!campaign) {
        errors.push('Campaign object is required');
        return { valid: false, errors };
    }

    if (!campaign.name || typeof campaign.name !== 'string') {
        errors.push('Campaign name is required and must be a string');
    }

    if (!campaign.templateType) {
        errors.push('Template type is required');
    } else if (!['programmatic', 'youtube', 'sem-social', 'full'].includes(campaign.templateType)) {
        errors.push(`Invalid template type: ${campaign.templateType}. Must be one of: programmatic, youtube, sem-social, full`);
    }

    if (!campaign.flights || !Array.isArray(campaign.flights)) {
        errors.push('Flights array is required');
    } else if (campaign.flights.length === 0) {
        errors.push('At least one flight is required');
    }

    return { valid: errors.length === 0, errors };
}

function validateCampaigns(campaigns) {
    const errors = [];

    if (!Array.isArray(campaigns)) {
        errors.push('Campaigns must be an array');
        return { valid: false, errors };
    }

    if (campaigns.length === 0) {
        errors.push('At least one campaign is required');
        return { valid: false, errors };
    }

    campaigns.forEach((campaign, index) => {
        const validation = validateCampaign(campaign);
        if (!validation.valid) {
            errors.push(`Campaign ${index + 1} (${campaign?.name || 'Unknown'}): ${validation.errors.join(', ')}`);
        }
    });

    return { valid: errors.length === 0, errors };
}

// Health check endpoint with detailed status
app.get('/health', (req, res) => {
    try {
        const templates = {};
        Object.entries(exporter.templatePaths).forEach(([key, filepath]) => {
            templates[key] = {
                path: filepath,
                exists: fs.existsSync(filepath),
                size: fs.existsSync(filepath) ? `${(fs.statSync(filepath).size / 1024).toFixed(2)} KB` : null
            };
        });

        const tempDirWritable = fs.existsSync(TEMP_DIR) && fs.accessSync(TEMP_DIR, fs.constants.W_OK) === undefined;

        res.json({
            status: 'OK',
            message: 'Excel export server running',
            server: {
                library: 'xlsx-populate',
                expressVersion: require('express/package.json').version,
                nodeVersion: process.version,
                uptime: `${Math.floor(process.uptime())} seconds`,
                memory: {
                    used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
                    total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
                }
            },
            templates,
            tempDir: {
                path: TEMP_DIR,
                exists: fs.existsSync(TEMP_DIR),
                writable: tempDirWritable
            },
            supportedTemplateTypes: Object.keys(exporter.templateConfigs)
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Health check failed',
            error: error.message
        });
    }
});

// Export single campaign
app.post('/api/export/single', async (req, res) => {
    const startTime = Date.now();
    try {
        const { campaign } = req.body;

        console.log(`[${new Date().toISOString()}] Export request: ${campaign?.name || 'Unknown'} (${campaign?.templateType || 'Unknown'})`);

        // Validate campaign data
        const validation = validateCampaign(campaign);
        if (!validation.valid) {
            console.error('Validation failed:', validation.errors);
            return res.status(400).json({
                success: false,
                message: 'Campaign validation failed',
                errors: validation.errors
            });
        }

        const result = await exporter.exportSingleCampaign(campaign);
        const duration = Date.now() - startTime;

        console.log(`[${new Date().toISOString()}] Export completed in ${duration}ms: ${result.fileName}`);
        res.json(result);

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[${new Date().toISOString()}] Export failed after ${duration}ms:`, error.message);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: `Export failed: ${error.message}`
        });
    }
});

// Export multiple campaigns
app.post('/api/export/bulk', async (req, res) => {
    const startTime = Date.now();
    try {
        const { campaigns } = req.body;

        console.log(`[${new Date().toISOString()}] Bulk export request: ${campaigns?.length || 0} campaigns`);

        // Validate campaigns data
        const validation = validateCampaigns(campaigns);
        if (!validation.valid) {
            console.error('Validation failed:', validation.errors);
            return res.status(400).json({
                success: false,
                message: 'Campaigns validation failed',
                errors: validation.errors
            });
        }

        const result = await exporter.exportMultipleCampaigns(campaigns);
        const duration = Date.now() - startTime;

        console.log(`[${new Date().toISOString()}] Bulk export completed in ${duration}ms: ${result.fileName}`);
        res.json(result);

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[${new Date().toISOString()}] Bulk export failed after ${duration}ms:`, error.message);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: `Bulk export failed: ${error.message}`
        });
    }
});

// Template info endpoint
app.get('/api/templates/info', (req, res) => {
    try {
        const templateInfo = {
            availableTypes: ['programmatic', 'youtube', 'sem-social', 'full'],
            templates: {
                programmatic: {
                    name: 'Programmatic Budget Flighting Template',
                    description: 'For programmatic advertising campaigns',
                    path: './templates/Programmatic Budget Flighting Template.xlsx'
                },
                youtube: {
                    name: 'YouTube Budget Flighting Template',
                    description: 'For YouTube video campaigns',
                    path: './templates/YouTube Budget Flighting Template.xlsx'
                },
                'sem-social': {
                    name: 'SEM/Social Budget Flighting Template',
                    description: 'For SEM and Social media campaigns',
                    path: './templates/SEM_Social Budget Flighting Template.xlsx'
                },
                full: {
                    name: 'Full Budget Flighting Template',
                    description: 'Master template containing all sheet types',
                    path: './templates/Full Budget Flighting Template.xlsx'
                }
            }
        };
        
        res.json(templateInfo);
    } catch (error) {
        console.error('Template info error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Download endpoint
app.get('/api/export/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(TEMP_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            message: 'File not found'
        });
    }
    
    res.download(filePath, filename, (err) => {
        if (err) {
            console.error('Download error:', err);
            res.status(500).json({
                success: false,
                message: 'Download failed'
            });
        } else {
            // Clean up file after download
            setTimeout(() => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }, 5000); // Delete after 5 seconds
        }
    });
});

const PORT = process.env.PORT || 3001;

// Startup validation
function validateStartup() {
    const errors = [];

    // Check temp directory
    if (!fs.existsSync(TEMP_DIR)) {
        errors.push(`Temp directory does not exist: ${TEMP_DIR}`);
    } else {
        try {
            fs.accessSync(TEMP_DIR, fs.constants.W_OK);
        } catch (err) {
            errors.push(`Temp directory is not writable: ${TEMP_DIR}`);
        }
    }

    // Check all template files exist
    const missingTemplates = [];
    Object.entries(exporter.templatePaths).forEach(([type, filepath]) => {
        if (!fs.existsSync(filepath)) {
            missingTemplates.push(`${type}: ${filepath}`);
        }
    });

    if (missingTemplates.length > 0) {
        errors.push(`Missing template files:\n  - ${missingTemplates.join('\n  - ')}`);
    }

    return { valid: errors.length === 0, errors };
}

// Start server with validation
const validation = validateStartup();

if (!validation.valid) {
    console.error('❌ Server startup validation failed:');
    validation.errors.forEach(err => console.error(`  - ${err}`));
    console.error('\n⚠️  Server will start but may not function correctly!');
    console.error('Please fix the above issues and restart.\n');
}

app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Excel Export Server`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Status: ${validation.valid ? '✅ READY' : '⚠️  WARNING - See errors above'}`);
    console.log(`Port: ${PORT}`);
    console.log(`Library: xlsx-populate v${require('xlsx-populate/package.json').version}`);
    console.log(`Express: v${require('express/package.json').version}`);
    console.log(`Node: ${process.version}`);
    console.log(`${'='.repeat(60)}`);

    console.log('\n📁 Template Status:');
    Object.entries(exporter.templatePaths).forEach(([type, filepath]) => {
        const exists = fs.existsSync(filepath);
        const size = exists ? `(${(fs.statSync(filepath).size / 1024).toFixed(1)} KB)` : '';
        console.log(`  ${exists ? '✅' : '❌'} ${type.padEnd(15)} ${size}`);
    });

    console.log('\n🌐 Endpoints:');
    console.log(`  GET  http://localhost:${PORT}/health`);
    console.log(`  POST http://localhost:${PORT}/api/export/single`);
    console.log(`  POST http://localhost:${PORT}/api/export/bulk`);
    console.log(`  GET  http://localhost:${PORT}/api/templates/info`);

    console.log(`\n${'='.repeat(60)}\n`);
});