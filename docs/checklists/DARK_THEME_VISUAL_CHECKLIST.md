# Dark Theme Visual Checklist

## Quick Visual Verification Guide

Use this checklist to verify the dark theme improvements are working correctly.

---

## ✅ Dashboard Page

### Header Section
- [ ] Page title is bright white and clearly readable
- [ ] Subtitle text is light gray and visible
- [ ] Action buttons have proper colors and hover effects

### Stats Cards (Top Row)
- [ ] Card backgrounds are distinct from page background
- [ ] Card borders are visible
- [ ] Icon backgrounds are properly colored
- [ ] Numbers are bright and readable
- [ ] Card labels are clear

### Activity Overview Section
- [ ] Charts display with good contrast
- [ ] Chart labels are readable
- [ ] Time period selector is clearly visible
- [ ] Grid lines in charts are visible

### Municipality Lists
- [ ] List container has visible border
- [ ] Individual items have clear backgrounds
- [ ] Municipality names are bright white
- [ ] Status badges are colorful and visible:
  - Green for Active (✅)
  - Red for Inactive (✅)
  - Amber for Warning (✅)
- [ ] Hover effect changes background color
- [ ] Scrollbar is visible but not intrusive

### District Sections
- [ ] District headers have gradient backgrounds
- [ ] District names are clearly visible
- [ ] Section separators are prominent
- [ ] Each district has distinct visual identity

### Progress Bars
- [ ] Background track is visible
- [ ] Progress fill is bright and colored
- [ ] Percentage text is readable
- [ ] Colors match status (green/red/amber)

---

## ✅ Sidebar Navigation

### Overall
- [ ] Sidebar background is distinct from main content
- [ ] Border between sidebar and content is visible

### Header
- [ ] Logo is visible
- [ ] Brand name is readable
- [ ] "Main Hub" label is visible

### Navigation Items
- [ ] Default state: Gray text, no background
- [ ] Hover state: Light background, white text
- [ ] Active state: Blue background, bright text
- [ ] Icons are clearly visible

### User Section (Bottom)
- [ ] User profile card has visible border
- [ ] User name is bright and readable
- [ ] User role is visible
- [ ] Settings button has hover effect
- [ ] Sign out button has red hover effect

---

## ✅ Forms & Inputs

### Input Fields
- [ ] Input backgrounds are dark but distinct
- [ ] Borders are visible
- [ ] Placeholder text is readable (gray)
- [ ] Typed text is bright white
- [ ] Focus state shows blue border
- [ ] Error state shows red border (if applicable)

### Select Dropdowns
- [ ] Dropdown trigger has visible border
- [ ] Selected value is readable
- [ ] Dropdown arrow icon is visible
- [ ] Hover state changes background

### Buttons
- [ ] Primary buttons are bright blue
- [ ] Secondary buttons have visible borders
- [ ] Hover states are distinct
- [ ] Disabled buttons are faded
- [ ] Loading state is visible

---

## ✅ Tables

### Headers
- [ ] Header background is distinct
- [ ] Header text is bright
- [ ] Column borders are visible
- [ ] Sort indicators are visible (if applicable)

### Body Rows
- [ ] Alternating row colors are subtle but visible
- [ ] Hover state highlights entire row
- [ ] Cell text is bright and readable
- [ ] Cell borders provide clear separation

---

## ✅ Modals & Dialogs

### Overlay
- [ ] Backdrop is dark and blurs content behind

### Modal Container
- [ ] Modal background is distinct
- [ ] Modal border is visible
- [ ] Modal corners are rounded

### Modal Content
- [ ] Title is bright and prominent
- [ ] Body text is readable
- [ ] Close button (X) is visible
- [ ] Action buttons are clear

---

## ✅ Cards & Panels

### General Cards
- [ ] Card background is distinct from page
- [ ] Card border is visible
- [ ] Card shadow provides depth
- [ ] Card header is distinguishable
- [ ] Card content is properly padded

### Stat Cards
- [ ] Background colors match status:
  - Blue for info ✅
  - Green for success ✅
  - Red for error ✅
  - Amber for warning ✅
- [ ] Icons are bright and visible
- [ ] Numbers are large and readable
- [ ] Labels are clear

### Interactive Cards
- [ ] Hover effect is visible
- [ ] Click feedback is present
- [ ] Active state is distinct

---

## ✅ Badges & Labels

### Status Badges
- [ ] Active/Success: Bright green background, white text
- [ ] Inactive/Error: Bright red background, white text
- [ ] Warning: Bright amber background, white text
- [ ] Info: Bright blue background, white text
- [ ] Text within badges is readable

