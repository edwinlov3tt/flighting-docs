# Lumina Export Date Preservation Fix

## Problem Statement

When importing flight data from Lumina and then exporting to Excel, the dates were being reset to the first and last day of each month for ALL flights. This didn't match Lumina's original dates, especially when campaigns started mid-month (e.g., January 15th would become January 1st).

**Example:**
- Lumina campaign: **Jan 15, 2025** to **Mar 20, 2025**
- Before fix: Flights showed Jan 1 - Jan 31, Feb 1 - Feb 28, Mar 1 - Mar 31
- After fix: Flights show **Jan 15 - Jan 31**, Feb 1 - Feb 28, **Mar 1 - Mar 20** ✅

## The Fix

### 1. Added `parseDate()` Helper Function (lines 669-688)

```javascript
const parseDate = (dateString) => {
    if (!dateString) return null;

    // Handle ISO datetime format (YYYY-MM-DDTHH:mm:ss or with Z)
    if (typeof dateString === 'string' && (dateString.includes('T') || dateString.includes('Z'))) {
        const datePart = dateString.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    // Handle simple YYYY-MM-DD format
    if (typeof dateString === 'string' && dateString.includes('-')) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    // Fallback to standard Date parsing
    return new Date(dateString);
};
```

**Why:** Handles both simple dates (YYYY-MM-DD) and ISO datetime formats (YYYY-MM-DDTHH:mm:ssZ) from Lumina API, while avoiding timezone offset issues that corrupt dates.

### 2. Updated `generateFlightsFromOrder()` (lines 705-723)

```javascript
const flightData = months.map((month, index) => {
    // Preserve original Lumina dates for first and last flights
    let startDate, endDate;

    if (index === 0) {
        // First flight: use original Lumina start date (timezone-safe parsing)
        startDate = parseDate(tactic.startDate);
    } else {
        // Subsequent flights: use first of month
        startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    }

    if (index === months.length - 1) {
        // Last flight: use original Lumina end date (timezone-safe parsing)
        endDate = parseDate(tactic.endDate);
    } else {
        // Other flights: use last day of month
        endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    }

    const flight = {
        id: Date.now() + index + Math.random(),
        line: index + 1,
        startDate: formatDateForInput(startDate),
        endDate: formatDateForInput(endDate),
        budget: budgetPerMonth
    };
    // ... rest of flight setup
});
```

## How It Works

### Flight Date Logic:

1. **First Flight (index === 0)**
   - **Start Date:** Uses original Lumina start date (e.g., Jan 15)
   - **End Date:** Uses last day of first month (e.g., Jan 31)

2. **Middle Flights (index > 0 && index < months.length - 1)**
   - **Start Date:** First day of month (e.g., Feb 1)
   - **End Date:** Last day of month (e.g., Feb 28)

3. **Last Flight (index === months.length - 1)**
   - **Start Date:** First day of last month (e.g., Mar 1)
   - **End Date:** Uses original Lumina end date (e.g., Mar 20)

### Excel Export Preservation

The dates flow through to Excel correctly because:

1. **Header Dates** (cells F3, F4 for programmatic or C3, C4 for SEM-Social):
   - Uses `campaign.formData.startDate` - Original Lumina start date ✅
   - Uses `campaign.formData.endDate` - Original Lumina end date ✅

2. **Individual Flight Rows**:
   - Uses `flight.startDate` and `flight.endDate` which now preserve original dates ✅

## Testing Scenarios

### Scenario 1: Mid-Month Start/End
**Lumina:** Jan 15, 2025 - Mar 20, 2025

**Expected Flights:**
1. Jan 15 - Jan 31 (preserves Jan 15 start)
2. Feb 1 - Feb 28
3. Mar 1 - Mar 20 (preserves Mar 20 end)

### Scenario 2: ISO Datetime Format
**Lumina:** 2025-01-15T00:00:00Z - 2025-03-20T23:59:59Z

**Expected:** Same as Scenario 1 (datetime portion stripped)

### Scenario 3: Single Month Campaign
**Lumina:** Feb 10, 2025 - Feb 25, 2025

**Expected Flights:**
1. Feb 10 - Feb 25 (both dates preserved)

### Scenario 4: Full Month Alignment
**Lumina:** Jan 1, 2025 - Jan 31, 2025

**Expected Flights:**
1. Jan 1 - Jan 31 (works correctly even when dates align with month boundaries)

## Benefits

✅ **Accurate Date Representation** - Exports match Lumina exactly
✅ **Timezone Safe** - No off-by-one date errors
✅ **Format Flexible** - Handles multiple date formats from API
✅ **Mid-Month Support** - Correctly handles campaigns starting/ending mid-month
✅ **Excel Compatibility** - Dates flow through to all Excel templates correctly

## Validation

To test this fix:

1. Import a Lumina order with mid-month dates
2. Verify flights display correct dates in the app
3. Export to Excel
4. Check Excel header dates (F3, F4) match original Lumina dates
5. Check individual flight rows preserve first/last dates
6. Verify middle flights use full month boundaries

## Code Location

- **Helper Function:** `index.html` lines 669-688
- **Implementation:** `index.html` lines 705-723
- **Export Preservation:** Excel export templates use `campaign.formData.startDate/endDate`

## Related Functions

- `getMonthsBetween()` - Calculates months between two dates
- `formatDateForInput()` - Formats dates for input fields (YYYY-MM-DD)
- `formatDate()` - Formats dates for display (locale string)

## Notes

- This fix only affects **Lumina imports** (`generateFlightsFromOrder`)
- Manual flight creation is unaffected
- The fix respects timezone boundaries to prevent date shifting
- Works with all three template types (programmatic, youtube, sem-social)
