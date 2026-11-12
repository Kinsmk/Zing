/**
 * TypeSystem - Système de types pour Zinga
 * 
 * Ce module définit le système de types complet de Zinga,
 * incluant les types primitifs, composites, génériques, etc.
 */

import { SourceLocation } from '../compiler/lexer/positions';

/**
 * Type de type
 */
export enum TypeKind {
  // Types primitifs
  Any = 'Any',
  Unknown = 'Unknown',
  Never = 'Never',
  Void = 'Void',
  Null = 'Null',
  Undefined = 'Undefined',
  Boolean = 'Boolean',
  Number = 'Number',
  String = 'String',
  Symbol = 'Symbol',
  BigInt = 'BigInt',
  
  // Types composites
  Array = 'Array',
  Tuple = 'Tuple',
  Object = 'Object',
  Function = 'Function',
  Class = 'Class',
  Interface = 'Interface',
  Enum = 'Enum',
  
  // Types génériques
  Generic = 'Generic',
  TypeParameter = 'TypeParameter',
  
  // Types unions
  Union = 'Union',
  Intersection = 'Intersection',
  
  // Types littéraux
  Literal = 'Literal',
  
  // Types spéciaux
  This = 'This',
  Super = 'Super',
}

/**
 * Interface de base pour tous les types
 */
export interface Type {
  kind: TypeKind;
  toString(): string;
  toJSON(): any;
  equals(other: Type): boolean;
  clone(): Type;
}

/**
 * Type primitif
 */
export class PrimitiveType implements Type {
  kind: TypeKind;
  name: string;

  constructor(kind: TypeKind, name?: string) {
    this.kind = kind;
    this.name = name || TypeKind[kind];
  }

  toString(): string {
    return this.name.toLowerCase();
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      name: this.name,
    };
  }

  equals(other: Type): boolean {
    return other instanceof PrimitiveType && this.kind === other.kind;
  }

  clone(): Type {
    return new PrimitiveType(this.kind, this.name);
  }
}

/**
 * Type any
 */
export class AnyType extends PrimitiveType {
  constructor() {
    super(TypeKind.Any, 'any');
  }
}

/**
 * Type unknown
 */
export class UnknownType extends PrimitiveType {
  constructor() {
    super(TypeKind.Unknown, 'unknown');
  }
}

/**
 * Type never
 */
export class NeverType extends PrimitiveType {
  constructor() {
    super(TypeKind.Never, 'never');
  }
}

/**
 * Type void
 */
export class VoidType extends PrimitiveType {
  constructor() {
    super(TypeKind.Void, 'void');
  }
}

/**
 * Type null
 */
export class NullType extends PrimitiveType {
  constructor() {
    super(TypeKind.Null, 'null');
  }
}

/**
 * Type undefined
 */
export class UndefinedType extends PrimitiveType {
  constructor() {
    super(TypeKind.Undefined, 'undefined');
  }
}

/**
 * Type boolean
 */
export class BooleanType extends PrimitiveType {
  constructor() {
    super(TypeKind.Boolean, 'boolean');
  }
}

/**
 * Type number
 */
export class NumberType extends PrimitiveType {
  constructor() {
    super(TypeKind.Number, 'number');
  }
}

/**
 * Type string
 */
export class StringType extends PrimitiveType {
  constructor() {
    super(TypeKind.String, 'string');
  }
}

/**
 * Type symbol
 */
export class SymbolType extends PrimitiveType {
  constructor() {
    super(TypeKind.Symbol, 'symbol');
  }
}

/**
 * Type bigint
 */
export class BigIntType extends PrimitiveType {
  constructor() {
    super(TypeKind.BigInt, 'bigint');
  }
}

/**
 * Type littéral
 */
export class LiteralType implements Type {
  kind: TypeKind = TypeKind.Literal;
  value: any;
  baseType: Type;

  constructor(value: any, baseType: Type) {
    this.value = value;
    this.baseType = baseType;
  }

  toString(): string {
    return `"${this.value}"`;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      value: this.value,
      baseType: this.baseType.toJSON(),
    };
  }

  equals(other: Type): boolean {
    return other instanceof LiteralType && 
           this.value === other.value && 
           this.baseType.equals(other.baseType);
  }

  clone(): Type {
    return new LiteralType(this.value, this.baseType.clone());
  }
}

