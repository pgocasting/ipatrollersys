# Cloudinary Photo Deletion Setup

## Overview
The system now attempts to delete photos from Cloudinary when an admin resets photos for an entry. However, **client-side deletion has limitations** due to Cloudinary's security model.

## Current Implementation

### What Happens When Resetting Photos:
1. ✅ System attempts to delete photos from Cloudinary
2. ✅ Photo links are removed from the database
3. ✅ Remarks are cleared
4. ✅ User receives feedback about deletion success/failure

### Deletion Behavior:
- **If deletion succeeds**: "Photos deleted from Cloudinary and reset successfully."
- **If deletion fails**: "Photo links removed. Note: Could not delete from Cloudinary (may require server-side setup). Files remain in cloud storage."

## Cloudinary Deletion Limitations

### Client-Side Deletion (Current Setup)
❌ **Not supported by default** - Cloudinary's destroy API requires:
- API Secret (cannot be exposed in browser)
- Signed requests (requires server-side signature)

### What This Means:
- Photo **links** are always removed from your app ✅
- Photos **may remain** in Cloudinary storage ⚠️
- Manual cleanup may be needed in Cloudinary dashboard

## Enabling Full Deletion (Optional)

To enable actual photo deletion from Cloudinary, you need a **server-side endpoint**:

### Option 1: Create a Backend API (Recommended)

Create a server endpoint (Node.js/Express example):

```javascript
// server.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'drr2jwqv8',
  api_key: '193961254783825',
  api_secret: 'YOUR_API_SECRET' // Keep this secret!
});

app.post('/api/delete-photo', async (req, res) => {
  try {
    const { publicId } = req.body;
    const result = await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

Then update `cloudinary.js` to call this endpoint instead of the direct API.

### Option 2: Use Cloudinary Auto-Delete Settings

In Cloudinary Dashboard:
1. Go to Settings → Upload
2. Configure **Auto-deletion** rules
3. Set retention policies for uploaded images

### Option 3: Manual Cleanup

Periodically clean up orphaned images:
1. Go to Cloudinary Dashboard → Media Library
2. Filter by upload date or folder
3. Manually delete unused images

## Current Workaround

The system logs all photo URLs before deletion attempts. You can:
1. Check browser console for deleted photo URLs
2. Manually delete from Cloudinary dashboard if needed
3. Or accept that old photos remain in cloud storage (they're not accessible from the app)

## Security Note

⚠️ **Never expose your Cloudinary API Secret in client-side code!**
- Current implementation is safe (no secrets exposed)
- Full deletion requires server-side implementation
- Consider the trade-off between convenience and security

## Recommendation

For most use cases, **removing the photo links** (current implementation) is sufficient:
- Photos are no longer visible in the app ✅
- Users can upload new photos ✅
- Old photos remain in Cloudinary but are orphaned
- Periodic manual cleanup can be done if storage is a concern

If you need automatic deletion, implement a backend API endpoint as shown in Option 1.
