# Real-Time Sync Troubleshooting Guide
**Date**: July 29, 2026  
**Issue**: PC 1 has 1303 entries, PC 2 still shows 1298 entries

## CRITICAL: Must Do This First!

### On PC 2 (the one showing 1298):

**STEP 1: Close ALL tabs completely**
```
1. Close EVERY tab of the iPatroller system
2. Close the entire browser (not just tabs)
3. Wait 5 seconds
```

**STEP 2: Reopen and check for new code**
```
1. Open browser fresh
2. Go to: https://bataan-ipatroller.web.app
3. Press Ctrl + Shift + R (hard refresh with cache clear)
4. Login
```

**STEP 3: Open console IMMEDIATELY**
```
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for this message:
   🔴 REAL-TIME LISTENER: Setting up for {...}
   
If you DON'T see this, the new code hasn't loaded!
```

**STEP 4: If no real-time logs, clear everything**
```
1. F12 → Application tab
2. Click "Clear storage"
3. Click "Clear site data" button
4. Close browser completely
5. Reopen and login
6. Check console again for 🔴 REAL-TIME LISTENER message
```

## How to Verify Real-Time is Working

### Test 1: Check Console on PC 2

After opening PC 2, console should show:
```
🔴 REAL-TIME LISTENER: Setting up for {
  municipality: "Balanga City",
  monthYear: "July_2026",
  path: "commandCenter/weeklyReports/Balanga City/July_2026",
  timestamp: "2026-07-29T..."
}
```

**If you DON'T see this:** New code hasn't loaded yet!

### Test 2: Save on PC 1, Watch PC 2 Console

**On PC 1:**
1. Add/modify entry
2. Click "Save Data"
3. Wait for success message

**On PC 2 (watch console):**
Within 1-5 seconds you should see:
```
🔴 REAL-TIME LISTENER FIRED: {
  exists: true,
  municipality: "Balanga City",
  monthYear: "July_2026",
  timestamp: "2026-07-29T..."
}
🔴 REAL-TIME UPDATE RECEIVED: {
  municipality: "Balanga City",
  monthYear: "July_2026",
  dataKeys: [...],
  hasWeeklyReportData: true,
  isSplit: false,
  timestamp: "2026-07-29T..."
}
🔴 REAL-TIME: Updating with 31 dates, 1303 total entries
🔴 REAL-TIME: Current state has 31 dates
💾 Real-time: Saved to localStorage with key: commandCenter_...
🔴 REAL-TIME: Forcing state update...
🔴 REAL-TIME: Setting new data with 1303 entries
🔴 REAL-TIME: Incremented dataVersion to X
✅ REAL-TIME: State update complete!
```

**And see toast notification:**
```
🔴 Real-time update: 1303 entries loaded
```

## Common Issues

### Issue 1: No Console Logs at All

**Problem**: New code hasn't loaded on PC 2  
**Solution**:
1. Ctrl + Shift + Delete
2. Clear "Cached images and files"
3. Time range: "All time"
4. Click "Clear data"
5. Close browser completely
6. Reopen, hard refresh (Ctrl+Shift+R)
7. Login and check console

### Issue 2: Console Shows "Setting up" but No Updates

**Problem**: Real-time listener is active but not receiving updates  
**Check**:
```
1. Are both PCs on same municipality? (e.g., "Balanga City")
2. Are both PCs on same month? (e.g., "July")
3. Are both PCs on same year? (e.g., "2026")
```

**If YES to all above:**
- Check Firestore rules (permissions issue)
- Check internet connection
- Check browser console for errors

### Issue 3: Console Shows "Data is SPLIT"

**Problem**: Document is too large, split into multiple week documents  
**Log looks like**:
```
🔴 REAL-TIME: Data is SPLIT, need to load individual week documents
⚠️ REAL-TIME: Split documents not yet supported in real-time listener!
```

**Solution**: 
```
Manual refresh required for split documents:
1. Press F5 or Ctrl+R on PC 2
2. Data will load via normal load function (which supports splits)
```

**Future enhancement needed**: Real-time listener should support split documents.

### Issue 4: Updates After Long Delay (30+ seconds)

**Problem**: Browser tab is inactive/background  
**Explanation**: Browsers throttle background tabs  
**Solution**: Keep tab active/visible when testing

### Issue 5: Old localStorage Blocking Updates

**Console shows**:
```
🔴 REAL-TIME: Current state has 31 dates
🔴 REAL-TIME: Setting new data with 1303 entries
✅ REAL-TIME: State update complete!
```

But UI still shows 1298.

**Solution**:
```javascript
// In PC 2 console:
localStorage.clear()
location.reload()
```

## Debug Commands (Run in Console)

### Check if Real-Time Listener is Active
```javascript
// You should see listener setup logs
console.log('Checking for real-time logs...')
// Look up in console history for 🔴 messages
```

### Check Current State
```javascript
// Check weeklyReportData state (won't work - it's not global)
// Instead, look for this in console history:
// 🔴 REAL-TIME: Current state has X dates
```

### Check localStorage
```javascript
// See what's in localStorage
const storageKey = 'commandCenter_Balanga City_July_2026'
const stored = localStorage.getItem(storageKey)
if (stored) {
  const data = JSON.parse(stored)
  const count = Object.values(data).reduce((sum, entries) => 
    sum + (Array.isArray(entries) ? entries.length : 0), 0
  )
  console.log('localStorage has', count, 'entries')
} else {
  console.log('No data in localStorage')
}
```

