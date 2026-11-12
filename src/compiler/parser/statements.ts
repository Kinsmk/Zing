/**
 * Statements - Analyseur de statements pour Zinga
 * 
 * Ce module gère l'analyse de toutes les structures de contrôle et
 * déclarations du langage.
 */

import { Token, TokenType } from '../lexer/tokens';
import { TokenTypes } from '../lexer/token-types';
import { ASTNode, Statement, Expression, BlockStatement, IfStatement, WhileStatement, DoWhileStatement, ForStatement, ForOfStatement, ForInStatement, SwitchStatement, BreakStatement, ContinueStatement, ReturnStatement, ThrowStatement, TryStatement, WithStatement, LabeledStatement, VariableDeclaration, FunctionDeclaration, ClassDeclaration, InterfaceDeclaration, ImportDeclaration, ExportDeclaration, EnumDeclaration, TypeAliasDeclaration } from '../ast/nodes';
import { Parser } from './parser';
import { DiagnosticCollector } from '../diagnostics/errors';
import { Declarations } from './declarations';
import { Expressions } from './expressions';

export class Statements {
  private parser: Parser;
  private diagnostics: DiagnosticCollector;
  private declarations: Declarations;
  private expressions: Expressions;

  constructor(parser: Parser, diagnostics: DiagnosticCollector) {
    this.parser = parser;
    this.diagnostics = diagnostics;
    this.declarations = new Declarations(parser, diagnostics);
    this.expressions = new Expressions(parser, diagnostics);
  }

  /**
   * Analyser un statement
   */
  public parseStatement(): Statement | null {
    const token = this.parser.peek();
    
    if (!token) {
      return null;
    }

    switch (token.type) {
      // Déclarations
      case TokenTypes.VAR:
      case TokenTypes.LET:
      case TokenTypes.CONST:
        return this.declarations.parseVariableDeclaration();
      
      case TokenTypes.FUNCTION:
        return this.declarations.parseFunctionDeclaration();
      
      case TokenTypes.CLASS:
        return this.declarations.parseClassDeclaration();
      
      case TokenTypes.INTERFACE:
        return this.declarations.parseInterfaceDeclaration();
      
      case TokenTypes.ENUM:
        return this.declarations.parseEnumDeclaration();
      
      case TokenTypes.TYPE:
        return this.declarations.parseTypeAliasDeclaration();
      
      case TokenTypes.IMPORT:
        return this.parseImportDeclaration();
      
      case TokenTypes.EXPORT:
        return this.parseExportDeclaration();
      
      // Structures de contrôle
      case TokenTypes.IF:
        return this.parseIfStatement();
      
      case TokenTypes.WHILE:
        return this.parseWhileStatement();
      
      case TokenTypes.DO:
        return this.parseDoWhileStatement();
      
      case TokenTypes.FOR:
        return this.parseForStatement();
      
      case TokenTypes.SWITCH:
        return this.parseSwitchStatement();
      
      case TokenTypes.BREAK:
        return this.parseBreakStatement();
      
      case TokenTypes.CONTINUE:
        return this.parseContinueStatement();
      
      case TokenTypes.RETURN:
        return this.parseReturnStatement();
      
      case TokenTypes.THROW:
        return this.parseThrowStatement();
      
      case TokenTypes.TRY:
        return this.parseTryStatement();
      
      case TokenTypes.WITH:
        return this.parseWithStatement();
      
      case TokenTypes.LBRACE:
        return this.parseBlockStatement();
      
      case TokenTypes.SEMICOLON:
        this.parser.advance();
        return new BlockStatement([], token.location);
      
      // Statements avec expression
      default:
        return this.parseExpressionStatement();
    }
  }

  /**
   * Analyser un statement d'expression
   */
  private parseExpressionStatement(): Statement {
    const token = this.parser.peek()!;
    const expression = this.expressions.parseExpression();
    
    // Optionnel: point-virgule
    if (this.parser.match(TokenTypes.SEMICOLON)) {
      this.parser.advance();
    }
    
    return new ExpressionStatement(expression, token.location);
  }

