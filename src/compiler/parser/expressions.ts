/**
 * Expressions - Analyseur d'expressions pour Zinga
 * 
 * Ce module gère l'analyse de toutes les expressions du langage,
 * y compris les opérateurs, les appels de fonctions, les littéraux, etc.
 */

import { Token } from '../lexer/tokens';
import { TokenType, TokenType as TokenTypes } from '../lexer/token-types';
import { ASTNode, Expression, BinaryExpression, UnaryExpression, Literal, Identifier, CallExpression, MemberExpression, ArrayExpression, ObjectExpression, FunctionExpression, ArrowFunctionExpression, ConditionalExpression, NewExpression, ThisExpression, SuperExpression, TemplateLiteral, TaggedTemplateExpression, SpreadElement, AwaitExpression, YieldExpression } from '../ast/nodes';
import { Parser } from './parser';
import { DiagnosticCollector } from '../diagnostics/errors';
import { Precedence } from './precedence';

export class Expressions {
  private parser: Parser;
  private diagnostics: DiagnosticCollector;

  constructor(parser: Parser, diagnostics: DiagnosticCollector) {
    this.parser = parser;
    this.diagnostics = diagnostics;
  }

  /**
   * Analyser une expression
   */
  public parseExpression(): Expression {
    return this.parseAssignment();
  }

  /**
   * Analyser une expression d'assignation
   */
  private parseAssignment(): Expression {
    const expr = this.parseConditional();
    
    const token = this.parser.peek();
    if (token && this.isAssignmentOperator(token.type)) {
      this.parser.advance();
      const right = this.parseAssignment();
      return new BinaryExpression(token.type as TokenType, expr, right, token.location);
    }
    
    return expr;
  }

  /**
   * Analyser une expression conditionnelle (ternaire)
   */
  private parseConditional(): Expression {
    const expr = this.parseLogicalOr();
    
    const token = this.parser.peek();
    if (token?.type === TokenTypes.QUESTION) {
      this.parser.advance(); // Consommer '?'
      const consequent = this.parseExpression();
      this.parser.expect(TokenTypes.COLON, 'Expected : after ?');
      const alternate = this.parseExpression();
      return new ConditionalExpression(expr, consequent, alternate, token.location);
    }
    
    return expr;
  }

  /**
   * Analyser une expression logique OR
   */
  private parseLogicalOr(): Expression {
    return this.parseBinaryExpression(
      this.parseLogicalAnd.bind(this),
      [TokenTypes.OR],
      Precedence.LOGICAL_OR
    );
  }

  /**
   * Analyser une expression logique AND
   */
  private parseLogicalAnd(): Expression {
    return this.parseBinaryExpression(
      this.parseBitwiseOr.bind(this),
      [TokenTypes.AND],
      Precedence.LOGICAL_AND
    );
  }

  /**
   * Analyser une expression binaire OR
   */
  private parseBitwiseOr(): Expression {
    return this.parseBinaryExpression(
      this.parseBitwiseXor.bind(this),
      [TokenTypes.BITWISE_OR],
      Precedence.BITWISE_OR
    );
  }

  /**
   * Analyser une expression binaire XOR
   */
  private parseBitwiseXor(): Expression {
    return this.parseBinaryExpression(
      this.parseBitwiseAnd.bind(this),
      [TokenTypes.BITWISE_XOR],
      Precedence.BITWISE_XOR
    );
  }

  /**
   * Analyser une expression binaire AND
   */
  private parseBitwiseAnd(): Expression {
    return this.parseBinaryExpression(
      this.parseEquality.bind(this),
      [TokenTypes.BITWISE_AND],
      Precedence.BITWISE_AND
    );
  }

  /**
   * Analyser une expression d'égalité
   */
  private parseEquality(): Expression {
    return this.parseBinaryExpression(
      this.parseRelational.bind(this),
      [TokenTypes.EQUAL, TokenTypes.NOT_EQUAL],
      Precedence.EQUALITY
    );
  }

