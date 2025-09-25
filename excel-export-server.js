const express = require('express');
const XLSX = require('xlsx');
const XlsxPopulate = require('xlsx-populate');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// Temporary storage for generated files
const TEMP_DIR = './temp';
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

class ExcelExporter {
    constructor() {
        // Load all template files
        this.templates = {
            'programmatic': './templates/Programmatic Budget Flighting Template.xlsx',
            'youtube': './templates/YouTube Budget Flighting Template.xlsx',
            'sem-social': './templates/SEM_Social Budget Flighting Template.xlsx',
            'default': './templates/Full Budget Flighting Template.xlsx'
        };

        // Pre-load all templates to catch errors early
        this.templateWorkbooks = {};
        this.populateWorkbooks = {};

        for (const [type, path] of Object.entries(this.templates)) {
            try {
                // Load with both libraries for flexibility
                this.templateWorkbooks[type] = XLSX.readFile(path);
                // We'll load xlsx-populate templates async when needed
                console.log(`Loaded ${type} template: ${path}`);
            } catch (error) {
                console.error(`Failed to load ${type} template: ${path}`, error.message);
            }
        }
    }

    // Convert date string to Excel date number (timezone-safe)
    dateToExcel(dateString) {
        if (!dateString) return '';

        // Handle timezone issues by parsing as local date
        let date;
        if (typeof dateString === 'string') {
            // Parse as local date to avoid timezone shifts
            // If it's in format "YYYY-MM-DD", parse as local
            if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = dateString.split('-').map(Number);
                date = new Date(year, month - 1, day); // month is 0-indexed
            } else {
                date = new Date(dateString);
            }
        } else {
            date = new Date(dateString);
        }

        // Excel dates start from 1900-01-01
        const excelEpoch = new Date(1900, 0, 1);
        const msPerDay = 24 * 60 * 60 * 1000;
        // Excel has a leap year bug for 1900, so we add 2 days
        const excelDate = Math.floor((date - excelEpoch) / msPerDay) + 2;

