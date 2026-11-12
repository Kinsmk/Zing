/**
 * Warnings - Gestion des avertissements pour Zinga
 * 
 * Ce module gère spécifiquement les avertissements générés pendant
 * la compilation.
 */

import { DiagnosticCollector, ErrorCode } from './errors';
import { SourceLocation } from '../lexer/positions';
import { Token } from '../lexer/tokens';

/**
 * Types d'avertissements
 */
export enum WarningType {
  // Utilisation
  UNUSED_VARIABLE = 'unused_variable',
  UNUSED_FUNCTION = 'unused_function',
  UNUSED_CLASS = 'unused_class',
  UNUSED_IMPORT = 'unused_import',
  
  // Code
  UNREACHABLE_CODE = 'unreachable_code',
  DEAD_CODE = 'dead_code',
  MISSING_RETURN = 'missing_return',
  POSSIBLE_NULL = 'possible_null',
  POSSIBLE_UNDEFINED = 'possible_undefined',
  
  // Style
  DEPRECATED = 'deprecated',
  OBSOLETE = 'obsolete',
  BAD_PRACTICE = 'bad_practice',
  COMPLEX_EXPRESSION = 'complex_expression',
  LONG_FUNCTION = 'long_function',
  TOO_MANY_PARAMETERS = 'too_many_parameters',
  
  // Performance
  INEFFICIENT = 'inefficient',
  SLOW_OPERATION = 'slow_operation',
  
  // Sécurité
  UNSAFE_OPERATION = 'unsafe_operation',
  MISSING_VALIDATION = 'missing_validation',
  
  // Compatibilité
  COMPATIBILITY = 'compatibility',
  EXPERIMENTAL = 'experimental',
}

/**
 * Gestionnaire des avertissements
 */
export class WarningManager {
  private collector: DiagnosticCollector;
  private enabledWarnings: Set<WarningType>;
  private disabledWarnings: Set<WarningType>;
  private warningThresholds: Map<WarningType, number>;

  constructor(collector: DiagnosticCollector) {
    this.collector = collector;
    this.enabledWarnings = new Set();
    this.disabledWarnings = new Set();
    this.warningThresholds = new Map();

    // Activer tous les avertissements par défaut
    this.enableAll();
  }

  /**
   * Activer tous les avertissements
   */
  public enableAll(): void {
    this.enabledWarnings.clear();
    this.disabledWarnings.clear();
  }

  /**
   * Désactiver tous les avertissements
   */
  public disableAll(): void {
    this.disabledWarnings.clear();
    for (const type of Object.values(WarningType)) {
      this.disabledWarnings.add(type as WarningType);
    }
    this.enabledWarnings.clear();
  }

  /**
   * Activer un type d'avertissement
   */
  public enable(type: WarningType): void {
    this.enabledWarnings.add(type);
    this.disabledWarnings.delete(type);
  }

  /**
   * Désactiver un type d'avertissement
   */
  public disable(type: WarningType): void {
    this.disabledWarnings.add(type);
    this.enabledWarnings.delete(type);
  }

  /**
   * Vérifier si un type d'avertissement est activé
   */
  public isEnabled(type: WarningType): boolean {
    return !this.disabledWarnings.has(type);
  }

  /**
   * Définir un seuil pour un type d'avertissement
   */
  public setThreshold(type: WarningType, threshold: number): void {
    this.warningThresholds.set(type, threshold);
  }

  /**
   * Obtenir le seuil pour un type d'avertissement
   */
  public getThreshold(type: WarningType): number | undefined {
    return this.warningThresholds.get(type);
  }

  /**
   * Ajouter un avertissement
   */
  public add(
    type: WarningType,
    message: string,
    location?: SourceLocation,
    token?: Token,
    hint?: string
  ): void {
    // Vérifier si le type est activé
    if (!this.isEnabled(type)) {
      return;
    }

    // Vérifier le seuil
    const threshold = this.getThreshold(type);
    if (threshold !== undefined) {
      const count = this.collector.getWarnings()
        .filter(w => w.message.includes(type))
        .length;
      if (count >= threshold) {
        return;
      }
    }

    // Mapper le type à un code d'erreur
    const code = this.mapWarningTypeToCode(type);

    this.collector.addWarning(
      code,
      message,
      location,
      token,
      hint
    );
  }

