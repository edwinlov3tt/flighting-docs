# Excel Export Implementation Plan

## Overview
Create a server-side function to export flight plans using the Excel template format, supporting both individual and bulk exports with multiple template types.

## Template Analysis Summary

### 1. PRG Standard Template
- **Location**: Rows 13+ for flight data
- **Key Fields**:
  - B3: Flight Start Date
  - B4: Total Budget
  - D3: Flight End Date 
  - B5: Total Impressions
  - B6: CPM
  - F5: Even Monthly (Y/N)
- **Flight Columns**:
  - Col B: Start Date
  - Col C: End Date  
  - Col D: Budget
  - Col E: Impressions
  - Col F: Traffic Budget (Budget * 1.01)
  - Col G: Traffic Impressions

### 2. YouTube Template
- **Location**: Rows 9+ for flight data
- **Key Fields**:
  - C3: CPV or Bumper selector
  - B4: Total Budget
  - E3: Input CPV value
  - B5: Total Views
  - E4: Flight Start
  - G4: Input CPM
  - C5: Flight End
- **Flight Columns**:
  - Col B: Campaign Suffix
  - Col C: Flight Start
  - Col D: Flight End
  - Col E: Total Impressions/Views
  - Col F: Days In Flight
  - Col G: Daily Views
  - Col H: Daily Platform Budget
  - Col I: Total Retail

### 3. SEM + Social Template
- **Location**: Rows 11+ for flight data
- **Key Fields**:
  - B3: Flight Start
  - B4: Total Budget
  - D3: Flight End
  - F5: Even Monthly (Y/N)
- **Flight Columns**:
  - Col B: Start Date
  - Col C: End Date
  - Col D: Budget

## Architecture Design

### Server-Side Components

#### 1. **excel-export.js** - Main Export Module
```javascript
// Core export functionality
class ExcelExporter {
  constructor() {
    this.templatePath = './LINE ITEM_Budget Flighting_20221201 R1.xlsx';
  }
  
  // Export single campaign
  async exportSingleCampaign(campaignData)
  
  // Export multiple campaigns
  async exportMultipleCampaigns(campaignsData)
  
  // Map app data to Excel template
  mapDataToTemplate(campaign, templateType)
  
  // Create new sheet for campaign
  createCampaignSheet(workbook, campaign)
  
  // Fill template with data
  fillTemplate(sheet, templateData, templateType)
}
```

#### 2. **excel-api.js** - API Endpoints
```javascript
// Express.js API endpoints
app.post('/api/export/single', async (req, res) => {
  // Export single flight plan
});

app.post('/api/export/bulk', async (req, res) => {
  // Export multiple flight plans
});

app.get('/api/export/download/:id', (req, res) => {
  // Download generated Excel file
});
```

## Data Mapping

### From App to Excel Template

#### Programmatic Template Mapping:
```javascript
{
  // Header data
  'B3': campaign.formData.startDate,      // Flight Start
  'B4': campaign.totalBudget,             // Total Budget  
  'D3': campaign.formData.endDate,        // Flight End
  'B5': campaign.totalImpressions,        // Total Impressions
  'B6': campaign.formData.rate,           // CPM
  'F5': 'N',                              // Custom flighting
  
  // Flight rows (starting at row 13)
  flights: campaign.flights.map((flight, index) => ({
    row: 13 + index,
    'B': flight.startDate,
    'C': flight.endDate,
    'D': flight.budget,
    'E': flight.impressions,
    'F': flight.trafficBudget,
    'G': flight.trafficImpressions
  }))
}
```

#### YouTube Template Mapping:
```javascript
{
  // Header data
  'C3': flight.kpi === 'CPV' ? 'CPV' : 'Bumper',
  'B4': campaign.totalBudget,
  'E3': campaign.formData.rate,           // CPV rate
  'B5': campaign.totalViews,
  'E4': campaign.formData.startDate,
  'C5': campaign.formData.endDate,
  
  // Flight rows (starting at row 9)
  flights: campaign.flights.map((flight, index) => ({
    row: 9 + index,
    'B': flight.line || `Month ${index + 1}`,
    'C': flight.startDate,
    'D': flight.endDate,
    'E': flight.totalViews,
    'F': flight.daysInFlight,
    'G': flight.dailyViews,
    'H': flight.dailyPlatformBudget,
    'I': flight.totalRetail || flight.budget
  }))
}
```

