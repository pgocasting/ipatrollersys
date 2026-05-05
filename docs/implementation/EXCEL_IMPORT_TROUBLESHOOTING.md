# Excel Import Troubleshooting Guide

## ❌ Problem: "No valid data found in the Excel file"

### Mga Posibleng Dahilan at Solusyon:

### 1. **Headers Hindi Naka-detect**

**Problema:** Ang system ay hindi mahanap ang header row

**Solusyon:**
- ✅ Siguraduhing ang **first row** ay may column headers
- ✅ Kung may title sa taas, tanggalin muna o i-move ang headers sa row 1
- ✅ Headers dapat may laman (hindi blank)

**Example ng TAMA:**
```
Row 1: | Municipality | District | What | When | Where |
Row 2: | Balanga City | 2ND DISTRICT | Gambling | 2026-05-01 | Brgy. Poblacion |
```

**Example ng MALI:**
```
Row 1: | BATAAN PROVINCE REPORT |  |  |  |  |
Row 2: | Municipality | District | What | When | Where |
Row 3: | Balanga City | 2ND DISTRICT | Gambling | 2026-05-01 | Brgy. Poblacion |
```

### 2. **Column Names Hindi Kilala**

**Problema:** Ang column names sa Excel ay hindi kasama sa supported variations

**Solusyon:**
Gamitin ang mga supported column names (kahit isa sa mga ito):

| Field | Supported Names |
|-------|----------------|
| **Municipality** | Municipality, MUNICIPALITY, City, CITY, Bayan, Munisipyo |
| **District** | District, DISTRICT, Distrito |
| **What** | What, WHAT, Action, Activity, Description, Incident, Ano, Type, Category |
| **When** | When, WHEN, Date, DATE, Time, Kailan, Date/Time |
| **Where** | Where, WHERE, Location, Place, Venue, Saan, Address |
| **Action Taken** | Action Taken, ACTION_TAKEN, Status, Result, Aksyon, Action |

**O kaya:** Kung wala sa list, ang system ay mag-try ng **fallback** - gagamitin ang values by column order:
- Column 1 = Municipality
- Column 2 = District
- Column 3 = What
- Column 4 = When
- Column 5 = Where
- Column 6 = Action Taken

### 3. **Lahat ng Rows ay Empty**

**Problema:** May headers pero walang data sa rows

**Solusyon:**
- ✅ Check kung may laman ang cells sa data rows
- ✅ Tanggalin ang extra spaces
- ✅ I-save ulit ang Excel file

### 4. **Wrong Sheet Format**

**Problema:** Ang Excel file ay may special formatting na hindi ma-read

**Solusyon:**
1. Open ang Excel file
2. Select All (Ctrl+A)
3. Copy (Ctrl+C)
4. Create new Excel file
5. Paste as Values only
6. Save as .xlsx
7. Try import ulit

### 5. **Merged Cells**

**Problema:** May merged cells sa Excel

**Solusyon:**
- ✅ Unmerge lahat ng cells
- ✅ Bawat cell dapat may sariling value

## 🔍 How to Debug

### Step 1: Open Browser Console
1. Press **F12** sa browser
2. Click **Console** tab

### Step 2: Try Import
1. Select Excel file
2. Watch console for logs

### Step 3: Check Logs
Hanapin ang mga log messages:

```
📊 Excel file contains X sheet(s): [sheet names]
🔍 Processing sheet "Sheet Name" as PNP department
📋 Headers found in sheet "Sheet Name": [array of headers]
📊 Total data rows to process: X
🔍 First data row sample: {headers: [...], values: [...]}
```

### Step 4: Analyze
- ✅ Nakita ba ang headers?
- ✅ Tama ba ang detected department?
- ✅ May laman ba ang first data row?
- ✅ May nag-match ba sa column names?

## 📝 Example Excel Templates

### Template 1: Standard Format (RECOMMENDED)

| Municipality | District | What | When | Where | Action Taken |
|--------------|----------|------|------|-------|--------------|
| Balanga City | 2ND DISTRICT | Alleged Illegal Gambling | 2026-05-01 | Brgy. Poblacion | Arrested |
| Pilar | 2ND DISTRICT | Alleged Illegal Pusher | 2026-05-02 | Brgy. Wawa | Under Investigation |

### Template 2: Alternative Names (ALSO WORKS)

| Bayan | Distrito | Ano | Kailan | Saan | Aksyon |
|-------|----------|-----|--------|------|--------|
| Balanga City | 2ND DISTRICT | Alleged Illegal Gambling | 2026-05-01 | Brgy. Poblacion | Arrested |

### Template 3: English Variations (ALSO WORKS)

| City | District | Activity | Date | Location | Status |
|------|----------|----------|------|----------|--------|
| Balanga City | 2ND DISTRICT | Alleged Illegal Gambling | 2026-05-01 | Brgy. Poblacion | Arrested |

### Template 4: No Headers (FALLBACK MODE)

Kung walang headers o hindi kilala ang headers, gagamitin ang column order:

| Column 1 | Column 2 | Column 3 | Column 4 | Column 5 | Column 6 |
|----------|----------|----------|----------|----------|----------|
| Balanga City | 2ND DISTRICT | Gambling | 2026-05-01 | Brgy. Poblacion | Arrested |

**Note:** Fallback mode ay less reliable, better gumamit ng proper headers.

## ✅ Checklist Before Import

- [ ] Excel file is .xlsx or .xls format
- [ ] First row contains headers
- [ ] Headers use supported names (or at least similar)
- [ ] Data rows have values (not all empty)
- [ ] No merged cells
- [ ] No extra title rows above headers
- [ ] Sheet name contains department keywords (for auto-detection)
- [ ] File is not corrupted (can open in Excel/LibreOffice)

## 🚀 Quick Fix Steps

### If import fails:

1. **Open Excel file**
2. **Check first 5 rows:**
   - Row 1 should be headers
   - Row 2+ should be data
3. **Rename headers** to match supported names:
   - Use "Municipality" instead of "Mun" or "Town"
   - Use "What" instead of "Incident Type"
   - Use "Where" instead of "Loc"
4. **Remove empty rows** between header and data
5. **Save file**
6. **Try import again**

### Still not working?

1. **Create new Excel file**
2. **Copy ONLY the data** (no formatting)
3. **Use these exact headers:**
   ```
   Municipality | District | What | When | Where | Action Taken
   ```
4. **Paste data below headers**
5. **Save as .xlsx**
6. **Import**

## 📞 Common Error Messages

### "No valid data found in the Excel file"
- **Cause:** No rows passed validation
- **Fix:** Check headers and data rows, use console logs to debug

### "All data in the file already exists"
- **Cause:** All rows are duplicates
- **Fix:** Check if data was already imported before

### "Error reading Excel file"
- **Cause:** File is corrupted or wrong format
- **Fix:** Save as new .xlsx file

### "Sheet is empty, skipping..."
- **Cause:** Sheet has no data
- **Fix:** Add data or remove empty sheet

## 💡 Pro Tips

1. **Use descriptive sheet names** for auto-detection:
   - ✅ "Alleged Illegal Gambling" → Auto-detected as PNP
   - ❌ "Sheet1" → Default to PNP

2. **Keep it simple:**
   - One header row
   - Data starts immediately after headers
   - No merged cells
   - No empty columns in the middle

3. **Test with small file first:**
   - Try importing 2-3 rows first
   - Check if it works
   - Then import full file

4. **Check console logs:**
   - Press F12
   - Look for error messages
   - Share logs if asking for help

---

**Updated:** May 5, 2026  
**Version:** 2.1 - Enhanced validation and debugging