/**
 * Type tableau
 */
export class ArrayType implements Type {
  kind: TypeKind = TypeKind.Array;
  elementType: Type;

  constructor(elementType: Type) {
    this.elementType = elementType;
  }

  toString(): string {
    return `${this.elementType.toString()}[]`;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      elementType: this.elementType.toJSON(),
    };
  }

  equals(other: Type): boolean {
    return other instanceof ArrayType && 
           this.elementType.equals(other.elementType);
  }

  clone(): Type {
    return new ArrayType(this.elementType.clone());
  }
}

/**
 * Type tuple
 */
export class TupleType implements Type {
  kind: TypeKind = TypeKind.Tuple;
  elementTypes: Type[];
  optionalTypes?: Type[];
  restType?: Type;

  constructor(elementTypes: Type[], optionalTypes?: Type[], restType?: Type) {
    this.elementTypes = elementTypes;
    this.optionalTypes = optionalTypes;
    this.restType = restType;
  }

  toString(): string {
    const elements = this.elementTypes.map(t => t.toString()).join(', ');
    if (this.restType) {
      return `[${elements}, ...${this.restType.toString()}]`;
    }
    return `[${elements}]`;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      elementTypes: this.elementTypes.map(t => t.toJSON()),
      optionalTypes: this.optionalTypes?.map(t => t.toJSON()),
      restType: this.restType?.toJSON(),
    };
  }

  equals(other: Type): boolean {
    if (!(other instanceof TupleType)) {
      return false;
    }
    
    if (this.elementTypes.length !== other.elementTypes.length) {
      return false;
    }
    
    for (let i = 0; i < this.elementTypes.length; i++) {
      if (!this.elementTypes[i].equals(other.elementTypes[i])) {
        return false;
      }
    }
    
    if (this.restType && other.restType) {
      return this.restType.equals(other.restType);
    }
    
    return this.restType === other.restType;
  }

  clone(): Type {
    return new TupleType(
      this.elementTypes.map(t => t.clone()),
      this.optionalTypes?.map(t => t.clone()),
      this.restType?.clone()
    );
  }
}

/**
 * Type objet
 */
export class ObjectType implements Type {
  kind: TypeKind = TypeKind.Object;
  properties: Map<string, Type>;
  indexType?: Type;
  callSignature?: FunctionType;
  constructSignature?: FunctionType;

  constructor(properties: Map<string, Type> = new Map()) {
    this.properties = properties;
  }

  toString(): string {
    const props = Array.from(this.properties.entries())
      .map(([name, type]) => `${name}: ${type.toString()}`)
      .join(', ');
    return `{${props}}`;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      properties: Object.fromEntries(this.properties),
      indexType: this.indexType?.toJSON(),
      callSignature: this.callSignature?.toJSON(),
      constructSignature: this.constructSignature?.toJSON(),
    };
  }

  equals(other: Type): boolean {
    if (!(other instanceof ObjectType)) {
      return false;
    }
    
    if (this.properties.size !== other.properties.size) {
      return false;
    }
    
    for (const [name, type] of this.properties) {
      const otherType = other.properties.get(name);
      if (!otherType || !type.equals(otherType)) {
        return false;
      }
    }
    
    return true;
  }

  clone(): Type {
    const properties = new Map<string, Type>();
    for (const [name, type] of this.properties) {
      properties.set(name, type.clone());
    }
    return new ObjectType(
      properties,
      this.indexType?.clone(),
      this.callSignature?.clone(),
      this.constructSignature?.clone()
    );
  }

  /**
   * Obtenir une propriété
   */
  getProperty(name: string): Type | undefined {
    return this.properties.get(name);
  }

  /**
   * Définir une propriété
   */
  setProperty(name: string, type: Type): void {
    this.properties.set(name, type);
  }

  /**
   * Supprimer une propriété
   */
  removeProperty(name: string): boolean {
    return this.properties.delete(name);
  }

  /**
   * Obtenir toutes les propriétés
   */
  getProperties(): Map<string, Type> {
    return new Map(this.properties);
  }
}

/**
 * Type fonction
 */
