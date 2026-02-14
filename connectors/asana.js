/**
 * Asana Connector
 * Integration with Asana MCP for task and project management
 * 
 * Official 1st-party MCP: https://mcp.asana.com/v2/mcp
 * 
 * Ad Ops Use Cases:
 * - Campaign briefs as tasks
 * - Creative approval workflows
 * - Pacing alert tasks
 * - Team workload management
 */

const mcpBridge = require('./mcp-bridge');

const name = 'Asana';
const shortName = 'Asana';
const version = '1.0.0';
let status = 'ready';
let lastSync = null;

// Lazy-check MCP availability to avoid blocking startup on mcporter list
// Cache for 60 seconds to match mcp-bridge cache TTL
let useMCP;
let lastCheck = 0;
const CHECK_INTERVAL = 60000; // 60 seconds

function isMCPAvailable() {
  const now = Date.now();
  
  // Re-check if cache expired or never checked
  if (typeof useMCP !== 'boolean' || (now - lastCheck) > CHECK_INTERVAL) {
    useMCP = mcpBridge.asana.isAvailable();
    lastCheck = now;
  }
  
  return useMCP;
}

// OAuth placeholder - connected via MCP if available
const oauth = {
  provider: 'asana',
  scopes: ['default'],
  mcpEndpoint: 'https://mcp.asana.com/v2/mcp',
  connected: false,
  accessToken: null
};

// Tool definitions for MCP integration
const tools = [
  {
    name: 'asana_list_tasks',
    description: 'List tasks with optional filters by project, assignee, due date, or status',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Filter by project GID' },
        assignee: { type: 'string', description: 'Filter by assignee (email or GID)' },
        due_on: { type: 'string', description: 'Filter by due date (YYYY-MM-DD)' },
        completed: { type: 'boolean', description: 'Filter by completion status' },
        section_id: { type: 'string', description: 'Filter by section GID' }
      }
    }
  },
  {
    name: 'asana_get_task',
    description: 'Get detailed information about a specific task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task GID' }
      },
      required: ['task_id']
    }
  },
  {
    name: 'asana_create_task',
    description: 'Create a new task with name, project, assignee, due date, and notes',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Task name' },
        project_id: { type: 'string', description: 'Project GID to add task to' },
        assignee: { type: 'string', description: 'Assignee email or GID' },
        due_on: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
        notes: { type: 'string', description: 'Task description/notes (supports rich text)' },
        section_id: { type: 'string', description: 'Section GID to add task to' }
      },
      required: ['name']
    }
  },
  {
    name: 'asana_update_task',
    description: 'Update an existing task (status, assignee, due date, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task GID' },
        name: { type: 'string', description: 'New task name' },
        assignee: { type: 'string', description: 'New assignee' },
        due_on: { type: 'string', description: 'New due date' },
        completed: { type: 'boolean', description: 'Mark as complete/incomplete' },
        notes: { type: 'string', description: 'Updated notes' }
      },
      required: ['task_id']
    }
  },
  {
    name: 'asana_list_projects',
    description: 'List all projects in a workspace',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: { type: 'string', description: 'Workspace GID' },
        archived: { type: 'boolean', description: 'Include archived projects' }
      }
    }
  },
  {
    name: 'asana_get_project',
    description: 'Get project details including sections',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project GID' }
      },
      required: ['project_id']
    }
  },
  {
    name: 'asana_add_comment',
    description: 'Add a comment to a task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task GID' },
        text: { type: 'string', description: 'Comment text (supports @mentions)' }
      },
      required: ['task_id', 'text']
    }
  }
];

// Mock data simulating real Asana workspace
const MOCK_WORKSPACE = {
  gid: 'ws-12345678',
  name: 'Samsung Ad Ops',
  email_domains: ['samsung.com']
};