  /**
   * Analyser une expression relationnelle
   */
  private parseRelational(): Expression {
    return this.parseBinaryExpression(
      this.parseShift.bind(this),
      [TokenTypes.GREATER, TokenTypes.LESS, TokenTypes.GREATER_EQUAL, TokenTypes.LESS_EQUAL],
      Precedence.RELATIONAL
    );
  }

  /**
   * Analyser une expression de décalage
   */
  private parseShift(): Expression {
    return this.parseBinaryExpression(
      this.parseAdditive.bind(this),
      [TokenTypes.LEFT_SHIFT, TokenTypes.RIGHT_SHIFT, TokenTypes.UNSIGNED_RIGHT_SHIFT],
      Precedence.SHIFT
    );
  }

  /**
   * Analyser une expression additive
   */
  private parseAdditive(): Expression {
    return this.parseBinaryExpression(
      this.parseMultiplicative.bind(this),
      [TokenTypes.PLUS, TokenTypes.MINUS],
      Precedence.ADDITIVE
    );
  }

  /**
   * Analyser une expression multiplicative
   */
  private parseMultiplicative(): Expression {
    return this.parseBinaryExpression(
      this.parseExponentiation.bind(this),
      [TokenTypes.MULTIPLY, TokenTypes.DIVIDE, TokenTypes.MODULO],
      Precedence.MULTIPLICATIVE
    );
  }

  /**
   * Analyser une expression d'exponentiation
   */
  private parseExponentiation(): Expression {
    return this.parseBinaryExpression(
      this.parseUnary.bind(this),
      [TokenTypes.POWER],
      Precedence.EXPONENTIATION,
      true // Right associative
    );
  }

  /**
   * Analyser une expression unaire
   */
  private parseUnary(): Expression {
    const token = this.parser.peek();
    
    if (!token) {
      return this.parsePostfix();
    }
    
    // Opérateurs unaires
    if (this.isUnaryOperator(token.type)) {
      this.parser.advance();
      const operand = this.parseUnary();
      return new UnaryExpression(token.type as TokenType, operand, token.location);
    }
    
    return this.parsePostfix();
  }

  /**
   * Analyser une expression postfixe
   */
  private parsePostfix(): Expression {
    let expr = this.parsePrimary();
    
    while (true) {
      const token = this.parser.peek();
      if (!token) break;
      
      // Appel de fonction ou accès membre
      if (token.type === TokenTypes.LPAREN) {
        expr = this.parseCallExpression(expr);
      } else if (token.type === TokenTypes.LBRACKET) {
        expr = this.parseMemberExpression(expr, true);
      } else if (token.type === TokenTypes.DOT) {
        expr = this.parseMemberExpression(expr, false);
      } else if (token.type === TokenTypes.INCREMENT || token.type === TokenTypes.DECREMENT) {
        this.parser.advance();
        expr = new UnaryExpression(token.type as TokenType, expr, token.location, true);
      } else if (token.type === TokenTypes.TEMPLATE) {
        expr = this.parseTaggedTemplate(expr);
      } else {
        break;
      }
    }
    
    return expr;
  }

