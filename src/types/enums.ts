/**
 * Enums - Types énumération avancés pour Zinga
 * 
 * Ce module étend les types énumération avec des fonctionnalités avancées
 * incluant les enums littéraux, les enums binaires, et les utilitaires d'énumération.
 */

import { Type, TypeKind, CompositeType, TypeSystem, PrimitiveType } from './type-system';
import { EnumType as BaseEnumType } from './composite-types';

/**
 * Type d'énumération de base étendu
 */
export class EnumType extends BaseEnumType {
  // Valeur par défaut pour les membres
  defaultValue: any = 0;
  
  // Incrément automatique
  autoIncrement: boolean = true;
  
  // Indique si l'enum est un enum littéral (string enum)
  isStringEnum: boolean = false;
  
  // Indique si l'enum est un enum numérique
  isNumericEnum: boolean = true;
  
  // Indique si l'enum est un enum binaire (flags)
  isBitFlagEnum: boolean = false;
  
  // Description de l'enum
  description?: string;

  constructor(
    name: string,
    underlyingType: Type = new PrimitiveType(TypeKind.Number, 'number')
  ) {
    super(name, underlyingType);
    this.underlyingType = underlyingType;
    
    // Déterminer le type d'enum
    if (underlyingType.kind === TypeKind.String) {
      this.isStringEnum = true;
      this.isNumericEnum = false;
    }
  }

