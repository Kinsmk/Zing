/**
 * Nodes Base - Types de base pour l'AST de Zinga
 * 
 * Ce module contient uniquement les types et interfaces de base
 * sans dépendances circulaires.
 */

import { SourceLocation } from '../lexer/positions';

/**
 * Type de nœud AST
 */
export enum NodeType {
  // Programme
  Program = 'Program',
  
  // Instructions
  EmptyStatement = 'EmptyStatement',
  BlockStatement = 'BlockStatement',
  ExpressionStatement = 'ExpressionStatement',
  IfStatement = 'IfStatement',
  WhileStatement = 'WhileStatement',
  DoWhileStatement = 'DoWhileStatement',
  ForStatement = 'ForStatement',
  ForOfStatement = 'ForOfStatement',
  ForInStatement = 'ForInStatement',
  SwitchStatement = 'SwitchStatement',
  SwitchCase = 'SwitchCase',
  BreakStatement = 'BreakStatement',
  ContinueStatement = 'ContinueStatement',
  ReturnStatement = 'ReturnStatement',
  ThrowStatement = 'ThrowStatement',
  TryStatement = 'TryStatement',
  CatchClause = 'CatchClause',
  FinallyClause = 'FinallyClause',
  WithStatement = 'WithStatement',
  LabeledStatement = 'LabeledStatement',
  
  // Déclarations
  VariableDeclaration = 'VariableDeclaration',
  VariableDeclarator = 'VariableDeclarator',
  FunctionDeclaration = 'FunctionDeclaration',
  ClassDeclaration = 'ClassDeclaration',
  InterfaceDeclaration = 'InterfaceDeclaration',
  EnumDeclaration = 'EnumDeclaration',
  TypeAliasDeclaration = 'TypeAliasDeclaration',
  ImportDeclaration = 'ImportDeclaration',
  ImportSpecifier = 'ImportSpecifier',
  ImportDefaultSpecifier = 'ImportDefaultSpecifier',
  ImportNamespaceSpecifier = 'ImportNamespaceSpecifier',
  ExportDeclaration = 'ExportDeclaration',
  ExportDefaultDeclaration = 'ExportDefaultDeclaration',
  ExportNamedDeclaration = 'ExportNamedDeclaration',
  ExportAllDeclaration = 'ExportAllDeclaration',
  ExportSpecifier = 'ExportSpecifier',
  
  // Expressions
  ThisExpression = 'ThisExpression',
  SuperExpression = 'SuperExpression',
  Identifier = 'Identifier',
  Literal = 'Literal',
  StringLiteral = 'StringLiteral',
  NumericLiteral = 'NumericLiteral',
  BooleanLiteral = 'BooleanLiteral',
  NullLiteral = 'NullLiteral',
  UndefinedLiteral = 'UndefinedLiteral',
  BigIntLiteral = 'BigIntLiteral',
  RegExpLiteral = 'RegExpLiteral',
  BinaryExpression = 'BinaryExpression',
  UnaryExpression = 'UnaryExpression',
  ConditionalExpression = 'ConditionalExpression',
  CallExpression = 'CallExpression',
  MemberExpression = 'MemberExpression',
  NewExpression = 'NewExpression',
  ArrayExpression = 'ArrayExpression',
  ObjectExpression = 'ObjectExpression',
  ObjectProperty = 'ObjectProperty',
  ObjectMethod = 'ObjectMethod',
  FunctionExpression = 'FunctionExpression',
  ArrowFunctionExpression = 'ArrowFunctionExpression',
  TemplateLiteral = 'TemplateLiteral',
  TemplateElement = 'TemplateElement',
  TaggedTemplateExpression = 'TaggedTemplateExpression',
  SpreadElement = 'SpreadElement',
  RestElement = 'RestElement',
  AwaitExpression = 'AwaitExpression',
  YieldExpression = 'YieldExpression',
  
  // Classes
  ClassBody = 'ClassBody',
  MethodDefinition = 'MethodDefinition',
  PropertyDefinition = 'PropertyDefinition',
  StaticBlock = 'StaticBlock',
  PrivateIdentifier = 'PrivateIdentifier',
  
