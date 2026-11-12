/**
 * Inference - Inférence de types pour Zinga
 * 
 * Ce module est responsable de l'inférence des types dans les expressions
 * où le type n'est pas explicitement déclaré.
 */

import { ASTNode, Expression, Identifier, Literal, BinaryExpression, UnaryExpression, CallExpression, MemberExpression, NewExpression, ArrayExpression, ObjectExpression, FunctionExpression, ArrowFunctionExpression, VariableDeclarator } from '../ast/nodes';
import { Config } from '../config';
import { DiagnosticCollector, ErrorCode } from '../diagnostics/errors';
import { SymbolTable, Symbol, SymbolKind } from './symbols';
import { Type, TypeKind, PrimitiveType, CompositeType, FunctionType, ArrayType, ObjectType, UnionType, IntersectionType, GenericType, TypeParameter, TypeSystem, TypeConstraint } from '../types/type-system';
import { TypeChecker } from './type-checker';

export interface InferenceOptions {
  config?: Config;
  diagnostics?: DiagnosticCollector;
  symbolTable?: SymbolTable;
  typeSystem?: TypeSystem;
  typeChecker?: TypeChecker;
}

export class TypeInference {
  private config: Config;
  private diagnostics: DiagnosticCollector;
  private symbolTable: SymbolTable;
  private typeSystem: TypeSystem;
  private typeChecker: TypeChecker;
  
  // Contexte d'inférence
  private constraints: Map<string, TypeConstraint> = new Map();
  private typeVariables: Map<string, Type> = new Map();
  private nextTypeVarId: number = 0;

  constructor(options: InferenceOptions = {}) {
    this.config = options.config || new Config();
    this.diagnostics = options.diagnostics || new DiagnosticCollector();
    this.symbolTable = options.symbolTable || new SymbolTable();
    this.typeSystem = options.typeSystem || new TypeSystem();
    this.typeChecker = options.typeChecker || new TypeChecker({ typeSystem: this.typeSystem });
  }

  /**
   * Inférer le type d'une expression
   */
  public infer(expression: Expression): Type {
    return this.inferType(expression);
  }

  /**
   * Inférer le type d'un déclarateur de variable
   */
  public inferDeclarator(declarator: VariableDeclarator): Type {
    if (declarator.init) {
      return this.infer(declarator.init);
    }
    
    // Pas d'initialisation, type any par défaut
    return this.typeSystem.anyType;
  }

  /**
   * Inférer le type d'une expression
   */
  private inferType(expression: Expression): Type {
    const type = expression.type as string;
    
    switch (type) {
      case 'Literal':
        return this.inferLiteral(expression as Literal);
      
      case 'Identifier':
        return this.inferIdentifier(expression as Identifier);
      
      case 'BinaryExpression':
        return this.inferBinaryExpression(expression as BinaryExpression);
      
      case 'UnaryExpression':
        return this.inferUnaryExpression(expression as UnaryExpression);
      
      case 'CallExpression':
        return this.inferCallExpression(expression as CallExpression);
      
      case 'MemberExpression':
        return this.inferMemberExpression(expression as MemberExpression);
      
      case 'NewExpression':
        return this.inferNewExpression(expression as NewExpression);
      
      case 'ArrayExpression':
        return this.inferArrayExpression(expression as ArrayExpression);
      
      case 'ObjectExpression':
        return this.inferObjectExpression(expression as ObjectExpression);
      
      case 'FunctionExpression':
        return this.inferFunctionExpression(expression as FunctionExpression);
      
      case 'ArrowFunctionExpression':
        return this.inferArrowFunctionExpression(expression as ArrowFunctionExpression);
      
      default:
        return this.typeSystem.anyType;
    }
  }