  /**
   * Analyser un bloc de statements
   */
  private parseBlockStatement(): BlockStatement {
    const token = this.parser.expect(TokenTypes.LBRACE);
    const body: Statement[] = [];
    
    while (!this.parser.match(TokenTypes.RBRACE)) {
      const stmt = this.parser.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
    }
    
    this.parser.expect(TokenTypes.RBRACE);
    return new BlockStatement(body, token.location);
  }

  /**
   * Analyser un statement if
   */
  private parseIfStatement(): IfStatement {
    const token = this.parser.expect(TokenTypes.IF);
    
    this.parser.expect(TokenTypes.LPAREN);
    const test = this.expressions.parseExpression();
    this.parser.expect(TokenTypes.RPAREN);
    
    const consequent = this.parseStatement();
    
    let alternate: Statement | null = null;
    if (this.parser.match(TokenTypes.ELSE)) {
      this.parser.advance();
      alternate = this.parseStatement();
    }
    
    return new IfStatement(test, consequent, alternate, token.location);
  }

  /**
   * Analyser un statement while
   */
  private parseWhileStatement(): WhileStatement {
    const token = this.parser.expect(TokenTypes.WHILE);
    
    this.parser.expect(TokenTypes.LPAREN);
    const test = this.expressions.parseExpression();
    this.parser.expect(TokenTypes.RPAREN);
    
    const body = this.parseStatement();
    
    return new WhileStatement(test, body, token.location);
  }

  /**
   * Analyser un statement do-while
   */
  private parseDoWhileStatement(): DoWhileStatement {
    const token = this.parser.expect(TokenTypes.DO);
    
    const body = this.parseStatement();
    
    this.parser.expect(TokenTypes.WHILE);
    this.parser.expect(TokenTypes.LPAREN);
    const test = this.expressions.parseExpression();
    this.parser.expect(TokenTypes.RPAREN);
    
    if (this.parser.match(TokenTypes.SEMICOLON)) {
      this.parser.advance();
    }
    
    return new DoWhileStatement(body, test, token.location);
  }

  /**
   * Analyser un statement for
   */
  private parseForStatement(): ForStatement {
    const token = this.parser.expect(TokenTypes.FOR);
    
    this.parser.expect(TokenTypes.LPAREN);
    
    // Initialisation
    let init: VariableDeclaration | Expression | null = null;
    
    if (this.parser.match(TokenTypes.VAR, TokenTypes.LET, TokenTypes.CONST)) {
      init = this.declarations.parseVariableDeclaration() as VariableDeclaration;
    } else if (!this.parser.match(TokenTypes.SEMICOLON)) {
      init = this.expressions.parseExpression();
    }
    
    this.parser.expect(TokenTypes.SEMICOLON);
    
    // Condition
    let test: Expression | null = null;
    if (!this.parser.match(TokenTypes.SEMICOLON)) {
      test = this.expressions.parseExpression();
    }
    
    this.parser.expect(TokenTypes.SEMICOLON);
    
    // Incrémentation
    let update: Expression | null = null;
    if (!this.parser.match(TokenTypes.RPAREN)) {
      update = this.expressions.parseExpression();
    }
    
    this.parser.expect(TokenTypes.RPAREN);
    
    const body = this.parseStatement();
    
    return new ForStatement(init, test, update, body, token.location);
  }

  /**
   * Analyser un statement for-of
   */
  private parseForOfStatement(): ForOfStatement {
    const token = this.parser.expect(TokenTypes.FOR);
    this.parser.expect(TokenTypes.AWAIT); // Optionnel: for await
    
    this.parser.expect(TokenTypes.LPAREN);
    
    const left = this.declarations.parseVariableDeclaration() || this.expressions.parseExpression();
    
    this.parser.expect(TokenTypes.OF);
    
    const right = this.expressions.parseExpression();
    
    this.parser.expect(TokenTypes.RPAREN);
    
    const body = this.parseStatement();
    
    return new ForOfStatement(left, right, body, token.location);
  }

  /**
   * Analyser un statement for-in
   */
  private parseForInStatement(): ForInStatement {
    const token = this.parser.expect(TokenTypes.FOR);
    
    this.parser.expect(TokenTypes.LPAREN);
    
    const left = this.declarations.parseVariableDeclaration() || this.expressions.parseExpression();
    
    this.parser.expect(TokenTypes.IN);
    
    const right = this.expressions.parseExpression();
    
    this.parser.expect(TokenTypes.RPAREN);
    
    const body = this.parseStatement();
    
    return new ForInStatement(left, right, body, token.location);
  }

