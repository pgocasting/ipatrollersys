# Gabay sa Pag-import ng Excel File

## Bagong Features! 🎉

### ✨ Automatic Department Detection
Ang system ay automatic na nag-identify kung saan mapupunta ang data base sa **sheet name**.

### ✨ Multi-Sheet Support
Pwede na mag-import ng Excel file na may **maraming sheets** at automatic na mapupunta sa tamang department ang bawat sheet.

---

## Paano Gumana ang Auto-Detection?

### 📋 Sheet Name → Department Mapping

Ang system ay tumitingin sa **sheet name** at hinahanap ang mga keyword:

#### 🚔 PNP Department
Kung ang sheet name ay may mga salitang:
- `gambling`, `pusher`, `beer house`, `patulo`, `drugs`
- `pnp`, `police`, `arrest`, `suspect`, `crime`

**Halimbawa:**
- ✅ "Alleged Illegal Gambling" → **PNP**
- ✅ "Alleged Illegal Pusher" → **PNP**
- ✅ "Beer House Operations" → **PNP**
- ✅ "Drug Arrest" → **PNP**

#### 🌾 Agriculture Department
Kung ang sheet name ay may mga salitang:
- `agriculture`, `agri`, `farming`, `crops`, `livestock`
- `illegal fishing`, `cutting`, `trees`, `forest`, `timber`

**Halimbawa:**
- ✅ "Illegal Cutting" → **AGRICULTURE**
- ✅ "Illegal Fishing" → **AGRICULTURE**
- ✅ "Forest Violations" → **AGRICULTURE**
- ✅ "Tree Cutting" → **AGRICULTURE**

#### 🏔️ PG-ENRO Department
Kung ang sheet name ay may mga salitang:
- `pg-enro`, `pgenro`, `environment`, `enro`
- `quarrying`, `mining`, `pollution`, `waste`

**Halimbawa:**
- ✅ "Quarrying Activities" → **PG-ENRO**
- ✅ "Environmental Violations" → **PG-ENRO**
- ✅ "Mining Operations" → **PG-ENRO**
- ✅ "Pollution Reports" → **PG-ENRO**

---

## Scenario 1: Maraming Sheets (Multi-Sheet)

### 📁 Example Excel File: "Bataan_Reports_May2026.xlsx"

**Laman ng file:**
```
📊 Sheet 1: "Alleged Illegal Gambling"
   - 15 records ng gambling operations
   
📊 Sheet 2: "Alleged Illegal Pusher"
   - 20 records ng drug-related arrests
   
📊 Sheet 3: "Illegal Cutting"
   - 10 records ng illegal tree cutting
   
📊 Sheet 4: "Quarrying"
   - 5 records ng illegal quarrying
```

### 🔄 Ano ang Mangyayari?

1. **I-select ang Excel file**
   
2. **Lalabas ang confirmation dialog:**
   ```
   Detected 4 sheets in the Excel file:
   
     • Alleged Illegal Gambling → PNP
     • Alleged Illegal Pusher → PNP
     • Illegal Cutting → AGRICULTURE
     • Quarrying → PG-ENRO
   
   Each sheet will be imported to its corresponding department.
   
   Continue with import?
   ```

3. **Click OK**

4. **System mag-process:**
   - Sheet 1 data → PNP department
   - Sheet 2 data → PNP department
   - Sheet 3 data → Agriculture department
   - Sheet 4 data → PG-ENRO department

5. **Success message:**
   ```
   Successfully imported 50 action reports!
   (PNP: 35, AGRICULTURE: 10, PG-ENRO: 5)
   ```

### 📊 Result sa Table:

**PNP Tab:**
- Makikita ang 35 records from "Alleged Illegal Gambling" at "Alleged Illegal Pusher" sheets

**Agriculture Tab:**
- Makikita ang 10 records from "Illegal Cutting" sheet

**PG-ENRO Tab:**
- Makikita ang 5 records from "Quarrying" sheet

---

## Scenario 2: Isang Sheet Lang (Single-Sheet)

### 📁 Example Excel File: "PNP_Reports.xlsx"

**Laman ng file:**
```
📊 Sheet 1: "Alleged Illegal Gambling"
   - 25 records ng gambling operations
```

### 🔄 Ano ang Mangyayari?

1. **I-select ang Excel file**

2. **System automatic na mag-detect:**
   - Sheet name: "Alleged Illegal Gambling"
   - Detected department: **PNP**

3. **Walang confirmation dialog** (kasi isang sheet lang)

4. **System mag-process:**
   - Lahat ng 25 records → PNP department

5. **Success message:**
   ```
   Successfully imported 25 action reports! (PNP: 25)
   ```

### 📊 Result sa Table:

**PNP Tab:**
- Makikita ang lahat ng 25 records

---

## Flexible Column Names

Kahit **iba-iba ang format** ng Excel file, gagana pa rin!

### ✅ Supported Column Name Variations:

| Field | Pwedeng Column Names |
|-------|---------------------|
| **Municipality** | Municipality, MUNICIPALITY, City, CITY, Bayan |
| **District** | District, DISTRICT, Distrito |
| **What** | What, WHAT, Action, Activity, Description, Incident, Ano |
| **When** | When, WHEN, Date, DATE, Time, Kailan |
| **Where** | Where, WHERE, Location, Place, Venue, Saan |
| **Action Taken** | Action Taken, ACTION_TAKEN, Status, Result, Aksyon |
| **Who** | Who, WHO, Suspect, Person, Name, Sino |
| **Why** | Why, WHY, Reason, Cause, Bakit |
| **How** | How, HOW, Method, Manner, Paano |

