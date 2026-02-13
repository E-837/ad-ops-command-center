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
    return callMCP('notion', 'API-post-page', {
      parent: params.parent_id
        ? { [params.parent_type || 'page_id']: params.parent_id }
        : undefined,
      properties: params.properties || {
        title: {
          title: [{ text: { content: params.title || 'Untitled' } }]
        }
      },
      children: params.content || []
    });
  },

  async search(params) {
    return callMCP('notion', 'API-post-search', {
      query: params.query,
      filter: params.filter,
      sort: params.sort
    });
  },

  async getPage(params) {
    return callMCP('notion', 'API-retrieve-a-page', {
      page_id: params.page_id
    });
  },

  async updatePage(params) {
    return callMCP('notion', 'API-patch-page', {
      page_id: params.page_id,
      properties: params.properties,
      archived: params.archived
    });
  },

  async queryDatabase(params) {
    return callMCP('notion', 'API-query-data-source', {
      data_source_id: params.database_id,
      filter: params.filter,
      sorts: params.sorts,
      page_size: params.page_size
    });
  },

  async addBlock(params) {
    return callMCP('notion', 'API-patch-block-children', {
      block_id: params.page_id,
      children: [{
        object: 'block',
        type: params.block_type || 'paragraph',
        [params.block_type || 'paragraph']: {
          rich_text: [{ type: 'text', text: { content: params.content || '' } }]
        }
      }],
      after: params.after
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
      file_key: params.file_key,
      depth: params.depth
    });
  },

  async getNode(params) {
    return callMCP('figma', 'get_node', {
      file_key: params.file_key,
      node_id: params.node_id
    });
  },

  async getImages(params) {
    return callMCP('figma', 'get_images', {
      file_key: params.file_key,
      node_ids: params.node_ids,
      format: params.format,
      scale: params.scale
    });
  },

  async getComments(params) {
    return callMCP('figma', 'get_comments', {
      file_key: params.file_key
    });
  },

  async listProjects(params) {
    return callMCP('figma', 'list_projects', {
      team_id: params.team_id
    });
  },

  async getStyles(params) {
    return callMCP('figma', 'get_styles', {
      file_key: params.file_key
    });
  },

  isAvailable() {
    return checkMCPServer('figma');
  }
};

/**
 * Google Docs MCP Bridge
 */
const googleDocs = {
  async createDoc(params) {
    return callMCP('google-docs', 'createDocument', {
      title: params.title,
      parentFolderId: params.parentFolderId,
      initialContent: params.content
    });
  },

  async getDoc(params) {
    return callMCP('google-docs', 'readGoogleDoc', {
      documentId: params.documentId,
      format: params.format || 'text',
      maxLength: params.maxLength
    });
  },

  async updateDoc(params) {
    return callMCP('google-docs', 'appendToGoogleDoc', {
      documentId: params.documentId,
      textToAppend: params.text,
      addNewlineIfNeeded: params.addNewlineIfNeeded !== false
    });
  },

  async createSheet(params) {
    return callMCP('google-docs', 'createSpreadsheet', {
      title: params.title,
      parentFolderId: params.parentFolderId,
      initialData: params.initialData
    });
  },

  async getSheet(params) {
    return callMCP('google-docs', 'readSpreadsheet', {
      spreadsheetId: params.spreadsheetId,
      range: params.range || 'A1:Z1000',
      valueRenderOption: params.valueRenderOption || 'FORMATTED_VALUE'
    });
  },

  isAvailable() {
    return checkMCPServer('google-docs');
  }
};

module.exports = {
  callMCP,
  checkMCPServer,
  asana,
  notion,
  figma,
  googleDocs
};