  /**
   * Analyser un statement switch
   */
  private parseSwitchStatement(): SwitchStatement {
    const token = this.parser.expect(TokenTypes.SWITCH);
    
    this.parser.expect(TokenTypes.LPAREN);
    const discriminant = this.expressions.parseExpression();
    this.parser.expect(TokenTypes.RPAREN);
    
    this.parser.expect(TokenTypes.LBRACE);
    
    const cases: SwitchStatement['cases'] = [];
    
    while (!this.parser.match(TokenTypes.RBRACE)) {
      if (this.parser.match(TokenTypes.CASE)) {
        this.parser.advance();
        const test = this.expressions.parseExpression();
        this.parser.expect(TokenTypes.COLON);
        
        const consequent: Statement[] = [];
        while (!this.parser.match(TokenTypes.CASE, TokenTypes.DEFAULT, TokenTypes.RBRACE)) {
          const stmt = this.parser.parseStatement();
          if (stmt) {
            consequent.push(stmt);
          }
        }
        
        cases.push({ test, consequent, location: test.location });
      } else if (this.parser.match(TokenTypes.DEFAULT)) {
        this.parser.advance();
        this.parser.expect(TokenTypes.COLON);
        
        const consequent: Statement[] = [];
        while (!this.parser.match(TokenTypes.CASE, TokenTypes.DEFAULT, TokenTypes.RBRACE)) {
          const stmt = this.parser.parseStatement();
          if (stmt) {
            consequent.push(stmt);
          }
        }
        
        cases.push({ test: null, consequent, location: token.location });
      }
    }
    
    this.parser.expect(TokenTypes.RBRACE);
    
    return new SwitchStatement(discriminant, cases, token.location);
  }

  /**
   * Analyser un statement break
   */
  private parseBreakStatement(): BreakStatement {
    const token = this.parser.expect(TokenTypes.BREAK);
    
    let label: Expression | null = null;
    if (this.parser.match(TokenTypes.IDENTIFIER)) {
      label = this.expressions.parseIdentifier();
    }
    
    if (this.parser.match(TokenTypes.SEMICOLON)) {
      this.parser.advance();
    }
    
    return new BreakStatement(label, token.location);
  }

  /**
   * Analyser un statement continue
   */
  private parseContinueStatement(): ContinueStatement {
    const token = this.parser.expect(TokenTypes.CONTINUE);
    
    let label: Expression | null = null;
    if (this.parser.match(TokenTypes.IDENTIFIER)) {
      label = this.expressions.parseIdentifier();
    }
    
    if (this.parser.match(TokenTypes.SEMICOLON)) {
      this.parser.advance();
    }
    
    return new ContinueStatement(label, token.location);
  }

  /**
   * Analyser un statement return
   */
  private parseReturnStatement(): ReturnStatement {
    const token = this.parser.expect(TokenTypes.RETURN);
    
    let argument: Expression | null = null;
    if (!this.parser.match(TokenTypes.SEMICOLON, TokenTypes.RBRACE)) {
      argument = this.expressions.parseExpression();
    }
    
    if (this.parser.match(TokenTypes.SEMICOLON)) {
      this.parser.advance();
    }
    
    return new ReturnStatement(argument, token.location);
  }

  /**
   * Analyser un statement throw
   */
  private parseThrowStatement(): ThrowStatement {
    const token = this.parser.expect(TokenTypes.THROW);
    
    const argument = this.expressions.parseExpression();
    
    if (this.parser.match(TokenTypes.SEMICOLON)) {
      this.parser.advance();
    }
    
    return new ThrowStatement(argument, token.location);
  }

  /**
   * Analyser un statement try
   */
  private parseTryStatement(): TryStatement {
    const token = this.parser.expect(TokenTypes.TRY);
    
    const block = this.parseBlockStatement();
    
    let handler: CatchClause | null = null;
    if (this.parser.match(TokenTypes.CATCH)) {
      handler = this.parseCatchClause();
    }
    
    let finalizer: BlockStatement | null = null;
    if (this.parser.match(TokenTypes.FINALLY)) {
      this.parser.advance();
      finalizer = this.parseBlockStatement();
    }
    
    return new TryStatement(block, handler, finalizer, token.location);
  }

