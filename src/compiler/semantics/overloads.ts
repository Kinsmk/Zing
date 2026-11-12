/**
 * Overloads - Gestion des surcharges de fonctions pour Zinga
 * 
 * Ce module gère la résolution des surcharges de fonctions et
 * la sélection de la bonne signature en fonction des arguments.
 */

import { ASTNode, Expression, CallExpression, Identifier, MemberExpression } from '../ast/nodes';
import { Config } from '../config';
import { DiagnosticCollector, ErrorCode } from '../diagnostics/errors';
import { SymbolTable, Symbol, SymbolKind } from './symbols';
import { Type, TypeKind, PrimitiveType, CompositeType, FunctionType, ArrayType, ObjectType, UnionType, IntersectionType, GenericType, TypeParameter, TypeSystem } from '../types/type-system';
import { TypeInference } from './inference';

export interface Overload {
  signature: FunctionType;
  implementation?: FunctionType;
  priority: number;
  constraints?: TypeConstraint[];
}

export interface TypeConstraint {
  variable: string;
  constraint: 'equals' | 'extends' | 'super' | 'instanceof';
  type?: Type;
}

export interface OverloadOptions {
  config?: Config;
  diagnostics?: DiagnosticCollector;
  symbolTable?: SymbolTable;
  typeSystem?: TypeSystem;
  typeInference?: TypeInference;
}

export class OverloadResolver {
  private config: Config;
  private diagnostics: DiagnosticCollector;
  private symbolTable: SymbolTable;
  private typeSystem: TypeSystem;
  private typeInference: TypeInference;
  
  // Registre des surcharges
  private overloads: Map<string, Overload[]> = new Map();
  
  constructor(options: OverloadOptions = {}) {
    this.config = options.config || new Config();
    this.diagnostics = options.diagnostics || new DiagnosticCollector();
    this.symbolTable = options.symbolTable || new SymbolTable();
    this.typeSystem = options.typeSystem || new TypeSystem();
    this.typeInference = options.typeInference || new TypeInference({ typeSystem: this.typeSystem });
  }

  /**
   * Enregistrer une surcharge
   */
  public registerOverload(name: string, overload: Overload): void {
    if (!this.overloads.has(name)) {
      this.overloads.set(name, []);
    }
    this.overloads.get(name)!.push(overload);
  }

  /**
   * Enregistrer une surcharge à partir d'une déclaration de fonction
   */
  public registerFunctionOverload(
    name: string,
    functionType: FunctionType,
    implementation?: FunctionType,
    priority: number = 0
  ): void {
    const overload: Overload = {
      signature: functionType,
      implementation,
      priority,
    };
    this.registerOverload(name, overload);
  }

  /**
   * Obtenir les surcharges pour un nom
   */
  public getOverloads(name: string): Overload[] {
    return this.overloads.get(name) || [];
  }

  /**
   * Résoudre une surcharge
   */
  public resolveOverload(
    name: string,
    argumentsList: Expression[]
  ): Overload | null {
    const overloads = this.getOverloads(name);
    
    if (overloads.length === 0) {
      return null;
    }
    
    // Inférer les types des arguments
    const argTypes = argumentsList.map(arg => this.typeInference.infer(arg));
    
    // Trouver les surcharges compatibles
    const compatibleOverloads = overloads.filter(overload => {
      return this.isOverloadCompatible(overload, argTypes);
    });
    
    if (compatibleOverloads.length === 0) {
      // Aucune surcharge compatible
      this.diagnostics.addError(
        ErrorCode.TYPE_ERROR,
        `No overload matches this call`,
        argumentsList.length > 0 ? argumentsList[0].location : undefined
      );
      return null;
    }
    
    if (compatibleOverloads.length === 1) {
      return compatibleOverloads[0];
    }
    
    // Plusieurs surcharges compatibles, choisir la plus spécifique
    return this.selectMostSpecificOverload(compatibleOverloads, argTypes);
  }

