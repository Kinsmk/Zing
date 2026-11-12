/**
 * Scopes - Gestion des portées pour Zinga
 * 
 * Ce module fournit des utilitaires pour la gestion des portées
 * et la recherche de symboles.
 */

import { Scope, Symbol, SymbolKind, SymbolTable } from './symbols';
import { SourceLocation } from '../lexer/positions';
import { ASTNode, Identifier } from '../ast/nodes';

/**
 * Gestionnaire de portées
 */
export class ScopeManager {
  private symbolTable: SymbolTable;
  private currentScope: Scope;
  private scopeStack: Scope[] = [];

  constructor(symbolTable: SymbolTable) {
    this.symbolTable = symbolTable;
    this.currentScope = symbolTable.getGlobalScope();
  }

  /**
   * Obtenir le scope courant
   */
  public getCurrentScope(): Scope {
    return this.currentScope;
  }

  /**
   * Définir le scope courant
   */
  public setCurrentScope(scope: Scope): void {
    this.currentScope = scope;
  }

  /**
   * Entrer dans un nouveau scope
   */
  public enterScope(kind: string, owner?: Symbol): Scope {
    const newScope = this.currentScope.createChild(kind, owner);
    this.scopeStack.push(this.currentScope);
    this.currentScope = newScope;
    return newScope;
  }

  /**
   * Sortir du scope courant
   */
  public exitScope(): Scope | null {
    if (this.scopeStack.length === 0) {
      return null;
    }
    const previousScope = this.scopeStack.pop()!;
    this.currentScope = previousScope;
    return previousScope;
  }

  /**
   * Obtenir le scope global
   */
  public getGlobalScope(): Scope {
    return this.symbolTable.getGlobalScope();
  }

  /**
   * Obtenir le scope parent
   */
  public getParentScope(): Scope | null {
    return this.currentScope.parent;
  }

  /**
   * Vérifier si on est dans le scope global
   */
  public isGlobalScope(): boolean {
    return this.currentScope.isGlobal();
  }

  /**
   * Obtenir la profondeur du scope
   */
  public getDepth(): number {
    let depth = 0;
    let scope: Scope | null = this.currentScope;
    while (scope && !scope.isGlobal()) {
      depth++;
      scope = scope.parent;
    }
    return depth;
  }

  /**
   * Ajouter un symbole au scope courant
   */
  public addSymbol(symbol: Symbol): void {
    this.currentScope.addSymbol(symbol);
  }

  /**
   * Obtenir un symbole par nom
   */
  public getSymbol(name: string): Symbol | undefined {
    return this.currentScope.getSymbol(name);
  }

  /**
   * Trouver un symbole dans la hiérarchie
   */
  public findSymbol(name: string): Symbol | undefined {
    let scope: Scope | null = this.currentScope;
    
    while (scope) {
      const symbol = scope.getSymbol(name);
      if (symbol) {
        return symbol;
      }
      scope = scope.parent;
    }
    
    return undefined;
  }

  /**
   * Vérifier si un symbole existe
   */
  public hasSymbol(name: string): boolean {
    return this.findSymbol(name) !== undefined;
  }

  /**
   * Déclarer un symbole
   */
  public declareSymbol(
    name: string,
    kind: SymbolKind,
    location: SourceLocation,
    declaration?: ASTNode
  ): Symbol {
    const symbol = new Symbol(name, kind, this.currentScope, location);
    symbol.declaration = declaration;
    this.addSymbol(symbol);
    return symbol;
  }

  /**
   * Déclarer une variable
   */
  public declareVariable(
    name: string,
    location: SourceLocation,
    declaration?: ASTNode
  ): Symbol {
    return this.declareSymbol(name, SymbolKind.Variable, location, declaration);
  }

  /**
   * Déclarer une constante
   */
  public declareConstant(
    name: string,
    location: SourceLocation,
    declaration?: ASTNode
  ): Symbol {
    return this.declareSymbol(name, SymbolKind.Constant, location, declaration);
  }