  /**
   * Mapper un type d'avertissement à un code d'erreur
   */
  private mapWarningTypeToCode(type: WarningType): ErrorCode {
    const mapping: Record<WarningType, ErrorCode> = {
      [WarningType.UNUSED_VARIABLE]: ErrorCode.UNUSED_VARIABLE,
      [WarningType.UNUSED_FUNCTION]: ErrorCode.UNUSED_VARIABLE,
      [WarningType.UNUSED_CLASS]: ErrorCode.UNUSED_VARIABLE,
      [WarningType.UNUSED_IMPORT]: ErrorCode.UNUSED_VARIABLE,
      [WarningType.UNREACHABLE_CODE]: ErrorCode.UNREACHABLE_CODE,
      [WarningType.DEAD_CODE]: ErrorCode.UNREACHABLE_CODE,
      [WarningType.MISSING_RETURN]: ErrorCode.MISSING_RETURN,
      [WarningType.POSSIBLE_NULL]: ErrorCode.POSSIBLE_NULL,
      [WarningType.POSSIBLE_UNDEFINED]: ErrorCode.POSSIBLE_NULL,
      [WarningType.DEPRECATED]: ErrorCode.DEPRECATED,
      [WarningType.OBSOLETE]: ErrorCode.DEPRECATED,
      [WarningType.BAD_PRACTICE]: ErrorCode.DEPRECATED,
      [WarningType.COMPLEX_EXPRESSION]: ErrorCode.DEPRECATED,
      [WarningType.LONG_FUNCTION]: ErrorCode.DEPRECATED,
      [WarningType.TOO_MANY_PARAMETERS]: ErrorCode.DEPRECATED,
      [WarningType.INEFFICIENT]: ErrorCode.DEPRECATED,
      [WarningType.SLOW_OPERATION]: ErrorCode.DEPRECATED,
      [WarningType.UNSAFE_OPERATION]: ErrorCode.DEPRECATED,
      [WarningType.MISSING_VALIDATION]: ErrorCode.DEPRECATED,
      [WarningType.COMPATIBILITY]: ErrorCode.DEPRECATED,
      [WarningType.EXPERIMENTAL]: ErrorCode.DEPRECATED,
    };

    return mapping[type] || ErrorCode.DEPRECATED;
  }

  /**
   * Obtenir tous les avertissements
   */
  public getAll(): any[] {
    return this.collector.getWarnings();
  }

  /**
   * Obtenir les avertissements par type
   */
  public getByType(type: WarningType): any[] {
    return this.collector.getWarnings()
      .filter(w => w.message.includes(type));
  }

  /**
   * Compter les avertissements
   */
  public count(): number {
    return this.collector.countWarnings();
  }

  /**
   * Compter les avertissements par type
   */
  public countByType(type: WarningType): number {
    return this.getByType(type).length;
  }

  /**
   * Vérifier s'il y a des avertissements
   */
  public hasWarnings(): boolean {
    return this.collector.hasWarnings();
  }

  /**
   * Vérifier s'il y a des avertissements d'un type spécifique
   */
  public hasType(type: WarningType): boolean {
    return this.getByType(type).length > 0;
  }

  /**
   * Effacer tous les avertissements
   */
  public clear(): void {
    // On ne peut pas effacer uniquement les avertissements, donc on efface tout
    // et on réajoute les erreurs
    const errors = this.collector.getErrors();
    this.collector.clear();
    for (const error of errors) {
      this.collector.add(error);
    }
  }
}

/**
 * Fabrique d'avertissements
 */
export class WarningFactory {
  private manager: WarningManager;

  constructor(manager: WarningManager) {
    this.manager = manager;
  }

  /**
   * Créer un avertissement de variable non utilisée
   */
  public unusedVariable(
    name: string,
    location?: SourceLocation,
    token?: Token
  ): void {
    this.manager.add(
      WarningType.UNUSED_VARIABLE,
      `Variable '${name}' is declared but never used`,
      location,
      token,
      `Remove the variable or use it`
    );
  }

  /**
   * Créer un avertissement de fonction non utilisée
   */
  public unusedFunction(
    name: string,
    location?: SourceLocation,
    token?: Token
  ): void {
    this.manager.add(
      WarningType.UNUSED_FUNCTION,
      `Function '${name}' is declared but never used`,
      location,
      token,
      `Remove the function or use it`
    );
  }

