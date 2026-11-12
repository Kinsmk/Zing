/**
 * Zinga Security - Security Policy
 * 
 * Defines and manages security policies for the language.
 */

import { ZMap } from '../../runtime/values/maps';
import { ZString } from '../../runtime/values/strings';
import { ZArray } from '../../runtime/values/arrays';
import { 
  SecurityPolicy, 
  Permission, 
  ResourceQuota,
  IsolationMode,
  SecurityPolicies 
} from '../../runtime/execution/isolation';
import { PermissionManager, PermissionSets } from './permissions';
import { CapabilitySystem, CapabilityType } from './capability-system';
import { ResourceQuotaManager, DefaultQuotas } from './resource-quotas';

/**
 * Security policy types
 */
export enum SecurityPolicyType {
  STRICT = 'STRICT',
  SANDBOX = 'SANDBOX',
  TRUSTED = 'TRUSTED',
  UNRESTRICTED = 'UNRESTRICTED',
  CUSTOM = 'CUSTOM'
}

/**
 * Security policy builder
 */
export interface SecurityPolicyBuilder {
  name: string;
  type: SecurityPolicyType;
  description?: string;
  isolationMode?: IsolationMode;
  permissions?: Set<Permission>;
  capabilities?: Set<CapabilityType | string>;
  quotas?: ResourceQuota;
  allowedPaths?: string[];
  blockedPaths?: string[];
  allowedHosts?: string[];
  blockedHosts?: string[];
  allowedModules?: string[];
  blockedModules?: string[];
  maxExecutionTime?: number;
  maxMemory?: number;
  maxCPUTime?: number;
}

/**
 * Security policy validation result
 */
export interface SecurityPolicyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Security policy error
 */
export class SecurityPolicyError extends Error {
  constructor(
    message: string,
    public readonly policyName?: string,
    public readonly errors?: string[]
  ) {
    super(message);
    this.name = 'SecurityPolicyError';
  }
}

/**
 * Security Policy Manager
 * 
 * Manages security policies for the Zinga language.
 */
export class SecurityPolicyManager {
  private policies: ZMap<string, SecurityPolicy>;
  private policyBuilders: ZMap<string, SecurityPolicyBuilder>;
  private activePolicy: string;
  private permissionManager: PermissionManager;
  private capabilitySystem: CapabilitySystem;
  private quotaManager: ResourceQuotaManager;

  constructor() {
    this.policies = new ZMap();
    this.policyBuilders = new ZMap();
    this.activePolicy = 'default';
    this.permissionManager = new PermissionManager(SecurityPolicies.SANDBOX);
    this.capabilitySystem = new CapabilitySystem();
    this.quotaManager = new ResourceQuotaManager();

    // Register default policies
    this.registerDefaultPolicies();
  }

  /**
   * Register a security policy
   */
  registerPolicy(name: string, policy: SecurityPolicy): void {
    this.policies.set(name, policy);
    
    // Set as active if it's the first policy
    if (this.policies.size() === 1) {
      this.activePolicy = name;
    }
  }

  /**
   * Register a policy from a builder
   */
  registerPolicyFromBuilder(name: string, builder: SecurityPolicyBuilder): void {
    const policy: SecurityPolicy = {
      mode: builder.isolationMode || IsolationMode.SANDBOX,
      permissions: builder.permissions || new Set(),
      quotas: builder.quotas || {},
      allowedPaths: builder.allowedPaths,
      blockedPaths: builder.blockedPaths,
      allowedHosts: builder.allowedHosts,
      blockedHosts: builder.blockedHosts,
      allowedModules: builder.allowedModules,
      blockedModules: builder.blockedModules
    };

    this.policies.set(name, policy);
    
    // Store the builder
    this.policyBuilders.set(name, builder);
    
    // Set as active if it's the first policy
    if (this.policies.size() === 1) {
      this.activePolicy = name;
    }
  }

  /**
   * Unregister a security policy
   */
  unregisterPolicy(name: string): boolean {
    return this.policies.delete(name) && this.policyBuilders.delete(name);
  }

