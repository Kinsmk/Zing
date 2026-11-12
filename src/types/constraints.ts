/**
 * Constraints - Contraintes de type pour Zinga
 * 
 * Ce module définit les contraintes de type avancées pour le système de types,
 * incluant les contraintes génériques, les contraintes conditionnelles, etc.
 */

import { Type, TypeKind, TypeSystem, PrimitiveType, CompositeType } from './type-system';
import { GenericTypeParameter } from './generic-types';
import { UnionType, IntersectionType } from './unions';

/**
 * Type de contrainte
 */
export type ConstraintType = 
  | 'extends'
  | 'super'
  | 'implements'
  | 'new'
  | 'keyof'
  | 'typeof'
  | 'instanceof'
  | 'in'
  | 'is'
  | 'satisfies';

/**
 * Contrainte de type de base
 */
export interface Constraint {
  type: ConstraintType;
  toString(): string;
  toJSON(): any;
  equals(other: Constraint): boolean;
  clone(): Constraint;
  validate(targetType: Type, typeSystem: TypeSystem): boolean;
}

/**
 * Contrainte Extends - Le type doit étendre un autre type
 */
export class ExtendsConstraint implements Constraint {
  type: ConstraintType = 'extends';
  
  // Type de base
  baseType: Type;

  constructor(baseType: Type) {
    this.baseType = baseType;
  }

  toString(): string {
    return `extends ${this.baseType.toString()}`;
  }

  toJSON(): any {
    return {
      type: this.type,
      baseType: this.baseType.toJSON(),
    };
  }

  equals(other: Constraint): boolean {
    return other instanceof ExtendsConstraint && 
           this.baseType.equals(other.baseType);
  }

  clone(): ExtendsConstraint {
    return new ExtendsConstraint(this.baseType.clone());
  }

  validate(targetType: Type, typeSystem: TypeSystem): boolean {
    return typeSystem.isAssignable(targetType, this.baseType);
  }
}

/**
 * Contrainte Super - Le type doit être un super-type d'un autre type
 */
export class SuperConstraint implements Constraint {
  type: ConstraintType = 'super';
  
  // Type dérivé
  derivedType: Type;

  constructor(derivedType: Type) {
    this.derivedType = derivedType;
  }

  toString(): string {
    return `super ${this.derivedType.toString()}`;
  }

  toJSON(): any {
    return {
      type: this.type,
      derivedType: this.derivedType.toJSON(),
    };
  }

  equals(other: Constraint): boolean {
    return other instanceof SuperConstraint && 
           this.derivedType.equals(other.derivedType);
  }

  clone(): SuperConstraint {
    return new SuperConstraint(this.derivedType.clone());
  }

  validate(targetType: Type, typeSystem: TypeSystem): boolean {
    return typeSystem.isAssignable(this.derivedType, targetType);
  }
}

/**
 * Contrainte Implements - Le type doit implémenter une interface
 */
export class ImplementsConstraint implements Constraint {
  type: ConstraintType = 'implements';
  
  // Interface à implémenter
  interfaceType: Type;

  constructor(interfaceType: Type) {
    this.interfaceType = interfaceType;
  }

  toString(): string {
    return `implements ${this.interfaceType.toString()}`;
  }

  toJSON(): any {
    return {
      type: this.type,
      interfaceType: this.interfaceType.toJSON(),
    };
  }

  equals(other: Constraint): boolean {
    return other instanceof ImplementsConstraint && 
           this.interfaceType.equals(other.interfaceType);
  }

  clone(): ImplementsConstraint {
    return new ImplementsConstraint(this.interfaceType.clone());
  }

  validate(targetType: Type, typeSystem: TypeSystem): boolean {
    // Vérifier que le type cible implémente l'interface
    if (targetType instanceof CompositeType) {
      // Vérifier que toutes les propriétés et méthodes de l'interface sont présentes
      if (this.interfaceType instanceof CompositeType) {
        for (const [name, memberType] of this.interfaceType.members) {
          const targetMember = targetType.getMember(name);
          if (!targetMember || !typeSystem.isAssignable(memberType, targetMember)) {
            return false;
          }
        }
        return true;
      }
    }
    
    return false;
  }
}

