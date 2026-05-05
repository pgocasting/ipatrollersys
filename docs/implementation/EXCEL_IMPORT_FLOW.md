# Excel Import Flow Diagram

## 🔄 Import Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SELECTS EXCEL FILE                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              SYSTEM READS FILE WITH XLSX.read()              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           COUNT SHEETS: workbook.SheetNames.length           │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│  SINGLE SHEET    │      │  MULTIPLE SHEETS │
│  (count = 1)     │      │  (count > 1)     │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         │                         ▼
         │              ┌─────────────────────────────┐
         │              │  SHOW CONFIRMATION DIALOG   │
         │              │  with sheet breakdown:      │
         │              │  • Sheet 1 → Department     │
         │              │  • Sheet 2 → Department     │
         │              │  • Sheet 3 → Department     │
         │              └────────┬────────────────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────────────────┐
         │              │   User clicks OK/Cancel?    │
         │              └────────┬────────────────────┘
         │                       │
         │              ┌────────┴────────┐
         │              │                 │
         │              ▼                 ▼
         │         ┌─────────┐      ┌─────────┐
         │         │   OK    │      │ CANCEL  │
         │         └────┬────┘      └────┬────┘
         │              │                 │
         │              │                 ▼
         │              │           ┌──────────┐
         │              │           │  ABORT   │
         │              │           └──────────┘
         │              │
         └──────────────┴─────────────────┐
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │   FOR EACH SHEET IN WORKBOOK:       │
                        └─────────────────┬───────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  detectDepartmentFromSheetName()    │
                        │  • Check for PG-ENRO keywords       │
                        │  • Check for Agriculture keywords   │
                        │  • Check for PNP keywords           │
                        │  • Default to PNP if no match       │
                        └─────────────────┬───────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  FIND HEADER ROW (first 5 rows)     │
                        │  • Skip empty rows                  │
                        │  • Extract column names             │
                        └─────────────────┬───────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  FOR EACH DATA ROW:                 │
                        └─────────────────┬───────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  findColumnValue() - Flexible Match │
                        │  • Try exact match                  │
                        │  • Try case-insensitive match       │
                        │  • Try partial match                │
                        │  • Try variations (Municipality,    │
                        │    MUNICIPALITY, City, Bayan, etc.) │
                        └─────────────────┬───────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  CREATE ACTION OBJECT:              │
                        │  {                                  │
                        │    department: detected,            │
                        │    municipality: value,             │
                        │    district: value,                 │
                        │    what: value,                     │
                        │    when: value,                     │
                        │    where: value,                    │
                        │    actionTaken: value,              │
                        │    sheetName: sheetName             │
                        │  }                                  │
                        └─────────────────┬───────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  VALIDATE DATA:                     │
                        │  • Has what OR where OR who?        │
                        │  • Skip if all empty                │
                        └─────────────────┬───────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  ADD TO importedActions[]           │
                        └─────────────────┬───────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  NEXT SHEET (if any)                │
                        └─────────────────┬───────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  CHECK FOR DUPLICATES:              │
                        │  Compare with existing actionItems  │
                        │  • Same what, where, municipality,  │
                        │    and department = duplicate       │
                        └─────────────────┬───────────────────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        │                                   │
                        ▼                                   ▼
            ┌──────────────────────┐        ┌──────────────────────┐
            │  ALL DUPLICATES      │        │  HAS NEW RECORDS     │
            └──────────┬───────────┘        └──────────┬───────────┘
                       │                               │
                       ▼                               ▼
            ┌──────────────────────┐        ┌──────────────────────┐
            │  SHOW ERROR:         │        │  SHOW CONFIRMATION:  │
            │  "All data already   │        │  "Found X duplicates │
            │   exists"            │        │   Continue with Y    │
            │                      │        │   new records?"      │
            └──────────┬───────────┘        └──────────┬───────────┘
                       │                               │
                       ▼                               ▼
                  ┌─────────┐              ┌──────────────────────┐
                  │  ABORT  │              │  User clicks OK?     │
                  └─────────┘              └──────────┬───────────┘
                                                      │
                                          ┌───────────┴───────────┐
                                          │                       │
                                          ▼                       ▼
                                    ┌─────────┐            ┌─────────┐
                                    │   OK    │            │ CANCEL  │
                                    └────┬────┘            └────┬────┘
                                         │                      │
                                         │                      ▼
                                         │                 ┌─────────┐
                                         │                 │  ABORT  │
                                         │                 └─────────┘
                                         │
                                         ▼
                        ┌─────────────────────────────────────┐
                        │  SAVE TO FIRESTORE:                 │
                        │  • Create batch write               │
                        │  • Add createdAt, updatedAt         │
                        │  • Commit batch                     │
                        └─────────────────┬───────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  RELOAD DATA:                       │
                        │  fetchAllActionData()               │
                        └─────────────────┬───────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  SHOW SUCCESS MESSAGE:              │
                        │  "Successfully imported X reports!" │
                        │  (PNP: A, AGRICULTURE: B,           │
                        │   PG-ENRO: C)                       │
                        │  "Y duplicates were skipped"        │
                        └─────────────────┬───────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │  RESET FILE INPUT                   │
                        └─────────────────────────────────────┘
