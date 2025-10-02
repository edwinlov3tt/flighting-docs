const express = require('express');
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

class ProperExcelExporter {
    constructor() {
        // Template paths for individual files
        this.templatePaths = {
            'programmatic': './templates/Programmatic Budget Flighting Template.xlsx',
            'youtube': './templates/YouTube Budget Flighting Template.xlsx',
            'sem-social': './templates/SEM_Social Budget Flighting Template.xlsx',
            'full': './templates/Full Budget Flighting Template.xlsx'
        };
        
        // Define exactly where data goes in each template
        this.templateConfigs = {
            'programmatic': {
                campaignNameCell: 'A1',
                totalBudgetCell: 'B3',
                startDateHeaderCell: 'F3',
                endDateHeaderCell: 'F4',
                dataStartRow: 13,
                columns: {
                    start: 'B',      // Start date
                    end: 'C',        // End date  
                    budget: 'D',     // Budget
                    imps: 'E',       // Impressions
                    traffBudget: 'F', // Traffic Budget
                    traffImps: 'G'   // Traffic Impressions
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

    // Convert date string to JS Date object
    parseDate(dateString) {
        if (!dateString) return null;
        return new Date(dateString);
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
        
        // Set campaign name
        if (config.campaignNameCell) {
            sheet.cell(config.campaignNameCell).value(campaign.name);
        }
        
        // Set total budget
        if (config.totalBudgetCell) {
            sheet.cell(config.totalBudgetCell).value(totalBudget);
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
                // Fill all programmatic columns
                sheet.cell(`${config.columns.start}${rowNum}`).value(this.parseDate(flight.startDate));
                sheet.cell(`${config.columns.end}${rowNum}`).value(this.parseDate(flight.endDate));
                sheet.cell(`${config.columns.budget}${rowNum}`).value(flight.budget || 0);
                sheet.cell(`${config.columns.imps}${rowNum}`).value(flight.impressions || 0);
                // Traffic budget is typically 1% more than regular budget
                sheet.cell(`${config.columns.traffBudget}${rowNum}`).value(Math.round((flight.budget || 0) * 1.01));
                // Traffic impressions match regular impressions  
                sheet.cell(`${config.columns.traffImps}${rowNum}`).value(flight.impressions || 0);
                
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

    // Export multiple campaigns to separate sheets in one workbook
    async exportMultipleCampaigns(campaigns) {
        if (!campaigns || campaigns.length === 0) {
            throw new Error('No campaigns provided for export');
        }

        console.log(`Bulk export: ${campaigns.length} campaigns with proper formatting`);
        
        // Start with the first campaign's template as the base
        const firstCampaign = campaigns[0];
        const firstTemplateType = firstCampaign.templateType || 'programmatic';
        const firstTemplatePath = this.templatePaths[firstTemplateType];
        
        if (!fs.existsSync(firstTemplatePath)) {
            throw new Error(`Template file not found: ${firstTemplatePath}`);
        }

        // Load the first template as our bulk workbook
        const bulkWorkbook = await XlsxPopulate.fromFileAsync(firstTemplatePath);
        
        // Process each campaign
        for (let i = 0; i < campaigns.length; i++) {
            const campaign = campaigns[i];
            const templateType = campaign.templateType || 'programmatic';
            const config = this.templateConfigs[templateType];
            
            let sheet;
            
            if (i === 0) {
                // Use the first sheet for the first campaign
                sheet = bulkWorkbook.sheet(0);
                sheet.name(campaign.name.substring(0, 31)); // Excel sheet name limit
            } else {
                // For additional campaigns, load their template and add as new sheet
                const templatePath = this.templatePaths[templateType];
                if (!fs.existsSync(templatePath)) {
                    console.warn(`Template not found for ${campaign.name}: ${templatePath}`);
                    continue;
                }
                
                const templateWorkbook = await XlsxPopulate.fromFileAsync(templatePath);
                const templateSheet = templateWorkbook.sheet(0);
                
                // Copy the template sheet to our bulk workbook
                sheet = bulkWorkbook.addSheet(campaign.name.substring(0, 31), templateSheet);
            }

            // Fill this campaign's data (same logic as single export)
            const totalBudget = campaign.flights.reduce((sum, flight) => sum + (flight.budget || 0), 0);
            
            if (config.campaignNameCell) {
                sheet.cell(config.campaignNameCell).value(campaign.name);
            }
            if (config.totalBudgetCell) {
                sheet.cell(config.totalBudgetCell).value(totalBudget);
            }
            if (campaign.formData) {
                if (config.startDateHeaderCell && campaign.formData.startDate) {
                    sheet.cell(config.startDateHeaderCell).value(this.parseDate(campaign.formData.startDate));
                }
                if (config.endDateHeaderCell && campaign.formData.endDate) {
                    sheet.cell(config.endDateHeaderCell).value(this.parseDate(campaign.formData.endDate));
                }
            }

            // Fill flight data
            campaign.flights.forEach((flight, index) => {
                const rowNum = config.dataStartRow + index;
                
                if (templateType === 'programmatic') {
                    sheet.cell(`${config.columns.start}${rowNum}`).value(this.parseDate(flight.startDate));
                    sheet.cell(`${config.columns.end}${rowNum}`).value(this.parseDate(flight.endDate));
                    sheet.cell(`${config.columns.budget}${rowNum}`).value(flight.budget || 0);
                    sheet.cell(`${config.columns.imps}${rowNum}`).value(flight.impressions || 0);
                    sheet.cell(`${config.columns.traffBudget}${rowNum}`).value(Math.round((flight.budget || 0) * 1.01));
                    sheet.cell(`${config.columns.traffImps}${rowNum}`).value(flight.impressions || 0);
                } else if (templateType === 'youtube') {
                    sheet.cell(`${config.columns.line}${rowNum}`).value(flight.line || `Week ${index + 1}`);
                    sheet.cell(`${config.columns.start}${rowNum}`).value(this.parseDate(flight.startDate));
                    sheet.cell(`${config.columns.end}${rowNum}`).value(this.parseDate(flight.endDate));
                    sheet.cell(`${config.columns.budget}${rowNum}`).value(flight.budget || 0);
                } else if (templateType === 'sem-social') {
                    sheet.cell(`${config.columns.start}${rowNum}`).value(this.parseDate(flight.startDate));
                    sheet.cell(`${config.columns.end}${rowNum}`).value(this.parseDate(flight.endDate));
                    sheet.cell(`${config.columns.budget}${rowNum}`).value(flight.budget || 0);
                }
            });
        }
        
        // Generate filename for bulk export
        const timestamp = Date.now();
        const fileName = `FlightPlans_Formatted_${timestamp}.xlsx`;
        const filePath = path.join(TEMP_DIR, fileName);

        // Write the bulk workbook with all formatting preserved
        await bulkWorkbook.toFileAsync(filePath);
        
        console.log(`Bulk Excel file with proper formatting generated: ${filePath}`);
        
        return {
            success: true,
            fileName,
            downloadUrl: `/api/export/download/${fileName}`,
            message: `Bulk export completed for ${campaigns.length} campaigns with preserved formatting`
        };
    }
}

const exporter = new ProperExcelExporter();

// Health check endpoint
app.get('/health', (req, res) => {
    const templates = Object.keys(exporter.templatePaths).filter(key => 
        fs.existsSync(exporter.templatePaths[key])
    );
    
    res.json({
        status: 'OK',
        message: 'Proper Excel export server with xlsx-populate running',
        templates: templates,
        library: 'xlsx-populate (preserves ALL formatting)',
        templateConfigs: Object.keys(exporter.templateConfigs)
    });
});

// Export single campaign
app.post('/api/export/single', async (req, res) => {
    try {
        const { campaign } = req.body;
        
        if (!campaign) {
            return res.status(400).json({
                success: false,
                message: 'Campaign data is required'
            });
        }

        const result = await exporter.exportSingleCampaign(campaign);
        res.json(result);
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Export multiple campaigns
app.post('/api/export/bulk', async (req, res) => {
    try {
        const { campaigns } = req.body;
        
        if (!campaigns || !Array.isArray(campaigns) || campaigns.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Campaigns array is required'
            });
        }

        const result = await exporter.exportMultipleCampaigns(campaigns);
        res.json(result);
        
    } catch (error) {
        console.error('Bulk export error:', error);
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
app.listen(PORT, () => {
    console.log(`🎨 Proper Excel export server running on port ${PORT}`);
    console.log('📚 Using xlsx-populate for perfect formatting preservation');
    console.log('Available template types:', Object.keys(exporter.templatePaths));
    
    // Verify template files exist
    Object.entries(exporter.templatePaths).forEach(([type, path]) => {
        const exists = fs.existsSync(path);
        console.log(`  ${type}: ${path} ${exists ? '✅' : '❌'}`);
    });
});