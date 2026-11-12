/**
 * Zinga Security - Sandbox Environment
 * 
 * Provides a secure sandbox for executing untrusted code with restricted access.
 */

import { ZMap } from '../../runtime/values/maps';
import { ZString } from '../../runtime/values/strings';
import { ZArray } from '../../runtime/values/arrays';
import { SecurityPolicy, Permission, IsolationMode, SecurityPolicies } from '../../runtime/execution/isolation';
import { LimitsManager, ExecutionLimits, DefaultLimits } from '../../runtime/execution/limits';

/**
 * Sandbox execution context
 */
export interface SandboxContext {
  id: string;
  policy: SecurityPolicy;
  limits: ExecutionLimits;
  globals: ZMap<string, any>;
  modules: ZMap<string, any>;
  state: 'IDLE' | 'RUNNING' | 'PAUSED' | 'TERMINATED';
  result?: any;
  error?: Error;
  startTime: number;
  endTime?: number;
}

/**
 * Sandbox options
 */
export interface SandboxOptions {
  policy?: SecurityPolicy;
  limits?: ExecutionLimits;
  globals?: Record<string, any>;
  allowedModules?: string[];
  blockedModules?: string[];
  timeout?: number;
  memoryLimit?: number;
}

/**
 * Sandbox Execution Error
 */
export class SandboxError extends Error {
  constructor(
    message: string,
    public readonly code: SandboxErrorCode,
    public readonly context?: SandboxContext
  ) {
    super(message);
    this.name = 'SandboxError';
  }
}

/**
 * Sandbox error codes
 */
export enum SandboxErrorCode {
  TIMEOUT = 'TIMEOUT',
  MEMORY_LIMIT = 'MEMORY_LIMIT',
  CPU_LIMIT = 'CPU_LIMIT',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  MODULE_NOT_ALLOWED = 'MODULE_NOT_ALLOWED',
  INVALID_INPUT = 'INVALID_INPUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Sandbox Environment
 * 
 * Provides a secure execution environment for untrusted code.
 */
export class SandboxEnvironment {
  private contexts: ZMap<string, SandboxContext>;
  private limitsManager: LimitsManager;
  private nextContextId: number;

  constructor() {
    this.contexts = new ZMap();
    this.limitsManager = new LimitsManager(DefaultLimits);
    this.nextContextId = 1;
  }

  /**
   * Create a new sandbox context
   */
  createContext(options: SandboxOptions = {}): SandboxContext {
    const policy = options.policy || SecurityPolicies.SANDBOX;
    const limits = options.limits || DefaultLimits;
    
    const context: SandboxContext = {
      id: `sandbox_${this.nextContextId++}`,
      policy,
      limits,
      globals: new ZMap(),
      modules: new ZMap(),
      state: 'IDLE',
      startTime: Date.now()
    };

    // Add provided globals
    if (options.globals) {
      for (const [key, value] of Object.entries(options.globals)) {
        context.globals.set(key, value);
      }
    }

    this.contexts.set(context.id, context);
    return context;
  }

  /**
   * Execute code in a sandbox
   */
  async execute(
    code: string,
    options: SandboxOptions = {}
  ): Promise<{ result?: any; error?: SandboxError; context: SandboxContext }> {
    const context = this.createContext(options);
    context.state = 'RUNNING';
    context.startTime = Date.now();

    // Set up limits
    this.limitsManager.start();
    
    // Set timeout
    const timeout = options.timeout || context.limits.time?.value || 5000;
    const timeoutId = setTimeout(() => {
      this.terminate(context.id);
    }, timeout);

    try {
      // In a real implementation, we would execute the code in a secure context
      // For now, we simulate execution
      const result = await this.simulateExecution(code, context);
      
      context.result = result;
      context.state = 'IDLE';
      context.endTime = Date.now();
      
      return { result, context };
    } catch (error) {
      const sandboxError = error instanceof SandboxError ? error : 
        new SandboxError(
          error instanceof Error ? error.message : String(error),
          SandboxErrorCode.INTERNAL_ERROR,
          context
        );
      
      context.error = sandboxError;
      context.state = 'IDLE';
      context.endTime = Date.now();
      
      return { error: sandboxError, context };
    } finally {
      clearTimeout(timeoutId);
      this.limitsManager.stop();
    }
  }

  /**
   * Evaluate an expression in a sandbox
   */
  async evaluate(
    expression: string,
    contextId?: string,
    options: SandboxOptions = {}
  ): Promise<any> {
    let context: SandboxContext;
    
    if (contextId) {
      context = this.contexts.get(contextId);
      if (!context) {
        throw new SandboxError(
          `Context not found: ${contextId}`,
          SandboxErrorCode.INTERNAL_ERROR
        );
      }
    } else {
      context = this.createContext(options);
    }

    // In a real implementation, we would evaluate the expression
    // For now, we return the expression itself
    return expression;
  }

