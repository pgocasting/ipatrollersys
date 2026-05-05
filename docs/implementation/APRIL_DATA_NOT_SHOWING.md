# April Data Not Showing - Troubleshooting

## ❌ Problem:
Excel file has April data, but when filtering by April 2026, walang lumalabas sa table.

## 🔍 Possible Causes:

### 1. **Data Not Imported Yet**
- Import failed due to Firestore 400 error
- Import was cancelled
- Import succeeded but data went to wrong collection

### 2. **Date Format Issue**
- Date in Excel: "April 23 2026"
- System can't parse the date correctly
- Month filter can't match

### 3. **Wrong Month/Year Detected**
- Date parsed as different month
- Year parsed incorrectly
- Filter doesn't match

### 4. **Data Imported to Wrong Department**
- Sheet name detection put data in wrong department
- Filtering by PNP but data is in Agriculture

## ✅ Solutions:

### Step 1: Check if Data Was Imported

1. **Open browser console** (F12)
2. **Look for import success message:**
   ```
   Successfully imported X action reports! (PNP: X, ...)
   ```
3. **If you see this**, data was imported
4. **If not**, import failed - try again

### Step 2: Check Firestore Database

1. Go to: https://console.firebase.google.com/
2. Select: **ipatrollersys**
3. Click: **Firestore Database**
4. Look for collection: **actionReports**
5. Check if documents exist
6. Check document fields:
   - `department`: should be "pnp"
   - `when`: should have April date
   - `municipality`: should have value
   - `what`: should have value

### Step 3: Clear Filters

1. In Action Center, click **"Clear Filters"**
2. Check if data appears
3. If yes, then filter issue
4. If no, then data not imported

### Step 4: Check All Departments

1. Click **"All"** tab (not just PNP)
2. Check if data appears
3. If yes, data went to wrong department
4. If no, data not imported

### Step 5: Re-import with Console Open

1. **Close all tabs** of the app
2. **Open new tab**
3. **Hard refresh** (Ctrl+Shift+R)
4. **Open console** (F12)
5. **Click Import**
6. **Select Excel file**
7. **Watch console logs:**

Expected logs:
```
📊 Excel file contains 4 sheet(s): [Alleged Illegal Gambling, ...]
🔍 Processing sheet "Alleged Illegal Gambling" as PNP department
📋 Headers found in sheet "Alleged Illegal Gambling": [REPORT TITLE, DATE, LOCATION, ...]
📊 Total data rows to process: 15
🔍 First data row sample: {headers: [...], values: [...]}
✅ Row 2 added: {
  what: "Alleged Illegal Beer House",
  where: "Hermosa Bataan",
  municipality: "Hermosa",
  when: "2026-04-23T00:00:00.000Z",
  detectedMonth: "April",
  detectedYear: 2026
}
✅ Processed 15 records from sheet "Alleged Illegal Gambling"
📊 Import Summary:
  • PNP: 15 records
```

8. **Check for errors:**
   - Firestore 400 error?
   - "No valid data found"?
   - "All data already exists"?

### Step 6: Check Date Detection

In console logs, look for:
```
detectedMonth: "April"
detectedYear: 2026
```

If you see:
- ❌ `detectedMonth: "unknown"` → Date parsing failed
- ❌ `detectedYear: "unknown"` → Year parsing failed
- ❌ `detectedMonth: "May"` → Wrong month detected

### Step 7: Manual Date Check

If date detection is wrong:

1. **Check Excel date format**
   - Should be: "April 23 2026"
   - Or: "2026-04-23"
   - Or: Excel date number

2. **Try reformatting dates in Excel:**
   - Select DATE column
   - Format as: "YYYY-MM-DD" (e.g., "2026-04-23")
   - Save and re-import

## 🎯 Quick Test:

### Test 1: Check if ANY data exists

1. Go to Action Center
2. Click **"All"** tab
3. Select **"All Districts"**
4. Select **"All Incident Types"**
5. Clear search box
6. Check if **"Total Actions: 0"** or has number

If **0**, no data imported at all.

### Test 2: Check specific month

1. Select **Month: April**
2. Select **Year: 2026**
3. Select **Department: All Departments**
4. Check if data appears

If appears, then PNP filter issue.

### Test 3: Check Firestore directly

Run this in console (F12):
```javascript
import { collection, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';

const snapshot = await getDocs(collection(db, 'actionReports'));
console.log('Total documents:', snapshot.size);
snapshot.forEach(doc => {
  const data = doc.data();
  console.log('Document:', {
    id: doc.id,
    department: data.department,
    when: data.when,
    what: data.what
  });
});
```

## 🔧 Common Fixes:

### Fix 1: Date Format in Excel

Change Excel date format:
1. Select DATE column
2. Right-click → Format Cells
3. Select: **Date**
4. Choose format: **YYYY-MM-DD**
5. Save and re-import

### Fix 2: Clear Existing Data

If data was imported to wrong month:
1. Go to Firestore Console
2. Delete wrong documents
3. Re-import with correct format

### Fix 3: Force Date Format

In Excel, add a new column:
1. Column name: **DATE_FORMATTED**
2. Formula: `=TEXT(B2,"YYYY-MM-DD")` (assuming B2 is DATE column)
3. Copy formula down
4. Delete old DATE column
5. Rename DATE_FORMATTED to DATE
6. Save and re-import

## 📊 Expected Result:

After successful import, you should see:

### In Console:
```
Successfully imported 50 action reports! (PNP: 50)
```

### In Action Center:
- **Total Actions: 50** (or your number)
- **PNP (Monthly): 50**
- Data visible in table when filtering April 2026

### In Firestore:
- Collection: **actionReports**
- Documents with:
  - `department: "pnp"`
  - `when: "2026-04-23T00:00:00.000Z"` (or similar)
  - `municipality: "Hermosa"` (or others)
  - `what: "Alleged Illegal Beer House"` (or others)

## 💡 Prevention:

### Best Practices:
1. ✅ Use standard date format in Excel: **YYYY-MM-DD**
2. ✅ Check console logs during import
3. ✅ Verify data in Firestore after import
4. ✅ Test with small file first (2-3 rows)
5. ✅ Clear Firestore 400 errors before importing

## 🚀 Next Steps:

1. **Try re-import** with console open
2. **Share console logs** if still failing
3. **Check Firestore** to see if data exists
4. **Try clearing filters** to see all data

---

**Updated:** May 5, 2026  
**Version:** 2.3 - Date parsing improvements