const MOCK_PROJECTS = [
  {
    gid: 'proj-001',
    name: 'Q1 2026 Campaign Launches',
    workspace: MOCK_WORKSPACE.gid,
    owner: { gid: 'user-001', name: 'Sarah Chen', email: 'sarah.chen@samsung.com' },
    color: 'light-blue',
    archived: false,
    created_at: '2025-12-01T10:00:00Z',
    sections: [
      { gid: 'sec-001', name: 'Briefing' },
      { gid: 'sec-002', name: 'Creative Development' },
      { gid: 'sec-003', name: 'Media Setup' },
      { gid: 'sec-004', name: 'QA & Launch' },
      { gid: 'sec-005', name: 'Live Monitoring' },
      { gid: 'sec-006', name: 'Completed' }
    ]
  },
  {
    gid: 'proj-002',
    name: 'Galaxy S25 Launch Campaign',
    workspace: MOCK_WORKSPACE.gid,
    owner: { gid: 'user-002', name: 'Mike Rodriguez', email: 'mike.r@samsung.com' },
    color: 'dark-purple',
    archived: false,
    created_at: '2026-01-05T09:00:00Z',
    sections: [
      { gid: 'sec-010', name: 'Pre-Launch' },
      { gid: 'sec-011', name: 'Launch Week' },
      { gid: 'sec-012', name: 'Sustain' }
    ]
  },
  {
    gid: 'proj-003',
    name: 'Pacing Alerts & Issues',
    workspace: MOCK_WORKSPACE.gid,
    owner: { gid: 'user-003', name: 'Ad Ops Bot', email: 'adops-bot@samsung.com' },
    color: 'red',
    archived: false,
    created_at: '2026-01-01T00:00:00Z',
    sections: [
      { gid: 'sec-020', name: 'New Alerts' },
      { gid: 'sec-021', name: 'In Progress' },
      { gid: 'sec-022', name: 'Resolved' }
    ]
  },
  {
    gid: 'proj-004',
    name: 'Creative Approval Queue',
    workspace: MOCK_WORKSPACE.gid,
    owner: { gid: 'user-001', name: 'Sarah Chen', email: 'sarah.chen@samsung.com' },
    color: 'yellow-orange',
    archived: false,
    created_at: '2026-01-01T00:00:00Z',
    sections: [
      { gid: 'sec-030', name: 'Pending Review' },
      { gid: 'sec-031', name: 'In Review' },
      { gid: 'sec-032', name: 'Revisions Needed' },
      { gid: 'sec-033', name: 'Approved' },
      { gid: 'sec-034', name: 'Rejected' }
    ]
  }
];

