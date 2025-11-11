# Firestore Quota Management Implementation

## Overview
This document describes the Firestore quota management system implemented in the iPatroller System to handle daily Firestore write limits gracefully.

## Features

### 1. Custom Hook: `useFirestoreQuota`
**Location:** `src/hooks/useFirestoreQuota.js`

The hook provides:
- **Quota tracking**: Monitors if the app is currently blocked due to quota exhaustion
- **Automatic reset**: Blocks until 4:00 PM PHT (Philippine Time) daily
- **Live countdown**: Real-time display of time remaining until reset
- **Error handling**: Catches `resource-exhausted` errors from Firestore
- **Persistent state**: Uses localStorage to maintain block state across page reloads

#### Key Functions:
```javascript
const {
  isBlocked,              // Boolean: true if quota is exceeded
  blockedUntil,           // Date: when quota will reset
  timeLeft,               // String: formatted time remaining (e.g., "2h 15m 30s")
  executeWithQuotaCheck,  // Function: wraps Firestore operations
  handleQuotaExceeded,    // Function: handles quota exceeded errors
  resetQuotaBlock,        // Function: manually reset (admin only)
  getNextResetTimePHT     // Function: calculates next reset time
} = useFirestoreQuota();
```

### 2. Integration in CommandCenter
**Location:** `src/CommandCenter.jsx`

#### Wrapper Function: `saveWithQuotaCheck`
All Firestore write operations are wrapped with this function:

```javascript
const saveWithQuotaCheck = async (saveOperation, operationName) => {
  if (isBlocked) {
    // Show error message with reset time
    return { success: false, error: message, quotaExceeded: true };
  }
  
  try {
    const result = await executeWithQuotaCheck(saveOperation);
    if (result.quotaExceeded) {
      // Handle quota exceeded error
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

#### Protected Operations
All the following operations are now protected:
- ✅ Import Barangays
- ✅ Delete Barangays
- ✅ Edit Barangay
- ✅ Clear All Barangays
- ✅ Import Concern Types
- ✅ Delete Concern Types
- ✅ Edit Concern Type
- ✅ Clear All Concern Types
- ✅ Save Weekly Reports
- ✅ Clear Weekly Report Data
- ✅ Save All Imported Months

### 3. User Interface Components

#### Quota Warning Banner
A prominent banner appears at the top of the Command Center when quota is exceeded:

**Features:**
- 🚨 Red/orange gradient background with warning icon
- ⏰ Shows exact reset time in Philippine format
- ⏱️ Live countdown timer
- 🔧 Admin-only reset button for testing/emergency override

**Location:** Top of Command Center page, above all other content

#### Toast Notifications
When a save operation is blocked:
```
⚠️ Firestore quota exceeded! Pwede ka ulit mag-save sa [reset time]. Time remaining: [countdown]
```

## How It Works

### 1. Initial Check
On component mount, the hook checks localStorage for any existing block:
```javascript
const savedUntil = localStorage.getItem("firestoreBlockedUntil");
if (savedUntil && new Date() < new Date(savedUntil)) {
  setIsBlocked(true);
  setBlockedUntil(new Date(savedUntil));
}
```

### 2. Save Operation Flow
```
User clicks Save
    ↓
saveWithQuotaCheck() called
    ↓
Check if isBlocked === true
    ↓
YES: Show error, return immediately
    ↓
NO: Execute Firestore operation
    ↓
Catch resource-exhausted error
    ↓
Set blockedUntil = 4:00 PM today/tomorrow
    ↓
Save to localStorage
    ↓
Show error message with countdown
```

### 3. Countdown Timer
Updates every second while blocked:
```javascript
useEffect(() => {
  if (!isBlocked || !blockedUntil) return;
  
  const interval = setInterval(() => {
    const diff = new Date(blockedUntil) - new Date();
    if (diff <= 0) {
      // Reset complete
      clearInterval(interval);
      localStorage.removeItem("firestoreBlockedUntil");
      setIsBlocked(false);
    } else {
      setTimeLeft(formatTime(diff)); // "2h 15m 30s"
    }
  }, 1000);
  
  return () => clearInterval(interval);
}, [isBlocked, blockedUntil]);
```

### 4. Reset Time Calculation
The quota resets at 4:00 PM PHT daily:
```javascript
const getNextResetTimePHT = () => {
  const now = new Date();
  const reset = new Date();
  reset.setHours(16, 0, 0, 0); // 4:00 PM
  if (now > reset) {
    reset.setDate(reset.getDate() + 1); // Next day
  }
  return reset;
};
```

## Usage Example

### Before (without quota management):
```javascript
const saveResult = await saveBarangays(updatedBarangays);
if (saveResult.success) {
  toast.success("Saved!");
}
```

### After (with quota management):
```javascript
const saveResult = await saveWithQuotaCheck(
  () => saveBarangays(updatedBarangays),
  "Import Barangays"
);
if (saveResult.success) {
  toast.success("Saved!");
} else if (saveResult.quotaExceeded) {
  // Already handled by saveWithQuotaCheck
  // User sees banner and toast notification
}
```

## Error Messages

### Filipino/English Mix (User-Friendly)
```
⚠️ Firestore quota exceeded! Pwede ka ulit mag-save sa Dec 10, 2024, 4:00 PM.
```

### Technical (Console)
```
❌ Error in Import Barangays: resource-exhausted
```

## Admin Features

### Manual Reset Button
Admins can manually reset the quota block for testing or emergency situations:
```javascript
<button onClick={resetQuotaBlock}>
  Reset Quota Block (Admin Only)
</button>
```

This clears:
- localStorage entry
- isBlocked state
- blockedUntil state
- timeLeft display

## Testing

### Simulate Quota Exceeded
To test the quota system without actually exhausting the quota:

1. Open browser console
2. Run:
```javascript
localStorage.setItem("firestoreBlockedUntil", new Date(Date.now() + 3600000).toISOString());
// Blocks for 1 hour
```
3. Refresh the page
4. The quota warning banner should appear

### Clear Test Block
```javascript
localStorage.removeItem("firestoreBlockedUntil");
```
Or click the "Reset Quota Block" button (admin only)

## Configuration

### Change Reset Time
Edit `getNextResetTimePHT()` in `src/hooks/useFirestoreQuota.js`:
```javascript
reset.setHours(16, 0, 0, 0); // Change 16 to desired hour (24-hour format)
```

### Change Timezone
The current implementation uses local browser time. To use a specific timezone:
```javascript
const reset = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
```

## Benefits

1. **Prevents Data Loss**: Users are warned before attempting saves
2. **Clear Communication**: Users know exactly when they can save again
3. **Automatic Recovery**: System automatically unblocks at reset time
4. **Persistent**: Block state survives page reloads
5. **User-Friendly**: Live countdown and clear messages in Filipino/English
6. **Admin Control**: Emergency override for admins
7. **Comprehensive**: All save operations are protected

## Future Enhancements

Potential improvements:
- [ ] Email notifications when quota is approaching
- [ ] Analytics dashboard showing quota usage trends
- [ ] Automatic data batching to reduce write operations
- [ ] Warning at 80% quota usage
- [ ] Queue system to retry failed operations after reset

## Support

For issues or questions about the quota management system:
1. Check browser console for detailed error messages
2. Verify localStorage state: `localStorage.getItem("firestoreBlockedUntil")`
3. Check Firestore console for actual quota usage
4. Contact system administrator for quota limit increases