/**
 * Contrainte New - Le type doit être constructible
 */
export class NewConstraint implements Constraint {
  type: ConstraintType = 'new';
  
  // Paramètres du constructeur
  constructorParameters: Type[];
  
  // Type de retour du constructeur
  constructorReturnType: Type;

  constructor(constructorParameters: Type[] = [], constructorReturnType: Type = new PrimitiveType(TypeKind.Any, 'any')) {
    this.constructorParameters = constructorParameters;
    this.constructorReturnType = constructorReturnType;
  }

  toString(): string {
    const params = this.constructorParameters.map(t => t.toString()).join(', ');
    return `new (${params}) => ${this.constructorReturnType.toString()}`;
  }

  toJSON(): any {
    return {
      type: this.type,
      constructorParameters: this.constructorParameters.map(t => t.toJSON()),
      constructorReturnType: this.constructorReturnType.toJSON(),
    };
  }

  equals(other: Constraint): boolean {
    return other instanceof NewConstraint && 
           this.constructorParameters.length === other.constructorParameters.length &&
           this.constructorParameters.every((p, i) => p.equals(other.constructorParameters[i])) &&
           this.constructorReturnType.equals(other.constructorReturnType);
  }

  clone(): NewConstraint {
    return new NewConstraint(
      this.constructorParameters.map(t => t.clone()),
      this.constructorReturnType.clone()
    );
  }

  validate(targetType: Type, typeSystem: TypeSystem): boolean {
    // Vérifier que le type a un constructeur compatible
    if (targetType instanceof CompositeType) {
      // Vérifier si le type a des constructeurs
      if ('constructors' in targetType) {
        const constructors = (targetType as any).constructors as Type[];
        return constructors.length > 0;
      }
    }
    
    return false;
  }
}

/**
 * Contrainte KeyOf - Le type doit être une clé d'un autre type
 */
export class KeyOfConstraint implements Constraint {
  type: ConstraintType = 'keyof';
  
  // Type dont on extrait les clés
  sourceType: Type;

  constructor(sourceType: Type) {
    this.sourceType = sourceType;
  }

  toString(): string {
    return `keyof ${this.sourceType.toString()}`;
  }

  toJSON(): any {
    return {
      type: this.type,
      sourceType: this.sourceType.toJSON(),
    };
  }

  equals(other: Constraint): boolean {
    return other instanceof KeyOfConstraint && 
           this.sourceType.equals(other.sourceType);
  }

  clone(): KeyOfConstraint {
    return new KeyOfConstraint(this.sourceType.clone());
  }

  validate(targetType: Type, typeSystem: TypeSystem): boolean {
    // Vérifier que le type cible est une clé valide du type source
    if (this.sourceType instanceof CompositeType) {
      const keys = Array.from(this.sourceType.members.keys());
      
      if (targetType.kind === TypeKind.String) {
        return keys.some(k => k === (targetType as any).value);
      }
      
      // Pour les string literals
      if (targetType.kind === TypeKind.Literal) {
        const literal = targetType as any;
        return keys.includes(String(literal.value));
      }
    }
    
    return false;
  }

  /**
   * Obtenir les clés du type source
   */
  getKeys(typeSystem: TypeSystem): string[] {
    if (this.sourceType instanceof CompositeType) {
      return Array.from(this.sourceType.members.keys());
    }
    return [];
  }
}

/**
 * Contrainte TypeOf - Le type doit être le type d'une valeur
 */
export class TypeOfConstraint implements Constraint {
  type: ConstraintType = 'typeof';
  
  // Valeur
  value: any;
  
  // Type de la valeur
  valueType?: Type;

  constructor(value: any, valueType?: Type) {
    this.value = value;
    this.valueType = valueType;
  }

  toString(): string {
    return `typeof ${typeof this.value}`;
  }

  toJSON(): any {
    return {
      type: this.type,
      value: this.value,
      valueType: this.valueType?.toJSON(),
    };
  }

  equals(other: Constraint): boolean {
    return other instanceof TypeOfConstraint && 
           this.value === other.value;
  }

  clone(): TypeOfConstraint {
    return new TypeOfConstraint(this.value, this.valueType?.clone());
  }

