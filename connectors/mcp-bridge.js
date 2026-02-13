/**
 * MCP Bridge
 * Routes connector calls to real MCP servers via mcporter
 */

const { execSync } = require('child_process');

/**
 * Call an MCP tool via mcporter
 */
async function callMCP(server, tool, params = {}) {
  try {
    // Build mcporter command
    const args = Object.entries(params)
      .map(([k, v]) => {
        if (typeof v === 'object') {
          return `${k}='${JSON.stringify(v)}'`;
        }
        return `${k}="${v}"`;
      })
      .join(' ');
    
    const command = `mcporter call ${server}.${tool} ${args}`;
    
    // Execute and parse JSON output
    const output = execSync(command, { 
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    
    // mcporter returns JSONL - parse last line
    const lines = output.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    
    try {
      const result = JSON.parse(lastLine);
      return {
        success: true,
        data: result.content?.[0]?.text || result
      };
    } catch (parseError) {
      return {
        success: true,
        data: output
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr?.toString() || ''
    };
  }
}

/**
 * Check if MCP server is available
 */
function checkMCPServer(server) {
  try {
    const output = execSync(`mcporter list`, { 
      encoding: 'utf8',
      timeout: 5000 
    });
    return output.includes(server);
  } catch {
    return false;
  }
}

/**
 * Asana MCP Bridge
 */
const asana = {
  async createTask(params) {
    return callMCP('asana-v2', 'create_task', {
      name: params.name,
      project_gid: params.project_id,
      assignee: params.assignee,
      due_on: params.due_on,
      notes: params.notes,
      section: params.section_id
    });
  },
  
  async getTasks(params = {}) {
    return callMCP('asana-v2', 'get_tasks', {
      project_gid: params.project_id,
      assignee: params.assignee,
      completed_since: params.completed ? 'now' : null
    });
  },
  
  async updateTask(params) {
    return callMCP('asana-v2', 'update_task', {
      task_gid: params.task_id,
      name: params.name,
      assignee: params.assignee,
      due_on: params.due_on,
      completed: params.completed
    });
  },
  
  async createProject(params) {
    return callMCP('asana-v2', 'create_project', {
      name: params.name,
      workspace_gid: params.workspace_id,
      notes: params.notes,
      team: params.team_id
    });
  },
  
  isAvailable() {
    return checkMCPServer('asana-v2');
  }
};

/**
 * Notion MCP Bridge
 */
const notion = {
  async createPage(params) {
    return callMCP('notion', 'create_page', {
      parent_page_id: params.parent_id,
      title: params.title,
      content: params.content
    });
  },
  
  async search(params) {
    return callMCP('notion', 'search', {
      query: params.query,
      filter: params.filter
    });
  },
  
  async getPage(params) {
    return callMCP('notion', 'get_page', {
      page_id: params.page_id
    });
  },
  
  async updatePage(params) {
    return callMCP('notion', 'update_page', {
      page_id: params.page_id,
      properties: params.properties
    });
  },
  
  isAvailable() {
    return checkMCPServer('notion');
  }
};

/**
 * Figma MCP Bridge
 */
const figma = {
  async getFile(params) {
    return callMCP('figma', 'get_file', {
      file_key: params.file_key
    });
  },
  
  async getComments(params) {
    return callMCP('figma', 'get_comments', {
      file_key: params.file_key
    });
  },
  
  isAvailable() {
    return checkMCPServer('figma');
  }
};

module.exports = {
  callMCP,
  checkMCPServer,
  asana,
  notion,
  figma
};