export class FunctionType implements Type {
  kind: TypeKind = TypeKind.Function;
  returnType: Type;
  parameters: Type[];
  parameterNames: string[];
  thisType?: Type;
  isArrow: boolean = false;
  isMethod: boolean = false;
  isConstructor: boolean = false;
  isAsync: boolean = false;
  isGenerator: boolean = false;

  constructor(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ) {
    this.returnType = returnType;
    this.parameters = parameters;
    this.parameterNames = parameterNames;
  }

  toString(): string {
    const params = this.parameters.map((t, i) => 
      `${this.parameterNames[i] || `arg${i}`}: ${t.toString()}`
    ).join(', ');
    return `(${params}) => ${this.returnType.toString()}`;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      returnType: this.returnType.toJSON(),
      parameters: this.parameters.map(t => t.toJSON()),
      parameterNames: this.parameterNames,
      thisType: this.thisType?.toJSON(),
      isArrow: this.isArrow,
      isMethod: this.isMethod,
      isConstructor: this.isConstructor,
      isAsync: this.isAsync,
      isGenerator: this.isGenerator,
    };
  }

  equals(other: Type): boolean {
    if (!(other instanceof FunctionType)) {
      return false;
    }
    
    if (this.parameters.length !== other.parameters.length) {
      return false;
    }
    
    for (let i = 0; i < this.parameters.length; i++) {
      if (!this.parameters[i].equals(other.parameters[i])) {
        return false;
      }
    }
    
    return this.returnType.equals(other.returnType);
  }

  clone(): Type {
    return new FunctionType(
      this.returnType.clone(),
      this.parameters.map(t => t.clone()),
      [...this.parameterNames]
    );
  }
}

/**
 * Type composite (classe, interface, enum)
 */
export class CompositeType implements Type {
  kind: TypeKind;
  name: string;
  members: Map<string, Type> = new Map();
  typeParameters?: TypeParameter[];
  baseTypes: Type[] = [];
  implementedTypes: Type[] = [];

  constructor(name: string, kind: TypeKind) {
    this.name = name;
    this.kind = kind;
  }

  toString(): string {
    return this.name;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      name: this.name,
      members: Object.fromEntries(this.members),
      typeParameters: this.typeParameters?.map(t => t.toJSON()),
      baseTypes: this.baseTypes.map(t => t.toJSON()),
      implementedTypes: this.implementedTypes.map(t => t.toJSON()),
    };
  }

  equals(other: Type): boolean {
    if (!(other instanceof CompositeType)) {
      return false;
    }
    return this.name === other.name && this.kind === other.kind;
  }

  clone(): Type {
    const clone = new CompositeType(this.name, this.kind);
    clone.members = new Map(this.members);
    clone.typeParameters = this.typeParameters?.map(t => t.clone());
    clone.baseTypes = this.baseTypes.map(t => t.clone());
    clone.implementedTypes = this.implementedTypes.map(t => t.clone());
    return clone;
  }

  /**
   * Ajouter un membre
   */
  addMember(name: string, type: Type): void {
    this.members.set(name, type);
  }

  /**
   * Obtenir un membre
   */
  getMember(name: string): Type | undefined {
    return this.members.get(name);
  }

  /**
   * Obtenir une propriété (alias de getMember)
   */
  getProperty(name: string): Type | undefined {
    return this.getMember(name);
  }

  /**
   * Supprimer un membre
   */
  removeMember(name: string): boolean {
    return this.members.delete(name);
  }

  /**
   * Obtenir tous les membres
   */
  getMembers(): Map<string, Type> {
    return new Map(this.members);
  }

  /**
   * Ajouter un type de base
   */
  addBaseType(type: Type): void {
    this.baseTypes.push(type);
  }

  /**
   * Ajouter un type implémenté
   */
  addImplementedType(type: Type): void {
    this.implementedTypes.push(type);
  }
}

/**
 * Type générique
 */
export class GenericType implements Type {
  kind: TypeKind = TypeKind.Generic;
  id: string;
  name: string;
  typeParameters?: TypeParameter[];
  typeArguments: Type[] = [];
  constraint?: Type;
  defaultType?: Type;
  resolvedType?: Type;