  /**
   * Déclarer une fonction
   */
  public declareFunction(
    name: string,
    location: SourceLocation,
    declaration?: ASTNode
  ): Symbol {
    return this.declareSymbol(name, SymbolKind.Function, location, declaration);
  }

  /**
   * Déclarer une classe
   */
  public declareClass(
    name: string,
    location: SourceLocation,
    declaration?: ASTNode
  ): Symbol {
    return this.declareSymbol(name, SymbolKind.Class, location, declaration);
  }

  /**
   * Déclarer une interface
   */
  public declareInterface(
    name: string,
    location: SourceLocation,
    declaration?: ASTNode
  ): Symbol {
    return this.declareSymbol(name, SymbolKind.Interface, location, declaration);
  }

  /**
   * Déclarer un paramètre
   */
  public declareParameter(
    name: string,
    location: SourceLocation,
    declaration?: ASTNode
  ): Symbol {
    return this.declareSymbol(name, SymbolKind.Parameter, location, declaration);
  }

  /**
   * Déclarer un type
   */
  public declareType(
    name: string,
    location: SourceLocation,
    declaration?: ASTNode
  ): Symbol {
    return this.declareSymbol(name, SymbolKind.Type, location, declaration);
  }

  /**
   * Résoudre un identifiant
   */
  public resolveIdentifier(identifier: Identifier): Symbol | undefined {
    return this.findSymbol(identifier.name);
  }

  /**
   * Lier un identifiant à un symbole
   */
  public bindIdentifier(identifier: Identifier, symbol: Symbol): void {
    (identifier as any).symbol = symbol;
    symbol.addReference(identifier);
  }

  /**
   * Obtenir tous les symboles du scope courant
   */
  public getCurrentScopeSymbols(): Symbol[] {
    return this.currentScope.getAllSymbols();
  }

  /**
   * Obtenir tous les symboles
   */
  public getAllSymbols(): Symbol[] {
    return this.symbolTable.getAllSymbols();
  }

  /**
   * Réinitialiser le gestionnaire
   */
  public reset(): void {
    this.currentScope = this.symbolTable.getGlobalScope();
    this.scopeStack = [];
  }
}

/**
 * Constructeur de portées
 */
export class ScopeBuilder {
  private symbolTable: SymbolTable;
  private scopeManager: ScopeManager;

  constructor(symbolTable: SymbolTable) {
    this.symbolTable = symbolTable;
    this.scopeManager = new ScopeManager(symbolTable);
  }

  /**
   * Obtenir le gestionnaire de portées
   */
  public getScopeManager(): ScopeManager {
    return this.scopeManager;
  }

  /**
   * Créer une portée de fonction
   */
  public createFunctionScope(
    name: string,
    location: SourceLocation,
    parameters: Identifier[]
  ): Scope {
    const scope = this.scopeManager.enterScope('function');
    
    // Ajouter les paramètres
    for (const param of parameters) {
      this.scopeManager.declareParameter(param.name, param.location, param);
      this.scopeManager.bindIdentifier(param, this.scopeManager.getSymbol(param.name)!);
    }
    
    return scope;
  }

  /**
   * Créer une portée de classe
   */
  public createClassScope(
    name: string,
    location: SourceLocation
  ): Scope {
    const symbol = this.scopeManager.declareClass(name, location);
    return this.scopeManager.enterScope('class', symbol);
  }

  /**
   * Créer une portée de bloc
   */
  public createBlockScope(): Scope {
    return this.scopeManager.enterScope('block');
  }

  /**
   * Créer une portée de boucle
   */
  public createLoopScope(): Scope {
    return this.scopeManager.enterScope('loop');
  }

  /**
   * Créer une portée de switch
   */
  public createSwitchScope(): Scope {
    return this.scopeManager.enterScope('switch');
  }

  /**
   * Créer une portée de try
   */
  public createTryScope(): Scope {
    return this.scopeManager.enterScope('try');
  }

