/**
 * Zinga Runtime - Process Isolation
 * 
 * Provides secure isolation for executing untrusted code.
 */

import { ZMap } from '../values/maps';
import { ZString } from '../values/strings';
import { ZArray } from '../values/arrays';

/**
 * Isolation modes
 */
export enum IsolationMode {
  NONE = 'NONE',           // No isolation (not secure)
  SANDBOX = 'SANDBOX',     // Basic sandbox with limited access
  PROCESS = 'PROCESS',     // Process-level isolation
  CONTAINER = 'CONTAINER', // Container-level isolation
  VM = 'VM'                // Virtual machine isolation
}

/**
 * Permission types
 */
export enum Permission {
  FILESYSTEM_READ = 'FILESYSTEM_READ',
  FILESYSTEM_WRITE = 'FILESYSTEM_WRITE',
  FILESYSTEM_DELETE = 'FILESYSTEM_DELETE',
  NETWORK_CONNECT = 'NETWORK_CONNECT',
  NETWORK_BIND = 'NETWORK_BIND',
  PROCESS_EXEC = 'PROCESS_EXEC',
  PROCESS_FORK = 'PROCESS_FORK',
  MEMORY_ACCESS = 'MEMORY_ACCESS',
  TIME_ACCESS = 'TIME_ACCESS',
  ENV_ACCESS = 'ENV_ACCESS',
  RANDOM_ACCESS = 'RANDOM_ACCESS'
}

/**
 * Resource quota configuration
 */
export interface ResourceQuota {
  maxMemory?: number;      // in bytes
  maxCPUTime?: number;     // in milliseconds
  maxExecutionTime?: number; // in milliseconds
  maxFileDescriptors?: number;
  maxNetworkConnections?: number;
  maxThreads?: number;
}

/**
 * Security policy
 */
export interface SecurityPolicy {
  mode: IsolationMode;
  permissions: Set<Permission>;
  quotas: ResourceQuota;
  allowedPaths?: string[];
  blockedPaths?: string[];
  allowedHosts?: string[];
  blockedHosts?: string[];
  allowedModules?: string[];
  blockedModules?: string[];
}

/**
 * Default security policies
 */
export const SecurityPolicies = {
  // No restrictions (not secure for untrusted code)
  UNRESTRICTED: {
    mode: IsolationMode.NONE,
    permissions: new Set([
      Permission.FILESYSTEM_READ,
      Permission.FILESYSTEM_WRITE,
      Permission.FILESYSTEM_DELETE,
      Permission.NETWORK_CONNECT,
      Permission.NETWORK_BIND,
      Permission.PROCESS_EXEC,
      Permission.PROCESS_FORK,
      Permission.MEMORY_ACCESS,
      Permission.TIME_ACCESS,
      Permission.ENV_ACCESS,
      Permission.RANDOM_ACCESS
    ]),
    quotas: {}
  } as SecurityPolicy,

  // Safe for trusted code
  TRUSTED: {
    mode: IsolationMode.SANDBOX,
    permissions: new Set([
      Permission.FILESYSTEM_READ,
      Permission.NETWORK_CONNECT,
      Permission.TIME_ACCESS,
      Permission.RANDOM_ACCESS
    ]),
    quotas: {
      maxMemory: 1024 * 1024 * 1024, // 1GB
      maxCPUTime: 60 * 1000,          // 1 minute
      maxExecutionTime: 30 * 1000     // 30 seconds
    }
  } as SecurityPolicy,

  // Safe for untrusted code
  SANDBOX: {
    mode: IsolationMode.SANDBOX,
    permissions: new Set([
      Permission.TIME_ACCESS,
      Permission.RANDOM_ACCESS
    ]),
    quotas: {
      maxMemory: 128 * 1024 * 1024,   // 128MB
      maxCPUTime: 10 * 1000,           // 10 seconds
      maxExecutionTime: 5 * 1000        // 5 seconds
    }
  } as SecurityPolicy,

  // Maximum isolation
  ISOLATED: {
    mode: IsolationMode.PROCESS,
    permissions: new Set([
      Permission.TIME_ACCESS,
      Permission.RANDOM_ACCESS
    ]),
    quotas: {
      maxMemory: 64 * 1024 * 1024,    // 64MB
      maxCPUTime: 5 * 1000,            // 5 seconds
      maxExecutionTime: 2 * 1000        // 2 seconds
    }
  } as SecurityPolicy
};

/**
 * Isolation context
 */