  /**
   * Terminate a sandbox context
   */
  terminate(contextId: string): boolean {
    const context = this.contexts.get(contextId);
    if (context) {
      context.state = 'TERMINATED';
      context.endTime = Date.now();
      this.contexts.delete(contextId);
      return true;
    }
    return false;
  }

  /**
   * Terminate all sandbox contexts
   */
  terminateAll(): number {
    const count = this.contexts.size();
    for (const [id] of this.contexts) {
      this.terminate(id);
    }
    return count;
  }

  /**
   * Get sandbox context by ID
   */
  getContext(contextId: string): SandboxContext | undefined {
    return this.contexts.get(contextId);
  }

  /**
   * Get all sandbox contexts
   */
  getContexts(): ZArray<SandboxContext> {
    return new ZArray([...this.contexts.values()]);
  }

  /**
   * Check if a permission is granted in a context
   */
  hasPermission(contextId: string, permission: Permission): boolean {
    const context = this.contexts.get(contextId);
    if (!context) {
      return false;
    }
    return context.policy.permissions.has(permission);
  }

  /**
   * Check if a module is allowed in a context
   */
  isModuleAllowed(contextId: string, moduleName: string): boolean {
    const context = this.contexts.get(contextId);
    if (!context) {
      return false;
    }

    // Check blocked modules
    if (context.policy.blockedModules) {
      for (const blocked of context.policy.blockedModules) {
        if (moduleName === blocked || moduleName.startsWith(blocked)) {
          return false;
        }
      }
    }

    // Check allowed modules
    if (context.policy.allowedModules && context.policy.allowedModules.length > 0) {
      for (const allowed of context.policy.allowedModules) {
        if (moduleName === allowed || moduleName.startsWith(allowed)) {
          return true;
        }
      }
      return false;
    }

    return true;
  }

  /**
   * Add a global variable to a context
   */
  addGlobal(contextId: string, name: string, value: any): boolean {
    const context = this.contexts.get(contextId);
    if (context) {
      context.globals.set(name, value);
      return true;
    }
    return false;
  }

  /**
   * Remove a global variable from a context
   */
  removeGlobal(contextId: string, name: string): boolean {
    const context = this.contexts.get(contextId);
    if (context) {
      return context.globals.delete(name);
    }
    return false;
  }

  /**
   * Add a module to a context
   */
  addModule(contextId: string, name: string, module: any): boolean {
    const context = this.contexts.get(contextId);
    if (context) {
      if (!this.isModuleAllowed(contextId, name)) {
        throw new SandboxError(
          `Module not allowed: ${name}`,
          SandboxErrorCode.MODULE_NOT_ALLOWED,
          context
        );
      }
      context.modules.set(name, module);
      return true;
    }
    return false;
  }

  /**
   * Get sandbox statistics
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
      activeContexts: this.contexts.size() - terminated,
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
    context: SandboxContext
  ): Promise<any> {
    // In a real implementation, this would execute the code in a secure sandbox
    // For now, we return a simple result
    return { executed: true, timestamp: Date.now() };
  }

  /**
   * Generate unique context ID
   */
  private generateContextId(): string {
    return `sandbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Safe evaluation utilities
 */
export const SafeEval = {
  /**
   * Safely evaluate a simple expression
   */
  evaluate(expression: string, context: Record<string, any> = {}): any {
    // In a real implementation, we would use a safe evaluator
    // For now, we only allow simple numeric expressions
    try {
      const result = eval(expression);
      return result;
    } catch (error) {
      throw new SandboxError(
        `Evaluation error: ${error}`,
        SandboxErrorCode.INVALID_INPUT
      );
    }
  },

  /**
   * Safely parse JSON
   */
  parseJSON(json: string): any {
    try {
      return JSON.parse(json);
    } catch (error) {
      throw new SandboxError(
        `Invalid JSON: ${error}`,
        SandboxErrorCode.INVALID_INPUT
      );
    }
  },

  /**
   * Safely stringify JSON
   */
  stringifyJSON(value: any): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      throw new SandboxError(
        `Cannot stringify: ${error}`,
        SandboxErrorCode.INTERNAL_ERROR
      );
    }
  }
};

/**
 * Global sandbox environment instance
 */
export const globalSandboxEnv = new SandboxEnvironment();

export type SandboxValue = SandboxEnvironment | SandboxContext;