### 📝 Example:

**Excel Format 1:**
```
| Municipality | District | What | When | Where |
```

**Excel Format 2:**
```
| MUNICIPALITY | DISTRICT | ACTION | DATE | LOCATION |
```

**Excel Format 3:**
```
| Bayan | Distrito | Ano | Kailan | Saan |
```

**Lahat ay gagana!** ✅

---

## Step-by-Step Guide

### 📥 Pag-import ng Excel File:

1. **Pumunta sa Action Center page**

2. **Click ang "Import" button** (may download icon)

3. **Select ang Excel file** (.xlsx or .xls)

4. **Kung maraming sheets:**
   - Basahin ang confirmation dialog
   - Check kung tama ang department mapping
   - Click "OK" to proceed

5. **Kung isang sheet lang:**
   - Automatic na mag-import
   - Walang confirmation dialog

6. **Wait for processing**
   - May loading indicator

7. **Check success message**
   - Makikita ang bilang ng imported records
   - Breakdown per department

8. **Verify sa table**
   - Click ang department tabs
   - Check kung nandoon ang imported data

---

## Tips & Best Practices

### ✅ DO's:

1. **Use descriptive sheet names**
   - ✅ "Alleged Illegal Gambling"
   - ✅ "Illegal Cutting Activities"
   - ✅ "Quarrying Operations"

2. **Organize by department**
   - Sheet 1: PNP data
   - Sheet 2: Agriculture data
   - Sheet 3: PG-ENRO data

3. **Use consistent column names**
   - Stick to one format per file

4. **Remove empty rows**
   - Pero okay lang kung may konti, system mag-skip

5. **Put headers in first row**
   - Pero okay din kung nasa row 2-5, system mag-detect

### ❌ DON'Ts:

1. **Huwag gumamit ng vague sheet names**
   - ❌ "Sheet1", "Data", "Reports" (walang keyword)
   - Default to PNP kung walang match

2. **Huwag mag-mix ng departments sa isang sheet**
   - Gumawa ng separate sheet per department

3. **Huwag mag-import ng duplicate data**
   - System mag-detect at mag-skip

---

## Troubleshooting

### ❓ "All data already exists"
**Problema:** Lahat ng data ay duplicate  
**Solusyon:** Check kung na-import na before, or modify ang data

### ❓ "No valid data found"
**Problema:** Walang valid data sa Excel file  
**Solusyon:** 
- Check kung may laman ang sheets
- Check kung may headers
- Check kung may data rows

### ❓ "Error reading Excel file"
**Problema:** Invalid Excel file format  
**Solusyon:**
- Make sure .xlsx or .xls ang file
- Try to open sa Excel/LibreOffice
- Save as new file

### ❓ Wrong department mapping
**Problema:** Napunta sa wrong department ang data  
**Solusyon:**
- Rename ang sheet with proper keywords
- Example: "Gambling Reports" instead of "Sheet1"

---

## Example Excel Templates

### Template 1: Multi-Department Report

**File:** `Bataan_Monthly_Report.xlsx`

**Sheet 1: "Alleged Illegal Gambling"**
```
| Municipality | District | What | When | Where | Action Taken |
|--------------|----------|------|------|-------|--------------|
| Balanga City | 2ND DISTRICT | Gambling | 2026-05-01 | Brgy. Poblacion | Arrested |
| Pilar | 2ND DISTRICT | Gambling | 2026-05-02 | Brgy. Wawa | Under Investigation |
```

**Sheet 2: "Illegal Cutting"**
```
| Municipality | District | What | When | Where | Action Taken |
|--------------|----------|------|------|-------|--------------|
| Hermosa | 1ST DISTRICT | Cutting Mahogany | 2026-05-03 | Brgy. Mabuco | Arrested |
| Orani | 1ST DISTRICT | Cutting Narra | 2026-05-04 | Brgy. Sibul | Pending |
```

### Template 2: Single Department Report

**File:** `PNP_May_2026.xlsx`

**Sheet 1: "PNP Operations"**
```
| Municipality | District | What | When | Where | Action Taken | Who |
|--------------|----------|------|------|-------|--------------|-----|
| Balanga City | 2ND DISTRICT | Gambling | 2026-05-01 | Brgy. Poblacion | Arrested | Juan Dela Cruz |
| Pilar | 2ND DISTRICT | Pusher | 2026-05-02 | Brgy. Wawa | Arrested | Pedro Santos |
| Orion | 2ND DISTRICT | Beer House | 2026-05-03 | Brgy. Lati | Pending | Maria Garcia |
```

---

## Summary

### 🎯 Key Features:

1. ✅ **Auto-detect** ng sheet count
2. ✅ **Auto-detect** ng department from sheet name
3. ✅ **Multi-sheet** support
4. ✅ **Single-sheet** support
5. ✅ **Flexible** column name matching
6. ✅ **Smart** header detection
7. ✅ **Duplicate** detection
8. ✅ **Detailed** import summary

### 🚀 Benefits:

- **Mas mabilis** - No need to manually select department
- **Mas organized** - One file, multiple departments
- **Mas flexible** - Works with different Excel formats
- **Mas accurate** - Auto-detection reduces errors
- **Mas clear** - Detailed feedback and summaries

---

**Tanong o Problema?**  
Check ang browser console (F12) para sa detailed logs.

**Date:** May 5, 2026  
**Version:** 2.0 - Enhanced Excel Import
