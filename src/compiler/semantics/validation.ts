/**
 * Validation - Validation sémantique pour Zinga
 * 
 * Ce module effectue des validations sémantiques sur l'AST,
 * comme la vérification des références, des boucles, etc.
 */

import { ASTNode, Program, Statement, Expression, Identifier, FunctionDeclaration, ClassDeclaration, InterfaceDeclaration, VariableDeclaration, VariableDeclarator, ReturnStatement, BreakStatement, ContinueStatement, ThrowStatement, TryStatement, ImportDeclaration, ExportDeclaration } from '../ast/nodes';
import { Config } from '../config';
import { DiagnosticCollector, ErrorCode } from '../diagnostics/errors';
import { SymbolTable, Symbol, SymbolKind } from './symbols';
import { TypeSystem, Type } from '../types/type-system';
import { ASTVisitor, traverse, collect, findAll, findFirst } from '../ast/visitor';

export interface ValidationOptions {
  config?: Config;
  diagnostics?: DiagnosticCollector;
  symbolTable?: SymbolTable;
  typeSystem?: TypeSystem;
  strict?: boolean;
}

export class SemanticValidator {
  private config: Config;
  private diagnostics: DiagnosticCollector;
  private symbolTable: SymbolTable;
  private typeSystem: TypeSystem;
  private strict: boolean;
  
  // Contexte de validation
  private currentFile: string = '<unknown>';
  private currentFunction: FunctionDeclaration | null = null;
  private currentClass: ClassDeclaration | null = null;
  private currentInterface: InterfaceDeclaration | null = null;
  private inLoop: boolean = false;
  private inSwitch: boolean = false;
  private inTry: boolean = false;
  private inCatch: boolean = false;
  private inFinally: boolean = false;
  
  // Pile des labels
  private labelStack: string[] = [];
  
  constructor(options: ValidationOptions = {}) {
    this.config = options.config || new Config();
    this.diagnostics = options.diagnostics || new DiagnosticCollector();
    this.symbolTable = options.symbolTable || new SymbolTable();
    this.typeSystem = options.typeSystem || new TypeSystem();
    this.strict = options.strict ?? true;
  }

  /**
   * Valider un programme
   */
  public validate(program: Program, filename?: string): boolean {
    this.currentFile = filename || '<unknown>';
    
    // Valider le programme
    this.visit(program);
    
    // Vérifier les variables non utilisées
    if (this.config.getValue('debug')?.dumpUnusedVariables) {
      this.checkUnusedVariables();
    }
    
    // Vérifier les imports non utilisés
    if (this.config.getValue('debug')?.dumpUnusedImports) {
      this.checkUnusedImports();
    }
    
    return !this.diagnostics.hasErrors();
  }

  /**
   * Visiter un nœud AST
   */
  private visit(node: ASTNode): void {
    const type = node.type as string;
    
    switch (type) {
      case 'Program':
        this.visitProgram(node as Program);
        break;
      case 'FunctionDeclaration':
        this.visitFunctionDeclaration(node as FunctionDeclaration);
        break;
      case 'ClassDeclaration':
        this.visitClassDeclaration(node as ClassDeclaration);
        break;
      case 'InterfaceDeclaration':
        this.visitInterfaceDeclaration(node as InterfaceDeclaration);
        break;
      case 'VariableDeclaration':
        this.visitVariableDeclaration(node as VariableDeclaration);
        break;
      case 'ReturnStatement':
        this.visitReturnStatement(node as ReturnStatement);
        break;
      case 'BreakStatement':
        this.visitBreakStatement(node as BreakStatement);
        break;
      case 'ContinueStatement':
        this.visitContinueStatement(node as ContinueStatement);
        break;
      case 'ThrowStatement':
        this.visitThrowStatement(node as ThrowStatement);
        break;
      case 'TryStatement':
        this.visitTryStatement(node as TryStatement);
        break;
      case 'Identifier':
        this.visitIdentifier(node as Identifier);
        break;
      case 'ImportDeclaration':
        this.visitImportDeclaration(node as ImportDeclaration);
        break;
      case 'ExportDeclaration':
        this.visitExportDeclaration(node as ExportDeclaration);
        break;
      default:
        this.visitChildren(node);
    }
  }