  /**
   * Analyser une expression primaire
   */
  private parsePrimary(): Expression {
    const token = this.parser.peek();
    
    if (!token) {
      throw new Error('Unexpected end of input');
    }
    
    switch (token.type) {
      case TokenTypes.IDENTIFIER:
        return this.parseIdentifier();
      
      case TokenTypes.INTEGER:
      case TokenTypes.FLOAT:
      case TokenTypes.STRING:
      case TokenTypes.BOOLEAN:
      case TokenTypes.NULL:
        return this.parseLiteral();
      
      case TokenTypes.LPAREN:
        return this.parseGrouping();
      
      case TokenTypes.LBRACKET:
        return this.parseArrayLiteral();
      
      case TokenTypes.LBRACE:
        return this.parseObjectLiteral();
      
      case TokenTypes.FUNCTION:
        return this.parseFunctionExpression();
      
      case TokenTypes.NEW:
        return this.parseNewExpression();
      
      case TokenTypes.THIS:
        this.parser.advance();
        return new ThisExpression(token.location);
      
      case TokenTypes.SUPER:
        this.parser.advance();
        return new SuperExpression(token.location);
      
      case TokenTypes.ASYNC:
        return this.parseAsyncExpression();
      
      case TokenTypes.AWAIT:
        this.parser.advance();
        const operand = this.parseUnary();
        return new AwaitExpression(operand, token.location);
      
      case TokenTypes.YIELD:
        this.parser.advance();
        const yieldOperand = this.parser.match(TokenTypes.MULTIPLY) ? 
          this.parseExpression() : 
          (this.parser.match(TokenTypes.SEMICOLON) ? undefined : this.parseExpression());
        return new YieldExpression(yieldOperand, token.location);
      
      case TokenTypes.SPREAD:
        this.parser.advance();
        const spreadOperand = this.parseExpression();
        return new SpreadElement(spreadOperand, token.location);
      
      case TokenTypes.TEMPLATE:
        return this.parseTemplateLiteral();
      
      default:
        throw new Error(`Unexpected token: ${TokenType[token.type] || token.type}`);
    }
  }

  /**
   * Analyser un identifiant
   */
  protected parseIdentifier(): Identifier {
    const token = this.parser.expectIdentifier();
    return new Identifier(token.value, token.location);
  }

  /**
   * Analyser un littéral
   */
  private parseLiteral(): Literal {
    const token = this.parser.advance()!;
    
    let value: any;
    switch (token.type) {
      case TokenTypes.INTEGER:
        value = parseInt(token.value, 10);
        break;
      case TokenTypes.FLOAT:
        value = parseFloat(token.value);
        break;
      case TokenTypes.STRING:
        // Enlever les guillemets
        value = token.value.slice(1, -1);
        break;
      case TokenTypes.BOOLEAN:
        value = token.value === 'true' || token.value === 'vrai';
        break;
      case TokenTypes.NULL:
        value = null;
        break;
      default:
        value = token.value;
    }
    
    return new Literal(value, token.type as TokenType, token.location);
  }

  /**
   * Analyser une expression entre parenthèses
   */
  private parseGrouping(): Expression {
    this.parser.expect(TokenTypes.LPAREN);
    const expr = this.parseExpression();
    this.parser.expect(TokenTypes.RPAREN, 'Expected )');
    return expr;
  }

  /**
   * Analyser un littéral de tableau
   */
  private parseArrayLiteral(): ArrayExpression {
    const token = this.parser.expect(TokenTypes.LBRACKET);
    const elements: Expression[] = [];
    
    while (!this.parser.match(TokenTypes.RBRACKET)) {
      if (this.parser.match(TokenTypes.COMMA)) {
        this.parser.advance();
        elements.push(new SpreadElement(new Identifier('undefined', token.location), token.location));
      } else {
        elements.push(this.parseExpression());
        if (!this.parser.match(TokenTypes.RBRACKET)) {
          this.parser.expect(TokenTypes.COMMA, 'Expected , or ]');
        }
      }
    }
    
    this.parser.expect(TokenTypes.RBRACKET);
    return new ArrayExpression(elements, token.location);
  }

  /**
   * Analyser un littéral d'objet
   */
  private parseObjectLiteral(): ObjectExpression {
    const token = this.parser.expect(TokenTypes.LBRACE);
    const properties: ObjectExpression['properties'] = [];
    
    while (!this.parser.match(TokenTypes.RBRACE)) {
      const key = this.parseObjectKey();
      
      if (this.parser.match(TokenTypes.COLON)) {
        this.parser.advance();
        const value = this.parseExpression();
        properties.push({ type: 'Property', key, value, location: key.location });
      } else if (this.parser.match(TokenTypes.LPAREN)) {
        // Méthode abrégée
        const params: Identifier[] = [];
        this.parser.expect(TokenTypes.LPAREN);
        
        while (!this.parser.match(TokenTypes.RPAREN)) {
          params.push(this.parseIdentifier());
          if (!this.parser.match(TokenTypes.RPAREN)) {
            this.parser.expect(TokenTypes.COMMA);
          }
        }
        
        this.parser.expect(TokenTypes.RPAREN);
        const body = this.parseFunctionBody();
        properties.push({ type: 'Method', key, params, body, location: key.location });
      } else {
        // Propriété abrégée
        const value = new Identifier(key.value, key.location);
        properties.push({ type: 'Property', key, value, location: key.location });
      }
      
      if (!this.parser.match(TokenTypes.RBRACE)) {
        this.parser.expect(TokenTypes.COMMA);
      }
    }
    
    this.parser.expect(TokenTypes.RBRACE);
    return new ObjectExpression(properties, token.location);
  }

