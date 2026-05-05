# Criteria Tab - Computation Formulas (Summary)

**Date:** May 5, 2026

---

## 📊 CONSTANTS

- **DAILY_MIN** = 14 patrols/day
- **WEEKLY_MIN** = 98 patrols/week (14 × 7)

---

## 🧮 KEY FORMULAS

### 1. Weekly Efficiency (per week)
```
Weekly Efficiency = (Attended / 98) × 100
```

### 2. Overall Average (Criteria Tab)
```
Overall Average = (Total Attended / 392) × 100
Capped at 100% maximum
```
- Total Attended = Sum of 4 weeks
- Total Minimum = 98 × 4 = 392

### 3. Performance Score (Top Performers Tab)
```
Performance = (Week1% + Week2% + Week3% + Week4%) / 4
```

---

## 📋 QUICK EXAMPLE

**Given:** Week 1: 50, Week 2: 60, Week 3: 45, Week 4: 55

**Weekly Efficiencies:**
- Week 1: (50/98) × 100 = 51%
- Week 2: (60/98) × 100 = 61%
- Week 3: (45/98) × 100 = 45%
- Week 4: (55/98) × 100 = 56%

**Overall Average:** (210/392) × 100 = 53%

**Performance:** (51+61+45+56) / 4 = 53%

---

## 🎯 STATUS LEVELS

| Status | Range |
|--------|-------|
| Outstanding | ≥ 90% |
| Very Satisfactory | 75-89% |
| Satisfactory | 60-74% |
| Good | 50-59% |
| Needs Improvement | < 50% |

---

## ⚠️ KEY NOTES

1. All percentages use `Math.floor()` (round down)
2. Weekly efficiency capped at 100% per week
3. Overall average capped at 100% maximum
4. Always calculates for 4 weeks (even if some weeks = 0)
5. Data sources:
   - Actual Reports → Daily Counts tab
   - Attended Reports → Command Center (Action Taken)

---

**Status:** ✅ Active - Pure action efficiency (no weighting)
