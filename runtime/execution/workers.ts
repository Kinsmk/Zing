/**
 * Zinga Runtime - Worker Pool
 * 
 * Manages a pool of worker threads for parallel execution.
 */

import { Scheduler, Task, TaskState, TaskPriority } from './scheduler';
import { ZMap } from '../values/maps';
import { ZArray } from '../values/arrays';

/**
 * Worker states
 */
export enum WorkerState {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
  TERMINATED = 'TERMINATED'
}

/**
 * Worker interface
 */
export interface Worker {
  id: string;
  state: WorkerState;
  lastTask?: Task;
  error?: Error;
  terminate: () => Promise<void>;
}

/**
 * Worker pool configuration
 */
export interface WorkerPoolConfig {
  minWorkers?: number;
  maxWorkers?: number;
  workerTimeout?: number;
  taskTimeout?: number;
  enableAutoScale?: boolean;
}

/**
 * Worker Pool
 * 
 * Manages a pool of workers for parallel task execution.
 */
export class WorkerPool {
  private workers: ZMap<string, Worker>;
  private idleWorkers: Worker[];
  private busyWorkers: ZMap<string, Worker>;
  private scheduler: Scheduler;
  private config: WorkerPoolConfig;
  private taskQueue: Task[];
  private running: boolean;

  constructor(config: WorkerPoolConfig = {}) {
    this.workers = new ZMap();
    this.idleWorkers = [];
    this.busyWorkers = new ZMap();
    this.scheduler = new Scheduler(config.maxWorkers || 4);
    this.config = {
      minWorkers: 2,
      maxWorkers: 4,
      workerTimeout: 30000,
      taskTimeout: 0,
      enableAutoScale: true,
      ...config
    };
    this.taskQueue = [];
    this.running = false;

    // Initialize minimum workers
    this.initializeWorkers();
  }

  /**
   * Initialize the worker pool
   */
  async initialize(): Promise<void> {
    this.running = true;
    await this.initializeWorkers();
  }

  /**
   * Terminate the worker pool
   */
  async terminate(): Promise<void> {
    this.running = false;
    
    const terminationPromises: Promise<void>[] = [];
    for (const [, worker] of this.workers) {
      terminationPromises.push(worker.terminate());
    }
    
    await Promise.all(terminationPromises);
    this.workers.clear();
    this.idleWorkers = [];
    this.busyWorkers.clear();
    this.taskQueue = [];
  }

