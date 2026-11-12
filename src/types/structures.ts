/**
 * Structures - Types structuraux avancés pour Zinga
 * 
 * Ce module étend les types composites avec des fonctionnalités de typage structural
 * avancé, incluant les types struct, record, et les utilitaires de compatibilité structurelle.
 */

import { Type, TypeKind, CompositeType, FunctionType, TypeSystem, TypeParameter, PrimitiveType } from './type-system';
import { ClassType, InterfaceType, StructType as BaseStructType, EnumType, TypeAliasType } from './composite-types';
import { GenericType, ParameterizedGenericType, GenericTypeParameter } from './generic-types';

/**
 * Type Record - Représente un type objet avec des propriétés dynamiques
 */
export class RecordType extends CompositeType {
  kind: TypeKind = TypeKind.Object;
  
  // Type des clés
  keyType: Type;
  
  // Type des valeurs
  valueType: Type;
  
  // Indique si le record est scellé (pas de propriétés supplémentaires)
  isSealed: boolean = false;

  constructor(keyType: Type, valueType: Type, name: string = 'Record') {
    super(name, TypeKind.Object);
    this.keyType = keyType;
    this.valueType = valueType;
  }

  toString(): string {
    return `Record<${this.keyType.toString()}, ${this.valueType.toString()}>`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      keyType: this.keyType.toJSON(),
      valueType: this.valueType.toJSON(),
      isSealed: this.isSealed,
    };
  }

  clone(): RecordType {
    const clone = new RecordType(
      this.keyType.clone(),
      this.valueType.clone(),
      this.name
    );
    clone.isSealed = this.isSealed;
    clone.members = new Map(this.members);
    clone.typeParameters = this.typeParameters?.map(t => t.clone() as TypeParameter);
    clone.baseTypes = this.baseTypes.map(t => t.clone());
    clone.implementedTypes = this.implementedTypes.map(t => t.clone());
    return clone;
  }

  /**
   * Vérifier si un type est assignable à ce record
   */
  isAssignableFrom(other: Type, typeSystem: TypeSystem): boolean {
    if (other instanceof RecordType) {
      return this.keyType.equals(other.keyType) && 
             this.valueType.equals(other.valueType);
    }
    
    if (other instanceof CompositeType) {
      // Vérifier la compatibilité structurelle
      for (const [name, type] of this.members) {
        const otherType = other.getMember(name);
        if (!otherType || !typeSystem.isAssignable(type, otherType)) {
          return false;
        }
      }
      return true;
    }
    
    return false;
  }

  /**
   * Obtenir le type des clés
   */
  getKeyType(): Type {
    return this.keyType;
  }

  /**
   * Obtenir le type des valeurs
   */
  getValueType(): Type {
    return this.valueType;
  }

  /**
   * Définir si le record est scellé
   */
  setSealed(isSealed: boolean): void {
    this.isSealed = isSealed;
  }

  /**
   * Vérifier si le record est scellé
   */
  isRecordSealed(): boolean {
    return this.isSealed;
  }
}

/**
 * Type Struct avancé avec typage nominal optionnel
 */
export class StructType extends BaseStructType {
  // Champs requis
  requiredFields: Set<string> = new Set();
  
  // Champs optionnels
  optionalFields: Map<string, Type> = new Map();
  
  // Indique si la structure est exacte (pas de champs supplémentaires)
  isExact: boolean = false;
  
  // Nom qualifié (pour le typage nominal)
  qualifiedName?: string;

  constructor(name: string) {
    super(name);
  }

