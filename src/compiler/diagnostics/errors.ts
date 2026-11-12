/**
 * Errors - Gestion des erreurs pour Zinga
 * 
 * Ce module gère toutes les erreurs et avertissements générés pendant
 * la compilation.
 */

import { Token } from '../lexer/tokens';
import { Position, SourceLocation } from '../lexer/positions';

/**
 * Niveaux de sévérité
 */
export type Severity = 'error' | 'warning' | 'info' | 'debug';

/**
 * Codes d'erreur
 */
export enum ErrorCode {
  // Erreurs de syntaxe
  SYNTAX_ERROR = 'E0001',
  UNEXPECTED_TOKEN = 'E0002',
  EXPECTED_TOKEN = 'E0003',
  MISSING_TOKEN = 'E0004',
  INVALID_TOKEN = 'E0005',

  // Erreurs de déclaration
  DUPLICATE_DECLARATION = 'E0101',
  UNDECLARED_IDENTIFIER = 'E0102',
  REDECLARED_IDENTIFIER = 'E0103',
  INVALID_DECLARATION = 'E0104',

  // Erreurs de type
  TYPE_ERROR = 'E0201',
  INCOMPATIBLE_TYPES = 'E0202',
  UNDEFINED_TYPE = 'E0203',
  INVALID_TYPE = 'E0204',

  // Erreurs sémantiques
  SEMANTIC_ERROR = 'E0301',
  INVALID_ASSIGNMENT = 'E0302',
  INVALID_OPERATION = 'E0303',
  INVALID_ACCESS = 'E0304',

  // Erreurs de compilation
  COMPILATION_ERROR = 'E0401',
  BACKEND_ERROR = 'E0402',
  OPTIMIZATION_ERROR = 'E0403',

  // Erreurs d'exécution
  RUNTIME_ERROR = 'E0501',
  MEMORY_ERROR = 'E0502',
  TIMEOUT_ERROR = 'E0503',

  // Erreurs de sécurité
  SECURITY_ERROR = 'E0601',
  PERMISSION_ERROR = 'E0602',
  ISOLATION_ERROR = 'E0603',

  // Avertissements
  UNUSED_VARIABLE = 'W0001',
  UNREACHABLE_CODE = 'W0002',
  DEPRECATED = 'W0003',
  MISSING_RETURN = 'W0004',
  POSSIBLE_NULL = 'W0005',
}

/**
 * Description d'une erreur
 */
export interface Diagnostic {
  code: ErrorCode;
  message: string;
  severity: Severity;
  location: SourceLocation;
  token?: Token;
  related?: Diagnostic[];
  stack?: string;
  hint?: string;
}

/**
 * Constructeur de diagnostics
 */
export class DiagnosticBuilder {
  private code: ErrorCode | undefined;
  private message: string | undefined;
  private severity: Severity = 'error';
  private location: SourceLocation | undefined;
  private token: Token | undefined;
  private related: Diagnostic[] = [];
  private stack: string | undefined;
  private hint: string | undefined;

  constructor() {}

  withCode(code: ErrorCode): this {
    this.code = code;
    return this;
  }

  withMessage(message: string): this {
    this.message = message;
    return this;
  }

  withSeverity(severity: Severity): this {
    this.severity = severity;
    return this;
  }

  withLocation(location: SourceLocation): this {
    this.location = location;
    return this;
  }

  withToken(token: Token): this {
    this.token = token;
    if (token.location && !this.location) {
      this.location = token.location;
    }
    return this;
  }

  withRelated(related: Diagnostic[]): this {
    this.related = related;
    return this;
  }

  withStack(stack: string): this {
    this.stack = stack;
    return this;
  }

  withHint(hint: string): this {
    this.hint = hint;
    return this;
  }

  build(): Diagnostic {
    if (!this.code) {
      throw new Error('Diagnostic must have a code');
    }
    if (!this.message) {
      throw new Error('Diagnostic must have a message');
    }
    if (!this.location) {
      this.location = new SourceLocation('<unknown>', 
        new Position(0, 0, 0),
        new Position(0, 0, 0)
      );
    }

    return {
      code: this.code,
      message: this.message,
      severity: this.severity,
      location: this.location,
      token: this.token,
      related: this.related,
      stack: this.stack,
      hint: this.hint,
    };
  }
}

/**
 * Collecteur de diagnostics
 */
export class DiagnosticCollector {
  private diagnostics: Diagnostic[] = [];
  private maxErrors: number = 100;
  private maxWarnings: number = 100;

  constructor(maxErrors: number = 100, maxWarnings: number = 100) {
    this.maxErrors = maxErrors;
    this.maxWarnings = maxWarnings;
  }