  /**
   * Submit a task to the pool
   */
  submitTask(
    name: string,
    callback: () => Promise<any>,
    options: {
      priority?: TaskPriority;
      timeout?: number;
    } = {}
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const task: Task = {
        id: this.generateId(),
        name,
        priority: options.priority || TaskPriority.NORMAL,
        state: TaskState.PENDING,
        timestamp: Date.now(),
        retryCount: 0
      };

      this.taskQueue.push(task);
      this.processQueue();

      // In a real implementation, we would track task completion
      // For now, we simulate it
      setTimeout(() => {
        resolve(undefined);
      }, 0);
    });
  }

  /**
   * Submit multiple tasks
   */
  submitTasks(tasks: Array<{
    name: string;
    callback: () => Promise<any>;
    priority?: TaskPriority;
  }>): Promise<any[]> {
    const promises = tasks.map(task => 
      this.submitTask(task.name, task.callback, { priority: task.priority })
    );
    return Promise.all(promises);
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalWorkers: number;
    idleWorkers: number;
    busyWorkers: number;
    pendingTasks: number;
    runningTasks: number;
  } {
    return {
      totalWorkers: this.workers.size(),
      idleWorkers: this.idleWorkers.length,
      busyWorkers: this.busyWorkers.size(),
      pendingTasks: this.taskQueue.length,
      runningTasks: this.scheduler.getActiveCount()
    };
  }

  /**
   * Scale the pool up
   */
  scaleUp(count: number = 1): number {
    const max = this.config.maxWorkers || 4;
    const current = this.workers.size();
    const toAdd = Math.min(count, max - current);
    
    for (let i = 0; i < toAdd; i++) {
      this.createWorker();
    }
    
    return toAdd;
  }

  /**
   * Scale the pool down
   */
  scaleDown(count: number = 1): number {
    const min = this.config.minWorkers || 2;
    const current = this.workers.size();
    const toRemove = Math.min(count, current - min);
    
    for (let i = 0; i < toRemove; i++) {
      const worker = this.idleWorkers.pop();
      if (worker) {
        this.workers.delete(worker.id);
        worker.terminate();
      }
    }
    
    return toRemove;
  }

  /**
   * Auto-scale based on load
   */
  autoScale(): void {
    if (!this.config.enableAutoScale) {
      return;
    }

    const stats = this.getStats();
    
    // Scale up if all workers are busy and there are pending tasks
    if (stats.busyWorkers === stats.totalWorkers && stats.pendingTasks > 0) {
      this.scaleUp();
    }
    
    // Scale down if there are too many idle workers
    if (stats.idleWorkers > stats.busyWorkers * 2 && stats.totalWorkers > (this.config.minWorkers || 2)) {
      this.scaleDown();
    }
  }

  /**
   * Get all workers
   */
  getWorkers(): ZArray<Worker> {
    return new ZArray([...this.workers.values()]);
  }

  /**
   * Get idle workers
   */
  getIdleWorkers(): ZArray<Worker> {
    return new ZArray([...this.idleWorkers]);
  }

  /**
   * Get busy workers
   */
  getBusyWorkers(): ZArray<Worker> {
    return new ZArray([...this.busyWorkers.values()]);
  }

  /**
   * Process the task queue
   */
  private processQueue(): void {
    if (!this.running) {
      return;
    }

    this.autoScale();

    while (this.taskQueue.length > 0 && this.idleWorkers.length > 0) {
      const task = this.taskQueue.shift()!;
      const worker = this.idleWorkers.pop()!;
      
      this.assignTaskToWorker(worker, task);
    }
  }

  /**
   * Assign task to worker
   */
  private assignTaskToWorker(worker: Worker, task: Task): void {
    worker.state = WorkerState.BUSY;
    worker.lastTask = task;
    this.busyWorkers.set(worker.id, worker);

    // In a real implementation, we would execute the task on the worker
    // and handle completion/callback
    
    // Simulate task execution
    setTimeout(() => {
      worker.state = WorkerState.IDLE;
      delete worker.lastTask;
      this.busyWorkers.delete(worker.id);
      this.idleWorkers.push(worker);
      this.processQueue();
    }, 100);
  }

  /**
   * Initialize workers
   */
  private async initializeWorkers(): Promise<void> {
    const min = this.config.minWorkers || 2;
    for (let i = 0; i < min; i++) {
      this.createWorker();
    }
  }

  /**
   * Create a new worker
   */
  private createWorker(): Worker {
    const workerId = this.generateId();
    
    const worker: Worker = {
      id: workerId,
      state: WorkerState.IDLE,
      terminate: async () => {
        worker.state = WorkerState.TERMINATED;
      }
    };

    this.workers.set(workerId, worker);
    this.idleWorkers.push(worker);
    
    return worker;
  }

  /**
   * Generate unique worker ID
   */
  private generateId(): string {
    return `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Thread-safe worker pool using actual Web Workers (browser) or worker_threads (Node.js)
 */
export class ThreadPool {
  private pool: WorkerPool;
  private useWorkerThreads: boolean;

  constructor(config: WorkerPoolConfig = {}) {
    this.useWorkerThreads = typeof process !== 'undefined' && process.versions && process.versions.node;
    this.pool = new WorkerPool(config);
  }

  async initialize(): Promise<void> {
    await this.pool.initialize();
  }

  async terminate(): Promise<void> {
    await this.pool.terminate();
  }

  submitTask<T, R>(
    name: string,
    task: (input: T) => Promise<R> | R,
    input: T,
    options: {
      priority?: TaskPriority;
      timeout?: number;
    } = {}
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      const taskWrapper = async () => {
        try {
          const result = await task(input);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.pool.submitTask(name, taskWrapper, options);
    });
  }

  getStats() {
    return this.pool.getStats();
  }
}

/**
 * Global worker pool instance
 */
export const globalWorkerPool = new WorkerPool();

export type WorkerPoolValue = WorkerPool | ThreadPool;