export interface IsolationContext {
  id: string;
  policy: SecurityPolicy;
  memoryUsage: number;
  cpuTime: number;
  executionStart: number;
  lastActivity: number;
  state: 'IDLE' | 'RUNNING' | 'PAUSED' | 'TERMINATED';
  result?: any;
  error?: Error;
}

/**
 * Process Isolator
 * 
 * Manages isolated execution contexts for secure code execution.
 */
export class ProcessIsolator {
  private contexts: ZMap<string, IsolationContext>;
  private activeCount: number;
  private maxContexts: number;

  constructor(maxContexts: number = 10) {
    this.contexts = new ZMap();
    this.activeCount = 0;
    this.maxContexts = maxContexts;
  }

  /**
   * Create a new isolation context
   */
  createContext(policy: SecurityPolicy = SecurityPolicies.SANDBOX): IsolationContext {
    if (this.activeCount >= this.maxContexts) {
      throw new Error(`Maximum contexts reached: ${this.maxContexts}`);
    }

    const context: IsolationContext = {
      id: this.generateId(),
      policy,
      memoryUsage: 0,
      cpuTime: 0,
      executionStart: Date.now(),
      lastActivity: Date.now(),
      state: 'IDLE'
    };

    this.contexts.set(context.id, context);
    this.activeCount++;
    
    return context;
  }

