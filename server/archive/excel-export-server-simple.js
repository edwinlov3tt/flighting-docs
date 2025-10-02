const express = require('express');
const XLSX = require('xlsx');
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

class SimpleExcelExporter {
    constructor() {
        // Template paths for individual files
        this.templatePaths = {
            'programmatic': './templates/Programmatic Budget Flighting Template.xlsx',
            'youtube': './templates/YouTube Budget Flighting Template.xlsx', 
            'sem-social': './templates/SEM_Social Budget Flighting Template.xlsx',
            'full': './templates/Full Budget Flighting Template.xlsx'
        };
        
        // Define where to start filling data in each template (based on actual analysis)
        this.fillableRanges = {
            'programmatic': { start: 13, startCol: 'B', endCol: 'C', budgetCol: 'D', impsCol: 'E', traffBudgetCol: 'F', traffImpsCol: 'G' },
            'youtube': { start: 9, cols: ['B', 'C', 'D', 'E'] }, // Line, Start, End, Budget columns  
            'sem-social': { start: 11, cols: ['B', 'C', 'D'] }  // Start, End, Budget columns
        };
    }

    // Convert date string to Excel date format
    formatDateForExcel(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(); // Keep as readable date string
    }

    // Export single campaign - SIMPLE approach: just fill cells, preserve everything else
    async exportSingleCampaign(campaign) {
        const templateType = campaign.templateType || 'programmatic';
        const templatePath = this.templatePaths[templateType];
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templatePath}`);
        }

        console.log(`Loading template: ${templatePath}`);
        console.log(`Campaign: ${campaign.name} (${templateType}) with ${campaign.flights.length} flights`);

        // Load the template workbook - this preserves ALL formatting
        const workbook = XLSX.readFile(templatePath);
        const sheetName = workbook.SheetNames[0]; // Use first sheet
        const sheet = workbook.Sheets[sheetName];

        // Fill in campaign details in the header area
        const totalBudget = campaign.flights.reduce((sum, flight) => sum + (flight.budget || 0), 0);
        
        // Fill campaign name in A1 if it exists
        if (sheet['A1']) {
            sheet['A1'] = { v: campaign.name, t: 's' };
        }
        
        // Fill total budget in B3 (if that cell exists)
        if (sheet['B3']) {
            sheet['B3'] = { v: totalBudget, t: 'n' };
        }
        
        // Fill start and end dates in header (E3, E4)
        if (campaign.formData) {
            if (sheet['F3']) { // Flight Start
                sheet['F3'] = { v: this.formatDateForExcel(campaign.formData.startDate), t: 's' };
            }
            if (sheet['F4']) { // Flight End  
                sheet['F4'] = { v: this.formatDateForExcel(campaign.formData.endDate), t: 's' };
            }
        }

        // Get the fillable range for this template type
        const range = this.fillableRanges[templateType];
        if (!range) {
            throw new Error(`No fillable range defined for template type: ${templateType}`);
        }

        // Fill flight data starting at the defined row
        campaign.flights.forEach((flight, index) => {
            const rowNum = range.start + index;
            
            if (templateType === 'programmatic') {
                // Fill programmatic template with all columns: Start, End, Budget, Imps, Traff Budget, Traff Imps
                const startCell = `${range.startCol}${rowNum}`;
                const endCell = `${range.endCol}${rowNum}`;
                const budgetCell = `${range.budgetCol}${rowNum}`;
                const impsCell = `${range.impsCol}${rowNum}`;
                const traffBudgetCell = `${range.traffBudgetCol}${rowNum}`;
                const traffImpsCell = `${range.traffImpsCol}${rowNum}`;
                
                sheet[startCell] = { v: this.formatDateForExcel(flight.startDate), t: 's' };
                sheet[endCell] = { v: this.formatDateForExcel(flight.endDate), t: 's' };
                sheet[budgetCell] = { v: flight.budget || 0, t: 'n' };
                sheet[impsCell] = { v: flight.impressions || 0, t: 'n' };
                // Traffic budget is typically 1% more than regular budget
                sheet[traffBudgetCell] = { v: Math.round((flight.budget || 0) * 1.01), t: 'n' };
                // Traffic impressions match regular impressions
                sheet[traffImpsCell] = { v: flight.impressions || 0, t: 'n' };
                
            } else if (templateType === 'youtube') {
                // Fill: Line (B), Start Date (C), End Date (D), Budget (E)
                const lineCell = `B${rowNum}`;
                const startCell = `C${rowNum}`;
                const endCell = `D${rowNum}`;
                const budgetCell = `E${rowNum}`;
                
                sheet[lineCell] = { v: flight.line || `Week ${index + 1}`, t: 's' };
                sheet[startCell] = { v: this.formatDateForExcel(flight.startDate), t: 's' };
                sheet[endCell] = { v: this.formatDateForExcel(flight.endDate), t: 's' };
                sheet[budgetCell] = { v: flight.budget || 0, t: 'n' };
                
            } else if (templateType === 'sem-social') {
                // Fill: Start Date (B), End Date (C), Budget (D)
                const startCell = `B${rowNum}`;
                const endCell = `C${rowNum}`;
                const budgetCell = `D${rowNum}`;
                
                sheet[startCell] = { v: this.formatDateForExcel(flight.startDate), t: 's' };
                sheet[endCell] = { v: this.formatDateForExcel(flight.endDate), t: 's' };
                sheet[budgetCell] = { v: flight.budget || 0, t: 'n' };
            }
        });

        // Generate unique filename
        const timestamp = Date.now();
        const safeName = campaign.name.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${safeName}_${timestamp}.xlsx`;
        const filePath = path.join(TEMP_DIR, fileName);