  validate(targetType: Type, typeSystem: TypeSystem): boolean {
    const expectedType = this.valueType || typeSystem.getTypeOf(this.value);
    return typeSystem.isAssignable(targetType, expectedType);
  }
}

/**
 * Contrainte InstanceOf - Le type doit être une instance d'une classe
 */
export class InstanceOfConstraint implements Constraint {
  type: ConstraintType = 'instanceof';
  
  // Type de la classe
  classType: Type;

  constructor(classType: Type) {
    this.classType = classType;
  }

  toString(): string {
    return `instanceof ${this.classType.toString()}`;
  }

  toJSON(): any {
    return {
      type: this.type,
      classType: this.classType.toJSON(),
    };
  }

  equals(other: Constraint): boolean {
    return other instanceof InstanceOfConstraint && 
           this.classType.equals(other.classType);
  }

  clone(): InstanceOfConstraint {
    return new InstanceOfConstraint(this.classType.clone());
  }

  validate(targetType: Type, typeSystem: TypeSystem): boolean {
    // Vérifier que le type cible est une instance de la classe
    if (targetType instanceof CompositeType && this.classType instanceof CompositeType) {
      // Vérifier l'héritage
      return targetType.baseTypes.some(base => base.equals(this.classType));
    }
    
    return false;
  }
}

/**
 * Contrainte In - Le type doit être une propriété d'un autre type
 */
export class InConstraint implements Constraint {
  type: ConstraintType = 'in';
  
  // Type source
  sourceType: Type;
  
  // Nom de la propriété
  propertyName: string;

  constructor(sourceType: Type, propertyName: string) {
    this.sourceType = sourceType;
    this.propertyName = propertyName;
  }

  toString(): string {
    return `${this.propertyName} in ${this.sourceType.toString()}`;
  }

  toJSON(): any {
    return {
      type: this.type,
      sourceType: this.sourceType.toJSON(),
      propertyName: this.propertyName,
    };
  }

  equals(other: Constraint): boolean {
    return other instanceof InConstraint && 
           this.sourceType.equals(other.sourceType) &&
           this.propertyName === other.propertyName;
  }

  clone(): InConstraint {
    return new InConstraint(this.sourceType.clone(), this.propertyName);
  }

  validate(targetType: Type, typeSystem: TypeSystem): boolean {
    // Vérifier que la propriété existe dans le type source
    if (this.sourceType instanceof CompositeType) {
      return this.sourceType.members.has(this.propertyName);
    }
    
    return false;
  }
}

/**
 * Contrainte Is - Contrainte de type guard
 */
export class IsConstraint implements Constraint {
  type: ConstraintType = 'is';
  
  // Type à vérifier
  checkType: Type;

  constructor(checkType: Type) {
    this.checkType = checkType;
  }

  toString(): string {
    return `is ${this.checkType.toString()}`;
  }

  toJSON(): any {
    return {
      type: this.type,
      checkType: this.checkType.toJSON(),
    };
  }

  equals(other: Constraint): boolean {
    return other instanceof IsConstraint && 
           this.checkType.equals(other.checkType);
  }

  clone(): IsConstraint {
    return new IsConstraint(this.checkType.clone());
  }

  validate(targetType: Type, typeSystem: TypeSystem): boolean {
    // Une contrainte 'is' est toujours valide pour le type guard
    // La validation réelle se fait à l'exécution
    return true;
  }
}

/**
 * Contrainte Satisfies - Le type doit satisfaire une contrainte
 */
export class SatisfiesConstraint implements Constraint {
  type: ConstraintType = 'satisfies';
  
  // Contrainte à satisfaire
  constraint: Constraint;

  constructor(constraint: Constraint) {
    this.constraint = constraint;
  }

  toString(): string {
    return `satisfies ${this.constraint.toString()}`;
  }

  toJSON(): any {
    return {
      type: this.type,
      constraint: this.constraint.toJSON(),
    };
  }

  equals(other: Constraint): boolean {
    return other instanceof SatisfiesConstraint && 
           this.constraint.equals(other.constraint);
  }

  clone(): SatisfiesConstraint {
    return new SatisfiesConstraint(this.constraint.clone());
  }

