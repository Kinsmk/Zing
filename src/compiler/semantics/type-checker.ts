/**
 * TypeChecker - Vérificateur de types pour Zinga
 * 
 * Ce module est responsable de la vérification des types dans l'AST.
 * Il vérifie la compatibilité des types et détecte les erreurs de type.
 */

import { ASTNode, Program, Statement, Expression, Identifier, Literal, BinaryExpression, UnaryExpression, CallExpression, MemberExpression, NewExpression, ArrayExpression, ObjectExpression, FunctionExpression, ArrowFunctionExpression, VariableDeclaration, VariableDeclarator, FunctionDeclaration, ClassDeclaration, InterfaceDeclaration, ReturnStatement, AssignmentExpression } from '../ast/nodes';
import { Config } from '../config';
import { DiagnosticCollector, ErrorCode } from '../diagnostics/errors';
import { SymbolTable, Symbol, SymbolKind } from './symbols';
import { Type, TypeKind, PrimitiveType, CompositeType, FunctionType, ArrayType, ObjectType, UnionType, IntersectionType, GenericType, TypeParameter, TypeSystem } from '../types/type-system';
import { ASTVisitor, traverse } from '../ast/visitor';

export interface TypeCheckerOptions {
  config?: Config;
  diagnostics?: DiagnosticCollector;
  symbolTable?: SymbolTable;
  typeSystem?: TypeSystem;
  strict?: boolean;
}

export class TypeChecker {
  private config: Config;
  private diagnostics: DiagnosticCollector;
  private symbolTable: SymbolTable;
  private typeSystem: TypeSystem;
  private strict: boolean;
  
  // Contexte
  private currentFile: string = '<unknown>';
  private currentFunction: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression | null = null;
  private currentClass: ClassDeclaration | null = null;
  private currentInterface: InterfaceDeclaration | null = null;
  private currentLoop: boolean = false;
  private currentSwitch: boolean = false;
  
  // Pile des types
  private typeStack: Type[] = [];
  private expectedReturnType: Type | null = null;

  constructor(options: TypeCheckerOptions = {}) {
    this.config = options.config || new Config();
    this.diagnostics = options.diagnostics || new DiagnosticCollector();
    this.symbolTable = options.symbolTable || new SymbolTable();
    this.typeSystem = options.typeSystem || new TypeSystem();
    this.strict = options.strict ?? true;
  }

  /**
   * Vérifier les types dans un programme
   */
  public check(program: Program, filename?: string): void {
    this.currentFile = filename || '<unknown>';
    this.visit(program);
  }

  /**
   * Visiter un nœud AST
   */
  private visit(node: ASTNode): Type {
    const type = node.type as string;
    
    switch (type) {
      case 'Program':
        return this.visitProgram(node as Program);
      
      case 'VariableDeclaration':
        return this.visitVariableDeclaration(node as VariableDeclaration);
      
      case 'VariableDeclarator':
        return this.visitVariableDeclarator(node as VariableDeclarator);
      
      case 'FunctionDeclaration':
        return this.visitFunctionDeclaration(node as FunctionDeclaration);
      
      case 'FunctionExpression':
        return this.visitFunctionExpression(node as FunctionExpression);
      
      case 'ArrowFunctionExpression':
        return this.visitArrowFunctionExpression(node as ArrowFunctionExpression);
      
      case 'ClassDeclaration':
        return this.visitClassDeclaration(node as ClassDeclaration);
      
      case 'InterfaceDeclaration':
        return this.visitInterfaceDeclaration(node as InterfaceDeclaration);
      
      case 'ReturnStatement':
        return this.visitReturnStatement(node as ReturnStatement);
      
      case 'Literal':
        return this.visitLiteral(node as Literal);
      
      case 'Identifier':
        return this.visitIdentifier(node as Identifier);
      
      case 'BinaryExpression':
        return this.visitBinaryExpression(node as BinaryExpression);
      
      case 'UnaryExpression':
        return this.visitUnaryExpression(node as UnaryExpression);
      
      case 'CallExpression':
        return this.visitCallExpression(node as CallExpression);
      
      case 'MemberExpression':
        return this.visitMemberExpression(node as MemberExpression);
      
      case 'NewExpression':
        return this.visitNewExpression(node as NewExpression);
      
      case 'ArrayExpression':
        return this.visitArrayExpression(node as ArrayExpression);
      
      case 'ObjectExpression':
        return this.visitObjectExpression(node as ObjectExpression);
      
      case 'AssignmentExpression':
        return this.visitAssignmentExpression(node as any);
      
      default:
        return this.visitChildren(node);
    }
  }