### Force Clear Everything
```javascript
// Nuclear option - clear everything
localStorage.clear()
sessionStorage.clear()
console.log('All storage cleared. Refresh page now.')
location.reload()
```

## Step-by-Step Testing Procedure

### On Both PCs: Initial Setup

**PC 1 & PC 2:**
1. Close all tabs
2. Close browser completely
3. Reopen browser
4. Go to https://bataan-ipatroller.web.app
5. Press Ctrl + Shift + R (hard refresh)
6. Login
7. Open console (F12)
8. Select same municipality (e.g., "Balanga City")
9. Select same month (e.g., "July")
10. Select same year (e.g., "2026")

**Check console on BOTH:**
```
✅ Should see: 🔴 REAL-TIME LISTENER: Setting up for...
❌ If not visible: New code hasn't loaded, clear cache and retry
```

### Test Real-Time Sync

**PC 1:**
1. Scroll to a date (e.g., July 30)
2. Add new entry
3. Fill fields: Barangay, Concern Type, etc.
4. Click "Save Data" button
5. Wait for success toast
6. Check console for save confirmation

**PC 2 (DON'T TOUCH, JUST WATCH):**
1. Keep console visible
2. Within 1-5 seconds, should see:
   - 🔴 REAL-TIME LISTENER FIRED
   - 🔴 REAL-TIME UPDATE RECEIVED
   - 🔴 REAL-TIME: Updating with X dates, 1303 total entries
   - ✅ REAL-TIME: State update complete!
3. Toast notification appears: "🔴 Real-time update: 1303 entries loaded"
4. Table updates with new entry
5. Entry count updates to 1303

**If PC 2 shows NOTHING:**
- Check console for errors
- Verify PC 2 has new code loaded
- Verify both PCs on same municipality/month/year
- Try clearing cache and reloading

## Expected Timeline

```
T+0s:   PC 1 clicks "Save Data"
T+0.5s: PC 1 shows success toast
T+0.5s: Firestore document updated
T+1s:   Firestore triggers onSnapshot on all connected clients
T+1s:   PC 2 onSnapshot callback fires
T+1.1s: PC 2 processes update, updates state
T+1.2s: PC 2 shows toast notification
T+1.2s: PC 2 table re-renders with new data

Total: ~1-2 seconds from save to visible update ✅
```

## If Still Not Working

### Option 1: Check Firestore Directly

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Path: `commandCenter/weeklyReports/Balanga City/July_2026`
4. Check if document has 1303 entries
5. If YES: Firestore has data, issue is with listener
6. If NO: Data wasn't saved properly, issue is with save

### Option 2: Check Firestore Rules

Rules must allow reads:
```javascript
match /commandCenter/weeklyReports/{municipality}/{document} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

### Option 3: Try Different Browser

- If using Chrome, try Edge
- If using Edge, try Firefox
- Different browser = clean slate

### Option 4: Check Internet Connection

```javascript
// In console:
navigator.onLine
// Should return: true
```

If false, internet connection issue.

## Success Criteria Checklist

**On PC 2 Console:**
- [ ] See "🔴 REAL-TIME LISTENER: Setting up"
- [ ] No errors in console
- [ ] After PC 1 saves: See "🔴 REAL-TIME LISTENER FIRED"
- [ ] See "🔴 REAL-TIME UPDATE RECEIVED"
- [ ] See "🔴 REAL-TIME: Updating with 1303 total entries"
- [ ] See "✅ REAL-TIME: State update complete!"
- [ ] Toast notification appears
- [ ] Table updates with new data
- [ ] Entry count shows 1303 (matches PC 1)

**All checked? ✅ Real-time sync is working!**

## Emergency Fallback

If real-time still doesn't work after all troubleshooting:

**Manual Sync (Works 100%):**
```
1. PC 1: Save data
2. PC 2: Press F5 (refresh)
3. PC 2: Data loads from Firestore
4. Entry count updates to match PC 1 ✅
```

This always works because it loads directly from Firestore.

---

## Tagalog Troubleshooting

### Problema: Hindi pa rin nag-uupdate si PC 2

**KAILANGAN GAWIN**:

1. **Sa PC 2: Close lahat ng tabs**
   - I-close ang LAHAT ng tab ng iPatroller
   - I-close ang buong browser
   - Maghintay ng 5 segundo

2. **Buksan ulit**
   - Buksan ang browser
   - https://bataan-ipatroller.web.app
   - Press Ctrl + Shift + R (hard refresh)
   - Login

3. **Check console AGAD**
   - Press F12
   - Console tab
   - Hanapin: "🔴 REAL-TIME LISTENER: Setting up"
   - **Kung WALA**: Bagong code hindi pa naka-load!

4. **Kung wala pa rin**
   - F12 → Application tab
   - "Clear storage"
   - "Clear site data"
   - Close browser
   - Buksan ulit

**Test kung gumagana**:
1. PC 1: Mag-add, click "Save Data"
2. PC 2: Tignan ang console
3. Dapat makita within 1-5 seconds:
   - 🔴 REAL-TIME LISTENER FIRED
   - 🔴 REAL-TIME UPDATE RECEIVED
   - 🔴 REAL-TIME: Updating with 1303 total entries
   - ✅ REAL-TIME: State update complete!
4. Toast: "🔴 Real-time update: 1303 entries loaded"
5. Table nag-update ✅

**Kung wala pa rin**: Clear cache, close browser, try again!
