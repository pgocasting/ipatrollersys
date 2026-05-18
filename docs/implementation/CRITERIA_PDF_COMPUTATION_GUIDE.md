# Criteria PDF - Computation Formulas Guide

## Overview
This document explains the computation formulas displayed at the bottom of the Criteria PDF report. These formulas show exactly how each metric is calculated.

## PDF Bottom Section Layout

```
═══════════════════════════════════════════════════════════════════════════════
Computation Formulas:

1. Actual No. of Report/Week:
   Sum of daily patrol counts for 7 days (Day 1 to Day 7 for Week 1, 
   Day 8 to Day 14 for Week 2, etc.)
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
═══════════════════════════════════════════════════════════════════════════════
```

## Detailed Formula Breakdown

### Formula 1: Actual No. of Report/Week

**Purpose:** Calculate the total number of patrol reports submitted in a given week.

**Method:** Sum all daily patrol counts for 7 consecutive days.

**Week Breakdown:**
- **Week 1:** Days 1-7 (e.g., May 1-7)
- **Week 2:** Days 8-14 (e.g., May 8-14)
- **Week 3:** Days 15-21 (e.g., May 15-21)
- **Week 4:** Days 22-28+ (e.g., May 22-31)

**Formula:**
```
Week Total = Day1 + Day2 + Day3 + Day4 + Day5 + Day6 + Day7
```

**Example Calculation:**
```
Municipality: Abucay
Week 1 Daily Counts: 12, 15, 14, 13, 16, 14, 11

Week 1 Total = 12 + 15 + 14 + 13 + 16 + 14 + 11 = 95 reports
```

---

### Formula 2: Minimum Number of Reports/Week

**Purpose:** Establish the baseline requirement for weekly patrol reports.

**Method:** Multiply the daily minimum requirement by 7 days.

**Constants:**
- Minimum Reports/Day = **14** (fixed requirement)
- Days per Week = **7**

**Formula:**
```
Minimum Reports/Week = Minimum Reports/Day × 7 days
```

**Calculation:**
```
Minimum Reports/Week = 14 × 7 = 98 reports/week
```

**Note:** This value (98) is constant for all municipalities and all weeks.

---

### Formula 3: % of Efficiency per Week

**Purpose:** Measure how effectively patrols resulted in action taken (resolved incidents).

**Method:** Compare attended reports against the minimum requirement.

**Formula:**
```
Efficiency % = (No. of Report Attended / Minimum Number of Reports per Week) × 100
```

**Rounding:** Result is rounded **down** to the nearest whole number (floor function).

**Example Calculation:**
```
Municipality: Balanga City
Week 1:
- Reports Attended: 85
- Minimum Required: 98

Efficiency % = (85 / 98) × 100
            = 86.734...%
            ≈ 86% (rounded down)
```

**Multiple Week Examples:**
```
Week 1: (85 / 98) × 100 = 86.73% → 86%
Week 2: (90 / 98) × 100 = 91.83% → 91%
Week 3: (88 / 98) × 100 = 89.79% → 89%
Week 4: (92 / 98) × 100 = 93.87% → 93%
```

---

### Formula 4: Overall Average

**Purpose:** Calculate the total efficiency across all 4 weeks of the month.

**Method:** Sum all attended reports from all weeks and divide by total minimum requirement.

**Formula:**
```
Overall % = (Total Reports Attended in All Weeks / Total Minimum Reports for All Weeks) × 100
```

**Constants:**
- Total Minimum = 98 reports/week × 4 weeks = **392 reports**

**Rounding:** Result is rounded **down** to the nearest whole number (floor function).

**Cap:** Maximum value is **100%** (even if calculation exceeds 100%).

**Example Calculation:**
```
Municipality: Balanga City
Week 1 Attended: 85
Week 2 Attended: 90
Week 3 Attended: 88
Week 4 Attended: 92

Total Attended = 85 + 90 + 88 + 92 = 355 reports
Total Minimum = 98 × 4 = 392 reports

Overall % = (355 / 392) × 100
         = 90.561...%
         ≈ 90% (rounded down)
```

**Example with Cap:**
```
Municipality: Limay (High Performance)
Week 1 Attended: 105
Week 2 Attended: 110
Week 3 Attended: 108
Week 4 Attended: 112

Total Attended = 105 + 110 + 108 + 112 = 435 reports
Total Minimum = 392 reports

Overall % = (435 / 392) × 100
         = 110.969...%
         → Capped at 100%
```

---

## Complete Example: Municipality Calculation

### Sample Data: Orani Municipality