  toString(): string {
    if (this.qualifiedName) {
      return this.qualifiedName;
    }
    return `struct ${this.name}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      requiredFields: Array.from(this.requiredFields),
      optionalFields: Object.fromEntries(this.optionalFields),
      isExact: this.isExact,
      qualifiedName: this.qualifiedName,
    };
  }

  clone(): StructType {
    const clone = new StructType(this.name);
    clone.fields = new Map(this.fields);
    clone.methods = new Map(this.methods);
    clone.members = new Map(this.members);
    clone.requiredFields = new Set(this.requiredFields);
    clone.optionalFields = new Map(this.optionalFields);
    clone.isExact = this.isExact;
    clone.qualifiedName = this.qualifiedName;
    return clone;
  }

  /**
   * Ajouter un champ requis
   */
  addRequiredField(name: string, type: Type): void {
    this.addField(name, type);
    this.requiredFields.add(name);
  }

  /**
   * Ajouter un champ optionnel
   */
  addOptionalField(name: string, type: Type): void {
    this.optionalFields.set(name, type);
    this.fields.set(name, type);
    this.members.set(name, type);
  }

  /**
   * Marquer un champ comme requis
   */
  markFieldAsRequired(name: string): void {
    if (this.fields.has(name)) {
      this.requiredFields.add(name);
      this.optionalFields.delete(name);
    }
  }

  /**
   * Marquer un champ comme optionnel
   */
  markFieldAsOptional(name: string): void {
    if (this.fields.has(name)) {
      this.requiredFields.delete(name);
      const type = this.fields.get(name)!;
      this.optionalFields.set(name, type);
    }
  }

  /**
   * Vérifier si un champ est requis
   */
  isFieldRequired(name: string): boolean {
    return this.requiredFields.has(name);
  }

  /**
   * Vérifier si un champ est optionnel
   */
  isFieldOptional(name: string): boolean {
    return this.optionalFields.has(name);
  }

  /**
   * Obtenir tous les champs requis
   */
  getRequiredFields(): Map<string, Type> {
    const result = new Map<string, Type>();
    for (const field of this.requiredFields) {
      const type = this.fields.get(field);
      if (type) {
        result.set(field, type);
      }
    }
    return result;
  }

  /**
   * Obtenir tous les champs optionnels
   */
  getOptionalFields(): Map<string, Type> {
    return new Map(this.optionalFields);
  }

  /**
   * Définir si la structure est exacte
   */
  setExact(isExact: boolean): void {
    this.isExact = isExact;
  }

  /**
   * Vérifier si la structure est exacte
   */
  isExactStruct(): boolean {
    return this.isExact;
  }

  /**
   * Définir le nom qualifié
   */
  setQualifiedName(qualifiedName: string): void {
    this.qualifiedName = qualifiedName;
  }

  /**
   * Obtenir le nom qualifié
   */
  getQualifiedName(): string | undefined {
    return this.qualifiedName;
  }

  /**
   * Vérifier la compatibilité structurelle avec un autre type
   */
  isStructurallyCompatible(other: Type, typeSystem: TypeSystem): boolean {
    if (other instanceof StructType) {
      // Comparaison structurelle
      const thisFields = new Map([...this.fields, ...this.optionalFields]);
      const otherFields = new Map([...other.fields, ...other.optionalFields]);
      
      // Vérifier que tous les champs requis de this sont présents dans other
      for (const [name, type] of this.requiredFields) {
        const fieldType = thisFields.get(name);
        const otherFieldType = otherFields.get(name);
        if (!otherFieldType || !typeSystem.isAssignable(fieldType!, otherFieldType)) {
          return false;
        }
      }
      
      // Si exact, vérifier que other n'a pas de champs supplémentaires
      if (this.isExact && otherFields.size > thisFields.size) {
        return false;
      }
      
      return true;
    }
    
    if (other instanceof CompositeType) {
      // Vérifier la compatibilité avec un type composite
      for (const [name, type] of this.requiredFields) {
        const otherType = other.getMember(name);
        if (!otherType || !typeSystem.isAssignable(type, otherType)) {
          return false;
        }
      }
      return true;
    }
    
    return false;
  }
}

/**
 * Type Tuple structuré (tuple avec noms de champs)
 */
export class StructuredTupleType extends CompositeType {
  kind: TypeKind = TypeKind.Tuple;
  
  // Types des éléments
  elementTypes: Type[];
  
  // Noms des éléments (optionnels)
  elementNames: (string | undefined)[];
  
  // Indique si le tuple est variadique
  isVariadic: boolean = false;
  
  // Type variadique (si applicable)
  variadicType?: Type;

  constructor(
    elementTypes: Type[],
    elementNames: (string | undefined)[] = [],
    name: string = 'StructuredTuple'
  ) {
    super(name, TypeKind.Tuple);
    this.elementTypes = elementTypes;
    this.elementNames = elementNames;
    
    // Initialiser les membres à partir des noms
    for (let i = 0; i < elementNames.length; i++) {
      if (elementNames[i]) {
        this.members.set(elementNames[i], elementTypes[i]);
      }
    }
  }

  toString(): string {
    const elements = this.elementTypes.map((t, i) => {
      const name = this.elementNames[i];
      return name ? `${name}: ${t.toString()}` : t.toString();
    }).join(', ');
    
    if (this.isVariadic && this.variadicType) {
      return `[${elements}, ...${this.variadicType.toString()}]`;
    }
    return `[${elements}]`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      elementTypes: this.elementTypes.map(t => t.toJSON()),
      elementNames: this.elementNames,
      isVariadic: this.isVariadic,
      variadicType: this.variadicType?.toJSON(),
    };
  }

  clone(): StructuredTupleType {
    const clone = new StructuredTupleType(
      this.elementTypes.map(t => t.clone()),
      [...this.elementNames],
      this.name
    );
    clone.isVariadic = this.isVariadic;
    clone.variadicType = this.variadicType?.clone();
    clone.members = new Map(this.members);
    return clone;
  }

  /**
   * Obtenir le type d'un élément par index
   */
  getElementType(index: number): Type | undefined {
    if (index >= 0 && index < this.elementTypes.length) {
      return this.elementTypes[index];
    }
    if (this.isVariadic && this.variadicType && index >= this.elementTypes.length) {
      return this.variadicType;
    }
    return undefined;
  }

  /**
   * Obtenir le nom d'un élément par index
   */
  getElementName(index: number): string | undefined {
    return this.elementNames[index];
  }

  /**
   * Obtenir le type d'un élément par nom
   */
  getElementTypeByName(name: string): Type | undefined {
    const index = this.elementNames.indexOf(name);
    return this.getElementType(index);
  }

  /**
   * Définir le type variadique
   */
  setVariadicType(type: Type): void {
    this.variadicType = type;
    this.isVariadic = true;
  }

  /**
   * Vérifier si le tuple est variadique
   */
  isTupleVariadic(): boolean {
    return this.isVariadic;
  }

  /**
   * Obtenir le nombre d'éléments fixes
   */
  getFixedElementCount(): number {
    return this.elementTypes.length;
  }

  /**
   * Ajouter un élément
   */
  addElement(type: Type, name?: string): void {
    this.elementTypes.push(type);
    this.elementNames.push(name);
    if (name) {
      this.members.set(name, type);
    }
  }

  /**
   * Vérifier la compatibilité avec un autre tuple
   */
  isCompatibleWith(other: StructuredTupleType, typeSystem: TypeSystem): boolean {
    if (this.elementTypes.length !== other.elementTypes.length) {
      return false;
    }
    
    for (let i = 0; i < this.elementTypes.length; i++) {
      if (!typeSystem.isAssignable(this.elementTypes[i], other.elementTypes[i])) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * Type Mapped - Représente un type mappé (mapping de propriétés)
 */
export class MappedType extends CompositeType {
  kind: TypeKind = TypeKind.Object;
  
  // Type source
  sourceType: Type;
  
  // Fonction de mapping (transforme les clés et valeurs)
  keyMapper?: (key: string) => string;
  valueMapper?: (value: Type) => Type;
  
  // Type des clés du résultat
  resultKeyType?: Type;
  
  // Type des valeurs du résultat
  resultValueType?: Type;

  constructor(
    name: string,
    sourceType: Type,
    resultKeyType: Type,
    resultValueType: Type
  ) {
    super(name, TypeKind.Object);
    this.sourceType = sourceType;
    this.resultKeyType = resultKeyType;
    this.resultValueType = resultValueType;
  }

  toString(): string {
    return `{ [K in ${this.sourceType.toString()}]: ${this.resultValueType?.toString() || 'unknown'} }`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      sourceType: this.sourceType.toJSON(),
      resultKeyType: this.resultKeyType?.toJSON(),
      resultValueType: this.resultValueType?.toJSON(),
    };
  }

  clone(): MappedType {
    return new MappedType(
      this.name,
      this.sourceType.clone(),
      this.resultKeyType?.clone() || this.sourceType.clone(),
      this.resultValueType?.clone() || this.sourceType.clone()
    );
  }

  /**
   * Obtenir le type source
   */
  getSourceType(): Type {
    return this.sourceType;
  }

  /**
   * Obtenir le type des clés du résultat
   */
  getResultKeyType(): Type | undefined {
    return this.resultKeyType;
  }

  /**
   * Obtenir le type des valeurs du résultat
   */
  getResultValueType(): Type | undefined {
    return this.resultValueType;
  }

  /**
   * Définir la fonction de mapping des clés
   */
  setKeyMapper(mapper: (key: string) => string): void {
    this.keyMapper = mapper;
  }

  /**
   * Définir la fonction de mapping des valeurs
   */
  setValueMapper(mapper: (value: Type) => Type): void {
    this.valueMapper = mapper;
  }

  /**
   * Appliquer le mapping à un type
   */
  applyMapping(type: Type): Type {
    if (type instanceof CompositeType) {
      const result = new RecordType(
        this.resultKeyType || type.getMember('key') || this.sourceType,
        this.resultValueType || type.getMember('value') || this.sourceType,
        `${this.name}<${type.name}>`
      );
      return result;
    }
    return this.resultValueType || type;
  }
}

/**
 * Type Conditional - Représente un type conditionnel
 */
export class ConditionalType extends CompositeType {
  kind: TypeKind = TypeKind.Type;
  
  // Type à vérifier
  checkType: Type;
  
  // Type extends
  extendsType: Type;
  
  // Type vrai
  trueType: Type;
  
  // Type faux
  falseType: Type;

  constructor(
    name: string,
    checkType: Type,
    extendsType: Type,
    trueType: Type,
    falseType: Type
  ) {
    super(name, TypeKind.Type);
    this.checkType = checkType;
    this.extendsType = extendsType;
    this.trueType = trueType;
    this.falseType = falseType;
  }

  toString(): string {
    return `${this.checkType.toString()} extends ${this.extendsType.toString()} ? ${this.trueType.toString()} : ${this.falseType.toString()}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      checkType: this.checkType.toJSON(),
      extendsType: this.extendsType.toJSON(),
      trueType: this.trueType.toJSON(),
      falseType: this.falseType.toJSON(),
    };
  }

  clone(): ConditionalType {
    return new ConditionalType(
      this.name,
      this.checkType.clone(),
      this.extendsType.clone(),
      this.trueType.clone(),
      this.falseType.clone()
    );
  }

  /**
   * Évaluer le type conditionnel
   */
  evaluate(typeSystem: TypeSystem): Type {
    if (typeSystem.isAssignable(this.checkType, this.extendsType)) {
      return this.trueType;
    }
    return this.falseType;
  }

  /**
   * Obtenir le type à vérifier
   */
  getCheckType(): Type {
    return this.checkType;
  }

  /**
   * Obtenir le type extends
   */
  getExtendsType(): Type {
    return this.extendsType;
  }

  /**
   * Obtenir le type vrai
   */
  getTrueType(): Type {
    return this.trueType;
  }

  /**
   * Obtenir le type faux
   */
  getFalseType(): Type {
    return this.falseType;
  }
}

