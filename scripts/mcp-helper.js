/**
 * MCP Helper - Call mcporter tools from Node without shell escaping issues
 * Spawns node directly with mcporter's CLI entry point to bypass PowerShell
 */
const { spawnSync, spawn } = require('child_process');
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

function callToolAsync(server, tool, args, options = {}) {
  const timeoutMs = typeof options === 'number' ? options : (options.timeoutMs || 30000);
  const maxRetries = typeof options === 'object' && options.maxRetries !== undefined ? options.maxRetries : 2;

  const runOnce = (attempt = 0) => new Promise((resolve) => {
    const argsJson = JSON.stringify(args);
    const child = spawn(process.execPath, [
      MCPORTER_CLI, 'call', `${server}.${tool}`, '--args', argsJson
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });

    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      finish({ success: false, error: 'Timeout', output: stdout });
    }, timeoutMs);

    child.on('close', async (code) => {
      clearTimeout(timer);
      if (settled) return;

      if (code !== 0) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          return finish(await runOnce(attempt + 1));
        }

        return finish({
          success: false,
          error: stderr || stdout || `Command failed (code ${code})`,
          output: stdout
        });
      }

      return finish({ success: true, output: stdout });
    });

    child.on('error', async (err) => {
      clearTimeout(timer);
      if (settled) return;

      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        return finish(await runOnce(attempt + 1));
      }

      return finish({ success: false, error: err.message, output: '' });
    });
  });

  return runOnce(0);
}

module.exports = { callTool, callToolAsync };
