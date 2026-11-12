/**
 * Zinga Runtime - Execution Scheduler
 * 
 * Manages task scheduling, execution order, and concurrency control.
 */

import { ZMap } from '../values/maps';
import { ZArray } from '../values/arrays';
import { ZString } from '../values/strings';

/**
 * Task states
 */
export enum TaskState {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

/**
 * Task priority levels
 */
export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  IMMEDIATE = 3
}

/**
 * Task interface
 */
export interface Task {
  id: string;
  name: string;
  priority: TaskPriority;
  state: TaskState;
  timestamp: number;
  delay?: number;
  repeat?: boolean;
  repeatInterval?: number;
  maxRetries?: number;
  retryCount: number;
  error?: Error;
  result?: any;
  cancel?: () => void;
}

/**
 * Task callback type
 */
export type TaskCallback = (task: Task) => Promise<any> | any;

/**
 * Execution Scheduler
 * 
 * Manages the execution of tasks with priority, delay, and retry support.
 */
export class Scheduler {
  private tasks: ZMap<string, Task>;
  private queue: Task[];
  private runningTasks: ZMap<string, Task>;
  private paused: boolean;
  private maxConcurrent: number;
  private activeCount: number;

  constructor(maxConcurrent: number = 4) {
    this.tasks = new ZMap();
    this.queue = [];
    this.runningTasks = new ZMap();
    this.paused = false;
    this.maxConcurrent = maxConcurrent;
    this.activeCount = 0;
  }

  /**
   * Schedule a new task
   */
  schedule(
    name: string,
    callback: TaskCallback,
    options: {
      priority?: TaskPriority;
      delay?: number;
      repeat?: boolean;
      repeatInterval?: number;
      maxRetries?: number;
    } = {}
  ): Task {
    const task: Task = {
      id: this.generateId(),
      name,
      priority: options.priority || TaskPriority.NORMAL,
      state: TaskState.PENDING,
      timestamp: Date.now(),
      delay: options.delay,
      repeat: options.repeat || false,
      repeatInterval: options.repeatInterval,
      maxRetries: options.maxRetries || 0,
      retryCount: 0
    };

    this.tasks.set(task.id, task);
    this.insertTask(task);
    this.processQueue();

    return task;
  }

