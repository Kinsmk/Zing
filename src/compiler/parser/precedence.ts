/**
 * Precedence - Précédence des opérateurs pour Zinga
 * 
 * Ce module définit les niveaux de précédence pour les opérateurs,
 * ce qui permet au parser de gérer correctement l'ordre des opérations.
 */

import { TokenType } from '../lexer/token-types';

// Niveaux de précédence (du plus bas au plus haut)
export enum Precedence {
  // Niveau 0 - le plus bas
  ASSIGNMENT = 0,
  YIELD = 0,
  CONDITIONAL = 1,
  
  // Niveau 2
  LOGICAL_OR = 2,
  
  // Niveau 3
  LOGICAL_AND = 3,
  
  // Niveau 4
  BITWISE_OR = 4,
  
  // Niveau 5
  BITWISE_XOR = 5,
  
  // Niveau 6
  BITWISE_AND = 6,
  
  // Niveau 7
  EQUALITY = 7,
  
  // Niveau 8
  RELATIONAL = 8,
  IN = 8,
  INSTANCEOF = 8,
  
  // Niveau 9
  SHIFT = 9,
  
  // Niveau 10
  ADDITIVE = 10,
  
  // Niveau 11
  MULTIPLICATIVE = 11,
  
  // Niveau 12
  EXPONENTIATION = 12,
  
  // Niveau 13
  UNARY = 13,
  POSTFIX = 13,
  
  // Niveau 14
  CALL = 14,
  MEMBER = 14,
  NEW = 14,
  
  // Niveau 15 - le plus haut
  GROUPING = 15,
}

// Map des opérateurs à leur précédence
const PRECEDENCE_MAP: Record<TokenType, Precedence> = {
  // Assignment operators
  [TokenType.ASSIGN]: Precedence.ASSIGNMENT,
  [TokenType.PLUS_ASSIGN]: Precedence.ASSIGNMENT,
  [TokenType.MINUS_ASSIGN]: Precedence.ASSIGNMENT,
  [TokenType.MULTIPLY_ASSIGN]: Precedence.ASSIGNMENT,
  [TokenType.DIVIDE_ASSIGN]: Precedence.ASSIGNMENT,
  [TokenType.MODULO_ASSIGN]: Precedence.ASSIGNMENT,
  
  // Conditional (ternary)
  [TokenType.QUESTION]: Precedence.CONDITIONAL,
  
  // Logical OR
  [TokenType.OR]: Precedence.LOGICAL_OR,
  
  // Logical AND
  [TokenType.AND]: Precedence.LOGICAL_AND,
  
  // Bitwise OR
  [TokenType.BITWISE_OR]: Precedence.BITWISE_OR,
  
  // Bitwise XOR
  [TokenType.BITWISE_XOR]: Precedence.BITWISE_XOR,
  
  // Bitwise AND
  [TokenType.BITWISE_AND]: Precedence.BITWISE_AND,
  
  // Equality
  [TokenType.EQUAL]: Precedence.EQUALITY,
  [TokenType.NOT_EQUAL]: Precedence.EQUALITY,
  [TokenType.STRICT_EQUAL]: Precedence.EQUALITY,
  [TokenType.STRICT_NOT_EQUAL]: Precedence.EQUALITY,
  
  // Relational
  [TokenType.GREATER]: Precedence.RELATIONAL,
  [TokenType.LESS]: Precedence.RELATIONAL,
  [TokenType.GREATER_EQUAL]: Precedence.RELATIONAL,
  [TokenType.LESS_EQUAL]: Precedence.RELATIONAL,
  [TokenType.IN]: Precedence.IN,
  [TokenType.INSTANCEOF]: Precedence.INSTANCEOF,
  
  // Shift
  [TokenType.LEFT_SHIFT]: Precedence.SHIFT,
  [TokenType.RIGHT_SHIFT]: Precedence.SHIFT,
  [TokenType.UNSIGNED_RIGHT_SHIFT]: Precedence.SHIFT,
  
  // Additive
  [TokenType.PLUS]: Precedence.ADDITIVE,
  [TokenType.MINUS]: Precedence.ADDITIVE,
  
  // Multiplicative
  [TokenType.MULTIPLY]: Precedence.MULTIPLICATIVE,
  [TokenType.DIVIDE]: Precedence.MULTIPLICATIVE,
  [TokenType.MODULO]: Precedence.MULTIPLICATIVE,
  
  // Exponentiation
  [TokenType.POWER]: Precedence.EXPONENTIATION,
  
  // Unary
  [TokenType.NOT]: Precedence.UNARY,
  [TokenType.BITWISE_NOT]: Precedence.UNARY,
  [TokenType.PLUS]: Precedence.UNARY,
  [TokenType.MINUS]: Precedence.UNARY,
  [TokenType.INCREMENT]: Precedence.UNARY,
  [TokenType.DECREMENT]: Precedence.UNARY,
  [TokenType.TYPEOF]: Precedence.UNARY,
  [TokenType.VOID]: Precedence.UNARY,
  [TokenType.DELETE]: Precedence.UNARY,
  [TokenType.AWAIT]: Precedence.UNARY,
  
  // Postfix
  [TokenType.INCREMENT]: Precedence.POSTFIX,
  [TokenType.DECREMENT]: Precedence.POSTFIX,
  
  // Call
  [TokenType.LPAREN]: Precedence.CALL,
  
  // Member
  [TokenType.DOT]: Precedence.MEMBER,
  [TokenType.LBRACKET]: Precedence.MEMBER,
  
  // New
  [TokenType.NEW]: Precedence.NEW,
  
  // Grouping
  [TokenType.LBRACE]: Precedence.GROUPING,
};

export class PrecedenceTable {
  private static instance: PrecedenceTable;
  private table: Map<TokenType, Precedence>;

  private constructor() {
    this.table = new Map();
    this.initialize();
  }

  public static getInstance(): PrecedenceTable {
    if (!PrecedenceTable.instance) {
      PrecedenceTable.instance = new PrecedenceTable();
    }
    return PrecedenceTable.instance;
  }

  private initialize(): void {
    for (const [operator, precedence] of Object.entries(PRECEDENCE_MAP)) {
      this.table.set(operator as TokenType, precedence);
    }
  }

  public get(operator: TokenType): Precedence {
    return this.table.get(operator) || Precedence.ASSIGNMENT;
  }

  public getPrecedence(operator: TokenType): number {
    return this.get(operator);
  }

  public isLeftAssociative(operator: TokenType): boolean {
    // Tous les opérateurs sont left-associative sauf **
    return operator !== TokenType.POWER;
  }

  public isRightAssociative(operator: TokenType): boolean {
    return operator === TokenType.POWER || operator === TokenType.ASSIGN;
  }
}

// Fonction utilitaire pour obtenir la précédence
export function getPrecedence(operator: TokenType): Precedence {
  return PRECEDENCE_MAP[operator] || Precedence.ASSIGNMENT;
}

// Vérifier si un opérateur est left-associative
export function isLeftAssociative(operator: TokenType): boolean {
  return operator !== TokenType.POWER;
}

// Vérifier si un opérateur est right-associative
export function isRightAssociative(operator: TokenType): boolean {
  return operator === TokenType.POWER || operator === TokenType.ASSIGN;
}
