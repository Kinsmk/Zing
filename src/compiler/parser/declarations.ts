/**
 * Declarations - Analyseur de déclarations pour Zinga
 * 
 * Ce module gère l'analyse des déclarations de variables, fonctions,
 * classes, interfaces, etc.
 */

import { Token } from '../lexer/tokens';
import { TokenType, TokenType as TokenTypes } from '../lexer/token-types';
import { ASTNode, Statement, Expression, Identifier, VariableDeclaration, VariableDeclarator, FunctionDeclaration, ClassDeclaration, ClassBody, MethodDefinition, InterfaceDeclaration, InterfaceBody, PropertyDefinition, EnumDeclaration, EnumMember, TypeAliasDeclaration } from '../ast/nodes';
import { Parser } from './parser';
import { DiagnosticCollector } from '../diagnostics/errors';
import { Expressions } from './expressions';

export class Declarations {
  private parser: Parser;
  private diagnostics: DiagnosticCollector;
  private expressions: Expressions;

  constructor(parser: Parser, diagnostics: DiagnosticCollector) {
    this.parser = parser;
    this.diagnostics = diagnostics;
    this.expressions = new Expressions(parser, diagnostics);
  }

  /**
   * Analyser une déclaration
   */
  public parseDeclaration(): Statement | null {
    const token = this.parser.peek();
    
    if (!token) {
      return null;
    }

    switch (token.type) {
      case TokenTypes.VAR:
      case TokenTypes.LET:
      case TokenTypes.CONST:
        return this.parseVariableDeclaration();
      
      case TokenTypes.FUNCTION:
        return this.parseFunctionDeclaration();
      
      case TokenTypes.CLASS:
        return this.parseClassDeclaration();
      
      case TokenTypes.INTERFACE:
        return this.parseInterfaceDeclaration();
      
      case TokenTypes.ENUM:
        return this.parseEnumDeclaration();
      
      case TokenTypes.TYPE:
        return this.parseTypeAliasDeclaration();
      
      default:
        return null;
    }
  }

  /**
   * Analyser une déclaration de variable
   */
  public parseVariableDeclaration(): VariableDeclaration {
    const token = this.parser.advance()!;
    const kind = token.type as TokenType;
    
    const declarations: VariableDeclarator[] = [];
    
    do {
      const declarator = this.parseVariableDeclarator();
      declarations.push(declarator);
    } while (this.parser.match(TokenTypes.COMMA) && this.parser.advance());
    
    if (this.parser.match(TokenTypes.SEMICOLON)) {
      this.parser.advance();
    }
    
    return new VariableDeclaration(declarations, kind, token.location);
  }

  /**
   * Analyser un déclarateur de variable
   */
  private parseVariableDeclarator(): VariableDeclarator {
    const token = this.parser.peek()!;
    const id = this.expressions.parseIdentifier();
    
    let init: Expression | null = null;
    
    if (this.parser.match(TokenTypes.ASSIGN)) {
      this.parser.advance();
      init = this.expressions.parseExpression();
    }
    
    // Gérer l'annotation de type
    let typeAnnotation: TypeAnnotation | null = null;
    if (this.parser.match(TokenTypes.COLON)) {
      this.parser.advance();
      typeAnnotation = this.parseTypeAnnotation();
    }
    
    return new VariableDeclarator(id, init, typeAnnotation, token.location);
  }

  /**
   * Analyser une déclaration de fonction
   */
  public parseFunctionDeclaration(): FunctionDeclaration {
    const token = this.parser.expect(TokenTypes.FUNCTION);
    
    // Optionnel: async
    let isAsync = false;
    if (this.parser.match(TokenTypes.ASYNC)) {
      this.parser.advance();
      isAsync = true;
    }
    
    // Optionnel: générateur
    let isGenerator = false;
    if (this.parser.match(TokenTypes.MULTIPLY)) {
      this.parser.advance();
      isGenerator = true;
    }
    
    // Nom de la fonction
    const id = this.parser.match(TokenTypes.IDENTIFIER) ? 
      this.expressions.parseIdentifier() : 
      null;
    
    // Paramètres
    this.parser.expect(TokenTypes.LPAREN);
    const params = this.parseFunctionParameters();
    this.parser.expect(TokenTypes.RPAREN);
    
    // Annotation de retour
    let returnType: TypeAnnotation | null = null;
    if (this.parser.match(TokenTypes.COLON)) {
      this.parser.advance();
      returnType = this.parseTypeAnnotation();
    }
    
    // Corps de la fonction
    const body = this.parseFunctionBody();
    
    const declaration = new FunctionDeclaration(
      id, params, body, token.location
    );
    
    declaration.async = isAsync;
    declaration.generator = isGenerator;
    declaration.returnType = returnType;
    
    return declaration;
  }