  /**
   * Cancel a task
   */
  cancel(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.state = TaskState.CANCELLED;
      task.cancel?.();
      this.tasks.delete(task.id);
      
      const queueIndex = this.queue.findIndex(t => t.id === taskId);
      if (queueIndex !== -1) {
        this.queue.splice(queueIndex, 1);
      }
      
      if (this.runningTasks.has(taskId)) {
        this.runningTasks.delete(taskId);
        this.activeCount--;
        this.processQueue();
      }
      
      return true;
    }
    return false;
  }

  /**
   * Cancel all tasks
   */
  cancelAll(): number {
    const count = this.tasks.size();
    for (const [id] of this.tasks) {
      this.cancel(id);
    }
    return count;
  }

  /**
   * Pause the scheduler
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resume the scheduler
   */
  resume(): void {
    this.paused = false;
    this.processQueue();
  }

  /**
   * Check if scheduler is paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getTasks(): ZArray<Task> {
    return new ZArray([...this.tasks.values()]);
  }

  /**
   * Get pending tasks
   */
  getPendingTasks(): ZArray<Task> {
    const pending = [...this.tasks.values()].filter(
      t => t.state === TaskState.PENDING
    );
    return new ZArray(pending);
  }

  /**
   * Get running tasks
   */
  getRunningTasks(): ZArray<Task> {
    return new ZArray([...this.runningTasks.values()]);
  }

  /**
   * Get completed tasks
   */
  getCompletedTasks(): ZArray<Task> {
    const completed = [...this.tasks.values()].filter(
      t => t.state === TaskState.COMPLETED
    );
    return new ZArray(completed);
  }

  /**
   * Get failed tasks
   */
  getFailedTasks(): ZArray<Task> {
    const failed = [...this.tasks.values()].filter(
      t => t.state === TaskState.FAILED
    );
    return new ZArray(failed);
  }

  /**
   * Clear completed tasks
   */
  clearCompleted(): number {
    let count = 0;
    for (const [id, task] of this.tasks) {
      if (task.state === TaskState.COMPLETED) {
        this.tasks.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all tasks
   */
  clear(): number {
    const count = this.tasks.size();
    this.tasks.clear();
    this.queue = [];
    this.runningTasks.clear();
    return count;
  }

  /**
   * Set maximum concurrent tasks
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max;
    this.processQueue();
  }

  /**
   * Get current active task count
   */
  getActiveCount(): number {
    return this.activeCount;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Process the task queue
   */
  private processQueue(): void {
    if (this.paused || this.activeCount >= this.maxConcurrent) {
      return;
    }

    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const task = this.queue.shift()!;
      this.executeTask(task);
    }
  }

  /**
   * Execute a task
   */
  private async executeTask(task: Task): Promise<void> {
    if (task.delay) {
      await new Promise(resolve => setTimeout(resolve, task.delay));
    }

    if (task.state !== TaskState.PENDING) {
      return;
    }

    task.state = TaskState.RUNNING;
    this.runningTasks.set(task.id, task);
    this.activeCount++;

    try {
      task.result = await this.executeWithRetry(task);
      task.state = TaskState.COMPLETED;
      
      if (task.repeat) {
        this.scheduleRepeat(task);
      }
    } catch (error) {
      task.error = error as Error;
      task.state = TaskState.FAILED;
    } finally {
      this.runningTasks.delete(task.id);
      this.activeCount--;
      this.processQueue();
    }
  }

  /**
   * Execute task with retry logic
   */
  private async executeWithRetry(task: Task): Promise<any> {
    let lastError: Error | undefined;
    
    while (task.retryCount <= (task.maxRetries || 0)) {
      try {
        // Note: In a real implementation, we would have the actual callback
        // For now, we return a resolved promise
        return Promise.resolve();
      } catch (error) {
        lastError = error as Error;
        task.retryCount++;
        
        if (task.retryCount <= (task.maxRetries || 0)) {
          await new Promise(resolve => 
            setTimeout(resolve, task.repeatInterval || 1000)
          );
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Schedule a repeating task
   */
  private scheduleRepeat(task: Task): void {
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      state: TaskState.PENDING,
      timestamp: Date.now(),
      retryCount: 0,
      result: undefined,
      error: undefined
    };
    
    this.tasks.set(newTask.id, newTask);
    this.insertTask(newTask);
    this.processQueue();
  }

  /**
   * Insert task into queue with priority
   */
  private insertTask(task: Task): void {
    let index = this.queue.length;
    
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.queue[parentIndex];
      
      if (this.compareTasks(task, parent) >= 0) {
        break;
      }
      
      this.queue[index] = parent;
      index = parentIndex;
    }
    
    this.queue[index] = task;
  }

  /**
   * Compare tasks by priority and timestamp
   */
  private compareTasks(a: Task, b: Task): number {
    // Higher priority comes first
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    
    // Earlier timestamp comes first
    return a.timestamp - b.timestamp;
  }

  /**
   * Generate unique task ID
   */
  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Global scheduler instance
 */
export const globalScheduler = new Scheduler();

/**
 * Task builder for fluent task creation
 */
export class TaskBuilder {
  private name: string = 'unnamed';
  private priority: TaskPriority = TaskPriority.NORMAL;
  private delay?: number;
  private repeat: boolean = false;
  private repeatInterval?: number;
  private maxRetries: number = 0;

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withPriority(priority: TaskPriority): this {
    this.priority = priority;
    return this;
  }

  withDelay(delay: number): this {
    this.delay = delay;
    return this;
  }

  repeatEvery(interval: number): this {
    this.repeat = true;
    this.repeatInterval = interval;
    return this;
  }

  withMaxRetries(max: number): this {
    this.maxRetries = max;
    return this;
  }

  build(callback: TaskCallback, scheduler: Scheduler = globalScheduler): Task {
    return scheduler.schedule(this.name, callback, {
      priority: this.priority,
      delay: this.delay,
      repeat: this.repeat,
      repeatInterval: this.repeatInterval,
      maxRetries: this.maxRetries
    });
  }
}

export function createTask(name: string): TaskBuilder {
  return new TaskBuilder().withName(name);
}
