/**
 * Environment - Environnement d'execution pour Zinga
 * 
 * Ce module fournit l'acces a l'environnement d'execution,
 * y compris les variables d'environnement, les arguments de ligne de commande,
 * et les informations systeme.
 */

import * as path from 'path';
import * as os from 'os';
import * as process from 'process';

/**
 * Informations sur l'environnement
 */
export interface EnvironmentInfo {
  // Variables d'environnement
  env: NodeJS.ProcessEnv;
  
  // Arguments de ligne de commande
  args: string[];
  
  // Repertoire de travail
  cwd: string;
  
  // Informations systeme
  platform: NodeJS.Platform;
  arch: string;
  hostname: string;
  
  // Informations Node.js
  nodeVersion: string;
  nodeVersions: NodeJS.ProcessVersions;
  
  // Informations memoire
  memoryUsage: NodeJS.MemoryUsage;
  
  // Temps de demarrage
  startTime: Date;
  
  // PID
  pid: number;
  
  // Nom du processus
  title: string;
}

/**
 * Environnement Zinga
 */
export class ZingaEnvironment {
  private static instance: ZingaEnvironment | null = null;
  
  private info: EnvironmentInfo;
  private overrides: Map<string, string> = new Map();
  
  private constructor() {
    this.info = this.createEnvironmentInfo();
  }
  
  /**
   * Creer les informations sur l'environnement
   */
  private createEnvironmentInfo(): EnvironmentInfo {
    return {
      env: { ...process.env },
      args: process.argv.slice(2),
      cwd: process.cwd(),
      platform: process.platform,
      arch: process.arch,
      hostname: os.hostname(),
      nodeVersion: process.version,
      nodeVersions: process.versions,
      memoryUsage: process.memoryUsage(),
      startTime: new Date(process.hrtime()[0] * 1000),
      pid: process.pid,
      title: process.title,
    };
  }
  
  /**
   * Obtenir l'instance de l'environnement
   */
  public static getInstance(): ZingaEnvironment {
    if (!ZingaEnvironment.instance) {
      ZingaEnvironment.instance = new ZingaEnvironment();
    }
    return ZingaEnvironment.instance;
  }
  
  /**
   * Reinitialiser l'instance
   */
  public static reset(): void {
    ZingaEnvironment.instance = null;
  }
  
  /**
   * Obtenir les informations sur l'environnement
   */
  public getInfo(): EnvironmentInfo {
    return { ...this.info };
  }
  
  /**
   * Obtenir une variable d'environnement
   */
  public getEnv(name: string): string | undefined {
    // Verifier les overrides
    if (this.overrides.has(name)) {
      return this.overrides.get(name);
    }
    
    return this.info.env[name];
  }
  
  /**
   * Obtenir une variable d'environnement avec une valeur par defaut
   */
  public getEnvDefault(name: string, defaultValue: string): string {
    return this.getEnv(name) || defaultValue;
  }
  
  /**
   * Verifier si une variable d'environnement existe
   */
  public hasEnv(name: string): boolean {
    return name in this.info.env || this.overrides.has(name);
  }
  
  /**
   * Definir une variable d'environnement (override)
   */
  public setEnv(name: string, value: string): void {
    this.overrides.set(name, value);
  }
  
  /**
   * Supprimer un override de variable d'environnement
   */
  public unsetEnv(name: string): void {
    this.overrides.delete(name);
  }
  
  /**
   * Obtenir tous les noms des variables d'environnement
   */
  public getEnvKeys(): string[] {
    return Object.keys(this.info.env);
  }
  
  /**
   * Obtenir toutes les variables d'environnement
   */
  public getEnvAll(): NodeJS.ProcessEnv {
    return { ...this.info.env, ...Object.fromEntries(this.overrides) };
  }
  
  /**
   * Obtenir les arguments de ligne de commande
   */
  public getArgs(): string[] {
    return [...this.info.args];
  }
  
  /**
   * Obtenir un argument de ligne de commande
   */
  public getArg(index: number): string | undefined {
    return this.info.args[index];
  }
  
  /**
   * Obtenir le repertoire de travail
   */
  public getCwd(): string {
    return this.info.cwd;
  }
  
  /**
   * Changer le repertoire de travail
   */
  public setCwd(directory: string): void {
    process.chdir(directory);
    this.info.cwd = process.cwd();
  }
  
  /**
   * Obtenir le chemin absolu d'un chemin relatif
   */
  public resolvePath(...paths: string[]): string {
    return path.resolve(this.info.cwd, ...paths);
  }
  
  /**
   * Obtenir le chemin relatif
   */
  public relativePath(from: string, to: string): string {
    return path.relative(from, to);
  }
  
  /**
   * Verifier si on est dans un environnement de developpement
   */
  public isDev(): boolean {
    return this.getEnv('NODE_ENV') === 'development';
  }
  
  /**
   * Verifier si on est dans un environnement de production
   */
  public isProd(): boolean {
    return this.getEnv('NODE_ENV') === 'production';
  }
  
  /**
   * Verifier si on est dans un environnement de test
   */
  public isTest(): boolean {
    return this.getEnv('NODE_ENV') === 'test';
  }
  
  /**
   * Obtenir la plateforme
   */
  public getPlatform(): NodeJS.Platform {
    return this.info.platform;
  }
  
