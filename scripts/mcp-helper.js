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
  const maxBufferBytes = 5 * 1024 * 1024;

  const runOnce = (attempt = 0) => new Promise((resolve) => {
    const argsJson = JSON.stringify(args);
    const child = spawn(process.execPath, [
      MCPORTER_CLI, 'call', `${server}.${tool}`, '--args', argsJson
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    // Don't let this child keep the event loop alive if the parent is done.
    child.unref();

    let stdout = '';
    let stderr = '';
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let stdoutTruncated = false;
    let stderrTruncated = false;
    let settled = false;
    let timer = null;
    let exited = false;

    const appendWithLimit = (isStdout, chunk) => {
      const str = chunk.toString();
      const bytes = Buffer.byteLength(str, 'utf8');

      if (isStdout) {
        stdoutBytes += bytes;
        if (stdoutBytes > maxBufferBytes) {
          if (!stdoutTruncated) {
            stdoutTruncated = true;
            console.warn(`[mcp-helper] stdout buffer limit hit (${maxBufferBytes} bytes) for ${server}.${tool}; truncating output`);
          }
          const remaining = Math.max(0, maxBufferBytes - Buffer.byteLength(stdout, 'utf8'));
          if (remaining > 0) {
            stdout += str.slice(0, remaining);
          }
          return;
        }
        stdout += str;
        return;
      }

      stderrBytes += bytes;
      if (stderrBytes > maxBufferBytes) {
        if (!stderrTruncated) {
          stderrTruncated = true;
          console.warn(`[mcp-helper] stderr buffer limit hit (${maxBufferBytes} bytes) for ${server}.${tool}; truncating output`);
        }
        const remaining = Math.max(0, maxBufferBytes - Buffer.byteLength(stderr, 'utf8'));
        if (remaining > 0) {
          stderr += str.slice(0, remaining);
        }
        return;
      }
      stderr += str;
    };

    const onStdoutData = (d) => appendWithLimit(true, d);
    const onStderrData = (d) => appendWithLimit(false, d);

    const onClose = async (code) => {
      exited = true;

      if (settled) {
        cleanup({ killChild: false });
        return;
      }

      if (code !== 0) {
        if (attempt < maxRetries) {
          cleanup({ killChild: false });
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          return finish(await runOnce(attempt + 1));
        }

        cleanup({ killChild: false });
        return finish({
          success: false,
          error: stderr || stdout || `Command failed (code ${code})`,
          output: stdout
        });
      }

      cleanup({ killChild: false });
      return finish({ success: true, output: stdout });
    };

    const onError = async (err) => {
      if (settled) {
        cleanup();
        return;
      }

      if (attempt < maxRetries) {
        cleanup();
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        return finish(await runOnce(attempt + 1));
      }

      cleanup();
      return finish({ success: false, error: err.message, output: '' });
    };

    const cleanup = ({ killChild = true } = {}) => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      if (child.stdout) child.stdout.removeListener('data', onStdoutData);
      if (child.stderr) child.stderr.removeListener('data', onStderrData);
      child.removeListener('close', onClose);
      child.removeListener('error', onError);

      if (killChild && !exited && !child.killed) {
        try {
          child.kill('SIGTERM');
        } catch (_) {
          // noop
        }
      }
    };

    const finish = (result, cleanupOptions) => {
      if (settled) return;
      settled = true;
      cleanup(cleanupOptions);
      resolve(result);
    };

    child.stdout.on('data', onStdoutData);
    child.stderr.on('data', onStderrData);
    child.once('close', onClose);
    child.once('error', onError);

    timer = setTimeout(() => {
      cleanup();

      // Escalate if process ignores SIGTERM.
      setTimeout(() => {
        if (!exited && !child.killed) {
          try {
            child.kill('SIGKILL');
          } catch (_) {
            // noop
          }
        }
      }, 1000).unref();

      finish({ success: false, error: 'Timeout', output: stdout }, { killChild: false });
    }, timeoutMs);
  });

  return runOnce(0);
}

module.exports = { callTool, callToolAsync };
