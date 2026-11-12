/**
 * Symbols - Gestion des symboles pour Zinga
 * 
 * Ce module définit la structure des symboles et la table des symboles
 * utilisée pour la résolution des noms.
 */

import { SourceLocation } from '../lexer/positions';
import { ASTNode, Identifier } from '../ast/nodes';

/**
 * Type de symbole
 */
export enum SymbolKind {
  // Déclarations
  Variable = 'Variable',
  Constant = 'Constant',
  Parameter = 'Parameter',
  Function = 'Function',
  Class = 'Class',
  Interface = 'Interface',
  Enum = 'Enum',
  EnumMember = 'EnumMember',
  Type = 'Type',
  TypeParameter = 'TypeParameter',
  
  // Modules
  Import = 'Import',
  Export = 'Export',
  Namespace = 'Namespace',
  
  // Autres
  Label = 'Label',
  This = 'This',
  Super = 'Super',
  
  // Spéciaux
  Builtin = 'Builtin',
  Library = 'Library',
}

/**
 * Visibilité d'un symbole
 */
export enum SymbolVisibility {
  Public = 'Public',
  Private = 'Private',
  Protected = 'Protected',
  Internal = 'Internal',
}

/**
 * Symbole
 */
export class Symbol {
  name: string;
  kind: SymbolKind;
  scope: Scope;
  location: SourceLocation;
  declaration?: ASTNode;
  
  // Métadonnées
  exported: boolean = false;
  exportedName?: string;
  importedName?: string;
  source?: string;
  visibility: SymbolVisibility = SymbolVisibility.Public;
  static: boolean = false;
  async: boolean = false;
  generator: boolean = false;
  abstract: boolean = false;
  
  // Pour les fonctions
  parameters?: Symbol[];
  returnType?: Symbol;
  
  // Pour les classes
  superClass?: Symbol;
  implements?: Symbol[];
  members?: Map<string, Symbol>;
  
  // Pour les interfaces
  extends?: Symbol[];
  
  // Pour les types
  typeParameters?: Symbol[];
  typeAnnotation?: Symbol;
  
  // Références
  references: Identifier[] = [];
  
  constructor(
    name: string,
    kind: SymbolKind,
    scope: Scope,
    location: SourceLocation
  ) {
    this.name = name;
    this.kind = kind;
    this.scope = scope;
    this.location = location;
  }

  /**
   * Ajouter une référence
   */
  public addReference(identifier: Identifier): void {
    this.references.push(identifier);
  }

  /**
   * Obtenir le nombre de références
   */
  public getReferenceCount(): number {
    return this.references.length;
  }

  /**
   * Vérifier si le symbole est utilisé
   */
  public isUsed(): boolean {
    return this.references.length > 0 || this.exported;
  }

  /**
   * Convertir en JSON
   */
  public toJSON(): any {
    return {
      name: this.name,
      kind: this.kind,
      scope: this.scope.name,
      location: this.location.toJSON(),
      exported: this.exported,
      exportedName: this.exportedName,
      source: this.source,
      visibility: this.visibility,
      static: this.static,
      async: this.async,
      generator: this.generator,
      references: this.references.length,
    };
  }

  /**
   * Convertir en chaîne
   */
  public toString(): string {
    let result = `${SymbolKind[this.kind]} '${this.name}'`;
    if (this.exported) {
      result += ' (exported)';
    }
    if (this.source) {
      result += ` from ${this.source}`;
    }
    return result;
  }
}

/**
 * Scope (portée)
 */
export class Scope {
  name: string;
  kind: string;
  parent: Scope | null;
  owner?: Symbol;
  symbols: Map<string, Symbol> = new Map();
  children: Scope[] = [];
  
  constructor(name: string, kind: string, parent: Scope | null = null, owner?: Symbol) {
    this.name = name;
    this.kind = kind;
    this.parent = parent;
    this.owner = owner;
  }

