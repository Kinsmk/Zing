/**
 * Compiler - Compilateur principal de Zinga
 * 
 * Ce module est responsable de l'orchestration complète du processus de compilation.
 * Il coordonne le lexer, le parser, le vérificateur de types et le générateur de code.
 */

import { Pipeline } from './pipeline';
import { Config, CompilerConfig } from './config';
import { Lexer } from './lexer/lexer';
import { Parser } from './parser/parser';
import { TypeChecker } from './semantics/type-checker';
import { DiagnosticCollector } from './diagnostics/errors';

export interface CompilerOptions {
  config?: CompilerConfig;
  debug?: boolean;
  optimize?: boolean;
}

export class Compiler {
  private pipeline: Pipeline;
  private config: Config;
  private diagnostics: DiagnosticCollector;

  constructor(options: CompilerOptions = {}) {
    this.config = new Config(options.config || {});
    this.diagnostics = new DiagnosticCollector();
    this.pipeline = new Pipeline({
      config: this.config,
      diagnostics: this.diagnostics,
    });
  }

  /**
   * Compiler un fichier source Zinga
   */
  public compile(source: string, filename?: string): string {
    return this.pipeline.process(source, filename);
  }

  /**
   * Compiler un fichier et générer du code pour un backend spécifique
   */
  public compileTo(source: string, target: 'javascript' | 'wasm' | 'llvm', filename?: string): string {
    return this.pipeline.processToTarget(source, target, filename);
  }

  /**
   * Vérifier la syntaxe sans générer de code
   */
  public check(source: string, filename?: string): boolean {
    return this.pipeline.check(source, filename);
  }

  /**
   * Obtenir les diagnostics (erreurs et avertissements)
   */
  public getDiagnostics(): any[] {
    return this.diagnostics.getAll();
  }

  /**
   * Réinitialiser le compilateur
   */
  public reset(): void {
    this.diagnostics.clear();
    this.pipeline.reset();
  }

  /**
   * Configurer le compilateur
   */
  public configure(config: CompilerConfig): void {
    this.config.update(config);
    this.pipeline.configure(this.config);
  }

  /**
   * Obtenir la configuration actuelle
   */
  public getConfig(): CompilerConfig {
    return this.config.get();
  }
}