const MOCK_TASKS = [
  {
    gid: 'task-001',
    name: 'Galaxy S25 CTV Brief - Awareness',
    notes: 'Launch awareness campaign for Galaxy S25 across CTV platforms.\n\n**Objective:** Drive awareness for S25 launch\n**Budget:** $150,000\n**Flight:** Jan 15 - Feb 28, 2026\n**Target:** Tech enthusiasts, 25-54\n**KPIs:** Reach, VCR, Brand Lift',
    completed: false,
    due_on: '2026-01-10',
    created_at: '2026-01-03T10:00:00Z',
    modified_at: '2026-01-06T14:30:00Z',
    assignee: { gid: 'user-002', name: 'Mike Rodriguez', email: 'mike.r@samsung.com' },
    projects: [{ gid: 'proj-002', name: 'Galaxy S25 Launch Campaign' }],
    memberships: [{ project: { gid: 'proj-002' }, section: { gid: 'sec-010', name: 'Pre-Launch' } }],
    tags: [{ gid: 'tag-001', name: 'CTV' }, { gid: 'tag-002', name: 'Awareness' }],
    custom_fields: [
      { gid: 'cf-001', name: 'DSP', display_value: 'TTD, DV360' },
      { gid: 'cf-002', name: 'Priority', display_value: 'High' }
    ],
    num_subtasks: 5
  },
  {
    gid: 'task-002',
    name: 'Review S25 15s Pre-roll Creative',
    notes: 'Review and approve the 15-second pre-roll creative for S25 campaign.\n\nCreative specs:\n- 1920x1080 MP4\n- 15 seconds\n- Audio required\n\nFigma link: https://figma.com/file/xxx',
    completed: false,
    due_on: '2026-01-08',
    created_at: '2026-01-05T11:00:00Z',
    modified_at: '2026-01-06T09:15:00Z',
    assignee: { gid: 'user-001', name: 'Sarah Chen', email: 'sarah.chen@samsung.com' },
    projects: [{ gid: 'proj-004', name: 'Creative Approval Queue' }],
    memberships: [{ project: { gid: 'proj-004' }, section: { gid: 'sec-031', name: 'In Review' } }],
    tags: [{ gid: 'tag-003', name: 'Video' }, { gid: 'tag-004', name: 'S25' }],
    custom_fields: [
      { gid: 'cf-003', name: 'Creative Type', display_value: 'Video - Pre-roll' },
      { gid: 'cf-004', name: 'Review Status', display_value: 'In Review' }
    ],
    num_subtasks: 0
  },
  {
    gid: 'task-003',
    name: 'PACING ALERT: TTD CTV Campaign Behind 15%',
    notes: '**Automated Alert**\n\nCampaign: Galaxy S25 Launch - Awareness (ttd-camp-001)\nPacing Status: BEHIND by 15%\nExpected Spend: $78,750\nActual Spend: $67,500\nGap: $11,250\n\nRecommended Actions:\n1. Increase bid by 10-15%\n2. Expand targeting\n3. Review frequency caps',
    completed: false,
    due_on: '2026-02-06',
    created_at: '2026-02-06T08:00:00Z',
    modified_at: '2026-02-06T08:00:00Z',
    assignee: { gid: 'user-002', name: 'Mike Rodriguez', email: 'mike.r@samsung.com' },
    projects: [{ gid: 'proj-003', name: 'Pacing Alerts & Issues' }],
    memberships: [{ project: { gid: 'proj-003' }, section: { gid: 'sec-020', name: 'New Alerts' } }],
    tags: [{ gid: 'tag-005', name: 'Pacing' }, { gid: 'tag-006', name: 'Urgent' }],
    custom_fields: [
      { gid: 'cf-005', name: 'Alert Severity', display_value: 'High' },
      { gid: 'cf-006', name: 'Campaign ID', display_value: 'ttd-camp-001' }
    ],
    num_subtasks: 0
  },
  {
    gid: 'task-004',
    name: 'Setup DV360 line items for Galaxy Watch 7',
    notes: 'Create and configure DV360 line items for Galaxy Watch 7 consideration campaign.\n\nSpecs:\n- Budget: $75,000\n- Flight: Jan 20 - Mar 15\n- Channel: OLV\n- Targeting: Fitness enthusiasts, wearable intenders',
    completed: false,
    due_on: '2026-01-18',
    created_at: '2026-01-10T14:00:00Z',
    modified_at: '2026-01-15T11:30:00Z',
    assignee: { gid: 'user-004', name: 'Jennifer Park', email: 'jen.park@samsung.com' },
    projects: [{ gid: 'proj-001', name: 'Q1 2026 Campaign Launches' }],
    memberships: [{ project: { gid: 'proj-001' }, section: { gid: 'sec-003', name: 'Media Setup' } }],
    tags: [{ gid: 'tag-007', name: 'DV360' }, { gid: 'tag-008', name: 'Wearables' }],
    custom_fields: [],
    num_subtasks: 3
  },
  {
    gid: 'task-005',
    name: 'Weekly Performance Report - W5 2026',
    notes: 'Generate and distribute weekly performance report for all active campaigns.\n\nInclude:\n- Spend vs. budget\n- Pacing status\n- Key metrics (CPM, CTR, VCR, CPA)\n- WoW comparison\n- Recommendations',
    completed: true,
    due_on: '2026-02-03',
    created_at: '2026-01-27T09:00:00Z',
    modified_at: '2026-02-03T16:45:00Z',
    completed_at: '2026-02-03T16:45:00Z',
    assignee: { gid: 'user-005', name: 'David Kim', email: 'david.kim@samsung.com' },
    projects: [{ gid: 'proj-001', name: 'Q1 2026 Campaign Launches' }],
    memberships: [{ project: { gid: 'proj-001' }, section: { gid: 'sec-006', name: 'Completed' } }],
    tags: [{ gid: 'tag-009', name: 'Reporting' }],
    custom_fields: [],
    num_subtasks: 0
  }
];