  /**
   * Créer une portée de catch
   */
  public createCatchScope(
    parameter: Identifier | null,
    location: SourceLocation
  ): Scope {
    const scope = this.scopeManager.enterScope('catch');
    
    if (parameter) {
      const symbol = this.scopeManager.declareParameter(parameter.name, parameter.location, parameter);
      this.scopeManager.bindIdentifier(parameter, symbol);
    }
    
    return scope;
  }

  /**
   * Créer une portée de with
   */
  public createWithScope(object: any): Scope {
    return this.scopeManager.enterScope('with');
  }

  /**
   * Sortir de la portée courante
   */
  public exitScope(): Scope | null {
    return this.scopeManager.exitScope();
  }

  /**
   * Réinitialiser le constructeur
   */
  public reset(): void {
    this.scopeManager.reset();
  }
}

/**
 * Visiteur de portées
 */
export class ScopeVisitor {
  private symbolTable: SymbolTable;
  private currentScope: Scope;
  private scopeStack: Scope[] = [];

  constructor(symbolTable: SymbolTable) {
    this.symbolTable = symbolTable;
    this.currentScope = symbolTable.getGlobalScope();
  }

  /**
   * Visiter un scope
   */
  public visitScope(scope: Scope): void {
    this.scopeStack.push(this.currentScope);
    this.currentScope = scope;
    
    // Traiter le scope
    this.processScope(scope);
    
    // Visiter les enfants
    for (const child of scope.children) {
      this.visitScope(child);
    }
    
    this.currentScope = this.scopeStack.pop()!;
  }

  /**
   * Traiter un scope
   */
  protected processScope(scope: Scope): void {
    // À surcharger par les classes dérivées
  }

  /**
   * Obtenir le scope courant
   */
  public getCurrentScope(): Scope {
    return this.currentScope;
  }

  /**
   * Obtenir la pile des scopes
   */
  public getScopeStack(): Scope[] {
    return [...this.scopeStack];
  }
}

/**
 * Analyseur de portées
 */
export class ScopeAnalyzer extends ScopeVisitor {
  private statistics: {
    totalScopes: number;
    globalSymbols: number;
    localSymbols: number;
    maxDepth: number;
    scopeCounts: Map<string, number>;
  };

  constructor(symbolTable: SymbolTable) {
    super(symbolTable);
    this.statistics = {
      totalScopes: 0,
      globalSymbols: 0,
      localSymbols: 0,
      maxDepth: 0,
      scopeCounts: new Map(),
    };
  }

  protected processScope(scope: Scope): void {
    this.statistics.totalScopes++;
    
    const depth = this.getScopeStack().length;
    if (depth > this.statistics.maxDepth) {
      this.statistics.maxDepth = depth;
    }
    
    const count = scope.getAllSymbols().length;
    if (scope.isGlobal()) {
      this.statistics.globalSymbols += count;
    } else {
      this.statistics.localSymbols += count;
    }
    
    const currentCount = this.statistics.scopeCounts.get(scope.kind) || 0;
    this.statistics.scopeCounts.set(scope.kind, currentCount + 1);
  }

  /**
   * Obtenir les statistiques
   */
  public getStatistics(): any {
    return {
      ...this.statistics,
      scopeCounts: Object.fromEntries(this.statistics.scopeCounts),
    };
  }

  /**
   * Analyser la table des symboles
   */
  public analyze(): any {
    this.visitScope(this.symbolTable.getGlobalScope());
    return this.getStatistics();
  }
}

/**
 * Créer un gestionnaire de portées
 */
export function createScopeManager(symbolTable: SymbolTable): ScopeManager {
  return new ScopeManager(symbolTable);
}

/**
 * Créer un constructeur de portées
 */
export function createScopeBuilder(symbolTable: SymbolTable): ScopeBuilder {
  return new ScopeBuilder(symbolTable);
}

/**
 * Créer un analyseur de portées
 */
export function createScopeAnalyzer(symbolTable: SymbolTable): ScopeAnalyzer {
  return new ScopeAnalyzer(symbolTable);
}