  /**
   * Ajouter un symbole
   */
  public addSymbol(symbol: Symbol): void {
    this.symbols.set(symbol.name, symbol);
  }

  /**
   * Obtenir un symbole par nom
   */
  public getSymbol(name: string): Symbol | undefined {
    return this.symbols.get(name);
  }

  /**
   * Vérifier si un symbole existe
   */
  public hasSymbol(name: string): boolean {
    return this.symbols.has(name);
  }

  /**
   * Supprimer un symbole
   */
  public removeSymbol(name: string): boolean {
    return this.symbols.delete(name);
  }

  /**
   * Obtenir tous les symboles
   */
  public getAllSymbols(): Symbol[] {
    return Array.from(this.symbols.values());
  }

  /**
   * Obtenir les symboles exportés
   */
  public getExportedSymbols(): Symbol[] {
    return Array.from(this.symbols.values()).filter(s => s.exported);
  }

  /**
   * Créer un scope enfant
   */
  public createChild(kind: string, owner?: Symbol): Scope {
    const child = new Scope(`${this.name}.${kind}`, kind, this, owner);
    this.children.push(child);
    return child;
  }

  /**
   * Obtenir le scope global
   */
  public getGlobalScope(): Scope {
    let scope: Scope = this;
    while (scope.parent) {
      scope = scope.parent;
    }
    return scope;
  }

  /**
   * Vérifier si on est dans le scope global
   */
  public isGlobal(): boolean {
    return this.parent === null;
  }

  /**
   * Convertir en JSON
   */
  public toJSON(): any {
    return {
      name: this.name,
      kind: this.kind,
      parent: this.parent?.name || null,
      symbols: Array.from(this.symbols.keys()),
      children: this.children.map(c => c.name),
    };
  }

  /**
   * Convertir en chaîne
   */
  public toString(): string {
    return `${this.kind} scope '${this.name}'`;
  }
}

/**
 * Table des symboles
 */
export class SymbolTable {
  globalScope: Scope;
  files: Map<string, Scope> = new Map();
  currentFile: string = '<unknown>';
  
  constructor() {
    this.globalScope = new Scope('global', 'global');
    this.files.set('<unknown>', this.globalScope);
  }

  /**
   * Définir le fichier courant
   */
  public setCurrentFile(file: string): void {
    this.currentFile = file;
    if (!this.files.has(file)) {
      this.files.set(file, this.globalScope);
    }
  }

  /**
   * Obtenir le scope global
   */
  public getGlobalScope(): Scope {
    return this.globalScope;
  }

  /**
   * Obtenir le scope pour un fichier
   */
  public getFileScope(file: string): Scope | undefined {
    return this.files.get(file);
  }

  /**
   * Ajouter un fichier
   */
  public addFile(file: string, scope: Scope = this.globalScope): void {
    this.files.set(file, scope);
  }

  /**
   * Obtenir un symbole par nom
   */
  public getSymbol(name: string, scope?: Scope): Symbol | undefined {
    const searchScope = scope || this.globalScope;
    return this.findSymbol(name, searchScope);
  }

  /**
   * Trouver un symbole dans la hiérarchie des scopes
   */
  private findSymbol(name: string, scope: Scope): Symbol | undefined {
    let current: Scope | null = scope;
    
    while (current) {
      const symbol = current.getSymbol(name);
      if (symbol) {
        return symbol;
      }
      current = current.parent;
    }
    
    return undefined;
  }

  /**
   * Obtenir tous les symboles
   */
  public getAllSymbols(): Symbol[] {
    const symbols: Symbol[] = [];
    this.collectSymbols(this.globalScope, symbols);
    return symbols;
  }

  /**
   * Collecter les symboles récursivement
   */
  private collectSymbols(scope: Scope, symbols: Symbol[]): void {
    for (const symbol of scope.getAllSymbols()) {
      symbols.push(symbol);
    }
    
    for (const child of scope.children) {
      this.collectSymbols(child, symbols);
    }
  }

