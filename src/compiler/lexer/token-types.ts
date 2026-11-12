/**
 * TokenTypes - Types de tokens pour Zinga
 * 
 * Ce module définit tous les types de tokens reconnus par le lexer.
 */

export enum TokenType {
  // Tokens de base
  EOF = 'EOF',
  UNKNOWN = 'UNKNOWN',

  // Littéraux
  INTEGER = 'INTEGER',
  FLOAT = 'FLOAT',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',

  // Identifiants
  IDENTIFIER = 'IDENTIFIER',

  // Mots-clés
  IF = 'IF',
  ELSE = 'ELSE',
  FOR = 'FOR',
  WHILE = 'WHILE',
  DO = 'DO',
  SWITCH = 'SWITCH',
  CASE = 'CASE',
  DEFAULT = 'DEFAULT',
  BREAK = 'BREAK',
  CONTINUE = 'CONTINUE',
  RETURN = 'RETURN',
  THROW = 'THROW',
  TRY = 'TRY',
  CATCH = 'CATCH',
  FINALLY = 'FINALLY',

  // Déclarations
  VAR = 'VAR',
  LET = 'LET',
  CONST = 'CONST',
  FUNCTION = 'FUNCTION',
  ARROW_FUNCTION = 'ARROW_FUNCTION',
  CLASS = 'CLASS',
  INTERFACE = 'INTERFACE',
  ENUM = 'ENUM',
  TYPE = 'TYPE',

  // Modules
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  FROM = 'FROM',
  AS = 'AS',
  DEFAULT = 'DEFAULT',

  // Types
  NUMBER_TYPE = 'NUMBER_TYPE',
  STRING_TYPE = 'STRING_TYPE',
  BOOLEAN_TYPE = 'BOOLEAN_TYPE',
  NULL_TYPE = 'NULL_TYPE',
  ARRAY_TYPE = 'ARRAY_TYPE',
  OBJECT_TYPE = 'OBJECT_TYPE',
  FUNCTION_TYPE = 'FUNCTION_TYPE',
  ANY_TYPE = 'ANY_TYPE',
  VOID_TYPE = 'VOID_TYPE',

  // Opérateurs arithmétiques
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  MODULO = 'MODULO',
  POWER = 'POWER',

  // Opérateurs d'assignation
  ASSIGN = 'ASSIGN',
  PLUS_ASSIGN = 'PLUS_ASSIGN',
  MINUS_ASSIGN = 'MINUS_ASSIGN',
  MULTIPLY_ASSIGN = 'MULTIPLY_ASSIGN',
  DIVIDE_ASSIGN = 'DIVIDE_ASSIGN',
  MODULO_ASSIGN = 'MODULO_ASSIGN',

  // Opérateurs de comparaison
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  GREATER = 'GREATER',
  LESS = 'LESS',
  GREATER_EQUAL = 'GREATER_EQUAL',
  LESS_EQUAL = 'LESS_EQUAL',

  // Opérateurs logiques
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',

  // Incrémentation/Décrémentation
  INCREMENT = 'INCREMENT',
  DECREMENT = 'DECREMENT',

  // Accès et opérateurs divers
  DOT = 'DOT',
  COMMA = 'COMMA',
  COLON = 'COLON',
  SEMICOLON = 'SEMICOLON',
  QUESTION = 'QUESTION',
  ARROW = 'ARROW',
  SPREAD = 'SPREAD',

  // Parenthèses et accolades
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',

  // Commentaires
  COMMENT = 'COMMENT',
  BLOCK_COMMENT = 'BLOCK_COMMENT',

  // Espaces blancs
  WHITESPACE = 'WHITESPACE',

  // Autres
  NEW = 'NEW',
  THIS = 'THIS',
  SUPER = 'SUPER',
  INSTANCEOF = 'INSTANCEOF',
  DELETE = 'DELETE',
  TYPEOF = 'TYPEOF',
  VOID = 'VOID',

  // Opérateurs binaires
  BITWISE_AND = 'BITWISE_AND',
  BITWISE_OR = 'BITWISE_OR',
  BITWISE_XOR = 'BITWISE_XOR',
  BITWISE_NOT = 'BITWISE_NOT',
  LEFT_SHIFT = 'LEFT_SHIFT',
  RIGHT_SHIFT = 'RIGHT_SHIFT',
  UNSIGNED_RIGHT_SHIFT = 'UNSIGNED_RIGHT_SHIFT',

