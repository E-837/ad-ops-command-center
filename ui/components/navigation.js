// navigation.js - Breadcrumbs, keyboard shortcuts, command palette, and search

class NavigationManager {
  constructor() {
    this.recentPages = [];
    this.maxRecentPages = 10;
    this.favorites = [];
    this.commandPaletteOpen = false;
    this.init();
  }

  init() {
    this.setupKeyboardShortcuts();
    this.createCommandPalette();
    this.loadFavorites();
    this.trackPageVisits();
  }

  // Create breadcrumbs
  static createBreadcrumbs(path) {
    const nav = document.createElement('nav');
    nav.className = 'breadcrumbs';
    nav.setAttribute('aria-label', 'Breadcrumb');
    nav.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
    `;
    
    const parts = path.filter(p => p);
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      
      if (index > 0) {
        const separator = document.createElement('span');
        separator.className = 'separator';
        separator.textContent = '›';
        separator.style.color = 'rgba(255, 255, 255, 0.4)';
        nav.appendChild(separator);
      }
      
      if (isLast) {
        const current = document.createElement('span');
        current.className = 'current';
        current.textContent = part.label;
        current.style.cssText = `
          color: #fff;
          font-weight: 500;
        `;
        current.setAttribute('aria-current', 'page');
        nav.appendChild(current);
      } else {
        const link = document.createElement('a');
        link.href = part.url;
        link.textContent = part.label;
        link.style.cssText = `
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: color 0.2s ease;
        `;
        link.addEventListener('mouseenter', () => {
          link.style.color = '#3b82f6';
        });
        link.addEventListener('mouseleave', () => {
          link.style.color = 'rgba(255, 255, 255, 0.7)';
        });
        nav.appendChild(link);
      }
    });
    
    return nav;
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K: Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggleCommandPalette();
      }
      
      // Escape: Close modals/palettes
      if (e.key === 'Escape') {
        if (this.commandPaletteOpen) {
          this.closeCommandPalette();
        }
        // Close other modals
        document.querySelectorAll('.modal.active, .context-menu.active').forEach(el => {
          el.classList.remove('active');
        });
      }
      
      // Cmd/Ctrl + /: Show shortcuts help
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        this.showShortcutsHelp();
      }
    });
  }

  // Create command palette
  createCommandPalette() {
    const palette = document.createElement('div');
    palette.className = 'command-palette';
    palette.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 100px;
      z-index: 10000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    `;
    
    palette.innerHTML = `
      <div class="command-palette-content" style="
        width: 90%;
        max-width: 600px;
        background: rgba(17, 24, 39, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        transform: scale(0.95);
        transition: transform 0.2s ease;
      ">
        <div class="command-palette-search" style="padding: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
          <input
            type="text"
            placeholder="Search pages, workflows, campaigns..."
            class="command-search-input"
            style="
              width: 100%;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 8px;
              padding: 12px 16px;
              color: #fff;
              font-size: 16px;
              outline: none;
            "
          />
        </div>
        <div class="command-palette-results" style="
          max-height: 400px;
          overflow-y: auto;
          padding: 8px;
        "></div>
      </div>
    `;
    
    document.body.appendChild(palette);
    this.commandPalette = palette;
    
    // Close on backdrop click
    palette.addEventListener('click', (e) => {
      if (e.target === palette) {
        this.closeCommandPalette();
      }
    });
    
    // Search input
    const searchInput = palette.querySelector('.command-search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchCommands(e.target.value);
    });
    
