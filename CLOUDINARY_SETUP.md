# Cloudinary Setup Guide

## Problem
You're getting "Upload preset not found" errors because Cloudinary requires an **unsigned upload preset** for client-side uploads.

## Solution Steps

### 1. Create Upload Preset in Cloudinary Dashboard

1. **Login to Cloudinary**: https://console.cloudinary.com/
2. **Navigate to**: Settings → Upload → Upload presets
3. **Click**: "Add upload preset" button
4. **Configure the preset**:
   - **Upload preset name**: Choose a name (e.g., `ipatroller_unsigned`)
   - **Signing Mode**: Select **"Unsigned"** (IMPORTANT!)
   - **Folder**: (Optional) Set to `ipatroller` or leave empty
   - **Access Mode**: Public (default)
   - Click **"Save"**

### 2. Update Your Code

After creating the preset, update the configuration in `src/utils/cloudinary.js`:

```javascript
const CLOUDINARY_CONFIG = {
  cloud_name: 'drr2jwqv8',
  api_key: '193961254783825',
  upload_preset: 'YOUR_ACTUAL_PRESET_NAME', // Replace with the name you created
  upload_url: 'https://api.cloudinary.com/v1_1/drr2jwqv8/image/upload'
};
```

**Example**: If you named your preset `ipatroller_unsigned`, change line 11 to:
```javascript
upload_preset: 'ipatroller_unsigned',
```

### 3. Test the Upload

After updating the preset name, try uploading photos again. The upload should now work.

## Why This is Needed

- **Client-side uploads** require unsigned presets for security
- **Signed uploads** require server-side signature generation (not implemented in browser-only mode)
- The preset tells Cloudinary what transformations and settings to apply to uploaded files

## Troubleshooting

If uploads still fail:
1. Verify the preset name matches exactly (case-sensitive)
2. Ensure "Signing Mode" is set to "Unsigned"
3. Check browser console for specific error messages
4. Verify your Cloudinary cloud name is correct: `drr2jwqv8`

## Current Configuration

- **Cloud Name**: `drr2jwqv8`
- **Upload URL**: `https://api.cloudinary.com/v1_1/drr2jwqv8/image/upload`
- **Preset to Create**: Choose your own name (e.g., `ipatroller_unsigned`)
