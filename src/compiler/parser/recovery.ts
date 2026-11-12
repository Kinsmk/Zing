/**
 * Recovery - Récupération après erreurs pour Zinga
 * 
 * Ce module fournit des mécanismes pour récupérer après des erreurs
 * de syntaxe pendant l'analyse.
 */

import { Token, TokenType } from '../lexer/tokens';
import { TokenTypes } from '../lexer/token-types';
import { Parser } from './parser';

export interface RecoveryStrategy {
  canRecover(token: Token): boolean;
  recover(parser: Parser): void;
}

/**
 * Stratégie de récupération pour les statements
 */
export class StatementRecoveryStrategy implements RecoveryStrategy {
  canRecover(token: Token): boolean {
    // Peut récupérer au début d'un nouveau statement
    const statementStarts: TokenType[] = [
      TokenTypes.VAR, TokenTypes.LET, TokenTypes.CONST,
      TokenTypes.FUNCTION, TokenTypes.CLASS, TokenTypes.INTERFACE,
      TokenTypes.ENUM, TokenTypes.TYPE, TokenTypes.IMPORT, TokenTypes.EXPORT,
      TokenTypes.IF, TokenTypes.WHILE, TokenTypes.DO, TokenTypes.FOR,
      TokenTypes.SWITCH, TokenTypes.BREAK, TokenTypes.CONTINUE,
      TokenTypes.RETURN, TokenTypes.THROW, TokenTypes.TRY, TokenTypes.WITH,
      TokenTypes.LBRACE, TokenTypes.SEMICOLON,
      TokenTypes.IDENTIFIER, // Pour les expressions
    ];
    return statementStarts.includes(token.type);
  }

  recover(parser: Parser): void {
    // Sauter jusqu'au prochain statement
    while (!parser.isAtEnd()) {
      const token = parser.peek();
      if (this.canRecover(token!)) {
        break;
      }
      parser.advance();
    }
  }
}

/**
 * Stratégie de récupération pour les expressions
 */
export class ExpressionRecoveryStrategy implements RecoveryStrategy {
  canRecover(token: Token): boolean {
    // Peut récupérer à la fin d'une expression
    const expressionEnds: TokenType[] = [
      TokenTypes.RPAREN, TokenTypes.RBRACE, TokenTypes.RBRACKET,
      TokenTypes.SEMICOLON, TokenTypes.COMMA, TokenTypes.COLON,
      TokenTypes.QUESTION, TokenTypes.ARROW,
    ];
    return expressionEnds.includes(token.type);
  }

  recover(parser: Parser): void {
    // Sauter jusqu'à la fin de l'expression
    while (!parser.isAtEnd()) {
      const token = parser.peek();
      if (this.canRecover(token!)) {
        break;
      }
      parser.advance();
    }
  }
}

/**
 * Stratégie de récupération pour les blocs
 */
export class BlockRecoveryStrategy implements RecoveryStrategy {
  canRecover(token: Token): boolean {
    return token.type === TokenTypes.RBRACE;
  }

  recover(parser: Parser): void {
    // Sauter jusqu'à la fin du bloc
    let depth = 0;
    while (!parser.isAtEnd()) {
      const token = parser.peek();
      if (!token) break;
      
      if (token.type === TokenTypes.LBRACE) {
        depth++;
      } else if (token.type === TokenTypes.RBRACE) {
        if (depth === 0) {
          break;
        }
        depth--;
      }
      parser.advance();
    }
  }
}

/**
 * Stratégie de récupération pour les parenthèses
 */
export class ParenthesisRecoveryStrategy implements RecoveryStrategy {
  canRecover(token: Token): boolean {
    return token.type === TokenTypes.RPAREN;
  }

  recover(parser: Parser): void {
    // Sauter jusqu'à la parenthèse fermante
    let depth = 0;
    while (!parser.isAtEnd()) {
      const token = parser.peek();
      if (!token) break;
      
      if (token.type === TokenTypes.LPAREN) {
        depth++;
      } else if (token.type === TokenTypes.RPAREN) {
        if (depth === 0) {
          break;
        }
        depth--;
      }
      parser.advance();
    }
  }
}

