/**
 * Printer - Impression de l'AST pour Zinga
 * 
 * Ce module permet de convertir l'AST en une représentation textuelle,
 * utile pour le débogage et la visualisation.
 */

import { ASTNode, Statement, Expression } from './nodes';

export interface PrintOptions {
  indent?: number;
  newline?: string;
  spaces?: number;
  showLocations?: boolean;
  showTypes?: boolean;
}

export class ASTPrinter {
  private options: PrintOptions;

  constructor(options: PrintOptions = {}) {
    this.options = {
      indent: 0,
      newline: '\n',
      spaces: 2,
      showLocations: false,
      showTypes: true,
      ...options,
    };
  }

  /**
   * Imprimer un nœud AST
   */
  public print(node: ASTNode): string {
    return this.printNode(node, 0);
  }

  /**
   * Imprimer un nœud avec un niveau d'indentation
   */
  private printNode(node: ASTNode, level: number): string {
    const indent = ' '.repeat(level * this.options.spaces!);
    let result = indent;

    // Type du nœud
    if (this.options.showTypes) {
      result += `${node.type}`;
    }

    // Contenu du nœud
    result += this.printNodeContent(node, level);

    // Location
    if (this.options.showLocations && node.location) {
      result += ` [${node.location.toString()}]`;
    }

    return result;
  }

  /**
   * Imprimer le contenu d'un nœud
   */
  private printNodeContent(node: ASTNode, level: number): string {
    const type = node.type as string;
    
    // Nœuds littéraux
    if (type === 'Literal') {
      const value = (node as any).value;
      return ` (${JSON.stringify(value)})`;
    }

    // Identifiants
    if (type === 'Identifier') {
      return ` (${(node as any).name})`;
    }

    // Opérateurs binaires
    if (type === 'BinaryExpression') {
      const op = (node as any).operator;
      return ` (${op})`;
    }

    // Opérateurs unaires
    if (type === 'UnaryExpression') {
      const op = (node as any).operator;
      return ` (${op})`;
    }

    // Déclarations de variables
    if (type === 'VariableDeclaration') {
      const kind = (node as any).kind;
      return ` (${kind})`;
    }

    // Fonctions
    if (type === 'FunctionDeclaration' || type === 'FunctionExpression') {
      const name = (node as any).id?.name || 'anonymous';
      return ` (${name})`;
    }

    // Classes
    if (type === 'ClassDeclaration') {
      const name = (node as any).id?.name || 'anonymous';
      return ` (${name})`;
    }

    // Interfaces
    if (type === 'InterfaceDeclaration') {
      const name = (node as any).id?.name || 'anonymous';
      return ` (${name})`;
    }

    // Imports/Exports
    if (type === 'ImportDeclaration') {
      const source = (node as any).source?.value || '';
      return ` (${source})`;
    }

    if (type === 'ExportDeclaration') {
      const declaration = (node as any).declaration?.type || 'default';
      return ` (${declaration})`;
    }

    // Retour vide pour les autres
    return '';
  }

  /**
   * Imprimer l'AST complet avec structure
   */
  public printTree(node: ASTNode): string {
    return this.printNodeTree(node, 0);
  }

