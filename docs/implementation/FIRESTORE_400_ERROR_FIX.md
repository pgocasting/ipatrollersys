# Firestore 400 Error - Quick Fix Guide

## ❌ Error Message:
```
firestore.googleapis.com/.../Listen/channel?...
Failed to load resource: the server responded with a status of 400 ()
```

## 🔍 Root Cause:
Too many **real-time listeners** (`onSnapshot`) running at the same time, causing:
- Firestore connection limits exceeded
- Network congestion
- Quota issues

## 🚨 Found Issues:

### Multiple onSnapshot Listeners:
1. **AuthContext.jsx** - User management listener
2. **DataContext.jsx** - 4 different listeners (patrol data, action reports, incidents)
3. **Users.jsx** - User presence listener
4. **App.jsx** - User presence listener (duplicate!)
5. **IPatroller.jsx** - Municipalities listener

**Total: 7+ real-time listeners running simultaneously!**

## ✅ Quick Fixes:

### Fix 1: Clear Browser Cache & Reload

1. **Press Ctrl+Shift+Delete**
2. Select "Cached images and files"
3. Click "Clear data"
4. **Hard refresh**: Ctrl+Shift+R

### Fix 2: Close Other Tabs

If you have multiple tabs of the app open:
1. Close all tabs
2. Open only ONE tab
3. Try again

### Fix 3: Wait for Quota Reset

If you've been testing a lot:
1. Wait 5-10 minutes
2. Firestore quota resets
3. Try again

### Fix 4: Use Incognito Mode

1. Open **Incognito/Private window** (Ctrl+Shift+N)
2. Login again
3. Try import

### Fix 5: Check Firestore Console

1. Go to: https://console.firebase.google.com/
2. Select project: **ipatrollersys**
3. Go to **Firestore Database**
4. Check if database is accessible
5. Check **Usage** tab for quota limits

## 🔧 Long-term Solution:

### Reduce Real-time Listeners

The app currently has too many `onSnapshot` listeners. Should convert some to `getDocs`:

#### Current (Too Many):
```javascript
// AuthContext.jsx
onSnapshot(doc(db, 'users', 'management'), ...)

// DataContext.jsx
onSnapshot(collection(db, 'actionReports'), ...)
onSnapshot(collection(db, 'incidents'), ...)
onSnapshot(municipalitiesRef, ...)

// Users.jsx
onSnapshot(collection(db, 'userPresence'), ...)

// App.jsx
onSnapshot(collection(db, 'userPresence'), ...) // DUPLICATE!
```

#### Recommended:
```javascript
// Only use onSnapshot for critical real-time data:
- User presence (1 listener)
- Current user auth (1 listener)

// Use getDocs for everything else:
- Action reports (fetch on demand)
- Incidents (fetch on demand)
- Patrol data (fetch on demand)
```

## 🎯 Immediate Action:

### For Excel Import to Work:

1. **Close all other tabs** of the app
2. **Refresh** the page (Ctrl+R)
3. **Wait 30 seconds** for connections to stabilize
4. **Try import** again

### If Still Failing:

1. **Open console** (F12)
2. **Check for other errors** besides the 400
3. **Look for:**
   - "Quota exceeded"
   - "Permission denied"
   - "Network error"
4. **Share** those errors

## 📊 Firestore Quota Limits:

### Free Tier (Spark Plan):
- **Reads:** 50,000 per day
- **Writes:** 20,000 per day
- **Deletes:** 20,000 per day
- **Real-time listeners:** Limited connections

### If Exceeded:
- Wait for daily reset (midnight PST)
- Or upgrade to Blaze plan

## 🔍 Check Current Usage:

1. Go to Firebase Console
2. Click **Firestore Database**
3. Click **Usage** tab
4. Check:
   - Document reads today
   - Document writes today
   - Active connections

## 💡 Prevention:

### Best Practices:
1. ✅ Use `getDocs` instead of `onSnapshot` when possible
2. ✅ Unsubscribe from listeners when component unmounts
3. ✅ Avoid duplicate listeners
4. ✅ Use pagination for large datasets
5. ✅ Cache data in memory when possible

### Code Example:
```javascript
// ❌ BAD - Creates new listener every render
useEffect(() => {
  onSnapshot(collection(db, 'data'), (snapshot) => {
    // ...
  });
}, []); // Missing unsubscribe!

// ✅ GOOD - Properly unsubscribes
useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, 'data'), (snapshot) => {
    // ...
  });
  
  return () => unsubscribe(); // Cleanup!
}, []);

// ✅ BETTER - Use getDocs for non-real-time data
useEffect(() => {
  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, 'data'));
    // ...
  };
  fetchData();
}, []);
```

## 🚀 Quick Test:

After applying fixes, test with:

1. **Open console** (F12)
2. **Check for 400 errors** - should be gone
3. **Try Excel import** - should work
4. **Check Firestore** - data should be saved

## 📞 Still Having Issues?

If 400 error persists:

1. **Share console logs** (all errors, not just 400)
2. **Share Firestore usage** (from Firebase Console)
3. **Share network tab** (F12 → Network → filter "firestore")

This will help identify the exact cause!

---

**Note:** The Excel import itself is working fine. The 400 error is a separate Firestore connection issue that needs to be resolved first.

**Updated:** May 5, 2026
