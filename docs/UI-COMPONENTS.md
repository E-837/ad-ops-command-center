# UI Components Library Guide

Complete guide to using the UI components in Ad Ops Command Center.

## Overview

The platform uses vanilla JavaScript components with a dark glass-morphism theme. All components are mobile-responsive and accessible (WCAG 2.1 AA compliant).

## Core Components

### 1. Loading Manager (`ui/components/loading.js`)

Handles all loading states, skeletons, and progress indicators.

#### Usage

```javascript
// Global loading overlay
const loaderId = loadingManager.show('Loading campaigns...', 'Please wait');
// ... do async work
loadingManager.hide(loaderId);

// Inline loading
LoadingManager.showInline(element, 'Loading data...');

// Skeleton screens
LoadingManager.showSkeleton(element, 'table', { rows: 5 });

// Button loading state
LoadingManager.buttonLoading(button, true); // start
LoadingManager.buttonLoading(button, false); // stop
```

#### Available Skeletons

- `text` - Single line of text
- `card` - Card with avatar and text
- `table` - Table with rows
- `chart` - Chart placeholder

#### Progress Bars

```javascript
// Linear progress
const progress = LoadingManager.createProgressBar(45, {
  label: 'Processing',
  showPercentage: true,
  size: 'default' // or 'small', 'large'
});
container.appendChild(progress);

// Update progress
progress.update(75, 'Almost done');

// Circular progress
const circular = LoadingManager.createCircularProgress(60, {
  size: 80,
  strokeWidth: 8
});
circular.update(80);

// Workflow progress
const workflow = LoadingManager.createWorkflowProgress(
  ['Fetch data', 'Process', 'Generate report', 'Send'],
  1, // current stage
  { title: 'Campaign Generation', showDetails: true }
);
workflow.update(2); // move to next stage
```

### 2. Error Manager (`ui/components/errors.js`)

Toast notifications, inline errors, and form validation.

#### Toast Notifications

```javascript
// Show toasts
errorManager.success('Campaign created successfully!');
errorManager.error('Failed to save campaign');
errorManager.warning('Budget exceeds recommended amount');
errorManager.info('New data available');

// Custom duration (default: 5000ms)
errorManager.success('Saved', 3000);
```

#### Inline Errors

```javascript
// Create error message
const error = ErrorManager.createInlineError(
  'Failed to connect to Pinterest API',
  {
    retry: () => {
      // retry logic
    }
  }
);
container.appendChild(error);

// Show error in element
ErrorManager.showError(element, 'Invalid data', {
  retry: retryFunction
});
```

#### Form Validation

```javascript
// Validate entire form
const isValid = ErrorManager.validateForm(form);
if (isValid) {
  // submit
}

// Show field error
ErrorManager.showFieldError(input, 'Email is required');

// Clear all errors
ErrorManager.clearFormErrors(form);
```

#### API Error Handling

```javascript
// Fetch with automatic error handling
try {
  const data = await ErrorManager.fetchWithErrors('/api/campaigns');
} catch (error) {
  // Error toast shown automatically
}
```

### 3. Navigation Manager (`ui/components/navigation.js`)

Command palette, keyboard shortcuts, and breadcrumbs.

#### Command Palette

Automatically available with `Cmd/Ctrl + K`:

```javascript
// Programmatically open
navigationManager.openCommandPalette();

// Close
navigationManager.closeCommandPalette();
```

#### Breadcrumbs

```javascript
const breadcrumbs = NavigationManager.createBreadcrumbs([
  { label: 'Dashboard', url: '/dashboard' },
  { label: 'Campaigns', url: '/campaigns' },
  { label: 'Summer Launch' } // current page
]);
header.appendChild(breadcrumbs);
```

#### Keyboard Shortcuts

Built-in shortcuts:
- `Cmd/Ctrl + K` - Command palette
- `Cmd/Ctrl + /` - Show shortcuts help
- `Escape` - Close modals/palettes
- `↑/↓` - Navigate lists
- `Enter` - Activate/submit

Show shortcuts help:
```javascript
navigationManager.showShortcutsHelp();
```

#### Favorites

```javascript
// Toggle favorite
navigationManager.toggleFavorite({
  title: 'Budget Optimizer',
  icon: '💰',
  url: '/workflows.html?id=budget-optimizer'
});
```

### 4. Template Manager (`ui/components/templates.js`)

Workflow template system.

#### Load Templates

```javascript
await templateManager.loadTemplates();
const templates = templateManager.getTemplates();
```

#### Render Template Cards

```javascript
templateManager.renderTemplateCards(container, {
  category: 'campaign-ops' // optional
});
```

#### Show Template Modal

```javascript
templateManager.showTemplateModal('search-campaign-template');
```

#### Save Custom Template

```javascript
await templateManager.saveAsTemplate(execution, {
  name: 'My Custom Workflow',
  description: 'Description here',
  icon: '⚡',
  category: 'custom',
  fields: [/* field definitions */]
});
```

