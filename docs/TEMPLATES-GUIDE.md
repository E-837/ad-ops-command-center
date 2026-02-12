# Workflow Templates Guide

Guide to creating, using, and customizing workflow templates in Ad Ops Command Center.

## Overview

Templates provide pre-configured workflows with user-friendly forms. Users can launch complex workflows without understanding the underlying implementation.

## Built-in Templates

### 1. Google Search Campaign (`search-campaign.json`)

**Purpose**: Launch Google Ads search campaigns with AI-generated keywords and copy.

**Use Cases**:
- New product launches
- Seasonal campaigns
- Competitor targeting

**Key Fields**:
- Product name and description
- Target audience
- Budget and duration
- Geographic targeting
- Number of keywords/ad variants

**Presets**:
- Small Budget ($50/day, 14 days)
- Medium Budget ($200/day, 30 days)
- Large Budget ($1000/day, 60 days)

### 2. Meta Social Campaign (`social-campaign.json`)

**Purpose**: Launch Meta (Facebook/Instagram) campaigns with AI audience targeting.

**Use Cases**:
- Brand awareness
- Engagement campaigns
- E-commerce conversions

**Key Fields**:
- Campaign objective
- Target audience description
- Budget and placements
- Creative count
- Ad copy tone

**Presets**:
- Awareness Campaign
- Conversion Campaign
- Instagram Stories

### 3. Pinterest Discovery Campaign (`pinterest-discovery.json`)

**Purpose**: Launch Pinterest campaigns with optimized pins.

**Use Cases**:
- Visual product launches
- Seasonal trends
- Lifestyle brands

**Key Fields**:
- Product category
- Number of pins
- Target keywords
- Audience interests

**Presets**:
- Fashion Discovery
- Home & Garden
- Seasonal Campaign

### 4. Cross-Platform Launch (`cross-platform.json`)

**Purpose**: Launch the same campaign across multiple platforms simultaneously.

**Use Cases**:
- Major product launches
- Coordinated marketing campaigns
- Multi-channel testing

**Key Fields**:
- Product description
- Total budget (split across platforms)
- Platform selection
- Budget optimization strategy

**Presets**:
- Small Launch ($200/day)
- Medium Launch ($750/day)
- Large Launch ($2000/day)

### 5. A/B Creative Test (`ab-test.json`)

**Purpose**: Test multiple creative variants to find winners.

**Use Cases**:
- Creative optimization
- Headline testing
- CTA experiments

**Key Fields**:
- Number of variants
- Test type (creative, copy, headline, CTA, audience)
- Test duration
- Success metric

**Presets**:
- Quick Test (2 variants, 3 days)
- Standard Test (3 variants, 7 days)
- Comprehensive Test (5 variants, 14 days)

### 6. Budget Optimization (`budget-optimizer.json`)

**Purpose**: Automatically reallocate budget based on performance.

**Use Cases**:
- Ongoing campaign management
- ROAS maximization
- CPA reduction

**Key Fields**:
- Optimization goal (ROAS, conversions, revenue, CPA)
- Frequency (hourly, daily, weekly)
- Aggressiveness level

**Presets**:
- Conservative Optimization
- Aggressive ROAS Focus
- Volume Maximizer

### 7. PRD to Asana Project (`prd-to-asana.json`)

**Purpose**: Parse PRDs and create Asana tasks automatically.

**Use Cases**:
- Project planning
- Sprint setup
- Task delegation

**Key Fields**:
- PRD URL or text
- Task breakdown level
- Project duration
- Dependency mapping

**Presets**:
- Quick Import (high-level tasks)
- Standard Project (detailed tasks)
- Comprehensive Breakdown (with subtasks)

### 8. Weekly Performance Report (`weekly-report.json`)

**Purpose**: Generate and distribute weekly performance reports.

**Use Cases**:
- Team updates
- Stakeholder reporting
- Performance tracking

**Key Fields**:
- Platforms to include
- Metrics level (executive, standard, detailed)
- Delivery format (PDF, HTML, Google Sheets)
- Recipients and schedule

