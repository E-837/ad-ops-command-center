/**
 * Semaphore for limiting concurrent operations
 * 
 * Usage:
 *   const semaphore = new Semaphore(3); // max 3 concurrent
 *   await semaphore.acquire();
 *   try {
 *     // do work
 *   } finally {
 *     semaphore.release();
 *   }
 * 
 * Or use with wrapper:
 *   await semaphore.use(async () => {
 *     // do work
 *   });
 */

class Semaphore {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.current = 0;
    this.queue = [];
  }

  /**
   * Acquire a slot (waits if at limit)
   */
  async acquire() {
    if (this.current < this.maxConcurrent) {
      this.current++;
      return Promise.resolve();
    }

    // Wait in queue
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const idx = this.queue.indexOf(item);
        if (idx !== -1) this.queue.splice(idx, 1);
        reject(new Error('Semaphore acquire timeout (60s)'));
      }, 60000);

      const item = { resolve, reject, timeout };
      this.queue.push(item);
    });
  }

  /**
   * Release a slot (wakes next in queue)
   */
  release() {
    this.current--;

    if (this.queue.length > 0) {
      const { resolve, timeout } = this.queue.shift();
      clearTimeout(timeout);
      this.current++;
      resolve();
    }
  }

  /**
   * Run function with semaphore protection
   */
  async use(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      maxConcurrent: this.maxConcurrent,
      current: this.current,
      queued: this.queue.length,
      available: this.maxConcurrent - this.current
    };
  }
}

module.exports = Semaphore;