  /**
   * Verifier si on est sur Windows
   */
  public isWindows(): boolean {
    return this.info.platform === 'win32';
  }
  
  /**
   * Verifier si on est sur Linux
   */
  public isLinux(): boolean {
    return this.info.platform === 'linux';
  }
  
  /**
   * Verifier si on est sur macOS
   */
  public isMac(): boolean {
    return this.info.platform === 'darwin';
  }
  
  /**
   * Obtenir l'architecture
   */
  public getArch(): string {
    return this.info.arch;
  }
  
  /**
   * Verifier si on est sur x64
   */
  public isX64(): boolean {
    return this.info.arch === 'x64';
  }
  
  /**
   * Verifier si on est sur ARM64
   */
  public isARM64(): boolean {
    return this.info.arch === 'arm64';
  }
  
  /**
   * Obtenir le nom de la machine
   */
  public getHostname(): string {
    return this.info.hostname;
  }
  
  /**
   * Obtenir la version de Node.js
   */
  public getNodeVersion(): string {
    return this.info.nodeVersion;
  }
  
  /**
   * Verifier la version de Node.js
   */
  public checkNodeVersion(minVersion: string): boolean {
    const current = this.info.nodeVersion;
    return this.compareVersions(current, minVersion) >= 0;
  }
  
  /**
   * Comparer deux versions
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(p => parseInt(p.replace(/[^0-9]/g, ''), 10) || 0);
    const parts2 = v2.split('.').map(p => parseInt(p.replace(/[^0-9]/g, ''), 10) || 0);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    
    return 0;
  }
  
  /**
   * Obtenir les informations sur la memoire
   */
  public getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }
  
  /**
   * Obtenir la memoire totale utilisee
   */
  public getTotalMemory(): number {
    return this.info.memoryUsage.heapTotal;
  }
  
  /**
   * Obtenir la memoire utilisee
   */
  public getUsedMemory(): number {
    return this.info.memoryUsage.heapUsed;
  }
  
  /**
   * Obtenir le PID
   */
  public getPid(): number {
    return this.info.pid;
  }
  
  /**
   * Obtenir le nom du processus
   */
  public getTitle(): string {
    return this.info.title;
  }
  
  /**
   * Definir le nom du processus
   */
  public setTitle(title: string): void {
    process.title = title;
    this.info.title = title;
  }
  
  /**
   * Obtenir le temps de demarrage
   */
  public getStartTime(): Date {
    return this.info.startTime;
  }
  
  /**
   * Obtenir le temps d'execution
   */
  public getUptime(): number {
    return process.uptime() * 1000; // en millisecondes
  }
  
  /**
   * Obtenir le temps courant en millisecondes
   */
  public getCurrentTime(): number {
    return Date.now();
  }
  
  /**
   * Obtenir un timestamp haute resolution
   */
  public getHRTimestamp(): [number, number] {
    return process.hrtime();
  }
  
  /**
   * Attendre un certain nombre de millisecondes
   */
  public async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Executer une fonction avec un timeout
   */
  public async withTimeout<T>(
    operation: () => Promise<T> | T,
    timeout: number,
    timeoutMessage?: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage || `Operation timed out after ${timeout}ms`));
      }, timeout);
    });
    
    const operationPromise = Promise.resolve(operation());
    
    return Promise.race([operationPromise, timeoutPromise]);
  }
  
  /**
   * Obtenir un identifiant unique
   */
  public generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Obtenir un UUID v4
   */
  public generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

/**
 * Obtenir l'environnement Zinga
 */
export function getEnvironment(): ZingaEnvironment {
  return ZingaEnvironment.getInstance();
}

/**
 * Creer un nouvel environnement
 */
export function createEnvironment(): ZingaEnvironment {
  ZingaEnvironment.reset();
  return ZingaEnvironment.getInstance();
}

/**
 * Obtenir une variable d'environnement
 */
export function getEnv(name: string): string | undefined {
  return getEnvironment().getEnv(name);
}

/**
 * Obtenir une variable d'environnement avec une valeur par defaut
 */
export function getEnvDefault(name: string, defaultValue: string): string {
  return getEnvironment().getEnvDefault(name, defaultValue);
}

/**
 * Verifier si une variable d'environnement existe
 */
export function hasEnv(name: string): boolean {
  return getEnvironment().hasEnv(name);
}

/**
 * Obtenir les arguments de ligne de commande
 */
export function getArgs(): string[] {
  return getEnvironment().getArgs();
}

/**
 * Obtenir le repertoire de travail
 */
export function getCwd(): string {
  return getEnvironment().getCwd();
}

/**
 * Resoudre un chemin
 */
export function resolvePath(...paths: string[]): string {
  return getEnvironment().resolvePath(...paths);
}

/**
 * Verifier si on est en mode developpement
 */
export function isDev(): boolean {
  return getEnvironment().isDev();
}

/**
 * Verifier si on est en mode production
 */
export function isProd(): boolean {
  return getEnvironment().isProd();
}

/**
 * Verifier si on est sur Windows
 */
export function isWindows(): boolean {
  return getEnvironment().isWindows();
}

/**
 * Verifier si on est sur Linux
 */
export function isLinux(): boolean {
  return getEnvironment().isLinux();
}

/**
 * Verifier si on est sur macOS
 */
export function isMac(): boolean {
  return getEnvironment().isMac();
}
