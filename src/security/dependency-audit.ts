/**
 * Zinga Security - Dependency Audit
 * 
 * Audits dependencies for security vulnerabilities.
 */

import { ZMap } from '../../runtime/values/maps';
import { ZString } from '../../runtime/values/strings';
import { ZArray } from '../../runtime/values/arrays';

/**
 * Dependency information
 */
export interface Dependency {
  name: string;
  version: string;
  resolvedVersion?: string;
  path?: string;
  dependencies?: ZMap<string, string>;
  dev?: boolean;
  optional?: boolean;
}

/**
 * Vulnerability information
 */
export interface Vulnerability {
  id: string;
  name: string;
  description: string;
  severity: VulnerabilitySeverity;
  affectedVersions: string;
  patchedVersions?: string;
  references?: string[];
  fixedVersion?: string;
  advisory?: string;
}

/**
 * Vulnerability severity
 */
export enum VulnerabilitySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Audit result
 */
export interface AuditResult {
  dependencies: number;
  vulnerable: number;
  vulnerabilities: ZArray<Vulnerability>;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  timestamp: number;
  duration: number;
}

/**
 * Audit options
 */
export interface AuditOptions {
  checkDevDependencies?: boolean;
  checkOptionalDependencies?: boolean;
  ignore?: string[];
  severityThreshold?: VulnerabilitySeverity;
}

/**
 * Dependency audit error
 */
export class DependencyAuditError extends Error {
  constructor(
    message: string,
    public readonly dependency?: string,
    public readonly vulnerability?: Vulnerability
  ) {
    super(message);
    this.name = 'DependencyAuditError';
  }
}

/**
 * Dependency Auditor
 * 
 * Audits dependencies for security vulnerabilities.
 */
export class DependencyAuditor {
  private vulnerabilities: ZMap<string, ZArray<Vulnerability>>;
  private dependencies: ZMap<string, Dependency>;
  private auditResults: ZArray<AuditResult>;
  private ignored: Set<string>;

  constructor() {
    this.vulnerabilities = new ZMap();
    this.dependencies = new ZMap();
    this.auditResults = new ZArray();
    this.ignored = new Set();
  }

  /**
   * Add a vulnerability to the database
   */
  addVulnerability(vulnerability: Vulnerability): void {
    if (!this.vulnerabilities.has(vulnerability.name)) {
      this.vulnerabilities.set(vulnerability.name, new ZArray());
    }
    this.vulnerabilities.get(vulnerability.name)!.push(vulnerability);
  }

  /**
   * Add multiple vulnerabilities
   */
  addVulnerabilities(vulnerabilities: Vulnerability[]): void {
    for (const vuln of vulnerabilities) {
      this.addVulnerability(vuln);
    }
  }

