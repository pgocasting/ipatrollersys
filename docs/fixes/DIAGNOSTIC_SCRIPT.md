# Diagnostic Script for Command Center Issues

## Run This in Browser Console (F12)

Copy and paste this entire script into the browser console to diagnose issues:

```javascript
// ========================================
// COMMAND CENTER DIAGNOSTIC SCRIPT
// ========================================

console.log('🔍 Starting Command Center Diagnostics...\n');

// 1. Check localStorage availability
console.log('1️⃣ Checking localStorage...');
try {
  const testKey = '__test__';
  localStorage.setItem(testKey, 'test');
  localStorage.removeItem(testKey);
  console.log('✅ localStorage is available and working');
} catch (e) {
  console.error('❌ localStorage is NOT available:', e.message);
  console.log('   Possible causes:');
  console.log('   - Private/Incognito mode');
  console.log('   - localStorage disabled in browser settings');
  console.log('   - localStorage quota exceeded');
}

// 2. Check Command Center data in localStorage
console.log('\n2️⃣ Checking Command Center data in localStorage...');
const ccKeys = Object.keys(localStorage).filter(key => key.startsWith('commandCenter_'));
if (ccKeys.length > 0) {
  console.log(`✅ Found ${ccKeys.length} Command Center entries:`);
  ccKeys.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      const parsed = JSON.parse(data);
      const size = (data.length / 1024).toFixed(2);
      const dates = Object.keys(parsed).length;
      console.log(`   📦 ${key}`);
      console.log(`      Size: ${size} KB | Dates: ${dates}`);
    } catch (e) {
      console.error(`   ❌ Error parsing ${key}:`, e.message);
    }
  });
} else {
  console.log('⚠️  No Command Center data found in localStorage');
  console.log('   This is normal if you haven\'t added any entries yet');
}

// 3. Check localStorage storage usage
console.log('\n3️⃣ Checking localStorage storage usage...');
if (navigator.storage && navigator.storage.estimate) {
  navigator.storage.estimate().then(estimate => {
    const used = (estimate.usage / 1024 / 1024).toFixed(2);
    const total = (estimate.quota / 1024 / 1024).toFixed(2);
    const percent = (estimate.usage / estimate.quota * 100).toFixed(2);
    console.log(`   Storage: ${used} MB / ${total} MB (${percent}%)`);
    if (percent > 80) {
      console.warn('⚠️  localStorage is more than 80% full!');
      console.log('   Consider clearing old data');
    } else {
      console.log('✅ Storage usage is healthy');
    }
  });
} else {
  console.log('⚠️  Storage API not available in this browser');
}

// 4. Check Firestore connection
console.log('\n4️⃣ Checking Firestore connection...');
if (typeof db !== 'undefined' && db) {
  console.log('✅ Firestore database object exists');
  console.log('   Type:', typeof db);
} else {
  console.error('❌ Firestore database (db) is not defined');
  console.log('   This may indicate a Firebase initialization issue');
}

// 5. Check React state (if available)
console.log('\n5️⃣ Checking React state...');
const root = document.getElementById('root');
if (root && root._reactRootContainer) {
  console.log('✅ React root container found');
} else {
  console.log('⚠️  React root container not found (this is normal in production builds)');
}

// 6. Check for JavaScript errors in console
console.log('\n6️⃣ Checking browser environment...');
console.log(`   Browser: ${navigator.userAgent}`);
console.log(`   Online: ${navigator.onLine ? '✅ Yes' : '❌ No'}`);
console.log(`   Cookies enabled: ${navigator.cookieEnabled ? '✅ Yes' : '❌ No'}`);

// 7. Test data operations
console.log('\n7️⃣ Testing localStorage operations...');
try {
  const testKey = 'commandCenter_TEST_July_2026';
  const testData = {
    "July 1, 2026": [{
      id: "test-123",
      barangay: "Test Barangay",
      concernType: "Test",
      week1: "1",
      actionTaken: "Test Action"
    }]
  };
  
  // Test write
  localStorage.setItem(testKey, JSON.stringify(testData));
  console.log('   ✅ Test write successful');
  
  // Test read
  const retrieved = localStorage.getItem(testKey);
  const parsed = JSON.parse(retrieved);
  if (parsed && parsed["July 1, 2026"] && parsed["July 1, 2026"][0].id === "test-123") {
    console.log('   ✅ Test read successful');
  } else {
    console.error('   ❌ Test read failed - data mismatch');
  }
  
  // Cleanup
  localStorage.removeItem(testKey);
  console.log('   ✅ Test cleanup successful');
  
} catch (e) {
  console.error('   ❌ localStorage test failed:', e.message);
}

// 8. Check for common issues
console.log('\n8️⃣ Checking for common issues...');
const issues = [];

// Check if in private browsing
if (window.name === '__private') {
  issues.push('Private browsing mode detected');
}

// Check localStorage quota
try {
  const test = new Array(1024 * 1024).join('a'); // 1MB of data
  localStorage.setItem('__quota_test__', test);
  localStorage.removeItem('__quota_test__');
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    issues.push('localStorage quota exceeded');
  }
}

// Check for ad blockers (they can block localStorage)
if (!window.localStorage || localStorage === null) {
  issues.push('localStorage might be blocked by extension');
}

if (issues.length > 0) {
  console.warn('⚠️  Issues detected:');
  issues.forEach(issue => console.log(`   - ${issue}`));
} else {
  console.log('✅ No common issues detected');
}

// 9. Summary
console.log('\n' + '='.repeat(50));
console.log('📊 DIAGNOSTIC SUMMARY');
console.log('='.repeat(50));
console.log('If you see any ❌ errors above, those need to be fixed.');
console.log('Copy this entire output and report to admin if issues persist.');
console.log('='.repeat(50) + '\n');

// 10. Recommended actions
console.log('💡 RECOMMENDED ACTIONS:');
console.log('1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)');
console.log('2. Clear cache: F12 → Application → Clear storage');
console.log('3. Try Incognito/Private window');
console.log('4. Disable browser extensions temporarily');
console.log('5. Check internet connection');
console.log('\n✅ Diagnostics complete!\n');
```

