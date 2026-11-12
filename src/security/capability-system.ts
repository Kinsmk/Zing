/**
 * Zinga Security - Capability System
 * 
 * Implements a capability-based security model where permissions are
 * granted based on capabilities rather than identity.
 */

import { ZMap } from '../../runtime/values/maps';
import { ZString } from '../../runtime/values/strings';
import { ZArray } from '../../runtime/values/arrays';
import { Permission, PermissionManager } from './permissions';

/**
 * Capability types
 */
export enum CapabilityType {
  // File system capabilities
  FILE_READ = 'FILE_READ',
  FILE_WRITE = 'FILE_WRITE',
  FILE_DELETE = 'FILE_DELETE',
  FILE_LIST = 'FILE_LIST',
  
  // Network capabilities
  NETWORK_CONNECT = 'NETWORK_CONNECT',
  NETWORK_BIND = 'NETWORK_BIND',
  NETWORK_LISTEN = 'NETWORK_LISTEN',
  
  // Process capabilities
  PROCESS_EXEC = 'PROCESS_EXEC',
  PROCESS_FORK = 'PROCESS_FORK',
  PROCESS_KILL = 'PROCESS_KILL',
  
  // System capabilities
  SYSTEM_TIME = 'SYSTEM_TIME',
  SYSTEM_RANDOM = 'SYSTEM_RANDOM',
  SYSTEM_ENV = 'SYSTEM_ENV',
  SYSTEM_MEMORY = 'SYSTEM_MEMORY',
  
  // Custom capabilities
  CUSTOM = 'CUSTOM'
}

/**
 * Capability interface
 */
export interface Capability {
  type: CapabilityType | string;
  name: string;
  description?: string;
  permissions: Set<Permission>;
  resources?: string[];
  constraints?: Record<string, any>;
}

/**
 * Capability token
 */
export interface CapabilityToken {
  id: string;
  capability: CapabilityType | string;
  context?: string;
  issuedAt: number;
  expiresAt?: number;
  metadata?: Record<string, any>;
}

/**
 * Capability request
 */
export interface CapabilityRequest {
  capability: CapabilityType | string;
  context?: string;
  reason?: string;
  constraints?: Record<string, any>;
  timestamp: number;
}

/**
 * Capability System
 * 
 * Implements capability-based security for fine-grained access control.
 */
export class CapabilitySystem {
  private capabilities: ZMap<CapabilityType | string, Capability>;
  private tokens: ZMap<string, CapabilityToken>;
  private tokenIndex: ZMap<string, Set<string>>; // capability -> token IDs
  private permissionManager: PermissionManager;

  constructor() {
    this.capabilities = new ZMap();
    this.tokens = new ZMap();
    this.tokenIndex = new ZMap();
    this.permissionManager = new PermissionManager({
      mode: 'SANDBOX',
      permissions: new Set(),
      quotas: {}
    });

    // Register default capabilities
    this.registerDefaultCapabilities();
  }

  /**
   * Register a capability
   */
  registerCapability(capability: Capability): void {
    this.capabilities.set(capability.type, capability);
  }

  /**
   * Unregister a capability
   */
  unregisterCapability(type: CapabilityType | string): boolean {
    return this.capabilities.delete(type);
  }

  /**
   * Get a capability by type
   */
  getCapability(type: CapabilityType | string): Capability | undefined {
    return this.capabilities.get(type);
  }

  /**
   * Get all capabilities
   */
  getCapabilities(): ZArray<Capability> {
    return new ZArray([...this.capabilities.values()]);
  }

  /**
   * Issue a capability token
   */
  issueToken(
    capability: CapabilityType | string,
    context?: string,
    expiresIn?: number,
    metadata?: Record<string, any>
  ): CapabilityToken {
    const capabilityObj = this.capabilities.get(capability);
    if (!capabilityObj) {
      throw new Error(`Capability not found: ${capability}`);
    }

    const token: CapabilityToken = {
      id: this.generateTokenId(),
      capability,
      context,
      issuedAt: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
      metadata
    };

    this.tokens.set(token.id, token);
    
    // Index by capability
    if (!this.tokenIndex.has(capability)) {
      this.tokenIndex.set(capability, new Set());
    }
    this.tokenIndex.get(capability)!.add(token.id);

    return token;
  }

