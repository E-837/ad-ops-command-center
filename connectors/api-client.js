/**
 * API Client - Real API connections for productivity tools
 * Loads tokens from config/.env and provides live API access
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '..', 'config', '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim();
      }
    });
  }
  
  return env;
}

const env = loadEnv();

// Check if we have real tokens
const hasAsana = !!env.ASANA_PAT;
const hasNotion = !!env.NOTION_TOKEN;
const hasFigma = !!env.FIGMA_PAT;

/**
 * Asana API Client
 */
const asana = {
  connected: hasAsana,
  
  async request(endpoint, options = {}) {
    if (!hasAsana) throw new Error('Asana not configured');
    
    const url = `https://app.asana.com/api/1.0${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${env.ASANA_PAT}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Asana API error: ${res.status} - ${err}`);
    }
    
    return res.json();
  },
  
  async getMe() {
    return this.request('/users/me');
  },
  
  async listWorkspaces() {
    const me = await this.getMe();
    return me.data.workspaces;
  },
  
  async listProjects(workspaceId) {
    return this.request(`/workspaces/${workspaceId}/projects`);
  },
  
  async getProject(projectId) {
    return this.request(`/projects/${projectId}`);
  },
  
  async listTasks(params = {}) {
    const query = new URLSearchParams();
    if (params.project_id) query.set('project', params.project_id);
    if (params.assignee) query.set('assignee', params.assignee);
    if (params.completed !== undefined) query.set('completed_since', params.completed ? 'now' : '');
    
    const endpoint = params.project_id 
      ? `/projects/${params.project_id}/tasks?opt_fields=name,completed,due_on,assignee,notes`
      : `/tasks?${query.toString()}`;
    
    return this.request(endpoint);
  },
  
  async getTask(taskId) {
    return this.request(`/tasks/${taskId}?opt_fields=name,completed,due_on,assignee,notes,projects,tags,custom_fields`);
  },
  
  async createTask(data) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ data })
    });
  },
  
  async updateTask(taskId, data) {
    return this.request(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ data })
    });
  },
  
  async addComment(taskId, text) {
    return this.request(`/tasks/${taskId}/stories`, {
      method: 'POST',
      body: JSON.stringify({ data: { text } })
    });
  }
};

/**
 * Notion API Client
 */
const notion = {
  connected: hasNotion,
  
  async request(endpoint, options = {}) {
    if (!hasNotion) throw new Error('Notion not configured');
    
    const url = `https://api.notion.com/v1${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Notion API error: ${res.status} - ${err}`);
    }
    
    return res.json();
  },
  
  async getMe() {
    return this.request('/users/me');
  },
  
  async search(query, filter = {}) {
    return this.request('/search', {
      method: 'POST',
      body: JSON.stringify({ query, ...filter })
    });
  },
  
  async getPage(pageId) {
    return this.request(`/pages/${pageId}`);
  },
  
  async createPage(data) {
    return this.request('/pages', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  async updatePage(pageId, properties) {
    return this.request(`/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties })
    });
  },
  
  async queryDatabase(databaseId, filter = {}, sorts = []) {
    return this.request(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({ filter, sorts })
    });
  },
  
  async getBlock(blockId) {
    return this.request(`/blocks/${blockId}`);
  },
  
  async appendBlock(blockId, children) {
    return this.request(`/blocks/${blockId}/children`, {
      method: 'PATCH',
      body: JSON.stringify({ children })
    });
  }
};

/**
 * Figma API Client
 */
const figma = {
  connected: hasFigma,
  
  async request(endpoint, options = {}) {
    if (!hasFigma) throw new Error('Figma not configured');
    
    const url = `https://api.figma.com/v1${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'X-Figma-Token': env.FIGMA_PAT,
        ...options.headers
      }
    });
    
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Figma API error: ${res.status} - ${err}`);
    }
    
    return res.json();
  },
  
  async getMe() {
    return this.request('/me');
  },
  
  async getFile(fileKey) {
    return this.request(`/files/${fileKey}`);
  },
  
  async getFileNodes(fileKey, nodeIds) {
    const ids = Array.isArray(nodeIds) ? nodeIds.join(',') : nodeIds;
    return this.request(`/files/${fileKey}/nodes?ids=${ids}`);
  },
  
  async getImages(fileKey, nodeIds, format = 'png', scale = 1) {
    const ids = Array.isArray(nodeIds) ? nodeIds.join(',') : nodeIds;
    return this.request(`/images/${fileKey}?ids=${ids}&format=${format}&scale=${scale}`);
  },
  
  async getComments(fileKey) {
    return this.request(`/files/${fileKey}/comments`);
  },
  
  async postComment(fileKey, message, position = null) {
    return this.request(`/files/${fileKey}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, ...position })
    });
  },
  
  async getTeamProjects(teamId) {
    return this.request(`/teams/${teamId}/projects`);
  },
  
  async getProjectFiles(projectId) {
    return this.request(`/projects/${projectId}/files`);
  },
  
  async getStyles(fileKey) {
    return this.request(`/files/${fileKey}/styles`);
  }
};

// Connection status summary
function getConnectionStatus() {
  return {
    asana: { connected: hasAsana, name: 'Asana' },
    notion: { connected: hasNotion, name: 'Notion' },
    figma: { connected: hasFigma, name: 'Figma' }
  };
}

module.exports = {
  asana,
  notion,
  figma,
  getConnectionStatus,
  hasAsana,
  hasNotion,
  hasFigma
};