  /**
   * Analyser une clé d'objet
   */
  private parseObjectKey(): Identifier {
    const token = this.parser.peek();
    
    if (token?.type === TokenTypes.STRING) {
      const literal = this.parseLiteral();
      return new Identifier(literal.value as string, literal.location);
    } else if (token?.type === TokenTypes.IDENTIFIER) {
      return this.parseIdentifier();
    } else if (token?.type === TokenTypes.LBRACKET) {
      this.parser.advance();
      const expr = this.parseExpression();
      this.parser.expect(TokenTypes.RBRACKET);
      // Pour les clés calculées, nous retournons un identifiant avec la valeur calculée
      return new Identifier('[computed]', expr.location);
    }
    
    throw new Error('Expected object key');
  }

  /**
   * Analyser une expression de fonction
   */
  private parseFunctionExpression(): FunctionExpression {
    const token = this.parser.expect(TokenTypes.FUNCTION);
    
    // Optionnel: nom de la fonction
    let name: Identifier | null = null;
    if (this.parser.match(TokenTypes.IDENTIFIER)) {
      name = this.parseIdentifier();
    }
    
    this.parser.expect(TokenTypes.LPAREN);
    const params = this.parseParameters();
    this.parser.expect(TokenTypes.RPAREN);
    
    const body = this.parseFunctionBody();
    
    return new FunctionExpression(name, params, body, token.location);
  }

  /**
   * Analyser une expression de fonction fléchée
   */
  public parseArrowFunctionExpression(): ArrowFunctionExpression {
    const token = this.parser.peek()!;
    
    // Paramètres
    let params: Identifier[];
    
    if (this.parser.match(TokenTypes.LPAREN)) {
      this.parser.advance();
      params = this.parseParameters();
      this.parser.expect(TokenTypes.RPAREN);
    } else {
      // Paramètre unique sans parenthèses
      params = [this.parseIdentifier()];
    }
    
    this.parser.expect(TokenTypes.ARROW);
    
    // Corps
    const body = this.parseArrowFunctionBody();
    
    return new ArrowFunctionExpression(params, body, token.location);
  }

  /**
   * Analyser le corps d'une fonction fléchée
   */
  private parseArrowFunctionBody(): any {
    if (this.parser.match(TokenTypes.LBRACE)) {
      return this.parseBlockStatement();
    } else {
      return this.parseExpression();
    }
  }

  /**
   * Analyser les paramètres d'une fonction
   */
  private parseParameters(): Identifier[] {
    const params: Identifier[] = [];
    
    while (!this.parser.match(TokenTypes.RPAREN)) {
      if (this.parser.match(TokenTypes.COMMA)) {
        this.parser.advance();
      }
      
      const param = this.parseIdentifier();
      
      // Paramètres optionnels ou par défaut
      if (this.parser.match(TokenTypes.ASSIGN)) {
        this.parser.advance();
        const defaultValue = this.parseExpression();
        // TODO: Gérer les paramètres par défaut
      }
      
      params.push(param);
      
      if (!this.parser.match(TokenTypes.RPAREN)) {
        this.parser.expect(TokenTypes.COMMA);
      }
    }
    
    return params;
  }