/**
 * Type Indexed Access - Accès par index à un type
 */
export class IndexedAccessType extends CompositeType {
  kind: TypeKind = TypeKind.Type;
  
  // Type objet
  objectType: Type;
  
  // Type index
  indexType: Type;

  constructor(name: string, objectType: Type, indexType: Type) {
    super(name, TypeKind.Type);
    this.objectType = objectType;
    this.indexType = indexType;
  }

  toString(): string {
    return `${this.objectType.toString()}[${this.indexType.toString()}]`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      objectType: this.objectType.toJSON(),
      indexType: this.indexType.toJSON(),
    };
  }

  clone(): IndexedAccessType {
    return new IndexedAccessType(
      this.name,
      this.objectType.clone(),
      this.indexType.clone()
    );
  }

  /**
   * Obtenir le type de l'objet
   */
  getObjectType(): Type {
    return this.objectType;
  }

  /**
   * Obtenir le type de l'index
   */
  getIndexType(): Type {
    return this.indexType;
  }

  /**
   * Résoudre le type d'accès
   */
  resolveAccess(typeSystem: TypeSystem): Type {
    if (this.objectType instanceof CompositeType) {
      if (this.indexType instanceof PrimitiveType && this.indexType.kind === TypeKind.String) {
        // Accès par nom de propriété
        if (this.indexType.toString() === 'string') {
          // Retourner le type des valeurs du composite
          const values = Array.from(this.objectType.members.values());
          if (values.length === 1) {
            return values[0];
          }
          // Retourner une union des types
          return typeSystem.createUnionType(values);
        }
      }
    }
    return typeSystem.anyType;
  }
}

