/**
 * Parser - Analyseur syntaxique de Zinga
 * 
 * Ce module est responsable de la construction de l'AST (Arbre Syntaxique Abstraite)
 * à partir des tokens générés par le lexer.
 */

import { Token, TokenType } from '../lexer/tokens';
import { TokenTypes } from '../lexer/token-types';
import { ASTNode, Program, Statement, Expression } from '../ast/nodes';
import { Config } from '../config';
import { DiagnosticCollector } from '../diagnostics/errors';
import { Expressions } from './expressions';
import { Statements } from './statements';
import { Declarations } from './declarations';

export interface ParserOptions {
  config?: Config;
  recovery?: boolean;
  maxErrors?: number;
}

export class Parser {
  private tokens: Token[] = [];
  private currentIndex: number = 0;
  private config: Config;
  private recovery: boolean;
  private maxErrors: number;
  private errors: any[] = [];
  
  // Modules spécialisés
  private expressions: Expressions;
  private statements: Statements;
  private declarations: Declarations;

  constructor(options: ParserOptions = {}) {
    this.config = options.config || new Config();
    this.recovery = options.recovery ?? true;
    this.maxErrors = options.maxErrors ?? 10;
    
    const diagnostics = new DiagnosticCollector();
    this.expressions = new Expressions(this, diagnostics);
    this.statements = new Statements(this, diagnostics);
    this.declarations = new Declarations(this, diagnostics);
  }

  /**
   * Analyser les tokens et produire l'AST
   */
  public parse(tokens: Token[]): Program {
    this.tokens = tokens;
    this.currentIndex = 0;
    this.errors = [];

    const program = new Program();
    program.location = this.getLocationFromTokens(tokens[0], tokens[tokens.length - 1]);

    // Analyser tous les statements jusqu'à EOF
    while (!this.isAtEnd()) {
      const statement = this.parseStatement();
      if (statement) {
        program.body.push(statement);
      }
    }

    return program;
  }

  /**
   * Analyser un seul statement
   */
  public parseStatement(): Statement | null {
    const token = this.peek();
    
    if (!token) {
      return null;
    }

    // Essayer de récupérer après une erreur
    if (token.type === TokenTypes.SEMICOLON) {
      this.advance();
      return null;
    }

    // Utiliser le module Statements pour analyser
    return this.statements.parseStatement();
  }

  /**
   * Analyser une expression
   */
  public parseExpression(): Expression {
    return this.expressions.parseExpression();
  }

  /**
   * Analyser une déclaration
   */
  public parseDeclaration(): Statement | null {
    return this.declarations.parseDeclaration();
  }

  // ========== Méthodes utilitaires ==========

  /**
   * Obtenir le token courant
   */
  public peek(offset: number = 0): Token | null {
    const index = this.currentIndex + offset;
    if (index >= this.tokens.length) {
      return null;
    }
    return this.tokens[index];
  }

  /**
   * Obtenir le token précédent
   */
  public previous(): Token | null {
    if (this.currentIndex <= 0) {
      return null;
    }
    return this.tokens[this.currentIndex - 1];
  }

  /**
   * Avancer au token suivant
   */
  public advance(): Token | null {
    if (this.currentIndex >= this.tokens.length) {
      return null;
    }
    return this.tokens[this.currentIndex++];
  }