const MOCK_COMMENTS = {
  'task-002': [
    {
      gid: 'comment-001',
      created_at: '2026-01-06T09:15:00Z',
      text: 'Creative looks great! Just need to verify the end card CTA is clickable. @sarah.chen can you confirm?',
      author: { gid: 'user-002', name: 'Mike Rodriguez' }
    },
    {
      gid: 'comment-002',
      created_at: '2026-01-06T10:30:00Z',
      text: 'Confirmed - CTA is set up correctly. Moving to approved.',
      author: { gid: 'user-001', name: 'Sarah Chen' }
    }
  ],
  'task-003': [
    {
      gid: 'comment-003',
      created_at: '2026-02-06T08:30:00Z',
      text: 'Investigating. Will increase bids by 12% and expand to include additional networks.',
      author: { gid: 'user-002', name: 'Mike Rodriguez' }
    }
  ]
};

/**
 * Get connector info
 */
function getInfo() {
  return {
    name,
    shortName,
    version,
    status,
    lastSync,
    mcpEndpoint: oauth.mcpEndpoint,
    connected: isMCPAvailable(),
    features: ['Task Management', 'Projects', 'Sections', 'Comments', 'Custom Fields'],
    useCases: ['Campaign Briefs', 'Creative Approval', 'Pacing Alerts']
  };
}

/**
 * Handle tool calls - routes to appropriate function
 */
