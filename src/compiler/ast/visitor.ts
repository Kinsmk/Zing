/**
 * Visitor - Pattern Visitor pour l'AST de Zinga
 * 
 * Ce module fournit une implémentation du pattern Visitor pour parcourir
 * et transformer les nœuds de l'AST.
 */

import { ASTNode, Statement, Expression } from './nodes';

/**
 * Interface de base pour le Visitor
 */
export interface ASTVisitor {
  visitProgram?(node: any): any;
  visitEmptyStatement?(node: any): any;
  visitBlockStatement?(node: any): any;
  visitExpressionStatement?(node: any): any;
  visitIfStatement?(node: any): any;
  visitWhileStatement?(node: any): any;
  visitDoWhileStatement?(node: any): any;
  visitForStatement?(node: any): any;
  visitForOfStatement?(node: any): any;
  visitForInStatement?(node: any): any;
  visitSwitchStatement?(node: any): any;
  visitBreakStatement?(node: any): any;
  visitContinueStatement?(node: any): any;
  visitReturnStatement?(node: any): any;
  visitThrowStatement?(node: any): any;
  visitTryStatement?(node: any): any;
  visitWithStatement?(node: any): any;
  visitLabeledStatement?(node: any): any;
  visitVariableDeclaration?(node: any): any;
  visitFunctionDeclaration?(node: any): any;
  visitClassDeclaration?(node: any): any;
  visitInterfaceDeclaration?(node: any): any;
  visitEnumDeclaration?(node: any): any;
  visitTypeAliasDeclaration?(node: any): any;
  visitImportDeclaration?(node: any): any;
  visitExportDeclaration?(node: any): any;
  visitBinaryExpression?(node: any): any;
  visitUnaryExpression?(node: any): any;
  visitConditionalExpression?(node: any): any;
  visitLiteral?(node: any): any;
  visitIdentifier?(node: any): any;
  visitCallExpression?(node: any): any;
  visitMemberExpression?(node: any): any;
  visitNewExpression?(node: any): any;
  visitThisExpression?(node: any): any;
  visitSuperExpression?(node: any): any;
  visitArrayExpression?(node: any): any;
  visitObjectExpression?(node: any): any;
  visitFunctionExpression?(node: any): any;
  visitArrowFunctionExpression?(node: any): any;
  visitTemplateLiteral?(node: any): any;
  visitTaggedTemplateExpression?(node: any): any;
  visitSpreadElement?(node: any): any;
  visitAwaitExpression?(node: any): any;
  visitYieldExpression?(node: any): any;
  visitVariableDeclarator?(node: any): any;
  visitClassBody?(node: any): any;
  visitMethodDefinition?(node: any): any;
  visitInterfaceBody?(node: any): any;
  visitPropertyDefinition?(node: any): any;
  visitEnumMember?(node: any): any;
  visitTypeParameter?(node: any): any;
}

/**
 * Visiteur de base qui parcourt tous les nœuds
 */
export class BaseVisitor implements ASTVisitor {
  visit(node: ASTNode): any {
    const type = node.type as unknown as keyof ASTVisitor;
    const visitor = this[type] as ((node: any) => any) | undefined;
    
    if (visitor) {
      return visitor.call(this, node);
    }
    
    // Si aucune méthode spécifique, parcourir les enfants
    return this.visitChildren(node);
  }

  protected visitChildren(node: ASTNode): any {
    const result: any = { ...node };
    
    for (const key in node) {
      if (key !== 'type' && key !== 'location' && key !== 'toString' && key !== 'toJSON') {
        const value = (node as any)[key];
        
        if (value === null || value === undefined) {
          continue;
        }
        
        if (Array.isArray(value)) {
          result[key] = value.map((item: any) => {
            if (item && typeof item === 'object' && 'type' in item) {
              return this.visit(item);
            }
            return item;
          });
        } else if (typeof value === 'object' && 'type' in value) {
          result[key] = this.visit(value);
        }
      }
    }
    
    return result;
  }

