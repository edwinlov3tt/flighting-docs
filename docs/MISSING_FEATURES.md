# Missing Features & To-Do List

This document tracks features from the original `index.html` that are not yet implemented in the refactored version.

## ✅ Core Features Implemented

- ✅ Campaign creation with form validation
- ✅ Tactic selection with search
- ✅ Budget/Impressions/Views auto-calculation
- ✅ Flight generation (monthly splitting)
- ✅ Flight table rendering (all 3 template types)
- ✅ Edit flights (budget, impressions, views)
- ✅ Split flights
- ✅ Lock flights
- ✅ Zero out flights
- ✅ Collapse/expand parent flights
- ✅ Campaign tabs
- ✅ Delete campaigns
- ✅ Totals calculation in footer
- ✅ All utilities and helpers
- ✅ Timezone-safe date parsing
- ✅ Edit buffer pattern (fixes typing bug)

## ❌ Missing Features (Not Yet Implemented)

### 1. **Budget Redistribution Modal**
**Location in original**: Lines 1218-1297, 2651-2721
**Description**: When a flight is zeroed out, opens modal to redistribute budget to other flights
- Even distribution
- Weighted distribution (by active days)
- Custom distribution (select specific flights)

**Why it's missing**: Complex modal logic, requires additional state management

**Priority**: HIGH - Core functionality for budget management

---

### 2. **Multi-Select Mode & Batch Operations**
**Location in original**: Lines 1299-1336, 2616-2640
**Description**: Allows selecting multiple flights and applying bulk operations
- Toggle multi-select mode
- Select/deselect flights
- Batch lock (all/budget/impressions)
- Visual highlighting of selected flights

**Why it's missing**: Requires additional UI state and bulk operation handlers

**Priority**: MEDIUM - Nice to have for power users

---

### 3. **Budget Status Tracker (Sticky Footer)**
**Location in original**: Lines 1189-1203, 2571-2640
**Description**: Sticky footer showing budget validation
- Original budget vs current budget
- Difference indicator (balanced/over/under)
- Button to redistribute missing/leftover budget
- Flight count display

**Why it's missing**: Complex footer UI component

**Priority**: HIGH - Important for budget validation

---

### 4. **Excel Export**
**Location in original**: Lines 470-495, external `excel-export-client.js`
**Description**: Export campaigns to Excel templates
- Uses external server (`excel-export-server.js`)
- Template-specific Excel formats
- Requires ExcelJS library

**Why it's missing**: External dependency, requires server setup

**Priority**: MEDIUM - Can be added later as enhancement

---

### 5. **Lumina Import**
**Location in original**: Lines 563-685, 701-783
**Description**: Import campaign data from Lumina orders/lineitems
- Extract ID from URL
- Fetch from API
- Parse tactics
- Generate flights with Lumina dates preserved
- Handle multiple tactics per order

**Why it's missing**: External API dependency, complex parsing logic

**Priority**: LOW - Organization-specific feature

---

### 6. **Undo/Redo**
**Location in original**: Lines 1066-1098
**Description**: History management for campaigns
- Save state snapshots
- Undo button (Ctrl+Z)
- Redo button (Ctrl+Y)
- History limit (50 states)

**Why it's missing**: Requires additional state management

**Priority**: LOW - Nice to have enhancement

---

### 7. **Edit Campaign Modal**
**Location in original**: Lines 155-243
**Description**: Edit entire campaign (dates, budget, CPM)
- Regenerate flights with new parameters
- Optional CPM editing

**Why it's missing**: Complex modal with regeneration logic

**Priority**: MEDIUM - Useful for campaign adjustments

---

### 8. **CSV Export**
**Location in original**: Lines 1453-1495
**Description**: Export flight data to CSV
- Template-specific columns
- Downloadable file

**Why it's missing**: Simple functionality, can be added easily

**Priority**: LOW - Excel export is preferred

---

### 9. **Validation Alert**
**Location in original**: Lines 997-1005, 1870-1879
**Description**: Show validation errors with "Proceed Anyway" option
- Allows generating flights despite validation errors

**Why it's missing**: Current implementation blocks invalid submissions

**Priority**: LOW - Stricter validation is probably better

---

### 10. **Export Loading State**
**Location in original**: Lines 471-478, 85
**Description**: Loading indicator during Excel export
- Event-based communication with export client

**Why it's missing**: No Excel export yet

**Priority**: N/A - Implement when Excel export is added

---

## 📋 Recommended Implementation Order

### Phase 7 (Critical - Do First)
1. ✅ Create HTML entry point for testing
2. ✅ Test basic campaign creation flow
3. ✅ Test all three template types

### Phase 8 (High Priority)
1. **Budget Redistribution Modal** - Core feature
2. **Budget Status Tracker** - Important validation feedback
3. **calculateBudgetStatus utility** - Required for tracker

### Phase 9 (Medium Priority)
4. **Multi-Select Mode** - Power user feature
5. **Edit Campaign Modal** - Useful enhancement
6. **CSV Export** - Simple addition

### Phase 10 (Low Priority / Future Enhancements)
7. **Excel Export** - Requires server setup
8. **Lumina Import** - Organization-specific
9. **Undo/Redo** - Nice to have
10. **Validation Alert** - Optional

---

## 🔧 Quick Wins (Easy to Add)

These features can be added quickly with minimal code:

1. **CSV Export** (~30 lines) - Export button + download logic
2. **calculateBudgetStatus** (~15 lines) - Utility function
3. **Collapse All/Expand All buttons** (~20 lines) - Already have collapse state

---

## 💡 Notes

- The refactored version has **all core functionality** for creating and managing flight campaigns
- Missing features are mostly **enhancements** and **nice-to-haves**
- The architecture makes it **easy to add** these features incrementally
- **Budget Redistribution** is the most important missing feature for full parity with original