  /**
   * Get a security policy
   */
  getPolicy(name?: string): SecurityPolicy {
    const policyName = name || this.activePolicy;
    const policy = this.policies.get(policyName);
    
    if (!policy) {
      throw new SecurityPolicyError(
        `Policy not found: ${policyName}`,
        policyName
      );
    }
    
    return policy;
  }

  /**
   * Get all security policies
   */
  getPolicies(): ZMap<string, SecurityPolicy> {
    return new ZMap(this.policies);
  }

  /**
   * Get the active policy
   */
  getActivePolicy(): SecurityPolicy {
    return this.getPolicy();
  }

  /**
   * Get the active policy name
   */
  getActivePolicyName(): string {
    return this.activePolicy;
  }

  /**
   * Set the active policy
   */
  setActivePolicy(name: string): void {
    if (!this.policies.has(name)) {
      throw new SecurityPolicyError(
        `Policy not found: ${name}`,
        name
      );
    }
    this.activePolicy = name;
  }

  /**
   * Get a policy builder
   */
  getPolicyBuilder(name: string): SecurityPolicyBuilder | undefined {
    return this.policyBuilders.get(name);
  }

  /**
   * Get all policy builders
   */
  getPolicyBuilders(): ZMap<string, SecurityPolicyBuilder> {
    return new ZMap(this.policyBuilders);
  }

  /**
   * Validate a security policy
   */
  validatePolicy(policy: SecurityPolicy): SecurityPolicyValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check isolation mode
    const validModes = Object.values(IsolationMode);
    if (!validModes.includes(policy.mode)) {
      errors.push(`Invalid isolation mode: ${policy.mode}`);
    }

    // Check permissions
    const validPermissions = Object.values(Permission);
    for (const permission of policy.permissions) {
      if (!validPermissions.includes(permission)) {
        errors.push(`Invalid permission: ${permission}`);
      }
    }

    // Check quotas
    if (policy.quotas) {
      if (policy.quotas.maxMemory && policy.quotas.maxMemory < 0) {
        errors.push('maxMemory cannot be negative');
      }
      if (policy.quotas.maxCPUTime && policy.quotas.maxCPUTime < 0) {
        errors.push('maxCPUTime cannot be negative');
      }
      if (policy.quotas.maxExecutionTime && policy.quotas.maxExecutionTime < 0) {
        errors.push('maxExecutionTime cannot be negative');
      }
      if (policy.quotas.maxFileDescriptors && policy.quotas.maxFileDescriptors < 0) {
        errors.push('maxFileDescriptors cannot be negative');
      }
      if (policy.quotas.maxNetworkConnections && policy.quotas.maxNetworkConnections < 0) {
        errors.push('maxNetworkConnections cannot be negative');
      }
    }

    // Check for conflicting permissions
    const hasFilesystem = policy.permissions.has(Permission.FILESYSTEM_READ) ||
                         policy.permissions.has(Permission.FILESYSTEM_WRITE) ||
                         policy.permissions.has(Permission.FILESYSTEM_DELETE);
    const hasNetwork = policy.permissions.has(Permission.NETWORK_CONNECT) ||
                      policy.permissions.has(Permission.NETWORK_BIND);
    const hasProcess = policy.permissions.has(Permission.PROCESS_EXEC) ||
                      policy.permissions.has(Permission.PROCESS_FORK);

