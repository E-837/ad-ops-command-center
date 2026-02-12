/**
 * Workflow Registry
 * Categorized workflow system with metadata, triggers, and composition support
 */

const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class WorkflowRegistry {
  constructor() {
    this.workflows = new Map();
    this.categories = {
      'campaign-ops': {
        label: 'Campaign Operations',
        icon: '📊',
        description: 'Campaign launch, optimization, and management workflows',
        workflows: []
      },
      'reporting': {
        label: 'Reporting & Insights',
        icon: '📈',
        description: 'Analytics, reports, and performance monitoring',
        workflows: []
      },
      'projects': {
        label: 'Ad Ops Projects',
        icon: '📋',
        description: 'Project management and coordination workflows',
        workflows: []
      },
      'orchestration': {
        label: 'Multi-Channel Orchestration',
        icon: '🎯',
        description: 'Complex multi-workflow and cross-channel automation',
        workflows: []
      }
    };
  }

  /**
   * Register a workflow
   */
  register(workflowId, workflowModule) {
    // Validate workflow has required structure
    if (!workflowModule.run || typeof workflowModule.run !== 'function') {
      throw new Error(`Workflow ${workflowId} must have a run() function`);
    }

    // Get metadata (either from meta export or getInfo())
    const meta = workflowModule.meta || this._buildMetaFromGetInfo(workflowId, workflowModule);
    
    // Ensure workflow has required metadata
    if (!meta.name) {
      throw new Error(`Workflow ${workflowId} must have a name in metadata`);
    }

    if (!meta.category) {
      logger.warn('Workflow missing category, using default', { 
        workflowId, 
        defaultCategory: 'campaign-ops' 
      });
      meta.category = 'campaign-ops';
    }

    // Store workflow with its metadata
    this.workflows.set(workflowId, {
      id: workflowId,
      module: workflowModule,
      meta: meta
    });

    // Add to category
    if (this.categories[meta.category]) {
      if (!this.categories[meta.category].workflows.includes(workflowId)) {
        this.categories[meta.category].workflows.push(workflowId);
      }
    }

    return true;
  }

  /**
   * Build meta object from legacy getInfo() for backward compatibility
   */
  _buildMetaFromGetInfo(workflowId, workflowModule) {
    const info = workflowModule.getInfo ? workflowModule.getInfo() : {};
    
    return {
      id: workflowId,
      name: info.name || workflowId,
      description: info.description || '',
      category: 'campaign-ops', // default
      version: '1.0.0',
      triggers: {
        manual: true,
        scheduled: null,
        events: []
      },
      requiredConnectors: [],
      optionalConnectors: [],
      inputs: {},
      outputs: [],
      stages: info.stages || [],
      estimatedDuration: info.estimatedDuration || 'unknown',
      isOrchestrator: false,
      subWorkflows: []
    };
  }

  /**
   * Get a workflow by ID
   */
  getWorkflow(workflowId) {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Get workflow module for execution
   */
  getWorkflowModule(workflowId) {
    const workflow = this.workflows.get(workflowId);
    return workflow ? workflow.module : null;
  }

  /**
   * Get workflow metadata
   */
  getWorkflowMeta(workflowId) {
    const workflow = this.workflows.get(workflowId);
    return workflow ? workflow.meta : null;
  }

  /**
   * Get all workflows
   */
  getAllWorkflows() {
    return Array.from(this.workflows.values()).map(w => ({
      id: w.id,
      ...w.meta
    }));
  }

  /**
   * Get workflows by category
   */
  getByCategory(category) {
    if (!this.categories[category]) {
      return [];
    }

    return this.categories[category].workflows
      .map(id => this.workflows.get(id))
      .filter(w => w !== undefined)
      .map(w => ({
        id: w.id,
        ...w.meta
      }));
  }

  /**
   * Get workflows by trigger type
   */
  getByTriggerType(triggerType) {
    return Array.from(this.workflows.values())
      .filter(w => {
        if (triggerType === 'manual') {
          return w.meta.triggers?.manual === true;
        }
        if (triggerType === 'scheduled') {
          return w.meta.triggers?.scheduled !== null;
        }
        if (triggerType === 'event') {
          return w.meta.triggers?.events?.length > 0;
        }
        return false;
      })
      .map(w => ({
        id: w.id,
        ...w.meta
      }));
  }

  /**
   * Get workflows that trigger on a specific event
   */
  getByEventTrigger(eventType) {
    return Array.from(this.workflows.values())
      .filter(w => w.meta.triggers?.events?.includes(eventType))
      .map(w => ({
        id: w.id,
        ...w.meta
      }));
  }

  /**
   * Get workflows by required connector
   */
  getByConnector(connectorId) {
    return Array.from(this.workflows.values())
      .filter(w => w.meta.requiredConnectors?.includes(connectorId))
      .map(w => ({
        id: w.id,
        ...w.meta
      }));
  }

  /**
   * Get orchestrator workflows (workflows that compose other workflows)
   */
  getOrchestrators() {
    return Array.from(this.workflows.values())
      .filter(w => w.meta.isOrchestrator === true)
      .map(w => ({
        id: w.id,
        ...w.meta
      }));
  }

  /**
   * Get all categories
   */
  getCategories() {
    return Object.entries(this.categories).map(([id, cat]) => ({
      id,
      ...cat
    }));
  }

  /**
   * Get category info
   */
  getCategory(categoryId) {
    const cat = this.categories[categoryId];
    if (!cat) return null;

    return {
      id: categoryId,
      ...cat,
      workflows: cat.workflows.map(id => {
        const w = this.workflows.get(id);
        return w ? { id: w.id, ...w.meta } : null;
      }).filter(w => w !== null)
    };
  }

  /**
   * Check if workflow exists
   */
  has(workflowId) {
    return this.workflows.has(workflowId);
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const stats = {
      totalWorkflows: this.workflows.size,
      byCategory: {},
      byTriggerType: {
        manual: 0,
        scheduled: 0,
        event: 0
      },
      orchestrators: 0
    };

    // Count by category
    for (const [catId, cat] of Object.entries(this.categories)) {
      stats.byCategory[catId] = cat.workflows.length;
    }

    // Count by trigger types
    for (const workflow of this.workflows.values()) {
      if (workflow.meta.triggers?.manual) stats.byTriggerType.manual++;
      if (workflow.meta.triggers?.scheduled) stats.byTriggerType.scheduled++;
      if (workflow.meta.triggers?.events?.length > 0) stats.byTriggerType.event++;
      if (workflow.meta.isOrchestrator) stats.orchestrators++;
    }

    return stats;
  }
}

// Singleton instance
const registry = new WorkflowRegistry();

module.exports = registry;