        // Write the workbook - this preserves ALL original formatting
        XLSX.writeFile(workbook, filePath);
        
        console.log(`Excel file generated: ${filePath}`);
        
        return {
            success: true,
            fileName,
            downloadUrl: `/api/export/download/${fileName}`,
            message: `Excel export completed for ${campaign.name}`
        };
    }

    // Export multiple campaigns to separate sheets in one workbook
    async exportMultipleCampaigns(campaigns) {
        if (!campaigns || campaigns.length === 0) {
            throw new Error('No campaigns provided for export');
        }

        console.log(`Bulk export: ${campaigns.length} campaigns`);
        
        // Create a new workbook for bulk export
        const bulkWorkbook = XLSX.utils.book_new();
        
        // Process each campaign and add as a separate sheet
        for (let i = 0; i < campaigns.length; i++) {
            const campaign = campaigns[i];
            const templateType = campaign.templateType || 'programmatic';
            const templatePath = this.templatePaths[templateType];
            
            if (!fs.existsSync(templatePath)) {
                console.warn(`Template not found for ${campaign.name}: ${templatePath}`);
                continue;
            }

            // Load template and fill with data (same logic as single export)
            const templateWorkbook = XLSX.readFile(templatePath);
            const templateSheetName = templateWorkbook.SheetNames[0];
            const sheet = templateWorkbook.Sheets[templateSheetName];

            // Fill campaign header details (same logic as single export)
            const totalBudget = campaign.flights.reduce((sum, flight) => sum + (flight.budget || 0), 0);
            
            if (sheet['A1']) {
                sheet['A1'] = { v: campaign.name, t: 's' };
            }
            if (sheet['B3']) {
                sheet['B3'] = { v: totalBudget, t: 'n' };
            }
            if (campaign.formData) {
                if (sheet['F3']) {
                    sheet['F3'] = { v: this.formatDateForExcel(campaign.formData.startDate), t: 's' };
                }
                if (sheet['F4']) {
                    sheet['F4'] = { v: this.formatDateForExcel(campaign.formData.endDate), t: 's' };
                }
            }

            // Fill flight data (same logic as single export)
            const range = this.fillableRanges[templateType];
            if (range) {
                campaign.flights.forEach((flight, index) => {
                    const rowNum = range.start + index;
                    
                    if (templateType === 'programmatic') {
                        const startCell = `${range.startCol}${rowNum}`;
                        const endCell = `${range.endCol}${rowNum}`;
                        const budgetCell = `${range.budgetCol}${rowNum}`;
                        const impsCell = `${range.impsCol}${rowNum}`;
                        const traffBudgetCell = `${range.traffBudgetCol}${rowNum}`;
                        const traffImpsCell = `${range.traffImpsCol}${rowNum}`;
                        
                        sheet[startCell] = { v: this.formatDateForExcel(flight.startDate), t: 's' };
                        sheet[endCell] = { v: this.formatDateForExcel(flight.endDate), t: 's' };
                        sheet[budgetCell] = { v: flight.budget || 0, t: 'n' };
                        sheet[impsCell] = { v: flight.impressions || 0, t: 'n' };
                        sheet[traffBudgetCell] = { v: Math.round((flight.budget || 0) * 1.01), t: 'n' };
                        sheet[traffImpsCell] = { v: flight.impressions || 0, t: 'n' };
                    } else if (templateType === 'youtube') {
                        sheet[`B${rowNum}`] = { v: flight.line || `Week ${index + 1}`, t: 's' };
                        sheet[`C${rowNum}`] = { v: this.formatDateForExcel(flight.startDate), t: 's' };
                        sheet[`D${rowNum}`] = { v: this.formatDateForExcel(flight.endDate), t: 's' };
                        sheet[`E${rowNum}`] = { v: flight.budget || 0, t: 'n' };
                    } else if (templateType === 'sem-social') {
                        sheet[`B${rowNum}`] = { v: this.formatDateForExcel(flight.startDate), t: 's' };
                        sheet[`C${rowNum}`] = { v: this.formatDateForExcel(flight.endDate), t: 's' };
                        sheet[`D${rowNum}`] = { v: flight.budget || 0, t: 'n' };
                    }
                });
            }

            // Add sheet to bulk workbook with campaign name
            const sheetName = campaign.name.substring(0, 31); // Excel sheet name limit
            XLSX.utils.book_append_sheet(bulkWorkbook, sheet, sheetName);
        }
        
        // Generate filename for bulk export
        const timestamp = Date.now();
        const fileName = `FlightPlans_${timestamp}.xlsx`;
        const filePath = path.join(TEMP_DIR, fileName);

        // Write the bulk workbook
        XLSX.writeFile(bulkWorkbook, filePath);
        
        console.log(`Bulk Excel file generated: ${filePath}`);
        
        return {
            success: true,
            fileName,
            downloadUrl: `/api/export/download/${fileName}`,
            message: `Bulk export completed for ${campaigns.length} campaigns`
        };
    }
}

const exporter = new SimpleExcelExporter();

// Health check endpoint
app.get('/health', (req, res) => {
    const templates = Object.keys(exporter.templatePaths).filter(key => 
        fs.existsSync(exporter.templatePaths[key])
    );
    
    res.json({
        status: 'OK',
        message: 'Simple Excel export server is running',
        templates: templates,
        fillableRanges: exporter.fillableRanges
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
    console.log(`Simple Excel export server running on port ${PORT}`);
    console.log('Available template types:', Object.keys(exporter.templatePaths));
    
    // Verify template files exist
    Object.entries(exporter.templatePaths).forEach(([type, path]) => {
        const exists = fs.existsSync(path);
        console.log(`  ${type}: ${path} ${exists ? '✓' : '✗'}`);
    });
});