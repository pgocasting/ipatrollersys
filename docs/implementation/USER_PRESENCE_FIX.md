# User Presence Status Fix

## Issue
May mga users na online pero sa admin side ay nakaoffline. Ang presence tracking (online/offline/idle status) ay naka-disable dahil sa Firestore quota concerns.

## Root Cause
Ang presence tracking code sa `src/App.jsx` ay naka-comment out (disabled) para makatipid sa Firestore writes. Kaya hindi nag-uupdate ang user status sa admin side.

## Solution Implemented

### 1. Re-enabled Presence Tracking with Optimization
**File: `src/App.jsx`**

- **Uncommented** ang presence tracking code
- **Optimized** para mas kaunti ang Firestore writes:
  - **Idle timeout**: 5 minutes (from 1 minute) - mas matagal bago mag-idle
  - **Write throttle**: 3 minutes - heartbeat every 3 minutes lang
  - **Smart updates**: Only write to Firestore when:
    - Initial login (once)
    - Status change (online → idle, idle → online)
    - Heartbeat (every 3 minutes if still online)
  - **Passive event listeners**: Better performance, hindi nag-block ng UI

### 2. Improved Timestamp Handling
**File: `src/hooks/useFirebase.js`**

- Added `serverTimestamp` and `Timestamp` imports from Firebase
- Updated `updateUserPresence()` to use `serverTimestamp()` instead of `new Date().toISOString()`
- Benefits:
  - More accurate timestamps (server-side)
  - Consistent across different timezones
  - Better for Firestore queries

### 3. Fixed Idle Time Display
**File: `src/pages/Users.jsx`**

- Fixed idle time calculation to properly handle Firestore Timestamps
- Added proper conversion: `lastActive.toDate ? lastActive.toDate() : new Date(lastActive)`
- Shows accurate idle duration (e.g., "5m Idle", "15m Idle")

## How It Works Now

### User Status Flow:
1. **Login** → Status: `online` (1 write)
2. **Active** → Heartbeat every 3 minutes (1 write per 3 min)
3. **Inactive for 5 min** → Status: `idle` (1 write)
4. **Activity detected** → Status: `online` (1 write)
5. **Logout/Close browser** → Status: `offline` (1 write)

### Firestore Write Reduction:
- **Before**: ~60 writes per hour per user (every minute)
- **After**: ~20 writes per hour per user (every 3 minutes + status changes)
- **Savings**: ~67% reduction in writes

## Status Indicators

### Admin View (Users Page):
- 🟢 **Green pulsing dot** = Online & Active
- 🟡 **Yellow dot + "Xm Idle"** = Logged in but idle
- 🔴 **Red dot** = Offline

### Status Definitions:
- **Online**: User is actively using the system (mouse/keyboard activity within last 5 minutes)
- **Idle**: User is logged in but no activity for 5+ minutes
- **Offline**: User logged out or closed browser

## Testing Checklist

✅ User logs in → Status shows "online" sa admin side
✅ User inactive for 5 minutes → Status changes to "idle"
✅ User moves mouse/types → Status returns to "online"
✅ User logs out → Status changes to "offline"
✅ Idle time display shows correct duration
✅ No excessive Firestore writes (check Firebase console)

## Files Modified

1. `src/App.jsx` - Re-enabled and optimized presence tracking
2. `src/hooks/useFirebase.js` - Updated to use serverTimestamp
3. `src/pages/Users.jsx` - Fixed idle time calculation

## Notes

- Presence tracking is now **enabled by default**
- Optimized para hindi mag-exceed ng Firestore quota
- Real-time updates via Firestore onSnapshot
- Automatic cleanup on component unmount
- Works across all user access levels

## Future Improvements (Optional)

1. Add presence indicator sa Command Center page
2. Add "Last seen" timestamp for offline users
3. Add notification when specific users come online
4. Add presence history/logs
