// loading.js - Loading states, spinners, skeletons, and progress indicators

class LoadingManager {
  constructor() {
    this.activeLoaders = new Set();
    this.init();
  }

  init() {
    // Create global loading overlay
    this.overlay = this.createOverlay();
    document.body.appendChild(this.overlay);
  }

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-overlay-content">
        <div class="spinner spinner-lg loading-overlay-spinner"></div>
        <div class="loading-overlay-text">Loading...</div>
        <div class="loading-overlay-subtext"></div>
      </div>
    `;
    return overlay;
  }

  // Show global loading overlay
  show(text = 'Loading...', subtext = '') {
    const id = Math.random().toString(36).substr(2, 9);
    this.activeLoaders.add(id);
    
    this.overlay.querySelector('.loading-overlay-text').textContent = text;
    this.overlay.querySelector('.loading-overlay-subtext').textContent = subtext;
    this.overlay.classList.add('active');
    
    return id;
  }

  // Hide global loading overlay
  hide(id) {
    if (id) {
      this.activeLoaders.delete(id);
    }
    
    if (this.activeLoaders.size === 0) {
      this.overlay.classList.remove('active');
    }
  }

  // Hide all loaders
  hideAll() {
    this.activeLoaders.clear();
    this.overlay.classList.remove('active');
  }

  // Create inline spinner
  static createSpinner(size = 'default') {
    const spinner = document.createElement('div');
    spinner.className = `spinner ${size === 'large' ? 'spinner-lg' : size === 'small' ? 'spinner-sm' : ''}`;
    return spinner;
  }

  // Create skeleton screen
  static createSkeleton(type = 'text', options = {}) {
    const skeleton = document.createElement('div');
    
    switch(type) {
      case 'text':
        skeleton.className = `skeleton skeleton-text ${options.width || 'wide'}`;
        break;
        
      case 'card':
        skeleton.className = 'skeleton-card';
        skeleton.innerHTML = `
          <div class="skeleton-card-header">
            <div class="skeleton skeleton-avatar"></div>
            <div style="flex: 1;">
              <div class="skeleton skeleton-text medium"></div>
              <div class="skeleton skeleton-text short"></div>
            </div>
          </div>
          <div class="skeleton-card-content">
            <div class="skeleton skeleton-text wide"></div>
            <div class="skeleton skeleton-text wide"></div>
            <div class="skeleton skeleton-text medium"></div>
          </div>
        `;
        break;
        
      case 'table':
        const rows = options.rows || 5;
        skeleton.className = 'skeleton-table';
        for (let i = 0; i < rows; i++) {
          const row = document.createElement('div');
          row.className = 'skeleton-row';
          for (let j = 0; j < 4; j++) {
            const cell = document.createElement('div');
            cell.className = 'skeleton skeleton-cell';
            row.appendChild(cell);
          }
          skeleton.appendChild(row);
        }
        break;
        
      case 'chart':
        skeleton.className = 'skeleton-chart';
        skeleton.innerHTML = `
          <div class="skeleton-chart-bars">
            ${Array(5).fill().map(() => '<div class="skeleton skeleton-chart-bar"></div>').join('')}
          </div>
        `;
        break;
    }
    
    return skeleton;
  }

  // Create progress bar
  static createProgressBar(value = 0, options = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'progress-wrapper';
    
    const hasText = options.label || options.showPercentage;
    
    if (hasText) {
      const textDiv = document.createElement('div');
      textDiv.className = 'progress-text';
      
      if (options.label) {
        const label = document.createElement('span');
        label.className = 'progress-label';
        label.textContent = options.label;
        textDiv.appendChild(label);
      }
      
      if (options.showPercentage) {
        const percentage = document.createElement('span');
        percentage.className = 'progress-percentage';
        percentage.textContent = `${Math.round(value)}%`;
        textDiv.appendChild(percentage);
      }
      
      wrapper.appendChild(textDiv);
    }
    
    const bar = document.createElement('div');
    bar.className = `progress-bar ${options.size === 'large' ? 'progress-bar-lg' : options.size === 'small' ? 'progress-bar-sm' : ''}`;
    
    if (options.indeterminate) {
      bar.classList.add('indeterminate');
    }
    
    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    fill.style.width = `${value}%`;
    
    bar.appendChild(fill);
    wrapper.appendChild(bar);
    
    // Add update method
    wrapper.update = function(newValue, newLabel) {
      fill.style.width = `${newValue}%`;
      if (options.showPercentage) {
        wrapper.querySelector('.progress-percentage').textContent = `${Math.round(newValue)}%`;
      }
      if (newLabel && options.label) {
        wrapper.querySelector('.progress-label').textContent = newLabel;
      }
    };
    
    return wrapper;
  }

  // Create circular progress
  static createCircularProgress(value = 0, options = {}) {
    const size = options.size || 80;
    const strokeWidth = options.strokeWidth || 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'progress-circle';
    wrapper.style.width = `${size}px`;
    wrapper.style.height = `${size}px`;
    
    wrapper.innerHTML = `
      <svg class="progress-circle-svg" width="${size}" height="${size}">
        <circle
          class="progress-circle-bg"
          cx="${size / 2}"
          cy="${size / 2}"
          r="${radius}"
          stroke-width="${strokeWidth}"
        />
        <circle
          class="progress-circle-fill"
          cx="${size / 2}"
          cy="${size / 2}"
          r="${radius}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}"
        />
      </svg>
      <div class="progress-circle-text">${Math.round(value)}%</div>
    `;
    
    // Add update method
    wrapper.update = function(newValue) {
      const newOffset = circumference - (newValue / 100) * circumference;
      wrapper.querySelector('.progress-circle-fill').style.strokeDashoffset = newOffset;
      wrapper.querySelector('.progress-circle-text').textContent = `${Math.round(newValue)}%`;
    };
    
    return wrapper;
  }

  // Create workflow progress
  static createWorkflowProgress(stages, currentStage = 0, options = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'workflow-progress';
    
    const header = document.createElement('div');
    header.className = 'workflow-progress-header';
    
    const title = document.createElement('div');
    title.className = 'workflow-progress-title';
    title.textContent = options.title || 'Workflow Progress';
    
    const stageText = document.createElement('div');
    stageText.className = 'workflow-progress-stage';
    stageText.textContent = `Stage ${currentStage + 1} of ${stages.length}`;
    
    header.appendChild(title);
    header.appendChild(stageText);
    wrapper.appendChild(header);
    
    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'workflow-progress-steps';
    
    stages.forEach((stage, index) => {
      const step = document.createElement('div');
      step.className = 'workflow-step';
      
      if (index < currentStage) {
        step.classList.add('completed');
      } else if (index === currentStage) {
        step.classList.add('active');
      }
      
      stepsContainer.appendChild(step);
    });
    
    wrapper.appendChild(stepsContainer);
    
    if (options.showDetails) {
      const details = document.createElement('div');
      details.className = 'workflow-progress-details';
      details.textContent = stages[currentStage];
      wrapper.appendChild(details);
    }
    
    // Add update method
    wrapper.update = function(newStage) {
      currentStage = newStage;
      stageText.textContent = `Stage ${currentStage + 1} of ${stages.length}`;
      
      stepsContainer.querySelectorAll('.workflow-step').forEach((step, index) => {
        step.classList.remove('completed', 'active');
        if (index < currentStage) {
          step.classList.add('completed');
        } else if (index === currentStage) {
          step.classList.add('active');
        }
      });
      
      if (options.showDetails && wrapper.querySelector('.workflow-progress-details')) {
        wrapper.querySelector('.workflow-progress-details').textContent = stages[currentStage];
      }
    };
    
    return wrapper;
  }

  // Show inline loading in element
  static showInline(element, text = 'Loading...') {
    const loading = document.createElement('div');
    loading.className = 'loading-inline';
    loading.innerHTML = `
      <div class="spinner spinner-sm"></div>
      <span>${text}</span>
    `;
    
    element.innerHTML = '';
    element.appendChild(loading);
  }

  // Replace content with skeleton
  static showSkeleton(element, type = 'text', options = {}) {
    const skeleton = LoadingManager.createSkeleton(type, options);
    element.innerHTML = '';
    element.appendChild(skeleton);
  }

  // Add loading state to button
  static buttonLoading(button, loading = true) {
    if (loading) {
      button.classList.add('loading');
      button.disabled = true;
      button.dataset.originalText = button.textContent;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    }
  }

  // Lazy loading images
  static setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });
    
    images.forEach(img => observer.observe(img));
  }
}

// Export singleton instance
const loadingManager = new LoadingManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LoadingManager, loadingManager };
}
