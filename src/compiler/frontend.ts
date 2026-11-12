/**
 * Frontend - Interface frontale du compilateur Zinga
 * 
 * Ce module fournit une interface simplifiée pour le compilateur,
 * adaptée à une utilisation programmatique.
 */

import { Compiler, CompilerOptions } from './compiler';
import { DiagnosticCollector } from './diagnostics/errors';

export interface CompileResult {
  success: boolean;
  output?: string;
  errors: any[];
  warnings: any[];
  time: number;
}

export interface CheckResult {
  success: boolean;
  errors: any[];
  warnings: any[];
  time: number;
}

export class Frontend {
  private compiler: Compiler;

  constructor(options: CompilerOptions = {}) {
    this.compiler = new Compiler(options);
  }

  /**
   * Compiler un fichier source Zinga
   */
  public compile(source: string, filename?: string): CompileResult {
    const start = Date.now();
    const output = this.compiler.compile(source, filename);
    const time = Date.now() - start;
    
    const diagnostics = this.compiler.getDiagnostics();
    const errors = diagnostics.filter(d => d.severity === 'error');
    const warnings = diagnostics.filter(d => d.severity === 'warning');

    return {
      success: errors.length === 0,
      output,
      errors,
      warnings,
      time,
    };
  }

  /**
   * Compiler vers une cible spécifique
   */
  public compileTo(source: string, target: 'javascript' | 'wasm' | 'llvm', filename?: string): CompileResult {
    const start = Date.now();
    const output = this.compiler.compileTo(source, target, filename);
    const time = Date.now() - start;
    
    const diagnostics = this.compiler.getDiagnostics();
    const errors = diagnostics.filter(d => d.severity === 'error');
    const warnings = diagnostics.filter(d => d.severity === 'warning');

    return {
      success: errors.length === 0,
      output,
      errors,
      warnings,
      time,
    };
  }

  /**
   * Vérifier la syntaxe
   */
  public check(source: string, filename?: string): CheckResult {
    const start = Date.now();
    const success = this.compiler.check(source, filename);
    const time = Date.now() - start;
    
    const diagnostics = this.compiler.getDiagnostics();
    const errors = diagnostics.filter(d => d.severity === 'error');
    const warnings = diagnostics.filter(d => d.severity === 'warning');

    return {
      success,
      errors,
      warnings,
      time,
    };
  }

  /**
   * Réinitialiser le frontend
   */
  public reset(): void {
    this.compiler.reset();
  }

  /**
   * Configurer le frontend
   */
  public configure(options: CompilerOptions): void {
    this.compiler.configure(options.config || {});
  }
}
