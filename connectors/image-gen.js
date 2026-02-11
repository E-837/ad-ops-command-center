/**
 * Image Generation Connector
 * Uses OpenRouter (Nano Banana / Gemini 2.5 Flash Image) to generate ad creatives
 * Then uploads to Canva via the Canva connector
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Load from .env if not in environment
let OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', 'config', '.env'), 'utf8');
    for (const line of envFile.split('\n')) {
      const idx = line.indexOf('=');
      if (idx > 0 && line.substring(0, idx).trim() === 'OPENROUTER_API_KEY') {
        OPENROUTER_API_KEY = line.substring(idx + 1).trim();
        break;
      }
    }
  } catch (_) {}
}
const MODEL = 'google/gemini-3-pro-image-preview'; // Nano Banana Pro (Gemini 3)

// Load brand guide
let BRAND_GUIDE = null;
try {
  BRAND_GUIDE = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'brand-guide.json'), 'utf8'));
} catch (_) {}

function getBrandSuffix() {
  return BRAND_GUIDE?.prompt_suffix || '';
}

function getSizeGuide(size) {
  if (!BRAND_GUIDE?.ad_specs) return '';
  const spec = BRAND_GUIDE.ad_specs[size];
  if (!spec) return '';
  return ` Layout: ${spec.layout} Text limits: ${spec.text_limit}`;
}

// Ad creative prompt templates per format (brand-aware)
const PROMPTS = {
  'display-banner': (brand, product, size, tagline) => {
    const sizeGuide = getSizeGuide(size);
    return `Generate a ${size} pixel digital display banner advertisement for ${brand} ${product}. ` +
    `Bold headline text "${tagline.toUpperCase()}" in clean sans-serif font (Inter/Helvetica style, NO serif fonts, NO script fonts). ` +
    `Include "PRE-ORDER $199" call-to-action button and a stylized "L" logo mark in corner (do NOT write out the full brand name). ` +
    `Show a sleek AirPod-style AI earbud with a subtle indigo/cyan glow. ` +
    `${sizeGuide} ${getBrandSuffix()}`;
  },
  
  'video-thumbnail': (brand, product, size, tagline) =>
    `Generate a ${size} pixel cinematic video thumbnail for a ${brand} ${product} advertisement. ` +
    `Person wearing a sleek AI earbud, profile view, warm directional lighting with background bokeh. ` +
    `Bold sans-serif text overlay: "${tagline.toUpperCase()}" in white, high contrast. ` +
    `Include stylized "L" logo mark (not full brand name) and "PRE-ORDER $199" CTA. ` +
    `${getSizeGuide(size)} ${getBrandSuffix()}`,
  
  'social': (brand, product, size, tagline) =>
    `Generate a ${size} pixel social media advertisement for ${brand} ${product}. ` +
    `Eye-catching, scroll-stopping design. Bold sans-serif headline: "${tagline.toUpperCase()}". ` +
    `Sleek AI earbud product shot. Include CTA and brand mark. ` +
    `${getBrandSuffix()}`
};

/**
 * Generate an ad creative image using OpenRouter
 * @param {Object} opts
 * @param {string} opts.brand - Brand name
 * @param {string} opts.product - Product name  
 * @param {string} opts.size - Dimensions (e.g., "300x250")
 * @param {string} opts.tagline - Ad tagline
 * @param {string} opts.type - Template type: display-banner, video-thumbnail, social
 * @param {string} opts.customPrompt - Override with custom prompt
 * @returns {Object} { success, imageData, imagePath, error }
 */
