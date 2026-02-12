# LinkedIn Ads API Reference

Complete reference for all 12 LinkedIn Ads connector tools.

## Table of Contents

- [Account Management](#account-management)
- [Campaign Management](#campaign-management)
- [Creative Management](#creative-management)
- [Targeting](#targeting)
- [Lead Generation](#lead-generation)
- [Analytics](#analytics)

---

## Account Management

### `linkedin_get_ad_accounts`

List LinkedIn ad accounts accessible to the authenticated user.

**Parameters:**
- `search` (string, optional): Filter accounts by name

**Returns:**
- `data` (array): Array of ad account objects
- `count` (number): Total accounts found

**Example:**
```javascript
{
  "search": "Acme"
}
```

**Response:**
```json
{
  "data": [{
    "id": "urn:li:sponsoredAccount:123456789",
    "name": "Acme B2B Solutions",
    "status": "ACTIVE",
    "currency": "USD",
    "reference_organization_name": "Acme Corporation",
    "total_budget": { "amount": 100000, "currencyCode": "USD" }
  }],
  "count": 1
}
```

---

## Campaign Management

### `linkedin_get_campaigns`

List campaigns with optional filtering.

**Parameters:**
- `status` (array, optional): Filter by status (`['ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED', 'CANCELED']`)
- `count` (number, optional): Results to return (1-100, default: 50)
- `start` (number, optional): Pagination offset

**Example:**
```javascript
{
  "status": ["ACTIVE"],
  "count": 10
}
```

**Response:**
```json
{
  "data": [{
    "id": "urn:li:sponsoredCampaign:123456",
    "name": "B2B SaaS Lead Gen - Q1 2026",
    "objectiveType": "LEAD_GENERATION",
    "status": "ACTIVE",
    "dailyBudget": { "amount": "500", "currencyCode": "USD" },
    "totalBudget": { "amount": "15000", "currencyCode": "USD" },
    "runSchedule": { "start": 1707091200000, "end": 1709683200000 }
  }],
  "count": 1
}
```

### `linkedin_create_campaign`

Create a new campaign.

**Parameters:**
- `name` (string, required): Campaign name
- `objective_type` (string, required): One of:
  - `BRAND_AWARENESS` - Brand awareness (CPM)
  - `WEBSITE_VISITS` - Drive traffic (CPC)
  - `ENGAGEMENT` - Likes, comments, shares (CPE)
  - `VIDEO_VIEWS` - Video views (CPV)
  - `LEAD_GENERATION` - Lead forms (CPL)
  - `WEBSITE_CONVERSIONS` - Conversions (CPA)
  - `JOB_APPLICANTS` - Job applications
- `daily_budget_amount` (number, optional): Daily budget in dollars (minimum $10)
- `total_budget_amount` (number, optional): Total budget in dollars
- `start_date` (string, optional): Unix timestamp in milliseconds
- `end_date` (string, optional): Unix timestamp in milliseconds
- `locale_country` (string, optional): Country code (default: 'US')
- `locale_language` (string, optional): Language code (default: 'en_US')
- `status` (string, optional): `ACTIVE` or `PAUSED` (default: 'PAUSED')

**Example:**
```javascript
{
  "name": "Q2 Lead Generation Campaign",
  "objective_type": "LEAD_GENERATION",
  "daily_budget_amount": 500,
  "total_budget_amount": 15000,
  "start_date": "1707091200000",
  "status": "PAUSED"
}
```

**Response:**
```json
{
  "data": {
    "id": "urn:li:sponsoredCampaign:789012",
    "name": "Q2 Lead Generation Campaign",
    "objectiveType": "LEAD_GENERATION",
    "status": "PAUSED",
    "dailyBudget": { "amount": "500", "currencyCode": "USD" }
  },
  "message": "Created campaign: urn:li:sponsoredCampaign:789012"
}
```

### `linkedin_update_campaign`

Update an existing campaign.

**Parameters:**
- `campaign_id` (string, required): Campaign URN
- `name` (string, optional): Updated name
- `status` (string, optional): `ACTIVE`, `PAUSED`, `ARCHIVED`, `CANCELED`
- `daily_budget_amount` (number, optional): Updated daily budget
- `total_budget_amount` (number, optional): Updated total budget
- `end_date` (string, optional): Updated end date

**Example:**
```javascript
{
  "campaign_id": "urn:li:sponsoredCampaign:123456",
  "status": "ACTIVE",
  "daily_budget_amount": 750
}
```

---

## Creative Management

### `linkedin_get_creatives`

List ad creatives (Sponsored Content, Message Ads, Text Ads).

**Parameters:**
- `campaign_id` (string, optional): Filter by campaign
- `status` (array, optional): Filter by status
- `count` (number, optional): Results to return (1-100)

**Example:**
```javascript
{
  "campaign_id": "urn:li:sponsoredCampaign:123456",
  "status": ["ACTIVE"]
}
```

### `linkedin_create_sponsored_content`

Create a Sponsored Content ad (single image, carousel, or video).

**Parameters:**
- `campaign_id` (string, required): Parent campaign URN
- `creative_type` (string, optional): `SINGLE_IMAGE`, `CAROUSEL`, or `VIDEO` (default: 'SINGLE_IMAGE')
- `headline` (string, required): Ad headline (max 200 chars)
- `intro_text` (string, optional): Introduction text (max 600 chars)
- `call_to_action` (string, optional): CTA type (default: 'LEARN_MORE')
  - Options: `APPLY`, `DOWNLOAD`, `VIEW_QUOTE`, `LEARN_MORE`, `SIGN_UP`, `SUBSCRIBE`, `REGISTER`, `JOIN`, `ATTEND`
- `landing_page_url` (string, required): Destination URL
- `image_url` (string, optional): Image URL (for SINGLE_IMAGE)
- `video_url` (string, optional): Video URL (for VIDEO)
- `status` (string, optional): `ACTIVE` or `PAUSED` (default: 'PAUSED')

**Example:**
```javascript
{
  "campaign_id": "urn:li:sponsoredCampaign:123456",
  "creative_type": "SINGLE_IMAGE",
  "headline": "Transform Your Sales Pipeline with AI",
  "intro_text": "See how leading B2B companies close 40% more deals.",
  "call_to_action": "LEARN_MORE",
  "landing_page_url": "https://example.com/demo",
  "image_url": "https://cdn.example.com/hero.jpg",
  "status": "PAUSED"
}
```

**Response:**
```json
{
  "data": {
    "id": "urn:li:sponsoredCreative:456789",
    "campaign": "urn:li:sponsoredCampaign:123456",
    "status": "PAUSED",
    "content": {
      "headline": "Transform Your Sales Pipeline with AI",
      "callToAction": { "labelType": "LEARN_MORE" }
    }
  },
  "message": "Created sponsored content: urn:li:sponsoredCreative:456789"
}
```

### `linkedin_create_message_ad`

Create a Message Ad (InMail) for direct outreach.

**Parameters:**
- `campaign_id` (string, required): Parent campaign URN
- `subject` (string, required): Message subject (max 60 chars)
- `message_body` (string, required): Message text (max 1500 chars)
- `sender_name` (string, required): Sender display name
- `call_to_action_text` (string, required): CTA button text (max 20 chars)
- `call_to_action_url` (string, required): CTA destination URL
- `banner_image_url` (string, optional): Banner image URL
- `status` (string, optional): `ACTIVE` or `PAUSED`

**Example:**
```javascript
{
  "campaign_id": "urn:li:sponsoredCampaign:123456",
  "subject": "Exclusive Invitation: Transform Your Sales Team",
  "message_body": "Hi {firstName},\n\nI wanted to personally invite you to see how we've helped companies like yours increase sales by 40%.",
  "sender_name": "Sarah Johnson",
  "call_to_action_text": "Book Demo",
  "call_to_action_url": "https://example.com/demo",
  "status": "PAUSED"
}
```

**Note:** Message Ads support personalization tokens:
- `{firstName}` - Recipient's first name
- `{lastName}` - Recipient's last name
- `{companyName}` - Recipient's company

### `linkedin_create_text_ad`

Create a Text Ad for sidebar placement.

**Parameters:**
- `campaign_id` (string, required): Parent campaign URN
- `headline` (string, required): Ad headline (max 25 chars)
- `description` (string, required): Ad description (max 75 chars)
- `landing_page_url` (string, required): Destination URL
- `image_url` (string, required): Square image URL (50x50px)
- `status` (string, optional): `ACTIVE` or `PAUSED`

**Example:**
```javascript
{
  "campaign_id": "urn:li:sponsoredCampaign:123456",
  "headline": "B2B Sales Platform",
  "description": "Close more deals with AI. Free trial available.",
  "landing_page_url": "https://example.com/trial",
  "image_url": "https://cdn.example.com/logo-50x50.png"
}
```

---

## Targeting

### `linkedin_get_targeting_facets`

List available targeting options (job titles, companies, industries, skills, etc.).

**Parameters:**
- `facet_type` (string, required): Type of targeting facet
  - `TITLES` - Job titles
  - `COMPANIES` - Companies
  - `INDUSTRIES` - Industries
  - `SENIORITIES` - Seniority levels
  - `COMPANY_SIZES` - Company size buckets
  - `SKILLS` - Skills
  - `DEGREES` - Educational degrees
  - `FIELDS_OF_STUDY` - Fields of study
  - `GROUPS` - LinkedIn Groups
- `search` (string, optional): Search term to filter results
- `count` (number, optional): Results to return (1-100)

**Example:**
```javascript
{
  "facet_type": "TITLES",
  "search": "engineer",
  "count": 20
}
```

**Response:**
```json
{
  "data": [
    { "urn": "urn:li:title:100", "name": "VP of Engineering" },
    { "urn": "urn:li:title:200", "name": "Data Engineer" },
    { "urn": "urn:li:title:201", "name": "ML Engineer" }
  ],
  "count": 3,
  "facet_type": "TITLES"
}
```

**Seniorities:**
- `ENTRY` - Entry level
- `SENIOR` - Senior (individual contributor)
- `MANAGER` - Manager
- `DIRECTOR` - Director
- `VP` - Vice President
- `CXO` - C-Level Executive
- `PARTNER` - Partner
- `OWNER` - Owner

**Company Sizes:**
- `A` - Self-employed (0)
- `B` - 1-10 employees
- `C` - 11-50 employees
- `D` - 51-200 employees
- `E` - 201-500 employees
- `F` - 501-1,000 employees
- `G` - 1,001-5,000 employees
- `H` - 5,001-10,000 employees
- `I` - 10,001+ employees

### `linkedin_get_audience_counts`

Estimate audience reach for specific targeting criteria.

**Parameters:**
- `targeting` (object, required): Targeting criteria
  - `job_titles` (array): Job title URNs or names
  - `companies` (array): Company URNs or names
  - `industries` (array): Industry URNs or names
  - `seniorities` (array): Seniority levels
  - `company_sizes` (array): Company size buckets
  - `degrees` (array): Degree URNs
  - `fields_of_study` (array): Field of study URNs
  - `skills` (array): Skill URNs
  - `age_ranges` (array): Age ranges (`['18-24', '25-34', '35-54', '55+']`)
  - `genders` (array): Gender targeting (`['MALE', 'FEMALE']`)
  - `locations` (array): Location URNs

**Example:**
```javascript
{
  "targeting": {
    "job_titles": ["Chief Technology Officer", "VP of Engineering"],
    "industries": ["Software", "Information Technology"],
    "seniorities": ["DIRECTOR", "VP", "CXO"],
    "company_sizes": ["D", "E", "F", "G", "H", "I"]
  }
}
```

**Response:**
```json
{
  "data": {
    "targeting": { ...input },
    "estimatedReach": 4500,
    "estimatedImpressions": { "min": 90, "max": 360 },
    "estimatedClicks": { "min": 1, "max": 9 },
    "estimatedDailyBudget": { "min": 50, "max": 500, "recommended": 200 }
  }
}
```

---

## Lead Generation

### `linkedin_get_lead_gen_forms`

List Lead Gen Forms and optionally fetch submitted leads.

**Parameters:**
- `form_id` (string, optional): Specific form URN to retrieve
- `include_leads` (boolean, optional): Include lead submissions (default: false)
- `count` (number, optional): Forms to return (1-100)

**Example (list forms):**
```javascript
{
  "include_leads": false
}
```

**Example (get form with leads):**
```javascript
{
  "form_id": "urn:li:leadGenForm:567890",
  "include_leads": true
}
```

**Response:**
```json
{
  "data": {
    "id": "urn:li:leadGenForm:567890",
    "name": "SaaS Demo Request Form",
    "headline": "Get Your Free Demo",
    "description": "See how we can help your team close more deals.",
    "status": "ACTIVE",
    "totalLeads": 180,
    "fields": [
      { "type": "FIRST_NAME", "required": true },
      { "type": "LAST_NAME", "required": true },
      { "type": "EMAIL", "required": true },
      { "type": "COMPANY", "required": true },
      { "type": "TITLE", "required": true },
      { "type": "CUSTOM", "label": "Company Size", "required": true }
    ],
    "leads": [
      {
        "id": "lead_001",
        "submittedAt": 1707750000000,
        "firstName": "John",
        "lastName": "Smith",
        "email": "john.smith@techcorp.com",
        "company": "TechCorp Inc",
        "title": "VP of Sales",
        "customFields": { "Company Size": "51-200" }
      }
    ]
  }
}
```

**Available Field Types:**
- `FIRST_NAME` - First name
- `LAST_NAME` - Last name
- `EMAIL` - Email address
- `COMPANY` - Company name
- `TITLE` - Job title
- `PHONE` - Phone number
- `COUNTRY` - Country
- `CITY` - City
- `STATE` - State/Province
- `ZIP_CODE` - Postal code
- `CUSTOM` - Custom question

---

## Analytics

### `linkedin_get_analytics`

Get performance analytics for campaigns, creatives, or account.

**Parameters:**
- `entity_type` (string, optional): `ACCOUNT`, `CAMPAIGN`, or `CREATIVE` (default: 'CAMPAIGN')
- `entity_id` (string, optional): Entity URN (campaign_id, creative_id, or account_id)
- `date_start` (string, optional): Start date (YYYY-MM-DD)
- `date_end` (string, optional): End date (YYYY-MM-DD)
- `metrics` (array, optional): Specific metrics to retrieve (default: all)
- `time_granularity` (string, optional): `DAILY`, `MONTHLY`, or `ALL` (default: 'ALL')

**Available Metrics:**
- `impressions` - Total impressions
- `clicks` - Total clicks
- `spend` - Total spend
- `ctr` - Click-through rate (%)
- `cpc` - Cost per click
- `conversions` - Total conversions
- `cost_per_conversion` - Cost per conversion
- `leads` - Total leads (from Lead Gen Forms)
- `cost_per_lead` - Cost per lead
- `video_views` - Video views
- `video_completions` - Video completions
- `engagement_rate` - Engagement rate (%)
- `landing_page_clicks` - Landing page clicks
- `reactions` - Reactions (likes)
- `comments` - Comments
- `shares` - Shares
- `follows` - Company page follows

**Example (campaign analytics):**
```javascript
{
  "entity_type": "CAMPAIGN",
  "entity_id": "urn:li:sponsoredCampaign:123456",
  "date_start": "2026-02-01",
  "date_end": "2026-02-10"
}
```

**Response:**
```json
{
  "data": {
    "entity_id": "urn:li:sponsoredCampaign:123456",
    "entity_name": "B2B SaaS Lead Gen Campaign - Q1 2026",
    "date_start": "2026-02-01",
    "date_end": "2026-02-10",
    "metrics": {
      "impressions": 45000,
      "clicks": 900,
      "spend": 4500.00,
      "ctr": 2.0,
      "cpc": 5.00,
      "conversions": 85,
      "cost_per_conversion": 52.94,
      "leads": 180,
      "cost_per_lead": 25.00,
      "video_views": 0,
      "engagement_rate": 3.2,
      "landing_page_clicks": 720,
      "reactions": 230,
      "comments": 45,
      "shares": 32,
      "follows": 18
    },
    "breakdown": {
      "daily": [
        { "date": "2026-02-01", "impressions": 4200, "clicks": 84, "spend": 420.00, "leads": 17 },
        { "date": "2026-02-02", "impressions": 4800, "clicks": 96, "spend": 480.00, "leads": 19 }
      ]
    }
  }
}
```

**Example (account analytics):**
```javascript
{
  "entity_type": "ACCOUNT",
  "date_start": "2026-02-01",
  "date_end": "2026-02-10"
}
```

**Response:**
```json
{
  "data": {
    "entity_type": "ACCOUNT",
    "entity_name": "Acme B2B Solutions",
    "metrics": {
      "impressions": 170000,
      "clicks": 4025,
      "spend": 6000.00,
      "ctr": 2.37,
      "leads": 180,
      "cost_per_lead": 33.33
    },
    "campaigns": 3,
    "active_campaigns": 2,
    "creatives": 4,
    "active_creatives": 3
  }
}
```

---

## Error Handling

All tools return a standardized response:

**Success:**
```json
{
  "tool": "linkedin_get_campaigns",
  "sandbox": false,
  "timestamp": "2026-02-12T03:00:00.000Z",
  "status": "success",
  "data": [ ... ],
  "count": 5
}
```

**Error:**
```json
{
  "tool": "linkedin_create_campaign",
  "sandbox": false,
  "timestamp": "2026-02-12T03:00:00.000Z",
  "status": "error",
  "error": "LinkedIn API error: 401 Invalid access token"
}
```

---

## Rate Limiting

The connector handles LinkedIn API rate limits automatically:

- Exponential backoff on 429 responses
- Retry logic with jitter
- Respects `X-Rate-Limit-*` headers

---

## Sandbox Mode

When no credentials are configured, all tools return mock data:

```json
{
  "sandbox": true,
  "status": "success",
  "data": [ ...mock data... ]
}
```

Mock data includes:
- Realistic B2B campaigns and creatives
- B2B targeting options (job titles, seniorities, company sizes)
- Lead gen forms with sample B2B leads
- Analytics with typical B2B metrics (higher CPCs, lower CTRs, quality leads)

---

## Next Steps

- See [LINKEDIN_ADS_SETUP.md](./LINKEDIN_ADS_SETUP.md) for setup instructions
- See [LINKEDIN-ADS-INTEGRATION.md](../docs/LINKEDIN-ADS-INTEGRATION.md) for best practices
- Try the SocialMediaBuyer agent for automated campaign management