  /**
   * Visiter un programme
   */
  private visitProgram(program: Program): Type {
    for (const statement of program.body) {
      this.visit(statement);
    }
    return this.typeSystem.anyType;
  }

  /**
   * Visiter une déclaration de variable
   */
  private visitVariableDeclaration(node: VariableDeclaration): Type {
    for (const declarator of node.declarations) {
      this.visitVariableDeclarator(declarator);
    }
    return this.typeSystem.anyType;
  }

  /**
   * Visiter un déclarateur de variable
   */
  private visitVariableDeclarator(node: VariableDeclarator): Type {
    // Obtenir le type de l'initialisation
    let type: Type;
    
    if (node.init) {
      type = this.visit(node.init);
    } else {
      // Pas d'initialisation, type any par défaut
      type = this.typeSystem.anyType;
    }
    
    // Stocker le type dans le symbole
    const symbol = this.symbolTable.getSymbol(node.id.name);
    if (symbol) {
      symbol.valueType = type;
    }
    
    return type;
  }

  /**
   * Visiter une déclaration de fonction
   */
  private visitFunctionDeclaration(node: FunctionDeclaration): Type {
    const prevFunction = this.currentFunction;
    this.currentFunction = node;
    
    // Créer le type de la fonction
    const returnType = this.typeSystem.anyType; // À améliorer avec les annotations de type
    const paramTypes = node.params.map(() => this.typeSystem.anyType);
    const functionType = new FunctionType(returnType, paramTypes);
    
    // Stocker le type dans le symbole
    if (node.id) {
      const symbol = this.symbolTable.getSymbol(node.id.name);
      if (symbol) {
        symbol.valueType = functionType;
      }
    }
    
    // Vérifier le corps
    this.visit(node.body);
    
    this.currentFunction = prevFunction;
    return functionType;
  }

  /**
   * Visiter une expression de fonction
   */
  private visitFunctionExpression(node: FunctionExpression): Type {
    const prevFunction = this.currentFunction;
    this.currentFunction = node;
    
    // Créer le type de la fonction
    const returnType = this.typeSystem.anyType;
    const paramTypes = node.params.map(() => this.typeSystem.anyType);
    const functionType = new FunctionType(returnType, paramTypes);
    
    // Stocker le type dans le symbole
    if (node.name) {
      const symbol = this.symbolTable.getSymbol(node.name.name);
      if (symbol) {
        symbol.valueType = functionType;
      }
    }
    
    // Vérifier le corps
    this.visit(node.body);
    
    this.currentFunction = prevFunction;
    return functionType;
  }

  /**
   * Visiter une expression de fonction fléchée
   */
  private visitArrowFunctionExpression(node: ArrowFunctionExpression): Type {
    const prevFunction = this.currentFunction;
    this.currentFunction = node;
    
    // Créer le type de la fonction
    const returnType = this.typeSystem.anyType;
    const paramTypes = node.params.map(() => this.typeSystem.anyType);
    const functionType = new FunctionType(returnType, paramTypes);
    
    // Vérifier le corps
    this.visit(node.body);
    
    this.currentFunction = prevFunction;
    return functionType;
  }

  /**
   * Visiter une déclaration de classe
   */
  private visitClassDeclaration(node: ClassDeclaration): Type {
    const prevClass = this.currentClass;
    this.currentClass = node;
    
    // Créer le type de la classe
    const classType = new CompositeType(node.id.name, TypeKind.Class);
    
    // Stocker le type dans le symbole
    const symbol = this.symbolTable.getSymbol(node.id.name);
    if (symbol) {
      symbol.valueType = classType;
    }
    
    // Vérifier le corps
    this.visit(node.body);
    
    this.currentClass = prevClass;
    return classType;
  }

  /**
   * Visiter une déclaration d'interface
   */
  private visitInterfaceDeclaration(node: InterfaceDeclaration): Type {
    const prevInterface = this.currentInterface;
    this.currentInterface = node;
    
    // Créer le type de l'interface
    const interfaceType = new CompositeType(node.id.name, TypeKind.Interface);
    
    // Stocker le type dans le symbole
    const symbol = this.symbolTable.getSymbol(node.id.name);
    if (symbol) {
      symbol.valueType = interfaceType;
    }
    
    // Vérifier le corps
    this.visit(node.body);
    
    this.currentInterface = prevInterface;
    return interfaceType;
  }