  /**
   * Remove a vulnerability
   */
  removeVulnerability(id: string): boolean {
    for (const [, vulns] of this.vulnerabilities) {
      const index = vulns.findIndex(v => v.id === id);
      if (index !== -1) {
        vulns.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Get vulnerabilities for a dependency
   */
  getVulnerabilities(name: string): ZArray<Vulnerability> {
    return this.vulnerabilities.get(name) || new ZArray();
  }

  /**
   * Get all vulnerabilities
   */
  getAllVulnerabilities(): ZArray<Vulnerability> {
    const all: Vulnerability[] = [];
    for (const [, vulns] of this.vulnerabilities) {
      all.push(...vulns.getValue());
    }
    return new ZArray(all);
  }

  /**
   * Add a dependency
   */
  addDependency(dependency: Dependency): void {
    this.dependencies.set(dependency.name, dependency);
  }

  /**
   * Add multiple dependencies
   */
  addDependencies(dependencies: Dependency[]): void {
    for (const dep of dependencies) {
      this.addDependency(dep);
    }
  }

  /**
   * Remove a dependency
   */
  removeDependency(name: string): boolean {
    return this.dependencies.delete(name);
  }

  /**
   * Get a dependency
   */
  getDependency(name: string): Dependency | undefined {
    return this.dependencies.get(name);
  }

  /**
   * Get all dependencies
   */
  getDependencies(): ZArray<Dependency> {
    return new ZArray([...this.dependencies.values()]);
  }

  /**
   * Ignore a vulnerability
   */
  ignoreVulnerability(id: string): void {
    this.ignored.add(id);
  }

  /**
   * Unignore a vulnerability
   */
  unignoreVulnerability(id: string): void {
    this.ignored.delete(id);
  }

  /**
   * Get ignored vulnerabilities
   */
  getIgnored(): Set<string> {
    return new Set(this.ignored);
  }

  /**
   * Audit dependencies
   */
  audit(options: AuditOptions = {}): AuditResult {
    const start = Date.now();
    const {
      checkDevDependencies = true,
      checkOptionalDependencies = true,
      ignore = [],
      severityThreshold = VulnerabilitySeverity.LOW
    } = options;

    const vulnerabilities: Vulnerability[] = [];
    const bySeverity = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    // Add ignored vulnerabilities to the ignore set
    const ignoreSet = new Set([...ignore, ...this.ignored]);

    // Check each dependency
    for (const [, dependency] of this.dependencies) {
      // Skip dev dependencies if not checking
      if (!checkDevDependencies && dependency.dev) {
        continue;
      }

      // Skip optional dependencies if not checking
      if (!checkOptionalDependencies && dependency.optional) {
        continue;
      }

      // Check for vulnerabilities
      const vulns = this.getVulnerabilities(dependency.name);
      for (const vuln of vulns.getValue()) {
        // Skip ignored vulnerabilities
        if (ignoreSet.has(vuln.id)) {
          continue;
        }

        // Check if version is affected
        if (this.isVersionAffected(dependency.version, vuln.affectedVersions)) {
          // Check severity threshold
          const severityIndex = this.getSeverityIndex(vuln.severity);
          const thresholdIndex = this.getSeverityIndex(severityThreshold);
          
          if (severityIndex >= thresholdIndex) {
            vulnerabilities.push(vuln);
            bySeverity[vuln.severity.toLowerCase() as keyof typeof bySeverity]++;
          }
        }
      }
    }

    const result: AuditResult = {
      dependencies: this.dependencies.size(),
      vulnerable: vulnerabilities.length,
      vulnerabilities: new ZArray(vulnerabilities),
      bySeverity,
      timestamp: Date.now(),
      duration: Date.now() - start
    };

    this.auditResults.push(result);
    return result;
  }

  /**
   * Check if a specific dependency has vulnerabilities
   */
  checkDependency(name: string, version: string): ZArray<Vulnerability> {
    const vulnerabilities: Vulnerability[] = [];
    const vulns = this.getVulnerabilities(name);

    for (const vuln of vulns.getValue()) {
      if (this.isVersionAffected(version, vuln.affectedVersions)) {
        vulnerabilities.push(vuln);
      }
    }

    return new ZArray(vulnerabilities);
  }

  /**
   * Get audit results
   */
  getAuditResults(): ZArray<AuditResult> {
    return this.auditResults;
  }

  /**
   * Get the last audit result
   */
  getLastAuditResult(): AuditResult | undefined {
    return this.auditResults.size() > 0 ? 
      this.auditResults.get(this.auditResults.size() - 1) : undefined;
  }

  /**
   * Clear audit results
   */
  clearAuditResults(): void {
    this.auditResults = new ZArray();
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.vulnerabilities.clear();
    this.dependencies.clear();
    this.auditResults = new ZArray();
    this.ignored.clear();
  }

  /**
   * Load vulnerabilities from a database
   */
  async loadFromDatabase(database: Record<string, Vulnerability[]>): Promise<void> {
    for (const [name, vulns] of Object.entries(database)) {
      this.addVulnerabilities(vulns);
    }
  }

  /**
   * Load dependencies from a package file
   */
  async loadFromPackageFile(packageFile: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
  }): Promise<void> {
    // Add regular dependencies
    if (packageFile.dependencies) {
      for (const [name, version] of Object.entries(packageFile.dependencies)) {
        this.addDependency({ name, version, dev: false, optional: false });
      }
    }

    // Add dev dependencies
    if (packageFile.devDependencies) {
      for (const [name, version] of Object.entries(packageFile.devDependencies)) {
        this.addDependency({ name, version, dev: true, optional: false });
      }
    }

    // Add optional dependencies
    if (packageFile.optionalDependencies) {
      for (const [name, version] of Object.entries(packageFile.optionalDependencies)) {
        this.addDependency({ name, version, dev: false, optional: true });
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalDependencies: number;
    totalVulnerabilities: number;
    bySeverity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    ignored: number;
    auditCount: number;
  } {
    const bySeverity = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    for (const [, vulns] of this.vulnerabilities) {
      for (const vuln of vulns.getValue()) {
        bySeverity[vuln.severity.toLowerCase() as keyof typeof bySeverity]++;
      }
    }

    return {
      totalDependencies: this.dependencies.size(),
      totalVulnerabilities: bySeverity.low + bySeverity.medium + bySeverity.high + bySeverity.critical,
      bySeverity,
      ignored: this.ignored.size,
      auditCount: this.auditResults.size()
    };
  }

  /**
   * Check if a version is affected by a vulnerability
   */
  private isVersionAffected(version: string, affectedVersions: string): boolean {
    // In a real implementation, we would use a proper semantic versioning library
    // For now, we do a simple string comparison
    return version === affectedVersions || 
           affectedVersions.includes(version) ||
           version.includes(affectedVersions);
  }

  /**
   * Get severity index
   */
  private getSeverityIndex(severity: VulnerabilitySeverity): number {
    switch (severity) {
      case VulnerabilitySeverity.CRITICAL: return 4;
      case VulnerabilitySeverity.HIGH: return 3;
      case VulnerabilitySeverity.MEDIUM: return 2;
      case VulnerabilitySeverity.LOW: return 1;
      default: return 0;
    }
  }
}

/**
 * Global dependency auditor instance
 */
export const globalDependencyAuditor = new DependencyAuditor();

export type DependencyAuditValue = DependencyAuditor;