  constructor(id: string, name?: string) {
    this.id = id;
    this.name = name || id;
  }

  toString(): string {
    if (this.resolvedType) {
      return this.resolvedType.toString();
    }
    return this.name;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      id: this.id,
      name: this.name,
      typeParameters: this.typeParameters?.map(t => t.toJSON()),
      typeArguments: this.typeArguments.map(t => t.toJSON()),
      constraint: this.constraint?.toJSON(),
      defaultType: this.defaultType?.toJSON(),
      resolvedType: this.resolvedType?.toJSON(),
    };
  }

  equals(other: Type): boolean {
    if (!(other instanceof GenericType)) {
      return false;
    }
    
    if (this.resolvedType && other.resolvedType) {
      return this.resolvedType.equals(other.resolvedType);
    }
    
    return this.id === other.id;
  }

  clone(): Type {
    const clone = new GenericType(this.id, this.name);
    clone.typeParameters = this.typeParameters?.map(t => t.clone());
    clone.typeArguments = this.typeArguments.map(t => t.clone());
    clone.constraint = this.constraint?.clone();
    clone.defaultType = this.defaultType?.clone();
    clone.resolvedType = this.resolvedType?.clone();
    return clone;
  }

  /**
   * Ajouter un paramètre de type
   */
  addTypeParameter(param: TypeParameter): void {
    if (!this.typeParameters) {
      this.typeParameters = [];
    }
    this.typeParameters.push(param);
  }

  /**
   * Ajouter un argument de type
   */
  addTypeArgument(arg: Type): void {
    this.typeArguments.push(arg);
  }

  /**
   * Résoudre le type
   */
  resolve(type: Type): void {
    this.resolvedType = type;
  }

  /**
   * Vérifier si le type est résolu
   */
  isResolved(): boolean {
    return this.resolvedType !== undefined;
  }
}

/**
 * Paramètre de type
 */
export class TypeParameter implements Type {
  kind: TypeKind = TypeKind.TypeParameter;
  name: string;
  constraint?: Type;
  defaultType?: Type;

  constructor(name: string, constraint?: Type, defaultType?: Type) {
    this.name = name;
    this.constraint = constraint;
    this.defaultType = defaultType;
  }

  toString(): string {
    let result = this.name;
    if (this.constraint) {
      result += ` extends ${this.constraint.toString()}`;
    }
    if (this.defaultType) {
      result += ` = ${this.defaultType.toString()}`;
    }
    return result;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      name: this.name,
      constraint: this.constraint?.toJSON(),
      defaultType: this.defaultType?.toJSON(),
    };
  }

  equals(other: Type): boolean {
    if (!(other instanceof TypeParameter)) {
      return false;
    }
    return this.name === other.name;
  }

  clone(): Type {
    return new TypeParameter(
      this.name,
      this.constraint?.clone(),
      this.defaultType?.clone()
    );
  }
}

/**
 * Type union
 */
export class UnionType implements Type {
  kind: TypeKind = TypeKind.Union;
  types: Type[];

  constructor(...types: Type[]) {
    this.types = types;
  }

  toString(): string {
    return this.types.map(t => t.toString()).join(' | ');
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      types: this.types.map(t => t.toJSON()),
    };
  }

  equals(other: Type): boolean {
    if (!(other instanceof UnionType)) {
      return false;
    }
    
    if (this.types.length !== other.types.length) {
      return false;
    }
    
    for (const type of this.types) {
      if (!other.types.some(t => t.equals(type))) {
        return false;
      }
    }
    
    return true;
  }

  clone(): Type {
    return new UnionType(...this.types.map(t => t.clone()));
  }

  /**
   * Ajouter un type à l'union
   */
  addType(type: Type): void {
    this.types.push(type);
  }

  /**
   * Vérifier si un type fait partie de l'union
   */
  contains(type: Type): boolean {
    return this.types.some(t => t.equals(type));
  }
}

/**
 * Type intersection
 */
export class IntersectionType implements Type {
  kind: TypeKind = TypeKind.Intersection;
  types: Type[];

  constructor(...types: Type[]) {
    this.types = types;
  }