/**
 * Gestionnaire de récupération
 */
export class RecoveryManager {
  private strategies: Map<TokenType, RecoveryStrategy[]>;

  constructor() {
    this.strategies = new Map();
    this.initialize();
  }

  private initialize(): void {
    // Initialiser les stratégies par défaut
    const statementStrategy = new StatementRecoveryStrategy();
    const expressionStrategy = new ExpressionRecoveryStrategy();
    const blockStrategy = new BlockRecoveryStrategy();
    const parenStrategy = new ParenthesisRecoveryStrategy();

    // Stratégies pour les tokens de début
    const startTokens: TokenType[] = [
      TokenTypes.VAR, TokenTypes.LET, TokenTypes.CONST,
      TokenTypes.FUNCTION, TokenTypes.CLASS, TokenTypes.INTERFACE,
      TokenTypes.ENUM, TokenTypes.TYPE, TokenTypes.IMPORT, TokenTypes.EXPORT,
      TokenTypes.IF, TokenTypes.WHILE, TokenTypes.DO, TokenTypes.FOR,
      TokenTypes.SWITCH, TokenTypes.BREAK, TokenTypes.CONTINUE,
      TokenTypes.RETURN, TokenTypes.THROW, TokenTypes.TRY, TokenTypes.WITH,
      TokenTypes.LBRACE, TokenTypes.IDENTIFIER,
    ];

    for (const token of startTokens) {
      this.addStrategy(token, statementStrategy);
    }

    // Stratégies pour les tokens de fin d'expression
    const endTokens: TokenType[] = [
      TokenTypes.RPAREN, TokenTypes.RBRACE, TokenTypes.RBRACKET,
      TokenTypes.SEMICOLON, TokenTypes.COMMA, TokenTypes.COLON,
    ];

    for (const token of endTokens) {
      this.addStrategy(token, expressionStrategy);
    }

    // Stratégies spécifiques
    this.addStrategy(TokenTypes.LBRACE, blockStrategy);
    this.addStrategy(TokenTypes.LPAREN, parenStrategy);
  }

  public addStrategy(tokenType: TokenType, strategy: RecoveryStrategy): void {
    if (!this.strategies.has(tokenType)) {
      this.strategies.set(tokenType, []);
    }
    this.strategies.get(tokenType)!.push(strategy);
  }

  public getStrategies(tokenType: TokenType): RecoveryStrategy[] {
    return this.strategies.get(tokenType) || [];
  }

  public recover(parser: Parser, expected: TokenType[]): void {
    const token = parser.peek();
    if (!token) return;

    // Trouver la meilleure stratégie
    for (const strategy of this.getStrategies(token.type)) {
      if (strategy.canRecover(token)) {
        strategy.recover(parser);
        return;
      }
    }

    // Stratégie par défaut: sauter jusqu'au prochain statement
    const defaultStrategy = new StatementRecoveryStrategy();
    defaultStrategy.recover(parser);
  }
}

/**
 * Contexte de récupération
 */
export class RecoveryContext {
  private parser: Parser;
  private manager: RecoveryManager;
  private errorCount: number = 0;
  private maxErrors: number;

  constructor(parser: Parser, maxErrors: number = 10) {
    this.parser = parser;
    this.manager = new RecoveryManager();
    this.maxErrors = maxErrors;
  }

  public tryRecover(expected: TokenType[]): boolean {
    if (this.errorCount >= this.maxErrors) {
      return false;
    }

    const token = this.parser.peek();
    if (!token) {
      return false;
    }

    // Si le token correspond à l'un des attendus, pas besoin de récupérer
    for (const expectedType of expected) {
      if (token.type === expectedType) {
        return true;
      }
    }

    // Essayer de récupérer
    this.manager.recover(this.parser, expected);
    this.errorCount++;
    
    return false;
  }

  public reset(): void {
    this.errorCount = 0;
  }

  public getErrorCount(): number {
    return this.errorCount;
  }
}
