// update-ui-includes.js - Add new CSS and JS files to all HTML pages

const fs = require('fs');
const path = require('path');

const uiDir = path.join(__dirname, 'ui');
const htmlFiles = [
  'dashboard.html',
  'projects.html',
  'workflows.html',
  'campaigns.html',
  'reports.html',
  'analytics.html',
  'integrations.html',
  'agents.html',
  'connectors.html',
  'architecture.html',
  'query.html',
  'index.html'
];

const cssIncludes = `
  <link rel="stylesheet" href="/css/responsive.css">
  <link rel="stylesheet" href="/css/loading.css">
  <link rel="stylesheet" href="/css/animations.css">`;

const jsIncludes = `
  <script src="/components/loading.js"></script>
  <script src="/components/errors.js"></script>
  <script src="/components/navigation.js"></script>`;

const hamburgerMenu = `
  <!-- Hamburger Menu (Mobile) -->
  <button class="hamburger-btn" onclick="toggleSidebar()" aria-label="Toggle menu">
    <div class="hamburger-icon">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </button>
  
  <!-- Sidebar Overlay (Mobile) -->
  <div class="sidebar-overlay" onclick="closeSidebar()"></div>`;

htmlFiles.forEach(file => {
  const filePath = path.join(uiDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }
  
  let html = fs.readFileSync(filePath, 'utf8');
  
  // Add CSS files if not already present
  if (!html.includes('/css/responsive.css')) {
    html = html.replace(
      '</head>',
      `${cssIncludes}\n</head>`
    );
    console.log(`Added CSS to ${file}`);
  }
  
  // Add JS files if not already present
  if (!html.includes('/components/loading.js')) {
    html = html.replace(
      '</body>',
      `${jsIncludes}\n</body>`
    );
    console.log(`Added JS to ${file}`);
  }
  
  // Add hamburger menu if not already present
  if (!html.includes('hamburger-btn') && html.includes('<body>')) {
    html = html.replace(
      '<body>',
      `<body>\n${hamburgerMenu}`
    );
    console.log(`Added hamburger menu to ${file}`);
  }
  
  // Add sidebar toggle script if not already present
  if (!html.includes('function toggleSidebar')) {
    const sidebarScript = `
  <script>
    // Sidebar toggle for mobile
    function toggleSidebar() {
      const sidebar = document.querySelector('.sidebar');
      const hamburger = document.querySelector('.hamburger-btn');
      const overlay = document.querySelector('.sidebar-overlay');
      
      sidebar.classList.toggle('open');
      hamburger.classList.toggle('open');
      overlay.classList.toggle('active');
    }
    
    function closeSidebar() {
      const sidebar = document.querySelector('.sidebar');
      const hamburger = document.querySelector('.hamburger-btn');
      const overlay = document.querySelector('.sidebar-overlay');
      
      sidebar.classList.remove('open');
      hamburger.classList.remove('open');
      overlay.classList.remove('active');
    }
    
    // Close sidebar on navigation
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
      link.addEventListener('click', closeSidebar);
    });
  </script>`;
    
    html = html.replace(
      '</body>',
      `${sidebarScript}\n</body>`
    );
    console.log(`Added sidebar script to ${file}`);
  }
  
  fs.writeFileSync(filePath, html);
  console.log(`✅ Updated ${file}`);
});

console.log('\n✨ All HTML files updated successfully!');