  toString(): string {
    return this.types.map(t => t.toString()).join(' & ');
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      types: this.types.map(t => t.toJSON()),
    };
  }

  equals(other: Type): boolean {
    if (!(other instanceof IntersectionType)) {
      return false;
    }
    
    if (this.types.length !== other.types.length) {
      return false;
    }
    
    for (const type of this.types) {
      if (!other.types.some(t => t.equals(type))) {
        return false;
      }
    }
    
    return true;
  }

  clone(): Type {
    return new IntersectionType(...this.types.map(t => t.clone()));
  }

  /**
   * Ajouter un type à l'intersection
   */
  addType(type: Type): void {
    this.types.push(type);
  }
}

/**
 * Système de types
 */
export class TypeSystem {
  // Types primitifs
  readonly anyType: AnyType = new AnyType();
  readonly unknownType: UnknownType = new UnknownType();
  readonly neverType: NeverType = new NeverType();
  readonly voidType: VoidType = new VoidType();
  readonly nullType: NullType = new NullType();
  readonly undefinedType: UndefinedType = new UndefinedType();
  readonly booleanType: BooleanType = new BooleanType();
  readonly numberType: NumberType = new NumberType();
  readonly stringType: StringType = new StringType();
  readonly symbolType: SymbolType = new SymbolType();
  readonly bigIntType: BigIntType = new BigIntType();

  constructor() {}

  /**
   * Vérifier si un type est any
   */
  isAny(type: Type): type is AnyType {
    return type instanceof AnyType || type.kind === TypeKind.Any;
  }

  /**
   * Vérifier si un type est unknown
   */
  isUnknown(type: Type): type is UnknownType {
    return type instanceof UnknownType || type.kind === TypeKind.Unknown;
  }

  /**
   * Vérifier si un type est never
   */
  isNever(type: Type): type is NeverType {
    return type instanceof NeverType || type.kind === TypeKind.Never;
  }

  /**
   * Vérifier si un type est void
   */
  isVoid(type: Type): type is VoidType {
    return type instanceof VoidType || type.kind === TypeKind.Void;
  }

  /**
   * Vérifier si un type est null
   */
  isNull(type: Type): type is NullType {
    return type instanceof NullType || type.kind === TypeKind.Null;
  }

  /**
   * Vérifier si un type est undefined
   */
  isUndefined(type: Type): type is UndefinedType {
    return type instanceof UndefinedType || type.kind === TypeKind.Undefined;
  }

  /**
   * Vérifier si un type est boolean
   */
  isBoolean(type: Type): type is BooleanType {
    return type instanceof BooleanType || type.kind === TypeKind.Boolean;
  }

  /**
   * Vérifier si un type est number
   */
  isNumber(type: Type): type is NumberType {
    return type instanceof NumberType || type.kind === TypeKind.Number;
  }

  /**
   * Vérifier si un type est string
   */
  isString(type: Type): type is StringType {
    return type instanceof StringType || type.kind === TypeKind.String;
  }

  /**
   * Vérifier si un type est symbol
   */
  isSymbol(type: Type): type is SymbolType {
    return type instanceof SymbolType || type.kind === TypeKind.Symbol;
  }

  /**
   * Vérifier si un type est bigint
   */
  isBigInt(type: Type): type is BigIntType {
    return type instanceof BigIntType || type.kind === TypeKind.BigInt;
  }

  /**
   * Vérifier si un type est primitif
   */
  isPrimitive(type: Type): type is PrimitiveType {
    return type instanceof PrimitiveType || 
           type.kind === TypeKind.Any ||
           type.kind === TypeKind.Unknown ||
           type.kind === TypeKind.Never ||
           type.kind === TypeKind.Void ||
           type.kind === TypeKind.Null ||
           type.kind === TypeKind.Undefined ||
           type.kind === TypeKind.Boolean ||
           type.kind === TypeKind.Number ||
           type.kind === TypeKind.String ||
           type.kind === TypeKind.Symbol ||
           type.kind === TypeKind.BigInt;
  }

  /**
   * Vérifier si un type est numérique
   */
  isNumeric(type: Type): boolean {
    return this.isNumber(type) || 
           this.isBigInt(type) ||
           (type instanceof LiteralType && this.isNumeric(type.baseType));
  }