  /**
   * Imprimer un nœud avec sa hiérarchie
   */
  private printNodeTree(node: ASTNode, level: number): string {
    const lines: string[] = [];
    const indent = ' '.repeat(level * this.options.spaces!);
    
    // Ligne du nœud courant
    let line = indent + this.formatNodeType(node);
    
    // Ajouter le contenu
    line += this.printNodeContent(node, level);
    
    // Ajouter la location
    if (this.options.showLocations && node.location) {
      line += ` [${node.location.toString()}]`;
    }
    
    lines.push(line);
    
    // Parcourir les enfants
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
            lines.push(this.printNodeTree(item, level + 1));
          }
        }
      } else if (typeof value === 'object' && 'type' in value) {
        lines.push(this.printNodeTree(value, level + 1));
      }
    }
    
    return lines.join(this.options.newline);
  }

  /**
   * Formater le type du nœud
   */
  private formatNodeType(node: ASTNode): string {
    return node.type;
  }

  /**
   * Imprimer l'AST en JSON
   */
  public printJSON(node: ASTNode): string {
    return JSON.stringify(node.toJSON(), null, 2);
  }

  /**
   * Imprimer l'AST en format compact
   */
  public printCompact(node: ASTNode): string {
    const lines: string[] = [];
    this.printCompactNode(node, lines, 0);
    return lines.join(this.options.newline);
  }

  /**
   * Imprimer un nœud en format compact
   */
  private printCompactNode(node: ASTNode, lines: string[], level: number): void {
    const indent = ' '.repeat(level * this.options.spaces!);
    let line = indent + node.type;
    
    // Ajouter des informations spécifiques
    switch (node.type) {
      case 'Literal':
        line += `: ${JSON.stringify((node as any).value)}`;
        break;
      case 'Identifier':
        line += `: ${(node as any).name}`;
        break;
      case 'BinaryExpression':
      case 'UnaryExpression':
        line += `: ${(node as any).operator}`;
        break;
      case 'VariableDeclaration':
        line += `: ${(node as any).kind}`;
        break;
      case 'FunctionDeclaration':
      case 'FunctionExpression':
        line += `: ${(node as any).id?.name || 'anonymous'}`;
        break;
      case 'ClassDeclaration':
      case 'InterfaceDeclaration':
        line += `: ${(node as any).id?.name || 'anonymous'}`;
        break;
    }
    
    lines.push(line);
    
    // Parcourir les enfants
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
            this.printCompactNode(item, lines, level + 1);
          }
        }
      } else if (typeof value === 'object' && 'type' in value) {
        this.printCompactNode(value, lines, level + 1);
      }
    }
  }

  /**
   * Imprimer l'AST en format graphique (ASCII)
   */
  public printGraph(node: ASTNode): string {
    const lines: string[] = [];
    this.printGraphNode(node, lines, 0, []);
    return lines.join(this.options.newline);
  }

  /**
   * Imprimer un nœud en format graphique
   */
  private printGraphNode(node: ASTNode, lines: string[], level: number, parents: number[]): void {
    const prefix = this.getGraphPrefix(level, parents);
    const line = prefix + this.formatNodeType(node);
    lines.push(line);
    
    // Parcourir les enfants
    const children: ASTNode[] = [];
    for (const key in node) {
      if (key === 'type' || key === 'location' || key === 'toString' || key === 'toJSON') {
        continue;
      }
      
      const value = (node as any)[key];
      if (value === null || value === undefined) {
        continue;
      }
      
      if (Array.isArray(value)) {
        children.push(...value.filter((item: any) => item && typeof item === 'object' && 'type' in item));
      } else if (typeof value === 'object' && 'type' in value) {
        children.push(value);
      }
    }
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const isLast = i === children.length - 1;
      const newParents = [...parents, isLast ? 0 : 1];
      this.printGraphNode(child, lines, level + 1, newParents);
    }
  }

  /**
   * Obtenir le préfixe pour le format graphique
   */
  private getGraphPrefix(level: number, parents: number[]): string {
    let prefix = '';
    for (let i = 0; i < level; i++) {
      if (parents[i] === 0) {
        prefix += '    ';
      } else {
        prefix += '│   ';
      }
    }
    return prefix + (level > 0 ? '├── ' : '');
  }

  /**
   * Configurer les options
   */
  public configure(options: PrintOptions): void {
    this.options = { ...this.options, ...options };
  }
}

/**
 * Fonction utilitaire pour imprimer l'AST
 */
export function printAST(node: ASTNode, options: PrintOptions = {}): string {
  const printer = new ASTPrinter(options);
  return printer.printTree(node);
}

export function printASTJSON(node: ASTNode): string {
  const printer = new ASTPrinter();
  return printer.printJSON(node);
}

export function printASTCompact(node: ASTNode): string {
  const printer = new ASTPrinter();
  return printer.printCompact(node);
}

export function printASTGraph(node: ASTNode): string {
  const printer = new ASTPrinter();
  return printer.printGraph(node);
}