/**
 * Fabrique de types structuraux
 */
export class StructuralTypeFactory {
  private typeSystem: TypeSystem;

  constructor(typeSystem: TypeSystem) {
    this.typeSystem = typeSystem;
  }

  /**
   * Créer un type Record
   */
  createRecord(keyType: Type, valueType: Type, name?: string): RecordType {
    return new RecordType(keyType, valueType, name || 'Record');
  }

  /**
   * Créer un type Struct avancé
   */
  createStruct(name: string): StructType {
    return new StructType(name);
  }

  /**
   * Créer un type StructuredTuple
   */
  createStructuredTuple(
    elementTypes: Type[],
    elementNames?: (string | undefined)[]
  ): StructuredTupleType {
    return new StructuredTupleType(
      elementTypes,
      elementNames || elementTypes.map(() => undefined)
    );
  }

  /**
   * Créer un type Mapped
   */
  createMapped(
    name: string,
    sourceType: Type,
    resultKeyType: Type,
    resultValueType: Type
  ): MappedType {
    return new MappedType(name, sourceType, resultKeyType, resultValueType);
  }

  /**
   * Créer un type Conditional
   */
  createConditional(
    name: string,
    checkType: Type,
    extendsType: Type,
    trueType: Type,
    falseType: Type
  ): ConditionalType {
    return new ConditionalType(name, checkType, extendsType, trueType, falseType);
  }