  /**
   * Analyser le corps d'une fonction
   */
  private parseFunctionBody(): any {
    if (this.parser.match(TokenTypes.LBRACE)) {
      return this.parseBlockStatement();
    } else {
      // Fonction avec expression unique (à retourner)
      const expr = this.parseExpression();
      return { type: 'ReturnStatement', argument: expr, location: expr.location };
    }
  }

  /**
   * Analyser une expression d'appel
   */
  private parseCallExpression(callee: Expression): CallExpression {
    const token = this.parser.expect(TokenTypes.LPAREN);
    const args: Expression[] = [];
    
    while (!this.parser.match(TokenTypes.RPAREN)) {
      if (this.parser.match(TokenTypes.COMMA)) {
        this.parser.advance();
      }
      
      args.push(this.parseExpression());
      
      if (!this.parser.match(TokenTypes.RPAREN)) {
        this.parser.expect(TokenTypes.COMMA);
      }
    }
    
    this.parser.expect(TokenTypes.RPAREN);
    return new CallExpression(callee, args, token.location);
  }

  /**
   * Analyser une expression membre
   */
  private parseMemberExpression(object: Expression, computed: boolean): MemberExpression {
    if (computed) {
      this.parser.expect(TokenTypes.LBRACKET);
      const property = this.parseExpression();
      this.parser.expect(TokenTypes.RBRACKET);
      return new MemberExpression(object, property, true, this.getLocation(object, property));
    } else {
      this.parser.expect(TokenTypes.DOT);
      const property = this.parseIdentifier();
      return new MemberExpression(object, property, false, this.getLocation(object, property));
    }
  }

  /**
   * Analyser une expression new
   */
  private parseNewExpression(): NewExpression {
    const token = this.parser.expect(TokenTypes.NEW);
    const callee = this.parsePrimary();
    
    if (this.parser.match(TokenTypes.LPAREN)) {
      return new NewExpression(callee, this.parseCallArguments(), token.location);
    }
    
    return new NewExpression(callee, [], token.location);
  }

  /**
   * Analyser les arguments d'un appel
   */
  private parseCallArguments(): Expression[] {
    const args: Expression[] = [];
    this.parser.expect(TokenTypes.LPAREN);
    
    while (!this.parser.match(TokenTypes.RPAREN)) {
      if (this.parser.match(TokenTypes.COMMA)) {
        this.parser.advance();
      }
      
      args.push(this.parseExpression());
      
      if (!this.parser.match(TokenTypes.RPAREN)) {
        this.parser.expect(TokenTypes.COMMA);
      }
    }
    
    this.parser.expect(TokenTypes.RPAREN);
    return args;
  }

  /**
   * Analyser une expression async
   */
  private parseAsyncExpression(): Expression {
    const token = this.parser.expect(TokenTypes.ASYNC);
    
    if (this.parser.match(TokenTypes.FUNCTION)) {
      return this.parseAsyncFunctionExpression();
    } else {
      // Async arrow function
      return this.parseArrowFunctionExpression();
    }
  }

  /**
   * Analyser une expression de fonction async
   */
  private parseAsyncFunctionExpression(): FunctionExpression {
    const token = this.parser.previous()!;
    this.parser.expect(TokenTypes.FUNCTION);
    
    let name: Identifier | null = null;
    if (this.parser.match(TokenTypes.IDENTIFIER)) {
      name = this.parseIdentifier();
    }
    
    this.parser.expect(TokenTypes.LPAREN);
    const params = this.parseParameters();
    this.parser.expect(TokenTypes.RPAREN);
    
    const body = this.parseFunctionBody();
    
    const func = new FunctionExpression(name, params, body, token.location);
    func.async = true;
    return func;
  }

