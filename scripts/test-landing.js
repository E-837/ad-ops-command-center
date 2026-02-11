const fs = require('fs');
const path = require('path');
const CAMPAIGN_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'campaigns', 'example-saas-product.json'), 'utf8'));

const templatePath = path.join(__dirname, '..', 'output', 'landing-page.html');
const campaignSlug = CAMPAIGN_DATA.product.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const outputPath = path.join(__dirname, '..', 'output', `landing-${campaignSlug}.html`);

let html = fs.readFileSync(templatePath, 'utf8');
html = html.replace(/Locke AirPod AI/g, CAMPAIGN_DATA.product);
html = html.replace(/Locke AI Co\./g, CAMPAIGN_DATA.brand);
html = html.replace(/Intelligence You Can Wear/g, CAMPAIGN_DATA.tagline);
html = html.replace(/\$199/g, CAMPAIGN_DATA.price);

const dateMatch = CAMPAIGN_DATA.launchEvent.match(/(\w+ \d+,?\s*\d{4})\s*$/);
let isoDate = '2026-04-01';
if (dateMatch) {
  try { const p = new Date(dateMatch[1]); if (!isNaN(p)) isoDate = p.toISOString().slice(0, 10); } catch (_) {}
}
html = html.replace(/const launchDate = new Date\('[^']+'\);/, `const launchDate = new Date('${isoDate}T00:00:00-07:00');`);

html = html.replace(/LAUNCHING AT OPENAI DEVICE DAY/g, `LAUNCHING AT ${CAMPAIGN_DATA.launchEvent.split(' — ')[0].toUpperCase()}`);
html = html.replace(/APRIL 1, 2026 — SAN FRANCISCO/g, CAMPAIGN_DATA.launchEvent.toUpperCase());

fs.writeFileSync(outputPath, html, 'utf8');
console.log('Written to:', outputPath);
console.log('Size:', html.length);
console.log('Has Nimbus:', html.includes('Nimbus Cloud Suite'));
console.log('Has old brand:', html.includes('Locke AirPod AI'));
console.log('Has old tagline:', html.includes('Intelligence You Can Wear'));
console.log('Launch date:', isoDate);
