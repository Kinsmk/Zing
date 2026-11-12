/**
 * Resolver - Résolution des noms pour Zinga
 * 
 * Ce module est responsable de la résolution des identifiants dans l'AST.
 * Il construit une table des symboles et résout les références.
 */

import { ASTNode, Program, Statement, Expression, Identifier, FunctionDeclaration, ClassDeclaration, InterfaceDeclaration, VariableDeclaration, ImportDeclaration, ExportDeclaration } from '../ast/nodes';
import { Config } from '../config';
import { DiagnosticCollector, ErrorCode } from '../diagnostics/errors';
import { Scope, Symbol, SymbolKind, SymbolTable } from './symbols';
import { ASTVisitor, traverse } from '../ast/visitor';

export interface ResolverOptions {
  config?: Config;
  diagnostics?: DiagnosticCollector;
}

export class Resolver {
  private config: Config;
  private diagnostics: DiagnosticCollector;
  private symbolTable: SymbolTable;
  private currentScope: Scope;
  private currentFile: string = '<unknown>';
  private inFunction: boolean = false;
  private inClass: boolean = false;
  private inInterface: boolean = false;
  private inLoop: boolean = false;
  private inSwitch: boolean = false;

  constructor(options: ResolverOptions = {}) {
    this.config = options.config || new Config();
    this.diagnostics = options.diagnostics || new DiagnosticCollector();
    this.symbolTable = new SymbolTable();
    this.currentScope = this.symbolTable.globalScope;
  }

