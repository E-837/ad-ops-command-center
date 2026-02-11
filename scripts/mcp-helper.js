/**
 * MCP Helper - Call mcporter tools from Node without shell escaping issues
 * Spawns node directly with mcporter's CLI entry point to bypass PowerShell
 */
const { spawnSync } = require('child_process');
const path = require('path');

// Find mcporter's actual JS entry point
const MCPORTER_CLI = path.join(
  process.env.APPDATA || path.join(require('os').homedir(), 'AppData', 'Local'),
  '..', 'Local', 'npm', 'node_modules', 'mcporter', 'dist', 'cli.js'
);

function callTool(server, tool, args, timeoutMs = 30000) {
  try {
    const argsJson = JSON.stringify(args);
    
    // Spawn node directly with mcporter's entry point - no shell involved
    const result = spawnSync(process.execPath, [
      MCPORTER_CLI, 'call', `${server}.${tool}`, '--args', argsJson
    ], {
      encoding: 'utf8',
      maxBuffer: 5 * 1024 * 1024,
      timeout: timeoutMs,
      shell: false
    });
    
    const output = (result.stdout || '') + (result.stderr || '');
    
    if (result.status !== 0 && result.status !== null) {
      return { success: false, error: output || 'Command failed', output: result.stdout || '' };
    }
    
    if (result.status === null) {
      return { success: false, error: 'Process failed to start or timed out', output: '' };
    }
    
    return { success: true, output: result.stdout || '' };
  } catch (error) {
    return { success: false, error: error.message, output: '' };
  }
}

module.exports = { callTool };
