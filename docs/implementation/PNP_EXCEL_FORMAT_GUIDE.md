# PNP Excel Format Import Guide

## 📋 Your Excel Format

Based on your "PNP REPORT OF APRIL" file, the system now supports:

### Column Headers Detected:
- ✅ **REPORT TITLE** → Maps to "What"
- ✅ **DATE** or **DATE REPORTED** → Maps to "When"
- ✅ **LOCATION** → Maps to "Where"
- ✅ **ACTION TAKEN** → Maps to "Action Taken"
- ✅ **REMARKS** → Maps to "Other Information"
- ✅ **PHOTO** → Maps to "Photos"

### Sheet Names Detected:
- ✅ **Alleged Illegal Gambling** → PNP Department
- ✅ **Illegal Patulo** → PNP Department
- ✅ **Alleged Illegal Pusher** → PNP Department
- ✅ **Alleged Illegal Beer House** → PNP Department

## 🔧 Special Features for Your Format

### 1. **Municipality Extraction from Location**
Your location format: `"Brgy Sibacan Balanga, Bataan"`

The system now:
- ✅ Extracts "Balanga" as Municipality
- ✅ Auto-detects District based on Municipality
- ✅ Keeps full location in "Where" field

**Examples:**
- `"Brgy Sibacan Balanga, Bataan"` → Municipality: **Balanga City**, District: **2ND DISTRICT**
- `"San Emp-lan Brgy. Ala-uli Mariveles, Bataan"` → Municipality: **Mariveles**, District: **3RD DISTRICT**
- `"Daan bago Prk 6 Dinalupihan, Bataan"` → Municipality: **Dinalupihan**, District: **3RD DISTRICT**

### 2. **District Auto-Detection**
Based on municipality, automatically assigns district:

| Municipality | Auto-Detected District |
|--------------|----------------------|
| Abucay, Orani, Samal, Hermosa | 1ST DISTRICT |
| Balanga City, Pilar, Orion, Limay | 2ND DISTRICT |
| Bagac, Dinalupihan, Mariveles, Morong | 3RD DISTRICT |

### 3. **Merged Cells Handling**
Your Excel has:
- District headers (DISTRICT 2, DISTRICT 3)
- Municipality sub-headers (Balanga, Mariveles, Dinalupihan)

The system:
- ✅ Skips these header rows automatically
- ✅ Finds the actual data rows
- ✅ Processes only rows with data

## 📊 Import Process for Your File

### What Happens:

1. **System detects 4 sheets:**
   ```
   📊 Sheet 1: "Alleged Illegal Gambling" → PNP
   📊 Sheet 2: "Illegal Patulo" → PNP
   📊 Sheet 3: "Alleged Illegal Pusher" → PNP
   📊 Sheet 4: "Alleged Illegal Beer House" → PNP
   ```

2. **For each sheet:**
   - Finds header row: `REPORT TITLE | DATE | LOCATION | ACTION TAKEN | REMARKS | PHOTO`
   - Skips district/municipality headers
   - Processes data rows

3. **For each data row:**
   - Extracts: `"Alleged Illegal Beer House"` → **What**
   - Extracts: `"April 23 2026"` → **When**
   - Extracts: `"Hermosa Bataan"` → **Where**
   - Extracts municipality: `"Hermosa"` → **Municipality**
   - Auto-detects: `"1ST DISTRICT"` → **District**
   - Extracts: `"Cleared"` → **Action Taken**
   - Extracts remarks → **Other Information**
   - Extracts photo links → **Photos**

4. **Saves to Firestore:**
   ```javascript
   {
     department: "pnp",
     municipality: "Hermosa",
     district: "1ST DISTRICT",
     what: "Alleged Illegal Beer House",
     when: "2026-04-23",
     where: "Hermosa Bataan",
     actionTaken: "Cleared",
     otherInformation: "Wala pong nagsusugal...",
     photos: ["https://drive.google.com/..."],
     sheetName: "Alleged Illegal Beer House"
   }
   ```

## ✅ What's Now Supported

### Column Name Variations:
- ✅ `REPORT TITLE` = `What`
- ✅ `DATE REPORTED` = `When`
- ✅ `LOCATION` = `Where`
- ✅ `ACTION TAKEN` = `Action Taken`
- ✅ `REMARKS` = `Other Information`
- ✅ `PHOTO` = `Photos`

### Location Formats:
- ✅ `"Brgy X Municipality, Bataan"`
- ✅ `"Brgy X, Municipality, Bataan"`
- ✅ `"Municipality, Bataan"`
- ✅ `"Brgy X Municipality Bataan"` (no commas)

