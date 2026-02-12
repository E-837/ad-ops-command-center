# Week 6: UI Polish - Quick Start Guide

Welcome to the polished, production-ready Ad Ops Command Center! This guide will help you get started with all the new UI features.

## What's New in Week 6?

✨ **Mobile Responsive** - Works beautifully on phone, tablet, and desktop
✨ **Workflow Templates** - 8 pre-built templates for common tasks
✨ **Loading States** - Professional loading indicators and progress bars
✨ **Error Handling** - Toast notifications and helpful error messages
✨ **Keyboard Shortcuts** - Power-user features with Cmd/Ctrl+K
✨ **Accessibility** - WCAG 2.1 AA compliant (screen readers, keyboard nav)
✨ **Animations** - Smooth microinteractions throughout

## Quick Start

### 1. Start the Server

```bash
cd C:\Users\RossS\.openclaw\workspace\projects\ad-ops-command
npm start
```

Server will start at: http://localhost:3002

### 2. Explore on Mobile

Open on your phone or resize your browser window to < 768px:

- **Hamburger menu** appears in top-left
- **Tap** to open sidebar
- **Swipe** or click outside to close
- All features work the same as desktop

### 3. Try Workflow Templates

1. Navigate to **Workflows** page
2. Click **Templates** tab (new!)
3. Browse 8 pre-built templates:
   - 🔍 Google Search Campaign
   - 📱 Meta Social Campaign
   - 📌 Pinterest Discovery Campaign
   - 🌐 Cross-Platform Launch
   - 🧪 A/B Creative Test
   - 💰 Budget Optimization
   - 📋 PRD to Asana Project
   - 📊 Weekly Performance Report

4. Click any template
5. Select a preset (optional)
6. Fill in the form
7. Click "Run Workflow"

### 4. Use Keyboard Shortcuts

**Open Command Palette**: Press `Cmd/Ctrl + K`
- Search for any page
- Jump to workflows
- Navigate anywhere instantly

**Show Shortcuts**: Press `Cmd/Ctrl + /`
- See all available shortcuts
- Learn keyboard navigation

**Other Shortcuts**:
- `Escape` - Close any modal or palette
- `↑/↓` - Navigate lists
- `Enter` - Activate/submit
- `Tab` - Move between elements

### 5. See Loading States

The platform now shows professional loading indicators:

**Global Loading**: When loading pages or data
**Skeleton Screens**: While tables/cards load
**Progress Bars**: For long-running operations
**Button Loading**: Buttons show spinners during actions

All automatic - no setup needed!

### 6. Experience Error Handling

Better error messages with toast notifications:

**Success**: ✅ Green toast (auto-dismisses in 5s)
**Error**: ⚠️ Red toast with helpful message
**Warning**: ⚡ Yellow toast for caution
**Info**: ℹ️ Blue toast for information

**Form Validation**: Real-time validation with field-level errors

### 7. Test Accessibility

**Keyboard Navigation**:
- Tab through all elements
- No mouse required
- All features accessible

**Screen Reader**:
- Turn on VoiceOver (Mac) or NVDA (Windows)
- All elements have proper labels
- ARIA landmarks for navigation

**High Contrast**:
- Works with Windows High Contrast Mode
- Color not the only indicator

## New Features Detail

### Mobile Responsive Design

**Breakpoints**:
- **Mobile**: < 768px (cards stack, full-width forms)
- **Tablet**: 768px - 1023px (2-column grid)
- **Desktop**: 1024px - 1439px (3-column grid)
- **Wide**: 1440px+ (4-column grid)

**Touch Optimizations**:
- Minimum 44x44px tap targets
- Touch-friendly form inputs
- Swipe gestures supported
- No tiny buttons

**Mobile-Specific UI**:
- Hamburger menu
- Sidebar overlay
- Full-width modals
- Stacked cards
- Horizontal scroll tables

### Workflow Templates

**What are Templates?**