  /**
   * Reculer d'un token
   */
  public retreat(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  /**
   * Vérifier si on est à la fin
   */
  public isAtEnd(): boolean {
    return this.peek()?.type === TokenTypes.EOF || this.currentIndex >= this.tokens.length;
  }

  /**
   * Vérifier si le token courant correspond à un type
   */
  public match(type: TokenType): boolean {
    return this.peek()?.type === type;
  }

  /**
   * Vérifier si le token courant correspond à l'un des types
   */
  public matchAny(...types: TokenType[]): boolean {
    const token = this.peek();
    return token ? types.includes(token.type) : false;
  }

  /**
   * Consommer un token si il correspond au type
   */
  public consume(type: TokenType): Token | null {
    if (this.match(type)) {
      return this.advance();
    }
    return null;
  }

  /**
   * Consommer un token et lever une erreur si il ne correspond pas
   */
  public expect(type: TokenType, message?: string): Token {
    const token = this.peek();
    if (token?.type === type) {
      return this.advance()!;
    }
    
    const expectedName = TokenType[type] || type;
    const actualName = token ? TokenType[token.type] || token.type : 'EOF';
    const errorMessage = message || `Expected ${expectedName}, but found ${actualName}`;
    
    this.addError(token, errorMessage);
    
    if (this.recovery) {
      // Essayer de récupérer
      return this.advance()!;
    }
    
    throw new Error(errorMessage);
  }

  /**
   * Consommer un identifiant
   */
  public expectIdentifier(message?: string): Token {
    return this.expect(TokenTypes.IDENTIFIER, message || 'Expected identifier');
  }

  /**
   * Consommer un type
   */
  public expectType(message?: string): Token {
    const token = this.peek();
    if (token && (token.type === TokenTypes.IDENTIFIER || this.isTypeToken(token))) {
      return this.advance()!;
    }
    
    const errorMessage = message || 'Expected type';
    this.addError(token || this.peek(), errorMessage);
    
    if (this.recovery) {
      return this.advance()!;
    }
    
    throw new Error(errorMessage);
  }

  /**
   * Vérifier si un token est un token de type
   */
  private isTypeToken(token: Token): boolean {
    const typeTokens: TokenType[] = [
      TokenTypes.NUMBER_TYPE, TokenTypes.STRING_TYPE, TokenTypes.BOOLEAN_TYPE,
      TokenTypes.NULL_TYPE, TokenTypes.ARRAY_TYPE, TokenTypes.OBJECT_TYPE,
      TokenTypes.FUNCTION_TYPE, TokenTypes.ANY_TYPE, TokenTypes.VOID_TYPE,
    ];
    return typeTokens.includes(token.type);
  }

  /**
   * Ajouter une erreur
   */
  public addError(token: Token | null, message: string): void {
    this.errors.push({
      message,
      token,
      severity: 'error' as const,
    });
    
    if (this.errors.length >= this.maxErrors) {
      throw new Error(`Maximum errors (${this.maxErrors}) exceeded`);
    }
  }

  /**
   * Obtenir les erreurs
   */
  public getErrors(): any[] {
    return this.errors;
  }

  /**
   * Vérifier s'il y a des erreurs
   */
  public hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Obtenir la location entre deux tokens
   */
  public getLocationFromTokens(startToken: Token | null, endToken: Token | null): any {
    if (!startToken) {
      return endToken?.location || { filename: '<unknown>', start: { line: 0, column: 0 }, end: { line: 0, column: 0 } };
    }
    if (!endToken) {
      return startToken.location;
    }
    
    return {
      filename: startToken.location.filename,
      start: {
        line: startToken.location.start.line,
        column: startToken.location.start.column,
      },
      end: {
        line: endToken.location.end.line,
        column: endToken.location.end.column,
      },
    };
  }

  /**
   * Obtenir la location du token courant
   */
  public getCurrentLocation(): any {
    const token = this.peek();
    return token?.location || { filename: '<unknown>', start: { line: 0, column: 0 }, end: { line: 0, column: 0 } };
  }

  /**
   * Synchroniser après une erreur
   */
  public synchronize(): void {
    while (!this.isAtEnd()) {
      const token = this.peek();
      
      if (!token) break;
      
      // Arrêter à un point de synchronisation
      if (token.type === TokenTypes.SEMICOLON) {
        this.advance();
        break;
      }
      
      // Arrêter au début d'une nouvelle déclaration
      if (this.isDeclarationStart(token)) {
        break;
      }
      
      this.advance();
    }
  }

  /**
   * Vérifier si un token peut commencer une déclaration
   */
  private isDeclarationStart(token: Token): boolean {
    const declarationStarts: TokenType[] = [
      TokenTypes.VAR, TokenTypes.LET, TokenTypes.CONST,
      TokenTypes.FUNCTION, TokenTypes.CLASS, TokenTypes.INTERFACE,
      TokenTypes.ENUM, TokenTypes.IMPORT, TokenTypes.EXPORT,
    ];
    return declarationStarts.includes(token.type);
  }

  /**
   * Configurer le parser
   */
  public configure(config: Config): void {
    this.config = config;
    this.recovery = config.getValue('parser')?.recovery ?? true;
    this.maxErrors = config.getValue('parser')?.maxErrors ?? 10;
  }

  /**
   * Réinitialiser le parser
   */
  public reset(): void {
    this.tokens = [];
    this.currentIndex = 0;
    this.errors = [];
  }
}