### Date Formats:
- ✅ `"April 23 2026"`
- ✅ `"April-23-2026"`
- ✅ `"2026-04-23"`
- ✅ Excel date numbers

## 🚀 How to Import Your File

### Step 1: Prepare File (Optional)
Your file is already in good format! But if you want to improve:

1. **Remove empty rows** between data
2. **Unmerge cells** if possible (but system handles merged cells now)
3. **Keep sheet names** as they are (perfect for auto-detection)

### Step 2: Import
1. Go to **Action Center**
2. Click **Import** button
3. Select your Excel file
4. System will show:
   ```
   Detected 4 sheets in the Excel file:
   
     • Alleged Illegal Gambling → PNP
     • Illegal Patulo → PNP
     • Alleged Illegal Pusher → PNP
     • Alleged Illegal Beer House → PNP
   
   Each sheet will be imported to its corresponding department.
   
   Continue with import?
   ```
5. Click **OK**

### Step 3: Verify
1. Check **PNP tab** in Action Center
2. Filter by:
   - **District** (1ST, 2ND, 3RD)
   - **Municipality** (Balanga, Hermosa, Mariveles, etc.)
   - **What** (Alleged Illegal Gambling, Pusher, Beer House, etc.)
3. Verify data is correct

## 🔍 Debugging

If import fails, check browser console (F12):

### Expected Logs:
```
📊 Excel file contains 4 sheet(s): [Alleged Illegal Gambling, Illegal Patulo, ...]
🔍 Processing sheet "Alleged Illegal Gambling" as PNP department
📋 Headers found in sheet "Alleged Illegal Gambling": [REPORT TITLE, DATE, LOCATION, ...]
📊 Total data rows to process: 15
🔍 First data row sample: {headers: [...], values: [...]}
✅ Row 2 added: {what: "Alleged Illegal Gambling", where: "Hermosa Bataan", municipality: "Hermosa"}
✅ Row 3 added: ...
✅ Processed 15 records from sheet "Alleged Illegal Gambling"
```

### Common Issues:

#### Issue 1: "No valid data found"
**Cause:** Headers not detected or all rows empty  
**Solution:** Check console logs to see what headers were found

#### Issue 2: Municipality not detected
**Cause:** Location format doesn't match pattern  
**Solution:** Add municipality name in location (e.g., "Brgy X, Balanga, Bataan")

#### Issue 3: Wrong district
**Cause:** Municipality name not recognized  
**Solution:** Use standard municipality names (Balanga City, not just Balanga)

## 📝 Example Data Mapping

### Your Excel Row:
| REPORT TITLE | DATE | LOCATION | ACTION TAKEN | REMARKS | PHOTO |
|--------------|------|----------|--------------|---------|-------|
| Alleged Illegal Beer House | April 23 2026 | Hermosa Bataan | Cleared | Wala pong nagsusugal... | [photo link] |

### Imported to System:
```javascript
{
  department: "pnp",
  municipality: "Hermosa",
  district: "1ST DISTRICT",
  what: "Alleged Illegal Beer House",
  when: "2026-04-23",
  where: "Hermosa Bataan",
  actionTaken: "Cleared",
  otherInformation: "Wala pong nagsusugal sa area na hinihinalang may illegal na beer house...",
  photos: ["https://drive.google.com/..."],
  sheetName: "Alleged Illegal Beer House"
}
```

### Displayed in Table:
| Municipality | District | What | When | Where | Action Taken |
|--------------|----------|------|------|-------|--------------|
| Hermosa | 1ST DISTRICT | Alleged Illegal Beer House | April 23, 2026 | Hermosa Bataan | Cleared |

## 💡 Tips

1. **Keep your current format** - it's now fully supported!
2. **Use descriptive sheet names** - helps with auto-detection
3. **Include municipality in location** - for better extraction
4. **Check console logs** - if something doesn't import correctly
5. **Test with one sheet first** - before importing all months

## 🎯 Summary

Your Excel format is now **fully supported**! The system will:
- ✅ Detect all 4 sheets (Gambling, Patulo, Pusher, Beer House)
- ✅ Map your columns correctly (REPORT TITLE → What, etc.)
- ✅ Extract municipality from location
- ✅ Auto-detect district
- ✅ Import all data to PNP department
- ✅ Handle merged cells and complex structure

Just click **Import** and it should work! 🚀

---

**Updated:** May 5, 2026  
**Version:** 2.2 - PNP Excel Format Support