async function handleToolCall(toolName, params) {
  lastSync = new Date().toISOString();
  
  // Try MCP first (real Asana API via mcporter)
  if (isMCPAvailable()) {
    try {
      let result;
      switch (toolName) {
        case 'asana_create_task':
          result = await mcpBridge.asana.createTask(params);
          break;
        case 'asana_list_tasks':
        case 'asana_get_tasks':
          result = await mcpBridge.asana.getTasks(params);
          break;
        case 'asana_update_task':
          result = await mcpBridge.asana.updateTask(params);
          break;
        case 'asana_create_project':
          result = await mcpBridge.asana.createProject(params);
          break;
        default:
          // Fall through to mock for unsupported tools
          break;
      }
      
      if (result && result.success) {
        return { success: true, data: result.data, mode: 'mcp' };
      }
    } catch (err) {
      console.error(`[Asana] MCP error, falling back to mock: ${err.message}`);
    }
  }
  
  // Try API client second
  const apiClient = require('./api-client');
  
  if (apiClient.hasAsana) {
    try {
      return await handleRealApiCall(apiClient.asana, toolName, params);
    } catch (err) {
      console.error(`[Asana] Real API error, falling back to mock: ${err.message}`);
    }
  }
  
  // Mock fallback
  await simulateLatency();
  switch (toolName) {
    case 'asana_list_tasks':
      return listTasks(params);
    case 'asana_get_task':
      return getTask(params.task_id);
    case 'asana_create_task':
      return createTask(params);
    case 'asana_update_task':
      return updateTask(params);
    case 'asana_list_projects':
      return listProjects(params);
    case 'asana_get_project':
      return getProject(params.project_id);
    case 'asana_add_comment':
      return addComment(params.task_id, params.text);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function handleRealApiCall(api, toolName, params) {
  switch (toolName) {
    case 'asana_list_tasks':
      if (params.project_id) {
        return api.listTasks({ project_id: params.project_id });
      }
      // Need workspace ID for listing all tasks
      const workspaces = await api.listWorkspaces();
      const projects = await api.listProjects(workspaces[0].gid);
      return projects;
      
    case 'asana_get_task':
      return api.getTask(params.task_id);
      
    case 'asana_create_task':
      const workspaces2 = await api.listWorkspaces();
      return api.createTask({
        workspace: workspaces2[0].gid,
        name: params.name,
        notes: params.notes,
        due_on: params.due_on,
        projects: params.project_id ? [params.project_id] : undefined
      });
      
    case 'asana_update_task':
      return api.updateTask(params.task_id, {
        name: params.name,
        notes: params.notes,
        due_on: params.due_on,
        completed: params.completed
      });
      
    case 'asana_list_projects':
      const ws = await api.listWorkspaces();
      return api.listProjects(ws[0].gid);
      
    case 'asana_get_project':
      return api.getProject(params.project_id);
      
    case 'asana_add_comment':
      return api.addComment(params.task_id, params.text);
      
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * List tasks with filters
 */
function listTasks(filters = {}) {
  let tasks = [...MOCK_TASKS];
  
  if (filters.project_id) {
    tasks = tasks.filter(t => t.projects.some(p => p.gid === filters.project_id));
  }
  
  if (filters.assignee) {
    tasks = tasks.filter(t => 
      t.assignee?.email === filters.assignee || 
      t.assignee?.gid === filters.assignee
    );
  }
  
  if (filters.due_on) {
    tasks = tasks.filter(t => t.due_on === filters.due_on);
  }
  
  if (filters.completed !== undefined) {
    tasks = tasks.filter(t => t.completed === filters.completed);
  }
  
  if (filters.section_id) {
    tasks = tasks.filter(t => 
      t.memberships.some(m => m.section?.gid === filters.section_id)
    );
  }
  
  return {
    data: tasks.map(t => ({
      gid: t.gid,
      name: t.name,
      completed: t.completed,
      due_on: t.due_on,
      assignee: t.assignee,
      projects: t.projects
    }))
  };
}

/**
 * Get task details
 */
function getTask(taskId) {
  const task = MOCK_TASKS.find(t => t.gid === taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }
  
  return {
    data: {
      ...task,
      stories: MOCK_COMMENTS[taskId] || []
    }
  };
}

/**
 * Create new task
 */
function createTask(params) {
  const newTask = {
    gid: `task-${Date.now()}`,
    name: params.name,
    notes: params.notes || '',
    completed: false,
    due_on: params.due_on || null,
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
    assignee: params.assignee ? { gid: 'user-new', email: params.assignee } : null,
    projects: params.project_id ? [{ gid: params.project_id }] : [],
    memberships: params.section_id ? 
      [{ project: { gid: params.project_id }, section: { gid: params.section_id } }] : [],
    tags: [],
    custom_fields: [],
    num_subtasks: 0
  };
  
  MOCK_TASKS.push(newTask);
  
  return {
    data: newTask
  };
}

/**
 * Update existing task
 */
function updateTask(params) {
  const task = MOCK_TASKS.find(t => t.gid === params.task_id);
  if (!task) {
    throw new Error(`Task not found: ${params.task_id}`);
  }
  
  if (params.name) task.name = params.name;
  if (params.notes) task.notes = params.notes;
  if (params.due_on) task.due_on = params.due_on;
  if (params.completed !== undefined) {
    task.completed = params.completed;
    if (params.completed) {
      task.completed_at = new Date().toISOString();
    }
  }
  if (params.assignee) {
    task.assignee = { gid: 'user-updated', email: params.assignee };
  }
  
  task.modified_at = new Date().toISOString();
  
  return {
    data: task
  };
}

/**
 * List projects
 */
function listProjects(filters = {}) {
  let projects = [...MOCK_PROJECTS];
  
  if (filters.archived !== undefined) {
    projects = projects.filter(p => p.archived === filters.archived);
  }
  
  return {
    data: projects.map(p => ({
      gid: p.gid,
      name: p.name,
      owner: p.owner,
      color: p.color,
      archived: p.archived
    }))
  };
}

/**
 * Get project details with sections
 */
function getProject(projectId) {
  const project = MOCK_PROJECTS.find(p => p.gid === projectId);
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }
  
  // Get tasks in this project
  const projectTasks = MOCK_TASKS.filter(t => 
    t.projects.some(p => p.gid === projectId)
  );
  
  return {
    data: {
      ...project,
      task_count: projectTasks.length,
      incomplete_task_count: projectTasks.filter(t => !t.completed).length
    }
  };
}

/**
 * Add comment to task
 */
function addComment(taskId, text) {
  const task = MOCK_TASKS.find(t => t.gid === taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }
  
  const comment = {
    gid: `comment-${Date.now()}`,
    created_at: new Date().toISOString(),
    text,
    author: { gid: 'user-bot', name: 'Ad Ops Bot' }
  };
  
  if (!MOCK_COMMENTS[taskId]) {
    MOCK_COMMENTS[taskId] = [];
  }
  MOCK_COMMENTS[taskId].push(comment);
  
  return {
    data: comment
  };
}

// Helper
function simulateLatency() {
  return new Promise(resolve => setTimeout(resolve, 50));
}

module.exports = {
  name,
  shortName,
  version,
  status,
  lastSync,
  oauth,
  tools,
  getInfo,
  handleToolCall,
  listTasks,
  getTask,
  createTask,
  updateTask,
  listProjects,
  getProject,
  addComment
};