    if (policy.mode === IsolationMode.NONE && (hasFilesystem || hasNetwork || hasProcess)) {
      warnings.push('NONE isolation mode with filesystem, network, or process permissions may not be secure');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create a security policy builder
   */
  createBuilder(name: string, type: SecurityPolicyType = SecurityPolicyType.CUSTOM): SecurityPolicyBuilder {
    return {
      name,
      type,
      isolationMode: this.getIsolationModeForType(type),
      permissions: this.getPermissionsForType(type),
      quotas: this.getQuotasForType(type)
    };
  }

  /**
   * Build a security policy
   */
  buildPolicy(builder: SecurityPolicyBuilder): SecurityPolicy {
    return {
      mode: builder.isolationMode || IsolationMode.SANDBOX,
      permissions: builder.permissions || new Set(),
      quotas: builder.quotas || {},
      allowedPaths: builder.allowedPaths,
      blockedPaths: builder.blockedPaths,
      allowedHosts: builder.allowedHosts,
      blockedHosts: builder.blockedHosts,
      allowedModules: builder.allowedModules,
      blockedModules: builder.blockedModules
    };
  }

  /**
   * Get permission manager
   */
  getPermissionManager(): PermissionManager {
    return this.permissionManager;
  }

  /**
   * Get capability system
   */
  getCapabilitySystem(): CapabilitySystem {
    return this.capabilitySystem;
  }

  /**
   * Get quota manager
   */
  getQuotaManager(): ResourceQuotaManager {
    return this.quotaManager;
  }

  /**
   * Register default policies
   */
  private registerDefaultPolicies(): void {
    // Strict policy
    this.registerPolicy('strict', {
      mode: IsolationMode.PROCESS,
      permissions: new Set([
        Permission.TIME_ACCESS,
        Permission.RANDOM_ACCESS
      ]),
      quotas: {
        maxMemory: 64 * 1024 * 1024, // 64MB
        maxCPUTime: 2000, // 2 seconds
        maxExecutionTime: 1000 // 1 second
      },
      blockedPaths: ['/', '/etc', '/usr', '/bin', '/sbin'],
      blockedHosts: ['*'],
      blockedModules: ['*']
    });

    // Sandbox policy
    this.registerPolicy('sandbox', SecurityPolicies.SANDBOX);

    // Trusted policy
    this.registerPolicy('trusted', SecurityPolicies.TRUSTED);

    // Unrestricted policy
    this.registerPolicy('unrestricted', SecurityPolicies.UNRESTRICTED);

    // Set sandbox as active
    this.activePolicy = 'sandbox';
  }

  /**
   * Get isolation mode for policy type
   */
  private getIsolationModeForType(type: SecurityPolicyType): IsolationMode {
    switch (type) {
      case SecurityPolicyType.STRICT: return IsolationMode.PROCESS;
      case SecurityPolicyType.SANDBOX: return IsolationMode.SANDBOX;
      case SecurityPolicyType.TRUSTED: return IsolationMode.SANDBOX;
      case SecurityPolicyType.UNRESTRICTED: return IsolationMode.NONE;
      default: return IsolationMode.SANDBOX;
    }
  }

  /**
   * Get permissions for policy type
   */
  private getPermissionsForType(type: SecurityPolicyType): Set<Permission> {
    switch (type) {
      case SecurityPolicyType.STRICT: return PermissionSets.NONE;
      case SecurityPolicyType.SANDBOX: return PermissionSets.SYSTEM_BASIC;
      case SecurityPolicyType.TRUSTED: return PermissionSets.NETWORK_CLIENT;
      case SecurityPolicyType.UNRESTRICTED: return PermissionSets.ALL;
      default: return new Set();
    }
  }

  /**
   * Get quotas for policy type
   */
  private getQuotasForType(type: SecurityPolicyType): ResourceQuota {
    switch (type) {
      case SecurityPolicyType.STRICT:
        return {
          maxMemory: 64 * 1024 * 1024, // 64MB
          maxCPUTime: 2000, // 2 seconds
          maxExecutionTime: 1000 // 1 second
        };
      case SecurityPolicyType.SANDBOX:
        return {
          maxMemory: 128 * 1024 * 1024, // 128MB
          maxCPUTime: 5000, // 5 seconds
          maxExecutionTime: 5000 // 5 seconds
        };
      case SecurityPolicyType.TRUSTED:
        return {
          maxMemory: 512 * 1024 * 1024, // 512MB
          maxCPUTime: 30000, // 30 seconds
          maxExecutionTime: 30000 // 30 seconds
        };
      case SecurityPolicyType.UNRESTRICTED:
        return {};
      default:
        return {};
    }
  }
}

/**
 * Security Policy Builder (fluent interface)
 */
export class SecurityPolicyBuilderFluent {
  private name: string;
  private type: SecurityPolicyType;
  private description: string = '';
  private isolationMode: IsolationMode = IsolationMode.SANDBOX;
  private permissions: Set<Permission> = new Set();
  private capabilities: Set<CapabilityType | string> = new Set();
  private quotas: ResourceQuota = {};
  private allowedPaths: string[] = [];
  private blockedPaths: string[] = [];
  private allowedHosts: string[] = [];
  private blockedHosts: string[] = [];
  private allowedModules: string[] = [];
  private blockedModules: string[] = [];

