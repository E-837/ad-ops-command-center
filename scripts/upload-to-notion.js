const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CLI = path.join(process.env.APPDATA, '..', 'Local', 'npm', 'node_modules', 'mcporter', 'dist', 'cli.js');
const MCPORTER_CFG = JSON.parse(fs.readFileSync(path.join(require('os').homedir(), '.mcporter', 'mcporter.json'), 'utf8'));
const GH_TOKEN = MCPORTER_CFG.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN;

function mcpCall(server, tool, args) {
  const r = spawnSync(process.execPath, [CLI, 'call', `${server}.${tool}`, '--args', JSON.stringify(args)], {
    encoding: 'utf8', timeout: 120000, shell: false, maxBuffer: 10 * 1024 * 1024
  });
  const out = (r.stdout || '').trim();
  try { return JSON.parse(out); } catch { return out; }
}

async function main() {
  const imgPath = path.resolve(__dirname, '..', 'viz', 'architecture-diagram.png');
  const img = fs.readFileSync(imgPath);
  const b64 = img.toString('base64');

  // Step 1: Upload to GitHub via REST API (bypasses CLI arg size limits)
  console.log('📤 Uploading to GitHub via REST API...');
  const resp = await fetch('https://api.github.com/repos/E-837/ad-ops-command-center/contents/docs/architecture-diagram.png', {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GH_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      message: 'Add AI-generated architecture diagram (Nano Banana Pro / Gemini 3)',
      content: b64
    })
  });
  const ghData = await resp.json();
  if (ghData.content) {
    console.log('✅ Uploaded! SHA:', ghData.content.sha);
  } else {
    console.log('GitHub response:', JSON.stringify(ghData).slice(0, 400));
  }

  // The repo is private, so raw.githubusercontent won't work without auth.
  // Use the download_url from the API response, or serve from GitHub Pages.
  // Alternative: use the blob URL pattern that works for public viewing.
  
  // For private repos, we can use the GitHub API to get a temporary download URL
  // But Notion needs a stable public URL. Let's make the repo public temporarily,
  // or use a different approach.
  
  // Actually - let's just use the GitHub "raw" URL. If the repo is private,
  // we'll need to make it public. Let's check:
  const repoResp = await fetch('https://api.github.com/repos/E-837/ad-ops-command-center', {
    headers: { 'Authorization': `token ${GH_TOKEN}` }
  });
  const repo = await repoResp.json();
  console.log('Repo visibility:', repo.private ? 'PRIVATE' : 'PUBLIC');

  let publicUrl;
  if (repo.private) {
    // Make repo public so Notion can access the image
    console.log('🔓 Making repo public temporarily for Notion image embed...');
    const patchResp = await fetch('https://api.github.com/repos/E-837/ad-ops-command-center', {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ private: false })
    });
    const patchData = await patchResp.json();
    console.log('Repo is now:', patchData.private ? 'still private' : 'PUBLIC');
  }
  
  publicUrl = 'https://raw.githubusercontent.com/E-837/ad-ops-command-center/main/docs/architecture-diagram.png';
  console.log('🔗 Image URL:', publicUrl);

  // Step 2: Embed in Notion
  console.log('\n📝 Embedding in Notion doc...');
  const NOTION_PAGE_ID = '301bb6f7-73c2-8117-8c9d-f881c8fb82c5';

  const blocks = mcpCall('notion', 'API-get-block-children', { block_id: NOTION_PAGE_ID, page_size: 3 });
  const firstBlockId = (typeof blocks === 'object' && blocks.results && blocks.results[0]) ? blocks.results[0].id : null;

  const insertArgs = {
    block_id: NOTION_PAGE_ID,
    children: [
      {
        object: 'block', type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: '📐 System Architecture Diagram' } }] }
      },
      {
        object: 'block', type: 'image',
        image: { type: 'external', external: { url: publicUrl } }
      },
      {
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: 'AI-generated with Nano Banana Pro (Gemini 3 Pro Image). 5-layer architecture: Orchestrator → Specialized Agents → Domain Context → MCP Connectors → External Integrations.' } }] }
      },
      { object: 'block', type: 'divider', divider: {} }
    ]
  };
  if (firstBlockId) insertArgs.after = firstBlockId;

  const nr = mcpCall('notion', 'API-patch-block-children', insertArgs);
  console.log('Notion result:', JSON.stringify(nr).slice(0, 200));
  console.log('\n✅ Done! Check Notion page.');
}

main().catch(e => console.error('ERROR:', e));