  /**
   * Analyser les paramètres d'une fonction
   */
  private parseFunctionParameters(): Identifier[] {
    const params: Identifier[] = [];
    
    while (!this.parser.match(TokenTypes.RPAREN)) {
      if (this.parser.match(TokenTypes.COMMA)) {
        this.parser.advance();
      }
      
      const param = this.parseFunctionParameter();
      params.push(param);
      
      if (!this.parser.match(TokenTypes.RPAREN)) {
        this.parser.expect(TokenTypes.COMMA);
      }
    }
    
    return params;
  }

  /**
   * Analyser un paramètre de fonction
   */
  private parseFunctionParameter(): Identifier {
    const token = this.parser.peek()!;
    const id = this.expressions.parseIdentifier();
    
    // Annotation de type
    if (this.parser.match(TokenTypes.COLON)) {
      this.parser.advance();
      const typeAnnotation = this.parseTypeAnnotation();
      // TODO: Ajouter l'annotation de type au paramètre
    }
    
    // Valeur par défaut
    if (this.parser.match(TokenTypes.ASSIGN)) {
      this.parser.advance();
      const defaultValue = this.expressions.parseExpression();
      // TODO: Ajouter la valeur par défaut au paramètre
    }
    
    return id;
  }

  /**
   * Analyser le corps d'une fonction
   */
  private parseFunctionBody(): any {
    if (this.parser.match(TokenTypes.LBRACE)) {
      return this.parseBlockStatement();
    } else {
      // Fonction avec expression unique (à retourner)
      const expr = this.expressions.parseExpression();
      return { type: 'ReturnStatement', argument: expr, location: expr.location };
    }
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
   * Analyser une déclaration de classe
   */
  public parseClassDeclaration(): ClassDeclaration {
    const token = this.parser.expect(TokenTypes.CLASS);
    
    const id = this.expressions.parseIdentifier();
    
    // Héritage
    let superClass: Expression | null = null;
    if (this.parser.match(TokenTypes.EXTENDS)) {
      this.parser.advance();
      superClass = this.expressions.parseExpression();
    }
    
    // Implémentation d'interfaces
    const implementsList: Expression[] = [];
    if (this.parser.match(TokenTypes.IMPLEMENTS)) {
      this.parser.advance();
      
      do {
        implementsList.push(this.expressions.parseExpression());
      } while (this.parser.match(TokenTypes.COMMA) && this.parser.advance());
    }
    
    // Corps de la classe
    this.parser.expect(TokenTypes.LBRACE);
    const body = this.parseClassBody();
    this.parser.expect(TokenTypes.RBRACE);
    
    return new ClassDeclaration(id, superClass, body, token.location, implementsList);
  }

  /**
   * Analyser le corps d'une classe
   */
  private parseClassBody(): ClassBody {
    const body: MethodDefinition[] = [];
    
    while (!this.parser.match(TokenTypes.RBRACE)) {
      const method = this.parseClassMethod();
      if (method) {
        body.push(method);
      }
    }
    
    return new ClassBody(body, this.parser.getCurrentLocation());
  }

  /**
   * Analyser une méthode de classe
   */
  private parseClassMethod(): MethodDefinition | null {
    const token = this.parser.peek();
    
    if (!token) {
      return null;
    }
    
    // Modificateurs
    let isStatic = false;
    let isPrivate = false;
    let isPublic = false;
    let isProtected = false;
    let isAsync = false;
    let isGenerator = false;
    
    while (true) {
      if (this.parser.match(TokenTypes.STATIC)) {
        this.parser.advance();
        isStatic = true;
      } else if (this.parser.match(TokenTypes.PRIVATE)) {
        this.parser.advance();
        isPrivate = true;
      } else if (this.parser.match(TokenTypes.PUBLIC)) {
        this.parser.advance();
        isPublic = true;
      } else if (this.parser.match(TokenTypes.PROTECTED)) {
        this.parser.advance();
        isProtected = true;
      } else if (this.parser.match(TokenTypes.ASYNC)) {
        this.parser.advance();
        isAsync = true;
      } else if (this.parser.match(TokenTypes.MULTIPLY)) {
        this.parser.advance();
        isGenerator = true;
      } else {
        break;
      }
    }
    
    // Getter/Setter
    let kind: 'constructor' | 'method' | 'get' | 'set' = 'method';
    
    if (this.parser.match(TokenTypes.CONSTRUCTOR)) {
      this.parser.advance();
      kind = 'constructor';
    } else if (this.parser.match(TokenTypes.GET)) {
      this.parser.advance();
      kind = 'get';
    } else if (this.parser.match(TokenTypes.SET)) {
      this.parser.advance();
      kind = 'set';
    }
    
    // Nom ou paramètres
    if (kind === 'get' || kind === 'set' || kind === 'method') {
      const key = this.expressions.parseIdentifier();
      
      // Paramètres
      this.parser.expect(TokenTypes.LPAREN);
      const params = this.parseFunctionParameters();
      this.parser.expect(TokenTypes.RPAREN);
      
      // Annotation de retour
      let returnType: TypeAnnotation | null = null;
      if (this.parser.match(TokenTypes.COLON)) {
        this.parser.advance();
        returnType = this.parseTypeAnnotation();
      }
      
      // Corps
      const body = this.parseFunctionBody();
      
      const method = new MethodDefinition(
        kind,
        key,
        params,
        body,
        token.location
      );
      
      method.static = isStatic;
      method.private = isPrivate;
      method.public = isPublic;
      method.protected = isProtected;
      method.async = isAsync;
      method.generator = isGenerator;
      method.returnType = returnType;
      
      return method;
    } else {
      // Constructeur
      this.parser.expect(TokenTypes.LPAREN);
      const params = this.parseFunctionParameters();
      this.parser.expect(TokenTypes.RPAREN);
      
      // Appel du constructeur parent
      let superCall: Expression | null = null;
      if (this.parser.match(TokenTypes.COLON)) {
        this.parser.advance();
        superCall = this.expressions.parseExpression();
      }
      
      // Corps
      const body = this.parseFunctionBody();
      
      const method = new MethodDefinition(
        'constructor',
        new Identifier('constructor', token.location),
        params,
        body,
        token.location
      );
      
      method.static = isStatic;
      method.private = isPrivate;
      method.public = isPublic;
      method.protected = isProtected;
      method.async = isAsync;
      method.generator = isGenerator;
      
      return method;
    }
  }

  /**
   * Analyser une déclaration d'interface
   */
  public parseInterfaceDeclaration(): InterfaceDeclaration {
    const token = this.parser.expect(TokenTypes.INTERFACE);
    
    const id = this.expressions.parseIdentifier();
    
    // Héritage
    const extendsList: Expression[] = [];
    if (this.parser.match(TokenTypes.EXTENDS)) {
      this.parser.advance();
      
      do {
        extendsList.push(this.expressions.parseExpression());
      } while (this.parser.match(TokenTypes.COMMA) && this.parser.advance());
    }
    
    // Corps de l'interface
    this.parser.expect(TokenTypes.LBRACE);
    const body = this.parseInterfaceBody();
    this.parser.expect(TokenTypes.RBRACE);
    
    return new InterfaceDeclaration(id, body, token.location, extendsList);
  }

  /**
   * Analyser le corps d'une interface
   */
  private parseInterfaceBody(): InterfaceBody {
    const body: PropertyDefinition[] = [];
    
    while (!this.parser.match(TokenTypes.RBRACE)) {
      const property = this.parseInterfaceProperty();
      if (property) {
        body.push(property);
      }
    }
    
    return new InterfaceBody(body, this.parser.getCurrentLocation());
  }

  /**
   * Analyser une propriété d'interface
   */
  private parseInterfaceProperty(): PropertyDefinition | null {
    const token = this.parser.peek();
    
    if (!token) {
      return null;
    }
    
    // Méthode
    if (this.parser.match(TokenTypes.IDENTIFIER) && this.parser.peek(1)?.type === TokenTypes.LPAREN) {
      const key = this.expressions.parseIdentifier();
      
      this.parser.expect(TokenTypes.LPAREN);
      const params = this.parseFunctionParameters();
      this.parser.expect(TokenTypes.RPAREN);
      
      // Annotation de retour
      let returnType: TypeAnnotation | null = null;
      if (this.parser.match(TokenTypes.COLON)) {
        this.parser.advance();
        returnType = this.parseTypeAnnotation();
      }
      
      this.parser.expect(TokenTypes.SEMICOLON);
      
      return new PropertyDefinition(
        'method',
        key,
        null,
        returnType,
        token.location
      );
    }
    
    // Propriété
    const key = this.expressions.parseIdentifier();
    
    // Optionnel: ?
    let optional = false;
    if (this.parser.match(TokenTypes.QUESTION)) {
      this.parser.advance();
      optional = true;
    }
    
    // Annotation de type
    let typeAnnotation: TypeAnnotation | null = null;
    if (this.parser.match(TokenTypes.COLON)) {
      this.parser.advance();
      typeAnnotation = this.parseTypeAnnotation();
    }
    
    this.parser.expect(TokenTypes.SEMICOLON);
    
    return new PropertyDefinition(
      'property',
      key,
      null,
      typeAnnotation,
      token.location,
      optional
    );
  }

  /**
   * Analyser une déclaration d'enum
   */
  public parseEnumDeclaration(): EnumDeclaration {
    const token = this.parser.expect(TokenTypes.ENUM);
    
    const id = this.expressions.parseIdentifier();
    
    this.parser.expect(TokenTypes.LBRACE);
    
    const members: EnumMember[] = [];
    
    while (!this.parser.match(TokenTypes.RBRACE)) {
      if (this.parser.match(TokenTypes.COMMA)) {
        this.parser.advance();
      }
      
      const member = this.parseEnumMember();
      members.push(member);
      
      if (!this.parser.match(TokenTypes.RBRACE)) {
        this.parser.expect(TokenTypes.COMMA);
      }
    }
    
    this.parser.expect(TokenTypes.RBRACE);
    
    return new EnumDeclaration(id, members, token.location);
  }

  /**
   * Analyser un membre d'enum
   */
  private parseEnumMember(): EnumMember {
    const token = this.parser.peek()!;
    const id = this.expressions.parseIdentifier();
    
    let init: Expression | null = null;
    if (this.parser.match(TokenTypes.ASSIGN)) {
      this.parser.advance();
      init = this.expressions.parseExpression();
    }
    
    return new EnumMember(id, init, token.location);
  }

  /**
   * Analyser une déclaration de type alias
   */
  public parseTypeAliasDeclaration(): TypeAliasDeclaration {
    const token = this.parser.expect(TokenTypes.TYPE);
    
    const id = this.expressions.parseIdentifier();
    
    // Paramètres de type
    const typeParameters: TypeParameter[] = [];
    if (this.parser.match(TokenTypes.GENERIC)) {
      this.parser.advance();
      
      this.parser.expect(TokenTypes.LT);
      
      while (!this.parser.match(TokenTypes.GT)) {
        if (this.parser.match(TokenTypes.COMMA)) {
          this.parser.advance();
        }
        
        const typeParam = this.parseTypeParameter();
        typeParameters.push(typeParam);
        
        if (!this.parser.match(TokenTypes.GT)) {
          this.parser.expect(TokenTypes.COMMA);
        }
      }
      
      this.parser.expect(TokenTypes.GT);
    }
    
    this.parser.expect(TokenTypes.ASSIGN);
    
    const typeAnnotation = this.parseTypeAnnotation();
    
    if (this.parser.match(TokenTypes.SEMICOLON)) {
      this.parser.advance();
    }
    
    return new TypeAliasDeclaration(id, typeParameters, typeAnnotation, token.location);
  }

  /**
   * Analyser un paramètre de type
   */
  private parseTypeParameter(): TypeParameter {
    const token = this.parser.peek()!;
    const name = this.expressions.parseIdentifier();
    
    // Contrainte
    let constraint: TypeAnnotation | null = null;
    if (this.parser.match(TokenTypes.EXTENDS)) {
      this.parser.advance();
      constraint = this.parseTypeAnnotation();
    }
    
    // Valeur par défaut
    let defaultType: TypeAnnotation | null = null;
    if (this.parser.match(TokenTypes.ASSIGN)) {
      this.parser.advance();
      defaultType = this.parseTypeAnnotation();
    }
    
    return new TypeParameter(name, constraint, defaultType, token.location);
  }

  /**
   * Analyser une annotation de type
   */
  public parseTypeAnnotation(): TypeAnnotation {
    const token = this.parser.peek()!;
    
    // Type de base
    let type: Expression;
    
    if (this.parser.match(TokenTypes.IDENTIFIER)) {
      type = this.expressions.parseIdentifier();
    } else if (this.parser.match(TokenTypes.NUMBER_TYPE, TokenTypes.STRING_TYPE, TokenTypes.BOOLEAN_TYPE, TokenTypes.NULL_TYPE, TokenTypes.ANY_TYPE, TokenTypes.VOID_TYPE)) {
      type = this.expressions.parseLiteral();
    } else {
      throw new Error('Expected type');
    }
    
    // Type générique
    if (this.parser.match(TokenTypes.LT)) {
      this.parser.advance();
      
      const typeParameters: TypeAnnotation[] = [];
      
      while (!this.parser.match(TokenTypes.GT)) {
        if (this.parser.match(TokenTypes.COMMA)) {
          this.parser.advance();
        }
        
        typeParameters.push(this.parseTypeAnnotation());
        
        if (!this.parser.match(TokenTypes.GT)) {
          this.parser.expect(TokenTypes.COMMA);
        }
      }
      
      this.parser.expect(TokenTypes.GT);
      
      // TODO: Créer un nœud pour les types génériques
    }
    
    // Type tableau
    if (this.parser.match(TokenTypes.LBRACKET)) {
      this.parser.advance();
      this.parser.expect(TokenTypes.RBRACKET);
      
      // TODO: Créer un nœud pour les types tableau
    }
    
    // Type union
    if (this.parser.match(TokenTypes.PIPE)) {
      this.parser.advance();
      const right = this.parseTypeAnnotation();
      
      // TODO: Créer un nœud pour les types union
    }
    
    // Type intersection
    if (this.parser.match(TokenTypes.AND)) {
      this.parser.advance();
      const right = this.parseTypeAnnotation();
      
      // TODO: Créer un nœud pour les types intersection
    }
    
    // Type tuple
    if (this.parser.match(TokenTypes.LPAREN)) {
      this.parser.advance();
      
      const types: TypeAnnotation[] = [];
      
      while (!this.parser.match(TokenTypes.RPAREN)) {
        if (this.parser.match(TokenTypes.COMMA)) {
          this.parser.advance();
        }
        
        types.push(this.parseTypeAnnotation());
        
        if (!this.parser.match(TokenTypes.RPAREN)) {
          this.parser.expect(TokenTypes.COMMA);
        }
      }
      
      this.parser.expect(TokenTypes.RPAREN);
      
      // TODO: Créer un nœud pour les types tuple
    }
    
    // Type fonction
    if (this.parser.match(TokenTypes.ARROW)) {
      this.parser.advance();
      const returnType = this.parseTypeAnnotation();
      
      // TODO: Créer un nœud pour les types fonction
    }
    
    return new TypeAnnotation(type, token.location);
  }
}

// Classes pour les nodes qui n'existent pas encore dans nodes.ts
class ExpressionStatement implements Statement {
  constructor(public expression: Expression, public location: any) {}
  type = 'ExpressionStatement' as const;
}

class TypeAnnotation implements ASTNode {
  constructor(public type: Expression, public location: any) {}
  type = 'TypeAnnotation' as const;
}

class TypeParameter implements ASTNode {
  constructor(
    public name: Identifier,
    public constraint: TypeAnnotation | null,
    public defaultType: TypeAnnotation | null,
    public location: any
  ) {}
  type = 'TypeParameter' as const;
}
