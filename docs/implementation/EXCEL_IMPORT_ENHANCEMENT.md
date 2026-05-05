# Excel Import Enhancement - Auto-Detection & Multi-Sheet Support

## Mga Pagbabago (Changes Made)

### 1. **Auto-Detection ng Sheet Count**
- Automatic na nag-detect kung ilang sheets ang meron sa Excel file
- Nagpapakita ng bilang ng sheets at mga pangalan nito

### 2. **Department Auto-Detection Based on Sheet Name**
Ang system ay automatic na nag-identify ng department base sa sheet name:

#### PNP Department Keywords:
- gambling, pusher, beer house, patulo, drugs, illegal drugs
- pnp, police, arrest, suspect, crime, violation

#### Agriculture Department Keywords:
- agriculture, agri, farming, crops, livestock, fishery
- illegal fishing, cutting, trees, forest, timber

#### PG-ENRO Department Keywords:
- pg-enro, pgenro, environment, enro, environmental
- quarrying, mining, pollution, waste

**Example:**
- Sheet name: "Alleged Illegal Gambling" → Auto-detected as **PNP**
- Sheet name: "Illegal Cutting" → Auto-detected as **Agriculture**
- Sheet name: "Quarrying Activities" → Auto-detected as **PG-ENRO**

### 3. **Multi-Sheet Processing**
- Kapag may **maraming sheets**, lahat ay ipo-process individually
- Bawat sheet ay mapupunta sa tamang department based sa sheet name
- Nagpapakita ng confirmation dialog na may breakdown per sheet:
  ```
  Detected 4 sheets in the Excel file:
  
    • Alleged Illegal Gambling → PNP
    • Alleged Illegal Pusher → PNP
    • Illegal Cutting → AGRICULTURE
    • Quarrying → PG-ENRO
  
  Each sheet will be imported to its corresponding department.
  
  Continue with import?
  ```

### 4. **Single Sheet Processing**
- Kapag **isang sheet lang**, direct import na
- Auto-detect pa rin ng department based sa sheet name
- Lahat ng data sa sheet ay mapupunta sa detected department

### 5. **Flexible Column Mapping**
Ang system ay nag-hahanap ng columns kahit iba-iba ang format:

#### Flexible Column Names:
- **Municipality**: Municipality, MUNICIPALITY, City, CITY, Bayan
- **District**: District, DISTRICT, Distrito
- **What**: What, WHAT, Action, Activity, Description, Incident, Ano
- **When**: When, WHEN, Date, DATE, Time, Kailan
- **Where**: Where, WHERE, Location, Place, Venue, Saan
- **Action Taken**: Action Taken, ACTION_TAKEN, Status, Result, Aksyon
- **Who**: Who, WHO, Suspect, Person, Name, Sino
- **Why**: Why, WHY, Reason, Cause, Bakit
- **How**: How, HOW, Method, Manner, Paano

### 6. **Smart Header Detection**
- Nag-search ng header row sa first 5 rows
- Nag-skip ng empty rows
- Nag-handle ng different Excel formats

### 7. **Import Summary**
After successful import, makikita ang detailed summary:
```
Successfully imported 45 action reports! (PNP: 30, AGRICULTURE: 10, PG-ENRO: 5)
3 duplicates were skipped.
```

## Paano Gamitin (How to Use)

### Para sa Multi-Sheet Excel File:

1. **Prepare Excel file** with multiple sheets
   - Sheet 1: "Alleged Illegal Gambling" (PNP data)
   - Sheet 2: "Alleged Illegal Pusher" (PNP data)
   - Sheet 3: "Illegal Cutting" (Agriculture data)
   - Sheet 4: "Quarrying" (PG-ENRO data)

2. **Click Import button** sa Action Center

3. **Select Excel file**

4. **Review confirmation dialog** showing:
   - Number of sheets detected
   - Each sheet name and detected department
   - Total records to import

5. **Click OK** to proceed

6. **System automatically**:
   - Processes each sheet
   - Maps data to correct department
   - Filters duplicates
   - Saves to Firestore
   - Shows success message with breakdown