  /**
   * Inférer le type d'un littéral
   */
  private inferLiteral(node: Literal): Type {
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
   * Inférer le type d'un identifiant
   */
  private inferIdentifier(node: Identifier): Type {
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
    
    // Si le symbole a déjà un type, le retourner
    if (symbol.valueType) {
      return symbol.valueType;
    }
    
    // Sinon, inférer le type à partir de la déclaration
    if (symbol.declaration) {
      const declaration = symbol.declaration as ASTNode;
      
      if (declaration.type === 'VariableDeclarator') {
        const declarator = declaration as VariableDeclarator;
        if (declarator.init) {
          const type = this.infer(declarator.init);
          symbol.valueType = type;
          return type;
        }
      } else if (declaration.type === 'FunctionDeclaration' || 
                 declaration.type === 'FunctionExpression' || 
                 declaration.type === 'ArrowFunctionExpression') {
        const func = declaration as FunctionExpression | ArrowFunctionExpression;
        const returnType = this.typeSystem.anyType; // À améliorer
        const paramTypes = func.params.map(() => this.typeSystem.anyType);
        const functionType = new FunctionType(returnType, paramTypes);
        symbol.valueType = functionType;
        return functionType;
      } else if (declaration.type === 'ClassDeclaration') {
        const classDecl = declaration as any;
        const classType = new CompositeType(classDecl.id.name, TypeKind.Class);
        symbol.valueType = classType;
        return classType;
      }
    }
    
    // Type par défaut
    return this.typeSystem.anyType;
  }

  /**
   * Inférer le type d'une expression binaire
   */
  private inferBinaryExpression(node: BinaryExpression): Type {
    const leftType = this.inferType(node.left);
    const rightType = this.inferType(node.right);
    
    switch (node.operator) {
      case 'PLUS':
      case 'MINUS':
      case 'MULTIPLY':
      case 'DIVIDE':
      case 'MODULO':
        // Opérations arithmétiques
        if (this.typeSystem.isNumeric(leftType) && this.typeSystem.isNumeric(rightType)) {
          return this.typeSystem.numberType;
        }
        // Concaténation de chaînes
        if (this.typeSystem.isString(leftType) || this.typeSystem.isString(rightType)) {
          return this.typeSystem.stringType;
        }
        return this.typeSystem.anyType;
      
      case 'EQUAL':
      case 'NOT_EQUAL':
      case 'GREATER':
      case 'LESS':
      case 'GREATER_EQUAL':
      case 'LESS_EQUAL':
        // Comparaisons
        return this.typeSystem.booleanType;
      
      case 'AND':
      case 'OR':
        // Opérations logiques
        return this.typeSystem.booleanType;
      
      case 'INSTANCEOF':
        return this.typeSystem.booleanType;
      
      case 'IN':
        return this.typeSystem.booleanType;
      
      case 'ASSIGN':
        // Assignation
        return leftType;
      
      default:
        return this.typeSystem.anyType;
    }
  }

  /**
   * Inférer le type d'une expression unaire
   */
  private inferUnaryExpression(node: UnaryExpression): Type {
    const operandType = this.inferType(node.operand);
    
    switch (node.operator) {
      case 'PLUS':
      case 'MINUS':
        if (this.typeSystem.isNumeric(operandType)) {
          return this.typeSystem.numberType;
        }
        return this.typeSystem.anyType;
      
      case 'NOT':
        if (this.typeSystem.isBoolean(operandType)) {
          return this.typeSystem.booleanType;
        }
        return this.typeSystem.anyType;
      
      case 'TYPEOF':
        return this.typeSystem.stringType;
      
      case 'VOID':
        return this.typeSystem.voidType;
      
      case 'DELETE':
        return this.typeSystem.booleanType;
      
      case 'INCREMENT':
      case 'DECREMENT':
        return operandType;
      
      default:
        return this.typeSystem.anyType;
    }
  }

  /**
   * Inférer le type d'un appel de fonction
   */
  private inferCallExpression(node: CallExpression): Type {
    const calleeType = this.inferType(node.callee);
    
    // Si le callee est une fonction, retourner son type de retour
    if (this.typeSystem.isFunction(calleeType)) {
      return (calleeType as FunctionType).returnType;
    }
    
    // Si le callee est une classe, retourner une instance de la classe
    if (this.typeSystem.isClass(calleeType)) {
      return calleeType;
    }
    
    // Type par défaut
    return this.typeSystem.anyType;
  }

  /**
   * Inférer le type d'un accès membre
   */
  private inferMemberExpression(node: MemberExpression): Type {
    const objectType = this.inferType(node.object);
    
    // Si l'objet est un type composite, obtenir le type de la propriété
    if (this.typeSystem.isComposite(objectType)) {
      const compositeType = objectType as CompositeType;
      const propertyName = node.computed 
        ? this.getPropertyName(node.property)
        : (node.property as Identifier).name;
      
      if (propertyName) {
        const propertyType = compositeType.getProperty(propertyName);
        if (propertyType) {
          return propertyType;
        }
      }
    }
    
    // Type par défaut
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
   * Inférer le type d'une expression new
   */
  private inferNewExpression(node: NewExpression): Type {
    const calleeType = this.inferType(node.callee);
    
    // Si le callee est une classe, retourner le type de la classe
    if (this.typeSystem.isClass(calleeType)) {
      return calleeType;
    }
    
    // Si le callee est une fonction constructeur, retourner son type de retour
    if (this.typeSystem.isFunction(calleeType)) {
      return (calleeType as FunctionType).returnType;
    }
    
    // Type par défaut
    return this.typeSystem.anyType;
  }

  /**
   * Inférer le type d'une expression de tableau
   */
  private inferArrayExpression(node: ArrayExpression): Type {
    const elementTypes = node.elements.map(element => this.inferType(element));
    return new ArrayType(this.typeSystem.unionTypes(...elementTypes));
  }

  /**
   * Inférer le type d'une expression d'objet
   */
  private inferObjectExpression(node: ObjectExpression): Type {
    const properties = new Map<string, Type>();
    
    for (const property of node.properties) {
      if (property.type === 'Property') {
        const key = this.getPropertyName(property.key);
        if (key) {
          properties.set(key, this.inferType(property.value));
        }
      }
    }
    
    return new ObjectType(properties);
  }

  /**
   * Inférer le type d'une expression de fonction
   */
  private inferFunctionExpression(node: FunctionExpression): Type {
    // Inférer les types des paramètres
    const paramTypes = node.params.map(param => {
      // Si le paramètre a une annotation de type, l'utiliser
      // Sinon, type any par défaut
      return this.typeSystem.anyType;
    });
    
    // Inférer le type de retour
    const returnType = this.inferReturnType(node.body);
    
    return new FunctionType(returnType, paramTypes);
  }

  /**
   * Inférer le type d'une expression de fonction fléchée
   */
  private inferArrowFunctionExpression(node: ArrowFunctionExpression): Type {
    // Inférer les types des paramètres
    const paramTypes = node.params.map(param => this.typeSystem.anyType);
    
    // Inférer le type de retour
    const returnType = this.inferReturnType(node.body);
    
    return new FunctionType(returnType, paramTypes);
  }

  /**
   * Inférer le type de retour d'un corps de fonction
   */
  private inferReturnType(body: any): Type {
    if (body.type === 'BlockStatement') {
      // Rechercher les statements return
      for (const statement of body.body) {
        if (statement.type === 'ReturnStatement') {
          const returnStmt = statement as any;
          if (returnStmt.argument) {
            return this.inferType(returnStmt.argument);
          }
        }
      }
      // Pas de return, type void
      return this.typeSystem.voidType;
    } else {
      // Expression unique, retourner son type
      return this.inferType(body as Expression);
    }
  }

  /**
   * Inférer les types avec contraintes
   */
  public inferWithConstraints(
    expression: Expression,
    constraints: TypeConstraint[]
  ): Type {
    // Sauvegarder les contraintes actuelles
    const savedConstraints = new Map(this.constraints);
    
    try {
      // Appliquer les nouvelles contraintes
      for (const constraint of constraints) {
        this.constraints.set(constraint.variable, constraint);
      }
      
      // Inférer le type
      return this.infer(expression);
    } finally {
      // Restaurer les contraintes
      this.constraints = savedConstraints;
    }
  }

  /**
   * Créer une variable de type
   */
  public createTypeVariable(prefix: string = 'T'): Type {
    const id = `${prefix}${this.nextTypeVarId++}`;
    const typeVar = new GenericType(id);
    this.typeVariables.set(id, typeVar);
    return typeVar;
  }

  /**
   * Obtenir une variable de type
   */
  public getTypeVariable(id: string): Type | undefined {
    return this.typeVariables.get(id);
  }

  /**
   * Résoudre une variable de type
   */
  public resolveTypeVariable(id: string, type: Type): void {
    const typeVar = this.typeVariables.get(id);
    if (typeVar && typeVar instanceof GenericType) {
      typeVar.resolve(type);
    }
  }

  /**
   * Unifier deux types
   */
  public unify(type1: Type, type2: Type): Type | null {
    // Si les types sont identiques, retourner l'un d'eux
    if (this.typeSystem.areEqual(type1, type2)) {
      return type1;
    }
    
    // Si l'un des types est any, retourner l'autre
    if (this.typeSystem.isAny(type1)) {
      return type2;
    }
    if (this.typeSystem.isAny(type2)) {
      return type1;
    }
    
    // Si les deux sont des variables de type, les unifier
    if (type1 instanceof GenericType && type2 instanceof GenericType) {
      // Créer une contrainte d'égalité
      this.constraints.set(type1.id, { variable: type2.id, constraint: 'equals' });
      this.constraints.set(type2.id, { variable: type1.id, constraint: 'equals' });
      return type1;
    }
    
    // Si l'un est une variable de type, le résoudre avec l'autre
    if (type1 instanceof GenericType) {
      this.resolveTypeVariable(type1.id, type2);
      return type2;
    }
    if (type2 instanceof GenericType) {
      this.resolveTypeVariable(type2.id, type1);
      return type1;
    }
    
    // Si les deux sont des types primitifs, vérifier la compatibilité
    if (type1 instanceof PrimitiveType && type2 instanceof PrimitiveType) {
      if (type1.kind === type2.kind) {
        return type1;
      }
      return null;
    }
    
    // Si les deux sont des types composites, vérifier la compatibilité structurelle
    if (type1 instanceof CompositeType && type2 instanceof CompositeType) {
      if (type1.kind === type2.kind) {
        // Vérifier les propriétés
        const properties1 = type1.getProperties();
        const properties2 = type2.getProperties();
        
        if (properties1.size === properties2.size) {
          let compatible = true;
          for (const [key, propType1] of properties1) {
            const propType2 = properties2.get(key);
            if (!propType2 || !this.unify(propType1, propType2)) {
              compatible = false;
              break;
            }
          }
          if (compatible) {
            return type1;
          }
        }
      }
      return null;
    }
    
    // Si les deux sont des types fonction
    if (type1 instanceof FunctionType && type2 instanceof FunctionType) {
      // Vérifier les paramètres (contravariance)
      if (type1.parameters.length === type2.parameters.length) {
        let compatible = true;
        for (let i = 0; i < type1.parameters.length; i++) {
          if (!this.unify(type2.parameters[i], type1.parameters[i])) {
            compatible = false;
            break;
          }
        }
        if (compatible) {
          // Vérifier le type de retour (covariance)
          if (this.unify(type1.returnType, type2.returnType)) {
            return type1;
          }
        }
      }
      return null;
    }
    
    // Si les deux sont des types tableau
    if (type1 instanceof ArrayType && type2 instanceof ArrayType) {
      const elementType = this.unify(type1.elementType, type2.elementType);
      if (elementType) {
        return new ArrayType(elementType);
      }
      return null;
    }
    
    // Types incompatibles
    return null;
  }

  /**
   * Instancier un type générique
   */
  public instantiateGenericType(
    genericType: GenericType,
    typeArguments: Type[]
  ): Type {
    // Créer une copie du type générique
    const instance = new GenericType(genericType.id);
    
    // Appliquer les arguments de type
    const typeParams = genericType.typeParameters || [];
    for (let i = 0; i < Math.min(typeParams.length, typeArguments.length); i++) {
      instance.addTypeArgument(typeArguments[i]);
    }
    
    return instance;
  }

  /**
   * Obtenir le type système
   */
  public getTypeSystem(): TypeSystem {
    return this.typeSystem;
  }

  /**
   * Configurer l'inférence de types
   */
  public configure(options: InferenceOptions): void {
    this.config = options.config || this.config;
    this.diagnostics = options.diagnostics || this.diagnostics;
    this.symbolTable = options.symbolTable || this.symbolTable;
    this.typeSystem = options.typeSystem || this.typeSystem;
    this.typeChecker = options.typeChecker || this.typeChecker;
  }

  /**
   * Réinitialiser l'inférence de types
   */
  public reset(): void {
    this.constraints.clear();
    this.typeVariables.clear();
    this.nextTypeVarId = 0;
  }
}