  /**
   * Ajouter un diagnostic
   */
  public add(diagnostic: Diagnostic): void {
    // Ne pas dépasser les limites
    if (diagnostic.severity === 'error' && this.countErrors() >= this.maxErrors) {
      return;
    }
    if (diagnostic.severity === 'warning' && this.countWarnings() >= this.maxWarnings) {
      return;
    }

    this.diagnostics.push(diagnostic);
  }

  /**
   * Ajouter une erreur
   */
  public addError(
    code: ErrorCode,
    message: string,
    location?: SourceLocation,
    token?: Token,
    related?: Diagnostic[],
    hint?: string
  ): Diagnostic {
    const diagnostic = new DiagnosticBuilder()
      .withCode(code)
      .withMessage(message)
      .withSeverity('error')
      .withLocation(location || new SourceLocation('<unknown>', 
        new Position(0, 0, 0),
        new Position(0, 0, 0)
      ))
      .withToken(token)
      .withRelated(related || [])
      .withHint(hint)
      .build();

    this.add(diagnostic);
    return diagnostic;
  }

  /**
   * Ajouter un avertissement
   */
  public addWarning(
    code: ErrorCode,
    message: string,
    location?: SourceLocation,
    token?: Token,
    hint?: string
  ): Diagnostic {
    const diagnostic = new DiagnosticBuilder()
      .withCode(code)
      .withMessage(message)
      .withSeverity('warning')
      .withLocation(location || new SourceLocation('<unknown>', 
        new Position(0, 0, 0),
        new Position(0, 0, 0)
      ))
      .withToken(token)
      .withHint(hint)
      .build();

    this.add(diagnostic);
    return diagnostic;
  }

  /**
   * Ajouter une information
   */
  public addInfo(
    code: ErrorCode,
    message: string,
    location?: SourceLocation,
    token?: Token
  ): Diagnostic {
    const diagnostic = new DiagnosticBuilder()
      .withCode(code)
      .withMessage(message)
      .withSeverity('info')
      .withLocation(location || new SourceLocation('<unknown>', 
        new Position(0, 0, 0),
        new Position(0, 0, 0)
      ))
      .withToken(token)
      .build();

    this.add(diagnostic);
    return diagnostic;
  }

  /**
   * Obtenir tous les diagnostics
   */
  public getAll(): Diagnostic[] {
    return [...this.diagnostics];
  }

  /**
   * Obtenir les erreurs
   */
  public getErrors(): Diagnostic[] {
    return this.diagnostics.filter(d => d.severity === 'error');
  }

  /**
   * Obtenir les avertissements
   */
  public getWarnings(): Diagnostic[] {
    return this.diagnostics.filter(d => d.severity === 'warning');
  }

  /**
   * Obtenir les informations
   */
  public getInfos(): Diagnostic[] {
    return this.diagnostics.filter(d => d.severity === 'info');
  }

  /**
   * Compter le nombre total de diagnostics
   */
  public count(): number {
    return this.diagnostics.length;
  }

  /**
   * Compter le nombre d'erreurs
   */
  public countErrors(): number {
    return this.diagnostics.filter(d => d.severity === 'error').length;
  }

  /**
   * Compter le nombre d'avertissements
   */
  public countWarnings(): number {
    return this.diagnostics.filter(d => d.severity === 'warning').length;
  }

  /**
   * Vérifier s'il y a des erreurs
   */
  public hasErrors(): boolean {
    return this.countErrors() > 0;
  }

  /**
   * Vérifier s'il y a des avertissements
   */
  public hasWarnings(): boolean {
    return this.countWarnings() > 0;
  }

  /**
   * Vérifier s'il y a des diagnostics
   */
  public hasDiagnostics(): boolean {
    return this.diagnostics.length > 0;
  }

  /**
   * Effacer tous les diagnostics
   */
  public clear(): void {
    this.diagnostics = [];
  }

  /**
   * Filtrer les diagnostics
   */
  public filter(predicate: (diagnostic: Diagnostic) => boolean): Diagnostic[] {
    return this.diagnostics.filter(predicate);
  }

  /**
   * Trouver un diagnostic
   */
  public find(predicate: (diagnostic: Diagnostic) => boolean): Diagnostic | undefined {
    return this.diagnostics.find(predicate);
  }

  /**
   * Trouver tous les diagnostics correspondant
   */
  public findAll(predicate: (diagnostic: Diagnostic) => boolean): Diagnostic[] {
    return this.diagnostics.filter(predicate);
  }

  /**
   * Configurer les limites
   */
  public setLimits(maxErrors: number, maxWarnings: number): void {
    this.maxErrors = maxErrors;
    this.maxWarnings = maxWarnings;
  }

  /**
   * Fusionner avec un autre collecteur
   */
  public merge(other: DiagnosticCollector): void {
    for (const diagnostic of other.getAll()) {
      this.add(diagnostic);
    }
  }
}

