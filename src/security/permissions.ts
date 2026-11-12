/**
 * Zinga Security - Permission System
 * 
 * Manages permissions for code execution and resource access.
 */

import { ZMap } from '../../runtime/values/maps';
import { ZString } from '../../runtime/values/strings';
import { ZArray } from '../../runtime/values/arrays';
import { Permission, SecurityPolicy } from '../../runtime/execution/isolation';

/**
 * Permission categories
 */
export enum PermissionCategory {
  FILESYSTEM = 'FILESYSTEM',
  NETWORK = 'NETWORK',
  PROCESS = 'PROCESS',
  MEMORY = 'MEMORY',
  TIME = 'TIME',
  SYSTEM = 'SYSTEM',
  CUSTOM = 'CUSTOM'
}

/**
 * Permission categories mapping
 */
export const PermissionCategories: Record<PermissionCategory, Set<Permission>> = {
  [PermissionCategory.FILESYSTEM]: new Set([
    Permission.FILESYSTEM_READ,
    Permission.FILESYSTEM_WRITE,
    Permission.FILESYSTEM_DELETE
  ]),
  [PermissionCategory.NETWORK]: new Set([
    Permission.NETWORK_CONNECT,
    Permission.NETWORK_BIND
  ]),
  [PermissionCategory.PROCESS]: new Set([
    Permission.PROCESS_EXEC,
    Permission.PROCESS_FORK
  ]),
  [PermissionCategory.MEMORY]: new Set([
    Permission.MEMORY_ACCESS
  ]),
  [PermissionCategory.TIME]: new Set([
    Permission.TIME_ACCESS
  ]),
  [PermissionCategory.SYSTEM]: new Set([
    Permission.ENV_ACCESS,
    Permission.RANDOM_ACCESS
  ]),
  [PermissionCategory.CUSTOM]: new Set()
};

/**
 * Permission request
 */
export interface PermissionRequest {
  permission: Permission;
  context?: string;
  resource?: string;
  reason?: string;
  timestamp: number;
}

/**
 * Permission result
 */
export interface PermissionResult {
  granted: boolean;
  permission: Permission;
  context?: string;
  resource?: string;
  reason?: string;
  error?: string;
}

/**
 * Permission denied error
 */
export class PermissionDeniedError extends Error {
  constructor(
    message: string,
    public readonly permission: Permission,
    public readonly context?: string,
    public readonly resource?: string
  ) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * Permission Manager
 * 
 * Manages and checks permissions for code execution.
 */
export class PermissionManager {
  private policies: ZMap<string, SecurityPolicy>;
  private defaultPolicy: SecurityPolicy;
  private requests: ZArray<PermissionRequest>;
  private results: ZArray<PermissionResult>;

  constructor(defaultPolicy: SecurityPolicy) {
    this.policies = new ZMap();
    this.defaultPolicy = defaultPolicy;
    this.requests = new ZArray();
    this.results = new ZArray();
  }

  /**
   * Check if a permission is granted
   */
  check(permission: Permission, context?: string): boolean {
    const policy = this.getPolicy(context);
    return policy.permissions.has(permission);
  }

  /**
   * Check multiple permissions
   */
  checkMultiple(permissions: Permission[], context?: string): boolean {
    const policy = this.getPolicy(context);
    return permissions.every(p => policy.permissions.has(p));
  }

  /**
   * Request a permission
   */
  request(
    permission: Permission,
    context?: string,
    resource?: string,
    reason?: string
  ): PermissionResult {
    const policy = this.getPolicy(context);
    const granted = policy.permissions.has(permission);
    
    const request: PermissionRequest = {
      permission,
      context,
      resource,
      reason,
      timestamp: Date.now()
    };
    
    this.requests.push(request);
    
    const result: PermissionResult = {
      granted,
      permission,
      context,
      resource,
      reason
    };
    
    if (!granted) {
      result.error = `Permission denied: ${permission}`;
    }
    
    this.results.push(result);
    return result;
  }

  /**
   * Request multiple permissions
   */
  requestMultiple(
    permissions: Permission[],
    context?: string,
    resource?: string,
    reason?: string
  ): PermissionResult[] {
    return permissions.map(permission => 
      this.request(permission, context, resource, reason)
    );
  }

  /**
   * Check all permissions in a category
   */
  checkCategory(category: PermissionCategory, context?: string): boolean {
    const permissions = PermissionCategories[category];
    return [...permissions].every(p => this.check(p, context));
  }

  /**
   * Get permissions by category
   */
  getPermissionsByCategory(category: PermissionCategory): Set<Permission> {
    return new Set(PermissionCategories[category]);
  }

  /**
   * Get all permissions
   */
  getAllPermissions(): Set<Permission> {
    const all = new Set<Permission>();
    for (const category of Object.values(PermissionCategory)) {
      const permissions = PermissionCategories[category as PermissionCategory];
      for (const permission of permissions) {
        all.add(permission);
      }
    }
    return all;
  }

  /**
   * Add a policy
   */
  addPolicy(name: string, policy: SecurityPolicy): void {
    this.policies.set(name, policy);
  }

  /**
   * Remove a policy
   */
  removePolicy(name: string): boolean {
    return this.policies.delete(name);
  }