async function generateImage(opts) {
  const { brand, product, size, tagline = 'Intelligence You Can Wear', type = 'display-banner', customPrompt } = opts;
  
  if (!OPENROUTER_API_KEY) {
    return { success: false, error: 'OPENROUTER_API_KEY not set' };
  }

  const prompt = customPrompt || (PROMPTS[type] || PROMPTS['display-banner'])(brand, product, size, tagline);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000); // 60s timeout
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image']
      }),
      signal: controller.signal
    });
    clearTimeout(timer);

    const data = await res.json();
    
    if (data.error) {
      return { success: false, error: data.error.message || JSON.stringify(data.error) };
    }

    const msg = data.choices?.[0]?.message;
    if (!msg) {
      return { success: false, error: 'No message in response' };
    }

    // Extract image data — OpenRouter returns images in various formats
    let imageData = null;
    let imageUrl = null;

    // Check images array (OpenRouter format)
    if (msg.images && msg.images.length > 0) {
      const img = msg.images[0];
      imageUrl = img.imageUrl?.url || img.url || img.image_url?.url;
      imageData = imageUrl;
    }

    // Check content array (multimodal format)
    if (!imageData && Array.isArray(msg.content)) {
      const imgPart = msg.content.find(p => p.type === 'image_url' || p.type === 'image');
      if (imgPart) {
        imageData = imgPart.image_url?.url || imgPart.url || imgPart.data;
      }
    }

    if (!imageData) {
      return { success: false, error: 'No image data in response', rawKeys: Object.keys(msg) };
    }

    // Save to temp file if it's base64
    let savedPath = null;
    if (imageData.startsWith('data:image')) {
      const base64Data = imageData.split(',')[1];
      const ext = imageData.includes('png') ? 'png' : 'jpg';
      savedPath = path.join(os.tmpdir(), `ad-creative-${size.replace('x', '-')}-${Date.now()}.${ext}`);
      fs.writeFileSync(savedPath, Buffer.from(base64Data, 'base64'));
    }

    return {
      success: true,
      imageData,
      imagePath: savedPath,
      imageUrl: imageData.startsWith('http') ? imageData : null,
      model: MODEL,
      prompt: prompt.substring(0, 100) + '...',
      size
    };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Generate image and upload to Canva
 * @param {Object} opts - Same as generateImage plus canvaFolderId
 * @returns {Object} { success, canvaAsset, imagePath, error }
 */
async function generateAndUploadToCanva(opts) {
  const genResult = await generateImage(opts);
  
  if (!genResult.success) {
    return { success: false, error: `Image generation failed: ${genResult.error}` };
  }

  // Upload to Canva
  try {
    const canva = require('./canva');
    
    if (!canva.hasCanva) {
      return { 
        success: true, 
        imageGenerated: true,
        canvaUpload: false,
        imagePath: genResult.imagePath,
        error: 'Canva not configured — image generated but not uploaded'
      };
    }

    // If we have a URL, upload directly
    if (genResult.imageUrl) {
      const uploadResult = await canva.uploadAsset({
        name: `${opts.product} — ${opts.size} Ad Creative`,
        url: genResult.imageUrl,
        parent_folder_id: opts.canvaFolderId
      });
      
      return {
        success: true,
        imageGenerated: true,
        canvaUpload: true,
        canvaAsset: uploadResult,
        imagePath: genResult.imagePath
      };
    }

    // If we have base64/local file, we'd need to host it first
    // For now, return the generated image path
    return {
      success: true,
      imageGenerated: true,
      canvaUpload: false,
      imagePath: genResult.imagePath,
      note: 'Image generated locally — base64 upload to Canva requires hosting URL'
    };

  } catch (err) {
    return {
      success: true,
      imageGenerated: true,
      canvaUpload: false,
      imagePath: genResult.imagePath,
      error: `Canva upload failed: ${err.message}`
    };
  }
}

/**
 * Generate multiple ad creatives for a campaign
 * @param {Object} campaign - Campaign data with creativeSizes array
 * @returns {Array} Results for each size
 */
async function generateCampaignCreatives(campaign) {
  const results = [];
  
  for (const size of campaign.creativeSizes) {
    const type = size.format === 'video' ? 'video-thumbnail' : 'display-banner';
    
    const result = await generateAndUploadToCanva({
      brand: campaign.brand,
      product: campaign.product,
      size: size.size,
      tagline: campaign.tagline || 'Intelligence You Can Wear',
      type
    });
    
    results.push({
      ...result,
      sizeName: size.name,
      sizeSpec: size.size,
      format: size.format
    });
    
    // Small delay between generations to be nice to the API
    await new Promise(r => setTimeout(r, 1000));
  }
  
  return results;
}

module.exports = {
  generateImage,
  generateAndUploadToCanva,
  generateCampaignCreatives,
  MODEL,
  PROMPTS
};