  constructor(name: string, type: SecurityPolicyType = SecurityPolicyType.CUSTOM) {
    this.name = name;
    this.type = type;
  }

  withDescription(description: string): this {
    this.description = description;
    return this;
  }

  withIsolationMode(mode: IsolationMode): this {
    this.isolationMode = mode;
    return this;
  }

  withPermission(permission: Permission): this {
    this.permissions.add(permission);
    return this;
  }

  withPermissions(permissions: Permission[]): this {
    for (const permission of permissions) {
      this.permissions.add(permission);
    }
    return this;
  }

  withPermissionSet(set: Set<Permission>): this {
    for (const permission of set) {
      this.permissions.add(permission);
    }
    return this;
  }

  withCapability(capability: CapabilityType | string): this {
    this.capabilities.add(capability);
    return this;
  }

  withCapabilities(capabilities: (CapabilityType | string)[]): this {
    for (const capability of capabilities) {
      this.capabilities.add(capability);
    }
    return this;
  }

  withQuota(quota: ResourceQuota): this {
    this.quotas = { ...this.quotas, ...quota };
    return this;
  }

  withMaxMemory(max: number): this {
    this.quotas.maxMemory = max;
    return this;
  }

  withMaxCPUTime(max: number): this {
    this.quotas.maxCPUTime = max;
    return this;
  }

  withMaxExecutionTime(max: number): this {
    this.quotas.maxExecutionTime = max;
    return this;
  }

  withMaxFileDescriptors(max: number): this {
    this.quotas.maxFileDescriptors = max;
    return this;
  }

  withMaxNetworkConnections(max: number): this {
    this.quotas.maxNetworkConnections = max;
    return this;
  }

  allowPath(path: string): this {
    this.allowedPaths.push(path);
    return this;
  }

  allowPaths(paths: string[]): this {
    this.allowedPaths.push(...paths);
    return this;
  }

  blockPath(path: string): this {
    this.blockedPaths.push(path);
    return this;
  }

  blockPaths(paths: string[]): this {
    this.blockedPaths.push(...paths);
    return this;
  }

  allowHost(host: string): this {
    this.allowedHosts.push(host);
    return this;
  }

  allowHosts(hosts: string[]): this {
    this.allowedHosts.push(...hosts);
    return this;
  }

  blockHost(host: string): this {
    this.blockedHosts.push(host);
    return this;
  }

  blockHosts(hosts: string[]): this {
    this.blockedHosts.push(...hosts);
    return this;
  }

  allowModule(module: string): this {
    this.allowedModules.push(module);
    return this;
  }

  allowModules(modules: string[]): this {
    this.allowedModules.push(...modules);
    return this;
  }

  blockModule(module: string): this {
    this.blockedModules.push(module);
    return this;
  }

  blockModules(modules: string[]): this {
    this.blockedModules.push(...modules);
    return this;
  }

  build(): SecurityPolicy {
    return {
      mode: this.isolationMode,
      permissions: this.permissions,
      quotas: this.quotas,
      allowedPaths: this.allowedPaths,
      blockedPaths: this.blockedPaths,
      allowedHosts: this.allowedHosts,
      blockedHosts: this.blockedHosts,
      allowedModules: this.allowedModules,
      blockedModules: this.blockedModules
    };
  }

  buildAndRegister(manager: SecurityPolicyManager): SecurityPolicy {
    const policy = this.build();
    manager.registerPolicy(this.name, policy);
    return policy;
  }
}

/**
 * Global security policy manager instance
 */
export const globalSecurityPolicyManager = new SecurityPolicyManager();

/**
 * Create a security policy builder
 */
export function createSecurityPolicy(name: string, type: SecurityPolicyType = SecurityPolicyType.CUSTOM): SecurityPolicyBuilderFluent {
  return new SecurityPolicyBuilderFluent(name, type);
}

export type SecurityPolicyValue = SecurityPolicyManager | SecurityPolicyBuilderFluent;
