/**
 * Nodes - Définitions des nœuds AST pour Zinga
 * 
 * Ce module définit tous les types de nœuds de l'arbre syntaxique abstrait (AST)
 * pour le langage Zinga, incluant les instructions, expressions, déclarations, etc.
 * 
 * Ce fichier ré-exporte tous les types depuis nodes-base, nodes-expressions et nodes-declarations
 * pour une importation simplifiée.
 */

// Ré-exporter les types de base
export * from './nodes-base';

// Ré-exporter les types d'expressions
export * from './nodes-expressions';

// Ré-exporter les types de déclarations
export * from './nodes-declarations';

// Exporter les types principaux pour compatibilité
export {
  BaseNode,
  NodeType,
  ASTNode,
  Statement,
  Expression,
} from './nodes-base';
