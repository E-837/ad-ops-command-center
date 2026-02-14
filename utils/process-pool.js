/**
 * Process Pool Manager for mcporter calls
 * 
 * Reuses Node.js child processes instead of spawning new ones for every MCP call.
 * Prevents memory bloat and process leaks.
 * 
 * Usage:
 *   const pool = require('./utils/process-pool');
 *   const result = await pool.execute('mcporter', ['call', 'asana.list_workspaces']);
 */

const { spawn } = require('child_process');
const EventEmitter = require('events');

class ProcessPool extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.maxSize = options.maxSize || 5;
    this.idleTimeout = options.idleTimeout || 30000; // 30s
    this.processTimeout = options.processTimeout || 300000; // 5 min
    
    this.pool = [];
    this.activeProcesses = new Map(); // pid -> process info
    this.pidRegistry = new Set();
    
    // Stats
    this.stats = {
      spawned: 0,
      reused: 0,
      killed: 0,
      errors: 0
    };
  }

  /**
   * Get or create a process from the pool
   */
  async acquire(command, args = []) {
    // Try to reuse idle process
    const idle = this.pool.find(p => !p.busy && p.command === command);
    
    if (idle) {
      this.stats.reused++;
      idle.busy = true;
      idle.lastUsed = Date.now();
      clearTimeout(idle.idleTimer);
      return idle;
    }
    
    // Spawn new if under limit
    if (this.activeProcesses.size < this.maxSize) {
      return await this.spawn(command, args);
    }
    
    // Wait for available process (with timeout)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Process pool timeout - no available processes'));
      }, 60000);
      
      this.once('process-available', () => {
        clearTimeout(timeout);
        this.acquire(command, args).then(resolve).catch(reject);
      });
    });
  }

  /**
   * Spawn a new process
   */
  async spawn(command, args = []) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });
      
      const processInfo = {
        child,
        pid: child.pid,
        command,
        args,
        busy: true,
        spawned: Date.now(),
        lastUsed: Date.now(),
        uses: 0,
        stdout: '',
        stderr: ''
      };
      
      // Track globally
      this.activeProcesses.set(child.pid, processInfo);
      this.pidRegistry.add(child.pid);
      this.stats.spawned++;
      
      // Add to pool
      this.pool.push(processInfo);
      
      // Handle process death
      child.on('exit', (code) => {
        this.remove(processInfo);
      });
      
      child.on('error', (err) => {
        this.stats.errors++;
        this.remove(processInfo);
      });
      
      resolve(processInfo);
    });
  }

  /**
   * Release process back to pool
   */
  release(processInfo) {
    if (!processInfo) return;
    
    processInfo.busy = false;
    processInfo.lastUsed = Date.now();
    processInfo.uses++;
    
    // Set idle timer
    processInfo.idleTimer = setTimeout(() => {
      this.kill(processInfo, 'idle-timeout');
    }, this.idleTimeout);
    
    // Emit availability
    this.emit('process-available');
  }

  /**
   * Kill a specific process
   */
  kill(processInfo, reason = 'manual') {
    if (!processInfo || !processInfo.child) return;
    
    try {
      clearTimeout(processInfo.idleTimer);
      
      if (!processInfo.child.killed) {
        processInfo.child.kill('SIGTERM');
        
        // Force kill after 2s
        setTimeout(() => {
          if (!processInfo.child.killed) {
            processInfo.child.kill('SIGKILL');
          }
        }, 2000);
      }
      
      this.stats.killed++;
      this.remove(processInfo);
      
    } catch (err) {
      // Process already dead
    }
  }

  /**
   * Remove from pool and tracking
   */
  remove(processInfo) {
    const idx = this.pool.indexOf(processInfo);
    if (idx !== -1) {
      this.pool.splice(idx, 1);
    }
    
    if (processInfo.pid) {
      this.activeProcesses.delete(processInfo.pid);
      this.pidRegistry.delete(processInfo.pid);
    }
  }

  /**
   * Execute command and return output
   */
  async execute(command, args = [], options = {}) {
    const processInfo = await this.acquire(command, args);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.kill(processInfo, 'execution-timeout');
        reject(new Error('Execution timeout'));
      }, options.timeout || this.processTimeout);
      
      let stdout = '';
      let stderr = '';
      
      processInfo.child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      processInfo.child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      processInfo.child.once('exit', (code) => {
        clearTimeout(timeout);
        this.release(processInfo);
        
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Process exited with code ${code}\n${stderr}`));
        }
      });
      
      // Send input if provided
      if (options.input) {
        processInfo.child.stdin.write(options.input);
        processInfo.child.stdin.end();
      }
    });
  }

  /**
   * Cleanup: kill all processes
   */
  async cleanup() {
    const processes = [...this.pool];
    
    for (const p of processes) {
      this.kill(p, 'cleanup');
    }
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Get pool status
   */
  getStatus() {
    return {
      size: this.pool.length,
      active: this.pool.filter(p => p.busy).length,
      idle: this.pool.filter(p => !p.busy).length,
      maxSize: this.maxSize,
      stats: this.stats,
      processes: this.pool.map(p => ({
        pid: p.pid,
        busy: p.busy,
        uses: p.uses,
        uptime: Date.now() - p.spawned,
        idle: Date.now() - p.lastUsed
      }))
    };
  }
}

// Singleton instance
const pool = new ProcessPool({
  maxSize: process.env.PROCESS_POOL_SIZE || 5,
  idleTimeout: 30000,
  processTimeout: 300000
});

// Cleanup on exit
process.on('SIGTERM', () => pool.cleanup());
process.on('SIGINT', () => pool.cleanup());

module.exports = pool;