  /**
   * Revoke a capability token
   */
  revokeToken(tokenId: string): boolean {
    const token = this.tokens.get(tokenId);
    if (token) {
      this.tokens.delete(tokenId);
      
      // Remove from index
      const tokenSet = this.tokenIndex.get(token.capability);
      if (tokenSet) {
        tokenSet.delete(tokenId);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Revoke all tokens for a capability
   */
  revokeTokensByCapability(capability: CapabilityType | string): number {
    const tokenSet = this.tokenIndex.get(capability);
    if (tokenSet) {
      const count = tokenSet.size;
      for (const tokenId of tokenSet) {
        this.tokens.delete(tokenId);
      }
      tokenSet.clear();
      return count;
    }
    return 0;
  }

  /**
   * Revoke all tokens for a context
   */
  revokeTokensByContext(context: string): number {
    let count = 0;
    for (const [tokenId, token] of this.tokens) {
      if (token.context === context) {
        this.tokens.delete(tokenId);
        const tokenSet = this.tokenIndex.get(token.capability);
        if (tokenSet) {
          tokenSet.delete(tokenId);
        }
        count++;
      }
    }
    return count;
  }

  /**
   * Check if a capability is available
   */
  hasCapability(
    capability: CapabilityType | string,
    context?: string
  ): boolean {
    const tokenSet = this.tokenIndex.get(capability);
    if (tokenSet) {
      for (const tokenId of tokenSet) {
        const token = this.tokens.get(tokenId);
        if (token && (!context || token.context === context)) {
          // Check expiration
          if (token.expiresAt && token.expiresAt < Date.now()) {
            this.revokeToken(tokenId);
            continue;
          }
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get permissions for a capability
   */
  getPermissions(capability: CapabilityType | string): Set<Permission> {
    const capabilityObj = this.capabilities.get(capability);
    if (capabilityObj) {
      return new Set(capabilityObj.permissions);
    }
    return new Set();
  }

  /**
   * Check if a permission is available through capabilities
   */
  hasPermission(permission: Permission, context?: string): boolean {
    for (const [capabilityType, capability] of this.capabilities) {
      if (capability.permissions.has(permission) && this.hasCapability(capabilityType, context)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all tokens
   */
  getTokens(): ZArray<CapabilityToken> {
    return new ZArray([...this.tokens.values()]);
  }

  /**
   * Get tokens by capability
   */
  getTokensByCapability(capability: CapabilityType | string): ZArray<CapabilityToken> {
    const tokenSet = this.tokenIndex.get(capability);
    if (tokenSet) {
      const tokens: CapabilityToken[] = [];
      for (const tokenId of tokenSet) {
        const token = this.tokens.get(tokenId);
        if (token) {
          tokens.push(token);
        }
      }
      return new ZArray(tokens);
    }
    return new ZArray();
  }

  /**
   * Get tokens by context
   */
  getTokensByContext(context: string): ZArray<CapabilityToken> {
    const tokens: CapabilityToken[] = [];
    for (const [, token] of this.tokens) {
      if (token.context === context) {
        tokens.push(token);
      }
    }
    return new ZArray(tokens);
  }

  /**
   * Validate a token
   */
  validateToken(tokenId: string): boolean {
    const token = this.tokens.get(tokenId);
    if (!token) {
      return false;
    }
    
    // Check expiration
    if (token.expiresAt && token.expiresAt < Date.now()) {
      this.revokeToken(tokenId);
      return false;
    }
    
    return true;
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens(): number {
    let count = 0;
    const now = Date.now();
    
    for (const [tokenId, token] of this.tokens) {
      if (token.expiresAt && token.expiresAt < now) {
        this.revokeToken(tokenId);
        count++;
      }
    }
    
    return count;
  }

  /**
   * Get capability statistics
   */
  getStats(): {
    totalCapabilities: number;
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
  } {
    let activeTokens = 0, expiredTokens = 0;
    const now = Date.now();
    
    for (const [, token] of this.tokens) {
      if (token.expiresAt && token.expiresAt < now) {
        expiredTokens++;
      } else {
        activeTokens++;
      }
    }

    return {
      totalCapabilities: this.capabilities.size(),
      totalTokens: this.tokens.size(),
      activeTokens,
      expiredTokens
    };
  }

  /**
   * Register default capabilities
   */
  private registerDefaultCapabilities(): void {
    // File system capabilities
    this.registerCapability({
      type: CapabilityType.FILE_READ,
      name: 'File Read',
      description: 'Allows reading files',
      permissions: new Set([Permission.FILESYSTEM_READ])
    });

    this.registerCapability({
      type: CapabilityType.FILE_WRITE,
      name: 'File Write',
      description: 'Allows writing files',
      permissions: new Set([Permission.FILESYSTEM_WRITE])
    });

    this.registerCapability({
      type: CapabilityType.FILE_DELETE,
      name: 'File Delete',
      description: 'Allows deleting files',
      permissions: new Set([Permission.FILESYSTEM_DELETE])
    });

    this.registerCapability({
      type: CapabilityType.FILE_LIST,
      name: 'File List',
      description: 'Allows listing directory contents',
      permissions: new Set([Permission.FILESYSTEM_READ])
    });

    // Network capabilities
    this.registerCapability({
      type: CapabilityType.NETWORK_CONNECT,
      name: 'Network Connect',
      description: 'Allows establishing network connections',
      permissions: new Set([Permission.NETWORK_CONNECT])
    });

    this.registerCapability({
      type: CapabilityType.NETWORK_BIND,
      name: 'Network Bind',
      description: 'Allows binding to network ports',
      permissions: new Set([Permission.NETWORK_BIND])
    });

    this.registerCapability({
      type: CapabilityType.NETWORK_LISTEN,
      name: 'Network Listen',
      description: 'Allows listening on network ports',
      permissions: new Set([Permission.NETWORK_BIND, Permission.NETWORK_CONNECT])
    });

    // Process capabilities
    this.registerCapability({
      type: CapabilityType.PROCESS_EXEC,
      name: 'Process Execute',
      description: 'Allows executing processes',
      permissions: new Set([Permission.PROCESS_EXEC])
    });

    this.registerCapability({
      type: CapabilityType.PROCESS_FORK,
      name: 'Process Fork',
      description: 'Allows forking processes',
      permissions: new Set([Permission.PROCESS_FORK])
    });

    this.registerCapability({
      type: CapabilityType.PROCESS_KILL,
      name: 'Process Kill',
      description: 'Allows killing processes',
      permissions: new Set([Permission.PROCESS_EXEC])
    });

    // System capabilities
    this.registerCapability({
      type: CapabilityType.SYSTEM_TIME,
      name: 'System Time',
      description: 'Allows accessing system time',
      permissions: new Set([Permission.TIME_ACCESS])
    });

    this.registerCapability({
      type: CapabilityType.SYSTEM_RANDOM,
      name: 'System Random',
      description: 'Allows generating random numbers',
      permissions: new Set([Permission.RANDOM_ACCESS])
    });

    this.registerCapability({
      type: CapabilityType.SYSTEM_ENV,
      name: 'System Environment',
      description: 'Allows accessing environment variables',
      permissions: new Set([Permission.ENV_ACCESS])
    });

    this.registerCapability({
      type: CapabilityType.SYSTEM_MEMORY,
      name: 'System Memory',
      description: 'Allows accessing memory information',
      permissions: new Set([Permission.MEMORY_ACCESS])
    });
  }

  /**
   * Generate unique token ID
   */
  private generateTokenId(): string {
    return `cap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Capability builder for fluent capability creation
 */
export class CapabilityBuilder {
  private capability: Partial<Capability>;

  constructor(type: CapabilityType | string) {
    this.capability = { type };
  }

  withName(name: string): this {
    this.capability.name = name;
    return this;
  }

  withDescription(description: string): this {
    this.capability.description = description;
    return this;
  }

  withPermission(permission: Permission): this {
    if (!this.capability.permissions) {
      this.capability.permissions = new Set();
    }
    this.capability.permissions.add(permission);
    return this;
  }

  withPermissions(permissions: Permission[]): this {
    if (!this.capability.permissions) {
      this.capability.permissions = new Set();
    }
    for (const permission of permissions) {
      this.capability.permissions.add(permission);
    }
    return this;
  }

  withResource(resource: string): this {
    if (!this.capability.resources) {
      this.capability.resources = [];
    }
    this.capability.resources.push(resource);
    return this;
  }

  withResources(resources: string[]): this {
    if (!this.capability.resources) {
      this.capability.resources = [];
    }
    this.capability.resources.push(...resources);
    return this;
  }

  withConstraint(key: string, value: any): this {
    if (!this.capability.constraints) {
      this.capability.constraints = {};
    }
    this.capability.constraints[key] = value;
    return this;
  }

  build(): Capability {
    return {
      type: this.capability.type!,
      name: this.capability.name || '',
      description: this.capability.description,
      permissions: this.capability.permissions || new Set(),
      resources: this.capability.resources,
      constraints: this.capability.constraints
    };
  }
}

/**
 * Global capability system instance
 */
export const globalCapabilitySystem = new CapabilitySystem();

export type CapabilityValue = CapabilitySystem | CapabilityBuilder;
