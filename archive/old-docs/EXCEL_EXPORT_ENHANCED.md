# Enhanced Excel Export System

## Overview

The enhanced Excel export system supports dynamic row generation with alternating colors, individual template files, and proper formula preservation. It automatically extends rows based on the number of flights while maintaining consistent formatting and alternating row colors.

## Features

✅ **Dynamic Row Generation**: Automatically adds/removes rows based on flight count  
✅ **Alternating Row Colors**: Maintains consistent white/light gray alternating pattern  
✅ **Individual Template Files**: Uses separate template files for each campaign type  
✅ **Formula Preservation**: Maintains Excel formulas and updates references for new rows  
✅ **Template Type Support**: Programmatic, YouTube, and SEM/Social templates  
✅ **Bulk Export**: Export multiple campaigns to a single workbook  
✅ **Enhanced Error Handling**: Comprehensive validation and error reporting  

## Template Files

The system uses individual template files located in the `templates/` directory:

- `Programmatic Budget Flighting Template.xlsx` - For programmatic campaigns
- `YouTube Budget Flighting Template.xlsx` - For YouTube campaigns  
- `SEM_Social Budget Flighting Template.xlsx` - For SEM/Social campaigns
- `Full Budget Flighting Template.xlsx` - Complete template with all types

## Fillable Ranges

Each template has specific fillable ranges that support dynamic expansion:

### YouTube Template
- **Range**: B9:I544 (up to 536 flights)
- **Columns**: B, C, D, E, F, G, H, I
- **Data**: Campaign Suffix, Start Date, End Date, Views, Days, Daily Views, Daily Budget, Total Retail

### Programmatic Template  
- **Range**: B13:G52 (up to 40 flights, dynamically expandable)
- **Columns**: B, C, D, E, F, G
- **Data**: Start Date, End Date, Budget, Impressions, Traffic Budget, Traffic Impressions

### SEM/Social Template
- **Range**: B11:D34 (up to 24 flights, dynamically expandable)  
- **Columns**: B, C, D
- **Data**: Start Date, End Date, Budget

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Enhanced Export Server

```bash
# Start enhanced export server only
npm run start-enhanced-export

# Or start both dev server and export server
npm run dev-with-export
```

### 3. Verify Server is Running

The server will start on port 3001 and display:
```
Enhanced Excel export server running on port 3001
Supported template types: programmatic,youtube,sem-social
Template files:
  programmatic: ./templates/Programmatic Budget Flighting Template.xlsx
  youtube: ./templates/YouTube Budget Flighting Template.xlsx
  sem-social: ./templates/SEM_Social Budget Flighting Template.xlsx
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and template information.

### Template Information
```
GET /api/templates/info
```
Returns available templates and fillable ranges.

### Single Campaign Export
```
POST /api/export/single
```
**Body:**
```json
{
  "campaign": {
    "name": "Campaign Name",
    "templateType": "programmatic",
    "flights": [
      {
        "startDate": "2025-01-01",
        "endDate": "2025-01-31", 
        "budget": 10000,
        "impressions": 100000
      }
    ],
    "formData": {
      "startDate": "2025-01-01",
      "endDate": "2025-12-31",
      "rate": 10.0
    }
  }
}
```

### Bulk Export
```
POST /api/export/bulk
```
**Body:**
```json
{
  "campaigns": [
    { /* campaign 1 */ },
    { /* campaign 2 */ }
  ]
}
```

### Download File
```
GET /api/export/download/:fileName
```

## Client-Side Usage

### Basic Export

```javascript
// Export single campaign
await exportCampaignToExcel(campaign);

// Export multiple campaigns  
await exportCampaignsToExcel([campaign1, campaign2]);
```

### Server Health Check

```javascript
// Check if server is running
const health = await checkExportServerHealth();
if (health) {
    console.log('Server is ready:', health.status);
}

