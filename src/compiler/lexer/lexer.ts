/**
 * Lexer - Analyseur lexical de Zinga
 * 
 * Ce module est responsable de la tokenization du code source.
 * Il convertit le texte source en une séquence de tokens.
 */

import { Token } from './tokens';
import { TokenType, TokenType as TokenTypes } from './token-types';
import { Scanner } from './scanner';
import { Position, SourceLocation } from './positions';
import { Config } from '../config';

export interface LexerOptions {
  config?: Config;
  ignoreWhitespace?: boolean;
  ignoreComments?: boolean;
}

export class Lexer {
  private scanner: Scanner;
  private config: Config;
  private ignoreWhitespace: boolean;
  private ignoreComments: boolean;
  private currentToken: Token | null = null;
  private lookahead: Token[] = [];

  constructor(options: LexerOptions = {}) {
    this.config = options.config || new Config();
    this.ignoreWhitespace = options.ignoreWhitespace ?? true;
    this.ignoreComments = options.ignoreComments ?? true;
    this.scanner = new Scanner(this.config);
  }

  /**
   * Tokenizer le code source
   */
  public tokenize(source: string, filename?: string): Token[] {
    this.scanner.setSource(source, filename);
    this.currentToken = null;
    this.lookahead = [];

    const tokens: Token[] = [];

    while (this.scanner.hasNext()) {
      const token = this.nextToken();
      if (token) {
        if (!this.ignoreWhitespace || token.type !== TokenTypes.WHITESPACE) {
          if (!this.ignoreComments || !this.isComment(token)) {
            tokens.push(token);
          }
        }
      }
    }

    // Ajouter le token EOF
    const eofPosition = this.scanner.getPosition();
    tokens.push(new Token(
      TokenTypes.EOF,
      '',
      new SourceLocation(filename || '<unknown>', eofPosition, eofPosition)
    ));

    return tokens;
  }

  /**
   * Obtenir le prochain token
   */
  private nextToken(): Token | null {
    const char = this.scanner.peek();

    if (char === null) {
      return null;
    }

    // Espaces blancs
    if (this.isWhitespace(char)) {
      return this.readWhitespace();
    }

    // Commentaires
    if (this.isCommentStart(char)) {
      return this.readComment();
    }

    // Nombres
    if (this.isDigit(char)) {
      return this.readNumber();
    }

    // Identifiants et mots-clés
    if (this.isIdentifierStart(char)) {
      return this.readIdentifier();
    }

    // Chaînes de caractères
    if (char === '"' || char === "'" || char === '`') {
      return this.readString(char);
    }

    // Opérateurs et ponctuation
    return this.readOperator();
  }

  /**
   * Lire un espace blanc
   */
  private readWhitespace(): Token {
    const start = this.scanner.getPosition();
    let value = '';

    while (this.scanner.hasNext() && this.isWhitespace(this.scanner.peek()!)) {
      value += this.scanner.next()!;
    }

    const end = this.scanner.getPosition();
    return new Token(
      TokenTypes.WHITESPACE,
      value,
      new SourceLocation(this.scanner.getFilename(), start, end)
    );
  }

  /**
   * Lire un commentaire
   */
  private readComment(): Token {
    const start = this.scanner.getPosition();
    const firstChar = this.scanner.next()!;
    let value = firstChar;

    if (firstChar === '/' && this.scanner.peek() === '/') {
      // Commentaire sur une ligne
      value += this.scanner.next()!;
      while (this.scanner.hasNext() && this.scanner.peek() !== '\n') {
        value += this.scanner.next()!;
      }
    } else if (firstChar === '/' && this.scanner.peek() === '*') {
      // Commentaire multi-lignes
      value += this.scanner.next()!;
      while (this.scanner.hasNext()) {
        const char = this.scanner.next()!;
        value += char;
        if (char === '*' && this.scanner.peek() === '/') {
          value += this.scanner.next()!;
          break;
        }
      }
    } else {
      // Ce n'est pas un commentaire, retourner le caractère
      return new Token(
        TokenTypes.UNKNOWN,
        value,
        new SourceLocation(this.scanner.getFilename(), start, this.scanner.getPosition())
      );
    }

    const end = this.scanner.getPosition();
    return new Token(
      TokenTypes.COMMENT,
      value,
      new SourceLocation(this.scanner.getFilename(), start, end)
    );
  }