  /**
   * Créer un type IndexedAccess
   */
  createIndexedAccess(name: string, objectType: Type, indexType: Type): IndexedAccessType {
    return new IndexedAccessType(name, objectType, indexType);
  }

  /**
   * Créer un type depuis un JSON
   */
  fromJSON(json: any): Type {
    switch (json.kind) {
      case 'Record':
        return this.createRecord(
          this.typeSystem.fromJSON(json.keyType),
          this.typeSystem.fromJSON(json.valueType),
          json.name
        );
      case 'Struct':
        return this.createStruct(json.name);
      case 'StructuredTuple':
        return this.createStructuredTuple(
          json.elementTypes.map((t: any) => this.typeSystem.fromJSON(t)),
          json.elementNames
        );
      case 'Mapped':
        return this.createMapped(
          json.name,
          this.typeSystem.fromJSON(json.sourceType),
          this.typeSystem.fromJSON(json.resultKeyType),
          this.typeSystem.fromJSON(json.resultValueType)
        );
      case 'Conditional':
        return this.createConditional(
          json.name,
          this.typeSystem.fromJSON(json.checkType),
          this.typeSystem.fromJSON(json.extendsType),
          this.typeSystem.fromJSON(json.trueType),
          this.typeSystem.fromJSON(json.falseType)
        );
      case 'IndexedAccess':
        return this.createIndexedAccess(
          json.name,
          this.typeSystem.fromJSON(json.objectType),
          this.typeSystem.fromJSON(json.indexType)
        );
      default:
        return this.typeSystem.anyType;
    }
  }
}