  // Interfaces
  InterfaceBody = 'InterfaceBody',
  
  // Enums
  EnumMember = 'EnumMember',
  
  // Types
  TypeParameter = 'TypeParameter',
  TypeParameterDeclaration = 'TypeParameterDeclaration',
  TypeAnnotation = 'TypeAnnotation',
  TypeLiteral = 'TypeLiteral',
  
  // Patterns
  Pattern = 'Pattern',
  ObjectPattern = 'ObjectPattern',
  ArrayPattern = 'ArrayPattern',
  RestPattern = 'RestPattern',
  AssignmentPattern = 'AssignmentPattern',
  
  // Déclarations de modules
  ModuleDeclaration = 'ModuleDeclaration',
  ModuleSpecifier = 'ModuleSpecifier',
}

/**
 * Nœud AST de base
 */
export interface ASTNode {
  type: NodeType;
  location?: SourceLocation;
  toString(): string;
  toJSON(): any;
}

/**
 * Classe de base pour tous les nœuds
 */
export abstract class BaseNode implements ASTNode {
  type: NodeType;
  location?: SourceLocation;

  constructor(type: NodeType, location?: SourceLocation) {
    this.type = type;
    this.location = location;
  }

  toString(): string {
    return this.type;
  }

  toJSON(): any {
    const result: any = {
      type: this.type,
    };
    
    if (this.location) {
      result.location = this.location.toJSON();
    }
    
    return result;
  }
}

/**
 * Type Expression - sera implémenté par les classes d'expressions
 */
export interface Expression extends ASTNode {
  type: NodeType.ThisExpression | 
         NodeType.SuperExpression | 
         NodeType.Identifier | 
         NodeType.Literal | 
         NodeType.StringLiteral | 
         NodeType.NumericLiteral | 
         NodeType.BooleanLiteral | 
         NodeType.NullLiteral | 
         NodeType.UndefinedLiteral | 
         NodeType.BigIntLiteral | 
         NodeType.RegExpLiteral | 
         NodeType.BinaryExpression | 
         NodeType.UnaryExpression | 
         NodeType.ConditionalExpression | 
         NodeType.CallExpression | 
         NodeType.MemberExpression | 
         NodeType.NewExpression | 
         NodeType.ArrayExpression | 
         NodeType.ObjectExpression | 
         NodeType.ObjectProperty | 
         NodeType.ObjectMethod | 
         NodeType.FunctionExpression | 
         NodeType.ArrowFunctionExpression | 
         NodeType.TemplateLiteral | 
         NodeType.TemplateElement | 
         NodeType.TaggedTemplateExpression | 
         NodeType.SpreadElement | 
         NodeType.RestElement | 
         NodeType.AwaitExpression | 
         NodeType.YieldExpression;
}

/**
 * Type Statement - sera implémenté par les classes d'instructions
 */
export interface Statement extends ASTNode {
  type: NodeType.Program | 
         NodeType.EmptyStatement | 
         NodeType.BlockStatement | 
         NodeType.ExpressionStatement | 
         NodeType.IfStatement | 
         NodeType.WhileStatement | 
         NodeType.DoWhileStatement | 
         NodeType.ForStatement | 
         NodeType.ForOfStatement | 
         NodeType.ForInStatement | 
         NodeType.SwitchStatement | 
         NodeType.SwitchCase | 
         NodeType.BreakStatement | 
         NodeType.ContinueStatement | 
         NodeType.ReturnStatement | 
         NodeType.ThrowStatement | 
         NodeType.TryStatement | 
         NodeType.CatchClause | 
         NodeType.WithStatement | 
         NodeType.LabeledStatement | 
         NodeType.VariableDeclaration | 
         NodeType.FunctionDeclaration | 
         NodeType.ClassDeclaration | 
         NodeType.InterfaceDeclaration | 
         NodeType.EnumDeclaration | 
         NodeType.TypeAliasDeclaration | 
         NodeType.ImportDeclaration | 
         NodeType.ExportDeclaration;
}

// Exporter pour utilisation dans les autres fichiers
export type { ASTNode as ASTNodeType };