**Daily Patrol Counts (May 2026):**
```
Week 1: 13, 14, 15, 12, 14, 13, 14 = 95 total
Week 2: 14, 15, 14, 16, 13, 15, 14 = 101 total
Week 3: 12, 14, 15, 13, 14, 16, 14 = 98 total
Week 4: 14, 13, 15, 14, 12, 14, 13 = 95 total
```

**Command Center Action Taken:**
```
Week 1: 78 reports attended
Week 2: 85 reports attended
Week 3: 82 reports attended
Week 4: 80 reports attended
```

**Step-by-Step Calculations:**

#### Step 1: Actual Reports (Already calculated above)
- Week 1: 95
- Week 2: 101
- Week 3: 98
- Week 4: 95

#### Step 2: Minimum Reports/Week
```
98 reports/week (constant)
```

#### Step 3: Weekly Efficiency
```
Week 1: (78 / 98) × 100 = 79.59% → 79%
Week 2: (85 / 98) × 100 = 86.73% → 86%
Week 3: (82 / 98) × 100 = 83.67% → 83%
Week 4: (80 / 98) × 100 = 81.63% → 81%
```

#### Step 4: Overall Average
```
Total Attended = 78 + 85 + 82 + 80 = 325 reports
Total Minimum = 98 × 4 = 392 reports

Overall % = (325 / 392) × 100
         = 82.908...%
         ≈ 82%
```

**Final PDF Row for Orani:**
```
┌──┬──────┬────┬────┬────┬────┬────┬────┬─────────────┬─────────────┬─────────────┬────────┐
│2 │Orani │ 29 │ 14 │ 7  │ 4  │ 2  │ 98 │95 101 98 95│78 85 82 80 │79% 86% 83% 81%│  82%  │
└──┴──────┴────┴────┴────┴────┴────┴────┴─────────────┴─────────────┴─────────────┴────────┘
```

---

## Key Points to Remember

### 1. Data Sources
- **Daily Counts:** From I-Patroller Daily Counts tab
- **Reports Attended:** From Command Center Action Taken data
- **Minimum Requirements:** Fixed constants (14/day, 98/week)

### 2. Rounding Rules
- **Efficiency %:** Always round **DOWN** (floor function)
- **Overall %:** Always round **DOWN** (floor function)
- **No rounding:** For actual counts (they are whole numbers)

### 3. Special Cases
- **Overall % Cap:** Maximum is 100%, even if calculation exceeds it
- **Missing Data:** If no data for a week, values show as 0
- **Partial Weeks:** Week 4 may have fewer than 7 days (end of month)

### 4. Performance Interpretation
```
≥90%  → Outstanding (Green)
75-89% → Very Satisfactory (Light Green)
60-74% → Satisfactory (Yellow)
50-59% → Good (Orange)
<50%  → Needs Improvement (Red)
```

---

## Verification Checklist

When reviewing the PDF, verify:

✅ **Actual Reports** = Sum of 7 daily counts
✅ **Minimum/Week** = Always 98
✅ **Efficiency %** = (Attended / 98) × 100, rounded down
✅ **Overall %** = (Total Attended / 392) × 100, rounded down, max 100%
✅ **Color Coding** = Matches performance level ranges
✅ **District Grouping** = All municipalities under correct district

---

## Common Questions

**Q: Why is the minimum always 98?**
A: 14 reports/day × 7 days = 98 reports/week (constant requirement)

**Q: Why round down instead of normal rounding?**
A: To maintain strict performance standards (must fully achieve percentage)

**Q: Can Overall % exceed 100%?**
A: No, it's capped at 100% maximum for display purposes

**Q: What if Week 4 has only 3 days?**
A: Actual reports sum only those days, but minimum remains 98 for consistency

**Q: Where does "Reports Attended" come from?**
A: Command Center module, counting entries with action taken/resolved incidents

---

## Technical Implementation

### JavaScript Code Reference
```javascript
// Weekly Actual
const weekSum = weekData.reduce((sum, v) => sum + (v || 0), 0);

// Weekly Efficiency
const efficiency = Math.floor((attended / 98) * 100);

// Overall Average
const totalAttended = weeklyAttended.reduce((sum, a) => sum + a, 0);
const overallPercentage = Math.min(Math.floor((totalAttended / 392) * 100), 100);
```

---

## Related Documentation

- `CRITERIA_PDF_GENERATION.md` - Technical implementation
- `CRITERIA_PDF_VISUAL_GUIDE.md` - User guide with visuals
- `CRITERIA_COMPUTATION_FORMULAS.md` - Original computation reference