#### SEM + Social Template Mapping:
```javascript
{
  // Header data
  'B3': campaign.formData.startDate,
  'B4': campaign.totalBudget,
  'D3': campaign.formData.endDate,
  'F5': 'Y',                              // Even monthly
  
  // Flight rows (starting at row 11)
  flights: campaign.flights.map((flight, index) => ({
    row: 11 + index,
    'B': flight.startDate,
    'C': flight.endDate,
    'D': flight.budget
  }))
}
```

## Implementation Steps

### Phase 1: Core Export Functionality
1. Create Node.js/Express server module
2. Implement Excel template reading with xlsx library
3. Create data mapping functions for each template type
4. Implement single campaign export

### Phase 2: Multi-Campaign Support
1. Add sheet creation for multiple campaigns
2. Name sheets according to campaign names
3. Handle mixed template types in one workbook
4. Implement bulk export endpoint

### Phase 3: UI Integration
1. Add export buttons to the main app
2. Create export options modal:
   - Export current campaign
   - Export all campaigns
   - Select specific campaigns
3. Handle download through browser
4. Add progress indicator for large exports

### Phase 4: Advanced Features
1. Add date formatting options
2. Include locked flights indicator
3. Add summary sheet for multi-campaign exports
4. Support custom naming conventions

## File Structure
```
/excel-export/
  ├── server.js              # Express server
  ├── excel-exporter.js      # Core export class
  ├── template-mapper.js     # Data mapping utilities
  ├── api-routes.js          # API endpoints
  └── templates/             # Excel templates
      └── LINE ITEM_Budget Flighting_20221201 R1.xlsx
```

## API Design

### Single Export
```javascript
POST /api/export/single
Body: {
  campaign: {
    name: "Campaign Name",
    templateType: "programmatic",
    flights: [...],
    formData: {...}
  }
}
Response: {
  success: true,
  downloadUrl: "/api/export/download/abc123"
}
```

### Bulk Export
```javascript
POST /api/export/bulk
Body: {
  campaigns: [
    { name: "Campaign 1", templateType: "programmatic", ... },
    { name: "Campaign 2", templateType: "youtube", ... }
  ],
  options: {
    singleFile: true,  // All in one Excel file
    includesSummary: true
  }
}
Response: {
  success: true,
  downloadUrl: "/api/export/download/xyz789"
}
```

## UI Integration in index.html

### Export Button Options
```javascript
// Add to campaign actions
React.createElement('button', {
  onClick: () => exportToExcel(campaigns[activeTab]),
  className: "px-4 py-2 bg-green-600 text-white rounded-lg"
}, "Export to Excel"),

React.createElement('button', {
  onClick: () => showExportOptionsModal(),
  className: "px-4 py-2 bg-green-600 text-white rounded-lg"
}, "Export All to Excel")
```

### Export Options Modal
```javascript
// Modal for export options
const ExportOptionsModal = () => {
  return React.createElement('div', {
    // Options:
    // - Export current campaign only
    // - Export all campaigns (single file)
    // - Export all campaigns (separate files)
    // - Select specific campaigns
  });
};
```

## Benefits of This Approach

1. **Separation of Concerns**: Excel processing is handled server-side, keeping the main app lightweight
2. **Template Preservation**: Uses the actual Excel template with formulas intact
3. **Scalability**: Can handle multiple campaigns and large datasets
4. **Flexibility**: Easy to add new template types or modify existing ones
5. **User Experience**: Clean download experience with progress indicators
6. **Data Integrity**: Server-side validation ensures correct data formatting

## Next Steps

1. Set up Node.js/Express server
2. Implement core Excel export functionality
3. Create API endpoints
4. Add UI integration to index.html
5. Test with sample data
6. Deploy server component