  /**
   * Execute code in an isolated context
   */
  async execute(
    code: string,
    policy: SecurityPolicy = SecurityPolicies.SANDBOX,
    options: {
      timeout?: number;
      memoryLimit?: number;
      input?: any;
    } = {}
  ): Promise<{ result?: any; error?: Error; context: IsolationContext }> {
    const context = this.createContext(policy);
    context.state = 'RUNNING';

    // Set timeout
    const timeout = options.timeout || policy.quotas.maxExecutionTime || 5000;
    const timeoutId = setTimeout(() => {
      this.terminate(context.id);
    }, timeout);

    try {
      // In a real implementation, we would execute the code in a sandbox
      // For now, we simulate it
      context.result = await this.simulateExecution(code, context, options.input);
      context.state = 'IDLE';
      return { result: context.result, context };
    } catch (error) {
      context.error = error as Error;
      context.state = 'IDLE';
      return { error: context.error, context };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Terminate a context
   */
  terminate(contextId: string): boolean {
    const context = this.contexts.get(contextId);
    if (context) {
      context.state = 'TERMINATED';
      this.contexts.delete(contextId);
      this.activeCount--;
      return true;
    }
    return false;
  }

  /**
   * Terminate all contexts
   */
  terminateAll(): number {
    const count = this.contexts.size();
    for (const [id] of this.contexts) {
      this.terminate(id);
    }
    return count;
  }

  /**
   * Get context by ID
   */
  getContext(contextId: string): IsolationContext | undefined {
    return this.contexts.get(contextId);
  }

  /**
   * Get all contexts
   */
  getContexts(): ZArray<IsolationContext> {
    return new ZArray([...this.contexts.values()]);
  }

  /**
   * Check if a permission is granted
   */
  hasPermission(contextId: string, permission: Permission): boolean {
    const context = this.contexts.get(contextId);
    if (!context) {
      return false;
    }
    return context.policy.permissions.has(permission);
  }

  /**
   * Check if a path is allowed
   */
  isPathAllowed(contextId: string, path: string): boolean {
    const context = this.contexts.get(contextId);
    if (!context) {
      return false;
    }

    const policy = context.policy;
    
    // Check blocked paths first
    if (policy.blockedPaths) {
      for (const blocked of policy.blockedPaths) {
        if (path.startsWith(blocked) || path.includes(blocked)) {
          return false;
        }
      }
    }

    // Check allowed paths
    if (policy.allowedPaths && policy.allowedPaths.length > 0) {
      for (const allowed of policy.allowedPaths) {
        if (path.startsWith(allowed)) {
          return true;
        }
      }
      return false;
    }

    return true;
  }

  /**
   * Check if a host is allowed
   */
  isHostAllowed(contextId: string, host: string): boolean {
    const context = this.contexts.get(contextId);
    if (!context) {
      return false;
    }

    const policy = context.policy;
    
    // Check blocked hosts first
    if (policy.blockedHosts) {
      for (const blocked of policy.blockedHosts) {
        if (host === blocked || host.endsWith(blocked)) {
          return false;
        }
      }
    }

    // Check allowed hosts
    if (policy.allowedHosts && policy.allowedHosts.length > 0) {
      for (const allowed of policy.allowedHosts) {
        if (host === allowed || host.endsWith(allowed)) {
          return true;
        }
      }
      return false;
    }

    return true;
  }

  /**
   * Check if a module is allowed
   */
  isModuleAllowed(contextId: string, moduleName: string): boolean {
    const context = this.contexts.get(contextId);
    if (!context) {
      return false;
    }

    const policy = context.policy;
    
    // Check blocked modules first
    if (policy.blockedModules) {
      for (const blocked of policy.blockedModules) {
        if (moduleName === blocked || moduleName.startsWith(blocked)) {
          return false;
        }
      }
    }

    // Check allowed modules
    if (policy.allowedModules && policy.allowedModules.length > 0) {
      for (const allowed of policy.allowedModules) {
        if (moduleName === allowed || moduleName.startsWith(allowed)) {
          return true;
        }
      }
      return false;
    }

    return true;
  }

  /**
   * Update context memory usage
   */
  updateMemoryUsage(contextId: string, delta: number): void {
    const context = this.contexts.get(contextId);
    if (context) {
      context.memoryUsage += delta;
      context.lastActivity = Date.now();
      
      // Check memory limit
      const limit = context.policy.quotas.maxMemory;
      if (limit && context.memoryUsage > limit) {
        this.terminate(contextId);
        throw new Error(`Memory limit exceeded: ${limit} bytes`);
      }
    }
  }

  /**
   * Update context CPU time
   */
  updateCPUTime(contextId: string, delta: number): void {
    const context = this.contexts.get(contextId);
    if (context) {
      context.cpuTime += delta;
      context.lastActivity = Date.now();
      
      // Check CPU time limit
      const limit = context.policy.quotas.maxCPUTime;
      if (limit && context.cpuTime > limit) {
        this.terminate(contextId);
        throw new Error(`CPU time limit exceeded: ${limit}ms`);
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalContexts: number;
    activeContexts: number;
    idleContexts: number;
    runningContexts: number;
    terminatedContexts: number;
  } {
    let idle = 0, running = 0, terminated = 0;
    
    for (const [, context] of this.contexts) {
      switch (context.state) {
        case 'IDLE': idle++; break;
        case 'RUNNING': running++; break;
        case 'TERMINATED': terminated++; break;
      }
    }

    return {
      totalContexts: this.contexts.size(),
      activeContexts: this.activeCount,
      idleContexts: idle,
      runningContexts: running,
      terminatedContexts: terminated
    };
  }

  /**
   * Simulate code execution (placeholder for actual implementation)
   */
  private async simulateExecution(
    code: string,
    context: IsolationContext,
    input?: any
  ): Promise<any> {
    // In a real implementation, this would execute the code in a sandbox
    // For now, we return a simple result
    return { executed: true, input, timestamp: Date.now() };
  }

  /**
   * Generate unique context ID
   */
  private generateId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Sandbox environment for secure execution
 */
export class Sandbox {
  private isolator: ProcessIsolator;
  private policy: SecurityPolicy;

  constructor(policy: SecurityPolicy = SecurityPolicies.SANDBOX) {
    this.isolator = new ProcessIsolator();
    this.policy = policy;
  }

  /**
   * Execute code in the sandbox
   */
  async execute(
    code: string,
    options: {
      timeout?: number;
      memoryLimit?: number;
      input?: any;
    } = {}
  ): Promise<{ result?: any; error?: Error }> {
    const { result, error } = await this.isolator.execute(
      code,
      this.policy,
      options
    );
    
    if (error) {
      throw error;
    }
    
    return { result };
  }

  /**
   * Evaluate an expression in the sandbox
   */
  async evaluate(
    expression: string,
    context: Record<string, any> = {}
  ): Promise<any> {
    // In a real implementation, we would evaluate the expression
    // For now, we return the expression itself
    return expression;
  }

  /**
   * Get sandbox policy
   */
  getPolicy(): SecurityPolicy {
    return this.policy;
  }

  /**
   * Set sandbox policy
   */
  setPolicy(policy: SecurityPolicy): void {
    this.policy = policy;
  }

  /**
   * Get sandbox statistics
   */
  getStats() {
    return this.isolator.getStats();
  }
}

/**
 * Global sandbox instance
 */
export const globalSandbox = new Sandbox();

export type IsolationValue = ProcessIsolator | Sandbox;
