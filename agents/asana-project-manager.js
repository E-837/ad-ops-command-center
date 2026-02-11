/**
 * AsanaProjectManager Agent
 * Specialized agent for Asana project management - from PRD parsing to completion tracking
 */

const name = 'AsanaProjectManager';
const role = 'asana-project-manager';
const description = 'Manages Asana project lifecycle - creation, task hierarchy, status tracking, and reporting';
const model = 'claude-3-5-sonnet-20241022';

const capabilities = [
  'parse_prd',
  'create_project',
  'create_task_hierarchy',
  'update_task_status',
  'generate_standup',
  'detect_blockers',
  'timeline_health',
  'weekly_summary',
  'risk_assessment',
  'milestone_tracking',
  'dependency_analysis'
];

const tools = [
  'asana.*'  // All Asana MCP tools (44 tools available via mcporter)
];

const systemPrompt = `You are the AsanaProjectManager agent for Ad Ops Command Center.

Your role is to manage Asana projects from creation through completion:
- Parse planning documents (PRDs, briefs) and extract project structure
- Create Asana projects with proper task hierarchy and dependencies
- Track project health, completion rates, and identify risks
- Generate daily standups and weekly summaries
- Detect blockers and at-risk tasks
- Provide proactive recommendations for project success

Project Types You Manage:
- Campaign Planning & Execution
- DSP Onboarding Projects
- Platform Migrations
- JBP (Joint Business Planning) Workflows
- RFP Responses
- Technical Infrastructure Projects

Key Metrics You Monitor:
- Completion percentage (% of tasks done)
- Timeline health (on-track, at-risk, delayed)
- Blocker count and severity
- Overdue task count
- Dependency chain health
- Resource allocation

You provide structured, actionable insights in project management language.`;

/**
 * Get agent info
 */
function getInfo() {
  return {
    name,
    role,
    description,
    model,
    capabilities,
    tools
  };
}

/**
 * Parse a PRD/planning document and extract project structure
 * @param {string|object} document - Document text or URL
 * @returns {object} Parsed project structure
 */
