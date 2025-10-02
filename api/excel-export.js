import XLSX from 'xlsx';
import XlsxPopulate from 'xlsx-populate';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Excel Exporter class (simplified for serverless)
class ExcelExporter {
    constructor() {
        // In serverless environment on Vercel, templates are in /var/task/templates
        // In local dev, they're relative to project root
        const basePath = process.env.VERCEL ? '/var/task' : path.join(__dirname, '..');
        this.templates = {
            'programmatic': path.join(basePath, 'templates/Programmatic Budget Flighting Template.xlsx'),
            'youtube': path.join(basePath, 'templates/YouTube Budget Flighting Template.xlsx'),
            'sem-social': path.join(basePath, 'templates/SEM_Social Budget Flighting Template.xlsx'),
            'default': path.join(basePath, 'templates/Full Budget Flighting Template.xlsx')
        };
    }

    // Convert date string to Excel date number (timezone-safe)
    dateToExcel(dateString) {
        if (!dateString) return '';

        let date;
        if (typeof dateString === 'string') {
            if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = dateString.split('-').map(Number);
                date = new Date(year, month - 1, day);
            } else {
                date = new Date(dateString);
            }
        } else {
            date = new Date(dateString);
        }

        const excelEpoch = new Date(1900, 0, 1);
        const msPerDay = 24 * 60 * 60 * 1000;
        const excelDate = Math.floor((date - excelEpoch) / msPerDay) + 2;
        return excelDate;
    }

    getActiveDays(startDate, endDate) {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }

    async loadTemplateWithPopulate(templateType) {
        const templatePath = this.templates[templateType] || this.templates['default'];

        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templatePath}`);
        }

        return await XlsxPopulate.fromFileAsync(templatePath);
    }

    mapProgrammaticData(campaign) {
        const totalBudget = campaign.flights.reduce((sum, f) => sum + f.budget, 0);
        const totalImpressions = campaign.flights.reduce((sum, f) => sum + (f.impressions || 0), 0);
        const cpm = parseFloat(campaign.formData.rate) || 0;

        return {
            header: {
                'C4': totalBudget,                                     // Total Budget
                'C5': totalImpressions,                                // Total Impressions
                'C6': cpm,                                             // CPM
                'F3': this.dateToExcel(campaign.formData.startDate),  // Flight Start
                'F4': this.dateToExcel(campaign.formData.endDate)     // Flight End
            },
            flights: campaign.flights.map((flight, index) => ({
                row: 13 + index,  // Line Item Range starts at row 13
                data: {
                    'B': this.dateToExcel(flight.startDate),         // Line Start Date
                    'C': this.dateToExcel(flight.endDate),           // Line End Date
                    'D': flight.budget,                              // Budget
                    'E': flight.impressions || 0,                    // Impressions
                    'F': flight.trafficBudget || flight.budget * 1.01,  // Traffic Budget
                    'G': flight.trafficImpressions || 0              // Traffic Impressions
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
                'C4': totalBudget,                                     // Total Budget
                'C5': totalViews,                                      // Impressions/Views
                'C6': cpmcpv,                                          // CPM/CPV
                'F4': this.dateToExcel(campaign.formData.startDate),  // Flight Start
                'F5': this.dateToExcel(campaign.formData.endDate)     // Flight End
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
                'C3': this.dateToExcel(campaign.formData.startDate),  // Flight Start
                'C4': this.dateToExcel(campaign.formData.endDate),    // Flight End
                'C5': totalBudget                                     // Total Budget
            },
            flights: campaign.flights.map((flight, index) => ({
                row: 12 + index,
                data: {
                    'B': this.dateToExcel(flight.startDate),
                    'C': this.dateToExcel(flight.endDate),
                    'D': flight.budget
                }
            }))
        };
    }

    async applyEnhancedMapping(sheet, campaign, templateType) {
        let mappedData;

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
                    cell.value(value);
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
                        cell.value(value);
                    } catch (error) {
                        console.warn(`Failed to set flight cell ${col}${flight.row}:`, error.message);
                    }
                });
            });
        }
    }

    async exportSingleCampaignEnhanced(campaign) {
        const templateType = campaign.templateType || 'default';
        const workbook = await this.loadTemplateWithPopulate(templateType);
        const sheet = workbook.sheet(0);

        if (!sheet) {
            throw new Error('Template has no sheets');
        }

        await this.applyEnhancedMapping(sheet, campaign, templateType);

        // Return the workbook buffer instead of saving to file
        return await workbook.outputAsync();
    }

    async exportMultipleCampaigns(campaigns) {
        // Export each campaign as a separate Excel file with full formatting
        // Then combine into a ZIP file for download

        const zip = new JSZip();

        for (let i = 0; i < campaigns.length; i++) {
            const campaign = campaigns[i];

            // Export this campaign with its proper template and formatting
            const buffer = await this.exportSingleCampaignEnhanced(campaign);

            // Ensure buffer is a proper Buffer
            const properBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

            // Sanitize filename for the zip
            const sanitizedName = campaign.name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
            const fileName = `${sanitizedName}.xlsx`;

            console.log(`Adding ${fileName} to ZIP (${properBuffer.length} bytes)`);

            // Add to zip as arraybuffer (more reliable for binary data)
            zip.file(fileName, properBuffer, {
                binary: true,
                compression: 'STORE'
            });
        }

        // Generate the zip file as a buffer
        const zipBuffer = await zip.generateAsync({
            type: 'nodebuffer',
            compression: 'STORE',
            streamFiles: false
        });

        console.log(`Generated ZIP file (${zipBuffer.length} bytes)`);
        return zipBuffer;
    }
}

// Initialize exporter
const exporter = new ExcelExporter();

// Vercel serverless function handler
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        return res.json({ status: 'OK', message: 'Excel export serverless function is running' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { campaign, campaigns } = req.body;

        // Single campaign export
        if (campaign) {
            console.log('Exporting single campaign:', campaign.name);
            const buffer = await exporter.exportSingleCampaignEnhanced(campaign);
            const sanitizedCampaignName = campaign.name.replace(/[^\w\s-]/g, '').trim();
            const fileName = `${sanitizedCampaignName}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            return res.send(buffer);
        }

        // Multiple campaigns export - ZIP file with individual Excel files
        if (campaigns && campaigns.length > 0) {
            console.log(`Exporting ${campaigns.length} campaigns to ZIP file`);
            const zipBuffer = await exporter.exportMultipleCampaigns(campaigns);
            const fileName = 'Media_Flight_Plans.zip';

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            return res.send(zipBuffer);
        }

        return res.status(400).json({ error: 'Campaign or campaigns data required' });

    } catch (error) {
        console.error('Export error:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            error: 'Export failed',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}