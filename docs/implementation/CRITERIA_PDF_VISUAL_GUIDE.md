# Criteria PDF Generation - Visual Guide

## Feature Location

### Step 1: Navigate to I-Patroller Page
Click on "I-Patroller" in the sidebar navigation.

### Step 2: Click on Criteria Tab
```
┌─────────────────────────────────────────────────────────────┐
│  [Daily Counts]  [Criteria]  [Top Performers]              │
│                     ↑                                        │
│                Click here                                    │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Generate PDF Button
Once on the Criteria tab, you'll see the "Generate PDF" button:

```
┌─────────────────────────────────────────────────────────────┐
│  [Daily Counts]  [Criteria]  [📄 Generate PDF]  [Top...]   │
│                                    ↑                         │
│                              Click to generate               │
└─────────────────────────────────────────────────────────────┘
```

## Button States

### Normal State
```
┌──────────────────────┐
│ 📄 Generate PDF      │
└──────────────────────┘
```

### Loading State
```
┌──────────────────────┐
│ ⟳ Generating...      │
└──────────────────────┘
```

### Disabled State (during generation)
```
┌──────────────────────┐
│ ⟳ Generating...      │  (grayed out, not clickable)
└──────────────────────┘
```

## PDF Output Structure

### Header Section
```
═══════════════════════════════════════════════════════════════
        I-Patroller Criteria Report - May 2026
        Generated on: May 14, 2026, 10:30 AM
═══════════════════════════════════════════════════════════════
```

### Table Structure (Landscape A4)
```
┌──┬─────────────┬────┬────┬────┬────┬────┬────┬────────────────┬────────────────┬────────────────┬────────┐
│# │Municipality │Brgy│Min │Tgt │Days│Freq│Min │  Actual/Week  │ Attended/Week │ Efficiency %  │Overall │
│  │   /City     │    │Rpt │Brgy│C/M │/Wk │/Wk │ W1 W2 W3 W4   │ W1 W2 W3 W4   │ W1 W2 W3 W4   │Average │
├──┼─────────────┼────┼────┼────┼────┼────┼────┼────────────────┼────────────────┼────────────────┼────────┤
│  │ 1ST DISTRICT                                                                                          │
├──┼─────────────┼────┼────┼────┼────┼────┼────┼────────────────┼────────────────┼────────────────┼────────┤
│1 │Abucay       │ 9  │ 14 │ 7  │ 1  │ 5  │ 98 │ 95 102 98 100 │ 85 90 88 92   │ 87% 92% 90% 94%│  91%  │
│2 │Orani        │ 29 │ 14 │ 7  │ 4  │ 2  │ 98 │ 88 95 92 89   │ 78 85 82 80   │ 80% 87% 84% 82%│  83%  │
│3 │Samal        │ 14 │ 14 │ 7  │ 2  │ 4  │ 98 │ 92 98 95 97   │ 82 88 85 87   │ 84% 90% 87% 89%│  87%  │
│4 │Hermosa      │ 23 │ 14 │ 7  │ 3  │ 2  │ 98 │ 85 90 88 92   │ 75 80 78 82   │ 77% 82% 80% 84%│  81%  │
├──┼─────────────┼────┼────┼────┼────┼────┼────┼────────────────┼────────────────┼────────────────┼────────┤
│  │ 2ND DISTRICT                                                                                          │
├──┼─────────────┼────┼────┼────┼────┼────┼────┼────────────────┼────────────────┼────────────────┼────────┤
│5 │Balanga City │ 25 │ 14 │ 7  │ 4  │ 2  │ 98 │ 100 105 102 98│ 90 95 92 88   │ 92% 97% 94% 90%│  93%  │
│  │   ...       │    │    │    │    │    │    │                │                │                │        │
└──┴─────────────┴────┴────┴────┴────┴────┴────┴────────────────┴────────────────┴────────────────┴────────┘
```

### Color Coding (Overall Average Column)
```
┌────────────────────────────────────────┐
│ Overall Average Color Legend:          │
├────────────────────────────────────────┤
│ 🟢 Green (≥90%)    - Outstanding       │
│ 🟢 Light Green (75-89%) - Very Sat.    │
│ 🟡 Yellow (60-74%) - Satisfactory      │
│ 🟠 Orange (50-59%) - Good              │
│ 🔴 Red (<50%)      - Needs Improvement │
└────────────────────────────────────────┘
```

### Legend Section (Bottom of PDF)
```
Computation Formulas:

1. Actual No. of Report/Week:
   Sum of daily patrol counts for 7 days (Day 1 to Day 7 for Week 1, Day 8 to Day 14 for Week 2, etc.)
   Formula: Week Total = Day1 + Day2 + Day3 + Day4 + Day5 + Day6 + Day7