  /**
   * Analyser un template literal
   */
  private parseTemplateLiteral(): TemplateLiteral {
    const token = this.parser.expect(TokenTypes.TEMPLATE);
    const quasis: any[] = [];
    const expressions: Expression[] = [];
    
    // Le premier quasi est déjà commencé
    let quasi = { type: 'TemplateElement', value: { raw: '', cooked: '' }, tail: false, location: token.location };
    
    while (!this.parser.match(TokenTypes.TEMPLATE)) {
      const next = this.parser.peek();
      
      if (next?.type === TokenTypes.TEMPLATE_INTERPOLATION) {
        // Fin du quasi actuel
        quasis.push(quasi);
        
        // Expression d'interpolation
        this.parser.advance();
        expressions.push(this.parseExpression());
        
        // Commencer un nouveau quasi
        quasi = { type: 'TemplateElement', value: { raw: '', cooked: '' }, tail: false, location: this.parser.getCurrentLocation() };
      } else {
        // Ajouter au quasi actuel
        const char = this.parser.advance();
        quasi.value.raw += char?.value || '';
        quasi.value.cooked += char?.value || '';
      }
    }
    
    // Ajouter le dernier quasi
    quasi.tail = true;
    quasis.push(quasi);
    
    this.parser.expect(TokenTypes.TEMPLATE);
    
    return new TemplateLiteral(quasis, expressions, token.location);
  }

  /**
   * Analyser un tagged template
   */
  private parseTaggedTemplate(tag: Expression): TaggedTemplateExpression {
    const quasi = this.parseTemplateLiteral();
    return new TaggedTemplateExpression(tag, quasi, quasi.location);
  }

  /**
   * Analyser un bloc de statements
   */
  private parseBlockStatement(): any {
    const token = this.parser.expect(TokenTypes.LBRACE);
    const body: Statement[] = [];
    
    while (!this.parser.match(TokenTypes.RBRACE)) {
      const stmt = this.parser.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
    }
    
    this.parser.expect(TokenTypes.RBRACE);
    return { type: 'BlockStatement', body, location: token.location };
  }

  /**
   * Analyser une expression binaire
   */
  private parseBinaryExpression(
    leftParser: () => Expression,
    operators: TokenType[],
    precedence: number,
    rightAssociative: boolean = false
  ): Expression {
    let left = leftParser();
    
    while (true) {
      const token = this.parser.peek();
      if (!token || !operators.includes(token.type)) {
        break;
      }
      
      const operatorPrecedence = this.getPrecedence(token.type);
      if (operatorPrecedence < precedence) {
        break;
      }
      
      this.parser.advance();
      const right = rightAssociative ?
        this.parseBinaryExpression(leftParser, operators, operatorPrecedence, rightAssociative) :
        this.parseBinaryExpression(leftParser, operators, operatorPrecedence + 1, rightAssociative);
      
      left = new BinaryExpression(token.type as TokenType, left, right, token.location);
    }
    
    return left;
  }

  /**
   * Obtenir la precedence d'un opérateur
   */
  private getPrecedence(type: TokenType): number {
    return Precedence.get(type);
  }

  /**
   * Vérifier si un token est un opérateur unaire
   */
  private isUnaryOperator(type: TokenType): boolean {
    const unaryOperators: TokenType[] = [
      TokenTypes.PLUS,
      TokenTypes.MINUS,
      TokenTypes.NOT,
      TokenTypes.BITWISE_NOT,
      TokenTypes.INCREMENT,
      TokenTypes.DECREMENT,
      TokenTypes.TYPEOF,
      TokenTypes.VOID,
      TokenTypes.DELETE,
      TokenTypes.AWAIT,
    ];
    return unaryOperators.includes(type);
  }

  /**
   * Vérifier si un token est un opérateur d'assignation
   */
  private isAssignmentOperator(type: TokenType): boolean {
    const assignmentOperators: TokenType[] = [
      TokenTypes.ASSIGN,
      TokenTypes.PLUS_ASSIGN,
      TokenTypes.MINUS_ASSIGN,
      TokenTypes.MULTIPLY_ASSIGN,
      TokenTypes.DIVIDE_ASSIGN,
      TokenTypes.MODULO_ASSIGN,
    ];
    return assignmentOperators.includes(type);
  }

  /**
   * Obtenir la location entre deux expressions
   */
  private getLocation(left: Expression, right: Expression): any {
    return {
      filename: left.location.filename,
      start: left.location.start,
      end: right.location.end,
    };
  }
}