  /**
   * Vérifier si une surcharge est compatible avec des types d'arguments
   */
  private isOverloadCompatible(overload: Overload, argTypes: Type[]): boolean {
    const signature = overload.signature;
    
    // Vérifier le nombre d'arguments
    if (argTypes.length < signature.parameters.length) {
      // Vérifier si les paramètres restants sont optionnels
      for (let i = argTypes.length; i < signature.parameters.length; i++) {
        if (!this.isOptionalParameter(signature.parameters[i])) {
          return false;
        }
      }
    } else if (argTypes.length > signature.parameters.length) {
      // Vérifier si le dernier paramètre est un paramètre rest
      if (!this.isRestParameter(signature.parameters[signature.parameters.length - 1])) {
        return false;
      }
    }
    
    // Vérifier la compatibilité des types
    for (let i = 0; i < Math.min(argTypes.length, signature.parameters.length); i++) {
      const argType = argTypes[i];
      const paramType = signature.parameters[i];
      
      // Si le paramètre est optionnel et qu'il n'y a pas d'argument, c'est compatible
      if (i >= argTypes.length && this.isOptionalParameter(paramType)) {
        continue;
      }
      
      // Vérifier la compatibilité
      if (!this.typeSystem.isAssignable(argType, paramType)) {
        return false;
      }
    }
    
    // Vérifier les contraintes
    if (overload.constraints) {
      for (const constraint of overload.constraints) {
        if (!this.satisfiesConstraint(constraint)) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Vérifier si un paramètre est optionnel
   */
  private isOptionalParameter(type: Type): boolean {
    // Un paramètre est optionnel si son type est une union avec undefined ou null
    if (type instanceof UnionType) {
      return type.types.some(t => 
        this.typeSystem.isUndefined(t) || 
        this.typeSystem.isNull(t)
      );
    }
    return false;
  }

  /**
   * Vérifier si un paramètre est un paramètre rest
   */
  private isRestParameter(type: Type): boolean {
    // Un paramètre rest est un tableau
    return type instanceof ArrayType;
  }

  /**
   * Vérifier si une contrainte est satisfaite
   */
  private satisfiesConstraint(constraint: TypeConstraint): boolean {
    switch (constraint.constraint) {
      case 'equals':
        // Vérifier l'égalité des types
        return true; // À implémenter
      case 'extends':
        // Vérifier l'héritage
        return true; // À implémenter
      case 'super':
        // Vérifier la classe parente
        return true; // À implémenter
      case 'instanceof':
        // Vérifier l'instance
        return true; // À implémenter
      default:
        return false;
    }
  }

  /**
   * Sélectionner la surcharge la plus spécifique
   */
  private selectMostSpecificOverload(
    overloads: Overload[],
    argTypes: Type[]
  ): Overload {
    // Trouver la surcharge avec la priorité la plus élevée
    let bestOverload = overloads[0];
    
    for (const overload of overloads) {
      if (overload.priority > bestOverload.priority) {
        bestOverload = overload;
      }
    }
    
    return bestOverload;
  }

  /**
   * Résoudre un appel de fonction avec surcharges
   */
  public resolveCallExpression(node: CallExpression): Type | null {
    // Obtenir le nom de la fonction
    const functionName = this.getFunctionName(node.callee);
    
    if (!functionName) {
      return null;
    }
    
    // Résoudre la surcharge
    const overload = this.resolveOverload(functionName, node.arguments);
    
    if (!overload) {
      return null;
    }
    
    // Retourner le type de retour
    return overload.signature.returnType;
  }

  /**
   * Obtenir le nom d'une fonction
   */
  private getFunctionName(callee: Expression): string | null {
    if (callee.type === 'Identifier') {
      return (callee as Identifier).name;
    } else if (callee.type === 'MemberExpression') {
      const memberExpr = callee as MemberExpression;
      if (!memberExpr.computed && memberExpr.property.type === 'Identifier') {
        return (memberExpr.property as Identifier).name;
      }
    }
    return null;
  }

  /**
   * Vérifier si une fonction a des surcharges
   */
  public hasOverloads(name: string): boolean {
    return this.overloads.has(name) && this.overloads.get(name)!.length > 0;
  }

  /**
   * Obtenir le nombre de surcharges pour un nom
   */
  public getOverloadCount(name: string): number {
    return this.overloads.get(name)?.length || 0;
  }

  /**
   * Supprimer une surcharge
   */
  public removeOverload(name: string, signature: FunctionType): boolean {
    const overloads = this.overloads.get(name);
    
    if (!overloads) {
      return false;
    }
    
    const index = overloads.findIndex(o => 
      this.typeSystem.areEqual(o.signature, signature)
    );
    
    if (index !== -1) {
      overloads.splice(index, 1);
      if (overloads.length === 0) {
        this.overloads.delete(name);
      }
      return true;
    }
    
    return false;
  }

  /**
   * Supprimer toutes les surcharges pour un nom
   */
  public removeAllOverloads(name: string): boolean {
    return this.overloads.delete(name);
  }

  /**
   * Effacer toutes les surcharges
   */
  public clearOverloads(): void {
    this.overloads.clear();
  }

  /**
   * Obtenir le type système
   */
  public getTypeSystem(): TypeSystem {
    return this.typeSystem;
  }

  /**
   * Configurer le résolveur de surcharges
   */
  public configure(options: OverloadOptions): void {
    this.config = options.config || this.config;
    this.diagnostics = options.diagnostics || this.diagnostics;
    this.symbolTable = options.symbolTable || this.symbolTable;
    this.typeSystem = options.typeSystem || this.typeSystem;
    this.typeInference = options.typeInference || this.typeInference;
  }

  /**
   * Réinitialiser le résolveur de surcharges
   */
  public reset(): void {
    this.overloads.clear();
  }
}

/**
 * Gestionnaire de surcharges
 */
export class OverloadManager {
  private resolver: OverloadResolver;
  private symbolTable: SymbolTable;

  constructor(symbolTable: SymbolTable, resolver?: OverloadResolver) {
    this.symbolTable = symbolTable;
    this.resolver = resolver || new OverloadResolver();
  }

  /**
   * Enregistrer une surcharge à partir d'une déclaration
   */
  public registerFromDeclaration(node: ASTNode): void {
    if (node.type === 'FunctionDeclaration') {
      const funcDecl = node as any;
      this.registerFunction(funcDecl);
    }
  }

  /**
   * Enregistrer une fonction
   */
  private registerFunction(node: any): void {
    if (!node.id) {
      return; // Fonction anonyme
    }
    
    const name = node.id.name;
    const symbol = this.symbolTable.getSymbol(name);
    
    if (!symbol || !symbol.valueType) {
      return;
    }
    
    const functionType = symbol.valueType as FunctionType;
    this.resolver.registerFunctionOverload(name, functionType, functionType);
  }

  /**
   * Résoudre un appel
   */
  public resolveCall(node: CallExpression): Type | null {
    return this.resolver.resolveCallExpression(node);
  }

  /**
   * Obtenir le résolveur
   */
  public getResolver(): OverloadResolver {
    return this.resolver;
  }

  /**
   * Configurer le gestionnaire
   */
  public configure(options: OverloadOptions): void {
    this.resolver.configure(options);
  }
}

/**
 * Créer un résolveur de surcharges
 */
export function createOverloadResolver(options?: OverloadOptions): OverloadResolver {
  return new OverloadResolver(options);
}

/**
 * Créer un gestionnaire de surcharges
 */
export function createOverloadManager(
  symbolTable: SymbolTable,
  resolver?: OverloadResolver
): OverloadManager {
  return new OverloadManager(symbolTable, resolver);
}