  validate(targetType: Type, typeSystem: TypeSystem): boolean {
    return this.constraint.validate(targetType, typeSystem);
  }
}

/**
 * Contrainte composite (AND)
 */
export class AndConstraint implements Constraint {
  type: ConstraintType = 'extends';
  
  // Contraintes à satisfaire
  constraints: Constraint[];

  constructor(...constraints: Constraint[]) {
    this.constraints = constraints;
  }

  toString(): string {
    return this.constraints.map(c => c.toString()).join(' & ');
  }

  toJSON(): any {
    return {
      type: this.type,
      constraints: this.constraints.map(c => c.toJSON()),
    };
  }

  equals(other: Constraint): boolean {
    return other instanceof AndConstraint &&
           this.constraints.length === other.constraints.length &&
           this.constraints.every((c, i) => c.equals(other.constraints[i]));
  }

  clone(): AndConstraint {
    return new AndConstraint(...this.constraints.map(c => c.clone()));
  }

  validate(targetType: Type, typeSystem: TypeSystem): boolean {
    return this.constraints.every(c => c.validate(targetType, typeSystem));
  }

  /**
   * Ajouter une contrainte
   */
  addConstraint(constraint: Constraint): void {
    this.constraints.push(constraint);
  }

  /**
   * Obtenir les contraintes
   */
  getConstraints(): Constraint[] {
    return [...this.constraints];
  }
}

/**
 * Contrainte composite (OR)
 */
export class OrConstraint implements Constraint {
  type: ConstraintType = 'extends';
  
  // Contraintes alternatives
  constraints: Constraint[];

  constructor(...constraints: Constraint[]) {
    this.constraints = constraints;
  }

  toString(): string {
    return this.constraints.map(c => c.toString()).join(' | ');
  }

  toJSON(): any {
    return {
      type: this.type,
      constraints: this.constraints.map(c => c.toJSON()),
    };
  }

  equals(other: Constraint): boolean {
    return other instanceof OrConstraint &&
           this.constraints.length === other.constraints.length &&
           this.constraints.every((c, i) => c.equals(other.constraints[i]));
  }

  clone(): OrConstraint {
    return new OrConstraint(...this.constraints.map(c => c.clone()));
  }

  validate(targetType: Type, typeSystem: TypeSystem): boolean {
    return this.constraints.some(c => c.validate(targetType, typeSystem));
  }

  /**
   * Ajouter une contrainte
   */
  addConstraint(constraint: Constraint): void {
    this.constraints.push(constraint);
  }

  /**
   * Obtenir les contraintes
   */
  getConstraints(): Constraint[] {
    return [...this.constraints];
  }
}

/**
 * Fabrique de contraintes
 */
export class ConstraintFactory {
  private typeSystem: TypeSystem;

  constructor(typeSystem: TypeSystem) {
    this.typeSystem = typeSystem;
  }

  /**
   * Créer une contrainte extends
   */
  createExtendsConstraint(baseType: Type): ExtendsConstraint {
    return new ExtendsConstraint(baseType);
  }

  /**
   * Créer une contrainte super
   */
  createSuperConstraint(derivedType: Type): SuperConstraint {
    return new SuperConstraint(derivedType);
  }

  /**
   * Créer une contrainte implements
   */
  createImplementsConstraint(interfaceType: Type): ImplementsConstraint {
    return new ImplementsConstraint(interfaceType);
  }

  /**
   * Créer une contrainte new
   */
  createNewConstraint(
    constructorParameters: Type[] = [],
    constructorReturnType: Type = this.typeSystem.anyType
  ): NewConstraint {
    return new NewConstraint(constructorParameters, constructorReturnType);
  }

  /**
   * Créer une contrainte keyof
   */
  createKeyOfConstraint(sourceType: Type): KeyOfConstraint {
    return new KeyOfConstraint(sourceType);
  }

  /**
   * Créer une contrainte typeof
   */
  createTypeOfConstraint(value: any, valueType?: Type): TypeOfConstraint {
    return new TypeOfConstraint(value, valueType);
  }

  /**
   * Créer une contrainte instanceof
   */
  createInstanceOfConstraint(classType: Type): InstanceOfConstraint {
    return new InstanceOfConstraint(classType);
  }

