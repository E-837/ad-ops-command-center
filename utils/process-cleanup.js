/**
 * Orphan Process Cleanup
 * 
 * Periodically scans for orphaned mcporter/node processes and kills them.
 * Prevents process bloat from crashed workflows or leaked child processes.
 * 
 * Usage:
 *   const cleanup = require('./utils/process-cleanup');
 *   cleanup.start(); // starts periodic scanning
 *   cleanup.stop();  // stops scanning
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class ProcessCleanup {
  constructor(options = {}) {
    this.interval = options.interval || 60000; // 60s
    this.maxAge = options.maxAge || 300000; // 5 min
    this.timer = null;
    this.isRunning = false;
    this.stats = {
      scans: 0,
      killed: 0,
      errors: 0
    };
  }

  /**
   * Start periodic cleanup
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log(`[ProcessCleanup] Started (interval: ${this.interval}ms, maxAge: ${this.maxAge}ms)`);
    
    this.timer = setInterval(() => {
      this.scan().catch(err => {
        console.error('[ProcessCleanup] Scan error:', err.message);
        this.stats.errors++;
      });
    }, this.interval);
  }

  /**
   * Stop periodic cleanup
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[ProcessCleanup] Stopped');
  }

  /**
   * Scan for orphaned processes
   */
  async scan() {
    this.stats.scans++;
    
    try {
      // Get all node processes (Windows-specific)
      const { stdout } = await execAsync('powershell -Command "Get-Process -Name node | Select-Object Id, StartTime, WorkingSet64, Path | ConvertTo-Json"');
      
      let processes = [];
      try {
        const parsed = JSON.parse(stdout);
        processes = Array.isArray(parsed) ? parsed : [parsed];
      } catch (err) {
        // No processes or parse error
        return;
      }
      
      const now = Date.now();
      const serverPid = process.pid;
      
      for (const proc of processes) {
        if (!proc || !proc.Id) continue;
        
        // Skip current server process
        if (proc.Id === serverPid) continue;
        
        // Check age (convert PowerShell DateTime to timestamp)
        const startTime = proc.StartTime ? new Date(proc.StartTime).getTime() : 0;
        const age = now - startTime;
        
        // Kill if too old
        if (age > this.maxAge) {
          await this.killProcess(proc.Id, `exceeded max age (${Math.round(age/1000)}s)`);
        }
      }
      
    } catch (err) {
      // Ignore errors (process may not exist, etc.)
    }
  }

  /**
   * Kill a process by PID
   */
  async killProcess(pid, reason = 'orphaned') {
    try {
      await execAsync(`powershell -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`);
      console.log(`[ProcessCleanup] Killed PID ${pid} (${reason})`);
      this.stats.killed++;
    } catch (err) {
      // Process may already be dead
    }
  }

  /**
   * Manual cleanup of all node processes except server
   */
  async cleanupAll() {
    console.log('[ProcessCleanup] Running full cleanup...');
    
    try {
      const serverPid = process.pid;
      const { stdout } = await execAsync('powershell -Command "Get-Process -Name node | Select-Object Id | ConvertTo-Json"');
      
      let processes = [];
      try {
        const parsed = JSON.parse(stdout);
        processes = Array.isArray(parsed) ? parsed : [parsed];
      } catch (err) {
        return;
      }
      
      for (const proc of processes) {
        if (proc && proc.Id && proc.Id !== serverPid) {
          await this.killProcess(proc.Id, 'manual cleanup');
        }
      }
      
    } catch (err) {
      console.error('[ProcessCleanup] Cleanup error:', err.message);
    }
  }

  /**
   * Get cleanup stats
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      interval: this.interval,
      maxAge: this.maxAge,
      stats: this.stats
    };
  }
}

// Singleton instance
const cleanup = new ProcessCleanup({
  interval: process.env.CLEANUP_INTERVAL || 60000,
  maxAge: process.env.PROCESS_MAX_AGE || 300000
});

module.exports = cleanup;
