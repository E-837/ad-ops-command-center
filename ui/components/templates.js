// templates.js - Workflow template system

class TemplateManager {
  constructor() {
    this.templates = [];
    this.init();
  }

  async init() {
    await this.loadTemplates();
  }

  // Load all templates
  async loadTemplates() {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        this.templates = await response.json();
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  // Get all templates
  getTemplates() {
    return this.templates;
  }

  // Get template by ID
  getTemplate(id) {
    return this.templates.find(t => t.id === id);
  }

  // Get templates by category
  getTemplatesByCategory(category) {
    return this.templates.filter(t => t.category === category);
  }

  // Render template cards
  renderTemplateCards(container, options = {}) {
    const templates = options.category
      ? this.getTemplatesByCategory(options.category)
      : this.templates;

    if (templates.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.5);">
          No templates found
        </div>
      `;
      return;
    }

    container.innerHTML = templates.map(template => this.createTemplateCard(template)).join('');

    // Add event listeners
    container.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        this.showTemplateModal(card.dataset.templateId);
      });
    });
  }

  // Create template card HTML
  createTemplateCard(template) {
    return `
      <div class="template-card" data-template-id="${template.id}" style="
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
      ">
        <div style="font-size: 40px; margin-bottom: 12px;">${template.icon}</div>
        <h3 style="color: #fff; font-size: 18px; margin-bottom: 8px;">${template.name}</h3>
        <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; margin-bottom: 16px; line-height: 1.5;">
          ${template.description}
        </p>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <span style="
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #60a5fa;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
          ">${this.getCategoryLabel(template.category)}</span>
          ${template.presets ? `
            <span style="
              background: rgba(16, 185, 129, 0.2);
              border: 1px solid rgba(16, 185, 129, 0.3);
              color: #6ee7b7;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 12px;
            ">${template.presets.length} presets</span>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Get category label
  getCategoryLabel(category) {
    const labels = {
      'campaign-ops': 'Campaign Ops',
      'analytics': 'Analytics',
      'productivity': 'Productivity',
      'cross-platform': 'Cross-Platform'
    };
    return labels[category] || category;
  }

  // Show template modal
  showTemplateModal(templateId) {
    const template = this.getTemplate(templateId);
    if (!template) return;

    const modal = document.createElement('div');
    modal.className = 'template-modal';
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
      <div class="template-modal-content" style="
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        background: rgba(17, 24, 39, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
      ">
        <div style="padding: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <div style="font-size: 48px; margin-bottom: 12px;">${template.icon}</div>
              <h2 style="color: #fff; font-size: 24px; margin-bottom: 8px;">${template.name}</h2>
              <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px;">${template.description}</p>
            </div>
            <button class="close-modal" style="
              background: none;
              border: none;
              color: rgba(255, 255, 255, 0.6);
              font-size: 24px;
              cursor: pointer;
              padding: 0;
              width: 32px;
              height: 32px;
            ">&times;</button>
          </div>
        </div>

        <div style="flex: 1; overflow-y: auto; padding: 24px;">
          ${template.presets && template.presets.length > 0 ? `
            <div style="margin-bottom: 24px;">
              <label style="
                display: block;
                color: #fff;
                font-weight: 500;
                margin-bottom: 8px;
              ">Quick Start Preset</label>
              <select class="preset-select" style="
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 12px;
                color: #fff;
                font-size: 14px;
              ">
                <option value="">Custom configuration</option>
                ${template.presets.map(preset => `
                  <option value="${preset.name}">${preset.name}</option>
                `).join('')}
              </select>
            </div>
          ` : ''}

          <form class="template-form">
            ${this.renderTemplateFields(template)}
          </form>
        </div>

        <div style="
          padding: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 12px;
        ">
          <button type="button" class="cancel-btn" style="
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s ease;
          ">Cancel</button>
          <button type="submit" class="run-btn" style="
            flex: 2;
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.4);
            color: #fff;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.2s ease;
          ">Run Workflow</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Preset selection
    const presetSelect = modal.querySelector('.preset-select');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        this.applyPreset(template, e.target.value, modal);
      });
    }

    // Form submission
    modal.querySelector('.template-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.runTemplate(template, modal);
    });
  }

  // Render template fields
  renderTemplateFields(template) {
    return template.fields.map(field => {
      const id = `field-${field.name}`;
      let input = '';

      switch (field.type) {
        case 'text':
        case 'email':
        case 'url':
          input = `
            <input
              type="${field.type}"
              id="${id}"
              name="${field.name}"
              ${field.required ? 'required' : ''}
              ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
              ${field.default ? `value="${field.default}"` : ''}
              style="
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 12px;
                color: #fff;
                font-size: 14px;
              "
            />
          `;
          break;

        case 'number':
          input = `
            <input
              type="number"
              id="${id}"
              name="${field.name}"
              ${field.required ? 'required' : ''}
              ${field.min !== undefined ? `min="${field.min}"` : ''}
              ${field.max !== undefined ? `max="${field.max}"` : ''}
              ${field.default !== undefined ? `value="${field.default}"` : ''}
              style="
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 12px;
                color: #fff;
                font-size: 14px;
              "
            />
          `;
          break;

        case 'select':
          input = `
            <select
              id="${id}"
              name="${field.name}"
              ${field.required ? 'required' : ''}
              style="
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 12px;
                color: #fff;
                font-size: 14px;
              "
            >
              ${field.options.map(opt => `
                <option value="${opt.value}" ${opt.value === field.default ? 'selected' : ''}>
                  ${opt.label}
                </option>
              `).join('')}
            </select>
          `;
          break;

        case 'textarea':
          input = `
            <textarea
              id="${id}"
              name="${field.name}"
              ${field.required ? 'required' : ''}
              ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
              rows="4"
              style="
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 12px;
                color: #fff;
                font-size: 14px;
                resize: vertical;
              "
            >${field.default || ''}</textarea>
          `;
          break;

        case 'checkbox':
          input = `
            <input
              type="checkbox"
              id="${id}"
              name="${field.name}"
              ${field.default ? 'checked' : ''}
              style="
                width: 20px;
                height: 20px;
                cursor: pointer;
              "
            />
          `;
          break;
      }

      return `
        <div class="form-group" style="margin-bottom: 20px;">
          <label for="${id}" style="
            display: block;
            color: #fff;
            font-weight: 500;
            margin-bottom: 8px;
          ">
            ${field.label}
            ${field.required ? '<span style="color: #ef4444;">*</span>' : ''}
          </label>
          ${input}
          ${field.help ? `
            <div style="
              color: rgba(255, 255, 255, 0.5);
              font-size: 12px;
              margin-top: 4px;
            ">${field.help}</div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  // Apply preset values
  applyPreset(template, presetName, modal) {
    const preset = template.presets.find(p => p.name === presetName);
    if (!preset) {
      // Reset to defaults
      template.fields.forEach(field => {
        const input = modal.querySelector(`[name="${field.name}"]`);
        if (input && field.default !== undefined) {
          input.value = field.default;
        }
      });
      return;
    }

    // Apply preset values
    Object.entries(preset.values).forEach(([name, value]) => {
      const input = modal.querySelector(`[name="${name}"]`);
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = value;
        } else {
          input.value = value;
        }
      }
    });
  }

  // Run template
  async runTemplate(template, modal) {
    const form = modal.querySelector('.template-form');
    const formData = new FormData(form);
    const values = {};

    for (const [key, value] of formData.entries()) {
      const field = template.fields.find(f => f.name === key);
      if (field) {
        if (field.type === 'number') {
          values[key] = parseFloat(value);
        } else if (field.type === 'checkbox') {
          values[key] = form.querySelector(`[name="${key}"]`).checked;
        } else {
          values[key] = value;
        }
      }
    }

    // Validate
    try {
      this.validateTemplate(template, values);
    } catch (error) {
      errorManager.error(error.message);
      return;
    }

    // Show loading
    const runBtn = modal.querySelector('.run-btn');
    runBtn.textContent = 'Running...';
    runBtn.disabled = true;

    try {
      const response = await fetch(`/api/templates/${template.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values })
      });

      if (!response.ok) {
        throw new Error('Failed to run template');
      }

      const result = await response.json();
      
      errorManager.success('Workflow started successfully!');
      modal.remove();

      // Redirect to workflow detail
      if (result.executionId) {
        window.location.href = `/workflow-detail.html?id=${result.executionId}`;
      }
    } catch (error) {
      console.error('Template execution error:', error);
      errorManager.error(error.message || 'Failed to run workflow');
      runBtn.textContent = 'Run Workflow';
      runBtn.disabled = false;
    }
  }

  // Validate template values
  validateTemplate(template, values) {
    for (const field of template.fields) {
      if (field.required && !values[field.name]) {
        throw new Error(`${field.label} is required`);
      }

      if (field.type === 'number' && values[field.name] !== undefined) {
        const num = values[field.name];
        if (field.min !== undefined && num < field.min) {
          throw new Error(`${field.label} must be at least ${field.min}`);
        }
        if (field.max !== undefined && num > field.max) {
          throw new Error(`${field.label} must be at most ${field.max}`);
        }
      }

      if (field.type === 'email' && values[field.name]) {
        if (!values[field.name].match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          throw new Error(`${field.label} must be a valid email`);
        }
      }

      if (field.type === 'url' && values[field.name]) {
        if (!values[field.name].match(/^https?:\/\/.+/)) {
          throw new Error(`${field.label} must be a valid URL`);
        }
      }
    }
  }

  // Create template from execution
  async saveAsTemplate(execution, metadata) {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: metadata.name,
          description: metadata.description,
          icon: metadata.icon || '⚡',
          category: metadata.category || 'custom',
          workflow: execution.workflowId,
          fields: metadata.fields,
          defaults: execution.input
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      const template = await response.json();
      this.templates.push(template);
      errorManager.success('Template created successfully!');
      return template;
    } catch (error) {
      console.error('Create template error:', error);
      errorManager.error(error.message || 'Failed to create template');
      throw error;
    }
  }
}

// Export singleton instance
const templateManager = new TemplateManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TemplateManager, templateManager };
}