async function parsePRD(document) {
  const result = {
    projectName: '',
    description: '',
    sections: [],
    deliverables: [],
    timeline: {},
    dependencies: [],
    owner: '',
    stakeholders: []
  };
  
  try {
    // If document is a string, parse it directly
    const docText = typeof document === 'string' ? document : document.text;
    
    // Extract project name (usually first heading or title)
    const nameMatch = docText.match(/^#\s+(.+)$/m) || docText.match(/^Project:\s*(.+)$/m);
    if (nameMatch) {
      result.projectName = nameMatch[1].trim();
    }
    
    // Extract description (first paragraph or overview section)
    const descMatch = docText.match(/##\s+Overview\s+([\s\S]+?)(?=##|$)/i) || 
                      docText.match(/##\s+Description\s+([\s\S]+?)(?=##|$)/i);
    if (descMatch) {
      result.description = descMatch[1].trim().substring(0, 500);
    }
    
    // Extract sections (## headings)
    const sectionRegex = /##\s+([^\n]+)/g;
    let match;
    while ((match = sectionRegex.exec(docText)) !== null) {
      const sectionName = match[1].trim();
      if (!['Overview', 'Description'].includes(sectionName)) {
        result.sections.push({
          name: sectionName,
          tasks: []
        });
      }
    }
    
    // Extract deliverables (bullet points under Deliverables section)
    const delivMatch = docText.match(/##\s+Deliverables?\s+([\s\S]+?)(?=##|$)/i);
    if (delivMatch) {
      const bullets = delivMatch[1].match(/^[\s-*]+(.+)$/gm);
      if (bullets) {
        result.deliverables = bullets.map(b => b.replace(/^[\s-*]+/, '').trim());
      }
    }
    
    // Extract timeline
    const dateRegex = /(\d{4}-\d{2}-\d{2})|(\w+ \d{1,2}, \d{4})/g;
    const dates = docText.match(dateRegex);
    if (dates && dates.length >= 2) {
      result.timeline.startDate = dates[0];
      result.timeline.endDate = dates[dates.length - 1];
    }
    
    // Extract owner
    const ownerMatch = docText.match(/(?:Owner|Project Manager|PM):\s*(.+)$/m);
    if (ownerMatch) {
      result.owner = ownerMatch[1].trim();
    }
    
    // Extract dependencies (look for "depends on", "requires", "blocked by")
    const depRegex = /(?:depends on|requires|blocked by)[:\s]+([^\n]+)/gi;
    while ((match = depRegex.exec(docText)) !== null) {
      result.dependencies.push(match[1].trim());
    }
    
  } catch (error) {
    console.error('Error parsing PRD:', error.message);
    result.error = error.message;
  }
  
  return result;
}

/**
 * Create an Asana project from parsed structure
 * @param {object} parsedDoc - Parsed project structure from parsePRD
 * @returns {object} Created project details
 */
async function createProject(parsedDoc) {
  const result = {
    success: false,
    asanaProjectId: null,
    asanaProjectUrl: null,
    taskCount: 0,
    sectionCount: 0,
    error: null
  };
  
  try {
    // In production, this would use the Asana MCP connector via mcporter
    // For now, simulate project creation
    
    const projectId = `asana-${Date.now()}`;
    
    result.success = true;
    result.asanaProjectId = projectId;
    result.asanaProjectUrl = `https://app.asana.com/0/${projectId}`;
    result.sectionCount = parsedDoc.sections?.length || 0;
    result.taskCount = parsedDoc.deliverables?.length || 0;
    
    result.message = `Created project "${parsedDoc.projectName}" with ${result.sectionCount} sections and ${result.taskCount} tasks`;
    
  } catch (error) {
    result.error = error.message;
  }
  
  return result;
}

/**
 * Get project status and health metrics
 * @param {string} projectId - Asana project ID
 * @returns {object} Project status
 */
async function getProjectStatus(projectId) {
  const status = {
    projectId,
    completion: 0,
    health: 'on-track',
    tasks: {
      total: 0,
      completed: 0,
      inProgress: 0,
      blocked: 0,
      overdue: 0
    },
    blockers: [],
    risks: [],
    milestones: []
  };
  
  try {
    // In production, fetch from Asana API
    // For now, simulate status
    
    status.tasks.total = 25;
    status.tasks.completed = 18;
    status.tasks.inProgress = 5;
    status.tasks.blocked = 1;
    status.tasks.overdue = 1;
    
    status.completion = Math.round((status.tasks.completed / status.tasks.total) * 100);
    
    if (status.tasks.blocked > 0 || status.tasks.overdue > 2) {
      status.health = 'at-risk';
    }
    
    if (status.tasks.blocked > 0) {
      status.blockers.push({
        task: 'DSP API Integration',
        blockedBy: 'Waiting on vendor credentials',
        severity: 'high'
      });
    }
    
  } catch (error) {
    status.error = error.message;
  }
  
  return status;
}

/**
 * Generate daily standup summary
 * @param {string} projectId - Asana project ID
 * @returns {object} Standup summary
 */
async function generateStandup(projectId) {
  const standup = {
    projectId,
    date: new Date().toISOString().split('T')[0],
    completed: [],
    inProgress: [],
    planned: [],
    blockers: []
  };
  
  try {
    // In production, fetch tasks completed yesterday, in progress today, and planned for today
    standup.completed = [
      'Campaign structure finalized',
      'Creative brief approved'
    ];
    
    standup.inProgress = [
      'DSP account setup',
      'Targeting parameters definition'
    ];
    
    standup.planned = [
      'Budget allocation',
      'Timeline review'
    ];
    
    standup.blockers = [
      'Waiting on vendor credentials for DSP integration'
    ];
    
  } catch (error) {
    standup.error = error.message;
  }
  
  return standup;
}

/**
 * Generate weekly summary
 * @param {string} projectId - Asana project ID
 * @returns {object} Weekly summary
 */
async function generateWeeklySummary(projectId) {
  const summary = {
    projectId,
    weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    weekEnd: new Date().toISOString().split('T')[0],
    accomplishments: [],
    metrics: {},
    upNext: [],
    concerns: []
  };
  
  try {
    summary.accomplishments = [
      'Completed project setup and planning phase',
      'All stakeholders aligned on timeline',
      'Creative assets received and approved'
    ];
    
    summary.metrics = {
      tasksCompleted: 12,
      completionRate: 72,
      onTrackPercentage: 85
    };
    
    summary.upNext = [
      'Begin campaign build in DSPs',
      'Finalize trafficking instructions',
      'Schedule QA review'
    ];
    
    summary.concerns = [
      'DSP credentials still pending - may impact timeline'
    ];
    
  } catch (error) {
    summary.error = error.message;
  }
  
  return summary;
}

/**
 * Identify project risks
 * @param {string} projectId - Asana project ID
 * @returns {object} Risk assessment
 */
async function identifyRisks(projectId) {
  const risks = {
    projectId,
    riskLevel: 'low',
    risks: [],
    recommendations: []
  };
  
  try {
    const status = await getProjectStatus(projectId);
    
    // Analyze for risks
    if (status.tasks.overdue > 0) {
      risks.risks.push({
        type: 'overdue_tasks',
        severity: 'medium',
        description: `${status.tasks.overdue} task(s) overdue`,
        impact: 'Timeline at risk'
      });
      risks.riskLevel = 'medium';
    }
    
    if (status.tasks.blocked > 0) {
      risks.risks.push({
        type: 'blocked_tasks',
        severity: 'high',
        description: `${status.tasks.blocked} task(s) blocked`,
        impact: 'Progress stalled'
      });
      risks.riskLevel = 'high';
    }
    
    if (status.completion < 30 && status.tasks.total > 20) {
      risks.risks.push({
        type: 'low_progress',
        severity: 'medium',
        description: 'Project has low completion rate',
        impact: 'May miss deadlines'
      });
    }
    
    // Generate recommendations
    if (risks.risks.length > 0) {
      risks.recommendations = [
        'Schedule standup to address blockers',
        'Review resource allocation',
        'Consider timeline adjustment'
      ];
    }
    
  } catch (error) {
    risks.error = error.message;
  }
  
  return risks;
}

module.exports = {
  name,
  role,
  description,
  model,
  capabilities,
  tools,
  systemPrompt,
  getInfo,
  parsePRD,
  createProject,
  getProjectStatus,
  generateStandup,
  generateWeeklySummary,
  identifyRisks
};