2. Minimum Number of Reports/Week:
   Formula: Minimum Reports/Week = Minimum Reports/Day × 7 days
   Example: 14 reports/day × 7 days = 98 reports/week

3. % of Efficiency per Week:
   Formula: Efficiency % = (No. of Report Attended / Minimum Number of Reports per Week) × 100
   Example: (85 attended / 98 minimum) × 100 = 86.73% ≈ 86% (rounded down)

4. Overall Average:
   Formula: Overall % = (Total Reports Attended in All Weeks / Total Minimum Reports for All Weeks) × 100
   Total Minimum = 98 reports/week × 4 weeks = 392 reports
   Example: (350 total attended / 392 total minimum) × 100 = 89.28% ≈ 89% (rounded down, capped at 100%)
```

## Notification Examples

### Success Notification
```
┌─────────────────────────────────────────┐
│ ✓ PDF Generated Successfully            │
│                                          │
│ IPatroller_Criteria_May_2026.pdf        │
│ has been downloaded                      │
└─────────────────────────────────────────┘
```

### Error Notification
```
┌─────────────────────────────────────────┐
│ ✗ Failed to generate PDF                │
│                                          │
│ An error occurred while generating      │
│ the PDF                                  │
└─────────────────────────────────────────┘
```

## File Naming Convention

```
Format: IPatroller_Criteria_[Month]_[Year].pdf

Examples:
- IPatroller_Criteria_January_2026.pdf
- IPatroller_Criteria_May_2026.pdf
- IPatroller_Criteria_December_2025.pdf
```

## Data Flow Diagram

```
┌─────────────────┐
│ User clicks     │
│ Generate PDF    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Collect data:   │
│ - Patrol data   │
│ - Command Ctr   │
│ - Municipality  │
│   metadata      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Calculate:      │
│ - Weekly totals │
│ - Efficiency %  │
│ - Overall avg   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate PDF:   │
│ - Create table  │
│ - Apply colors  │
│ - Add legend    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Download file   │
│ Show success    │
│ notification    │
└─────────────────┘
```

## Column Details

### Fixed Columns (1-8)
| # | Column Name | Description | Value Type |
|---|-------------|-------------|------------|
| 1 | # | Row number | Sequential |
| 2 | Municipality/City | Name | Text |
| 3 | No. of Barangay | Count | Number |
| 4 | Min No. of Reports/Day | Constant | 14 |
| 5 | Target Brgys/Day | Constant | 7 |
| 6 | Days to Complete C/M | Variable | Number |
| 7 | Frequency of Visit/Week | Variable | Number |
| 8 | Min No. of Reports/Week | Constant | 98 |

### Weekly Data Columns (9-20)
| Columns | Group | Description |
|---------|-------|-------------|
| 9-12 | Actual Reports | W1, W2, W3, W4 patrol counts |
| 13-16 | Attended Reports | W1, W2, W3, W4 action taken |
| 17-20 | Efficiency % | W1, W2, W3, W4 percentages |

### Summary Column (21)
| Column | Description | Calculation |
|--------|-------------|-------------|
| 21 | Overall Average | Total efficiency % (max 100%) |

## Performance Indicators

### Color-Coded Performance Levels
```
┌──────────────────────────────────────────────────┐
│ Performance Level    │ Range    │ Color          │
├──────────────────────┼──────────┼────────────────┤
│ Outstanding          │ ≥90%     │ Green          │
│ Very Satisfactory    │ 75-89%   │ Light Green    │
│ Satisfactory         │ 60-74%   │ Yellow         │
│ Good                 │ 50-59%   │ Orange         │
│ Needs Improvement    │ <50%     │ Red            │
└──────────────────────┴──────────┴────────────────┘
```

## Tips for Best Results

1. **Select the correct month/year** before generating
2. **Ensure data is saved** to Firestore first
3. **Wait for generation to complete** (don't click multiple times)
4. **Check your downloads folder** for the PDF file
5. **Use landscape orientation** when printing for best results

## Troubleshooting

### PDF not downloading?
- Check browser's download settings
- Ensure pop-ups are not blocked
- Try a different browser

### Missing data in PDF?
- Verify data is entered in the Criteria tab
- Check that Command Center data is loaded
- Refresh the page and try again

### Colors not showing?
- PDF viewer may not support colors
- Try opening in Adobe Acrobat Reader
- Print preview should show colors

## Browser Compatibility

✅ Chrome/Edge - Fully supported
✅ Firefox - Fully supported  
✅ Safari - Fully supported
✅ Opera - Fully supported

## Print Settings Recommendation

```
Paper Size: A4
Orientation: Landscape
Margins: Normal
Scale: Fit to page
Color: Color (not black & white)
```