  /**
   * Créer une contrainte in
   */
  createInConstraint(sourceType: Type, propertyName: string): InConstraint {
    return new InConstraint(sourceType, propertyName);
  }

  /**
   * Créer une contrainte is
   */
  createIsConstraint(checkType: Type): IsConstraint {
    return new IsConstraint(checkType);
  }

  /**
   * Créer une contrainte satisfies
   */
  createSatisfiesConstraint(constraint: Constraint): SatisfiesConstraint {
    return new SatisfiesConstraint(constraint);
  }

  /**
   * Créer une contrainte AND
   */
  createAndConstraint(...constraints: Constraint[]): AndConstraint {
    return new AndConstraint(...constraints);
  }

  /**
   * Créer une contrainte OR
   */
  createOrConstraint(...constraints: Constraint[]): OrConstraint {
    return new OrConstraint(...constraints);
  }

  /**
   * Créer une contrainte depuis un JSON
   */
  fromJSON(json: any): Constraint {
    switch (json.type) {
      case 'extends':
        return this.createExtendsConstraint(this.typeSystem.fromJSON(json.baseType));
      case 'super':
        return this.createSuperConstraint(this.typeSystem.fromJSON(json.derivedType));
      case 'implements':
        return this.createImplementsConstraint(this.typeSystem.fromJSON(json.interfaceType));
      case 'new':
        return this.createNewConstraint(
          json.constructorParameters.map((p: any) => this.typeSystem.fromJSON(p)),
          this.typeSystem.fromJSON(json.constructorReturnType)
        );
      case 'keyof':
        return this.createKeyOfConstraint(this.typeSystem.fromJSON(json.sourceType));
      case 'typeof':
        return this.createTypeOfConstraint(json.value, json.valueType ? this.typeSystem.fromJSON(json.valueType) : undefined);
      case 'instanceof':
        return this.createInstanceOfConstraint(this.typeSystem.fromJSON(json.classType));
      case 'in':
        return this.createInConstraint(
          this.typeSystem.fromJSON(json.sourceType),
          json.propertyName
        );
      case 'is':
        return this.createIsConstraint(this.typeSystem.fromJSON(json.checkType));
      case 'satisfies':
        return this.createSatisfiesConstraint(this.fromJSON(json.constraint));
      default:
        return this.createExtendsConstraint(this.typeSystem.anyType);
    }
  }

  /**
   * Créer une contrainte à partir d'une chaîne
   */
  createFromString(constraintStr: string): Constraint {
    // Parsing simple des contraintes
    // Format attendu: "extends Type", "implements Interface", etc.
    
    if (constraintStr.startsWith('extends ')) {
      const typeStr = constraintStr.substring(8);
      return this.createExtendsConstraint(this.parseType(typeStr));
    }
    
    if (constraintStr.startsWith('implements ')) {
      const typeStr = constraintStr.substring(11);
      return this.createImplementsConstraint(this.parseType(typeStr));
    }
    
    if (constraintStr.startsWith('keyof ')) {
      const typeStr = constraintStr.substring(6);
      return this.createKeyOfConstraint(this.parseType(typeStr));
    }
    
    if (constraintStr.startsWith('new ')) {
      return this.createNewConstraint();
    }
    
    return this.createExtendsConstraint(this.typeSystem.anyType);
  }

  /**
   * Parser un type depuis une chaîne
   */
  private parseType(typeStr: string): Type {
    switch (typeStr.toLowerCase()) {
      case 'any':
        return this.typeSystem.anyType;
      case 'unknown':
        return this.typeSystem.unknownType;
      case 'never':
        return this.typeSystem.neverType;
      case 'void':
        return this.typeSystem.voidType;
      case 'null':
        return this.typeSystem.nullType;
      case 'undefined':
        return this.typeSystem.undefinedType;
      case 'boolean':
        return this.typeSystem.booleanType;
      case 'number':
        return this.typeSystem.numberType;
      case 'string':
        return this.typeSystem.stringType;
      case 'symbol':
        return this.typeSystem.symbolType;
      case 'bigint':
        return this.typeSystem.bigIntType;
      default:
        return this.typeSystem.anyType;
    }
  }
}