  /**
   * Visiter un statement return
   */
  private visitReturnStatement(node: ReturnStatement): Type {
    if (!this.currentFunction) {
      this.diagnostics.addError(
        ErrorCode.SEMANTIC_ERROR,
        `'return' can only be used inside a function`,
        node.location
      );
      return this.typeSystem.anyType;
    }
    
    if (node.argument) {
      const type = this.visit(node.argument);
      
      // Vérifier la compatibilité avec le type de retour attendu
      if (this.expectedReturnType) {
        if (!this.typeSystem.isAssignable(type, this.expectedReturnType)) {
          this.diagnostics.addError(
            ErrorCode.INCOMPATIBLE_TYPES,
            `Type '${type.toString()}' is not assignable to type '${this.expectedReturnType.toString()}'`,
            node.argument.location
          );
        }
      }
      
      return type;
    }
    
    return this.typeSystem.voidType;
  }

  /**
   * Visiter un littéral
   */
  private visitLiteral(node: Literal): Type {
    switch (node.tokenType) {
      case 'INTEGER':
      case 'FLOAT':
        return this.typeSystem.numberType;
      
      case 'STRING':
        return this.typeSystem.stringType;
      
      case 'BOOLEAN':
        return this.typeSystem.booleanType;
      
      case 'NULL':
        return this.typeSystem.nullType;
      
      default:
        return this.typeSystem.anyType;
    }
  }

  /**
   * Visiter un identifiant
   */
  private visitIdentifier(node: Identifier): Type {
    // Obtenir le symbole
    const symbol = this.symbolTable.getSymbol(node.name);
    
    if (!symbol) {
      this.diagnostics.addError(
        ErrorCode.UNDECLARED_IDENTIFIER,
        `Identifier '${node.name}' has not been declared`,
        node.location
      );
      return this.typeSystem.anyType;
    }
    
    // Retourner le type du symbole
    if (symbol.valueType) {
      return symbol.valueType;
    }
    
    // Type par défaut
    return this.typeSystem.anyType;
  }

  /**
   * Visiter une expression binaire
   */
  private visitBinaryExpression(node: BinaryExpression): Type {
    const leftType = this.visit(node.left);
    const rightType = this.visit(node.right);
    
    // Vérifier la compatibilité des opérandes
    switch (node.operator) {
      case 'PLUS':
      case 'MINUS':
      case 'MULTIPLY':
      case 'DIVIDE':
      case 'MODULO':
        // Opérations arithmétiques
        if (!this.typeSystem.isNumeric(leftType) || !this.typeSystem.isNumeric(rightType)) {
          this.diagnostics.addError(
            ErrorCode.INCOMPATIBLE_TYPES,
            `Operator '${node.operator}' cannot be applied to types '${leftType.toString()}' and '${rightType.toString()}'`,
            node.location
          );
        }
        return this.typeSystem.numberType;
      
      case 'EQUAL':
      case 'NOT_EQUAL':
        // Comparaison d'égalité
        return this.typeSystem.booleanType;
      
      case 'GREATER':
      case 'LESS':
      case 'GREATER_EQUAL':
      case 'LESS_EQUAL':
        // Comparaison de relation
        if (!this.typeSystem.isComparable(leftType, rightType)) {
          this.diagnostics.addError(
            ErrorCode.INCOMPATIBLE_TYPES,
            `Operator '${node.operator}' cannot be applied to types '${leftType.toString()}' and '${rightType.toString()}'`,
            node.location
          );
        }
        return this.typeSystem.booleanType;
      
      case 'AND':
      case 'OR':
        // Opérations logiques
        if (!this.typeSystem.isBoolean(leftType) || !this.typeSystem.isBoolean(rightType)) {
          this.diagnostics.addError(
            ErrorCode.INCOMPATIBLE_TYPES,
            `Operator '${node.operator}' cannot be applied to types '${leftType.toString()}' and '${rightType.toString()}'`,
            node.location
          );
        }
        return this.typeSystem.booleanType;
      
      case 'INSTANCEOF':
        // Vérification d'instance
        if (!this.typeSystem.isObject(rightType)) {
          this.diagnostics.addError(
            ErrorCode.INCOMPATIBLE_TYPES,
            `Right operand of 'instanceof' must be a type`,
            node.location
          );
        }
        return this.typeSystem.booleanType;
      
      default:
        return this.typeSystem.anyType;
    }
  }