Pre-configured workflows with user-friendly forms. No need to understand the underlying workflow - just fill in the form and go!

**How to Create Custom Templates**:

1. Run a workflow manually
2. Go to execution detail page
3. Click "Save as Template"
4. Fill in template metadata
5. Template appears in Templates tab

**Template Features**:
- Multiple field types (text, number, select, textarea, checkbox, email, URL)
- Required field validation
- Min/max constraints
- Help text
- Default values
- Presets for quick start

### Loading Components

**Usage in Your Code**:

```javascript
// Global loading overlay
const loaderId = loadingManager.show('Loading campaigns...');
// ... do work
loadingManager.hide(loaderId);

// Skeleton screen
LoadingManager.showSkeleton(element, 'table', { rows: 5 });

// Progress bar
const progress = LoadingManager.createProgressBar(0, {
  label: 'Processing',
  showPercentage: true
});
container.appendChild(progress);

// Update progress
progress.update(50);

// Workflow progress
const workflow = LoadingManager.createWorkflowProgress(
  ['Fetch', 'Process', 'Generate', 'Send'],
  1
);
workflow.update(2); // move to stage 3
```

### Error Handling

**Usage in Your Code**:

```javascript
// Toast notifications
errorManager.success('Campaign created!');
errorManager.error('Failed to save');
errorManager.warning('Budget high');
errorManager.info('New data available');

// Inline errors
ErrorManager.showError(container, 'Invalid data', {
  retry: () => loadData()
});

// Form validation
if (!ErrorManager.validateForm(form)) {
  return; // Errors shown automatically
}

// API error handling (automatic)
const data = await ErrorManager.fetchWithErrors('/api/campaigns');
```

### Navigation

**Command Palette** (`Cmd/Ctrl + K`):
- Fuzzy search all pages
- Recent pages shown
- Keyboard navigation (↑/↓)
- Enter to navigate

**Breadcrumbs**:
```javascript
const breadcrumbs = NavigationManager.createBreadcrumbs([
  { label: 'Dashboard', url: '/dashboard' },
  { label: 'Campaigns', url: '/campaigns' },
  { label: 'Summer Launch' }
]);
header.appendChild(breadcrumbs);
```

**Favorites**:
- Click ⭐ to favorite a workflow
- Appears in command palette
- Quick access to common tasks

## CSS Utilities

**Responsive Classes**:
```html
<!-- Hide on mobile -->
<div class="hide-mobile">Desktop only</div>

<!-- Show only on mobile -->
<div class="show-mobile">Mobile only</div>

<!-- Full-width on mobile -->
<button class="btn btn-mobile-full">Button</button>
```

**Animation Classes**:
```html
<div class="fade-in">Fades in</div>
<div class="slide-in-left">Slides from left</div>
<div class="pulse">Pulses</div>
<div class="shake">Shakes (for errors)</div>
```

**Loading Classes**:
```html
<div class="spinner"></div>
<div class="skeleton skeleton-text wide"></div>
<button class="btn loading">Saving...</button>
```

## Testing

### Test Responsive Design

**Desktop Browser**:
1. Open DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Test at different sizes:
   - 320px (iPhone SE)
   - 375px (iPhone)
   - 768px (iPad)
   - 1024px (Desktop)
   - 1920px (Wide)

**Real Devices**:
- Works on actual phones/tablets
- Test touch interactions
- Verify menu behavior

### Test Accessibility

**Keyboard Only**:
1. Close your mouse
2. Use Tab to navigate
3. Arrow keys in lists
4. Enter to activate
5. Escape to close

**Screen Reader**:
1. Turn on VoiceOver (Mac) or NVDA (Windows)
2. Navigate with screen reader
3. All elements should be announced
4. Forms should be clear

**Color Blindness**:
1. Install color blindness simulator
2. Test with different filters
3. Information not color-only

## Troubleshooting

### Hamburger Menu Not Showing

**Issue**: Hamburger menu visible on desktop