  // Méthodes par défaut pour chaque type de nœud
  visitProgram?(node: any): any {
    return this.visitChildren(node);
  }

  visitEmptyStatement?(node: any): any {
    return node;
  }

  visitBlockStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitExpressionStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitIfStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitWhileStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitDoWhileStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitForStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitForOfStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitForInStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitSwitchStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitBreakStatement?(node: any): any {
    return node;
  }

  visitContinueStatement?(node: any): any {
    return node;
  }

  visitReturnStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitThrowStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitTryStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitWithStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitLabeledStatement?(node: any): any {
    return this.visitChildren(node);
  }

  visitVariableDeclaration?(node: any): any {
    return this.visitChildren(node);
  }

  visitFunctionDeclaration?(node: any): any {
    return this.visitChildren(node);
  }

  visitClassDeclaration?(node: any): any {
    return this.visitChildren(node);
  }

  visitInterfaceDeclaration?(node: any): any {
    return this.visitChildren(node);
  }

  visitEnumDeclaration?(node: any): any {
    return this.visitChildren(node);
  }

  visitTypeAliasDeclaration?(node: any): any {
    return this.visitChildren(node);
  }

  visitImportDeclaration?(node: any): any {
    return this.visitChildren(node);
  }

  visitExportDeclaration?(node: any): any {
    return this.visitChildren(node);
  }

  visitBinaryExpression?(node: any): any {
    return this.visitChildren(node);
  }

  visitUnaryExpression?(node: any): any {
    return this.visitChildren(node);
  }

  visitConditionalExpression?(node: any): any {
    return this.visitChildren(node);
  }

  visitLiteral?(node: any): any {
    return node;
  }

  visitIdentifier?(node: any): any {
    return node;
  }

  visitCallExpression?(node: any): any {
    return this.visitChildren(node);
  }

  visitMemberExpression?(node: any): any {
    return this.visitChildren(node);
  }

  visitNewExpression?(node: any): any {
    return this.visitChildren(node);
  }

  visitThisExpression?(node: any): any {
    return node;
  }

  visitSuperExpression?(node: any): any {
    return node;
  }

  visitArrayExpression?(node: any): any {
    return this.visitChildren(node);
  }

  visitObjectExpression?(node: any): any {
    return this.visitChildren(node);
  }

  visitFunctionExpression?(node: any): any {
    return this.visitChildren(node);
  }

  visitArrowFunctionExpression?(node: any): any {
    return this.visitChildren(node);
  }

  visitTemplateLiteral?(node: any): any {
    return this.visitChildren(node);
  }

  visitTaggedTemplateExpression?(node: any): any {
    return this.visitChildren(node);
  }

  visitSpreadElement?(node: any): any {
    return this.visitChildren(node);
  }

  visitAwaitExpression?(node: any): any {
    return this.visitChildren(node);
  }

  visitYieldExpression?(node: any): any {
    return this.visitChildren(node);
  }

  visitVariableDeclarator?(node: any): any {
    return this.visitChildren(node);
  }

  visitClassBody?(node: any): any {
    return this.visitChildren(node);
  }

  visitMethodDefinition?(node: any): any {
    return this.visitChildren(node);
  }

  visitInterfaceBody?(node: any): any {
    return this.visitChildren(node);
  }

  visitPropertyDefinition?(node: any): any {
    return this.visitChildren(node);
  }

  visitEnumMember?(node: any): any {
    return this.visitChildren(node);
  }

  visitTypeParameter?(node: any): any {
    return this.visitChildren(node);
  }
}

/**
 * Visiteur pour la validation de l'AST
 */
export class ValidationVisitor extends BaseVisitor {
  private errors: any[] = [];

  constructor() {
    super();
  }

  visit(node: ASTNode): any {
    try {
      return super.visit(node);
    } catch (error) {
      this.errors.push({
        message: (error as Error).message,
        node,
      });
      return node;
    }
  }

  getErrors(): any[] {
    return this.errors;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}

/**
 * Visiteur pour la transformation de l'AST
 */
export class TransformationVisitor extends BaseVisitor {
  protected transformations: Map<string, (node: any) => any> = new Map();

