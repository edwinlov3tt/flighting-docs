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

class ExcelExporter {
    constructor() {
        this.templatePath = './LINE ITEM_Budget Flighting_20221201 R1.xlsx';
        this.templateWorkbook = XLSX.readFile(this.templatePath);
    }

    // Convert date string to Excel date number
    dateToExcel(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Excel dates start from 1900-01-01
        const excelEpoch = new Date(1900, 0, 1);
        const msPerDay = 24 * 60 * 60 * 1000;
        // Excel has a leap year bug for 1900, so we add 2 days
        return Math.floor((date - excelEpoch) / msPerDay) + 2;
    }

    // Map campaign data to Excel template format
    mapProgrammaticData(campaign) {
        const totalBudget = campaign.flights.reduce((sum, f) => sum + f.budget, 0);
        const totalImpressions = campaign.flights.reduce((sum, f) => sum + (f.impressions || 0), 0);
        const cpm = totalImpressions > 0 ? (totalBudget / totalImpressions) * 1000 : 0;

        return {
            header: {
                'B3': this.dateToExcel(campaign.formData.startDate),
                'B4': totalBudget,
                'D3': this.dateToExcel(campaign.formData.endDate),
                'B5': totalImpressions,
                'B6': cpm,
                'F5': 'N' // Custom flighting
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
        const totalViews = campaign.flights.reduce((sum, f) => sum + (f.totalViews || 0), 0);
        const isaCPV = campaign.formData.metricType === 'CPV';

        return {
            header: {
                'C3': isaCPV ? 'CPV' : 'Bumper',
                'B4': totalBudget,
                'E3': isaCPV ? parseFloat(campaign.formData.rate) : '',
                'G4': !isaCPV ? parseFloat(campaign.formData.rate) : '',
                'B5': totalViews,
                'E4': this.dateToExcel(campaign.formData.startDate),
                'C5': this.dateToExcel(campaign.formData.endDate)
            },
            flights: campaign.flights.map((flight, index) => ({
                row: 9 + index,
                data: {
                    'B': flight.line !== '-' ? flight.line : `Month ${index + 1}`,
                    'C': this.dateToExcel(flight.startDate),
                    'D': this.dateToExcel(flight.endDate),
                    'E': flight.totalViews || 0,
                    'F': flight.daysInFlight || 0,
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
                'B3': this.dateToExcel(campaign.formData.startDate),
                'B4': totalBudget,
                'D3': this.dateToExcel(campaign.formData.endDate),
                'F5': 'Y' // Even monthly by default
            },
            flights: campaign.flights.map((flight, index) => ({
                row: 11 + index,
                data: {
                    'B': this.dateToExcel(flight.startDate),
                    'C': this.dateToExcel(flight.endDate),
                    'D': flight.budget
                }
            }))
        };
    }

    // Create a new workbook with campaign data
    async exportSingleCampaign(campaign) {
        // Clone the template workbook
        const workbook = XLSX.utils.book_new();
        
        // Determine template sheet name
        let templateSheetName;
        switch (campaign.templateType) {
            case 'programmatic':
                templateSheetName = 'PRG Standard Template';
                break;
            case 'youtube':
                templateSheetName = 'YouTube Template';
                break;
            case 'sem-social':
                templateSheetName = 'SEM + Social Template';
                break;
            default:
                templateSheetName = 'PRG Standard Template';
        }

        // Copy template sheet
        const templateSheet = XLSX.utils.sheet_to_json(
            this.templateWorkbook.Sheets[templateSheetName],
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
        const sheetName = campaign.name.substring(0, 31); // Excel sheet name limit
        XLSX.utils.book_append_sheet(workbook, newSheet, sheetName);

        // Generate file
        const fileName = `${campaign.name}_${Date.now()}.xlsx`;
        const filePath = path.join(TEMP_DIR, fileName);
        XLSX.writeFile(workbook, filePath);

        return { fileName, filePath };
    }

    // Export multiple campaigns to a single workbook
    async exportMultipleCampaigns(campaigns) {
        const workbook = XLSX.utils.book_new();

        for (const campaign of campaigns) {
            // Determine template sheet name
            let templateSheetName;
            switch (campaign.templateType) {
                case 'programmatic':
                    templateSheetName = 'PRG Standard Template';
                    break;
                case 'youtube':
                    templateSheetName = 'YouTube Template';
                    break;
                case 'sem-social':
                    templateSheetName = 'SEM + Social Template';
                    break;
                default:
                    templateSheetName = 'PRG Standard Template';
            }

            // Copy template sheet data
            const templateSheet = this.templateWorkbook.Sheets[templateSheetName];
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

            // Add sheet to workbook
            const sheetName = campaign.name.substring(0, 31);
            XLSX.utils.book_append_sheet(workbook, newSheet, sheetName);
        }

        // Generate file
        const fileName = `FlightPlans_${Date.now()}.xlsx`;
        const filePath = path.join(TEMP_DIR, fileName);
        XLSX.writeFile(workbook, filePath);

        return { fileName, filePath };
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

        const result = await exporter.exportSingleCampaign(campaign);
        
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