## How to Use:

1. **Open the live site:** https://bataan-ipatroller.web.app
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Copy the entire script above**
5. **Paste into console** and press Enter
6. **Review the output** for any ❌ errors
7. **Screenshot the output** if you need help

## Common Issues and Solutions:

### ❌ "localStorage is NOT available"
**Solution:**
- You're in Private/Incognito mode
- Use normal browser mode
- Or check browser settings to enable localStorage

### ❌ "localStorage quota exceeded"
**Solution:**
```javascript
// Clear old Command Center data:
Object.keys(localStorage)
  .filter(key => key.startsWith('commandCenter_'))
  .forEach(key => {
    const data = localStorage.getItem(key);
    console.log(`Removing ${key} (${(data.length / 1024).toFixed(2)} KB)`);
    localStorage.removeItem(key);
  });
location.reload();
```

### ❌ "Firestore database not defined"
**Solution:**
- Check internet connection
- Refresh the page
- Check browser console for Firebase errors

### ⚠️ "No Command Center data found"
**Solution:**
- This is normal if you haven't added entries yet
- Add a test entry and wait 2 seconds
- Run diagnostic again to verify it saved

## Advanced Diagnostics:

### Check specific municipality data:
```javascript
const municipality = 'Abucay'; // Change this
const month = 'July';
const year = '2026';
const key = `commandCenter_${municipality}_${month}_${year}`;

console.log(`Checking: ${key}`);
const data = localStorage.getItem(key);

if (data) {
  const parsed = JSON.parse(data);
  console.log('✅ Data found!');
  console.log('Total dates:', Object.keys(parsed).length);
  console.log('Sample dates:', Object.keys(parsed).slice(0, 5));
  console.log('First entry:', parsed[Object.keys(parsed)[0]]);
} else {
  console.log('❌ No data found for this municipality/month');
}
```

### View all localStorage data:
```javascript
console.table(
  Object.keys(localStorage).map(key => ({
    key,
    size: `${(localStorage.getItem(key).length / 1024).toFixed(2)} KB`,
    preview: localStorage.getItem(key).substring(0, 50) + '...'
  }))
);
```

### Clear all Command Center data (DANGER):
```javascript
const confirmed = confirm('⚠️ This will DELETE ALL Command Center data from localStorage!\n\nAre you sure?');
if (confirmed) {
  const keys = Object.keys(localStorage).filter(key => key.startsWith('commandCenter_'));
  keys.forEach(key => localStorage.removeItem(key));
  console.log(`✅ Deleted ${keys.length} entries`);
  location.reload();
}
```

## Report Template:

When reporting issues, include:

```
**Browser:** [Chrome/Firefox/Safari] [Version]
**Device:** [Desktop/Mobile] [OS]
**Date/Time:** [When issue occurred]
**Action:** [What you were doing]
**Error Messages:** [Copy from diagnostic script]
**Console Output:** [Screenshot or copy text]
**Steps to Reproduce:** 
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

---

**Need more help?** Run the diagnostic script and share the output! 🔍
