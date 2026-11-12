/**
 * Validation - Validation de l'AST pour Zinga
 * 
 * Ce module fournit des utilitaires pour valider la structure de l'AST
 * et détecter les erreurs sémantiques.
 */

import { ASTNode, Statement, Expression } from './nodes';
import { ASTVisitor, ValidationVisitor } from './visitor';

export interface ValidationError {
  message: string;
  node: ASTNode;
  path: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
}

export class ASTValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];
  private infos: ValidationError[] = [];
  private path: string[] = [];

  constructor() {}

  /**
   * Valider un nœud AST
   */
  public validate(node: ASTNode): ValidationResult {
    this.errors = [];
    this.warnings = [];
    this.infos = [];
    this.path = [];
    
    this.visit(node);
    
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      infos: this.infos,
    };
  }

  /**
   * Visiter un nœud
   */
  private visit(node: ASTNode): void {
    this.path.push(node.type);
    
    try {
      // Appliquer les validations spécifiques
      this.validateNode(node);
      
      // Visiter les enfants
      this.visitChildren(node);
    } finally {
      this.path.pop();
    }
  }

  /**
   * Valider un nœud spécifique
   */
  private validateNode(node: ASTNode): void {
    const type = node.type as string;
    
    switch (type) {
      case 'Program':
        this.validateProgram(node as any);
        break;
      case 'VariableDeclaration':
        this.validateVariableDeclaration(node as any);
        break;
      case 'FunctionDeclaration':
        this.validateFunctionDeclaration(node as any);
        break;
      case 'ClassDeclaration':
        this.validateClassDeclaration(node as any);
        break;
      case 'InterfaceDeclaration':
        this.validateInterfaceDeclaration(node as any);
        break;
      case 'ImportDeclaration':
        this.validateImportDeclaration(node as any);
        break;
      case 'ExportDeclaration':
        this.validateExportDeclaration(node as any);
        break;
      case 'IfStatement':
        this.validateIfStatement(node as any);
        break;
      case 'ForStatement':
        this.validateForStatement(node as any);
        break;
      case 'WhileStatement':
        this.validateWhileStatement(node as any);
        break;
      case 'CallExpression':
        this.validateCallExpression(node as any);
        break;
      case 'MemberExpression':
        this.validateMemberExpression(node as any);
        break;
      case 'BinaryExpression':
        this.validateBinaryExpression(node as any);
        break;
      case 'UnaryExpression':
        this.validateUnaryExpression(node as any);
        break;
      case 'Identifier':
        this.validateIdentifier(node as any);
        break;
      case 'Literal':
        this.validateLiteral(node as any);
        break;
    }
  }

  /**
   * Valider un programme
   */
  private validateProgram(node: any): void {
    // Vérifier qu'il y a au moins un statement
    if (node.body.length === 0) {
      this.addWarning('Program is empty', node);
    }
  }

  /**
   * Valider une déclaration de variable
   */
  private validateVariableDeclaration(node: any): void {
    // Vérifier qu'il y a au moins un déclarateur
    if (!node.declarations || node.declarations.length === 0) {
      this.addError('Variable declaration has no declarators', node);
      return;
    }
    
    // Valider chaque déclarateur
    for (const declarator of node.declarations) {
      this.validateVariableDeclarator(declarator, node);
    }
  }

  /**
   * Valider un déclarateur de variable
   */
  private validateVariableDeclarator(node: any, parent: any): void {
    // Vérifier qu'il y a un identifiant
    if (!node.id || !node.id.name) {
      this.addError('Variable declarator has no identifier', node);
      return;
    }
    
    // Vérifier que le nom est valide
    if (!this.isValidIdentifier(node.id.name)) {
      this.addError(`Invalid identifier: ${node.id.name}`, node.id);
    }
    
    // Vérifier l'initialisation
    if (node.init && !this.isExpression(node.init)) {
      this.addError('Variable initializer is not an expression', node.init);
    }
  }

  /**
   * Valider une déclaration de fonction
   */
  private validateFunctionDeclaration(node: any): void {
    // Vérifier qu'il y a un corps
    if (!node.body) {
      this.addError('Function has no body', node);
      return;
    }
    
    // Vérifier que les paramètres sont valides
    if (node.params) {
      for (const param of node.params) {
        if (!this.isValidIdentifier(param.name)) {
          this.addError(`Invalid parameter name: ${param.name}`, param);
        }
      }
    }
  }

  /**
   * Valider une déclaration de classe
   */
  private validateClassDeclaration(node: any): void {
    // Vérifier qu'il y a un nom
    if (!node.id || !node.id.name) {
      this.addError('Class has no name', node);
      return;
    }
    
    // Vérifier que le nom est valide
    if (!this.isValidIdentifier(node.id.name)) {
      this.addError(`Invalid class name: ${node.id.name}`, node.id);
    }
    
    // Vérifier le corps
    if (!node.body) {
      this.addError('Class has no body', node);
      return;
    }
    
    // Vérifier l'héritage
    if (node.superClass && !this.isExpression(node.superClass)) {
      this.addError('Super class is not an expression', node.superClass);
    }
  }

  /**
   * Valider une déclaration d'interface
   */
  private validateInterfaceDeclaration(node: any): void {
    // Vérifier qu'il y a un nom
    if (!node.id || !node.id.name) {
      this.addError('Interface has no name', node);
      return;
    }
    
    // Vérifier que le nom est valide
    if (!this.isValidIdentifier(node.id.name)) {
      this.addError(`Invalid interface name: ${node.id.name}`, node.id);
    }
    
    // Vérifier le corps
    if (!node.body) {
      this.addError('Interface has no body', node);
      return;
    }
  }

  /**
   * Valider une déclaration d'import
   */
  private validateImportDeclaration(node: any): void {
    // Vérifier qu'il y a une source
    if (!node.source) {
      this.addError('Import has no source', node);
      return;
    }
    
    // Vérifier que la source est une chaîne
    if (node.source.type !== 'Literal' || typeof node.source.value !== 'string') {
      this.addError('Import source is not a string', node.source);
    }
  }

  /**
   * Valider une déclaration d'export
   */
  private validateExportDeclaration(node: any): void {
    // Vérifier qu'il y a au moins une spécification ou une déclaration
    if (!node.declaration && (!node.specifiers || node.specifiers.length === 0)) {
      this.addError('Export has no declaration or specifiers', node);
    }
  }

  /**
   * Valider un statement if
   */
  private validateIfStatement(node: any): void {
    // Vérifier qu'il y a une condition
    if (!node.test) {
      this.addError('If statement has no test', node);
      return;
    }
    
    // Vérifier que la condition est une expression
    if (!this.isExpression(node.test)) {
      this.addError('If test is not an expression', node.test);
    }
    
    // Vérifier qu'il y a un conséquent
    if (!node.consequent) {
      this.addError('If statement has no consequent', node);
      return;
    }
  }

  /**
   * Valider un statement for
   */
  private validateForStatement(node: any): void {
    // Vérifier qu'il y a un corps
    if (!node.body) {
      this.addError('For statement has no body', node);
      return;
    }
    
    // Vérifier que l'initialisation est valide
    if (node.init && !this.isVariableDeclaration(node.init) && !this.isExpression(node.init)) {
      this.addError('For initialization is not valid', node.init);
    }
    
    // Vérifier que la condition est une expression
    if (node.test && !this.isExpression(node.test)) {
      this.addError('For test is not an expression', node.test);
    }
    
    // Vérifier que l'incrémentation est une expression
    if (node.update && !this.isExpression(node.update)) {
      this.addError('For update is not an expression', node.update);
    }
  }

  /**
   * Valider un statement while
   */
  private validateWhileStatement(node: any): void {
    // Vérifier qu'il y a une condition
    if (!node.test) {
      this.addError('While statement has no test', node);
      return;
    }
    
    // Vérifier que la condition est une expression
    if (!this.isExpression(node.test)) {
      this.addError('While test is not an expression', node.test);
    }
    
    // Vérifier qu'il y a un corps
    if (!node.body) {
      this.addError('While statement has no body', node);
      return;
    }
  }

  /**
   * Valider un appel de fonction
   */
  private validateCallExpression(node: any): void {
    // Vérifier qu'il y a un callee
    if (!node.callee) {
      this.addError('Call expression has no callee', node);
      return;
    }
    
    // Vérifier que le callee est une expression
    if (!this.isExpression(node.callee)) {
      this.addError('Call callee is not an expression', node.callee);
    }
    
    // Vérifier que les arguments sont des expressions
    if (node.arguments) {
      for (const arg of node.arguments) {
        if (!this.isExpression(arg)) {
          this.addError('Call argument is not an expression', arg);
        }
      }
    }
  }

  /**
   * Valider un accès membre
   */
  private validateMemberExpression(node: any): void {
    // Vérifier qu'il y a un objet
    if (!node.object) {
      this.addError('Member expression has no object', node);
      return;
    }
    
    // Vérifier que l'objet est une expression
    if (!this.isExpression(node.object)) {
      this.addError('Member object is not an expression', node.object);
    }
    
    // Vérifier qu'il y a une propriété
    if (!node.property) {
      this.addError('Member expression has no property', node);
      return;
    }
    
    // Vérifier que la propriété est une expression
    if (!this.isExpression(node.property)) {
      this.addError('Member property is not an expression', node.property);
    }
  }

  /**
   * Valider une expression binaire
   */
  private validateBinaryExpression(node: any): void {
    // Vérifier qu'il y a un opérateur
    if (!node.operator) {
      this.addError('Binary expression has no operator', node);
      return;
    }
    
    // Vérifier qu'il y a un opérande gauche
    if (!node.left) {
      this.addError('Binary expression has no left operand', node);
      return;
    }
    
    // Vérifier que l'opérande gauche est une expression
    if (!this.isExpression(node.left)) {
      this.addError('Binary left operand is not an expression', node.left);
    }
    
    // Vérifier qu'il y a un opérande droit
    if (!node.right) {
      this.addError('Binary expression has no right operand', node);
      return;
    }
    
    // Vérifier que l'opérande droit est une expression
    if (!this.isExpression(node.right)) {
      this.addError('Binary right operand is not an expression', node.right);
    }
  }

  /**
   * Valider une expression unaire
   */
  private validateUnaryExpression(node: any): void {
    // Vérifier qu'il y a un opérateur
    if (!node.operator) {
      this.addError('Unary expression has no operator', node);
      return;
    }
    
    // Vérifier qu'il y a un opérande
    if (!node.operand) {
      this.addError('Unary expression has no operand', node);
      return;
    }
    
    // Vérifier que l'opérande est une expression
    if (!this.isExpression(node.operand)) {
      this.addError('Unary operand is not an expression', node.operand);
    }
  }

  /**
   * Valider un identifiant
   */
  private validateIdentifier(node: any): void {
    // Vérifier qu'il y a un nom
    if (!node.name) {
      this.addError('Identifier has no name', node);
      return;
    }
    
    // Vérifier que le nom est valide
    if (!this.isValidIdentifier(node.name)) {
      this.addError(`Invalid identifier: ${node.name}`, node);
    }
  }

  /**
   * Valider un littéral
   */
  private validateLiteral(node: any): void {
    // Vérifier qu'il y a une valeur
    if (node.value === undefined) {
      this.addError('Literal has no value', node);
      return;
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
   * Ajouter une erreur
   */
  private addError(message: string, node: ASTNode): void {
    this.errors.push({
      message,
      node,
      path: this.path.join('.'),
      severity: 'error',
    });
  }

  /**
   * Ajouter un avertissement
   */
  private addWarning(message: string, node: ASTNode): void {
    this.warnings.push({
      message,
      node,
      path: this.path.join('.'),
      severity: 'warning',
    });
  }

  /**
   * Ajouter une information
   */
  private addInfo(message: string, node: ASTNode): void {
    this.infos.push({
      message,
      node,
      path: this.path.join('.'),
      severity: 'info',
    });
  }

  /**
   * Vérifier si un nom est un identifiant valide
   */
  private isValidIdentifier(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }
    
    // Vérifier que le premier caractère est valide
    const firstChar = name[0];
    if (!(/[a-zA-Z_$]/).test(firstChar) && !this.isUnicodeLetter(firstChar)) {
      return false;
    }
    
    // Vérifier les caractères suivants
    for (let i = 1; i < name.length; i++) {
      const char = name[i];
      if (!(/[a-zA-Z0-9_$]/).test(char) && !this.isUnicodeLetter(char) && !this.isUnicodeDigit(char)) {
        return false;
      }
    }
    
    // Vérifier que ce n'est pas un mot-clé
    return !this.isReservedWord(name);
  }

  /**
   * Vérifier si un caractère est une lettre Unicode
   */
  private isUnicodeLetter(char: string): boolean {
    const code = char.charCodeAt(0);
    return (
      (code >= 0x0041 && code <= 0x005A) || // A-Z
      (code >= 0x0061 && code <= 0x007A) || // a-z
      (code >= 0x00C0 && code <= 0x017F) || // Latin-1 Supplement
      code >= 0x0200 // Autres lettres
    );
  }

  /**
   * Vérifier si un caractère est un chiffre Unicode
   */
  private isUnicodeDigit(char: string): boolean {
    const code = char.charCodeAt(0);
    return (
      (code >= 0x0030 && code <= 0x0039) || // 0-9
      (code >= 0x0660 && code <= 0x0669) || // Chiffres arabes
      (code >= 0x0966 && code <= 0x096F) // Chiffres devanagari
    );
  }

  /**
   * Vérifier si un nom est un mot-clé réservé
   */
  private isReservedWord(name: string): boolean {
    const reservedWords = [
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
      'break', 'continue', 'return', 'throw', 'try', 'catch', 'finally',
      'function', 'var', 'let', 'const', 'class', 'interface', 'enum',
      'type', 'import', 'export', 'from', 'as', 'new', 'this', 'super',
      'null', 'true', 'false', 'void', 'delete', 'typeof', 'instanceof',
      'in', 'of', 'async', 'await', 'yield', 'static', 'public', 'private',
      'protected', 'get', 'set', 'constructor', 'extends', 'implements',
      'si', 'sinon', 'pour', 'tantque', 'faire', 'selon', 'cas', 'defaut',
      'casser', 'continuer', 'retourner', 'lancer', 'essayer', 'attraper',
      'finalement', 'fonction', 'variable', 'classe', 'interface', 'enumeration',
      'type', 'importer', 'exporter', 'de', 'comme', 'nouveau', 'ce', 'superieur',
      'nul', 'vrai', 'faux', 'vide', 'supprimer', 'typeDe', 'instanceDe',
      'dans', 'de', 'asynchrone', 'attendre', 'produire', 'statique', 'public',
      'prive', 'protege', 'obtenir', 'definir', 'constructeur', 'etendre', 'implementer',
    ];
    return reservedWords.includes(name.toLowerCase());
  }

  /**
   * Vérifier si un nœud est une expression
   */
  private isExpression(node: ASTNode): node is Expression {
    const expressionTypes = [
      'BinaryExpression', 'UnaryExpression', 'ConditionalExpression',
      'Literal', 'Identifier', 'CallExpression', 'MemberExpression',
      'NewExpression', 'ThisExpression', 'SuperExpression', 'ArrayExpression',
      'ObjectExpression', 'FunctionExpression', 'ArrowFunctionExpression',
      'TemplateLiteral', 'TaggedTemplateExpression', 'SpreadElement',
      'AwaitExpression', 'YieldExpression',
    ];
    return expressionTypes.includes(node.type);
  }

  /**
   * Vérifier si un nœud est une déclaration de variable
   */
  private isVariableDeclaration(node: ASTNode): boolean {
    return node.type === 'VariableDeclaration';
  }

  /**
   * Vérifier si un nœud est un statement
   */
  private isStatement(node: ASTNode): node is Statement {
    const statementTypes = [
      'EmptyStatement', 'BlockStatement', 'ExpressionStatement',
      'IfStatement', 'WhileStatement', 'DoWhileStatement', 'ForStatement',
      'ForOfStatement', 'ForInStatement', 'SwitchStatement', 'BreakStatement',
      'ContinueStatement', 'ReturnStatement', 'ThrowStatement', 'TryStatement',
      'WithStatement', 'LabeledStatement', 'VariableDeclaration',
      'FunctionDeclaration', 'ClassDeclaration', 'InterfaceDeclaration',
      'EnumDeclaration', 'TypeAliasDeclaration', 'ImportDeclaration', 'ExportDeclaration',
    ];
    return statementTypes.includes(node.type);
  }
}

/**
 * Valider un nœud AST
 */
export function validateAST(node: ASTNode): ValidationResult {
  const validator = new ASTValidator();
  return validator.validate(node);
}

/**
 * Vérifier si un AST est valide
 */
export function isValidAST(node: ASTNode): boolean {
  return validateAST(node).valid;
}

/**
 * Obtenir les erreurs de validation d'un AST
 */
export function getValidationErrors(node: ASTNode): ValidationError[] {
  return validateAST(node).errors;
}