/**
 * Formatage des diagnostics
 */
export class DiagnosticFormatter {
  protected useColors: boolean;

  constructor(useColors: boolean = true) {
    this.useColors = useColors;
  }

  /**
   * Formater un diagnostic
   */
  public format(diagnostic: Diagnostic): string {
    const severity = this.formatSeverity(diagnostic.severity);
    const code = this.formatCode(diagnostic.code);
    const location = this.formatLocation(diagnostic.location);
    const message = diagnostic.message;
    const hint = diagnostic.hint ? this.formatHint(diagnostic.hint) : '';

    return `${severity} ${code} ${location}: ${message}${hint}`;
  }

  /**
   * Formater plusieurs diagnostics
   */
  public formatAll(diagnostics: Diagnostic[]): string {
    return diagnostics.map(d => this.format(d)).join('\n');
  }

  /**
   * Formater la sévérité
   */
  protected formatSeverity(severity: Severity): string {
    const colors = {
      error: this.useColors ? '\x1b[31m' : '', // Rouge
      warning: this.useColors ? '\x1b[33m' : '', // Jaune
      info: this.useColors ? '\x1b[36m' : '', // Cyan
      debug: this.useColors ? '\x1b[35m' : '', // Magenta
    };
    
    const labels = {
      error: 'error',
      warning: 'warning',
      info: 'info',
      debug: 'debug',
    };

    const color = colors[severity] || '';
    const reset = this.useColors ? '\x1b[0m' : '';
    const label = labels[severity] || severity;

    return `${color}${label.toUpperCase().padEnd(7)}${reset}`;
  }

  /**
   * Formater le code d'erreur
   */
  protected formatCode(code: ErrorCode): string {
    return `[${code}]`;
  }

  /**
   * Formater la location
   */
  protected formatLocation(location: SourceLocation): string {
    if (location.filename === '<unknown>') {
      return `${location.start.line + 1}:${location.start.column + 1}`;
    }
    return `${location.filename}:${location.start.line + 1}:${location.start.column + 1}`;
  }

  /**
   * Formater un indice
   */
  protected formatHint(hint: string): string {
    return `\n    hint: ${hint}`;
  }

  /**
   * Formater un diagnostic avec contexte
   */
  public formatWithContext(diagnostic: Diagnostic, source: string): string {
    const lines = source.split('\n');
    const lineNumber = diagnostic.location.start.line;
    const columnNumber = diagnostic.location.start.column;

    const severity = this.formatSeverity(diagnostic.severity);
    const code = this.formatCode(diagnostic.code);
    const location = this.formatLocation(diagnostic.location);
    const message = diagnostic.message;

    let result = `${severity} ${code} ${location}: ${message}\n`;

    // Ajouter le contexte
    if (lines.length > lineNumber) {
      const line = lines[lineNumber];
      result += `    ${lineNumber + 1} | ${line}\n`;
      result += `       | ${' '.repeat(columnNumber)}^\n`;
    }

    if (diagnostic.hint) {
      result += `    hint: ${diagnostic.hint}\n`;
    }

    return result;
  }

  /**
   * Configurer l'utilisation des couleurs
   */
  public setUseColors(useColors: boolean): void {
    this.useColors = useColors;
  }
}

/**
 * Fabrique de diagnostics
 */
export class DiagnosticFactory {
  private collector: DiagnosticCollector;

  constructor(collector: DiagnosticCollector) {
    this.collector = collector;
  }

  /**
   * Créer une erreur de syntaxe
   */
  public syntaxError(
    message: string,
    location?: SourceLocation,
    token?: Token,
    hint?: string
  ): Diagnostic {
    return this.collector.addError(
      ErrorCode.SYNTAX_ERROR,
      message,
      location,
      token,
      undefined,
      hint
    );
  }

  /**
   * Créer une erreur de token inattendu
   */
  public unexpectedToken(
    token: Token,
    expected?: string,
    hint?: string
  ): Diagnostic {
    const message = expected 
      ? `Unexpected token '${token.value}', expected ${expected}`
      : `Unexpected token '${token.value}'`;
    return this.collector.addError(
      ErrorCode.UNEXPECTED_TOKEN,
      message,
      token.location,
      token,
      undefined,
      hint
    );
  }

  /**
   * Créer une erreur de token attendu
   */
  public expectedToken(
    expected: string,
    location?: SourceLocation,
    token?: Token,
    hint?: string
  ): Diagnostic {
    return this.collector.addError(
      ErrorCode.EXPECTED_TOKEN,
      `Expected ${expected}`,
      location,
      token,
      undefined,
      hint
    );
  }

