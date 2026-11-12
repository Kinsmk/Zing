/**
 * Pipeline - Pipeline de compilation de Zinga
 * 
 * Ce module définit le pipeline de compilation complet, de l'analyse lexicale
 * à la génération de code, en passant par l'analyse syntaxique et sémantique.
 */

import { Lexer } from './lexer/lexer';
import { Parser } from './parser/parser';
import { TypeChecker } from './semantics/type-checker';
import { IRBuilder } from '../ir/ir-builder';
import { JavaScriptGenerator } from '../backends/javascript/generator';
import { Config } from './config';
import { DiagnosticCollector } from './diagnostics/errors';
import { Token } from './lexer/tokens';
import { ASTNode } from './ast/nodes';

export interface PipelineOptions {
  config: Config;
  diagnostics: DiagnosticCollector;
}

export class Pipeline {
  private lexer: Lexer;
  private parser: Parser;
  private typeChecker: TypeChecker;
  private irBuilder: IRBuilder;
  private jsGenerator: JavaScriptGenerator;
  private config: Config;
  private diagnostics: DiagnosticCollector;

  constructor(options: PipelineOptions) {
    this.config = options.config;
    this.diagnostics = options.diagnostics;
    
    this.lexer = new Lexer(this.config);
    this.parser = new Parser(this.config);
    this.typeChecker = new TypeChecker(this.config);
    this.irBuilder = new IRBuilder(this.config);
    this.jsGenerator = new JavaScriptGenerator(this.config);
  }

  /**
   * Traiter un fichier source complet
   */
  public process(source: string, filename?: string): string {
    // Phase 1: Analyse lexicale
    const tokens = this.lexer.tokenize(source, filename);
    
    if (this.diagnostics.hasErrors()) {
      return '';
    }

    // Phase 2: Analyse syntaxique
    const ast = this.parser.parse(tokens);
    
    if (this.diagnostics.hasErrors()) {
      return '';
    }

    // Phase 3: Vérification des types
    this.typeChecker.check(ast);
    
    if (this.diagnostics.hasErrors()) {
      return '';
    }

    // Phase 4: Génération IR
    const ir = this.irBuilder.build(ast);

    // Phase 5: Génération de code (JavaScript par défaut)
    const output = this.jsGenerator.generate(ir);
    
    return output;
  }

  /**
   * Traiter vers une cible spécifique
   */
  public processToTarget(source: string, target: 'javascript' | 'wasm' | 'llvm', filename?: string): string {
    const tokens = this.lexer.tokenize(source, filename);
    const ast = this.parser.parse(tokens);
    this.typeChecker.check(ast);
    const ir = this.irBuilder.build(ast);

    switch (target) {
      case 'javascript':
        return this.jsGenerator.generate(ir);
      case 'wasm':
        // TODO: Implémenter le générateur WASM
        throw new Error('WASM backend not yet implemented');
      case 'llvm':
        // TODO: Implémenter le générateur LLVM
        throw new Error('LLVM backend not yet implemented');
      default:
        throw new Error(`Unknown target: ${target}`);
    }
  }

  /**
   * Vérifier la syntaxe sans générer de code
   */
  public check(source: string, filename?: string): boolean {
    const tokens = this.lexer.tokenize(source, filename);
    const ast = this.parser.parse(tokens);
    this.typeChecker.check(ast);
    
    return !this.diagnostics.hasErrors();
  }

  /**
   * Réinitialiser le pipeline
   */
  public reset(): void {
    this.lexer.reset();
    this.parser.reset();
    this.typeChecker.reset();
  }

  /**
   * Reconfigurer le pipeline
   */
  public configure(config: Config): void {
    this.config = config;
    this.lexer.configure(config);
    this.parser.configure(config);
    this.typeChecker.configure(config);
    this.irBuilder.configure(config);
    this.jsGenerator.configure(config);
  }
}