  /**
   * Vérifier si un type est un littéral
   */
  isLiteral(type: Type): type is LiteralType {
    return type instanceof LiteralType || type.kind === TypeKind.Literal;
  }

  /**
   * Vérifier si un type est un tableau
   */
  isArray(type: Type): type is ArrayType {
    return type instanceof ArrayType || type.kind === TypeKind.Array;
  }

  /**
   * Vérifier si un type est un tuple
   */
  isTuple(type: Type): type is TupleType {
    return type instanceof TupleType || type.kind === TypeKind.Tuple;
  }

  /**
   * Vérifier si un type est un objet
   */
  isObject(type: Type): type is ObjectType {
    return type instanceof ObjectType || type.kind === TypeKind.Object;
  }

  /**
   * Vérifier si un type est une fonction
   */
  isFunction(type: Type): type is FunctionType {
    return type instanceof FunctionType || type.kind === TypeKind.Function;
  }

  /**
   * Vérifier si un type est composite
   */
  isComposite(type: Type): type is CompositeType {
    return type instanceof CompositeType || 
           type.kind === TypeKind.Class ||
           type.kind === TypeKind.Interface ||
           type.kind === TypeKind.Enum;
  }

  /**
   * Vérifier si un type est une classe
   */
  isClass(type: Type): type is CompositeType {
    return type instanceof CompositeType && type.kind === TypeKind.Class;
  }

  /**
   * Vérifier si un type est une interface
   */
  isInterface(type: Type): type is CompositeType {
    return type instanceof CompositeType && type.kind === TypeKind.Interface;
  }

  /**
   * Vérifier si un type est un enum
   */
  isEnum(type: Type): type is CompositeType {
    return type instanceof CompositeType && type.kind === TypeKind.Enum;
  }

  /**
   * Vérifier si un type est générique
   */
  isGeneric(type: Type): type is GenericType {
    return type instanceof GenericType || type.kind === TypeKind.Generic;
  }

  /**
   * Vérifier si un type est un type paramètre
   */
  isTypeParameter(type: Type): type is TypeParameter {
    return type instanceof TypeParameter || type.kind === TypeKind.TypeParameter;
  }

  /**
   * Vérifier si un type est une union
   */
  isUnion(type: Type): type is UnionType {
    return type instanceof UnionType || type.kind === TypeKind.Union;
  }

  /**
   * Vérifier si un type est une intersection
   */
  isIntersection(type: Type): type is IntersectionType {
    return type instanceof IntersectionType || type.kind === TypeKind.Intersection;
  }

  /**
   * Vérifier si un type est comparable
   */
  isComparable(type1: Type, type2: Type): boolean {
    // Les types comparables sont: number, string, boolean, bigint
    const comparableKinds = [
      TypeKind.Number,
      TypeKind.String,
      TypeKind.Boolean,
      TypeKind.BigInt,
    ];
    
    return comparableKinds.includes(type1.kind) && 
           comparableKinds.includes(type2.kind) &&
           type1.kind === type2.kind;
  }

