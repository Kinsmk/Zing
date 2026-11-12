/**
 * Tokens - Définition des tokens pour Zinga
 * 
 * Ce module définit la structure des tokens utilisés par le lexer.
 */

import { TokenType } from './token-types';
import { SourceLocation } from './positions';

export interface Token {
  type: TokenType;
  value: string;
  location: SourceLocation;
  
  // Métadonnées optionnelles
  line?: number;
  column?: number;
  start?: number;
  end?: number;
}

export class TokenImpl implements Token {
  constructor(
    public readonly type: TokenType,
    public readonly value: string,
    public readonly location: SourceLocation,
    public readonly line?: number,
    public readonly column?: number,
    public readonly start?: number,
    public readonly end?: number
  ) {}

  public toString(): string {
    return `Token(${TokenType[this.type]}, "${this.value}", ${this.location})`;
  }

  public is(type: TokenType): boolean {
    return this.type === type;
  }

  public isOneOf(...types: TokenType[]): boolean {
    return types.includes(this.type);
  }
}

// Alias pour la compatibilité
export { TokenImpl as Token };

/**
 * Créer un token
 */
export function createToken(
  type: TokenType,
  value: string,
  location: SourceLocation,
  line?: number,
  column?: number,
  start?: number,
  end?: number
): Token {
  return new TokenImpl(type, value, location, line, column, start, end);
}

/**
 * Vérifier si un token est de type littéral
 */
export function isLiteralToken(token: Token): boolean {
  return [
    TokenType.INTEGER,
    TokenType.FLOAT,
    TokenType.STRING,
    TokenType.BOOLEAN,
    TokenType.NULL,
  ].includes(token.type);
}

/**
 * Vérifier si un token est de type identifiant
 */
export function isIdentifierToken(token: Token): boolean {
  return token.type === TokenType.IDENTIFIER;
}

/**
 * Vérifier si un token est de type opérateur
 */
export function isOperatorToken(token: Token): boolean {
  const operatorTypes: TokenType[] = [
    TokenType.PLUS, TokenType.MINUS, TokenType.MULTIPLY, TokenType.DIVIDE,
    TokenType.MODULO, TokenType.POWER, TokenType.ASSIGN, TokenType.EQUAL,
    TokenType.NOT_EQUAL, TokenType.GREATER, TokenType.LESS, TokenType.GREATER_EQUAL,
    TokenType.LESS_EQUAL, TokenType.AND, TokenType.OR, TokenType.NOT,
    TokenType.INCREMENT, TokenType.DECREMENT, TokenType.PLUS_ASSIGN,
    TokenType.MINUS_ASSIGN, TokenType.MULTIPLY_ASSIGN, TokenType.DIVIDE_ASSIGN,
    TokenType.MODULO_ASSIGN, TokenType.ARROW, TokenType.DOT, TokenType.SPREAD,
  ];
  return operatorTypes.includes(token.type);
}

/**
 * Vérifier si un token est de type ponctuation
 */
export function isPunctuationToken(token: Token): boolean {
  const punctuationTypes: TokenType[] = [
    TokenType.COMMA, TokenType.COLON, TokenType.SEMICOLON,
    TokenType.LPAREN, TokenType.RPAREN, TokenType.LBRACE, TokenType.RBRACE,
    TokenType.LBRACKET, TokenType.RBRACKET, TokenType.QUESTION,
  ];
  return punctuationTypes.includes(token.type);
}

/**
 * Vérifier si un token est de type mot-clé
 */
export function isKeywordToken(token: Token): boolean {
  const keywordTypes: TokenType[] = [
    TokenType.IF, TokenType.ELSE, TokenType.FOR, TokenType.WHILE,
    TokenType.FUNCTION, TokenType.RETURN, TokenType.VAR, TokenType.CONST,
    TokenType.CLASS, TokenType.INTERFACE, TokenType.IMPORT, TokenType.EXPORT,
    TokenType.NEW, TokenType.THIS, TokenType.SUPER, TokenType.THROW,
    TokenType.TRY, TokenType.CATCH, TokenType.FINALLY, TokenType.BREAK,
    TokenType.CONTINUE, TokenType.SWITCH, TokenType.CASE, TokenType.DEFAULT,
  ];
  return keywordTypes.includes(token.type);
}

/**
 * Vérifier si un token est de type type
 */
export function isTypeToken(token: Token): boolean {
  const typeTypes: TokenType[] = [
    TokenType.NUMBER_TYPE, TokenType.STRING_TYPE, TokenType.BOOLEAN_TYPE,
    TokenType.NULL_TYPE, TokenType.ARRAY_TYPE, TokenType.OBJECT_TYPE,
    TokenType.FUNCTION_TYPE, TokenType.ANY_TYPE, TokenType.VOID_TYPE,
  ];
  return typeTypes.includes(token.type);
}