  /**
   * Visiter une expression unaire
   */
  private visitUnaryExpression(node: UnaryExpression): Type {
    const operandType = this.visit(node.operand);
    
    switch (node.operator) {
      case 'PLUS':
      case 'MINUS':
        if (!this.typeSystem.isNumeric(operandType)) {
          this.diagnostics.addError(
            ErrorCode.INCOMPATIBLE_TYPES,
            `Operator '${node.operator}' cannot be applied to type '${operandType.toString()}'`,
            node.location
          );
        }
        return this.typeSystem.numberType;
      
      case 'NOT':
        if (!this.typeSystem.isBoolean(operandType)) {
          this.diagnostics.addError(
            ErrorCode.INCOMPATIBLE_TYPES,
            `Operator '!' cannot be applied to type '${operandType.toString()}'`,
            node.location
          );
        }
        return this.typeSystem.booleanType;
      
      case 'TYPEOF':
        return this.typeSystem.stringType;
      
      case 'VOID':
        return this.typeSystem.voidType;
      
      case 'DELETE':
        return this.typeSystem.booleanType;
      
      default:
        return this.typeSystem.anyType;
    }
  }

  /**
   * Visiter un appel de fonction
   */
  private visitCallExpression(node: CallExpression): Type {
    const calleeType = this.visit(node.callee);
    
    // Vérifier si le callee est une fonction
    if (!this.typeSystem.isFunction(calleeType)) {
      this.diagnostics.addError(
        ErrorCode.TYPE_ERROR,
        `Expression is not callable`,
        node.callee.location || node.location
      );
      return this.typeSystem.anyType;
    }
    
    const functionType = calleeType as FunctionType;
    
    // Vérifier le nombre d'arguments
    if (node.arguments.length !== functionType.parameters.length) {
      this.diagnostics.addError(
        ErrorCode.TYPE_ERROR,
        `Expected ${functionType.parameters.length} arguments, but got ${node.arguments.length}`,
        node.location
      );
    }
    
    // Vérifier les types des arguments
    for (let i = 0; i < Math.min(node.arguments.length, functionType.parameters.length); i++) {
      const argType = this.visit(node.arguments[i]);
      const paramType = functionType.parameters[i];
      
      if (!this.typeSystem.isAssignable(argType, paramType)) {
        this.diagnostics.addError(
          ErrorCode.INCOMPATIBLE_TYPES,
          `Argument of type '${argType.toString()}' is not assignable to parameter of type '${paramType.toString()}'`,
          node.arguments[i].location
        );
      }
    }
    
    return functionType.returnType;
  }

  /**
   * Visiter un accès membre
   */
  private visitMemberExpression(node: MemberExpression): Type {
    const objectType = this.visit(node.object);
    
    // Vérifier si l'objet est un objet
    if (!this.typeSystem.isObject(objectType) && !this.typeSystem.isAny(objectType)) {
      this.diagnostics.addError(
        ErrorCode.TYPE_ERROR,
        `Cannot read property '${node.property.toString()}' of ${objectType.toString()}`,
        node.location
      );
      return this.typeSystem.anyType;
    }
    
    // Obtenir le type de la propriété
    const propertyName = node.computed 
      ? this.getPropertyName(node.property)
      : (node.property as Identifier).name;
    
    if (propertyName) {
      // Rechercher la propriété dans le type
      if (this.typeSystem.isComposite(objectType)) {
        const compositeType = objectType as CompositeType;
        const propertyType = compositeType.getProperty(propertyName);
        if (propertyType) {
          return propertyType;
        }
      }
      
      // Propriété non trouvée
      this.diagnostics.addError(
        ErrorCode.TYPE_ERROR,
        `Property '${propertyName}' does not exist on type '${objectType.toString()}'`,
        node.location
      );
    }
    
    return this.typeSystem.anyType;
  }