### Para sa Single-Sheet Excel File:

1. **Prepare Excel file** with one sheet
   - Sheet name can be anything (e.g., "PNP Reports", "Data", "Sheet1")

2. **Click Import button**

3. **Select Excel file**

4. **System automatically**:
   - Detects department from sheet name
   - Processes all data in the sheet
   - Maps to detected department
   - Saves to Firestore

## Mga Benepisyo (Benefits)

### ✅ Automatic Department Detection
- Hindi na kailangan manually piliin ang department
- Sheet name ang mag-determine ng department

### ✅ Multi-Sheet Support
- Isang Excel file, maraming departments
- Organized data per sheet

### ✅ Flexible Format Support
- Kahit iba-iba ang column names, gagana pa rin
- Case-insensitive column matching
- Multiple variations ng column names

### ✅ Smart Data Processing
- Auto-skip ng empty rows
- Auto-detect ng header row
- Duplicate detection

### ✅ Clear Feedback
- Detailed confirmation dialogs
- Import summary with breakdown
- Error messages kung may problema

## Example Excel Structure

### Multi-Sheet File:

**Sheet 1: "Alleged Illegal Gambling"**
| Municipality | District | What | When | Where | Action Taken |
|--------------|----------|------|------|-------|--------------|
| Balanga City | 2ND DISTRICT | Gambling | 2026-05-01 | Brgy. Poblacion | Arrested |

**Sheet 2: "Illegal Cutting"**
| Municipality | District | What | When | Where | Action Taken |
|--------------|----------|------|------|-------|--------------|
| Hermosa | 1ST DISTRICT | Cutting Mahogany | 2026-05-02 | Brgy. Mabuco | Under Investigation |

### Single-Sheet File:

**Sheet 1: "PNP Reports"**
| Municipality | District | What | When | Where | Action Taken |
|--------------|----------|------|------|-------|--------------|
| Balanga City | 2ND DISTRICT | Gambling | 2026-05-01 | Brgy. Poblacion | Arrested |
| Pilar | 2ND DISTRICT | Pusher | 2026-05-02 | Brgy. Wawa | Arrested |

## Technical Details

### Functions Added:

1. **`detectDepartmentFromSheetName(sheetName)`**
   - Input: Sheet name string
   - Output: Department code ('pnp', 'agriculture', 'pg-enro')
   - Logic: Keyword matching with priority (PG-ENRO > Agriculture > PNP)

2. **Enhanced `handleFileUpload()`**
   - Auto-detects sheet count
   - Shows confirmation dialog for multi-sheet files
   - Processes each sheet with department detection
   - Flexible column mapping with `findColumnValue()`
   - Tracks sheet name in imported data

3. **`findColumnValue(possibleNames)`**
   - Searches for column value using multiple possible names
   - Case-insensitive matching
   - Partial matching support

### Data Structure:

Each imported record now includes:
```javascript
{
  department: 'pnp',           // Auto-detected from sheet name
  municipality: 'Balanga City',
  district: '2ND DISTRICT',
  what: 'Gambling',
  when: '2026-05-01',
  where: 'Brgy. Poblacion',
  actionTaken: 'Arrested',
  sheetName: 'Alleged Illegal Gambling', // NEW: Track source sheet
  createdAt: '2026-05-05T...',
  updatedAt: '2026-05-05T...'
}
```

## Testing Checklist

- [x] Single sheet Excel file
- [x] Multi-sheet Excel file (2-5 sheets)
- [x] Different sheet names (PNP, Agriculture, PG-ENRO)
- [x] Different column name formats (uppercase, lowercase, variations)
- [x] Empty rows in Excel
- [x] Header row not in first row
- [x] Duplicate detection
- [x] Error handling for invalid files

## Notes

- Default department is **PNP** if sheet name doesn't match any keywords
- System skips empty sheets automatically
- Duplicate detection works across all sheets
- File input resets after successful/failed import
- Console logs available for debugging (check browser console)

---

**Date Implemented:** May 5, 2026  
**Implemented By:** Kiro AI Assistant  
**File Modified:** `src/pages/ActionCenter.jsx`