  /**
   * Visiter un programme
   */
  private visitProgram(program: Program): void {
    for (const statement of program.body) {
      this.visit(statement);
    }
  }

  /**
   * Visiter une déclaration de fonction
   */
  private visitFunctionDeclaration(node: FunctionDeclaration): void {
    const prevFunction = this.currentFunction;
    this.currentFunction = node;
    
    // Vérifier les paramètres en double
    this.checkDuplicateParameters(node.params);
    
    // Visiter le corps
    this.visit(node.body);
    
    this.currentFunction = prevFunction;
  }

  /**
   * Visiter une déclaration de classe
   */
  private visitClassDeclaration(node: ClassDeclaration): void {
    const prevClass = this.currentClass;
    this.currentClass = node;
    
    // Vérifier l'héritage
    if (node.superClass) {
      this.visit(node.superClass);
    }
    
    // Visiter le corps
    this.visit(node.body);
    
    this.currentClass = prevClass;
  }

  /**
   * Visiter une déclaration d'interface
   */
  private visitInterfaceDeclaration(node: InterfaceDeclaration): void {
    const prevInterface = this.currentInterface;
    this.currentInterface = node;
    
    // Vérifier l'héritage
    for (const base of node.extends) {
      this.visit(base);
    }
    
    // Visiter le corps
    this.visit(node.body);
    
    this.currentInterface = prevInterface;
  }

  /**
   * Visiter une déclaration de variable
   */
  private visitVariableDeclaration(node: VariableDeclaration): void {
    // Vérifier les déclarations en double
    const names = node.declarations.map(d => d.id.name);
    const uniqueNames = new Set(names);
    
    if (names.length !== uniqueNames.size) {
      this.diagnostics.addError(
        ErrorCode.DUPLICATE_DECLARATION,
        `Duplicate variable declarations in the same statement`,
        node.location
      );
    }
    
    // Visiter les déclarateurs
    for (const declarator of node.declarations) {
      this.visit(declarator);
    }
  }

  /**
   * Visiter un déclarateur de variable
   */
  private visitVariableDeclarator(declarator: VariableDeclarator): void {
    // Vérifier si la variable est déjà déclarée dans le scope courant
    const symbol = this.symbolTable.getSymbol(declarator.id.name);
    if (symbol && symbol.scope === this.symbolTable.getGlobalScope()) {
      // Déjà déclarée dans le scope global
      this.diagnostics.addError(
        ErrorCode.DUPLICATE_DECLARATION,
        `Identifier '${declarator.id.name}' has already been declared`,
        declarator.id.location
      );
    }
    
    // Visiter l'initialisation
    if (declarator.init) {
      this.visit(declarator.init);
    }
  }

  /**
   * Visiter un statement return
   */
  private visitReturnStatement(node: ReturnStatement): void {
    // Vérifier si on est dans une fonction
    if (!this.currentFunction) {
      this.diagnostics.addError(
        ErrorCode.SEMANTIC_ERROR,
        `'return' can only be used inside a function`,
        node.location
      );
      return;
    }
    
    // Visiter l'argument
    if (node.argument) {
      this.visit(node.argument);
    }
  }

  /**
   * Visiter un statement break
   */
  private visitBreakStatement(node: BreakStatement): void {
    // Vérifier si on est dans une boucle ou un switch
    if (!this.inLoop && !this.inSwitch) {
      this.diagnostics.addError(
        ErrorCode.SEMANTIC_ERROR,
        `'break' can only be used inside a loop or switch`,
        node.location
      );
    }
    
    // Vérifier l'étiquette
    if (node.label) {
      const labelName = (node.label as any).name;
      if (!this.labelStack.includes(labelName)) {
        this.diagnostics.addError(
          ErrorCode.SEMANTIC_ERROR,
          `Label '${labelName}' not found`,
          node.location
        );
      }
    }
  }

  /**
   * Visiter un statement continue
   */
  private visitContinueStatement(node: ContinueStatement): void {
    // Vérifier si on est dans une boucle
    if (!this.inLoop) {
      this.diagnostics.addError(
        ErrorCode.SEMANTIC_ERROR,
        `'continue' can only be used inside a loop`,
        node.location
      );
    }
    
    // Vérifier l'étiquette
    if (node.label) {
      const labelName = (node.label as any).name;
      if (!this.labelStack.includes(labelName)) {
        this.diagnostics.addError(
          ErrorCode.SEMANTIC_ERROR,
          `Label '${labelName}' not found`,
          node.location
        );
      }
    }
  }