  /**
   * Obtenir le nom d'une propriété
   */
  private getPropertyName(node: Expression): string | null {
    if (node.type === 'Identifier') {
      return (node as Identifier).name;
    } else if (node.type === 'Literal') {
      return String((node as Literal).value);
    }
    return null;
  }

  /**
   * Visiter une expression new
   */
  private visitNewExpression(node: NewExpression): Type {
    const calleeType = this.visit(node.callee);
    
    // Vérifier si le callee est une classe ou une fonction constructeur
    if (!this.typeSystem.isClass(calleeType) && !this.typeSystem.isFunction(calleeType)) {
      this.diagnostics.addError(
        ErrorCode.TYPE_ERROR,
        `Constructor is not callable`,
        node.callee.location || node.location
      );
      return this.typeSystem.anyType;
    }
    
    // Retourner le type de l'instance
    if (this.typeSystem.isClass(calleeType)) {
      return calleeType;
    }
    
    if (this.typeSystem.isFunction(calleeType)) {
      return (calleeType as FunctionType).returnType;
    }
    
    return this.typeSystem.anyType;
  }

  /**
   * Visiter une expression de tableau
   */
  private visitArrayExpression(node: ArrayExpression): Type {
    const elementTypes = node.elements.map(element => this.visit(element));
    return new ArrayType(this.typeSystem.unionTypes(...elementTypes));
  }

  /**
   * Visiter une expression d'objet
   */
  private visitObjectExpression(node: ObjectExpression): Type {
    const properties = new Map<string, Type>();
    
    for (const property of node.properties) {
      if (property.type === 'Property') {
        const key = this.getPropertyName(property.key);
        if (key) {
          properties.set(key, this.visit(property.value));
        }
      }
    }
    
    return new ObjectType(properties);
  }

  /**
   * Visiter une expression d'assignation
   */
  private visitAssignmentExpression(node: any): Type {
    const valueType = this.visit(node.right);
    
    // Obtenir le type de la cible
    let targetType: Type;
    
    if (node.left.type === 'Identifier') {
      const identifier = node.left as Identifier;
      const symbol = this.symbolTable.getSymbol(identifier.name);
      
      if (!symbol) {
        this.diagnostics.addError(
          ErrorCode.UNDECLARED_IDENTIFIER,
          `Identifier '${identifier.name}' has not been declared`,
          identifier.location
        );
        return this.typeSystem.anyType;
      }
      
      targetType = symbol.valueType || this.typeSystem.anyType;
    } else if (node.left.type === 'MemberExpression') {
      targetType = this.visit(node.left);
    } else {
      targetType = this.visit(node.left);
    }
    
    // Vérifier la compatibilité
    if (!this.typeSystem.isAssignable(valueType, targetType)) {
      this.diagnostics.addError(
        ErrorCode.INCOMPATIBLE_TYPES,
        `Type '${valueType.toString()}' is not assignable to type '${targetType.toString()}'`,
        node.location
      );
    }
    
    return valueType;
  }

  /**
   * Visiter les enfants d'un nœud
   */
  private visitChildren(node: ASTNode): Type {
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
            this.visit(item);
          }
        }
      } else if (typeof value === 'object' && 'type' in value) {
        this.visit(value);
      }
    }
    
    return this.typeSystem.anyType;
  }

  /**
   * Obtenir le type d'une expression
   */
  public getType(node: Expression): Type {
    return this.visit(node);
  }

  /**
   * Vérifier la compatibilité des types
   */
  public isAssignable(from: Type, to: Type): boolean {
    return this.typeSystem.isAssignable(from, to);
  }

  /**
   * Obtenir le type système
   */
  public getTypeSystem(): TypeSystem {
    return this.typeSystem;
  }

  /**
   * Configurer le vérificateur de types
   */
  public configure(options: TypeCheckerOptions): void {
    this.config = options.config || this.config;
    this.diagnostics = options.diagnostics || this.diagnostics;
    this.symbolTable = options.symbolTable || this.symbolTable;
    this.typeSystem = options.typeSystem || this.typeSystem;
    this.strict = options.strict ?? this.strict;
  }

  /**
   * Réinitialiser le vérificateur de types
   */
  public reset(): void {
    this.currentFile = '<unknown>';
    this.currentFunction = null;
    this.currentClass = null;
    this.currentInterface = null;
    this.currentLoop = false;
    this.currentSwitch = false;
    this.typeStack = [];
    this.expectedReturnType = null;
  }
}