```

## 🔍 Department Detection Logic

```
detectDepartmentFromSheetName(sheetName)
    │
    ▼
┌─────────────────────────────────────────┐
│  Convert to lowercase                   │
│  sheetName.toLowerCase().trim()         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Check PG-ENRO keywords (Priority 1)    │
│  • pg-enro, pgenro, environment         │
│  • quarrying, mining, pollution         │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
    ┌────────┐         ┌────────┐
    │ MATCH  │         │NO MATCH│
    └───┬────┘         └───┬────┘
        │                  │
        ▼                  ▼
  ┌──────────┐   ┌─────────────────────────────────┐
  │ PG-ENRO  │   │  Check Agriculture keywords     │
  └──────────┘   │  (Priority 2)                   │
                 │  • agriculture, agri, farming   │
                 │  • fishing, cutting, trees      │
                 └─────────────┬───────────────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
                     ▼                   ▼
                 ┌────────┐         ┌────────┐
                 │ MATCH  │         │NO MATCH│
                 └───┬────┘         └───┬────┘
                     │                  │
                     ▼                  ▼
               ┌──────────┐   ┌─────────────────────────┐
               │AGRICULTURE│   │  Check PNP keywords     │
               └──────────┘   │  (Priority 3)           │
                              │  • gambling, pusher     │
                              │  • drugs, police        │
                              └─────────┬───────────────┘
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                              ▼                   ▼
                          ┌────────┐         ┌────────┐
                          │ MATCH  │         │NO MATCH│
                          └───┬────┘         └───┬────┘
                              │                  │
                              ▼                  ▼
                          ┌──────┐         ┌──────────┐
                          │ PNP  │         │ DEFAULT  │
                          └──────┘         │   PNP    │
                                           └──────────┘
```

## 📋 Column Mapping Logic

```
findColumnValue(possibleNames)
    │
    ▼
┌─────────────────────────────────────────┐
│  FOR EACH possibleName:                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Search in headers array                │
│  headers.findIndex(...)                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Try case-insensitive match:            │
│  header.toLowerCase().includes(         │
│    possibleName.toLowerCase()           │
│  )                                      │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
    ┌────────┐         ┌────────┐
    │ FOUND  │         │NOT FOUND│
    └───┬────┘         └───┬────┘
        │                  │
        ▼                  ▼
┌──────────────┐    ┌──────────────┐
│ Return value │    │ Try reverse: │
│ from values  │    │ possibleName │
│ array        │    │ .includes(   │
└──────────────┘    │   header)    │
                    └──────┬───────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ▼                   ▼
             ┌────────┐         ┌────────┐
             │ FOUND  │         │NOT FOUND│
             └───┬────┘         └───┬────┘
                 │                  │
                 ▼                  ▼
         ┌──────────────┐    ┌──────────────┐
         │ Return value │    │ Try next     │
         └──────────────┘    │ possibleName │
                             └──────┬───────┘
                                    │
                                    ▼
                             ┌──────────────┐
                             │ Return ''    │
                             │ if all fail  │
                             └──────────────┘
```

## 📊 Example: Multi-Sheet Processing

```
Excel File: "Bataan_Reports.xlsx"

Sheet 1: "Alleged Illegal Gambling"
    │
    ▼
detectDepartmentFromSheetName("Alleged Illegal Gambling")
    │
    ▼
Check keywords: "gambling" found → PNP
    │
    ▼
Process 15 rows → 15 records with department='pnp'

Sheet 2: "Illegal Cutting"
    │
    ▼
detectDepartmentFromSheetName("Illegal Cutting")
    │
    ▼
Check keywords: "cutting" found → AGRICULTURE
    │
    ▼
Process 10 rows → 10 records with department='agriculture'

Sheet 3: "Quarrying Activities"
    │
    ▼
detectDepartmentFromSheetName("Quarrying Activities")
    │
    ▼
Check keywords: "quarrying" found → PG-ENRO
    │
    ▼
Process 5 rows → 5 records with department='pg-enro'

TOTAL: 30 records
  • PNP: 15
  • AGRICULTURE: 10
  • PG-ENRO: 5
```

---

**This flow ensures:**
- ✅ Automatic department detection
- ✅ Flexible column mapping
- ✅ Duplicate prevention
- ✅ Clear user feedback
- ✅ Error handling at every step
