# Report Attended Counting Logic Update

## Date: June 10, 2026
## Updated By: Kiro AI Assistant

## Summary
Updated the counting logic for "No. of Report Attended / Week" in both the **Criteria Tab** and **Top Performers** to count based on **after photos** starting from **April 2026 onwards**.

---

## Changes Made

### 1. Main Criteria Tab (`loadCommandCenterActionData`)
**Location:** `src/pages/IPatroller.jsx` (lines ~450-530)

#### New Logic:
- **April to December 2026 and future years (2027+)**: Count based on **after photos**
- **January to March (all years)**: Keep existing logic unchanged

#### Implementation:
```javascript
const isAprilToDecember2026OrLater = 
  (selectedYear === 2026 && selectedMonth >= 3) || 
  (selectedYear > 2026 && selectedMonth >= 3);
```

**Counting Rule:**
- If April 2026 onwards: Count entries with before/after photo pairs
  - Multiple photo rows: Count each row with after photos
  - Single photo structure: Count if both before and after photos exist
- Otherwise: Use existing logic (March-October uses actionTaken text, other months use photos)

---

### 2. Top Performers (`loadTopPerformersData`)
**Location:** `src/pages/IPatroller.jsx` (lines ~1125-1175)

#### Updated to match main criteria logic:
```javascript
const isAprilToDecember2026OrLater = 
  (year === 2026 && month >= 3) || 
  (year > 2026 && month >= 3);
```

Same counting rules applied for consistency with Criteria tab.

---

### 3. Top Performers Direct Load (`loadTopPerformersDataDirectly`)
**Location:** `src/pages/IPatroller.jsx` (lines ~2095-2150)

#### Updated to match main criteria logic:
Same logic applied for date range PDF generation and multi-month reports.

---

## Affected Features

### ✅ Criteria Tab
- "No. of Report Attended / Week" columns (W1, W2, W3, W4)
- Weekly efficiency calculations
- Overall percentage calculations
- PDF report generation

### ✅ Top Performers
- Ranking calculations based on action taken counts
- Top 12 performers list
- Single month PDF reports
- Date range PDF reports (multiple months)

---

## Data Source
All counting is based on Command Center data:
- **Firestore Path:** `commandCenter/weeklyReports/{municipality}/{MonthName}_{Year}`
- **Data Structure:** `weeklyReportData` object containing date entries with photo information

---

## Photo Counting Logic

### Multiple Photo Rows (New Structure):
```javascript
if (entry.photos && entry.photos.rows && Array.isArray(entry.photos.rows)) {
  rowsWithAfterPhotos = entry.photos.rows.filter(row =>
    row.after && Array.isArray(row.after) && row.after.length > 0
  ).length;
}
```

### Single Photo Structure (Legacy):
```javascript
const hasBeforePhoto = entry.photos && entry.photos.before;
const hasAfterPhoto = entry.photos && entry.photos.after && hasBeforePhoto;
if (hasAfterPhoto) rowsWithAfterPhotos = 1;
```

---

## Timeline

### Before April 2026:
- **2025 and earlier**: Original logic
  - March-October: Count based on `actionTaken` text field
  - Other months: Count based on after photos
- **January-March 2026**: Original logic maintained

### April 2026 Onwards:
- **April-December 2026**: Count based on after photos ✅
- **2027 onwards (April-December)**: Count based on after photos ✅
- **January-March (any year)**: Existing logic unchanged ✅

---

## Testing Recommendations

1. ✅ Test Criteria tab for April 2026 - should count after photos
2. ✅ Test Criteria tab for January-March 2026 - should use old logic
3. ✅ Test Top Performers for April 2026 - should count after photos
4. ✅ Test Top Performers for future years (2027) - should count after photos
5. ✅ Verify PDF generation includes correct counts
6. ✅ Test date range PDFs spanning multiple months

---

## Code Quality

- ✅ No syntax errors (verified with getDiagnostics)
- ✅ Consistent logic across all three functions
- ✅ Backward compatible with existing data
- ✅ Clear comments explaining the logic
- ✅ Proper error handling maintained

---

## Related Files
- `src/pages/IPatroller.jsx` - Main implementation
- `src/pages/CommandCenter.jsx` - Data source (photos upload)

---

## Notes
- The cache system (`commandCenterCache` and `weeklyReportCache`) automatically handles the updated logic
- No database schema changes required
- Photo structure supports both legacy and new multi-row formats
