/**
 * Unions - Types union et intersection pour Zinga
 * 
 * Ce module définit les types union et intersection avec des utilitaires
 * pour la manipulation et la vérification de compatibilité.
 */

import { Type, TypeKind, TypeSystem, PrimitiveType } from './type-system';

/**
 * Type Union - Représente une union de types
 */
export class UnionType implements Type {
  kind: TypeKind = TypeKind.Union;
  
  // Types membres de l'union
  types: Type[];
  
  // Indique si l'union est scellée (pas de types supplémentaires)
  isSealed: boolean = false;

  constructor(types: Type[] = []) {
    this.types = types;
    this.normalize();
  }

  toString(): string {
    return this.types.map(t => t.toString()).join(' | ');
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      types: this.types.map(t => t.toJSON()),
      isSealed: this.isSealed,
    };
  }

  equals(other: Type): boolean {
    if (!(other instanceof UnionType)) {
      return false;
    }
    
    if (this.types.length !== other.types.length) {
      return false;
    }
    
    for (let i = 0; i < this.types.length; i++) {
      if (!this.types[i].equals(other.types[i])) {
        return false;
      }
    }
    
    return true;
  }

  clone(): Type {
    return new UnionType(this.types.map(t => t.clone()));
  }

  /**
   * Normaliser l'union en supprimant les doublons et en fusionnant les types compatibles
   */
  private normalize(): void {
    const uniqueTypes: Type[] = [];
    const seen: Map<string, Type> = new Map();
    
    for (const type of this.types) {
      const key = type.toString();
      if (!seen.has(key)) {
        seen.set(key, type);
        uniqueTypes.push(type);
      }
    }
    
    this.types = uniqueTypes;
  }

  /**
   * Ajouter un type à l'union
   */
  addType(type: Type): void {
    this.types.push(type);
    this.normalize();
  }

  /**
   * Ajouter plusieurs types à l'union
   */
  addTypes(...types: Type[]): void {
    this.types.push(...types);
    this.normalize();
  }

  /**
   * Supprimer un type de l'union
   */
  removeType(type: Type): boolean {
    const index = this.types.findIndex(t => t.equals(type));
    if (index !== -1) {
      this.types.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Obtenir les types membres
   */
  getTypes(): Type[] {
    return [...this.types];
  }

  /**
   * Obtenir le nombre de types
   */
  getTypeCount(): number {
    return this.types.length;
  }

  /**
   * Vérifier si l'union contient un type
   */
  hasType(type: Type): boolean {
    return this.types.some(t => t.equals(type));
  }

  /**
   * Vérifier si l'union est vide
   */
  isEmpty(): boolean {
    return this.types.length === 0;
  }

  /**
   * Vérifier si l'union contient le type never
   */
  containsNever(): boolean {
    return this.types.some(t => t.kind === TypeKind.Never);
  }

  /**
   * Vérifier si l'union contient le type any
   */
  containsAny(): boolean {
    return this.types.some(t => t.kind === TypeKind.Any);
  }

  /**
   * Vérifier si l'union contient le type unknown
   */
  containsUnknown(): boolean {
    return this.types.some(t => t.kind === TypeKind.Unknown);
  }

  /**
   * Définir si l'union est scellée
   */
  setSealed(isSealed: boolean): void {
    this.isSealed = isSealed;
  }

  /**
   * Vérifier si l'union est scellée
   */
  isUnionSealed(): boolean {
    return this.isSealed;
  }

  /**
   * Fusionner avec une autre union
   */
  merge(other: UnionType): UnionType {
    const mergedTypes = [...this.types, ...other.types];
    return new UnionType(mergedTypes);
  }

  /**
   * Obtenir l'intersection avec une autre union
   */
  intersect(other: UnionType): UnionType {
    const intersectionTypes: Type[] = [];
    
    for (const type1 of this.types) {
      for (const type2 of other.types) {
        // Si les types sont compatibles, les ajouter à l'intersection
        // (simplification: on vérifie l'égalité pour l'instant)
        if (type1.equals(type2)) {
          intersectionTypes.push(type1);
        }
      }
    }
    
    return new UnionType(intersectionTypes);
  }

  /**
   * Simplifier l'union en supprimant les types redondants
   */
  simplify(typeSystem: TypeSystem): UnionType {
    const simplifiedTypes: Type[] = [];
    
    for (const type of this.types) {
      // Si le type est any ou unknown, l'union entière devient any/unknown
      if (type.kind === TypeKind.Any) {
        return new UnionType([typeSystem.anyType]);
      }
      if (type.kind === TypeKind.Unknown) {
        return new UnionType([typeSystem.unknownType]);
      }
      
      // Si le type est never, on peut l'ignorer
      if (type.kind === TypeKind.Never) {
        continue;
      }
      
      // Vérifier si le type est déjà couvert par un autre type
      let isCovered = false;
      for (const existing of simplifiedTypes) {
        if (typeSystem.isAssignable(type, existing)) {
          isCovered = true;
          break;
        }
      }
      
      if (!isCovered) {
        simplifiedTypes.push(type);
      }
    }
    
    return new UnionType(simplifiedTypes);
  }

  /**
   * Vérifier si l'union est assignable à un autre type
   */
  isAssignableTo(other: Type, typeSystem: TypeSystem): boolean {
    // Une union est assignable à un type si tous ses membres le sont
    return this.types.every(t => typeSystem.isAssignable(t, other));
  }

  /**
   * Vérifier si un type est assignable à l'union
   */
  isAssignableFrom(other: Type, typeSystem: TypeSystem): boolean {
    // Un type est assignable à une union si il est assignable à au moins un membre
    return this.types.some(t => typeSystem.isAssignable(other, t));
  }

  /**
   * Résoudre l'union à un type unique si possible
   */
  resolveToSingleType(typeSystem: TypeSystem): Type | null {
    if (this.types.length === 1) {
      return this.types[0];
    }
    
    // Si l'union contient any ou unknown, retourner ce type
    for (const type of this.types) {
      if (type.kind === TypeKind.Any) {
        return type;
      }
      if (type.kind === TypeKind.Unknown) {
        return type;
      }
    }
    
    return null;
  }
}

/**
 * Type Intersection - Représente une intersection de types
 */
export class IntersectionType implements Type {
  kind: TypeKind = TypeKind.Intersection;
  
  // Types membres de l'intersection
  types: Type[];

  constructor(types: Type[] = []) {
    this.types = types;
    this.normalize();
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
    
    for (let i = 0; i < this.types.length; i++) {
      if (!this.types[i].equals(other.types[i])) {
        return false;
      }
    }
    
    return true;
  }

  clone(): Type {
    return new IntersectionType(this.types.map(t => t.clone()));
  }

  /**
   * Normaliser l'intersection en supprimant les doublons
   */
  private normalize(): void {
    const uniqueTypes: Type[] = [];
    const seen: Map<string, Type> = new Map();
    
    for (const type of this.types) {
      const key = type.toString();
      if (!seen.has(key)) {
        seen.set(key, type);
        uniqueTypes.push(type);
      }
    }
    
    this.types = uniqueTypes;
  }

  /**
   * Ajouter un type à l'intersection
   */
  addType(type: Type): void {
    this.types.push(type);
    this.normalize();
  }

  /**
   * Ajouter plusieurs types à l'intersection
   */
  addTypes(...types: Type[]): void {
    this.types.push(...types);
    this.normalize();
  }

  /**
   * Supprimer un type de l'intersection
   */
  removeType(type: Type): boolean {
    const index = this.types.findIndex(t => t.equals(type));
    if (index !== -1) {
      this.types.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Obtenir les types membres
   */
  getTypes(): Type[] {
    return [...this.types];
  }

  /**
   * Obtenir le nombre de types
   */
  getTypeCount(): number {
    return this.types.length;
  }

  /**
   * Vérifier si l'intersection contient un type
   */
  hasType(type: Type): boolean {
    return this.types.some(t => t.equals(type));
  }

  /**
   * Vérifier si l'intersection est vide
   */
  isEmpty(): boolean {
    return this.types.length === 0;
  }

  /**
   * Fusionner avec une autre intersection
   */
  merge(other: IntersectionType): IntersectionType {
    const mergedTypes = [...this.types, ...other.types];
    return new IntersectionType(mergedTypes);
  }

  /**
   * Simplifier l'intersection
   */
  simplify(typeSystem: TypeSystem): IntersectionType {
    const simplifiedTypes: Type[] = [];
    
    for (const type of this.types) {
      // Si le type est any ou unknown, l'intersection entière devient any/unknown
      if (type.kind === TypeKind.Any) {
        return new IntersectionType([typeSystem.anyType]);
      }
      if (type.kind === TypeKind.Unknown) {
        return new IntersectionType([typeSystem.unknownType]);
      }
      
      // Si le type est never, on peut l'ignorer
      if (type.kind === TypeKind.Never) {
        continue;
      }
      
      simplifiedTypes.push(type);
    }
    
    return new IntersectionType(simplifiedTypes);
  }

  /**
   * Vérifier si l'intersection est assignable à un autre type
   */
  isAssignableTo(other: Type, typeSystem: TypeSystem): boolean {
    // Une intersection est assignable à un type si elle est assignable à ce type
    // (c'est-à-dire que tous ses membres sont compatibles)
    for (const type of this.types) {
      if (!typeSystem.isAssignable(type, other)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Vérifier si un type est assignable à l'intersection
   */
  isAssignableFrom(other: Type, typeSystem: TypeSystem): boolean {
    // Un type est assignable à une intersection si il est assignable à tous ses membres
    return this.types.every(t => typeSystem.isAssignable(other, t));
  }

  /**
   * Résoudre l'intersection à un type unique si possible
   */
  resolveToSingleType(typeSystem: TypeSystem): Type | null {
    if (this.types.length === 1) {
      return this.types[0];
    }
    
    // Si l'intersection contient any ou unknown, retourner ce type
    for (const type of this.types) {
      if (type.kind === TypeKind.Any) {
        return type;
      }
      if (type.kind === TypeKind.Unknown) {
        return type;
      }
    }
    
    return null;
  }
}

/**
 * Type Discriminated Union - Union discriminée avec une propriété de discrimination
 */
export class DiscriminatedUnionType extends UnionType {
  // Propriété de discrimination
  discriminator: string;
  
  // Valeurs de discrimination pour chaque type
  discriminatorValues: Map<Type, any> = new Map();

  constructor(discriminator: string, types: Type[] = []) {
    super(types);
    this.discriminator = discriminator;
  }

  toString(): string {
    return `DiscriminatedUnion<${this.discriminator}>(${super.toString()})`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      discriminator: this.discriminator,
      discriminatorValues: Object.fromEntries(
        Array.from(this.discriminatorValues.entries()).map(([type, value]) => 
          [type.toJSON(), value]
        )
      ),
    };
  }

  clone(): DiscriminatedUnionType {
    const clone = new DiscriminatedUnionType(this.discriminator, this.types.map(t => t.clone()));
    clone.discriminatorValues = new Map(this.discriminatorValues);
    clone.isSealed = this.isSealed;
    return clone;
  }

  /**
   * Définir la valeur de discrimination pour un type
   */
  setDiscriminatorValue(type: Type, value: any): void {
    this.discriminatorValues.set(type, value);
  }

  /**
   * Obtenir la valeur de discrimination pour un type
   */
  getDiscriminatorValue(type: Type): any | undefined {
    return this.discriminatorValues.get(type);
  }

  /**
   * Obtenir le type correspondant à une valeur de discrimination
   */
  getTypeByDiscriminatorValue(value: any): Type | undefined {
    for (const [type, discriminatorValue] of this.discriminatorValues) {
      if (discriminatorValue === value) {
        return type;
      }
    }
    return undefined;
  }

  /**
   * Vérifier si une valeur de discrimination est valide
   */
  hasDiscriminatorValue(value: any): boolean {
    return Array.from(this.discriminatorValues.values()).includes(value);
  }

  /**
   * Obtenir la propriété de discrimination
   */
  getDiscriminator(): string {
    return this.discriminator;
  }

  /**
   * Définir la propriété de discrimination
   */
  setDiscriminator(discriminator: string): void {
    this.discriminator = discriminator;
  }
}

/**
 * Fabrique de types union et intersection
 */
export class UnionTypeFactory {
  private typeSystem: TypeSystem;

  constructor(typeSystem: TypeSystem) {
    this.typeSystem = typeSystem;
  }

  /**
   * Créer un type union
   */
  createUnion(types: Type[] = []): UnionType {
    return new UnionType(types);
  }

  /**
   * Créer un type intersection
   */
  createIntersection(types: Type[] = []): IntersectionType {
    return new IntersectionType(types);
  }

  /**
   * Créer un type discriminated union
   */
  createDiscriminatedUnion(discriminator: string, types: Type[] = []): DiscriminatedUnionType {
    return new DiscriminatedUnionType(discriminator, types);
  }

  /**
   * Créer une union à partir de deux types
   */
  createUnionFrom(type1: Type, type2: Type): UnionType {
    return new UnionType([type1, type2]);
  }

  /**
   * Créer une intersection à partir de deux types
   */
  createIntersectionFrom(type1: Type, type2: Type): IntersectionType {
    return new IntersectionType([type1, type2]);
  }

  /**
   * Fusionner deux unions
   */
  mergeUnions(union1: UnionType, union2: UnionType): UnionType {
    return union1.merge(union2);
  }

  /**
   * Fusionner deux intersections
   */
  mergeIntersections(intersection1: IntersectionType, intersection2: IntersectionType): IntersectionType {
    return intersection1.merge(intersection2);
  }

  /**
   * Simplifier une union
   */
  simplifyUnion(union: UnionType): UnionType {
    return union.simplify(this.typeSystem);
  }

  /**
   * Simplifier une intersection
   */
  simplifyIntersection(intersection: IntersectionType): IntersectionType {
    return intersection.simplify(this.typeSystem);
  }

  /**
   * Créer depuis un JSON
   */
  fromJSON(json: any): Type {
    switch (json.kind) {
      case 'Union':
        return this.createUnion(
          json.types.map((t: any) => this.typeSystem.fromJSON(t))
        );
      case 'Intersection':
        return this.createIntersection(
          json.types.map((t: any) => this.typeSystem.fromJSON(t))
        );
      case 'DiscriminatedUnion':
        return this.createDiscriminatedUnion(
          json.discriminator,
          json.types.map((t: any) => this.typeSystem.fromJSON(t))
        );
      default:
        return this.typeSystem.anyType;
    }
  }
}

/**
 * Créer une fabrique de types union
 */
export function createUnionTypeFactory(typeSystem: TypeSystem): UnionTypeFactory {
  return new UnionTypeFactory(typeSystem);
}

/**
 * Utilitaires pour les types union et intersection
 */
export class UnionUtils {
  /**
   * Vérifier si un type est une union
   */
  static isUnionType(type: Type): type is UnionType {
    return type instanceof UnionType || type instanceof DiscriminatedUnionType;
  }

  /**
   * Vérifier si un type est une intersection
   */
  static isIntersectionType(type: Type): type is IntersectionType {
    return type instanceof IntersectionType;
  }

  /**
   * Vérifier si un type est une union discriminée
   */
  static isDiscriminatedUnionType(type: Type): type is DiscriminatedUnionType {
    return type instanceof DiscriminatedUnionType;
  }

  /**
   * Obtenir les types d'une union
   */
  static getUnionTypes(type: Type): Type[] {
    if (type instanceof UnionType) {
      return type.getTypes();
    }
    return [type];
  }

  /**
   * Obtenir les types d'une intersection
   */
  static getIntersectionTypes(type: Type): Type[] {
    if (type instanceof IntersectionType) {
      return type.getTypes();
    }
    return [type];
  }

  /**
   * Vérifier si un type est dans une union
   */
  static isTypeInUnion(union: UnionType, type: Type): boolean {
    return union.hasType(type);
  }

  /**
   * Vérifier si un type est dans une intersection
   */
  static isTypeInIntersection(intersection: IntersectionType, type: Type): boolean {
    return intersection.hasType(type);
  }

  /**
   * Fusionner plusieurs unions
   */
  static mergeUnions(...unions: UnionType[]): UnionType {
    if (unions.length === 0) {
      return new UnionType();
    }
    
    let result = unions[0].clone() as UnionType;
    for (let i = 1; i < unions.length; i++) {
      result = result.merge(unions[i]);
    }
    
    return result;
  }

  /**
   * Fusionner plusieurs intersections
   */
  static mergeIntersections(...intersections: IntersectionType[]): IntersectionType {
    if (intersections.length === 0) {
      return new IntersectionType();
    }
    
    let result = intersections[0].clone() as IntersectionType;
    for (let i = 1; i < intersections.length; i++) {
      result = result.merge(intersections[i]);
    }
    
    return result;
  }

  /**
   * Vérifier si deux unions sont équivalentes
   */
  static areUnionsEquivalent(union1: UnionType, union2: UnionType, typeSystem: TypeSystem): boolean {
    const types1 = union1.getTypes();
    const types2 = union2.getTypes();
    
    if (types1.length !== types2.length) {
      return false;
    }
    
    return types1.every(t1 => 
      types2.some(t2 => typeSystem.isAssignable(t1, t2) && typeSystem.isAssignable(t2, t1))
    );
  }

  /**
   * Vérifier si deux intersections sont équivalentes
   */
  static areIntersectionsEquivalent(intersection1: IntersectionType, intersection2: IntersectionType, typeSystem: TypeSystem): boolean {
    const types1 = intersection1.getTypes();
    const types2 = intersection2.getTypes();
    
    if (types1.length !== types2.length) {
      return false;
    }
    
    return types1.every(t1 => 
      types2.some(t2 => typeSystem.isAssignable(t1, t2) && typeSystem.isAssignable(t2, t1))
    );
  }

  /**
   * Distribuer une union sur une intersection
   */
  static distributeUnionOverIntersection(
    union: UnionType,
    intersection: IntersectionType
  ): UnionType {
    const distributedTypes: Type[] = [];
    
    for (const unionType of union.getTypes()) {
      for (const intersectionType of intersection.getTypes()) {
        // Créer une intersection de chaque paire
        distributedTypes.push(
          new IntersectionType([unionType.clone(), intersectionType.clone()])
        );
      }
    }
    
    return new UnionType(distributedTypes);
  }
}

export {
  UnionType as default,
  IntersectionType,
  DiscriminatedUnionType,
  UnionTypeFactory,
  UnionUtils,
};