/**
 * Créer une fabrique de contraintes
 */
export function createConstraintFactory(typeSystem: TypeSystem): ConstraintFactory {
  return new ConstraintFactory(typeSystem);
}

/**
 * Utilitaires pour les contraintes
 */
export class ConstraintUtils {
  /**
   * Vérifier si une contrainte est satisfaite
   */
  static isSatisfied(constraint: Constraint, targetType: Type, typeSystem: TypeSystem): boolean {
    return constraint.validate(targetType, typeSystem);
  }

  /**
   * Vérifier si un type satisfait toutes les contraintes
   */
  static satisfiesAllConstraints(targetType: Type, constraints: Constraint[], typeSystem: TypeSystem): boolean {
    return constraints.every(c => c.validate(targetType, typeSystem));
  }

  /**
   * Vérifier si un type satisfait au moins une contrainte
   */
  static satisfiesAnyConstraint(targetType: Type, constraints: Constraint[], typeSystem: TypeSystem): boolean {
    return constraints.some(c => c.validate(targetType, typeSystem));
  }

  /**
   * Obtenir les contraintes non satisfaites
   */
  static getUnsatisfiedConstraints(targetType: Type, constraints: Constraint[], typeSystem: TypeSystem): Constraint[] {
    return constraints.filter(c => !c.validate(targetType, typeSystem));
  }

  /**
   * Vérifier si une contrainte est une contrainte extends
   */
  static isExtendsConstraint(constraint: Constraint): constraint is ExtendsConstraint {
    return constraint instanceof ExtendsConstraint;
  }

  /**
   * Vérifier si une contrainte est une contrainte implements
   */
  static isImplementsConstraint(constraint: Constraint): constraint is ImplementsConstraint {
    return constraint instanceof ImplementsConstraint;
  }

  /**
   * Vérifier si une contrainte est une contrainte new
   */
  static isNewConstraint(constraint: Constraint): constraint is NewConstraint {
    return constraint instanceof NewConstraint;
  }

  /**
   * Vérifier si une contrainte est une contrainte keyof
   */
  static isKeyOfConstraint(constraint: Constraint): constraint is KeyOfConstraint {
    return constraint instanceof KeyOfConstraint;
  }

  /**
   * Vérifier si une contrainte est une contrainte composite
   */
  static isCompositeConstraint(constraint: Constraint): constraint is AndConstraint | OrConstraint {
    return constraint instanceof AndConstraint || constraint instanceof OrConstraint;
  }

  /**
   * Simplifier une contrainte
   */
  static simplifyConstraint(constraint: Constraint, typeSystem: TypeSystem): Constraint {
    if (constraint instanceof AndConstraint) {
      // Simplifier les contraintes AND
      const simplified = constraint.constraints.map(c => this.simplifyConstraint(c, typeSystem));
      return new AndConstraint(...simplified);
    }
    
    if (constraint instanceof OrConstraint) {
      // Simplifier les contraintes OR
      const simplified = constraint.constraints.map(c => this.simplifyConstraint(c, typeSystem));
      return new OrConstraint(...simplified);
    }
    
    return constraint;
  }

  /**
   * Convertir une contrainte en type
   */
  static constraintToType(constraint: Constraint, typeSystem: TypeSystem): Type {
    if (constraint instanceof ExtendsConstraint) {
      return constraint.baseType;
    }
    
    if (constraint instanceof ImplementsConstraint) {
      return constraint.interfaceType;
    }
    
    if (constraint instanceof KeyOfConstraint) {
      // Retourner le type des clés
      if (constraint.sourceType instanceof CompositeType) {
        return typeSystem.stringType;
      }
    }
    
    return typeSystem.anyType;
  }
}

export {
  Constraint as default,
  ConstraintType,
  ExtendsConstraint,
  SuperConstraint,
  ImplementsConstraint,
  NewConstraint,
  KeyOfConstraint,
  TypeOfConstraint,
  InstanceOfConstraint,
  InConstraint,
  IsConstraint,
  SatisfiesConstraint,
  AndConstraint,
  OrConstraint,
  ConstraintFactory,
  ConstraintUtils,
};