  /**
   * Obtenir les symboles exportés
   */
  public getExportedSymbols(file?: string): Symbol[] {
    const scope = file ? this.files.get(file) : this.globalScope;
    if (!scope) return [];
    
    const symbols: Symbol[] = [];
    this.collectExportedSymbols(scope, symbols);
    return symbols;
  }

  /**
   * Collecter les symboles exportés récursivement
   */
  private collectExportedSymbols(scope: Scope, symbols: Symbol[]): void {
    for (const symbol of scope.getExportedSymbols()) {
      symbols.push(symbol);
    }
    
    for (const child of scope.children) {
      this.collectExportedSymbols(child, symbols);
    }
  }

  /**
   * Obtenir les symboles non utilisés
   */
  public getUnusedSymbols(): Symbol[] {
    return this.getAllSymbols().filter(s => !s.isUsed());
  }

  /**
   * Vérifier si un symbole existe
   */
  public hasSymbol(name: string, scope?: Scope): boolean {
    return this.getSymbol(name, scope) !== undefined;
  }

  /**
   * Ajouter un symbole
   */
  public addSymbol(symbol: Symbol, scope?: Scope): void {
    const targetScope = scope || this.globalScope;
    targetScope.addSymbol(symbol);
  }

  /**
   * Supprimer un symbole
   */
  public removeSymbol(name: string, scope?: Scope): boolean {
    const targetScope = scope || this.globalScope;
    return targetScope.removeSymbol(name);
  }

  /**
   * Convertir en JSON
   */
  public toJSON(): any {
    return {
      globalScope: this.globalScope.toJSON(),
      files: Array.from(this.files.keys()),
      currentFile: this.currentFile,
    };
  }

  /**
   * Convertir en chaîne
   */
  public toString(): string {
    return `SymbolTable with ${this.getAllSymbols().length} symbols`;
  }

  /**
   * Réinitialiser la table des symboles
   */
  public reset(): void {
    this.globalScope = new Scope('global', 'global');
    this.files.clear();
    this.files.set('<unknown>', this.globalScope);
    this.currentFile = '<unknown>';
  }
}

/**
 * Symbole pour les types
 */
export class TypeSymbol extends Symbol {
  typeKind: 'primitive' | 'composite' | 'generic' | 'union' | 'intersection' | 'tuple' | 'array' | 'function' | 'object' | 'class' | 'interface' | 'enum' | 'type' = 'primitive';
  baseType?: TypeSymbol;
  typeParameters?: TypeSymbol[];
  members?: Map<string, TypeSymbol>;
  
  constructor(
    name: string,
    scope: Scope,
    location: SourceLocation,
    typeKind: 'primitive' | 'composite' | 'generic' | 'union' | 'intersection' | 'tuple' | 'array' | 'function' | 'object' | 'class' | 'interface' | 'enum' | 'type' = 'primitive'
  ) {
    super(name, SymbolKind.Type, scope, location);
    this.typeKind = typeKind;
  }
}

/**
 * Symbole pour les valeurs
 */
export class ValueSymbol extends Symbol {
  valueType?: TypeSymbol;
  constantValue?: any;
  
  constructor(
    name: string,
    kind: SymbolKind,
    scope: Scope,
    location: SourceLocation
  ) {
    super(name, kind, scope, location);
  }
}

/**
 * Créer une table des symboles
 */
export function createSymbolTable(): SymbolTable {
  return new SymbolTable();
}

/**
 * Créer un scope
 */
export function createScope(name: string, kind: string, parent?: Scope, owner?: Symbol): Scope {
  return new Scope(name, kind, parent, owner);
}

/**
 * Créer un symbole
 */
export function createSymbol(
  name: string,
  kind: SymbolKind,
  scope: Scope,
  location: SourceLocation
): Symbol {
  return new Symbol(name, kind, scope, location);
}