**Presets**:
- Quick Summary (executive level)
- Standard Weekly (charts + insights)
- Comprehensive Analysis (detailed metrics)

## Creating Custom Templates

### Template Structure

```json
{
  "id": "my-custom-template",
  "name": "Display Name",
  "description": "Short description of what this template does",
  "workflow": "underlying-workflow-id",
  "icon": "📊",
  "category": "campaign-ops",
  "defaults": {
    "key": "default value"
  },
  "fields": [ /* field definitions */ ],
  "presets": [ /* quick-start presets */ ]
}
```

### Field Types

#### Text Input

```json
{
  "name": "productName",
  "label": "Product Name",
  "type": "text",
  "required": true,
  "placeholder": "e.g., AI Marketing Tool",
  "help": "Optional help text"
}
```

#### Number Input

```json
{
  "name": "budget",
  "label": "Daily Budget ($)",
  "type": "number",
  "required": true,
  "default": 100,
  "min": 10,
  "max": 10000,
  "help": "Budget per day in USD"
}
```

#### Select/Dropdown

```json
{
  "name": "platform",
  "label": "Platform",
  "type": "select",
  "required": true,
  "default": "google-ads",
  "options": [
    { "value": "google-ads", "label": "Google Ads" },
    { "value": "meta", "label": "Meta" },
    { "value": "pinterest", "label": "Pinterest" }
  ]
}
```

#### Textarea

```json
{
  "name": "description",
  "label": "Product Description",
  "type": "textarea",
  "required": true,
  "placeholder": "Describe your product...",
  "help": "This will be used to generate ad copy"
}
```

#### Checkbox

```json
{
  "name": "autoOptimize",
  "label": "Enable Auto-optimization",
  "type": "checkbox",
  "default": true,
  "help": "Automatically adjust bids based on performance"
}
```

#### Email Input

```json
{
  "name": "contactEmail",
  "label": "Contact Email",
  "type": "email",
  "required": true,
  "placeholder": "team@example.com"
}
```

#### URL Input

```json
{
  "name": "landingPage",
  "label": "Landing Page URL",
  "type": "url",
  "required": true,
  "placeholder": "https://example.com/product"
}
```

### Presets

Presets provide quick-start configurations:

```json
"presets": [
  {
    "name": "Small Budget",
    "values": {
      "budget": 50,
      "duration": 14,
      "keywordCount": 10
    }
  },
  {
    "name": "Large Budget",
    "values": {
      "budget": 1000,
      "duration": 60,
      "keywordCount": 50
    }
  }
]
```

When a user selects a preset, the form fields are automatically filled with these values.

### Validation

Templates are validated automatically:

1. **Required fields**: Must have a value
2. **Number fields**: Must be within `min`/`max` range
3. **Email fields**: Must match email pattern
4. **URL fields**: Must start with `http://` or `https://`

Custom validation in underlying workflow can add additional checks.

## Using Templates

### From UI

1. Navigate to **Workflows** → **Templates** tab
2. Browse or search for a template
3. Click on a template card
4. (Optional) Select a preset from dropdown
5. Fill in the form fields
6. Click "Run Workflow"

### From API

```javascript
// Get all templates
const templates = await fetch('/api/templates').then(r => r.json());

// Get specific template
const template = await fetch('/api/templates/search-campaign-template')
  .then(r => r.json());

// Run template
const response = await fetch('/api/templates/search-campaign-template/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    values: {
      productName: 'AI Marketing Tool',
      budget: 200,
      duration: 30,
      // ... other fields
    }
  })
});

const result = await response.json();
// { executionId: '123', status: 'running', workflowId: 'search-campaign-workflow' }
```

### From Code

```javascript
// Show template modal programmatically
templateManager.showTemplateModal('search-campaign-template');

// Render template cards in a container
templateManager.renderTemplateCards(container, {
  category: 'campaign-ops' // optional filter
});

// Get templates by category
const campaignTemplates = templateManager.getTemplatesByCategory('campaign-ops');
```

## Saving Custom Templates

You can create custom templates from existing workflow executions:

```javascript
await templateManager.saveAsTemplate(execution, {
  name: 'My Custom Campaign',
  description: 'Customized campaign template for our team',
  icon: '⚡',
  category: 'custom',
  fields: [
    {
      name: 'companyName',
      label: 'Company Name',
      type: 'text',
      required: true
    },
    // ... more fields
  ]
});
```

Custom templates are saved to `workflows/templates/custom/` and appear alongside built-in templates.

## Template Categories

- **campaign-ops**: Campaign creation and management
- **analytics**: Performance analysis and optimization
- **productivity**: Project management and automation
- **cross-platform**: Multi-platform campaigns

## Best Practices

### 1. Clear Naming

**Good**:
- "Google Search Campaign"
- "Weekly Performance Report"

**Bad**:
- "Workflow 1"
- "Campaign Thing"

### 2. Helpful Descriptions

**Good**:
> "Launch a Google Ads search campaign with AI-generated keywords and copy"

**Bad**:
> "Creates a campaign"

### 3. Sensible Defaults

Set defaults that work for most users:

```json
{
  "name": "budget",
  "default": 100,  // reasonable default
  "min": 10,
  "max": 10000
}
```

### 4. Helpful Field Labels

**Good**:
- "Daily Budget ($)"
- "Campaign Duration (days)"

**Bad**:
- "Budget"
- "Duration"

### 5. Use Help Text

Add `help` text for complex fields:

```json
{
  "name": "aggressiveness",
  "label": "Reallocation Aggressiveness",
  "type": "select",
  "help": "How quickly to shift budget to better performers"
}
```

### 6. Logical Field Order

Order fields from general to specific:

1. Name/title
2. Platform/type selection
3. Budget/duration
4. Detailed configuration
5. Advanced options

### 7. Useful Presets

Create presets for common use cases:

- **Quick Start**: Minimal configuration
- **Standard**: Recommended settings
- **Advanced**: Full customization

## Template Storage

- **Built-in templates**: `workflows/templates/*.json`
- **Custom templates**: `workflows/templates/custom/*.json`

Templates are loaded on server start and cached in memory. Restart the server after manually editing template files.

## API Reference

### GET `/api/templates`

Get all templates.

**Query Parameters**:
- `category` (optional): Filter by category

**Response**:
```json
[
  {
    "id": "search-campaign-template",
    "name": "Google Search Campaign",
    "description": "...",
    "icon": "🔍",
    "category": "campaign-ops",
    "fields": [...],
    "presets": [...]
  }
]
```

### GET `/api/templates/:id`

Get a specific template.

**Response**: Single template object.

### POST `/api/templates/:id/run`

Execute a template.

**Body**:
```json
{
  "values": {
    "productName": "AI Tool",
    "budget": 200,
    ...
  },
  "projectId": "optional-project-id"
}
```

**Response**:
```json
{
  "executionId": "exec-123",
  "status": "running",
  "workflowId": "search-campaign-workflow"
}
```

### POST `/api/templates`

Create a custom template.

**Body**: Complete template object.

**Response**: Created template.

### DELETE `/api/templates/:id`

Delete a custom template (built-in templates cannot be deleted).

**Response**:
```json
{
  "message": "Template deleted"
}
```

## Troubleshooting

### Template Not Showing

1. Check JSON syntax is valid
2. Verify file is in `workflows/templates/` directory
3. Restart the server
4. Check server logs for errors

### Validation Errors

1. Ensure all required fields have values
2. Check number fields are within min/max
3. Verify email/URL formats
4. Check underlying workflow supports the input

### Execution Fails

1. Check underlying workflow exists
2. Verify workflow accepts the template input
3. Check workflow has all required agents configured
4. Review workflow execution logs

## Examples

See `workflows/templates/` for complete examples of all 8 built-in templates.

## Future Enhancements

Planned features:
- Template marketplace (share with community)
- Visual template builder (no JSON required)
- Template versioning
- Template analytics (usage tracking)
- Conditional fields (show/hide based on other fields)
- Field validation rules (regex, custom functions)