  /**
   * Visiter un statement throw
   */
  private visitThrowStatement(node: ThrowStatement): void {
    // Visiter l'argument
    this.visit(node.argument);
  }

  /**
   * Visiter un statement try
   */
  private visitTryStatement(node: TryStatement): void {
    const prevInTry = this.inTry;
    this.inTry = true;
    
    // Visiter le bloc try
    this.visit(node.block);
    
    // Visiter le handler
    if (node.handler) {
      const prevInCatch = this.inCatch;
      this.inCatch = true;
      
      this.visit(node.handler);
      
      this.inCatch = prevInCatch;
    }
    
    // Visiter le finalizer
    if (node.finalizer) {
      const prevInFinally = this.inFinally;
      this.inFinally = true;
      
      this.visit(node.finalizer);
      
      this.inFinally = prevInFinally;
    }
    
    this.inTry = prevInTry;
  }

  /**
   * Visiter un identifiant
   */
  private visitIdentifier(node: Identifier): void {
    // Vérifier si l'identifiant est déclaré
    const symbol = this.symbolTable.getSymbol(node.name);
    
    if (!symbol) {
      this.diagnostics.addError(
        ErrorCode.UNDECLARED_IDENTIFIER,
        `Identifier '${node.name}' has not been declared`,
        node.location
      );
      return;
    }
    
    // Vérifier l'accès aux membres privés/protegés
    if (this.currentClass && this.isPrivateOrProtected(symbol)) {
      this.diagnostics.addError(
        ErrorCode.SEMANTIC_ERROR,
        `Cannot access ${symbol.visibility.toLowerCase()} member '${symbol.name}' here`,
        node.location
      );
    }
    
    // Marquer le symbole comme utilisé
    symbol.addReference(node);
  }

  /**
   * Vérifier si un symbole est privé ou protégé
   */
  private isPrivateOrProtected(symbol: Symbol): boolean {
    return symbol.visibility === 'Private' || symbol.visibility === 'Protected';
  }

  /**
   * Visiter une déclaration d'import
   */
  private visitImportDeclaration(node: ImportDeclaration): void {
    // Vérifier les imports en double
    for (const specifier of node.specifiers) {
      const localName = specifier.local?.name || (specifier.imported as any).name;
      const existing = this.symbolTable.getSymbol(localName);
      
      if (existing) {
        this.diagnostics.addError(
          ErrorCode.DUPLICATE_DECLARATION,
          `Import '${localName}' has already been declared`,
          specifier.location
        );
      }
    }
  }

  /**
   * Visiter une déclaration d'export
   */
  private visitExportDeclaration(node: ExportDeclaration): void {
    // Vérifier les exports de symboles non déclarés
    if (node.declaration) {
      this.visit(node.declaration);
    } else if (node.specifiers.length > 0) {
      for (const specifier of node.specifiers) {
        const localName = specifier.local?.name || (specifier.exported as any).name;
        const symbol = this.symbolTable.getSymbol(localName);
        
        if (!symbol) {
          this.diagnostics.addError(
            ErrorCode.UNDECLARED_IDENTIFIER,
            `Cannot export '${localName}' as it has not been declared`,
            specifier.location
          );
        }
      }
    }
  }