  /**
   * Vérifier si un type est assignable à un autre
   */
  isAssignable(from: Type, to: Type): boolean {
    // Any est assignable à tout
    if (this.isAny(from) || this.isAny(to)) {
      return true;
    }

    // Unknown est assignable à tout (mais pas l'inverse)
    if (this.isUnknown(from)) {
      return true;
    }

    // Never n'est assignable à rien (sauf never)
    if (this.isNever(from)) {
      return this.isNever(to);
    }

    // Void n'est assignable qu'à void
    if (this.isVoid(from)) {
      return this.isVoid(to);
    }

    // Null et undefined sont assignables à void
    if ((this.isNull(from) || this.isUndefined(from)) && this.isVoid(to)) {
      return true;
    }

    // Null et undefined sont assignables à leurs types respectifs
    if (this.isNull(from) && this.isNull(to)) {
      return true;
    }
    if (this.isUndefined(from) && this.isUndefined(to)) {
      return true;
    }

    // Null et undefined sont assignables à leurs unions
    if (this.isNull(from) || this.isUndefined(from)) {
      if (this.isUnion(to)) {
        return to.types.some(t => this.isNull(t) || this.isUndefined(t));
      }
    }

    // Types primitifs
    if (this.isPrimitive(from) && this.isPrimitive(to)) {
      return from.kind === to.kind;
    }

    // Littéraux
    if (this.isLiteral(from) && this.isLiteral(to)) {
      return from.value === to.value && 
             this.isAssignable(from.baseType, to.baseType);
    }

    // Littéral assignable à son type de base
    if (this.isLiteral(from) && !this.isLiteral(to)) {
      return this.isAssignable(from.baseType, to);
    }

    // Tableaux
    if (this.isArray(from) && this.isArray(to)) {
      return this.isAssignable(from.elementType, to.elementType);
    }

    // Tuples
    if (this.isTuple(from) && this.isTuple(to)) {
      // Vérifier que les longueurs sont compatibles
      if (from.elementTypes.length !== to.elementTypes.length) {
        return false;
      }
      
      // Vérifier chaque élément
      for (let i = 0; i < from.elementTypes.length; i++) {
        if (!this.isAssignable(from.elementTypes[i], to.elementTypes[i])) {
          return false;
        }
      }
      
      return true;
    }

    // Objets
    if (this.isObject(from) && this.isObject(to)) {
      // Vérifier que toutes les propriétés de 'to' existent dans 'from'
      for (const [name, toType] of to.properties) {
        const fromType = from.properties.get(name);
        if (!fromType || !this.isAssignable(fromType, toType)) {
          return false;
        }
      }
      return true;
    }

    // Fonctions (contravariance des paramètres, covariance du retour)
    if (this.isFunction(from) && this.isFunction(to)) {
      // Vérifier le nombre de paramètres
      if (from.parameters.length !== to.parameters.length) {
        return false;
      }
      
      // Vérifier les paramètres (contravariance)
      for (let i = 0; i < from.parameters.length; i++) {
        if (!this.isAssignable(to.parameters[i], from.parameters[i])) {
          return false;
        }
      }
      
      // Vérifier le type de retour (covariance)
      return this.isAssignable(from.returnType, to.returnType);
    }

    // Classes et interfaces
    if (this.isComposite(from) && this.isComposite(to)) {
      // Vérifier l'héritage
      if (from.name === to.name) {
        return true;
      }
      
      // Vérifier si 'from' hérite de 'to'
      return from.baseTypes.some(base => this.isAssignable(base, to)) ||
             from.implementedTypes.some(impl => this.isAssignable(impl, to));
    }

    // Génériques
    if (this.isGeneric(from) && this.isGeneric(to)) {
      return from.id === to.id;
    }

    // Type paramètre
    if (this.isTypeParameter(from) && this.isTypeParameter(to)) {
      return from.name === to.name;
    }

    // Unions
    if (this.isUnion(from)) {
      return from.types.some(t => this.isAssignable(t, to));
    }

    if (this.isUnion(to)) {
      return to.types.some(t => this.isAssignable(from, t));
    }

    // Intersections
    if (this.isIntersection(from)) {
      return from.types.every(t => this.isAssignable(t, to));
    }

    if (this.isIntersection(to)) {
      return to.types.every(t => this.isAssignable(from, t));
    }

    return false;
  }

  /**
   * Vérifier si deux types sont égaux
   */
  areEqual(type1: Type, type2: Type): boolean {
    return type1.equals(type2);
  }

  /**
   * Créer une union de types
   */
  unionTypes(...types: Type[]): Type {
    if (types.length === 0) {
      return this.neverType;
    }
    if (types.length === 1) {
      return types[0];
    }
    return new UnionType(...types);
  }

  /**
   * Créer une intersection de types
   */
  intersectionTypes(...types: Type[]): Type {
    if (types.length === 0) {
      return this.unknownType;
    }
    if (types.length === 1) {
      return types[0];
    }
    return new IntersectionType(...types);
  }

  /**
   * Créer un type littéral
   */
  createLiteralType(value: any): Type {
    let baseType: Type;
    
    if (typeof value === 'number') {
      baseType = this.numberType;
    } else if (typeof value === 'string') {
      baseType = this.stringType;
    } else if (typeof value === 'boolean') {
      baseType = this.booleanType;
    } else if (value === null) {
      baseType = this.nullType;
    } else if (value === undefined) {
      baseType = this.undefinedType;
    } else {
      baseType = this.anyType;
    }
    
    return new LiteralType(value, baseType);
  }

