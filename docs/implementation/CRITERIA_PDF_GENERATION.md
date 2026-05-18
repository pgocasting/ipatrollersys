# Criteria Tab PDF Generation Feature

## Overview
Added PDF generation functionality to the Criteria tab in the I-Patroller page, allowing users to export the complete criteria report with all weekly data, efficiency calculations, and overall performance metrics.

## Implementation Date
May 14, 2026

## Changes Made

### 1. UI Button Addition
**Location:** `src/pages/IPatroller.jsx` (around line 2491)

Added a "Generate PDF" button that appears when the Criteria tab is active:
- Button shows loading state with spinner during PDF generation
- Positioned next to the Daily Counts "Export Excel" button
- Uses consistent styling with other action buttons

```jsx
{activeTab === "criteria" && (
  <Button
    onClick={generateCriteriaPdf}
    variant="outline"
    size="sm"
    className="h-8"
    disabled={isGeneratingPdf}
  >
    {isGeneratingPdf ? (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Generating...
      </>
    ) : (
      <>
        <FileText className="w-4 h-4 mr-2" />
        Generate PDF
      </>
    )}
  </Button>
)}
```

### 2. PDF Generation Function
**Location:** `src/pages/IPatroller.jsx` (after `getStatusText` function)

Created `generateCriteriaPdf()` function with the following features:

#### PDF Layout
- **Orientation:** Landscape (A4) to accommodate wide table
- **Title:** "I-Patroller Criteria Report - [Month] [Year]"
- **Timestamp:** Generation date and time
- **Table:** Complete criteria data with all columns

#### Table Columns (21 columns total)
1. **#** - Row number
2. **Municipality/City** - Municipality name
3. **No. of Barangay** - Barangay count
4. **Min No. of Reports/Day** - Constant (14)
5. **Target Brgys/Day** - Target (7)
6. **Days to Complete C/M** - Days to complete monitoring
7. **Frequency of Visit/Week** - Weekly visit frequency
8. **Min No. of Reports/Week** - Weekly minimum (98)
9-12. **W1-W4 (Actual)** - Actual reports per week
13-16. **W1-W4 (Attended)** - Reports attended per week (from Command Center)
17-20. **W1-W4 (Efficiency)** - Efficiency percentage per week
21. **Overall Average** - Overall efficiency percentage

#### Data Processing
- Groups municipalities by district
- Calculates weekly actual patrol counts from daily data
- Retrieves weekly attended counts from Command Center data
- Computes efficiency: `(Attended / Minimum) × 100`
- Calculates overall percentage: `(Total Attended / Total Minimum) × 100` (capped at 100%)

#### Visual Features
- **District Headers:** Gray background with bold text
- **Color-coded Overall Percentage:**
  - Green (≥90%): Outstanding
  - Light Green (75-89%): Very Satisfactory
  - Yellow (60-74%): Satisfactory
  - Orange (50-59%): Good
  - Red (<50%): Needs Improvement
- **Compact Layout:** Optimized font sizes and cell widths for landscape format
- **Computation Formulas:** Detailed calculation methods at the bottom of the PDF

#### File Naming
Format: `IPatroller_Criteria_[Month]_[Year].pdf`
Example: `IPatroller_Criteria_May_2026.pdf`

### 3. User Feedback
- Success toast notification with filename
- Error toast notification if generation fails
- Loading state prevents multiple simultaneous generations
- Console error logging for debugging

## Technical Details

### Dependencies Used
- `jspdf` - PDF document generation
- `jspdf-autotable` - Table generation in PDF
- `sonner` - Toast notifications
- Custom notification hook - Additional user feedback

### Data Sources
1. **Patrol Data:** From `patrolData` state (daily counts)
2. **Command Center Data:** From `commandCenterActionData` state (weekly attended reports)
3. **Municipality Metadata:** 
   - `barangayCounts` - Number of barangays per municipality
   - `daysToCompleteCM` - Days to complete monitoring
   - `weeklyVisitFrequency` - Visit frequency per week

### Calculations
```javascript
// Weekly Actual Reports
weekSum = sum of daily data for 7 days

// Weekly Efficiency
efficiency = floor((attended / 98) * 100)

// Overall Percentage
totalAttended = sum of all weeks attended
totalMinimum = 98 * 4 weeks = 392
overallPercentage = min(floor((totalAttended / totalMinimum) * 100), 100)
```

## Usage Instructions

1. Navigate to the I-Patroller page
2. Click on the "Criteria" tab
3. Select the desired month and year using the dropdown filters
4. Click the "Generate PDF" button
5. The PDF will be automatically downloaded to your default downloads folder

## Benefits

1. **Complete Documentation:** Exports all criteria data in a professional format
2. **Easy Sharing:** PDF format is universally accessible and printable
3. **Performance Tracking:** Visual color coding makes it easy to identify performance levels
4. **Audit Trail:** Includes generation timestamp for record-keeping
5. **Comprehensive View:** Shows all metrics in a single document

## Future Enhancements (Optional)

- Add date range selection for multi-month reports
- Include charts/graphs for visual analysis
- Add signature fields for official reports
- Export options (Letter vs A4 paper size)
- Custom column selection
- Email integration for direct sharing

## Testing Checklist

- [x] Button appears only on Criteria tab
- [x] Loading state works correctly
- [x] PDF generates with correct data
- [x] District grouping works properly
- [x] Weekly calculations are accurate
- [x] Color coding applies correctly
- [x] File downloads with correct name
- [x] Toast notifications appear
- [x] Error handling works
- [x] No console errors

## Related Files

- `src/pages/IPatroller.jsx` - Main implementation
- `src/components/ui/button.jsx` - Button component
- `src/components/ui/notification.jsx` - Notification system

## Notes

- The PDF uses landscape orientation to fit all 21 columns
- Font sizes are optimized (6-8pt) for readability while fitting data
- The function integrates seamlessly with existing Command Center data
- Color coding matches the performance criteria used in Top Performers