  toString(): string {
    if (this.isBitFlagEnum) {
      return `enum ${this.name} [Flags]`;
    }
    if (this.isStringEnum) {
      return `enum ${this.name} [String]`;
    }
    return `enum ${this.name}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      defaultValue: this.defaultValue,
      autoIncrement: this.autoIncrement,
      isStringEnum: this.isStringEnum,
      isNumericEnum: this.isNumericEnum,
      isBitFlagEnum: this.isBitFlagEnum,
      description: this.description,
    };
  }

  clone(): EnumType {
    const clone = new EnumType(this.name, this.underlyingType.clone());
    clone.members = new Map(this.members);
    clone.memberValues = new Map(this.memberValues);
    clone.defaultValue = this.defaultValue;
    clone.autoIncrement = this.autoIncrement;
    clone.isStringEnum = this.isStringEnum;
    clone.isNumericEnum = this.isNumericEnum;
    clone.isBitFlagEnum = this.isBitFlagEnum;
    clone.description = this.description;
    return clone;
  }

  /**
   * Ajouter un membre avec valeur automatique
   */
  addMemberAuto(name: string): void {
    if (this.isStringEnum) {
      this.addMember(name, name, this.underlyingType);
    } else {
      const value = this.defaultValue + (this.members.size);
      this.addMember(name, value, this.underlyingType);
      this.defaultValue = value + 1;
    }
  }

  /**
   * Ajouter un membre avec valeur explicite
   */
  addMemberExplicit(name: string, value: any, type?: Type): void {
    const memberType = type || this.underlyingType;
    this.members.set(name, memberType);
    this.memberValues.set(name, value);
    
    // Mettre à jour le type d'enum
    if (typeof value === 'string') {
      this.isStringEnum = true;
      this.isNumericEnum = false;
    }
  }

  /**
   * Ajouter un membre avec flag binaire
   */
  addBitFlagMember(name: string, value: number): void {
    this.isBitFlagEnum = true;
    this.addMember(name, value, this.underlyingType);
  }

  /**
   * Définir si l'enum est un enum binaire
   */
  setAsBitFlagEnum(isBitFlag: boolean = true): void {
    this.isBitFlagEnum = isBitFlag;
  }

  /**
   * Vérifier si l'enum est un enum binaire
   */
  isBitFlag(): boolean {
    return this.isBitFlagEnum;
  }

  /**
   * Vérifier si une valeur est un flag valide
   */
  hasFlag(value: number, flag: number): boolean {
    return (value & flag) === flag;
  }

  /**
   * Combiner des flags
   */
  combineFlags(...flags: number[]): number {
    return flags.reduce((acc, flag) => acc | flag, 0);
  }

  /**
   * Obtenir les noms des membres
   */
  getMemberNames(): string[] {
    return Array.from(this.members.keys());
  }

  /**
   * Obtenir les valeurs des membres
   */
  getMemberValuesArray(): any[] {
    return Array.from(this.memberValues.values());
  }

  /**
   * Obtenir les membres sous forme d'entrées [nom, valeur]
   */
  getEntries(): [string, any][] {
    return Array.from(this.memberValues.entries());
  }

  /**
   * Obtenir un membre par valeur
   */
  getMemberByValue(value: any): string | undefined {
    for (const [name, memberValue] of this.memberValues) {
      if (memberValue === value) {
        return name;
      }
    }
    return undefined;
  }

  /**
   * Obtenir le nombre de membres
   */
  getMemberCount(): number {
    return this.members.size;
  }

  /**
   * Vérifier si l'enum contient un membre avec une valeur donnée
   */
  hasValue(value: any): boolean {
    return this.memberValues.hasOwnProperty(value);
  }

  /**
   * Définir la description
   */
  setDescription(description: string): void {
    this.description = description;
  }

  /**
   * Obtenir la description
   */
  getDescription(): string | undefined {
    return this.description;
  }
}

/**
 * Type Enum littéral (string enum)
 */
export class StringEnumType extends EnumType {
  constructor(name: string) {
    super(name, new PrimitiveType(TypeKind.String, 'string'));
    this.isStringEnum = true;
    this.isNumericEnum = false;
  }

  toString(): string {
    return `enum ${this.name} [String]`;
  }

  clone(): StringEnumType {
    const clone = new StringEnumType(this.name);
    clone.members = new Map(this.members);
    clone.memberValues = new Map(this.memberValues);
    clone.defaultValue = this.defaultValue;
    clone.autoIncrement = this.autoIncrement;
    clone.description = this.description;
    return clone;
  }

  /**
   * Ajouter un membre avec valeur string
   */
  addStringMember(name: string, value?: string): void {
    this.addMember(name, value || name, this.underlyingType);
  }
}

/**
 * Type Enum numérique
 */
export class NumericEnumType extends EnumType {
  constructor(name: string) {
    super(name, new PrimitiveType(TypeKind.Number, 'number'));
    this.isNumericEnum = true;
    this.isStringEnum = false;
  }

  toString(): string {
    return `enum ${this.name} [Numeric]`;
  }

  clone(): NumericEnumType {
    const clone = new NumericEnumType(this.name);
    clone.members = new Map(this.members);
    clone.memberValues = new Map(this.memberValues);
    clone.defaultValue = this.defaultValue;
    clone.autoIncrement = this.autoIncrement;
    clone.description = this.description;
    return clone;
  }

  /**
   * Ajouter un membre avec valeur numérique
   */
  addNumericMember(name: string, value?: number): void {
    const actualValue = value !== undefined ? value : this.defaultValue + this.members.size;
    this.addMember(name, actualValue, this.underlyingType);
    this.defaultValue = actualValue + 1;
  }
}

/**
 * Type Enum binaire (Bit Flags)
 */
export class BitFlagEnumType extends EnumType {
  constructor(name: string) {
    super(name, new PrimitiveType(TypeKind.Number, 'number'));
    this.isBitFlagEnum = true;
    this.isNumericEnum = true;
  }

  toString(): string {
    return `enum ${this.name} [Flags]`;
  }

  clone(): BitFlagEnumType {
    const clone = new BitFlagEnumType(this.name);
    clone.members = new Map(this.members);
    clone.memberValues = new Map(this.memberValues);
    clone.defaultValue = this.defaultValue;
    clone.description = this.description;
    return clone;
  }

  /**
   * Ajouter un flag avec valeur binaire
   */
  addFlag(name: string, value: number): void {
    this.addMember(name, value, this.underlyingType);
  }

  /**
   * Ajouter un flag avec valeur automatique (puissance de 2)
   */
  addAutoFlag(name: string): void {
    const value = 1 << this.members.size;
    this.addFlag(name, value);
  }

  /**
   * Vérifier si une valeur contient tous les flags spécifiés
   */
  hasAllFlags(value: number, ...flags: number[]): boolean {
    return flags.every(flag => this.hasFlag(value, flag));
  }

  /**
   * Vérifier si une valeur contient au moins un des flags spécifiés
   */
  hasAnyFlag(value: number, ...flags: number[]): boolean {
    return flags.some(flag => this.hasFlag(value, flag));
  }

  /**
   * Obtenir les flags actifs dans une valeur
   */
  getActiveFlags(value: number): string[] {
    const activeFlags: string[] = [];
    for (const [name, flagValue] of this.memberValues) {
      if (this.hasFlag(value, flagValue as number)) {
        activeFlags.push(name);
      }
    }
    return activeFlags;
  }

  /**
   * Obtenir la valeur numérique d'un flag par nom
   */
  getFlagValue(name: string): number | undefined {
    return this.memberValues.get(name) as number | undefined;
  }
}

/**
 * Type Enum générique
 */
export class GenericEnumType extends EnumType {
  // Paramètres de type
  typeParameters: Type[];

  constructor(
    name: string,
    underlyingType: Type,
    typeParameters: Type[] = []
  ) {
    super(name, underlyingType);
    this.typeParameters = typeParameters;
  }

  toString(): string {
    const params = this.typeParameters.map(t => t.toString()).join(', ');
    return `enum ${this.name}<${params}>`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      typeParameters: this.typeParameters.map(t => t.toJSON()),
    };
  }

  clone(): GenericEnumType {
    const clone = new GenericEnumType(
      this.name,
      this.underlyingType.clone(),
      this.typeParameters.map(t => t.clone())
    );
    clone.members = new Map(this.members);
    clone.memberValues = new Map(this.memberValues);
    clone.defaultValue = this.defaultValue;
    clone.autoIncrement = this.autoIncrement;
    clone.isStringEnum = this.isStringEnum;
    clone.isNumericEnum = this.isNumericEnum;
    clone.description = this.description;
    return clone;
  }

  /**
   * Ajouter un paramètre de type
   */
  addTypeParameter(type: Type): void {
    this.typeParameters.push(type);
  }

  /**
   * Obtenir les paramètres de type
   */
  getTypeParameters(): Type[] {
    return [...this.typeParameters];
  }
}

/**
 * Type Enum Const (const enum)
 */
export class ConstEnumType extends EnumType {
  // Indique que c'est un const enum
  isConst: boolean = true;

  constructor(name: string, underlyingType: Type = new PrimitiveType(TypeKind.Number, 'number')) {
    super(name, underlyingType);
  }

  toString(): string {
    if (this.isStringEnum) {
      return `const enum ${this.name} [String]`;
    }
    if (this.isBitFlagEnum) {
      return `const enum ${this.name} [Flags]`;
    }
    return `const enum ${this.name}`;
  }

  clone(): ConstEnumType {
    const clone = new ConstEnumType(this.name, this.underlyingType.clone());
    clone.members = new Map(this.members);
    clone.memberValues = new Map(this.memberValues);
    clone.defaultValue = this.defaultValue;
    clone.autoIncrement = this.autoIncrement;
    clone.isStringEnum = this.isStringEnum;
    clone.isNumericEnum = this.isNumericEnum;
    clone.isBitFlagEnum = this.isBitFlagEnum;
    clone.description = this.description;
    return clone;
  }
}

/**
 * Fabrique de types énumération
 */
export class EnumTypeFactory {
  private typeSystem: TypeSystem;

  constructor(typeSystem: TypeSystem) {
    this.typeSystem = typeSystem;
  }

  /**
   * Créer un enum de base
   */
  createEnum(name: string, underlyingType?: Type): EnumType {
    return new EnumType(name, underlyingType || this.typeSystem.numberType);
  }

  /**
   * Créer un string enum
   */
  createStringEnum(name: string): StringEnumType {
    return new StringEnumType(name);
  }

  /**
   * Créer un numeric enum
   */
  createNumericEnum(name: string): NumericEnumType {
    return new NumericEnumType(name);
  }

  /**
   * Créer un bit flag enum
   */
  createBitFlagEnum(name: string): BitFlagEnumType {
    return new BitFlagEnumType(name);
  }

  /**
   * Créer un generic enum
   */
  createGenericEnum(
    name: string,
    underlyingType: Type,
    typeParameters: Type[] = []
  ): GenericEnumType {
    return new GenericEnumType(name, underlyingType, typeParameters);
  }

  /**
   * Créer un const enum
   */
  createConstEnum(name: string, underlyingType?: Type): ConstEnumType {
    return new ConstEnumType(name, underlyingType || this.typeSystem.numberType);
  }

  /**
   * Créer un enum depuis un JSON
   */
  fromJSON(json: any): EnumType {
    switch (json.kind) {
      case 'Enum':
        if (json.isStringEnum) {
          return this.createStringEnum(json.name);
        }
        if (json.isBitFlagEnum) {
          return this.createBitFlagEnum(json.name);
        }
        return this.createEnum(json.name);
      default:
        return this.createEnum(json.name);
    }
  }
}

/**
 * Créer une fabrique de types énumération
 */
export function createEnumTypeFactory(typeSystem: TypeSystem): EnumTypeFactory {
  return new EnumTypeFactory(typeSystem);
}

/**
 * Utilitaires pour les enums
 */
export class EnumUtils {
  /**
   * Vérifier si un type est un enum
   */
  static isEnumType(type: Type): type is EnumType {
    return type instanceof EnumType ||
           type instanceof StringEnumType ||
           type instanceof NumericEnumType ||
           type instanceof BitFlagEnumType ||
           type instanceof GenericEnumType ||
           type instanceof ConstEnumType;
  }

  /**
   * Vérifier si un enum est un string enum
   */
  static isStringEnum(type: Type): boolean {
    return type instanceof EnumType && type.isStringEnum;
  }

  /**
   * Vérifier si un enum est un numeric enum
   */
  static isNumericEnum(type: Type): boolean {
    return type instanceof EnumType && type.isNumericEnum;
  }

  /**
   * Vérifier si un enum est un bit flag enum
   */
  static isBitFlagEnum(type: Type): boolean {
    return type instanceof EnumType && type.isBitFlagEnum;
  }

  /**
   * Vérifier si un enum est un const enum
   */
  static isConstEnum(type: Type): boolean {
    return type instanceof ConstEnumType;
  }

  /**
   * Obtenir les valeurs d'un enum sous forme de tableau
   */
  static getEnumValues(enumType: EnumType): any[] {
    return enumType.getMemberValuesArray();
  }

  /**
   * Obtenir les noms d'un enum sous forme de tableau
   */
  static getEnumNames(enumType: EnumType): string[] {
    return enumType.getMemberNames();
  }

  /**
   * Convertir un enum en objet littéral
   */
  static enumToObject(enumType: EnumType): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [name, value] of enumType.memberValues) {
      result[name] = value;
    }
    return result;
  }

  /**
   * Convertir un enum en objet littéral inversé (valeur -> nom)
   */
  static enumToReverseObject(enumType: EnumType): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [name, value] of enumType.memberValues) {
      result[String(value)] = name;
    }
    return result;
  }

  /**
   * Vérifier si une valeur appartient à un enum
   */
  static isEnumValue(enumType: EnumType, value: any): boolean {
    return enumType.hasValue(value);
  }

  /**
   * Obtenir le nom d'un membre d'enum par sa valeur
   */
  static getEnumNameByValue(enumType: EnumType, value: any): string | undefined {
    return enumType.getMemberByValue(value);
  }
}

export {
  EnumType as default,
  StringEnumType,
  NumericEnumType,
  BitFlagEnumType,
  GenericEnumType,
  ConstEnumType,
  EnumTypeFactory,
  EnumUtils,
};
