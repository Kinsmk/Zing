/**
 * CompositeTypes - Types composites pour Zinga
 * 
 * Ce module définit les types composites (classes, interfaces, enums, etc.).
 */

import { Type, TypeKind, CompositeType, FunctionType, TypeSystem, GenericType, TypeParameter, PrimitiveType } from './type-system';
import { SourceLocation } from '../compiler/lexer/positions';

/**
 * Type classe
 */
export class ClassType extends CompositeType {
  kind: TypeKind = TypeKind.Class;
  constructorName: string;
  isAbstract: boolean = false;
  isFinal: boolean = false;
  visibility: 'public' | 'private' | 'protected' = 'public';
  
  // Constructeurs
  constructors: FunctionType[] = [];
  
  // Méthodes
  methods: Map<string, FunctionType> = new Map();
  staticMethods: Map<string, FunctionType> = new Map();
  
  // Propriétés
  properties: Map<string, Type> = new Map();
  staticProperties: Map<string, Type> = new Map();
  
  // Getters/Setters
  getters: Map<string, FunctionType> = new Map();
  setters: Map<string, FunctionType> = new Map();
  
  // Index signatures
  indexSignatures: FunctionType[] = [];
  
  constructor(name: string) {
    super(name, TypeKind.Class);
    this.constructorName = name;
  }

  toString(): string {
    return this.name;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      constructorName: this.constructorName,
      isAbstract: this.isAbstract,
      isFinal: this.isFinal,
      visibility: this.visibility,
    };
  }

  clone(): ClassType {
    const clone = new ClassType(this.name);
    clone.constructorName = this.constructorName;
    clone.isAbstract = this.isAbstract;
    clone.isFinal = this.isFinal;
    clone.visibility = this.visibility;
    clone.constructors = this.constructors.map(c => c.clone() as FunctionType);
    clone.methods = new Map(this.methods);
    clone.staticMethods = new Map(this.staticMethods);
    clone.properties = new Map(this.properties);
    clone.staticProperties = new Map(this.staticProperties);
    clone.getters = new Map(this.getters);
    clone.setters = new Map(this.setters);
    clone.indexSignatures = this.indexSignatures.map(i => i.clone() as FunctionType);
    clone.members = new Map(this.members);
    clone.typeParameters = this.typeParameters?.map(t => t.clone() as TypeParameter);
    clone.baseTypes = this.baseTypes.map(t => t.clone());
    clone.implementedTypes = this.implementedTypes.map(t => t.clone());
    return clone;
  }

  /**
   * Ajouter un constructeur
   */
  addConstructor(constructor: FunctionType): void {
    this.constructors.push(constructor);
  }

  /**
   * Ajouter une méthode
   */
  addMethod(name: string, method: FunctionType): void {
    this.methods.set(name, method);
    this.members.set(name, method);
  }

  /**
   * Ajouter une méthode statique
   */
  addStaticMethod(name: string, method: FunctionType): void {
    this.staticMethods.set(name, method);
  }

  /**
   * Ajouter une propriété
   */
  addProperty(name: string, type: Type): void {
    this.properties.set(name, type);
    this.members.set(name, type);
  }

  /**
   * Ajouter une propriété statique
   */
  addStaticProperty(name: string, type: Type): void {
    this.staticProperties.set(name, type);
  }

  /**
   * Ajouter un getter
   */
  addGetter(name: string, getter: FunctionType): void {
    this.getters.set(name, getter);
    this.members.set(name, getter.returnType);
  }

  /**
   * Ajouter un setter
   */
  addSetter(name: string, setter: FunctionType): void {
    this.setters.set(name, setter);
  }

  /**
   * Ajouter une signature d'index
   */
  addIndexSignature(signature: FunctionType): void {
    this.indexSignatures.push(signature);
  }

  /**
   * Obtenir une méthode
   */
  getMethod(name: string): FunctionType | undefined {
    return this.methods.get(name);
  }

  /**
   * Obtenir une méthode statique
   */
  getStaticMethod(name: string): FunctionType | undefined {
    return this.staticMethods.get(name);
  }

  /**
   * Obtenir une propriété
   */
  getProperty(name: string): Type | undefined {
    return this.properties.get(name) || super.getProperty(name);
  }

  /**
   * Obtenir une propriété statique
   */
  getStaticProperty(name: string): Type | undefined {
    return this.staticProperties.get(name);
  }

  /**
   * Obtenir un getter
   */
  getGetter(name: string): FunctionType | undefined {
    return this.getters.get(name);
  }

  /**
   * Obtenir un setter
   */
  getSetter(name: string): FunctionType | undefined {
    return this.setters.get(name);
  }

  /**
   * Vérifier si la classe a une méthode
   */
  hasMethod(name: string): boolean {
    return this.methods.has(name);
  }

  /**
   * Vérifier si la classe a une propriété
   */
  hasProperty(name: string): boolean {
    return this.properties.has(name) || super.getProperty(name) !== undefined;
  }

  /**
   * Vérifier si la classe est instanciable
   */
  isInstantiable(): boolean {
    return !this.isAbstract && !this.isFinal && this.constructors.length > 0;
  }
}

