# Pag-aayos ng User Status (Online/Offline/Idle)

## Problema
May mga users na online pero sa admin side ay nakaoffline pa rin ang status nila.

## Dahilan
Ang feature na nag-track ng user status ay naka-disable (patay) para makatipid sa Firestore quota. Kaya hindi nag-uupdate ang status ng mga users.

## Solusyon

### Ano ang Ginawa?

#### 1. **Binuksan Ulit ang Presence Tracking** ✅
- Binuhay ulit ang feature na nag-track ng user status
- Pero ginawa itong mas efficient para hindi masyadong maraming writes sa Firestore

#### 2. **Optimized ang Updates** ⚡
- **Dati**: Nag-uupdate every 1 minute (60 writes per hour)
- **Ngayon**: Nag-uupdate every 3 minutes lang (20 writes per hour)
- **Savings**: 67% less writes = mas tipid sa quota!

#### 3. **Improved ang Idle Detection** 🎯
- **Dati**: 1 minute idle timeout (mabilis mag-idle)
- **Ngayon**: 5 minutes idle timeout (mas realistic)

## Paano Gumagana Ngayon?

### Status ng User:

#### 🟢 **ONLINE** (Luntiang bilog na kumikinang)
- Ang user ay aktibong gumagamit ng system
- May activity sa loob ng last 5 minutes (mouse movement, keyboard, clicks)
- Nag-uupdate every 3 minutes para i-maintain ang "online" status

#### 🟡 **IDLE** (Dilaw na bilog + "Xm Idle")
- Ang user ay naka-login pa pero walang activity
- Walang mouse/keyboard activity for 5+ minutes
- Makikita ang duration: "5m Idle", "15m Idle", etc.

#### 🔴 **OFFLINE** (Pulang bilog)
- Ang user ay nag-logout na
- O kaya naman ay nagsara ng browser/tab

### Timeline ng Status Changes:

```
Login → 🟢 ONLINE
  ↓
Gumagalaw ang mouse/keyboard → 🟢 ONLINE (maintained)
  ↓
5 minutes walang activity → 🟡 IDLE
  ↓
Gumalaw ulit → 🟢 ONLINE
  ↓
Nag-logout → 🔴 OFFLINE
```

## Saan Makikita ang Status?

### Sa Admin Side (Users Page):
1. Pumunta sa **Users** page
2. Tingnan ang user list
3. May maliit na bilog sa bawat user avatar:
   - 🟢 = Online
   - 🟡 = Idle (may label na "Xm Idle")
   - 🔴 = Offline

### Sa Command Center Summary:
- May summary ng Command Center users by status
- Makikita ang bilang ng Active, Idle, at Offline users

## Mga Benepisyo

### ✅ Real-time Updates
- Makikita agad kung sino ang online
- Automatic update ng status

### ✅ Accurate Status
- Tama ang display ng online/offline/idle
- May timestamp para sa idle duration

### ✅ Efficient
- Hindi masyadong maraming Firestore writes
- 67% reduction sa writes = mas tipid sa quota

### ✅ Reliable
- Automatic cleanup pag nag-logout
- Handles browser close/refresh properly

## Testing Guide

### Para sa Users:
1. **Login** → Check kung naging green ang status sa admin side
2. **Mag-idle** (5 minutes walang galaw) → Check kung naging yellow
3. **Gumalaw ulit** → Check kung bumalik sa green
4. **Logout** → Check kung naging red

### Para sa Admins:
1. Buksan ang **Users** page
2. Tingnan ang status indicators ng bawat user
3. Verify na tama ang status (online/idle/offline)
4. Check ang idle duration kung naka-idle ang user

## Mga Files na Binago

1. **src/App.jsx** - Presence tracking logic
2. **src/hooks/useFirebase.js** - Firestore timestamp handling
3. **src/pages/Users.jsx** - Status display at idle time calculation

## Important Notes

⚠️ **Kailangan ng Internet Connection**
- Ang presence tracking ay gumagamit ng Firestore real-time updates
- Kailangan ng stable internet connection

⚠️ **Browser Tab Must Be Open**
- Kung nakaclose ang tab, automatic na magiging "offline" ang status
- Pag bumukas ulit, babalik sa "online"

⚠️ **Idle Detection**
- Based sa mouse/keyboard activity lang
- Hindi kasama ang scrolling sa ibang window

## Troubleshooting

### Problema: Hindi pa rin nag-uupdate ang status

**Solusyon:**
1. Refresh ang browser (F5)
2. Logout at login ulit
3. Clear browser cache
4. Check ang internet connection
5. Check sa Firebase Console kung may errors

### Problema: Mabilis mag-idle

**Solusyon:**
- Normal lang yan! 5 minutes lang ang timeout
- Gumalaw lang ng mouse para bumalik sa online

### Problema: Hindi nag-ooffline pag logout

**Solusyon:**
- Check kung nag-logout talaga (hindi lang nag-close ng tab)
- Refresh ang admin page para makita ang update

## Mga Susunod na Improvements (Optional)

1. ✨ Dagdag ng presence indicator sa Command Center page
2. ✨ "Last seen" timestamp para sa offline users
3. ✨ Notification pag nag-online ang specific user
4. ✨ Presence history/logs para sa audit trail