  /**
   * Analyser une clause catch
   */
  private parseCatchClause(): CatchClause {
    this.parser.expect(TokenTypes.CATCH);
    
    this.parser.expect(TokenTypes.LPAREN);
    
    let param: Expression | null = null;
    if (!this.parser.match(TokenTypes.RPAREN)) {
      param = this.expressions.parseExpression();
    }
    
    this.parser.expect(TokenTypes.RPAREN);
    
    const body = this.parseBlockStatement();
    
    return { param, body, location: body.location };
  }

  /**
   * Analyser un statement with
   */
  private parseWithStatement(): WithStatement {
    const token = this.parser.expect(TokenTypes.WITH);
    
    this.parser.expect(TokenTypes.LPAREN);
    const object = this.expressions.parseExpression();
    this.parser.expect(TokenTypes.RPAREN);
    
    const body = this.parseStatement();
    
    return new WithStatement(object, body, token.location);
  }

  /**
   * Analyser un statement labeled
   */
  public parseLabeledStatement(): LabeledStatement {
    const token = this.parser.expectIdentifier();
    
    this.parser.expect(TokenTypes.COLON);
    
    const body = this.parseStatement();
    
    return new LabeledStatement(token.value, body, token.location);
  }

  /**
   * Analyser une déclaration d'import
   */
  private parseImportDeclaration(): ImportDeclaration {
    const token = this.parser.expect(TokenTypes.IMPORT);
    
    let specifiers: ImportSpecifier[] = [];
    let source: Expression;
    
    if (this.parser.match(TokenTypes.LBRACE)) {
      this.parser.advance();
      
      while (!this.parser.match(TokenTypes.RBRACE)) {
        if (this.parser.match(TokenTypes.COMMA)) {
          this.parser.advance();
        }
        
        const imported = this.expressions.parseIdentifier();
        
        let local: Expression | null = null;
        if (this.parser.match(TokenTypes.AS)) {
          this.parser.advance();
          local = this.expressions.parseIdentifier();
        }
        
        specifiers.push({ type: 'ImportSpecifier', imported, local, location: imported.location });
        
        if (!this.parser.match(TokenTypes.RBRACE)) {
          this.parser.expect(TokenTypes.COMMA);
        }
      }
      
      this.parser.expect(TokenTypes.RBRACE);
      
      if (this.parser.match(TokenTypes.FROM)) {
        this.parser.advance();
      }
      
      source = this.expressions.parseExpression();
    } else {
      // Import par défaut
      const imported = this.expressions.parseIdentifier();
      
      let local: Expression | null = null;
      if (this.parser.match(TokenTypes.AS)) {
        this.parser.advance();
        local = this.expressions.parseIdentifier();
      }
      
      specifiers.push({ type: 'ImportDefaultSpecifier', imported, local, location: imported.location });
      
      if (this.parser.match(TokenTypes.COMMA)) {
        this.parser.advance();
        
        if (this.parser.match(TokenTypes.MULTIPLY)) {
          this.parser.advance();
          
          let namespace: Expression | null = null;
          if (this.parser.match(TokenTypes.AS)) {
            this.parser.advance();
            namespace = this.expressions.parseIdentifier();
          }
          
          specifiers.push({ type: 'ImportNamespaceSpecifier', imported: namespace, local: namespace, location: token.location });
        } else {
          // Import de spécificateurs supplémentaires
          while (this.parser.match(TokenTypes.LBRACE)) {
            this.parser.advance();
            
            while (!this.parser.match(TokenTypes.RBRACE)) {
              if (this.parser.match(TokenTypes.COMMA)) {
                this.parser.advance();
              }
              
              const imported = this.expressions.parseIdentifier();
              
              let local: Expression | null = null;
              if (this.parser.match(TokenTypes.AS)) {
                this.parser.advance();
                local = this.expressions.parseIdentifier();
              }
              
              specifiers.push({ type: 'ImportSpecifier', imported, local, location: imported.location });
              
              if (!this.parser.match(TokenTypes.RBRACE)) {
                this.parser.expect(TokenTypes.COMMA);
              }
            }
            
            this.parser.expect(TokenTypes.RBRACE);
          }
        }
      }
      
      if (this.parser.match(TokenTypes.FROM)) {
        this.parser.advance();
      }
      
      source = this.expressions.parseExpression();
    }
    
    if (this.parser.match(TokenTypes.SEMICOLON)) {
      this.parser.advance();
    }
    
    return new ImportDeclaration(specifiers, source, token.location);
  }