  /**
   * Lire un nombre
   */
  private readNumber(): Token {
    const start = this.scanner.getPosition();
    let value = '';
    let isFloat = false;

    // Lire la partie entière
    while (this.scanner.hasNext() && this.isDigit(this.scanner.peek()!)) {
      value += this.scanner.next()!;
    }

    // Lire la partie décimale
    if (this.scanner.peek() === '.') {
      value += this.scanner.next()!;
      isFloat = true;
      while (this.scanner.hasNext() && this.isDigit(this.scanner.peek()!)) {
        value += this.scanner.next()!;
      }
    }

    // Lire l'exposant
    if (this.scanner.peek()?.toLowerCase() === 'e') {
      value += this.scanner.next()!;
      if (this.scanner.peek() === '+' || this.scanner.peek() === '-') {
        value += this.scanner.next()!;
      }
      while (this.scanner.hasNext() && this.isDigit(this.scanner.peek()!)) {
        value += this.scanner.next()!;
      }
      isFloat = true;
    }

    const end = this.scanner.getPosition();
    return new Token(
      isFloat ? TokenTypes.FLOAT : TokenTypes.INTEGER,
      value,
      new SourceLocation(this.scanner.getFilename(), start, end)
    );
  }

  /**
   * Lire un identifiant ou un mot-clé
   */
  private readIdentifier(): Token {
    const start = this.scanner.getPosition();
    let value = '';

    while (this.scanner.hasNext() && this.isIdentifierChar(this.scanner.peek()!)) {
      value += this.scanner.next()!;
    }

    const end = this.scanner.getPosition();
    const type = this.getKeywordType(value);

    return new Token(
      type,
      value,
      new SourceLocation(this.scanner.getFilename(), start, end)
    );
  }

  /**
   * Lire une chaîne de caractères
   */
  private readString(quote: string): Token {
    const start = this.scanner.getPosition();
    let value = this.scanner.next()!; // Consommer la guillemet d'ouverture

    while (this.scanner.hasNext()) {
      const char = this.scanner.next()!;
      
      if (char === quote) {
        value += char;
        break;
      }

      if (char === '\\') {
        // Échappement
        const next = this.scanner.peek();
        if (next) {
          value += char + this.scanner.next()!;
        }
      } else {
        value += char;
      }
    }

    const end = this.scanner.getPosition();
    return new Token(
      TokenTypes.STRING,
      value,
      new SourceLocation(this.scanner.getFilename(), start, end)
    );
  }

  /**
   * Lire un opérateur ou un caractère de ponctuation
   */
  private readOperator(): Token {
    const start = this.scanner.getPosition();
    const char = this.scanner.next()!;

    // Vérifier les opérateurs multi-caractères
    let value = char;
    let type = this.getOperatorType(value);

    if (type === TokenTypes.UNKNOWN && this.scanner.hasNext()) {
      const nextChar = this.scanner.peek()!;
      const combined = value + nextChar;
      const combinedType = this.getOperatorType(combined);

      if (combinedType !== TokenTypes.UNKNOWN) {
        value = combined;
        type = combinedType;
        this.scanner.next(); // Consommer le deuxième caractère
      }
    }

    const end = this.scanner.getPosition();
    return new Token(
      type,
      value,
      new SourceLocation(this.scanner.getFilename(), start, end)
    );
  }

  /**
   * Vérifier si un caractère est un espace blanc
   */
  private isWhitespace(char: string): boolean {
    return /\s/.test(char);
  }

  /**
   * Vérifier si un caractère est un chiffre
   */
  private isDigit(char: string): boolean {
    return /\d/.test(char);
  }

  /**
   * Vérifier si un caractère peut commencer un identifiant
   */
  private isIdentifierStart(char: string): boolean {
    return /[a-zA-Z_]/.test(char) || this.isUnicodeLetter(char);
  }

  /**
   * Vérifier si un caractère peut faire partie d'un identifiant
   */
  private isIdentifierChar(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char) || this.isUnicodeLetter(char) || this.isUnicodeDigit(char);
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
   * Vérifier si un caractère commence un commentaire
   */
  private isCommentStart(char: string): boolean {
    return char === '/' && (this.scanner.peek(1) === '/' || this.scanner.peek(1) === '*');
  }

  /**
   * Vérifier si un token est un commentaire
   */
  private isComment(token: Token): boolean {
    return token.type === TokenTypes.COMMENT || token.type === TokenTypes.BLOCK_COMMENT;
  }