/**
 * Créer une fabrique de types structuraux
 */
export function createStructuralTypeFactory(typeSystem: TypeSystem): StructuralTypeFactory {
  return new StructuralTypeFactory(typeSystem);
}

/**
 * Utilitaires de typage structural
 */
export class StructuralTypeUtils {
  /**
   * Vérifier si deux types sont structurellement compatibles
   */
  static isStructurallyCompatible(
    type1: Type,
    type2: Type,
    typeSystem: TypeSystem
  ): boolean {
    if (type1 instanceof StructType && type2 instanceof StructType) {
      return type1.isStructurallyCompatible(type2, typeSystem);
    }
    
    if (type1 instanceof CompositeType && type2 instanceof CompositeType) {
      // Vérifier que tous les membres de type1 sont compatibles avec type2
      for (const [name, memberType] of type1.members) {
        const otherMemberType = type2.getMember(name);
        if (!otherMemberType || !typeSystem.isAssignable(memberType, otherMemberType)) {
          return false;
        }
      }
      return true;
    }
    
    return typeSystem.isAssignable(type1, type2);
  }

  /**
   * Vérifier si un type est un type structural
   */
  static isStructuralType(type: Type): boolean {
    return type instanceof StructType ||
           type instanceof RecordType ||
           type instanceof StructuredTupleType ||
           type instanceof MappedType ||
           type instanceof CompositeType;
  }

  /**
   * Obtenir les propriétés d'un type structural
   */
  static getStructuralProperties(type: Type): Map<string, Type> {
    if (type instanceof CompositeType) {
      return type.getMembers();
    }
    return new Map();
  }

  /**
   * Fusionner deux types structuraux
   */
  static mergeStructuralTypes(
    type1: Type,
    type2: Type,
    typeSystem: TypeSystem
  ): Type {
    if (type1 instanceof CompositeType && type2 instanceof CompositeType) {
      const merged = new CompositeType(
        `${type1.name}_Merged_${type2.name}`,
        TypeKind.Object
      );
      
      // Fusionner les membres
      const allMembers = new Map([...type1.members, ...type2.members]);
      for (const [name, memberType] of allMembers) {
        const type1Member = type1.getMember(name);
        const type2Member = type2.getMember(name);
        
        if (type1Member && type2Member) {
          // Fusionner les types
          if (typeSystem.isAssignable(type1Member, type2Member)) {
            merged.addMember(name, type2Member);
          } else if (typeSystem.isAssignable(type2Member, type1Member)) {
            merged.addMember(name, type1Member);
          } else {
            // Créer une union
            merged.addMember(name, typeSystem.createUnionType([type1Member, type2Member]));
          }
        } else if (type1Member) {
          merged.addMember(name, type1Member);
        } else if (type2Member) {
          merged.addMember(name, type2Member);
        }
      }
      
      return merged;
    }
    
    return typeSystem.anyType;
  }
}

export {
  RecordType as default,
  StructType,
  StructuredTupleType,
  MappedType,
  ConditionalType,
  IndexedAccessType,
  StructuralTypeFactory,
  StructuralTypeUtils,
};