  /**
   * Créer un type tableau
   */
  createArrayType(elementType: Type): Type {
    return new ArrayType(elementType);
  }

  /**
   * Créer un type tuple
   */
  createTupleType(elementTypes: Type[]): Type {
    return new TupleType(elementTypes);
  }

  /**
   * Créer un type objet
   */
  createObjectType(properties: Map<string, Type> = new Map()): Type {
    return new ObjectType(properties);
  }

  /**
   * Créer un type fonction
   */
  createFunctionType(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ): Type {
    return new FunctionType(returnType, parameters, parameterNames);
  }

  /**
   * Créer un type classe
   */
  createClassType(name: string): Type {
    return new CompositeType(name, TypeKind.Class);
  }

  /**
   * Créer un type interface
   */
  createInterfaceType(name: string): Type {
    return new CompositeType(name, TypeKind.Interface);
  }

  /**
   * Créer un type enum
   */
  createEnumType(name: string): Type {
    return new CompositeType(name, TypeKind.Enum);
  }

  /**
   * Créer un type générique
   */
  createGenericType(id: string, name?: string): Type {
    return new GenericType(id, name);
  }

  /**
   * Créer un paramètre de type
   */
  createTypeParameter(name: string, constraint?: Type, defaultType?: Type): Type {
    return new TypeParameter(name, constraint, defaultType);
  }

  /**
   * Obtenir le type de base pour un type
   */
  getBaseType(type: Type): Type {
    if (this.isArray(type)) {
      return this.getBaseType((type as ArrayType).elementType);
    }
    if (this.isLiteral(type)) {
      return (type as LiteralType).baseType;
    }
    return type;
  }

  /**
   * Vérifier si un type est nullable
   */
  isNullable(type: Type): boolean {
    if (this.isNull(type) || this.isUndefined(type)) {
      return true;
    }
    if (this.isUnion(type)) {
      return type.types.some(t => this.isNullable(t));
    }
    return false;
  }

  /**
   * Créer un type nullable
   */
  createNullableType(type: Type): Type {
    return this.unionTypes(type, this.nullType, this.undefinedType);
  }

  /**
   * Obtenir le type non nullable
   */
  getNonNullableType(type: Type): Type {
    if (this.isUnion(type)) {
      const nonNullableTypes = type.types.filter(t => 
        !this.isNull(t) && !this.isUndefined(t)
      );
      if (nonNullableTypes.length === 1) {
        return nonNullableTypes[0];
      }
      return this.unionTypes(...nonNullableTypes);
    }
    return type;
  }

  /**
   * Vérifier si un type est un sous-type d'un autre
   */
  isSubtype(subtype: Type, supertype: Type): boolean {
    return this.isAssignable(subtype, supertype);
  }

  /**
   * Vérifier si un type est un sur-type d'un autre
   */
  isSupertype(supertype: Type, subtype: Type): boolean {
    return this.isAssignable(subtype, supertype);
  }

  /**
   * Obtenir le type le plus large
   */
  getWidestType(type1: Type, type2: Type): Type {
    if (this.isAssignable(type1, type2)) {
      return type2;
    }
    if (this.isAssignable(type2, type1)) {
      return type1;
    }
    return this.unionTypes(type1, type2);
  }

  /**
   * Obtenir le type le plus étroit
   */
  getNarrowestType(type1: Type, type2: Type): Type {
    if (this.isAssignable(type1, type2)) {
      return type1;
    }
    if (this.isAssignable(type2, type1)) {
      return type2;
    }
    return this.intersectionTypes(type1, type2);
  }
}

/**
 * Créer un système de types
 */
export function createTypeSystem(): TypeSystem {
  return new TypeSystem();
}

/**
 * Types primitifs par défaut
 */
export const PrimitiveTypes = {
  any: new AnyType(),
  unknown: new UnknownType(),
  never: new NeverType(),
  void: new VoidType(),
  null: new NullType(),
  undefined: new UndefinedType(),
  boolean: new BooleanType(),
  number: new NumberType(),
  string: new StringType(),
  symbol: new SymbolType(),
  bigint: new BigIntType(),
};