/**
 * Type interface
 */
export class InterfaceType extends CompositeType {
  kind: TypeKind = TypeKind.Interface;
  
  // Méthodes
  methods: Map<string, FunctionType> = new Map();
  
  // Propriétés
  properties: Map<string, Type> = new Map();
  
  // Getters/Setters
  getters: Map<string, FunctionType> = new Map();
  setters: Map<string, FunctionType> = new Map();
  
  // Index signatures
  indexSignatures: FunctionType[] = [];

  constructor(name: string) {
    super(name, TypeKind.Interface);
  }

  toString(): string {
    return this.name;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
    };
  }

  clone(): InterfaceType {
    const clone = new InterfaceType(this.name);
    clone.methods = new Map(this.methods);
    clone.properties = new Map(this.properties);
    clone.getters = new Map(this.getters);
    clone.setters = new Map(this.setters);
    clone.indexSignatures = this.indexSignatures.map(i => i.clone() as FunctionType);
    clone.members = new Map(this.members);
    clone.typeParameters = this.typeParameters?.map(t => t.clone() as TypeParameter);
    clone.baseTypes = this.baseTypes.map(t => t.clone());
    clone.implementedTypes = this.implementedTypes.map(t => t.clone());
    return clone;
  }

  /**
   * Ajouter une méthode
   */
  addMethod(name: string, method: FunctionType): void {
    this.methods.set(name, method);
    this.members.set(name, method);
  }

  /**
   * Ajouter une propriété
   */
  addProperty(name: string, type: Type): void {
    this.properties.set(name, type);
    this.members.set(name, type);
  }

  /**
   * Ajouter un getter
   */
  addGetter(name: string, getter: FunctionType): void {
    this.getters.set(name, getter);
    this.members.set(name, getter.returnType);
  }

  /**
   * Ajouter un setter
   */
  addSetter(name: string, setter: FunctionType): void {
    this.setters.set(name, setter);
  }

  /**
   * Ajouter une signature d'index
   */
  addIndexSignature(signature: FunctionType): void {
    this.indexSignatures.push(signature);
  }

  /**
   * Obtenir une méthode
   */
  getMethod(name: string): FunctionType | undefined {
    return this.methods.get(name);
  }

  /**
   * Obtenir une propriété
   */
  getProperty(name: string): Type | undefined {
    return this.properties.get(name) || super.getProperty(name);
  }

  /**
   * Obtenir un getter
   */
  getGetter(name: string): FunctionType | undefined {
    return this.getters.get(name);
  }

  /**
   * Obtenir un setter
   */
  getSetter(name: string): FunctionType | undefined {
    return this.setters.get(name);
  }

  /**
   * Vérifier si l'interface a une méthode
   */
  hasMethod(name: string): boolean {
    return this.methods.has(name);
  }

  /**
   * Vérifier si l'interface a une propriété
   */
  hasProperty(name: string): boolean {
    return this.properties.has(name) || super.getProperty(name) !== undefined;
  }

  /**
   * Vérifier si l'interface est implémentable
   */
  isImplementable(): boolean {
    // Vérifier que toutes les méthodes et propriétés sont implémentables
    for (const method of this.methods.values()) {
      if (method.parameters.some(p => this.isTypeParameter(p) && !this.isTypeParameterResolved(p))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Vérifier si un type est un paramètre de type
   */
  private isTypeParameter(type: Type): type is TypeParameter {
    return type.kind === TypeKind.TypeParameter;
  }

  /**
   * Vérifier si un paramètre de type est résolu
   */
  private isTypeParameterResolved(type: Type): boolean {
    if (type.kind === TypeKind.TypeParameter) {
      return (type as TypeParameter).defaultType !== undefined;
    }
    return true;
  }
}

/**
 * Type enum
 */
export class EnumType extends CompositeType {
  kind: TypeKind = TypeKind.Enum;
  
  // Membres de l'enum
  members: Map<string, Type> = new Map();
  
  // Valeurs des membres
  memberValues: Map<string, any> = new Map();
  
  // Type sous-jacent
  underlyingType: Type;

  constructor(name: string, underlyingType: Type = new PrimitiveType(TypeKind.Number, 'number')) {
    super(name, TypeKind.Enum);
    this.underlyingType = underlyingType;
  }

  toString(): string {
    return this.name;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      underlyingType: this.underlyingType.toJSON(),
    };
  }

  clone(): EnumType {
    const clone = new EnumType(this.name, this.underlyingType.clone());
    clone.members = new Map(this.members);
    clone.memberValues = new Map(this.memberValues);
    clone.members = new Map(this.members);
    return clone;
  }

  /**
   * Ajouter un membre
   */
  addMember(name: string, value: any, type?: Type): void {
    const memberType = type || this.underlyingType;
    this.members.set(name, memberType);
    this.memberValues.set(name, value);
    this.members.set(name, memberType);
  }

  /**
   * Obtenir un membre
   */
  getMember(name: string): Type | undefined {
    return this.members.get(name);
  }

  /**
   * Obtenir la valeur d'un membre
   */
  getMemberValue(name: string): any | undefined {
    return this.memberValues.get(name);
  }

  /**
   * Obtenir tous les membres
   */
  getAllMembers(): Map<string, Type> {
    return new Map(this.members);
  }

  /**
   * Obtenir toutes les valeurs
   */
  getAllValues(): any[] {
    return Array.from(this.memberValues.values());
  }

  /**
   * Vérifier si l'enum a un membre
   */
  hasMember(name: string): boolean {
    return this.members.has(name);
  }

  /**
   * Obtenir le type sous-jacent
   */
  getUnderlyingType(): Type {
    return this.underlyingType;
  }

  /**
   * Définir le type sous-jacent
   */
  setUnderlyingType(type: Type): void {
    this.underlyingType = type;
  }
}

/**
 * Type structure (pour les types structuraux)
 */
export class StructType extends CompositeType {
  kind: TypeKind = TypeKind.Object;
  
  // Champs de la structure
  fields: Map<string, Type> = new Map();
  
  // Méthodes
  methods: Map<string, FunctionType> = new Map();

  constructor(name: string) {
    super(name, TypeKind.Object);
  }

  toString(): string {
    return `struct ${this.name}`;
  }

  clone(): StructType {
    const clone = new StructType(this.name);
    clone.fields = new Map(this.fields);
    clone.methods = new Map(this.methods);
    clone.members = new Map(this.members);
    return clone;
  }

  /**
   * Ajouter un champ
   */
  addField(name: string, type: Type): void {
    this.fields.set(name, type);
    this.members.set(name, type);
  }

  /**
   * Ajouter une méthode
   */
  addMethod(name: string, method: FunctionType): void {
    this.methods.set(name, method);
    this.members.set(name, method);
  }

  /**
   * Obtenir un champ
   */
  getField(name: string): Type | undefined {
    return this.fields.get(name);
  }

  /**
   * Obtenir une méthode
   */
  getMethod(name: string): FunctionType | undefined {
    return this.methods.get(name);
  }

  /**
   * Vérifier si la structure a un champ
   */
  hasField(name: string): boolean {
    return this.fields.has(name);
  }

  /**
   * Vérifier si la structure a une méthode
   */
  hasMethod(name: string): boolean {
    return this.methods.has(name);
  }
}

/**
 * Type type (pour les alias de type)
 */
export class TypeAliasType extends CompositeType {
  kind: TypeKind = TypeKind.Type;
  
  // Type sous-jacent
  underlyingType: Type;

  constructor(name: string, underlyingType: Type) {
    super(name, TypeKind.Type);
    this.underlyingType = underlyingType;
  }

  toString(): string {
    return this.name;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      underlyingType: this.underlyingType.toJSON(),
    };
  }

  clone(): TypeAliasType {
    return new TypeAliasType(this.name, this.underlyingType.clone());
  }

  /**
   * Obtenir le type sous-jacent
   */
  getUnderlyingType(): Type {
    return this.underlyingType;
  }

  /**
   * Définir le type sous-jacent
   */
  setUnderlyingType(type: Type): void {
    this.underlyingType = type;
  }
}