## CSS Utilities

### Responsive Classes

```css
/* Hide on mobile */
<div class="hide-mobile">Desktop only</div>

/* Show only on mobile */
<div class="show-mobile">Mobile only</div>

/* Full-width button on mobile */
<button class="btn btn-mobile-full">Click me</button>

/* Reduced padding on mobile */
<div class="p-sm-mobile">Smaller padding on mobile</div>
```

### Loading States

```html
<!-- Spinner -->
<div class="spinner"></div>
<div class="spinner spinner-lg"></div>
<div class="spinner spinner-sm"></div>

<!-- Skeleton -->
<div class="skeleton skeleton-text wide"></div>
<div class="skeleton skeleton-text medium"></div>

<!-- Progress bar -->
<div class="progress-bar">
  <div class="progress-fill" style="width: 60%"></div>
</div>

<!-- Loading button -->
<button class="btn loading">Save</button>
```

### Animation Classes

```html
<!-- Fade in -->
<div class="fade-in">Content</div>

<!-- Staggered fade (for lists) -->
<ul class="stagger-fade-in">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>

<!-- Pulse (for live indicators) -->
<div class="pulse">Live</div>

<!-- Shake (for errors) -->
<input class="shake">

<!-- Success bounce -->
<div class="success-bounce">✓</div>
```

## Accessibility

### ARIA Labels

Always include ARIA labels for interactive elements:

```html
<button aria-label="Run workflow">▶️</button>
<nav aria-label="Main navigation">...</nav>
<div role="alert" aria-live="polite">Campaign created</div>
```

### Keyboard Navigation

All interactive elements must be keyboard-accessible:
- Use semantic HTML (`<button>`, `<a>`, etc.)
- Ensure tab order is logical
- Provide visible focus indicators
- Support `Escape` to close overlays

### Screen Reader Support

```html
<!-- Screen reader only text -->
<span class="sr-only">Additional context for screen readers</span>

<!-- Skip link -->
<a href="#main-content" class="skip-link">Skip to main content</a>
```

### Color Contrast

All text must meet WCAG 2.1 AA standards:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum

Use the contrast checker:
```bash
npm run test-contrast
```

## Best Practices

### 1. Loading States

Always show loading states for async operations:

```javascript
// ❌ Bad
const data = await fetch('/api/campaigns');

// ✅ Good
const loaderId = loadingManager.show('Loading campaigns...');
try {
  const data = await fetch('/api/campaigns');
} finally {
  loadingManager.hide(loaderId);
}
```

### 2. Error Handling

Provide helpful, actionable error messages:

```javascript
// ❌ Bad
errorManager.error('Error 500');

// ✅ Good
errorManager.error('Failed to connect to Pinterest API. Check your API key in settings.');
```

### 3. Form Validation

Validate client-side before submitting:

```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!ErrorManager.validateForm(form)) {
    return;
  }
  
  // Submit...
});
```

### 4. Responsive Design

Test at all breakpoints:
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px - 1439px
- Wide: 1440px+

Use mobile-first CSS:

```css
/* Mobile (default) */
.card {
  padding: 1rem;
}

/* Tablet+ */
@media (min-width: 768px) {
  .card {
    padding: 1.5rem;
  }
}

/* Desktop+ */
@media (min-width: 1024px) {
  .card {
    padding: 2rem;
  }
}
```

### 5. Accessibility

Test with:
- Keyboard navigation (no mouse)
- Screen reader (NVDA/VoiceOver)
- Color contrast tool
- Browser zoom (up to 200%)

## Troubleshooting

### Component Not Loading

1. Check file is included in HTML:
```html
<script src="/components/loading.js"></script>
```

2. Check browser console for errors

3. Verify API endpoints are responding

### Styles Not Applying

1. Check CSS file is included:
```html
<link rel="stylesheet" href="/css/responsive.css">
<link rel="stylesheet" href="/css/loading.css">
<link rel="stylesheet" href="/css/animations.css">
```

2. Check element has correct class name

3. Verify no CSS specificity conflicts

### Templates Not Showing

1. Check templates directory exists: `workflows/templates/`
2. Verify JSON files are valid
3. Check server logs for errors
4. Ensure `/api/templates` endpoint is working

## Performance Tips

1. **Lazy load images**: Use `<img data-src="..." loading="lazy">`
2. **Debounce search**: Don't search on every keystroke
3. **Virtual scrolling**: For lists with 100+ items
4. **Code splitting**: Load components only when needed
5. **Cache API responses**: Use service workers or memory cache

## Examples

See `/ui/examples/` for complete examples:
- `loading-states.html` - All loading patterns
- `error-handling.html` - Error and validation examples
- `navigation.html` - Command palette and shortcuts
- `templates.html` - Template system demo
- `responsive.html` - Responsive design examples

## Support

For questions or issues:
- Check this documentation
- Review component source code
- Check browser console for errors
- Test in incognito mode (to rule out extensions)
