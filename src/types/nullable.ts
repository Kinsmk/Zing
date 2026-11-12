/**
 * Nullable - Types nullable et utilitaires pour Zinga
 * 
 * Ce module fournit les types et utilitaires pour gérer les types nullable,
 * optionnels, et les types avec valeurs par défaut.
 */

import { Type, TypeKind, TypeSystem, PrimitiveType } from './type-system';
import { UnionType } from './unions';

/**
 * Type Nullable - Représente un type qui peut être null
 */
export class NullableType implements Type {
  kind: TypeKind = TypeKind.Union;
  
  // Type sous-jacent
  baseType: Type;
  
  // Indique si le type peut être undefined
  canBeUndefined: boolean = false;
  
  // Indique si le type peut être null
  canBeNull: boolean = true;

  constructor(baseType: Type, canBeUndefined: boolean = false) {
    this.baseType = baseType;
    this.canBeUndefined = canBeUndefined;
  }

  toString(): string {
    let result = this.baseType.toString();
    
    if (this.canBeNull && this.canBeUndefined) {
      return `${result} | null | undefined`;
    } else if (this.canBeNull) {
      return `${result} | null`;
    } else if (this.canBeUndefined) {
      return `${result} | undefined`;
    }
    
    return result;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      baseType: this.baseType.toJSON(),
      canBeUndefined: this.canBeUndefined,
      canBeNull: this.canBeNull,
    };
  }

  equals(other: Type): boolean {
    if (!(other instanceof NullableType)) {
      return false;
    }
    
    return this.baseType.equals(other.baseType) &&
           this.canBeNull === other.canBeNull &&
           this.canBeUndefined === other.canBeUndefined;
  }

  clone(): Type {
    return new NullableType(
      this.baseType.clone(),
      this.canBeUndefined
    );
  }

  /**
   * Obtenir le type sous-jacent
   */
  getBaseType(): Type {
    return this.baseType;
  }

  /**
   * Définir si le type peut être undefined
   */
  setCanBeUndefined(canBeUndefined: boolean): void {
    this.canBeUndefined = canBeUndefined;
  }

  /**
   * Définir si le type peut être null
   */
  setCanBeNull(canBeNull: boolean): void {
    this.canBeNull = canBeNull;
  }

  /**
   * Vérifier si le type peut être null
   */
  isNullable(): boolean {
    return this.canBeNull;
  }

  /**
   * Vérifier si le type peut être undefined
   */
  isOptional(): boolean {
    return this.canBeUndefined;
  }

  /**
   * Vérifier si le type peut être null ou undefined
   */
  isNullish(): boolean {
    return this.canBeNull || this.canBeUndefined;
  }

  /**
   * Convertir en type Union
   */
  toUnionType(): UnionType {
    const types: Type[] = [this.baseType];
    
    if (this.canBeNull) {
      types.push(new PrimitiveType(TypeKind.Null, 'null'));
    }
    
    if (this.canBeUndefined) {
      types.push(new PrimitiveType(TypeKind.Undefined, 'undefined'));
    }
    
    return new UnionType(types);
  }

  /**
   * Obtenir toutes les variantes possibles
   */
  getVariants(): Type[] {
    const variants: Type[] = [this.baseType];
    
    if (this.canBeNull) {
      variants.push(new PrimitiveType(TypeKind.Null, 'null'));
    }
    
    if (this.canBeUndefined) {
      variants.push(new PrimitiveType(TypeKind.Undefined, 'undefined'));
    }
    
    return variants;
  }
}

/**
 * Type Optional - Représente un type qui peut être undefined
 */
export class OptionalType implements Type {
  kind: TypeKind = TypeKind.Union;
  
  // Type sous-jacent
  baseType: Type;

  constructor(baseType: Type) {
    this.baseType = baseType;
  }

  toString(): string {
    return `${this.baseType.toString()} | undefined`;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      baseType: this.baseType.toJSON(),
    };
  }

  equals(other: Type): boolean {
    return other instanceof OptionalType && 
           this.baseType.equals(other.baseType);
  }

  clone(): Type {
    return new OptionalType(this.baseType.clone());
  }

  /**
   * Obtenir le type sous-jacent
   */
  getBaseType(): Type {
    return this.baseType;
  }

  /**
   * Convertir en type Nullable
   */
  toNullable(): NullableType {
    return new NullableType(this.baseType, true);
  }

  /**
   * Convertir en type Union
   */
  toUnionType(): UnionType {
    return new UnionType([
      this.baseType,
      new PrimitiveType(TypeKind.Undefined, 'undefined')
    ]);
  }
}

/**
 * Type avec valeur par défaut
 */
export class DefaultType implements Type {
  kind: TypeKind = TypeKind.Type;
  
  // Type sous-jacent
  baseType: Type;
  
  // Valeur par défaut
  defaultValue: any;

  constructor(baseType: Type, defaultValue: any) {
    this.baseType = baseType;
    this.defaultValue = defaultValue;
  }