  /**
   * Créer un avertissement de classe non utilisée
   */
  public unusedClass(
    name: string,
    location?: SourceLocation,
    token?: Token
  ): void {
    this.manager.add(
      WarningType.UNUSED_CLASS,
      `Class '${name}' is declared but never used`,
      location,
      token,
      `Remove the class or use it`
    );
  }

  /**
   * Créer un avertissement d'import non utilisé
   */
  public unusedImport(
    name: string,
    location?: SourceLocation,
    token?: Token
  ): void {
    this.manager.add(
      WarningType.UNUSED_IMPORT,
      `Import '${name}' is declared but never used`,
      location,
      token,
      `Remove the import or use it`
    );
  }

  /**
   * Créer un avertissement de code inaccessible
   */
  public unreachableCode(
    location?: SourceLocation,
    token?: Token
  ): void {
    this.manager.add(
      WarningType.UNREACHABLE_CODE,
      `Unreachable code`,
      location,
      token,
      `Remove the unreachable code`
    );
  }

  /**
   * Créer un avertissement de code mort
   */
  public deadCode(
    message: string,
    location?: SourceLocation,
    token?: Token,
    hint?: string
  ): void {
    this.manager.add(
      WarningType.DEAD_CODE,
      message,
      location,
      token,
      hint
    );
  }

  /**
   * Créer un avertissement de retour manquant
   */
  public missingReturn(
    functionName: string,
    returnType: string,
    location?: SourceLocation,
    token?: Token
  ): void {
    this.manager.add(
      WarningType.MISSING_RETURN,
      `Function '${functionName}' should return a value of type '${returnType}' but doesn't return anything`,
      location,
      token,
      `Add a return statement`
    );
  }

  /**
   * Créer un avertissement de null possible
   */
  public possibleNull(
    expression: string,
    location?: SourceLocation,
    token?: Token
  ): void {
    this.manager.add(
      WarningType.POSSIBLE_NULL,
      `Expression '${expression}' may be null`,
      location,
      token,
      `Add a null check`
    );
  }

  /**
   * Créer un avertissement de undefined possible
   */
  public possibleUndefined(
    expression: string,
    location?: SourceLocation,
    token?: Token
  ): void {
    this.manager.add(
      WarningType.POSSIBLE_UNDEFINED,
      `Expression '${expression}' may be undefined`,
      location,
      token,
      `Add a check for undefined`
    );
  }

  /**
   * Créer un avertissement de dépréciation
   */
  public deprecated(
    name: string,
    message: string,
    location?: SourceLocation,
    token?: Token
  ): void {
    this.manager.add(
      WarningType.DEPRECATED,
      `${name} is deprecated: ${message}`,
      location,
      token,
      `Use an alternative`
    );
  }

  /**
   * Créer un avertissement de mauvaise pratique
   */
  public badPractice(
    message: string,
    location?: SourceLocation,
    token?: Token,
    hint?: string
  ): void {
    this.manager.add(
      WarningType.BAD_PRACTICE,
      message,
      location,
      token,
      hint
    );
  }

  /**
   * Créer un avertissement de compatibilité
   */
  public compatibility(
    feature: string,
    message: string,
    location?: SourceLocation,
    token?: Token
  ): void {
    this.manager.add(
      WarningType.COMPATIBILITY,
      `${feature} may not be compatible: ${message}`,
      location,
      token,
      `Check compatibility requirements`
    );
  }

  /**
   * Créer un avertissement expérimental
   */
  public experimental(
    feature: string,
    location?: SourceLocation,
    token?: Token
  ): void {
    this.manager.add(
      WarningType.EXPERIMENTAL,
      `${feature} is experimental and may change in the future`,
      location,
      token,
      `Avoid using experimental features in production`
    );
  }
}

/**
 * Créer un gestionnaire d'avertissements
 */
export function createWarningManager(collector: DiagnosticCollector): WarningManager {
  return new WarningManager(collector);
}

/**
 * Créer une fabrique d'avertissements
 */
export function createWarningFactory(manager: WarningManager): WarningFactory {
  return new WarningFactory(manager);
}