### Count Badges
- [ ] Background is colored
- [ ] Number is bright and readable
- [ ] Size is appropriate

---

## ✅ Icons

### Color Verification
- [ ] Blue icons: Light blue (#60a5fa)
- [ ] Green icons: Light green (#34d399)
- [ ] Red icons: Light red (#f87171)
- [ ] Amber icons: Light amber (#fbbf24)
- [ ] Purple icons: Light purple (#a78bfa)

### Visibility
- [ ] Icons have sufficient contrast
- [ ] Hover state brightens icons
- [ ] Icons are properly sized

---

## ✅ Typography

### Headings
- [ ] H1: Bright white, large, bold
- [ ] H2: Bright white, medium, bold
- [ ] H3: Bright white, smaller, semibold

### Body Text
- [ ] Primary text: Near white, very readable
- [ ] Secondary text: Light gray, readable
- [ ] Muted text: Medium gray, readable
- [ ] Link text: Blue, underlined on hover

---

## ✅ Scrollbars

### Desktop
- [ ] Track is dark, barely visible
- [ ] Thumb is medium gray, visible
- [ ] Thumb brightens on hover

### Mobile
- [ ] Scrollbars are thin
- [ ] Scrollbars fade when not in use

---

## ✅ Charts & Graphs

### Bar Charts
- [ ] Bars are brightly colored
- [ ] Axis labels are readable
- [ ] Grid lines are subtle but visible
- [ ] Tooltips have good contrast

### Progress Charts
- [ ] Background is visible
- [ ] Progress fill is bright
- [ ] Labels are readable

---

## ✅ Accessibility Features

### Keyboard Navigation
- [ ] Focus ring is visible and bright blue
- [ ] Tab order is logical
- [ ] Focus ring has sufficient contrast

### Screen Reader
- [ ] Labels are properly associated
- [ ] ARIA attributes are correct
- [ ] Status changes are announced

### Color Contrast
- [ ] All text meets 4.5:1 ratio minimum
- [ ] Large text meets 3:1 ratio minimum
- [ ] Status not conveyed by color alone

---

## ✅ Responsive Design

### Desktop (1920px+)
- [ ] All elements scale properly
- [ ] Spacing is appropriate
- [ ] No overflow issues

### Laptop (1366px)
- [ ] Layout adjusts correctly
- [ ] Text remains readable
- [ ] No crowding

### Tablet (768px)
- [ ] Sidebar collapses properly
- [ ] Cards stack correctly
- [ ] Touch targets are large enough

### Mobile (375px)
- [ ] Everything fits on screen
- [ ] Text is readable without zoom
- [ ] Navigation is accessible

---

## ✅ Performance

### Load Time
- [ ] Theme applies instantly
- [ ] No flash of unstyled content
- [ ] No flash of wrong theme

### Transitions
- [ ] Hover transitions are smooth
- [ ] Focus transitions work properly
- [ ] No jank or lag

### Animation
- [ ] Loading spinners are visible
- [ ] Progress bars animate smoothly
- [ ] Micro-interactions feel responsive

---

## Common Issues to Check

### Text Visibility
❌ **Problem**: Text is too dark or hard to read
✅ **Solution**: Should be #f1f5f9 or lighter

### Border Visibility
❌ **Problem**: Can't see card or input borders
✅ **Solution**: Should be #334155 or lighter

### Status Colors
❌ **Problem**: Status badges are too dim
✅ **Solution**: Should use bright tones (#10b981, #f43f5e, #f59e0b)

### Hover States
❌ **Problem**: Hover effects are not visible
✅ **Solution**: Background should change to #334155

### Input Fields
❌ **Problem**: Can't see input field boundaries
✅ **Solution**: Should have #475569 border

---

## Browser Testing

### Chrome/Edge
- [ ] All styles apply correctly
- [ ] No console errors
- [ ] Performance is good

### Firefox
- [ ] Styles match Chrome
- [ ] Scrollbars work correctly
- [ ] No layout issues

### Safari
- [ ] Colors display correctly
- [ ] Gradients render properly
- [ ] Animations work smoothly

### Mobile Browsers
- [ ] Touch interactions work
- [ ] Viewport scales correctly
- [ ] Text is readable

---

## Final Verification

Once all items are checked:

✅ **Dark theme is fully functional**
✅ **All components are visible and readable**
✅ **Accessibility standards are met**
✅ **Performance is optimized**
✅ **Cross-browser compatibility confirmed**

---

## Reporting Issues

If any checkbox fails, note:
1. Which specific item failed
2. What you see vs. what you expect
3. Browser and version
4. Screenshot (if applicable)
5. Steps to reproduce

Report to development team with these details.