  /**
   * Résoudre les noms dans un programme
   */
  public resolve(program: Program, filename?: string): SymbolTable {
    this.currentFile = filename || '<unknown>';
    this.symbolTable.setCurrentFile(this.currentFile);
    
    // Créer le scope global
    this.currentScope = this.symbolTable.globalScope;
    
    // Résoudre le programme
    this.visit(program);
    
    return this.symbolTable;
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
      case 'BlockStatement':
        this.visitBlockStatement(node as any);
        break;
      case 'VariableDeclaration':
        this.visitVariableDeclaration(node as VariableDeclaration);
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
      case 'ImportDeclaration':
        this.visitImportDeclaration(node as ImportDeclaration);
        break;
      case 'ExportDeclaration':
        this.visitExportDeclaration(node as ExportDeclaration);
        break;
      case 'Identifier':
        this.visitIdentifier(node as Identifier);
        break;
      case 'IfStatement':
        this.visitIfStatement(node as any);
        break;
      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'ForStatement':
      case 'ForOfStatement':
      case 'ForInStatement':
        this.visitLoop(node as any);
        break;
      case 'SwitchStatement':
        this.visitSwitchStatement(node as any);
        break;
      case 'BreakStatement':
        this.visitBreakStatement(node as any);
        break;
      case 'ContinueStatement':
        this.visitContinueStatement(node as any);
        break;
      case 'ReturnStatement':
        this.visitReturnStatement(node as any);
        break;
      case 'WithStatement':
        this.visitWithStatement(node as any);
        break;
      case 'LabeledStatement':
        this.visitLabeledStatement(node as any);
        break;
      case 'TryStatement':
        this.visitTryStatement(node as any);
        break;
      case 'ThrowStatement':
        this.visitThrowStatement(node as any);
        break;
      default:
        // Visiter les enfants
        this.visitChildren(node);
    }
  }

  /**
   * Visiter un programme
   */
  private visitProgram(program: Program): void {
    this.enterScope('program');
    
    for (const statement of program.body) {
      this.visit(statement);
    }
    
    this.exitScope();
  }

  /**
   * Visiter un bloc de statements
   */
  private visitBlockStatement(node: any): void {
    this.enterScope('block');
    
    for (const statement of node.body) {
      this.visit(statement);
    }
    
    this.exitScope();
  }

  /**
   * Visiter une déclaration de variable
   */
  private visitVariableDeclaration(node: VariableDeclaration): void {
    const kind = node.kind;
    
    for (const declarator of node.declarations) {
      this.visitVariableDeclarator(declarator, kind);
    }
  }

  /**
   * Visiter un déclarateur de variable
   */
  private visitVariableDeclarator(declarator: any, kind: string): void {
    const id = declarator.id as Identifier;
    const init = declarator.init;
    
    // Déclarer le symbole
    const symbol = new Symbol(
      id.name,
      SymbolKind.Variable,
      this.currentScope,
      id.location
    );
    symbol.kind = kind;
    symbol.declaration = declarator;
    
    // Vérifier si le symbole existe déjà dans le scope courant
    const existing = this.currentScope.getSymbol(id.name);
    if (existing) {
      this.diagnostics.addError(
        ErrorCode.DUPLICATE_DECLARATION,
        `Identifier '${id.name}' has already been declared`,
        id.location,
        undefined,
        undefined,
        `Rename or remove the duplicate declaration`
      );
    } else {
      this.currentScope.addSymbol(symbol);
    }
    
    // Résoudre l'initialisation
    if (init) {
      this.visit(init);
    }
    
    // Lier l'identifiant au symbole
    this.bindIdentifier(id, symbol);
  }

  /**
   * Visiter une déclaration de fonction
   */
  private visitFunctionDeclaration(node: FunctionDeclaration): void {
    const name = node.id?.name || '<anonymous>';
    
    // Créer le symbole de la fonction
    const symbol = new Symbol(
      name,
      SymbolKind.Function,
      this.currentScope,
      node.location
    );
    symbol.declaration = node;
    symbol.async = node.async || false;
    symbol.generator = node.generator || false;
    
    // Vérifier si le symbole existe déjà
    const existing = this.currentScope.getSymbol(name);
    if (existing && existing.kind === SymbolKind.Function) {
      this.diagnostics.addError(
        ErrorCode.DUPLICATE_DECLARATION,
        `Function '${name}' has already been declared`,
        node.location,
        undefined,
        undefined,
        `Rename or remove the duplicate function`
      );
    } else {
      this.currentScope.addSymbol(symbol);
    }
    
    // Lier l'identifiant au symbole
    if (node.id) {
      this.bindIdentifier(node.id, symbol);
    }
    
    // Entrer dans le scope de la fonction
    this.enterScope('function', symbol);
    this.inFunction = true;
    
    // Ajouter les paramètres au scope
    for (const param of node.params) {
      const paramSymbol = new Symbol(
        param.name,
        SymbolKind.Parameter,
        this.currentScope,
        param.location
      );
      this.currentScope.addSymbol(paramSymbol);
      this.bindIdentifier(param, paramSymbol);
    }
    
    // Visiter le corps
    this.visit(node.body);
    
    // Sortir du scope de la fonction
    this.exitScope();
    this.inFunction = false;
  }

  /**
   * Visiter une déclaration de classe
   */
  private visitClassDeclaration(node: ClassDeclaration): void {
    const name = node.id.name;
    
    // Créer le symbole de la classe
    const symbol = new Symbol(
      name,
      SymbolKind.Class,
      this.currentScope,
      node.location
    );
    symbol.declaration = node;
    
    // Vérifier si le symbole existe déjà
    const existing = this.currentScope.getSymbol(name);
    if (existing) {
      this.diagnostics.addError(
        ErrorCode.DUPLICATE_DECLARATION,
        `Class '${name}' has already been declared`,
        node.location,
        undefined,
        undefined,
        `Rename or remove the duplicate class`
      );
    } else {
      this.currentScope.addSymbol(symbol);
    }
    
    // Lier l'identifiant au symbole
    this.bindIdentifier(node.id, symbol);
    
    // Entrer dans le scope de la classe
    this.enterScope('class', symbol);
    this.inClass = true;
    
    // Ajouter le super au scope
    if (node.superClass) {
      this.visit(node.superClass);
    }
    
    // Visiter le corps de la classe
    this.visit(node.body);
    
    // Sortir du scope de la classe
    this.exitScope();
    this.inClass = false;
  }

  /**
   * Visiter une déclaration d'interface
   */
  private visitInterfaceDeclaration(node: InterfaceDeclaration): void {
    const name = node.id.name;
    
    // Créer le symbole de l'interface
    const symbol = new Symbol(
      name,
      SymbolKind.Interface,
      this.currentScope,
      node.location
    );
    symbol.declaration = node;
    
    // Vérifier si le symbole existe déjà
    const existing = this.currentScope.getSymbol(name);
    if (existing) {
      this.diagnostics.addError(
        ErrorCode.DUPLICATE_DECLARATION,
        `Interface '${name}' has already been declared`,
        node.location,
        undefined,
        undefined,
        `Rename or remove the duplicate interface`
      );
    } else {
      this.currentScope.addSymbol(symbol);
    }
    
    // Lier l'identifiant au symbole
    this.bindIdentifier(node.id, symbol);
    
    // Entrer dans le scope de l'interface
    this.enterScope('interface', symbol);
    this.inInterface = true;
    
    // Visiter le corps de l'interface
    this.visit(node.body);
    
    // Sortir du scope de l'interface
    this.exitScope();
    this.inInterface = false;
  }

  /**
   * Visiter une déclaration d'import
   */
  private visitImportDeclaration(node: ImportDeclaration): void {
    const source = node.source.value as string || '';
    
    for (const specifier of node.specifiers) {
      if (specifier.type === 'ImportDefaultSpecifier') {
        const name = specifier.local?.name || (specifier.imported as any).name;
        const symbol = new Symbol(
          name,
          SymbolKind.Import,
          this.currentScope,
          specifier.location
        );
        symbol.source = source;
        symbol.importedName = (specifier.imported as any).name;
        symbol.declaration = specifier;
        
        this.currentScope.addSymbol(symbol);
        if (specifier.local) {
          this.bindIdentifier(specifier.local as Identifier, symbol);
        }
      } else if (specifier.type === 'ImportSpecifier') {
        const name = specifier.local?.name || (specifier.imported as any).name;
        const symbol = new Symbol(
          name,
          SymbolKind.Import,
          this.currentScope,
          specifier.location
        );
        symbol.source = source;
        symbol.importedName = (specifier.imported as any).name;
        symbol.declaration = specifier;
        
        this.currentScope.addSymbol(symbol);
        if (specifier.local) {
          this.bindIdentifier(specifier.local as Identifier, symbol);
        }
      } else if (specifier.type === 'ImportNamespaceSpecifier') {
        const name = specifier.local?.name || (specifier.imported as any).name;
        const symbol = new Symbol(
          name,
          SymbolKind.Namespace,
          this.currentScope,
          specifier.location
        );
        symbol.source = source;
        symbol.declaration = specifier;
        
        this.currentScope.addSymbol(symbol);
        if (specifier.local) {
          this.bindIdentifier(specifier.local as Identifier, symbol);
        }
      }
    }
  }

  /**
   * Visiter une déclaration d'export
   */
  private visitExportDeclaration(node: ExportDeclaration): void {
    if (node.declaration) {
      // Export d'une déclaration
      this.visit(node.declaration);
      
      // Marquer le symbole comme exporté
      const declaration = node.declaration as any;
      if (declaration.id) {
        const symbol = this.currentScope.getSymbol(declaration.id.name);
        if (symbol) {
          symbol.exported = true;
        }
      }
    } else if (node.specifiers.length > 0) {
      // Export de spécificateurs
      for (const specifier of node.specifiers) {
        if (specifier.type === 'ExportSpecifier') {
          const localName = specifier.local?.name || (specifier.exported as any).name;
          const symbol = this.currentScope.getSymbol(localName);
          if (symbol) {
            symbol.exported = true;
            symbol.exportedName = (specifier.exported as any).name;
          }
        }
      }
    }
  }

  /**
   * Visiter un identifiant
   */
  private visitIdentifier(node: Identifier): void {
    // Ne pas résoudre les identifiants dans les déclarations
    if (this.isDeclaration(node)) {
      return;
    }
    
    // Résoudre l'identifiant
    const symbol = this.resolveIdentifier(node);
    
    if (!symbol) {
      // Identifiant non résolu
      this.diagnostics.addError(
        ErrorCode.UNDECLARED_IDENTIFIER,
        `Identifier '${node.name}' has not been declared`,
        node.location,
        undefined,
        undefined,
        `Declare the identifier before using it`
      );
    } else {
      // Lier l'identifiant au symbole
      this.bindIdentifier(node, symbol);
    }
  }

  /**
   * Vérifier si un nœud est une déclaration
   */
  private isDeclaration(node: Identifier): boolean {
    // Vérifier si le parent est une déclaration
    // (simplifié - une implémentation complète nécessiterait de connaître le parent)
    return false;
  }

  /**
   * Résoudre un identifiant
   */
  private resolveIdentifier(node: Identifier): Symbol | null {
    let scope: Scope | null = this.currentScope;
    
    while (scope) {
      const symbol = scope.getSymbol(node.name);
      if (symbol) {
        return symbol;
      }
      scope = scope.parent;
    }
    
    return null;
  }

  /**
   * Lier un identifiant à un symbole
   */
  private bindIdentifier(node: Identifier, symbol: Symbol): void {
    // Stocker le symbole dans le nœud
    (node as any).symbol = symbol;
  }

  /**
   * Visiter un statement if
   */
  private visitIfStatement(node: any): void {
    // Visiter la condition
    this.visit(node.test);
    
    // Visiter le conséquent
    this.visit(node.consequent);
    
    // Visiter l'alternatif
    if (node.alternate) {
      this.visit(node.alternate);
    }
  }

  /**
   * Visiter une boucle
   */
  private visitLoop(node: any): void {
    const prevInLoop = this.inLoop;
    this.inLoop = true;
    
    // Visiter les différentes parties selon le type de boucle
    if (node.type === 'ForStatement') {
      if (node.init) {
        this.visit(node.init);
      }
      if (node.test) {
        this.visit(node.test);
      }
      if (node.update) {
        this.visit(node.update);
      }
    } else if (node.type === 'WhileStatement' || node.type === 'DoWhileStatement') {
      if (node.test) {
        this.visit(node.test);
      }
    } else if (node.type === 'ForOfStatement' || node.type === 'ForInStatement') {
      if (node.left) {
        this.visit(node.left);
      }
      if (node.right) {
        this.visit(node.right);
      }
    }
    
    // Visiter le corps
    this.visit(node.body);
    
    this.inLoop = prevInLoop;
  }

  /**
   * Visiter un statement switch
   */
  private visitSwitchStatement(node: any): void {
    const prevInSwitch = this.inSwitch;
    this.inSwitch = true;
    
    // Visiter le discriminant
    this.visit(node.discriminant);
    
    // Visiter les cases
    for (const caseNode of node.cases) {
      if (caseNode.test) {
        this.visit(caseNode.test);
      }
      for (const statement of caseNode.consequent) {
        this.visit(statement);
      }
    }
    
    this.inSwitch = prevInSwitch;
  }

  /**
   * Visiter un statement break
   */
  private visitBreakStatement(node: any): void {
    // Vérifier si on est dans une boucle ou un switch
    if (!this.inLoop && !this.inSwitch) {
      this.diagnostics.addError(
        ErrorCode.SEMANTIC_ERROR,
        `'break' can only be used inside a loop or switch`,
        node.location
      );
    }
    
    // Vérifier s'il y a une étiquette
    if (node.label) {
      this.visit(node.label);
    }
  }

  /**
   * Visiter un statement continue
   */
  private visitContinueStatement(node: any): void {
    // Vérifier si on est dans une boucle
    if (!this.inLoop) {
      this.diagnostics.addError(
        ErrorCode.SEMANTIC_ERROR,
        `'continue' can only be used inside a loop`,
        node.location
      );
    }
    
    // Vérifier s'il y a une étiquette
    if (node.label) {
      this.visit(node.label);
    }
  }

  /**
   * Visiter un statement return
   */
  private visitReturnStatement(node: any): void {
    // Vérifier si on est dans une fonction
    if (!this.inFunction) {
      this.diagnostics.addError(
        ErrorCode.SEMANTIC_ERROR,
        `'return' can only be used inside a function`,
        node.location
      );
    }
    
    // Visiter l'argument
    if (node.argument) {
      this.visit(node.argument);
    }
  }

  /**
   * Visiter un statement with
   */
  private visitWithStatement(node: any): void {
    // Visiter l'objet
    this.visit(node.object);
    
    // Entrer dans le scope du with
    this.enterScope('with');
    
    // Visiter le corps
    this.visit(node.body);
    
    // Sortir du scope du with
    this.exitScope();
  }

  /**
   * Visiter un statement labeled
   */
  private visitLabeledStatement(node: any): void {
    // Ajouter l'étiquette au scope
    const symbol = new Symbol(
      node.label,
      SymbolKind.Label,
      this.currentScope,
      node.location
    );
    this.currentScope.addSymbol(symbol);
    
    // Visiter le corps
    this.visit(node.body);
  }

  /**
   * Visiter un statement try
   */
  private visitTryStatement(node: any): void {
    // Visiter le bloc try
    this.visit(node.block);
    
    // Visiter le handler
    if (node.handler) {
      // Entrer dans le scope du catch
      this.enterScope('catch');
      
      // Ajouter le paramètre du catch
      if (node.handler.param) {
        const paramSymbol = new Symbol(
          (node.handler.param as any).name,
          SymbolKind.Parameter,
          this.currentScope,
          node.handler.param.location
        );
        this.currentScope.addSymbol(paramSymbol);
        this.bindIdentifier(node.handler.param as Identifier, paramSymbol);
      }
      
      // Visiter le corps du catch
      this.visit(node.handler.body);
      
      // Sortir du scope du catch
      this.exitScope();
    }
    
    // Visiter le finalizer
    if (node.finalizer) {
      this.visit(node.finalizer);
    }
  }

  /**
   * Visiter un statement throw
   */
  private visitThrowStatement(node: any): void {
    // Visiter l'argument
    this.visit(node.argument);
  }

  /**
   * Visiter les enfants d'un nœud
   */
  private visitChildren(node: ASTNode): void {
    for (const key in node) {
      if (key === 'type' || key === 'location' || key === 'toString' || key === 'toJSON' || key === 'symbol') {
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
   * Entrer dans un nouveau scope
   */
  private enterScope(kind: string, owner?: Symbol): void {
    this.currentScope = this.currentScope.createChild(kind, owner);
  }

  /**
   * Sortir du scope courant
   */
  private exitScope(): void {
    this.currentScope = this.currentScope.parent!;
  }

  /**
   * Obtenir la table des symboles
   */
  public getSymbolTable(): SymbolTable {
    return this.symbolTable;
  }

  /**
   * Obtenir le scope courant
   */
  public getCurrentScope(): Scope {
    return this.currentScope;
  }

  /**
   * Réinitialiser le resolver
   */
  public reset(): void {
    this.symbolTable = new SymbolTable();
    this.currentScope = this.symbolTable.globalScope;
    this.currentFile = '<unknown>';
    this.inFunction = false;
    this.inClass = false;
    this.inInterface = false;
    this.inLoop = false;
    this.inSwitch = false;
  }

  /**
   * Configurer le resolver
   */
  public configure(options: ResolverOptions): void {
    this.config = options.config || this.config;
    this.diagnostics = options.diagnostics || this.diagnostics;
  }
}