/**
 * Fabrique de types composites
 */
export class CompositeTypeFactory {
  private typeSystem: TypeSystem;

  constructor(typeSystem: TypeSystem) {
    this.typeSystem = typeSystem;
  }

  public createClass(name: string): ClassType {
    return new ClassType(name);
  }

  public createInterface(name: string): InterfaceType {
    return new InterfaceType(name);
  }

  public createEnum(name: string, underlyingType?: Type): EnumType {
    return new EnumType(name, underlyingType || this.typeSystem.numberType);
  }

  public createStruct(name: string): StructType {
    return new StructType(name);
  }

  public createTypeAlias(name: string, underlyingType: Type): TypeAliasType {
    return new TypeAliasType(name, underlyingType);
  }

  public fromJSON(json: any): CompositeType {
    switch (json.kind) {
      case 'Class':
        return this.createClass(json.name);
      case 'Interface':
        return this.createInterface(json.name);
      case 'Enum':
        return this.createEnum(json.name);
      case 'Object':
        return this.createStruct(json.name);
      case 'Type':
        return this.createTypeAlias(json.name, this.typeSystem.anyType);
      default:
        return this.createClass(json.name);
    }
  }
}

/**
 * Créer une fabrique de types composites
 */
export function createCompositeTypeFactory(typeSystem: TypeSystem): CompositeTypeFactory {
  return new CompositeTypeFactory(typeSystem);
}
