const XLSX = require('xlsx');
const XlsxPopulate = require('xlsx-populate');
const path = require('path');
const fs = require('fs');

// Excel Exporter class (simplified for serverless)
class ExcelExporter {
    constructor() {
        this.templates = {
            'programmatic': './templates/Programmatic Budget Flighting Template.xlsx',
            'youtube': './templates/YouTube Budget Flighting Template.xlsx',
            'sem-social': './templates/SEM_Social Budget Flighting Template.xlsx',
            'default': './templates/Full Budget Flighting Template.xlsx'
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
        const fullPath = path.join(process.cwd(), templatePath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`Template file not found: ${fullPath}`);
        }

        return await XlsxPopulate.fromFileAsync(fullPath);
    }

    mapProgrammaticData(campaign) {
        const totalBudget = campaign.flights.reduce((sum, f) => sum + f.budget, 0);
        const totalImpressions = campaign.flights.reduce((sum, f) => sum + (f.impressions || 0), 0);

        return {
            header: {
                'C4': totalBudget,
                'F3': this.dateToExcel(campaign.formData.startDate),
                'F4': this.dateToExcel(campaign.formData.endDate),
                'C5': totalImpressions,
                'F5': 'Y'
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
                'C4': totalBudget,
                'C5': totalViews,
                'F4': this.dateToExcel(campaign.formData.startDate),
                'F5': this.dateToExcel(campaign.formData.endDate),
                'C6': cpmcpv
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
        return {
            header: {},
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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req;

    try {
        if (url.includes('/api/export/single')) {
            const { campaign } = req.body;

            if (!campaign) {
                return res.status(400).json({ error: 'Campaign data required' });
            }

            const buffer = await exporter.exportSingleCampaignEnhanced(campaign);
            const sanitizedCampaignName = campaign.name.replace(/[^\w\s-]/g, '').trim();
            const fileName = `${sanitizedCampaignName}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.send(buffer);

        } else if (url.includes('/health')) {
            res.json({ status: 'OK', message: 'Excel export server is running' });
        } else {
            res.status(404).json({ error: 'Endpoint not found' });
        }

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Export failed', message: error.message });
    }
}