  /**
   * Créer une erreur de token manquant
   */
  public missingToken(
    token: string,
    location?: SourceLocation,
    hint?: string
  ): Diagnostic {
    return this.collector.addError(
      ErrorCode.MISSING_TOKEN,
      `Missing ${token}`,
      location,
      undefined,
      undefined,
      hint
    );
  }

  /**
   * Créer une erreur de déclaration en double
   */
  public duplicateDeclaration(
    name: string,
    location?: SourceLocation,
    token?: Token,
    previousLocation?: SourceLocation
  ): Diagnostic {
    const message = `Identifier '${name}' has already been declared`;
    const related = previousLocation 
      ? [this.collector.addError(
          ErrorCode.DUPLICATE_DECLARATION,
          `Previous declaration of '${name}'`,
          previousLocation
        )]
      : [];
    
    return this.collector.addError(
      ErrorCode.DUPLICATE_DECLARATION,
      message,
      location,
      token,
      related,
      `Rename or remove the duplicate declaration`
    );
  }

  /**
   * Créer une erreur d'identifiant non déclaré
   */
  public undeclaredIdentifier(
    name: string,
    location?: SourceLocation,
    token?: Token,
    hint?: string
  ): Diagnostic {
    return this.collector.addError(
      ErrorCode.UNDECLARED_IDENTIFIER,
      `Identifier '${name}' has not been declared`,
      location,
      token,
      undefined,
      hint || `Declare the identifier before using it`
    );
  }

  /**
   * Créer une erreur de type
   */
  public typeError(
    message: string,
    location?: SourceLocation,
    token?: Token,
    hint?: string
  ): Diagnostic {
    return this.collector.addError(
      ErrorCode.TYPE_ERROR,
      message,
      location,
      token,
      undefined,
      hint
    );
  }

  /**
   * Créer une erreur d'incompatibilité de types
   */
  public incompatibleTypes(
    expected: string,
    actual: string,
    location?: SourceLocation,
    token?: Token
  ): Diagnostic {
    return this.collector.addError(
      ErrorCode.INCOMPATIBLE_TYPES,
      `Type '${actual}' is not assignable to type '${expected}'`,
      location,
      token,
      undefined,
      `Change the type or the value`
    );
  }

  /**
   * Créer un avertissement de variable non utilisée
   */
  public unusedVariable(
    name: string,
    location?: SourceLocation,
    token?: Token
  ): Diagnostic {
    return this.collector.addWarning(
      ErrorCode.UNUSED_VARIABLE,
      `Variable '${name}' is declared but never used`,
      location,
      token,
      `Remove the variable or use it`
    );
  }

  /**
   * Créer un avertissement de code inaccessible
   */
  public unreachableCode(
    location?: SourceLocation,
    token?: Token
  ): Diagnostic {
    return this.collector.addWarning(
      ErrorCode.UNREACHABLE_CODE,
      `Unreachable code`,
      location,
      token,
      `Remove the unreachable code`
    );
  }

  /**
   * Créer un avertissement de fonction dépréciée
   */
  public deprecated(
    name: string,
    message: string,
    location?: SourceLocation,
    token?: Token
  ): Diagnostic {
    return this.collector.addWarning(
      ErrorCode.DEPRECATED,
      `${name} is deprecated: ${message}`,
      location,
      token,
      `Use an alternative`
    );
  }
}

/**
 * Gestionnaire global des diagnostics
 */
export class DiagnosticManager {
  private static instance: DiagnosticManager;
  private collector: DiagnosticCollector;
  private formatter: DiagnosticFormatter;
  private factory: DiagnosticFactory;

  private constructor() {
    this.collector = new DiagnosticCollector();
    this.formatter = new DiagnosticFormatter();
    this.factory = new DiagnosticFactory(this.collector);
  }

  public static getInstance(): DiagnosticManager {
    if (!DiagnosticManager.instance) {
      DiagnosticManager.instance = new DiagnosticManager();
    }
    return DiagnosticManager.instance;
  }

  public getCollector(): DiagnosticCollector {
    return this.collector;
  }

  public getFormatter(): DiagnosticFormatter {
    return this.formatter;
  }

  public getFactory(): DiagnosticFactory {
    return this.factory;
  }

  public reset(): void {
    this.collector.clear();
  }
}

/**
 * Obtenir le gestionnaire global des diagnostics
 */
export function getDiagnosticManager(): DiagnosticManager {
  return DiagnosticManager.getInstance();
}

/**
 * Créer un collecteur de diagnostics
 */
export function createDiagnosticCollector(): DiagnosticCollector {
  return new DiagnosticCollector();
}

/**
 * Créer un formatteur de diagnostics
 */
export function createDiagnosticFormatter(useColors: boolean = true): DiagnosticFormatter {
  return new DiagnosticFormatter(useColors);
}