  /**
   * Visiter les enfants d'un nœud
   */
  private visitChildren(node: ASTNode): void {
    for (const key in node) {
      if (key === 'type' || key === 'location' || key === 'toString' || key === 'toJSON') {
        continue;
      }
      
      const value = (node as any)[key];
      if (value === null || value === undefined) {
        continue;
      }
      
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object' && 'type' in item) {
            this.visit(item);
          }
        }
      } else if (typeof value === 'object' && 'type' in value) {
        this.visit(value);
      }
    }
  }

  /**
   * Vérifier les paramètres en double
   */
  private checkDuplicateParameters(params: any[]): void {
    const names = params.map(p => p.name);
    const uniqueNames = new Set(names);
    
    if (names.length !== uniqueNames.size) {
      this.diagnostics.addError(
        ErrorCode.DUPLICATE_DECLARATION,
        `Duplicate parameter names`,
        params[0].location
      );
    }
  }

  /**
   * Vérifier les variables non utilisées
   */
  private checkUnusedVariables(): void {
    const unusedVariables = this.symbolTable.getAllSymbols().filter(s => 
      !s.isUsed() && 
      (s.kind === SymbolKind.Variable || 
       s.kind === SymbolKind.Constant || 
       s.kind === SymbolKind.Parameter)
    );
    
    for (const symbol of unusedVariables) {
      this.diagnostics.addWarning(
        ErrorCode.UNUSED_VARIABLE,
        `Variable '${symbol.name}' is declared but never used`,
        symbol.location
      );
    }
  }

  /**
   * Vérifier les imports non utilisés
   */
  private checkUnusedImports(): void {
    const unusedImports = this.symbolTable.getAllSymbols().filter(s => 
      !s.isUsed() && 
      s.kind === SymbolKind.Import
    );
    
    for (const symbol of unusedImports) {
      this.diagnostics.addWarning(
        ErrorCode.UNUSED_VARIABLE,
        `Import '${symbol.name}' is declared but never used`,
        symbol.location
      );
    }
  }

  /**
   * Vérifier les fonctions sans retour
   */
  public checkMissingReturns(): void {
    const functions = findAll(this.symbolTable.getAllSymbols().filter(s => 
      s.kind === SymbolKind.Function
    ).map(s => s.declaration) as ASTNode[], 'FunctionDeclaration') as FunctionDeclaration[];
    
    for (const func of functions) {
      if (!this.hasReturnStatement(func)) {
        this.diagnostics.addWarning(
          ErrorCode.MISSING_RETURN,
          `Function '${func.id?.name || '<anonymous>'}' should return a value`,
          func.location
        );
      }
    }
  }

  /**
   * Vérifier si une fonction a un statement return
   */
  private hasReturnStatement(func: FunctionDeclaration): boolean {
    const returns = findAll(func.body as ASTNode, 'ReturnStatement') as ReturnStatement[];
    return returns.length > 0;
  }

  /**
   * Vérifier les variables non initialisées
   */
  public checkUninitializedVariables(): void {
    const declarations = findAll(this.symbolTable.getAllSymbols().filter(s => 
      s.kind === SymbolKind.Variable
    ).map(s => s.declaration) as ASTNode[], 'VariableDeclaration') as VariableDeclaration[];
    
    for (const decl of declarations) {
      for (const declarator of decl.declarations) {
        if (!declarator.init && decl.kind !== 'let' && decl.kind !== 'var') {
          this.diagnostics.addWarning(
            ErrorCode.TYPE_ERROR,
            `Variable '${declarator.id.name}' is declared but not initialized`,
            declarator.id.location
          );
        }
      }
    }
  }

  /**
   * Vérifier les références circulaires
   */
  public checkCircularReferences(): void {
    // À implémenter
  }

  /**
   * Obtenir le type système
   */
  public getTypeSystem(): TypeSystem {
    return this.typeSystem;
  }

  /**
   * Configurer le validateur
   */
  public configure(options: ValidationOptions): void {
    this.config = options.config || this.config;
    this.diagnostics = options.diagnostics || this.diagnostics;
    this.symbolTable = options.symbolTable || this.symbolTable;
    this.typeSystem = options.typeSystem || this.typeSystem;
    this.strict = options.strict ?? this.strict;
  }

  /**
   * Réinitialiser le validateur
   */
  public reset(): void {
    this.currentFile = '<unknown>';
    this.currentFunction = null;
    this.currentClass = null;
    this.currentInterface = null;
    this.inLoop = false;
    this.inSwitch = false;
    this.inTry = false;
    this.inCatch = false;
    this.inFinally = false;
    this.labelStack = [];
  }
}

/**
 * Créer un validateur sémantique
 */
export function createSemanticValidator(options?: ValidationOptions): SemanticValidator {
  return new SemanticValidator(options);
}

/**
 * Valider un programme
 */
export function validateSemantics(
  program: Program,
  symbolTable: SymbolTable,
  filename?: string,
  options?: ValidationOptions
): boolean {
  const validator = new SemanticValidator({ ...options, symbolTable });
  return validator.validate(program, filename);
}