**Fix**: Check window width is < 768px. Menu only shows on mobile.

### Templates Not Loading

**Issue**: Templates tab is empty

**Fix**:
1. Check `workflows/templates/` directory exists
2. Verify JSON files are valid
3. Check server logs for errors
4. Restart server

### Keyboard Shortcuts Not Working

**Issue**: Cmd/Ctrl+K doesn't open command palette

**Fix**:
1. Check no other extension is using the shortcut
2. Try on different page
3. Check browser console for errors
4. Refresh page

### Styles Not Applying

**Issue**: New responsive styles not working

**Fix**:
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Check CSS files are loaded (DevTools Network tab)
4. Verify no CSP blocking

### Form Validation Not Working

**Issue**: Form submits without validation

**Fix**:
1. Check form has `onsubmit` handler
2. Verify `ErrorManager.validateForm()` is called
3. Check required fields have `required` attribute

## API Reference

### Templates API

```javascript
// Get all templates
GET /api/templates
GET /api/templates?category=campaign-ops

// Get specific template
GET /api/templates/:id

// Run template
POST /api/templates/:id/run
Body: { values: { field1: value1, ... } }

// Create custom template
POST /api/templates
Body: { template object }

// Delete custom template
DELETE /api/templates/:id
```

### Component APIs

See full documentation:
- `docs/UI-COMPONENTS.md` - All components
- `docs/TEMPLATES-GUIDE.md` - Template system
- `docs/ACCESSIBILITY.md` - A11y details

## Performance Tips

1. **Lazy Load Images**: Use `data-src` for images
2. **Skeleton Screens**: Show skeletons while loading
3. **Progress Indicators**: Keep users informed
4. **Debounce Search**: Don't search every keystroke
5. **Virtual Scrolling**: For long lists (100+ items)

## Best Practices

### Loading States

Always show loading for async operations:

```javascript
// ❌ Bad
const data = await fetch('/api/data');

// ✅ Good
const id = loadingManager.show('Loading...');
try {
  const data = await fetch('/api/data');
} finally {
  loadingManager.hide(id);
}
```

### Error Messages

Make errors helpful and actionable:

```javascript
// ❌ Bad
errorManager.error('Error');

// ✅ Good
errorManager.error('Failed to connect to Pinterest API. Check your API key in Settings.');
```

### Form Validation

Validate before submitting:

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!ErrorManager.validateForm(form)) {
    return;
  }
  
  // Submit...
});
```

### Accessibility

Test with keyboard and screen reader:

```html
<!-- ❌ Bad -->
<div onclick="handleClick()">Click me</div>

<!-- ✅ Good -->
<button onclick="handleClick()" aria-label="Close modal">
  ×
</button>
```

## Next Steps

1. **Try all templates** - Launch a campaign using templates
2. **Test on mobile** - Open on your phone
3. **Learn shortcuts** - Press Cmd/Ctrl+/ for help
4. **Create custom template** - Save your workflow as template
5. **Read docs** - Check `docs/` for detailed guides

## Resources

- **UI Components**: `docs/UI-COMPONENTS.md`
- **Templates Guide**: `docs/TEMPLATES-GUIDE.md`
- **Accessibility**: `docs/ACCESSIBILITY.md`
- **Week 6 Summary**: `docs/WEEK-6-COMPLETION-SUMMARY.md`
- **Component Source**: `ui/components/*.js`
- **CSS Source**: `ui/css/*.css`
- **Templates**: `workflows/templates/*.json`

## Support

**Issues?** Check:
1. Browser console for errors
2. Server logs
3. Documentation in `docs/`
4. Try incognito mode (rules out extensions)

**Questions?** The platform is self-documenting:
- Press `Cmd/Ctrl + /` for keyboard shortcuts
- Hover over elements for tooltips
- Check help text on form fields

---

**Version**: 2.0.0
**Updated**: February 11, 2026
**Platform**: Ad Ops Command Center

Enjoy the polished, production-ready UI! 🎉