  registerTransformation(type: string, transform: (node: any) => any): void {
    this.transformations.set(type, transform);
  }

  visit(node: ASTNode): any {
    const transform = this.transformations.get(node.type);
    if (transform) {
      return transform(node);
    }
    return super.visit(node);
  }
}

/**
 * Visiteur pour la collecte de nœuds
 */
export class CollectorVisitor extends BaseVisitor {
  private collected: ASTNode[] = [];
  private filter: (node: ASTNode) => boolean;

  constructor(filter: (node: ASTNode) => boolean) {
    super();
    this.filter = filter;
  }

  visit(node: ASTNode): any {
    if (this.filter(node)) {
      this.collected.push(node);
    }
    return super.visit(node);
  }

  getCollected(): ASTNode[] {
    return this.collected;
  }

  reset(): void {
    this.collected = [];
  }
}

/**
 * Visiteur pour le comptage de nœuds
 */
export class CounterVisitor extends BaseVisitor {
  private counts: Map<string, number> = new Map();

  visit(node: ASTNode): any {
    const current = this.counts.get(node.type) || 0;
    this.counts.set(node.type, current + 1);
    return super.visit(node);
  }

  getCount(type: string): number {
    return this.counts.get(type) || 0;
  }

  getAllCounts(): Map<string, number> {
    return new Map(this.counts);
  }

  reset(): void {
    this.counts.clear();
  }
}

/**
 * Visiteur pour la recherche de nœuds
 */
export class SearchVisitor extends BaseVisitor {
  private result: ASTNode | null = null;
  private predicate: (node: ASTNode) => boolean;

  constructor(predicate: (node: ASTNode) => boolean) {
    super();
    this.predicate = predicate;
  }

  visit(node: ASTNode): any {
    if (this.predicate(node)) {
      this.result = node;
      return node; // Arrêter la recherche
    }
    return super.visit(node);
  }

  getResult(): ASTNode | null {
    return this.result;
  }

  reset(): void {
    this.result = null;
  }
}

/**
 * Visiteur pour la modification de nœuds
 */
export class ModifierVisitor extends BaseVisitor {
  private modifiers: Map<string, (node: any) => void> = new Map();

  registerModifier(type: string, modifier: (node: any) => void): void {
    this.modifiers.set(type, modifier);
  }

  visit(node: ASTNode): any {
    const modifier = this.modifiers.get(node.type);
    if (modifier) {
      modifier(node);
    }
    return super.visit(node);
  }
}

/**
 * Utilitaires pour le Visitor
 */
export function traverse(node: ASTNode, visitor: ASTVisitor): any {
  const baseVisitor = new BaseVisitor();
  
  // Copier les méthodes de visitor vers baseVisitor
  for (const key in visitor) {
    if (typeof (visitor as any)[key] === 'function') {
      (baseVisitor as any)[key] = (visitor as any)[key];
    }
  }
  
  return baseVisitor.visit(node);
}

export function validate(node: ASTNode): { valid: boolean; errors: any[] } {
  const validator = new ValidationVisitor();
  validator.visit(node);
  return {
    valid: !validator.hasErrors(),
    errors: validator.getErrors(),
  };
}

export function collect(node: ASTNode, filter: (node: ASTNode) => boolean): ASTNode[] {
  const collector = new CollectorVisitor(filter);
  collector.visit(node);
  return collector.getCollected();
}

export function count(node: ASTNode): Map<string, number> {
  const counter = new CounterVisitor();
  counter.visit(node);
  return counter.getAllCounts();
}

export function search(node: ASTNode, predicate: (node: ASTNode) => boolean): ASTNode | null {
  const searcher = new SearchVisitor(predicate);
  searcher.visit(node);
  return searcher.getResult();
}

export function findAll(node: ASTNode, type: string): ASTNode[] {
  return collect(node, n => n.type === type);
}

export function findFirst(node: ASTNode, type: string): ASTNode | null {
  return search(node, n => n.type === type);
}