  /**
   * Obtenir le type de token pour un mot-clé
   */
  private getKeywordType(value: string): TokenType {
    const keywords: Record<string, TokenType> = {
      // Mots-clés français
      'si': TokenTypes.IF,
      'sinon': TokenTypes.ELSE,
      'pour': TokenTypes.FOR,
      'tantque': TokenTypes.WHILE,
      'fonction': TokenTypes.FUNCTION,
      'retourner': TokenTypes.RETURN,
      'var': TokenTypes.VAR,
      'const': TokenTypes.CONST,
      'classe': TokenTypes.CLASS,
      'interface': TokenTypes.INTERFACE,
      'importer': TokenTypes.IMPORT,
      'exporter': TokenTypes.EXPORT,
      'vrai': TokenTypes.BOOLEAN,
      'faux': TokenTypes.BOOLEAN,
      'nul': TokenTypes.NULL,
      'et': TokenTypes.AND,
      'ou': TokenTypes.OR,
      'non': TokenTypes.NOT,
      
      // Mots-clés anglais
      'if': TokenTypes.IF,
      'else': TokenTypes.ELSE,
      'for': TokenTypes.FOR,
      'while': TokenTypes.WHILE,
      'function': TokenTypes.FUNCTION,
      'return': TokenTypes.RETURN,
      'let': TokenTypes.VAR,
      'const': TokenTypes.CONST,
      'class': TokenTypes.CLASS,
      'interface': TokenTypes.INTERFACE,
      'import': TokenTypes.IMPORT,
      'export': TokenTypes.EXPORT,
      'true': TokenTypes.BOOLEAN,
      'false': TokenTypes.BOOLEAN,
      'null': TokenTypes.NULL,
      'and': TokenTypes.AND,
      'or': TokenTypes.OR,
      'not': TokenTypes.NOT,
      
      // Types
      'nombre': TokenTypes.NUMBER_TYPE,
      'texte': TokenTypes.STRING_TYPE,
      'booléen': TokenTypes.BOOLEAN_TYPE,
      'nul': TokenTypes.NULL_TYPE,
      'tableau': TokenTypes.ARRAY_TYPE,
      'objet': TokenTypes.OBJECT_TYPE,
      'fonction': TokenTypes.FUNCTION_TYPE,
    };

    return keywords[value.toLowerCase()] || TokenTypes.IDENTIFIER;
  }

  /**
   * Obtenir le type de token pour un opérateur
   */
  private getOperatorType(value: string): TokenType {
    const operators: Record<string, TokenType> = {
      '+': TokenTypes.PLUS,
      '-': TokenTypes.MINUS,
      '*': TokenTypes.MULTIPLY,
      '/': TokenTypes.DIVIDE,
      '%': TokenTypes.MODULO,
      '^': TokenTypes.POWER,
      '=': TokenTypes.ASSIGN,
      '==': TokenTypes.EQUAL,
      '!=': TokenTypes.NOT_EQUAL,
      '>': TokenTypes.GREATER,
      '<': TokenTypes.LESS,
      '>=': TokenTypes.GREATER_EQUAL,
      '<=': TokenTypes.LESS_EQUAL,
      '&&': TokenTypes.AND,
      '||': TokenTypes.OR,
      '!': TokenTypes.NOT,
      '++': TokenTypes.INCREMENT,
      '--': TokenTypes.DECREMENT,
      '+=': TokenTypes.PLUS_ASSIGN,
      '-=': TokenTypes.MINUS_ASSIGN,
      '*=': TokenTypes.MULTIPLY_ASSIGN,
      '/=': TokenTypes.DIVIDE_ASSIGN,
      '%=': TokenTypes.MODULO_ASSIGN,
      '=>': TokenTypes.ARROW,
      '.': TokenTypes.DOT,
      ',': TokenTypes.COMMA,
      ':': TokenTypes.COLON,
      ';': TokenTypes.SEMICOLON,
      '(': TokenTypes.LPAREN,
      ')': TokenTypes.RPAREN,
      '{': TokenTypes.LBRACE,
      '}': TokenTypes.RBRACE,
      '[': TokenTypes.LBRACKET,
      ']': TokenTypes.RBRACKET,
      '?': TokenTypes.QUESTION,
      '...': TokenTypes.SPREAD,
    };

    return operators[value] || TokenTypes.UNKNOWN;
  }

  /**
   * Configurer le lexer
   */
  public configure(config: Config): void {
    this.config = config;
    this.scanner.configure(config);
    this.ignoreWhitespace = config.getValue('lexer')?.ignoreWhitespace ?? true;
    this.ignoreComments = config.getValue('lexer')?.ignoreComments ?? true;
  }

  /**
   * Réinitialiser le lexer
   */
  public reset(): void {
    this.currentToken = null;
    this.lookahead = [];
    this.scanner.reset();
  }
}