  /**
   * Analyser une déclaration d'export
   */
  private parseExportDeclaration(): ExportDeclaration {
    const token = this.parser.expect(TokenTypes.EXPORT);
    
    let declaration: Statement | null = null;
    let specifiers: ExportSpecifier[] = [];
    let source: Expression | null = null;
    
    if (this.parser.match(TokenTypes.DEFAULT)) {
      this.parser.advance();
      
      if (this.parser.match(TokenTypes.FUNCTION)) {
        declaration = this.declarations.parseFunctionDeclaration();
      } else if (this.parser.match(TokenTypes.CLASS)) {
        declaration = this.declarations.parseClassDeclaration();
      } else {
        declaration = this.expressions.parseExpression() as any;
      }
    } else if (this.parser.match(TokenTypes.LBRACE)) {
      this.parser.advance();
      
      while (!this.parser.match(TokenTypes.RBRACE)) {
        if (this.parser.match(TokenTypes.COMMA)) {
          this.parser.advance();
        }
        
        const exported = this.expressions.parseIdentifier();
        
        let local: Expression | null = null;
        if (this.parser.match(TokenTypes.AS)) {
          this.parser.advance();
          local = this.expressions.parseIdentifier();
        }
        
        specifiers.push({ type: 'ExportSpecifier', exported, local, location: exported.location });
        
        if (!this.parser.match(TokenTypes.RBRACE)) {
          this.parser.expect(TokenTypes.COMMA);
        }
      }
      
      this.parser.expect(TokenTypes.RBRACE);
      
      if (this.parser.match(TokenTypes.FROM)) {
        this.parser.advance();
        source = this.expressions.parseExpression();
      }
    } else if (this.parser.match(TokenTypes.MULTIPLY)) {
      this.parser.advance();
      
      if (this.parser.match(TokenTypes.AS)) {
        this.parser.advance();
        const exported = this.expressions.parseIdentifier();
        specifiers.push({ type: 'ExportNamespaceSpecifier', exported, local: exported, location: exported.location });
      }
      
      if (this.parser.match(TokenTypes.FROM)) {
        this.parser.advance();
        source = this.expressions.parseExpression();
      }
    } else {
      // Export d'une déclaration
      if (this.parser.match(TokenTypes.VAR, TokenTypes.LET, TokenTypes.CONST)) {
        declaration = this.declarations.parseVariableDeclaration();
      } else if (this.parser.match(TokenTypes.FUNCTION)) {
        declaration = this.declarations.parseFunctionDeclaration();
      } else if (this.parser.match(TokenTypes.CLASS)) {
        declaration = this.declarations.parseClassDeclaration();
      } else if (this.parser.match(TokenTypes.INTERFACE)) {
        declaration = this.declarations.parseInterfaceDeclaration();
      } else if (this.parser.match(TokenTypes.ENUM)) {
        declaration = this.declarations.parseEnumDeclaration();
      } else if (this.parser.match(TokenTypes.TYPE)) {
        declaration = this.declarations.parseTypeAliasDeclaration();
      }
    }
    
    if (this.parser.match(TokenTypes.SEMICOLON)) {
      this.parser.advance();
    }
    
    return new ExportDeclaration(declaration, specifiers, source, token.location);
  }
}

// Classes pour les nodes qui n'existent pas encore dans nodes.ts
class ExpressionStatement implements Statement {
  constructor(public expression: Expression, public location: any) {}
  type = 'ExpressionStatement' as const;
}

interface ImportSpecifier {
  type: 'ImportSpecifier' | 'ImportDefaultSpecifier' | 'ImportNamespaceSpecifier';
  imported: Expression;
  local: Expression | null;
  location: any;
}

interface ExportSpecifier {
  type: 'ExportSpecifier' | 'ExportNamespaceSpecifier';
  exported: Expression;
  local: Expression | null;
  location: any;
}

interface CatchClause {
  param: Expression | null;
  body: BlockStatement;
  location: any;
}