        return excelDate;
    }

    // Calculate active days in a flight
    getActiveDays(startDate, endDate) {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
        return diffDays;
    }

    // Load template with xlsx-populate for better format preservation
    async loadTemplateWithPopulate(templateType) {
        const templatePath = this.templates[templateType] || this.templates['default'];
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templatePath}`);
        }

        try {
            return await XlsxPopulate.fromFileAsync(templatePath);
        } catch (error) {
            console.error(`Failed to load template with xlsx-populate: ${templatePath}`, error);
            throw error;
        }
    }

    // Enhanced single campaign export using xlsx-populate
    async exportSingleCampaignEnhanced(campaign) {
        try {
            console.log(`Exporting campaign (enhanced): ${campaign.name || 'Unnamed'} (${campaign.templateType})`);

            // Load template with xlsx-populate
            const templateType = campaign.templateType || 'default';
            const workbook = await this.loadTemplateWithPopulate(templateType);

            // Get the first sheet
            const sheet = workbook.sheet(0);
            if (!sheet) {
                throw new Error('Template has no sheets');
            }

            console.log(`Using sheet: ${sheet.name()} for enhanced export`);

            // Apply data mapping based on template type
            await this.applyEnhancedMapping(sheet, campaign, templateType);

            // Generate file with campaign name
            const sanitizedCampaignName = campaign.name.replace(/[^\w\s-]/g, '').trim();
            const fileName = `${sanitizedCampaignName}.xlsx`;
            const filePath = path.join(TEMP_DIR, fileName);

            await workbook.toFileAsync(filePath);

            return { fileName, filePath };

        } catch (error) {
            console.error('Enhanced export error:', error);
            throw new Error(`Failed to export campaign (enhanced): ${error.message}`);
        }
    }

    // Apply enhanced data mapping that preserves formulas and formatting
    async applyEnhancedMapping(sheet, campaign, templateType) {
        let mappedData;

        // Get mapped data using existing methods
        switch (templateType) {
            case 'programmatic':
                mappedData = this.mapProgrammaticData(campaign);
                break;
            case 'youtube':
                mappedData = this.mapYouTubeData(campaign);
                break;
            case 'sem-social':
                mappedData = this.mapSEMSocialData(campaign);
                break;
            default:
                mappedData = this.mapProgrammaticData(campaign);
        }

        // Apply header data
        if (mappedData && mappedData.header) {
            Object.entries(mappedData.header).forEach(([cellAddress, value]) => {
                try {
                    const cell = sheet.cell(cellAddress);
                    if (value instanceof Date || (typeof value === 'number' && cellAddress.match(/[0-9]/) && value > 40000)) {
                        // Handle dates properly
                        cell.value(value);
                    } else {
                        cell.value(value);
                    }
                    console.log(`Set ${cellAddress} = ${value}`);
                } catch (error) {
                    console.warn(`Failed to set cell ${cellAddress}:`, error.message);
                }
            });
        }

        // Apply flight data
        if (mappedData && mappedData.flights) {
            mappedData.flights.forEach((flight, index) => {
                Object.entries(flight.data).forEach(([col, value]) => {
                    try {
                        const cellAddress = `${col}${flight.row}`;
                        const cell = sheet.cell(cellAddress);

                        if (value instanceof Date || (typeof value === 'number' && col.match(/[BC]/) && value > 40000)) {
                            // Handle dates properly for date columns
                            cell.value(value);
                        } else {
                            cell.value(value);
                        }
                        console.log(`Set flight ${index + 1} ${cellAddress} = ${value}`);
                    } catch (error) {
                        console.warn(`Failed to set flight cell ${col}${flight.row}:`, error.message);
                    }
                });
            });
        }
    }

    // Map campaign data to Excel template format
    mapProgrammaticData(campaign) {
        const totalBudget = campaign.flights.reduce((sum, f) => sum + f.budget, 0);
        const totalImpressions = campaign.flights.reduce((sum, f) => sum + (f.impressions || 0), 0);
        const cpm = totalImpressions > 0 ? (totalBudget / totalImpressions) * 1000 : 0;

        return {
            header: {
                'C4': totalBudget,                                   // Total Budget goes in C4
                'F3': this.dateToExcel(campaign.formData.startDate), // Flight Start goes in F3
                'F4': this.dateToExcel(campaign.formData.endDate),   // Flight End goes in F4
                'C5': totalImpressions,                              // Total Impressions goes in C5
                'F5': 'Y'                                            // Even Monthly as "Y" in F5
            },
            flights: campaign.flights.map((flight, index) => ({
                row: 13 + index,
                data: {
                    'B': this.dateToExcel(flight.startDate),
                    'C': this.dateToExcel(flight.endDate),
                    'D': flight.budget,
                    'E': flight.impressions || 0,
                    'F': flight.trafficBudget || flight.budget * 1.01,
                    'G': flight.trafficImpressions || 0
                }
            }))
        };
    }

    mapYouTubeData(campaign) {
        const totalBudget = campaign.flights.reduce((sum, f) => sum + f.budget, 0);
        const totalViews = campaign.flights.reduce((sum, f) => sum + (f.totalViews || f.views || 0), 0);
        const cpmcpv = parseFloat(campaign.formData.rate) || 0;

        return {
            header: {
                // YouTube template mapping based on requirements
                'C4': totalBudget,          // Total Budget goes in C4
                'C5': totalViews,           // Imps/Views goes in C5
                'F4': this.dateToExcel(campaign.formData.startDate),  // Flight Start goes in F4
                'F5': this.dateToExcel(campaign.formData.endDate),    // Flight End goes in F5
                'C6': cpmcpv                // CPM/CPV goes in C6
            },
            flights: campaign.flights.map((flight, index) => ({
                row: 9 + index,
                data: {
                    'B': flight.line !== '-' ? flight.line : `Month ${index + 1}`,
                    'C': this.dateToExcel(flight.startDate),
                    'D': this.dateToExcel(flight.endDate),
                    'E': flight.totalViews || flight.views || 0,
                    'F': flight.daysInFlight || this.getActiveDays(flight.startDate, flight.endDate),
                    'G': flight.dailyViews || 0,
                    'H': flight.dailyPlatformBudget || 0,
                    'I': flight.totalRetail || flight.budget
                }
            }))
        };
    }

    mapSEMSocialData(campaign) {
        const totalBudget = campaign.flights.reduce((sum, f) => sum + f.budget, 0);

        return {
            header: {
                // SEM/Social template mapping - header fields removed as per new requirements
                // Flight data will be the primary data source
            },
            flights: campaign.flights.map((flight, index) => ({
                row: 12 + index,  // Flight data starts at B12:D49
                data: {
                    'B': this.dateToExcel(flight.startDate),  // Start date in B12
                    'C': this.dateToExcel(flight.endDate),    // End date in C12
                    'D': flight.budget                        // Budget in D12
                }
            }))
        };
    }

    // Create a new workbook with campaign data
    async exportSingleCampaign(campaign) {
        try {
            // Validate campaign data
            if (!campaign || !campaign.templateType || !campaign.flights) {
                throw new Error('Invalid campaign data');
            }

            console.log(`Exporting campaign: ${campaign.name || 'Unnamed'} (${campaign.templateType})`);

            // Get the appropriate template
            const templateType = campaign.templateType || 'default';
            const templateWorkbook = this.templateWorkbooks[templateType] || this.templateWorkbooks['default'];

            if (!templateWorkbook) {
                throw new Error(`No template available for type: ${templateType}`);
            }

            // Clone the template workbook
            const workbook = XLSX.utils.book_new();

            // Get first sheet from template (templates should have one main sheet)
            const templateSheetNames = Object.keys(templateWorkbook.Sheets);
            const templateSheetName = templateSheetNames[0];

            console.log(`Using template sheet: ${templateSheetName}`);

            // Copy template sheet
            const templateSheet = XLSX.utils.sheet_to_json(
                templateWorkbook.Sheets[templateSheetName],
                { header: 1, raw: false, defval: '' }
            );

            // Create new sheet from template
            const newSheet = XLSX.utils.aoa_to_sheet(templateSheet);

        // Map and fill data
        let mappedData;
        switch (campaign.templateType) {
            case 'programmatic':
                mappedData = this.mapProgrammaticData(campaign);
                break;
            case 'youtube':
                mappedData = this.mapYouTubeData(campaign);
                break;
            case 'sem-social':
                mappedData = this.mapSEMSocialData(campaign);
                break;
        }

        // Fill header data
        if (mappedData && mappedData.header) {
            Object.entries(mappedData.header).forEach(([cell, value]) => {
                newSheet[cell] = { v: value, t: typeof value === 'number' ? 'n' : 's' };
            });
        }

        // Fill flight data
        if (mappedData && mappedData.flights) {
            mappedData.flights.forEach(flight => {
                Object.entries(flight.data).forEach(([col, value]) => {
                    const cellAddress = `${col}${flight.row}`;
                    newSheet[cellAddress] = { 
                        v: value, 
                        t: typeof value === 'number' ? 'n' : 's' 
                    };
                });
            });
        }

        // Add sheet to workbook with campaign name
        const sanitizedSheetName = campaign.name.replace(/[^\w\s-]/g, '').substring(0, 31); // Excel sheet name limit
        XLSX.utils.book_append_sheet(workbook, newSheet, sanitizedSheetName);

        // Generate file with campaign name
        const sanitizedCampaignName = campaign.name.replace(/[^\w\s-]/g, '').trim();
        const fileName = `${sanitizedCampaignName}.xlsx`;
        const filePath = path.join(TEMP_DIR, fileName);
        XLSX.writeFile(workbook, filePath);

        return { fileName, filePath };

        } catch (error) {
            console.error('Export error:', error);
            throw new Error(`Failed to export campaign: ${error.message}`);
        }
    }

    // Export multiple campaigns to a single workbook
    async exportMultipleCampaigns(campaigns) {
        try {
            console.log(`Exporting ${campaigns.length} campaigns to single workbook`);
            const workbook = XLSX.utils.book_new();

            for (const campaign of campaigns) {
                console.log(`Processing campaign: ${campaign.name} (${campaign.templateType})`);

                // Get the appropriate template workbook
                const templateType = campaign.templateType || 'default';
                const templateWorkbook = this.templateWorkbooks[templateType] || this.templateWorkbooks['default'];

                if (!templateWorkbook) {
                    console.error(`No template available for type: ${templateType}, skipping campaign: ${campaign.name}`);
                    continue;
                }

                // Get first sheet from template (dynamic detection)
                const templateSheetNames = Object.keys(templateWorkbook.Sheets);
                const templateSheetName = templateSheetNames[0];
                console.log(`Using template sheet: ${templateSheetName} for ${campaign.name}`);

                // Copy template sheet data
                const templateSheet = templateWorkbook.Sheets[templateSheetName];
                const templateData = XLSX.utils.sheet_to_json(templateSheet, { header: 1, raw: false, defval: '' });
                const newSheet = XLSX.utils.aoa_to_sheet(templateData);

            // Map and fill data
            let mappedData;
            switch (campaign.templateType) {
                case 'programmatic':
                    mappedData = this.mapProgrammaticData(campaign);
                    break;
                case 'youtube':
                    mappedData = this.mapYouTubeData(campaign);
                    break;
                case 'sem-social':
                    mappedData = this.mapSEMSocialData(campaign);
                    break;
            }

            // Fill header data
            if (mappedData && mappedData.header) {
                Object.entries(mappedData.header).forEach(([cell, value]) => {
                    newSheet[cell] = { v: value, t: typeof value === 'number' ? 'n' : 's' };
                });
            }

            // Fill flight data
            if (mappedData && mappedData.flights) {
                mappedData.flights.forEach(flight => {
                    Object.entries(flight.data).forEach(([col, value]) => {
                        const cellAddress = `${col}${flight.row}`;
                        newSheet[cellAddress] = { 
                            v: value, 
                            t: typeof value === 'number' ? 'n' : 's' 
                        };
                    });
                });
            }

            // Add sheet to workbook with sanitized campaign name
            const sanitizedSheetName = campaign.name.replace(/[^\w\s-]/g, '').substring(0, 31);
            XLSX.utils.book_append_sheet(workbook, newSheet, sanitizedSheetName);
        }

        // Generate file
        const fileName = `FlightPlans_${Date.now()}.xlsx`;
        const filePath = path.join(TEMP_DIR, fileName);
        XLSX.writeFile(workbook, filePath);

        console.log(`Successfully exported ${campaigns.length} campaigns to: ${fileName}`);
        return { fileName, filePath };

        } catch (error) {
            console.error('Bulk export error:', error);
            throw new Error(`Failed to export campaigns: ${error.message}`);
        }
    }
}

// Initialize exporter
const exporter = new ExcelExporter();

// API Routes
app.post('/api/export/single', async (req, res) => {
    try {
        const { campaign } = req.body;
        if (!campaign) {
            return res.status(400).json({ error: 'Campaign data required' });
        }

        // Use enhanced export with xlsx-populate for better format preservation
        const result = await exporter.exportSingleCampaignEnhanced(campaign);

        res.json({
            success: true,
            fileName: result.fileName,
            downloadUrl: `/api/export/download/${result.fileName}`
        });
    } catch (error) {
        console.error('Export error:', error);
        // Fallback to basic export if enhanced fails
        try {
            console.log('Falling back to basic export...');
            const result = await exporter.exportSingleCampaign(campaign);
            res.json({
                success: true,
                fileName: result.fileName,
                downloadUrl: `/api/export/download/${result.fileName}`,
                warning: 'Used fallback export method'
            });
        } catch (fallbackError) {
            console.error('Fallback export also failed:', fallbackError);
            res.status(500).json({ error: 'Export failed', message: error.message });
        }
    }
});

app.post('/api/export/bulk', async (req, res) => {
    try {
        const { campaigns } = req.body;
        if (!campaigns || !Array.isArray(campaigns)) {
            return res.status(400).json({ error: 'Campaigns array required' });
        }

        const result = await exporter.exportMultipleCampaigns(campaigns);
        
        res.json({
            success: true,
            fileName: result.fileName,
            downloadUrl: `/api/export/download/${result.fileName}`
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Export failed', message: error.message });
    }
});

app.get('/api/export/download/:fileName', (req, res) => {
    const { fileName } = req.params;
    const filePath = path.join(TEMP_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, fileName, (err) => {
        if (err) {
            console.error('Download error:', err);
        }
        // Clean up temp file after download
        setTimeout(() => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }, 60000); // Delete after 1 minute
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Excel export server is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Excel export server running on port ${PORT}`);
});