    // Keyboard navigation in results
    searchInput.addEventListener('keydown', (e) => {
      const results = palette.querySelectorAll('.command-result');
      const selected = palette.querySelector('.command-result.selected');
      let index = Array.from(results).indexOf(selected);
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        index = Math.min(index + 1, results.length - 1);
        this.selectResult(results[index]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        index = Math.max(index - 1, 0);
        this.selectResult(results[index]);
      } else if (e.key === 'Enter' && selected) {
        e.preventDefault();
        selected.click();
      }
    });
  }

  // Toggle command palette
  toggleCommandPalette() {
    if (this.commandPaletteOpen) {
      this.closeCommandPalette();
    } else {
      this.openCommandPalette();
    }
  }

  // Open command palette
  openCommandPalette() {
    this.commandPaletteOpen = true;
    this.commandPalette.style.opacity = '1';
    this.commandPalette.style.pointerEvents = 'all';
    this.commandPalette.querySelector('.command-palette-content').style.transform = 'scale(1)';
    
    const input = this.commandPalette.querySelector('.command-search-input');
    input.value = '';
    input.focus();
    
    this.searchCommands('');
  }

  // Close command palette
  closeCommandPalette() {
    this.commandPaletteOpen = false;
    this.commandPalette.style.opacity = '0';
    this.commandPalette.style.pointerEvents = 'none';
    this.commandPalette.querySelector('.command-palette-content').style.transform = 'scale(0.95)';
  }

  // Search commands
  searchCommands(query) {
    const commands = this.getCommands();
    const results = this.commandPalette.querySelector('.command-palette-results');
    
    const filtered = query
      ? commands.filter(cmd =>
          cmd.title.toLowerCase().includes(query.toLowerCase()) ||
          (cmd.description && cmd.description.toLowerCase().includes(query.toLowerCase()))
        )
      : commands;
    
    if (filtered.length === 0) {
      results.innerHTML = `
        <div style="padding: 40px; text-align: center; color: rgba(255, 255, 255, 0.5);">
          No results found
        </div>
      `;
      return;
    }
    
    results.innerHTML = filtered.map((cmd, index) => `
      <div class="command-result ${index === 0 ? 'selected' : ''}" data-url="${cmd.url}" style="
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: ${index === 0 ? 'rgba(59, 130, 246, 0.1)' : 'transparent'};
        border: 1px solid ${index === 0 ? 'rgba(59, 130, 246, 0.3)' : 'transparent'};
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 20px;">${cmd.icon}</span>
          <div style="flex: 1;">
            <div style="color: #fff; font-weight: 500; margin-bottom: 2px;">${cmd.title}</div>
            ${cmd.description ? `<div style="color: rgba(255, 255, 255, 0.5); font-size: 12px;">${cmd.description}</div>` : ''}
          </div>
          ${cmd.badge ? `<span style="
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #60a5fa;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
          ">${cmd.badge}</span>` : ''}
        </div>
      </div>
    `).join('');
    
    // Add click handlers
    results.querySelectorAll('.command-result').forEach(result => {
      result.addEventListener('click', () => {
        window.location.href = result.dataset.url;
        this.closeCommandPalette();
      });
      
      result.addEventListener('mouseenter', () => {
        this.selectResult(result);
      });
    });
  }

  // Select result
  selectResult(result) {
    this.commandPalette.querySelectorAll('.command-result').forEach(r => {
      r.classList.remove('selected');
      r.style.background = 'transparent';
      r.style.borderColor = 'transparent';
    });
    
    result.classList.add('selected');
    result.style.background = 'rgba(59, 130, 246, 0.1)';
    result.style.borderColor = 'rgba(59, 130, 246, 0.3)';
    result.scrollIntoView({ block: 'nearest' });
  }

  // Get available commands
  getCommands() {
    const pages = [
      { title: 'Dashboard', icon: '📊', url: '/dashboard.html', description: 'Overview and metrics' },
      { title: 'Projects', icon: '📁', url: '/projects.html', description: 'Manage ad projects' },
      { title: 'Workflows', icon: '⚡', url: '/workflows.html', description: 'Automation workflows' },
      { title: 'Campaigns', icon: '🎯', url: '/campaigns.html', description: 'Ad campaigns' },
      { title: 'Reports', icon: '📈', url: '/reports.html', description: 'Performance reports' },
      { title: 'Analytics', icon: '📉', url: '/analytics.html', description: 'Advanced analytics' },
      { title: 'Integrations', icon: '🔌', url: '/integrations.html', description: 'Platform connections' },
      { title: 'Agents', icon: '🤖', url: '/agents.html', description: 'AI agents' },
      { title: 'Connectors', icon: '🔗', url: '/connectors.html', description: 'Data connectors' },
      { title: 'Architecture', icon: '🏗️', url: '/architecture.html', description: 'System architecture' },
      { title: 'Query', icon: '🔍', url: '/query.html', description: 'Data query interface' }
    ];
    
    // Add recent pages
    if (this.recentPages.length > 0) {
      pages.push(...this.recentPages.map(page => ({
        ...page,
        badge: 'Recent'
      })));
    }
    
    // Add favorites
    if (this.favorites.length > 0) {
      pages.push(...this.favorites.map(page => ({
        ...page,
        badge: '⭐'
      })));
    }
    
    return pages;
  }

  // Track page visits
  trackPageVisits() {
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop().replace('.html', '');
    
    // Update recent pages
    const recentPage = {
      title: this.getPageTitle(pageName),
      icon: this.getPageIcon(pageName),
      url: currentPath
    };
    
    // Remove if already exists
    this.recentPages = this.recentPages.filter(p => p.url !== currentPath);
    
    // Add to front
    this.recentPages.unshift(recentPage);
    
    // Limit size
    if (this.recentPages.length > this.maxRecentPages) {
      this.recentPages.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('recentPages', JSON.stringify(this.recentPages));
  }

  // Load favorites
  loadFavorites() {
    const stored = localStorage.getItem('favorites');
    if (stored) {
      try {
        this.favorites = JSON.parse(stored);
      } catch (e) {
        this.favorites = [];
      }
    }
  }

  // Toggle favorite
  toggleFavorite(page) {
    const index = this.favorites.findIndex(f => f.url === page.url);
    
    if (index > -1) {
      this.favorites.splice(index, 1);
    } else {
      this.favorites.push(page);
    }
    
    localStorage.setItem('favorites', JSON.stringify(this.favorites));
  }

  // Get page title
  getPageTitle(pageName) {
    const titles = {
      'dashboard': 'Dashboard',
      'projects': 'Projects',
      'workflows': 'Workflows',
      'campaigns': 'Campaigns',
      'reports': 'Reports',
      'analytics': 'Analytics',
      'integrations': 'Integrations',
      'agents': 'Agents',
      'connectors': 'Connectors',
      'architecture': 'Architecture',
      'query': 'Query'
    };
    return titles[pageName] || pageName;
  }

  // Get page icon
  getPageIcon(pageName) {
    const icons = {
      'dashboard': '📊',
      'projects': '📁',
      'workflows': '⚡',
      'campaigns': '🎯',
      'reports': '📈',
      'analytics': '📉',
      'integrations': '🔌',
      'agents': '🤖',
      'connectors': '🔗',
      'architecture': '🏗️',
      'query': '🔍'
    };
    return icons[pageName] || '📄';
  }

  // Show shortcuts help
  showShortcutsHelp() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    `;
    
    modal.innerHTML = `
      <div style="
        width: 90%;
        max-width: 500px;
        background: rgba(17, 24, 39, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      ">
        <h2 style="color: #fff; margin-bottom: 20px;">Keyboard Shortcuts</h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${[
            { key: 'Cmd/Ctrl + K', desc: 'Open command palette' },
            { key: 'Cmd/Ctrl + /', desc: 'Show shortcuts' },
            { key: 'Escape', desc: 'Close modals' },
            { key: 'Tab', desc: 'Navigate elements' },
            { key: 'Enter', desc: 'Activate/Submit' },
            { key: '↑/↓', desc: 'Navigate lists' }
          ].map(shortcut => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
              <span style="color: rgba(255, 255, 255, 0.7);">${shortcut.desc}</span>
              <kbd style="
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 4px 8px;
                border-radius: 4px;
                color: #fff;
                font-family: monospace;
                font-size: 12px;
              ">${shortcut.key}</kbd>
            </div>
          `).join('')}
        </div>
        <button onclick="this.closest('.shortcuts-modal').remove()" style="
          width: 100%;
          margin-top: 20px;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.4);
          color: #fff;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
        ">Close</button>
      </div>
    `;
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    document.body.appendChild(modal);
  }
}

// Export singleton instance
const navigationManager = new NavigationManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NavigationManager, navigationManager };
}