// Get template information
const templates = await getTemplateInfo();
console.log('Available templates:', templates.supportedTypes);
```

## Dynamic Row Generation

The system automatically handles different flight counts:

### Small Flight Counts (Within Template Range)
- Uses existing template rows
- Applies alternating colors to used rows only

### Large Flight Counts (Exceeding Template Range) 
- Dynamically creates additional rows
- Copies formatting and formulas from template rows
- Updates formula references for new row positions
- Maintains alternating color pattern across all rows

### Example: Programmatic Campaign with 100 Flights
- Template supports 40 flights (rows 13-52)
- System creates 60 additional rows (53-112)
- Each new row copies formatting from row 13
- Formulas are updated to reference correct rows
- Alternating colors applied to all 100 rows

## Alternating Colors

The system maintains consistent alternating row colors:

- **Light Rows** (even indices): White background (#FFFFFF)
- **Dark Rows** (odd indices): Light gray background (#F2F2F2)

Colors are applied to all columns within the fillable range for each template type.

## Formula Handling

### Preserved Formulas
The system preserves and updates Excel formulas when creating new rows:

- **End Date Formulas**: `=IFERROR(IF(EOMONTH(B13,0)>$F$4,$F$4,EOMONTH(B13,0)),"")`
- **Impression Calculations**: `=IFERROR(D13/$C$6*1000,"")`
- **Traffic Budget**: `=IFERROR(D13*(1.01),"")`

### Formula Updates
When copying rows, the system automatically updates cell references:
- `B13` → `B14` for row 14
- `D13` → `D14` for row 14
- Absolute references like `$F$4` remain unchanged

## Error Handling

### Client-Side Validation
- Validates campaign has `templateType` and `flights` array
- Checks server availability before export attempts
- Provides specific error messages for different failure types

### Server-Side Validation  
- Validates template files exist
- Checks campaign data structure
- Handles template reading errors
- Validates flight data completeness

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|--------|----------|
| "Template file not found" | Missing template file | Ensure template exists in `templates/` directory |
| "Campaign must have templateType" | Missing template type | Add `templateType` field to campaign data |
| "Server not responding" | Export server not running | Start server with `npm run start-enhanced-export` |
| "Invalid campaigns found" | Malformed campaign data | Check campaign structure and required fields |

## Performance Considerations

### Memory Usage
- Large flight counts (500+) may require significant memory
- Each row copy includes formatting and formula data
- Consider batch processing for very large exports

### Processing Time
- Export time scales with flight count and formula complexity
- Typical performance: ~50-100 flights per second
- Network transfer time depends on file size

### File Size
- Base template: ~10-35KB per campaign
- Additional rows add ~100-200 bytes each
- 1000 flights ≈ 100-200KB additional size

## Development & Testing

### Test Different Flight Counts

```javascript
// Test small count (within template range)
const smallCampaign = {
    name: "Small Test",
    templateType: "programmatic", 
    flights: Array(10).fill().map((_, i) => ({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        budget: 1000,
        impressions: 10000
    }))
};

// Test large count (exceeding template range)
const largeCampaign = {
    name: "Large Test",
    templateType: "programmatic",
    flights: Array(100).fill().map((_, i) => ({
        startDate: "2025-01-01", 
        endDate: "2025-01-31",
        budget: 1000,
        impressions: 10000
    }))
};

await exportCampaignToExcel(smallCampaign);
await exportCampaignToExcel(largeCampaign);
```

### Analyze Template Structure

```bash
npm run analyze-templates
```

## Troubleshooting

### Server Won't Start
1. Check if port 3001 is available
2. Verify template files exist in `templates/` directory
3. Check Node.js version (requires Node 14+)
4. Run `npm install` to ensure dependencies are installed

### Export Fails
1. Check server health with `/health` endpoint
2. Validate campaign data structure
3. Check browser console for client-side errors
4. Verify template file permissions

### Formatting Issues
1. Ensure template files are not corrupted
2. Check that fillable ranges are correctly defined
3. Verify alternating color application in exported files
4. Test with small flight counts first

## Files Overview

| File | Purpose |
|------|---------|
| `excel-export-server-enhanced.js` | Main enhanced export server |
| `excel-export-client.js` | Updated client-side integration |
| `templates/*.xlsx` | Individual template files |
| `EXCEL_EXPORT_ENHANCED.md` | This documentation |
| `package.json` | Updated with new scripts |

## Next Steps

1. **Integration**: Integrate export buttons into main application
2. **Testing**: Test with various flight counts and template types  
3. **Optimization**: Performance tuning for large exports
4. **Features**: Add custom color schemes, summary sheets, etc.

---

## Quick Start Commands

```bash
# Install and start enhanced export system
npm install
npm run start-enhanced-export

# In another terminal, start the main app
npm run dev

# Open browser to http://localhost:8080
# Export functionality will be available with server running on port 3001
```