  /**
   * Get policy by name
   */
  getPolicy(name?: string): SecurityPolicy {
    if (name) {
      const policy = this.policies.get(name);
      if (policy) {
        return policy;
      }
    }
    return this.defaultPolicy;
  }

  /**
   * Set default policy
   */
  setDefaultPolicy(policy: SecurityPolicy): void {
    this.defaultPolicy = policy;
  }

  /**
   * Get default policy
   */
  getDefaultPolicy(): SecurityPolicy {
    return this.defaultPolicy;
  }

  /**
   * Get all policies
   */
  getPolicies(): ZMap<string, SecurityPolicy> {
    return this.policies;
  }

  /**
   * Get permission requests
   */
  getRequests(): ZArray<PermissionRequest> {
    return this.requests;
  }

  /**
   * Get permission results
   */
  getResults(): ZArray<PermissionResult> {
    return this.results;
  }

  /**
   * Clear permission history
   */
  clearHistory(): void {
    this.requests = new ZArray();
    this.results = new ZArray();
  }

  /**
   * Assert permission (throw if not granted)
   */
  assert(
    permission: Permission,
    context?: string,
    resource?: string,
    message?: string
  ): void {
    if (!this.check(permission, context)) {
      throw new PermissionDeniedError(
        message || `Permission denied: ${permission}`,
        permission,
        context,
        resource
      );
    }
  }

  /**
   * Assert multiple permissions (throw if any not granted)
   */
  assertMultiple(
    permissions: Permission[],
    context?: string,
    resource?: string,
    message?: string
  ): void {
    for (const permission of permissions) {
      this.assert(permission, context, resource, message);
    }
  }

  /**
   * Create a permission builder
   */
  static create(): PermissionBuilder {
    return new PermissionBuilder();
  }
}

/**
 * Permission builder for fluent permission creation
 */
export class PermissionBuilder {
  private permissions: Set<Permission>;

  constructor() {
    this.permissions = new Set();
  }

  /**
   * Add a permission
   */
  add(permission: Permission): this {
    this.permissions.add(permission);
    return this;
  }

  /**
   * Add all permissions from a category
   */
  addCategory(category: PermissionCategory): this {
    const permissions = PermissionCategories[category];
    for (const permission of permissions) {
      this.permissions.add(permission);
    }
    return this;
  }

  /**
   * Add all permissions
   */
  addAll(): this {
    for (const category of Object.values(PermissionCategory)) {
      this.addCategory(category as PermissionCategory);
    }
    return this;
  }

  /**
   * Remove a permission
   */
  remove(permission: Permission): this {
    this.permissions.delete(permission);
    return this;
  }

  /**
   * Remove all permissions from a category
   */
  removeCategory(category: PermissionCategory): this {
    const permissions = PermissionCategories[category];
    for (const permission of permissions) {
      this.permissions.delete(permission);
    }
    return this;
  }

  /**
   * Build the permission set
   */
  build(): Set<Permission> {
    return new Set(this.permissions);
  }

  /**
   * Build a security policy
   */
  buildPolicy(mode: IsolationMode = IsolationMode.SANDBOX): SecurityPolicy {
    return {
      mode,
      permissions: this.build(),
      quotas: {}
    };
  }
}

/**
 * Predefined permission sets
 */
export const PermissionSets = {
  // No permissions
  NONE: new Set<Permission>(),

  // Read-only filesystem
  FILESYSTEM_READ_ONLY: new Set([
    Permission.FILESYSTEM_READ
  ]),

  // Full filesystem access
  FILESYSTEM_FULL: new Set([
    Permission.FILESYSTEM_READ,
    Permission.FILESYSTEM_WRITE,
    Permission.FILESYSTEM_DELETE
  ]),

  // Network client access
  NETWORK_CLIENT: new Set([
    Permission.NETWORK_CONNECT
  ]),

  // Network server access
  NETWORK_SERVER: new Set([
    Permission.NETWORK_BIND,
    Permission.NETWORK_CONNECT
  ]),

  // Full network access
  NETWORK_FULL: new Set([
    Permission.NETWORK_CONNECT,
    Permission.NETWORK_BIND
  ]),

  // Process execution
  PROCESS_EXEC: new Set([
    Permission.PROCESS_EXEC
  ]),

  // Full process access
  PROCESS_FULL: new Set([
    Permission.PROCESS_EXEC,
    Permission.PROCESS_FORK
  ]),

  // Basic system access
  SYSTEM_BASIC: new Set([
    Permission.TIME_ACCESS,
    Permission.RANDOM_ACCESS
  ]),

  // Full system access
  SYSTEM_FULL: new Set([
    Permission.TIME_ACCESS,
    Permission.RANDOM_ACCESS,
    Permission.ENV_ACCESS,
    Permission.MEMORY_ACCESS
  ]),

  // All permissions
  ALL: new Set([
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
  ])
};

/**
 * Global permission manager instance
 */
export const globalPermissionManager = new PermissionManager({
  mode: IsolationMode.SANDBOX,
  permissions: PermissionSets.NONE,
  quotas: {}
});

export type PermissionValue = PermissionManager | PermissionBuilder;
