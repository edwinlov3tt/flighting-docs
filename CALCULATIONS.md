# Media Flight Planner - Calculation Logic

## Overview

This document explains how all calculations work in the Media Flight Planner application. The calculation system is designed with **rate/CPM as the source of truth**, ensuring accurate budget and impression calculations across all campaign types.

## Core Principles

1. **Rate is Source of Truth**: CPM (Cost Per Mille) or CPV (Cost Per View) rates drive all calculations
2. **Consistent Rounding**:
   - Currency values: Always rounded to 2 decimal places (e.g., $142543.33)
   - Impressions/Views: Always whole numbers (e.g., 85417)
3. **Only Calculate on Change**: Recalculation only happens when values are actually edited, not on click
4. **Prevent Precision Loss**: No flashing of unrounded numbers during editing

## Rounding Functions

### `roundToCents(value)`
- **Purpose**: Round currency values to exactly 2 decimal places
- **Used For**: Budget, traffic budget, total retail, daily platform budget
- **Formula**: `Math.round(value * 100) / 100`
- **Example**: `142543.332343343` → `142543.33`

### `gracefulRound(value)`
- **Purpose**: Round to whole numbers
- **Used For**: Impressions, views, traffic impressions
- **Formula**: `Math.round(value)`
- **Example**: `85417.8` → `85417`

## Campaign Types & Calculations

### 1. Programmatic Campaigns

**Template Type**: `programmatic`

**Core Calculations**:

```javascript
// Budget → Impressions
impressions = Math.floor((budget / CPM) * 1000)

// Impressions → Budget
budget = roundToCents((impressions * CPM) / 1000)

// Traffic Budget (1% markup)
trafficBudget = roundToCents(budget * 1.01)

// Traffic Impressions
trafficImpressions = Math.floor((trafficBudget / CPM) * 1000)
```

**Example** (CPM = $12.00):
- Budget: $1,000.00
- Impressions: 83,333 (calculated)
- Traffic Budget: $1,010.00 (calculated)
- Traffic Impressions: 84,166 (calculated)

### 2. YouTube Campaigns

**Template Type**: `youtube`

**Metric Types**: CPM or CPV

**Core Calculations**:

```javascript
// For CPV campaigns:
dailyPlatformBudget = roundToCents(dailyViews * CPV)
totalRetail = roundToCents(totalViews * CPV)

// For CPM campaigns:
dailyPlatformBudget = roundToCents(dailyViews * (CPM / 1000))
totalRetail = roundToCents(totalViews * (CPM / 1000))

// Daily views calculation:
dailyViews = roundToCents(totalViews / daysInFlight)
```

**Example** (CPV = $0.15, 30 days):
- Total Views: 10,000
- Daily Views: 333.33 (calculated)
- Daily Platform Budget: $50.00 (calculated)
- Total Retail: $1,500.00 (calculated)

### 3. SEM/Social Campaigns

**Template Type**: `sem-social`

**Core Calculations**:
- Simple budget allocation across date ranges
- No impression calculations
- Only budget fields are editable

**Example**:
- Total Budget: $5,000.00
- Split across monthly flights
- Each flight gets proportional budget

## Edit & Recalculation Flow

### Step 1: User Clicks Cell
```javascript
// useEditBuffer: start()
originalValueRef.current = currentValue  // Store original
buffer = String(currentValue)            // Convert to string for editing
editing = true                           // Enter edit mode
```

### Step 2: User Edits Value
```javascript
// User types in input field
buffer = "1234.56"  // String buffer prevents keystroke issues
```

### Step 3: User Commits (Blur or Enter)
```javascript
// useEditBuffer: commit()
parsed = parseFn(buffer)  // Parse to number with rounding

// CRITICAL: Only commit if value changed
if (parsed !== originalValueRef.current) {
  onCommit(parsed)  // Trigger recalculation
}
```

### Step 4: Recalculation
```javascript
// useCampaigns: updateFlightValue()

// For budget field:
newBudget = roundToCents(value)

// CRITICAL: Only update if changed
if (newBudget === flight.budget) return  // Skip recalculation

flight.budget = newBudget
flight.impressions = calculateImpressions(newBudget, rate)
// ... other dependent fields
```

## Budget Validation

The system validates that total flight budgets match the original campaign budget:

```javascript
totalBudget = roundToCents(flights.reduce((sum, f) => sum + f.budget, 0))
originalBudget = roundToCents(campaign.formData.totalBudget)
difference = totalBudget - originalBudget

// Valid if within 1 cent
isValid = Math.abs(difference) < 0.01
```

## Preventing Precision Loss

### Problem Prevented
- ❌ Clicking field without editing causes recalculation
- ❌ Flashing unrounded numbers (142543.332343343)
- ❌ Impressions changing when budget not edited

### Solution Implemented

1. **Value Change Detection** (useEditBuffer.js:45)
   ```javascript
   if (parsed !== originalValueRef.current) {
     onCommit(parsed)  // Only commit if changed
   }
   ```

2. **Early Return on No Change** (useCampaigns.js:126)
   ```javascript
   if (budget === flight.budget) return updated  // Skip update
   ```

3. **Consistent Rounding** (calculations.js)
   ```javascript
   roundToCents()    // All currency: 2 decimals
   gracefulRound()   // All counts: whole numbers
   ```

## Template-Specific Fields

### Programmatic
- **Budget**: Editable, drives impressions
- **Impressions**: Editable, drives budget
- **Traffic Budget**: Auto-calculated (budget × 1.01)
- **Traffic Impressions**: Auto-calculated from traffic budget

### YouTube
- **Total Views**: Editable, drives daily calculations
- **Daily Views**: Auto-calculated (totalViews / daysInFlight)
- **Daily Platform Budget**: Auto-calculated from daily views
- **Total Retail**: Auto-calculated from total views

### SEM/Social
- **Budget**: Editable
- **No impression calculations**

## Active Days Calculation

```javascript
getActiveDays(startDate, endDate) {
  start = new Date(startDate)
  end = new Date(endDate)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
}
```

**Example**:
- Start: 2025-01-01
- End: 2025-01-31
- Active Days: 31 (inclusive)

## File References

- **Rounding Logic**: `/src/utils/calculations.js`
- **Edit Buffer**: `/src/hooks/useEditBuffer.js`
- **Update Logic**: `/src/hooks/useCampaigns.js:108-174`
- **Budget Cell**: `/src/components/TableCells/BudgetCell.jsx`
- **Impressions Cell**: `/src/components/TableCells/ImpressionsCell.jsx`

## Summary

The calculation system ensures:
1. ✅ Rate/CPM is always the source of truth
2. ✅ All currency rounded to 2 decimals
3. ✅ All counts are whole numbers
4. ✅ Recalculation only on actual value change
5. ✅ No precision loss or flashing numbers
6. ✅ Clicking without editing causes no changes