  toString(): string {
    return `${this.baseType.toString()} = ${JSON.stringify(this.defaultValue)}`;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      baseType: this.baseType.toJSON(),
      defaultValue: this.defaultValue,
    };
  }

  equals(other: Type): boolean {
    return other instanceof DefaultType && 
           this.baseType.equals(other.baseType) &&
           this.defaultValue === other.defaultValue;
  }

  clone(): Type {
    return new DefaultType(this.baseType.clone(), this.defaultValue);
  }

  /**
   * Obtenir le type sous-jacent
   */
  getBaseType(): Type {
    return this.baseType;
  }

  /**
   * Obtenir la valeur par défaut
   */
  getDefaultValue(): any {
    return this.defaultValue;
  }

  /**
   * Définir la valeur par défaut
   */
  setDefaultValue(value: any): void {
    this.defaultValue = value;
  }
}

/**
 * Type NonNullable - Représente un type qui ne peut pas être null ou undefined
 */
export class NonNullableType implements Type {
  kind: TypeKind = TypeKind.Type;
  
  // Type sous-jacent
  baseType: Type;

  constructor(baseType: Type) {
    this.baseType = baseType;
  }

  toString(): string {
    return `NonNullable<${this.baseType.toString()}>`;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      baseType: this.baseType.toJSON(),
    };
  }

  equals(other: Type): boolean {
    return other instanceof NonNullableType && 
           this.baseType.equals(other.baseType);
  }

  clone(): Type {
    return new NonNullableType(this.baseType.clone());
  }

  /**
   * Obtenir le type sous-jacent
   */
  getBaseType(): Type {
    return this.baseType;
  }

  /**
   * Vérifier si le type est effectivement non-nullable
   */
  isEffectivelyNonNullable(typeSystem: TypeSystem): boolean {
    // Vérifier si le type sous-jacent est déjà non-nullable
    if (this.baseType instanceof NullableType) {
      return false;
    }
    
    if (this.baseType instanceof UnionType) {
      return !this.baseType.types.some(t => 
        t.kind === TypeKind.Null || t.kind === TypeKind.Undefined
      );
    }
    
    return true;
  }
}

/**
 * Type DefinitelyTyped - Représente un type avec une assertion de non-nullité
 */
export class DefinitelyTypedType implements Type {
  kind: TypeKind = TypeKind.Type;
  
  // Type sous-jacent
  baseType: Type;
  
  // Indique si c'est une assertion explicite (!)
  isExplicit: boolean = true;

  constructor(baseType: Type) {
    this.baseType = baseType;
  }

  toString(): string {
    return `${this.baseType.toString()}!`;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      baseType: this.baseType.toJSON(),
      isExplicit: this.isExplicit,
    };
  }

  equals(other: Type): boolean {
    return other instanceof DefinitelyTypedType && 
           this.baseType.equals(other.baseType);
  }

  clone(): Type {
    return new DefinitelyTypedType(this.baseType.clone());
  }

  /**
   * Obtenir le type sous-jacent
   */
  getBaseType(): Type {
    return this.baseType;
  }
}

/**
 * Fabrique de types nullable
 */
export class NullableTypeFactory {
  private typeSystem: TypeSystem;

  constructor(typeSystem: TypeSystem) {
    this.typeSystem = typeSystem;
  }

  /**
   * Créer un type nullable
   */
  createNullable(baseType: Type, canBeUndefined: boolean = false): NullableType {
    return new NullableType(baseType, canBeUndefined);
  }

  /**
   * Créer un type nullable à partir d'un type existant
   */
  makeNullable(type: Type): Type {
    if (type instanceof NullableType) {
      return type;
    }
    
    if (type instanceof UnionType) {
      // Vérifier si le type contient déjà null ou undefined
      const hasNull = type.types.some(t => t.kind === TypeKind.Null);
      const hasUndefined = type.types.some(t => t.kind === TypeKind.Undefined);
      
      if (hasNull && hasUndefined) {
        return type;
      }
      
      const newTypes = [...type.types];
      if (!hasNull) {
        newTypes.push(this.typeSystem.nullType);
      }
      if (!hasUndefined) {
        newTypes.push(this.typeSystem.undefinedType);
      }
      
      return this.typeSystem.createUnionType(newTypes);
    }
    
    return new NullableType(type);
  }

  /**
   * Créer un type optional
   */
  createOptional(baseType: Type): OptionalType {
    return new OptionalType(baseType);
  }

  /**
   * Créer un type avec valeur par défaut
   */
  createDefault(baseType: Type, defaultValue: any): DefaultType {
    return new DefaultType(baseType, defaultValue);
  }

  /**
   * Créer un type non-nullable
   */
  createNonNullable(baseType: Type): NonNullableType {
    return new NonNullableType(baseType);
  }

  /**
   * Créer un type definitely typed
   */
  createDefinitelyTyped(baseType: Type): DefinitelyTypedType {
    return new DefinitelyTypedType(baseType);
  }