  // Génériques
  GENERIC = 'GENERIC',
  EXTENDS = 'EXTENDS',
  IMPLEMENTS = 'IMPLEMENTS',
  SUPER_TYPE = 'SUPER_TYPE',

  // Async/Await
  ASYNC = 'ASYNC',
  AWAIT = 'AWAIT',
  PROMISE = 'PROMISE',

  // Décorateurs
  DECORATOR = 'DECORATOR',

  // JSX/TSX (pour la compatibilité)
  JSX_TAG_START = 'JSX_TAG_START',
  JSX_TAG_END = 'JSX_TAG_END',
  JSX_ATTRIBUTE = 'JSX_ATTRIBUTE',
  JSX_TEXT = 'JSX_TEXT',
}

// Map des noms de tokens pour l'affichage
export const TokenTypeNames: Record<TokenType, string> = {
  [TokenType.EOF]: 'EOF',
  [TokenType.UNKNOWN]: 'UNKNOWN',
  [TokenType.INTEGER]: 'INTEGER',
  [TokenType.FLOAT]: 'FLOAT',
  [TokenType.STRING]: 'STRING',
  [TokenType.BOOLEAN]: 'BOOLEAN',
  [TokenType.NULL]: 'NULL',
  [TokenType.IDENTIFIER]: 'IDENTIFIER',
  [TokenType.IF]: 'IF',
  [TokenType.ELSE]: 'ELSE',
  [TokenType.FOR]: 'FOR',
  [TokenType.WHILE]: 'WHILE',
  [TokenType.DO]: 'DO',
  [TokenType.SWITCH]: 'SWITCH',
  [TokenType.CASE]: 'CASE',
  [TokenType.DEFAULT]: 'DEFAULT',
  [TokenType.BREAK]: 'BREAK',
  [TokenType.CONTINUE]: 'CONTINUE',
  [TokenType.RETURN]: 'RETURN',
  [TokenType.THROW]: 'THROW',
  [TokenType.TRY]: 'TRY',
  [TokenType.CATCH]: 'CATCH',
  [TokenType.FINALLY]: 'FINALLY',
  [TokenType.VAR]: 'VAR',
  [TokenType.LET]: 'LET',
  [TokenType.CONST]: 'CONST',
  [TokenType.FUNCTION]: 'FUNCTION',
  [TokenType.ARROW_FUNCTION]: 'ARROW_FUNCTION',
  [TokenType.CLASS]: 'CLASS',
  [TokenType.INTERFACE]: 'INTERFACE',
  [TokenType.ENUM]: 'ENUM',
  [TokenType.TYPE]: 'TYPE',
  [TokenType.IMPORT]: 'IMPORT',
  [TokenType.EXPORT]: 'EXPORT',
  [TokenType.FROM]: 'FROM',
  [TokenType.AS]: 'AS',
  [TokenType.NUMBER_TYPE]: 'NUMBER_TYPE',
  [TokenType.STRING_TYPE]: 'STRING_TYPE',
  [TokenType.BOOLEAN_TYPE]: 'BOOLEAN_TYPE',
  [TokenType.NULL_TYPE]: 'NULL_TYPE',
  [TokenType.ARRAY_TYPE]: 'ARRAY_TYPE',
  [TokenType.OBJECT_TYPE]: 'OBJECT_TYPE',
  [TokenType.FUNCTION_TYPE]: 'FUNCTION_TYPE',
  [TokenType.ANY_TYPE]: 'ANY_TYPE',
  [TokenType.VOID_TYPE]: 'VOID_TYPE',
  [TokenType.PLUS]: 'PLUS',
  [TokenType.MINUS]: 'MINUS',
  [TokenType.MULTIPLY]: 'MULTIPLY',
  [TokenType.DIVIDE]: 'DIVIDE',
  [TokenType.MODULO]: 'MODULO',
  [TokenType.POWER]: 'POWER',
  [TokenType.ASSIGN]: 'ASSIGN',
  [TokenType.PLUS_ASSIGN]: 'PLUS_ASSIGN',
  [TokenType.MINUS_ASSIGN]: 'MINUS_ASSIGN',
  [TokenType.MULTIPLY_ASSIGN]: 'MULTIPLY_ASSIGN',
  [TokenType.DIVIDE_ASSIGN]: 'DIVIDE_ASSIGN',
  [TokenType.MODULO_ASSIGN]: 'MODULO_ASSIGN',
  [TokenType.EQUAL]: 'EQUAL',
  [TokenType.NOT_EQUAL]: 'NOT_EQUAL',
  [TokenType.GREATER]: 'GREATER',
  [TokenType.LESS]: 'LESS',
  [TokenType.GREATER_EQUAL]: 'GREATER_EQUAL',
  [TokenType.LESS_EQUAL]: 'LESS_EQUAL',
  [TokenType.AND]: 'AND',
  [TokenType.OR]: 'OR',
  [TokenType.NOT]: 'NOT',
  [TokenType.INCREMENT]: 'INCREMENT',
  [TokenType.DECREMENT]: 'DECREMENT',
  [TokenType.DOT]: 'DOT',
  [TokenType.COMMA]: 'COMMA',
  [TokenType.COLON]: 'COLON',
  [TokenType.SEMICOLON]: 'SEMICOLON',
  [TokenType.QUESTION]: 'QUESTION',
  [TokenType.ARROW]: 'ARROW',
  [TokenType.SPREAD]: 'SPREAD',
  [TokenType.LPAREN]: 'LPAREN',
  [TokenType.RPAREN]: 'RPAREN',
  [TokenType.LBRACE]: 'LBRACE',
  [TokenType.RBRACE]: 'RBRACE',
  [TokenType.LBRACKET]: 'LBRACKET',
  [TokenType.RBRACKET]: 'RBRACKET',
  [TokenType.COMMENT]: 'COMMENT',
  [TokenType.BLOCK_COMMENT]: 'BLOCK_COMMENT',
  [TokenType.WHITESPACE]: 'WHITESPACE',
  [TokenType.NEW]: 'NEW',
  [TokenType.THIS]: 'THIS',
  [TokenType.SUPER]: 'SUPER',
  [TokenType.INSTANCEOF]: 'INSTANCEOF',
  [TokenType.DELETE]: 'DELETE',
  [TokenType.TYPEOF]: 'TYPEOF',
  [TokenType.VOID]: 'VOID',
  [TokenType.BITWISE_AND]: 'BITWISE_AND',
  [TokenType.BITWISE_OR]: 'BITWISE_OR',
  [TokenType.BITWISE_XOR]: 'BITWISE_XOR',
  [TokenType.BITWISE_NOT]: 'BITWISE_NOT',
  [TokenType.LEFT_SHIFT]: 'LEFT_SHIFT',
  [TokenType.RIGHT_SHIFT]: 'RIGHT_SHIFT',
  [TokenType.UNSIGNED_RIGHT_SHIFT]: 'UNSIGNED_RIGHT_SHIFT',
  [TokenType.GENERIC]: 'GENERIC',
  [TokenType.EXTENDS]: 'EXTENDS',
  [TokenType.IMPLEMENTS]: 'IMPLEMENTS',
  [TokenType.SUPER_TYPE]: 'SUPER_TYPE',
  [TokenType.ASYNC]: 'ASYNC',
  [TokenType.AWAIT]: 'AWAIT',
  [TokenType.PROMISE]: 'PROMISE',
  [TokenType.DECORATOR]: 'DECORATOR',
  [TokenType.JSX_TAG_START]: 'JSX_TAG_START',
  [TokenType.JSX_TAG_END]: 'JSX_TAG_END',
  [TokenType.JSX_ATTRIBUTE]: 'JSX_ATTRIBUTE',
  [TokenType.JSX_TEXT]: 'JSX_TEXT',
};

// Fonctions utilitaires
export function isTokenType(value: string): value is TokenType {
  return Object.values(TokenType).includes(value as TokenType);
}

export function getTokenTypeName(type: TokenType): string {
  return TokenTypeNames[type] || 'UNKNOWN';
}