  /**
   * Rendre un type optionnel
   */
  makeOptional(type: Type): Type {
    if (type instanceof OptionalType) {
      return type;
    }
    
    if (type instanceof UnionType) {
      if (type.types.some(t => t.kind === TypeKind.Undefined)) {
        return type;
      }
      return this.typeSystem.createUnionType([...type.types, this.typeSystem.undefinedType]);
    }
    
    return new OptionalType(type);
  }

  /**
   * Supprimer null et undefined d'un type
   */
  removeNullAndUndefined(type: Type): Type {
    if (type instanceof NullableType) {
      return type.baseType;
    }
    
    if (type instanceof OptionalType) {
      return type.baseType;
    }
    
    if (type instanceof UnionType) {
      const filteredTypes = type.types.filter(t => 
        t.kind !== TypeKind.Null && t.kind !== TypeKind.Undefined
      );
      
      if (filteredTypes.length === 1) {
        return filteredTypes[0];
      }
      
      return this.typeSystem.createUnionType(filteredTypes);
    }
    
    return type;
  }

  /**
   * Créer depuis un JSON
   */
  fromJSON(json: any): Type {
    switch (json.kind) {
      case 'Nullable':
        return this.createNullable(
          this.typeSystem.fromJSON(json.baseType),
          json.canBeUndefined
        );
      case 'Optional':
        return this.createOptional(this.typeSystem.fromJSON(json.baseType));
      case 'Default':
        return this.createDefault(
          this.typeSystem.fromJSON(json.baseType),
          json.defaultValue
        );
      case 'NonNullable':
        return this.createNonNullable(this.typeSystem.fromJSON(json.baseType));
      case 'DefinitelyTyped':
        return this.createDefinitelyTyped(this.typeSystem.fromJSON(json.baseType));
      default:
        return this.typeSystem.anyType;
    }
  }
}

/**
 * Créer une fabrique de types nullable
 */
export function createNullableTypeFactory(typeSystem: TypeSystem): NullableTypeFactory {
  return new NullableTypeFactory(typeSystem);
}

/**
 * Utilitaires pour les types nullable
 */
export class NullableUtils {
  /**
   * Vérifier si un type est nullable
   */
  static isNullable(type: Type): boolean {
    if (type instanceof NullableType) {
      return type.isNullable();
    }
    
    if (type instanceof UnionType) {
      return type.types.some(t => t.kind === TypeKind.Null);
    }
    
    return false;
  }

  /**
   * Vérifier si un type est optional
   */
  static isOptional(type: Type): boolean {
    if (type instanceof OptionalType) {
      return true;
    }
    
    if (type instanceof NullableType) {
      return type.isOptional();
    }
    
    if (type instanceof UnionType) {
      return type.types.some(t => t.kind === TypeKind.Undefined);
    }
    
    return false;
  }

  /**
   * Vérifier si un type est nullish (null ou undefined)
   */
  static isNullish(type: Type): boolean {
    if (type instanceof NullableType) {
      return type.isNullish();
    }
    
    if (type instanceof UnionType) {
      return type.types.some(t => 
        t.kind === TypeKind.Null || t.kind === TypeKind.Undefined
      );
    }
    
    return false;
  }

  /**
   * Obtenir le type sous-jacent d'un type nullable
   */
  static getBaseType(type: Type): Type {
    if (type instanceof NullableType || type instanceof OptionalType) {
      return type.getBaseType();
    }
    
    if (type instanceof UnionType) {
      const nonNullTypes = type.types.filter(t => 
        t.kind !== TypeKind.Null && t.kind !== TypeKind.Undefined
      );
      
      if (nonNullTypes.length === 1) {
        return nonNullTypes[0];
      }
    }
    
    return type;
  }

  /**
   * Vérifier si un type peut être null
   */
  static canBeNull(type: Type): boolean {
    if (type.kind === TypeKind.Null) {
      return true;
    }
    
    if (type instanceof NullableType) {
      return type.canBeNull;
    }
    
    if (type instanceof UnionType) {
      return type.types.some(t => t.kind === TypeKind.Null);
    }
    
    return false;
  }

  /**
   * Vérifier si un type peut être undefined
   */
  static canBeUndefined(type: Type): boolean {
    if (type.kind === TypeKind.Undefined) {
      return true;
    }
    
    if (type instanceof NullableType) {
      return type.canBeUndefined;
    }
    
    if (type instanceof OptionalType) {
      return true;
    }
    
    if (type instanceof UnionType) {
      return type.types.some(t => t.kind === TypeKind.Undefined);
    }
    
    return false;
  }

  /**
   * Obtenir toutes les variantes nullables d'un type
   */
  static getNullableVariants(type: Type): Type[] {
    if (type instanceof NullableType) {
      return type.getVariants();
    }
    
    if (type instanceof UnionType) {
      return type.types;
    }
    
    return [type];
  }
}

export {
  NullableType as default,
  OptionalType,
  DefaultType,
  NonNullableType,
  DefinitelyTypedType,
  NullableTypeFactory,
  NullableUtils,
};
