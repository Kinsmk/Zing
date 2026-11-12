/**
 * TypeSerialization - Sérialisation et désérialisation des types pour Zinga
 * 
 * Ce module fournit des utilitaires pour la sérialisation et la désérialisation
 * des types, avec support pour les formats JSON, les références circulaires,
 * et les optimisations de performance.
 */

import { Type, TypeKind, TypeSystem, PrimitiveType } from './type-system';
import { CompositeType, FunctionType, GenericType, LiteralType, ArrayType, TupleType, ObjectType } from './type-system';
import { UnionType, IntersectionType } from './unions';
import { NullableType, OptionalType, DefaultType, NonNullableType, DefinitelyTypedType } from './nullable';
import { EnumType, StringEnumType, NumericEnumType, BitFlagEnumType, GenericEnumType, ConstEnumType } from './enums';
import { StructType, RecordType, StructuredTupleType, MappedType, ConditionalType, IndexedAccessType } from './structures';
import { ConstructorType, MethodType, OverloadedFunctionType, GenericFunctionType } from './functions';
import { ExtendsConstraint, SuperConstraint, ImplementsConstraint, NewConstraint, KeyOfConstraint, TypeOfConstraint, InstanceOfConstraint, InConstraint, IsConstraint, SatisfiesConstraint, AndConstraint, OrConstraint } from './constraints';

/**
 * Options de sérialisation
 */
export interface SerializationOptions {
  // Indente le JSON
  pretty?: boolean;
  
  // Inclure les métadonnées
  includeMetadata?: boolean;
  
  // Gérer les références circulaires
  handleCircular?: boolean;
  
  // Profondeur maximale de sérialisation
  maxDepth?: number;
  
  // Niveau de compression
  compressionLevel?: 'none' | 'low' | 'medium' | 'high';
}

/**
 * Contexte de sérialisation
 */
export class SerializationContext {
  // Références déjà sérialisées (pour éviter les doublons)
  serializedRefs: Map<Type, number> = new Map();
  
  // Compteur de références
  refCounter: number = 0;
  
  // Profondeur actuelle
  currentDepth: number = 0;
  
  // Options
  options: SerializationOptions;

  constructor(options: SerializationOptions = {}) {
    this.options = {
      pretty: false,
      includeMetadata: true,
      handleCircular: true,
      maxDepth: 100,
      compressionLevel: 'none',
      ...options,
    };
  }

  /**
   * Obtenir une référence pour un type
   */
  getReference(type: Type): number {
    if (!this.serializedRefs.has(type)) {
      this.refCounter++;
      this.serializedRefs.set(type, this.refCounter);
    }
    return this.serializedRefs.get(type)!;
  }

  /**
   * Vérifier si un type a déjà été sérialisé
   */
  hasReference(type: Type): boolean {
    return this.serializedRefs.has(type);
  }

  /**
   * Incrémenter la profondeur
   */
  incrementDepth(): void {
    this.currentDepth++;
  }

  /**
   * Décrémenter la profondeur
   */
  decrementDepth(): void {
    this.currentDepth--;
  }

  /**
   * Vérifier si la profondeur maximale est atteinte
   */
  isMaxDepthReached(): boolean {
    return this.currentDepth >= (this.options.maxDepth || 100);
  }
}

/**
 * Sérialiseur de types
 */
export class TypeSerializer {
  private typeSystem: TypeSystem;
  private context: SerializationContext;

  constructor(typeSystem: TypeSystem, options: SerializationOptions = {}) {
    this.typeSystem = typeSystem;
    this.context = new SerializationContext(options);
  }

  /**
   * Sérialiser un type en JSON
   */
  serialize(type: Type): any {
    return this.serializeType(type);
  }

  /**
   * Sérialiser un type en chaîne JSON
   */
  serializeToString(type: Type): string {
    const json = this.serialize(type);
    return this.context.options.pretty 
      ? JSON.stringify(json, null, 2)
      : JSON.stringify(json);
  }

  /**
   * Sérialiser un type
   */
  private serializeType(type: Type): any {
    if (this.context.isMaxDepthReached()) {
      return { kind: 'MaxDepthReached' };
    }

    this.context.incrementDepth();

    try {
      // Gérer les références circulaires
      if (this.context.options.handleCircular && this.context.hasReference(type)) {
        const ref = this.context.getReference(type);
        return { kind: 'Reference', ref };
      }

      // Sérialiser selon le type
      switch (type.kind) {
        case TypeKind.Any:
        case TypeKind.Unknown:
        case TypeKind.Never:
        case TypeKind.Void:
        case TypeKind.Null:
        case TypeKind.Undefined:
        case TypeKind.Boolean:
        case TypeKind.Number:
        case TypeKind.String:
        case TypeKind.Symbol:
        case TypeKind.BigInt:
          return this.serializePrimitiveType(type as PrimitiveType);

        case TypeKind.Literal:
          return this.serializeLiteralType(type as LiteralType);

        case TypeKind.Array:
          return this.serializeArrayType(type as ArrayType);

        case TypeKind.Tuple:
          return this.serializeTupleType(type as TupleType);

        case TypeKind.Object:
          return this.serializeObjectType(type as ObjectType);

        case TypeKind.Function:
          return this.serializeFunctionType(type as FunctionType);

        case TypeKind.Class:
        case TypeKind.Interface:
        case TypeKind.Enum:
        case TypeKind.Type:
          return this.serializeCompositeType(type as CompositeType);

        case TypeKind.Generic:
          return this.serializeGenericType(type as GenericType);

        case TypeKind.TypeParameter:
          return this.serializeTypeParameter(type as unknown as GenericTypeParameter);

        case TypeKind.Union:
          return this.serializeUnionType(type as UnionType);

        case TypeKind.Intersection:
          return this.serializeIntersectionType(type as IntersectionType);

        default:
          return this.serializeUnknownType(type);
      }
    } finally {
      this.context.decrementDepth();
    }
  }

  /**
   * Sérialiser un type primitif
   */
  private serializePrimitiveType(type: PrimitiveType): any {
    return {
      kind: TypeKind[type.kind],
      name: type.name,
    };
  }

  /**
   * Sérialiser un type littéral
   */
  private serializeLiteralType(type: LiteralType): any {
    return {
      kind: TypeKind[type.kind],
      value: type.value,
      baseType: this.serializeType(type.baseType),
    };
  }

  /**
   * Sérialiser un type tableau
   */
  private serializeArrayType(type: ArrayType): any {
    return {
      kind: TypeKind[type.kind],
      elementType: this.serializeType(type.elementType),
    };
  }

  /**
   * Sérialiser un type tuple
   */
  private serializeTupleType(type: TupleType): any {
    return {
      kind: TypeKind[type.kind],
      elementTypes: type.elementTypes.map(t => this.serializeType(t)),
      optionalTypes: type.optionalTypes?.map(t => this.serializeType(t)),
      restType: type.restType ? this.serializeType(type.restType) : undefined,
    };
  }

  /**
   * Sérialiser un type objet
   */
  private serializeObjectType(type: ObjectType): any {
    return {
      kind: TypeKind[type.kind],
      properties: Object.fromEntries(
        Array.from(type.properties.entries()).map(([name, propType]) => [
          name,
          this.serializeType(propType)
        ])
      ),
      indexType: type.indexType ? this.serializeType(type.indexType) : undefined,
      callSignature: type.callSignature ? this.serializeType(type.callSignature) : undefined,
      constructSignature: type.constructSignature ? this.serializeType(type.constructSignature) : undefined,
    };
  }

  /**
   * Sérialiser un type fonction
   */
  private serializeFunctionType(type: FunctionType): any {
    const result: any = {
      kind: TypeKind[type.kind],
      returnType: this.serializeType(type.returnType),
      parameters: type.parameters.map(t => this.serializeType(t)),
      parameterNames: type.parameterNames,
      isArrow: type.isArrow,
      isMethod: type.isMethod,
      isConstructor: type.isConstructor,
      isAsync: type.isAsync,
      isGenerator: type.isGenerator,
    };

    if ('name' in type && type.name) {
      result.name = type.name;
    }
    if ('thisType' in type && type.thisType) {
      result.thisType = this.serializeType(type.thisType);
    }
    if ('typeParameters' in type && type.typeParameters?.length) {
      result.typeParameters = type.typeParameters.map(t => this.serializeType(t));
    }

    return result;
  }

  /**
   * Sérialiser un type composite
   */
  private serializeCompositeType(type: CompositeType): any {
    const result: any = {
      kind: TypeKind[type.kind],
      name: type.name,
      members: Object.fromEntries(
        Array.from(type.members.entries()).map(([name, memberType]) => [
          name,
          this.serializeType(memberType)
        ])
      ),
      baseTypes: type.baseTypes.map(t => this.serializeType(t)),
      implementedTypes: type.implementedTypes.map(t => this.serializeType(t)),
    };

    if ('typeParameters' in type && type.typeParameters?.length) {
      result.typeParameters = type.typeParameters.map(t => this.serializeType(t));
    }

    // Sérialiser les propriétés spécifiques selon le type
    if (type instanceof EnumType) {
      result.members = Object.fromEntries(
        Array.from(type.members.entries()).map(([name, memberType]) => [
          name,
          this.serializeType(memberType)
        ])
      );
      result.memberValues = Object.fromEntries(
        Array.from(type.memberValues.entries()).map(([name, value]) => [name, value])
      );
      result.underlyingType = this.serializeType(type.underlyingType);
      result.isStringEnum = type.isStringEnum;
      result.isNumericEnum = type.isNumericEnum;
      result.isBitFlagEnum = type.isBitFlagEnum;
    }

    return result;
  }

  /**
   * Sérialiser un type générique
   */
  private serializeGenericType(type: GenericType): any {
    return {
      kind: TypeKind[type.kind],
      id: type.id,
      name: type.name,
      typeParameters: type.typeParameters?.map(t => this.serializeType(t)),
      typeArguments: type.typeArguments.map(t => this.serializeType(t)),
      constraint: type.constraint ? this.serializeType(type.constraint) : undefined,
      defaultType: type.defaultType ? this.serializeType(type.defaultType) : undefined,
      resolvedType: type.resolvedType ? this.serializeType(type.resolvedType) : undefined,
    };
  }

  /**
   * Sérialiser un paramètre de type
   */
  private serializeTypeParameter(type: any): any {
    return {
      kind: TypeKind.TypeParameter,
      id: type.id,
      name: type.name,
      constraint: type.constraint ? this.serializeType(type.constraint) : undefined,
      defaultType: type.defaultType ? this.serializeType(type.defaultType) : undefined,
    };
  }

  /**
   * Sérialiser un type union
   */
  private serializeUnionType(type: UnionType): any {
    return {
      kind: TypeKind[type.kind],
      types: type.types.map(t => this.serializeType(t)),
      isSealed: type.isSealed,
    };
  }

  /**
   * Sérialiser un type intersection
   */
  private serializeIntersectionType(type: IntersectionType): any {
    return {
      kind: TypeKind[type.kind],
      types: type.types.map(t => this.serializeType(t)),
    };
  }

  /**
   * Sérialiser un type inconnu
   */
  private serializeUnknownType(type: Type): any {
    return {
      kind: TypeKind[type.kind],
      toString: type.toString(),
    };
  }
}

/**
 * Désérialiseur de types
 */
export class TypeDeserializer {
  private typeSystem: TypeSystem;
  private context: DeserializationContext;

  constructor(typeSystem: TypeSystem, options: SerializationOptions = {}) {
    this.typeSystem = typeSystem;
    this.context = new DeserializationContext(options);
  }

  /**
   * Désérialiser un type depuis JSON
   */
  deserialize(json: any): Type {
    return this.deserializeType(json);
  }

  /**
   * Désérialiser un type depuis une chaîne JSON
   */
  deserializeFromString(jsonStr: string): Type {
    const json = JSON.parse(jsonStr);
    return this.deserialize(json);
  }

  /**
   * Désérialiser un type
   */
  private deserializeType(json: any): Type {
    if (!json || typeof json !== 'object') {
      return this.typeSystem.anyType;
    }

    if (json.kind === 'Reference') {
      return this.context.getReference(json.ref);
    }

    if (json.kind === 'MaxDepthReached') {
      return this.typeSystem.anyType;
    }

    // Désérialiser selon le kind
    switch (json.kind) {
      case 'Any':
        return this.typeSystem.anyType;
      case 'Unknown':
        return this.typeSystem.unknownType;
      case 'Never':
        return this.typeSystem.neverType;
      case 'Void':
        return this.typeSystem.voidType;
      case 'Null':
        return this.typeSystem.nullType;
      case 'Undefined':
        return this.typeSystem.undefinedType;
      case 'Boolean':
        return this.typeSystem.booleanType;
      case 'Number':
        return this.typeSystem.numberType;
      case 'String':
        return this.typeSystem.stringType;
      case 'Symbol':
        return this.typeSystem.symbolType;
      case 'BigInt':
        return this.typeSystem.bigIntType;

      case 'Literal':
        return this.deserializeLiteralType(json);

      case 'Array':
        return this.deserializeArrayType(json);

      case 'Tuple':
        return this.deserializeTupleType(json);

      case 'Object':
        return this.deserializeObjectType(json);

      case 'Function':
        return this.deserializeFunctionType(json);

      case 'Class':
      case 'Interface':
      case 'Enum':
      case 'Type':
        return this.deserializeCompositeType(json);

      case 'Generic':
        return this.deserializeGenericType(json);

      case 'TypeParameter':
        return this.deserializeTypeParameter(json);

      case 'Union':
        return this.deserializeUnionType(json);

      case 'Intersection':
        return this.deserializeIntersectionType(json);

      default:
        return this.typeSystem.anyType;
    }
  }

  /**
   * Désérialiser un type littéral
   */
  private deserializeLiteralType(json: any): LiteralType {
    return new LiteralType(
      json.value,
      this.deserializeType(json.baseType)
    );
  }

  /**
   * Désérialiser un type tableau
   */
  private deserializeArrayType(json: any): ArrayType {
    return new ArrayType(
      this.deserializeType(json.elementType)
    );
  }

  /**
   * Désérialiser un type tuple
   */
  private deserializeTupleType(json: any): TupleType {
    return new TupleType(
      json.elementTypes.map((t: any) => this.deserializeType(t)),
      json.optionalTypes?.map((t: any) => this.deserializeType(t)),
      json.restType ? this.deserializeType(json.restType) : undefined
    );
  }

  /**
   * Désérialiser un type objet
   */
  private deserializeObjectType(json: any): ObjectType {
    const properties = new Map<string, Type>();
    for (const [name, propJson] of Object.entries(json.properties || {})) {
      properties.set(name, this.deserializeType(propJson));
    }

    const result = new ObjectType(properties);
    
    if (json.indexType) {
      result.indexType = this.deserializeType(json.indexType);
    }
    if (json.callSignature) {
      result.callSignature = this.deserializeType(json.callSignature) as FunctionType;
    }
    if (json.constructSignature) {
      result.constructSignature = this.deserializeType(json.constructSignature) as FunctionType;
    }

    return result;
  }

  /**
   * Désérialiser un type fonction
   */
  private deserializeFunctionType(json: any): FunctionType {
    const result = new FunctionType(
      this.deserializeType(json.returnType),
      json.parameters.map((p: any) => this.deserializeType(p)),
      json.parameterNames || []
    );

    result.isArrow = json.isArrow || false;
    result.isMethod = json.isMethod || false;
    result.isConstructor = json.isConstructor || false;
    result.isAsync = json.isAsync || false;
    result.isGenerator = json.isGenerator || false;

    if (json.name) {
      result.name = json.name;
    }
    if (json.thisType) {
      result.thisType = this.deserializeType(json.thisType);
    }
    if (json.typeParameters?.length) {
      result.typeParameters = json.typeParameters.map((p: any) => 
        this.deserializeType(p) as unknown as any
      );
    }

    return result;
  }

  /**
   * Désérialiser un type composite
   */
  private deserializeCompositeType(json: any): CompositeType {
    const kind = json.kind as TypeKind;
    const result = new CompositeType(json.name, kind);

    // Désérialiser les membres
    for (const [name, memberJson] of Object.entries(json.members || {})) {
      result.addMember(name, this.deserializeType(memberJson));
    }

    // Désérialiser les types de base
    if (json.baseTypes?.length) {
      result.baseTypes = json.baseTypes.map((t: any) => this.deserializeType(t));
    }

    // Désérialiser les types implémentés
    if (json.implementedTypes?.length) {
      result.implementedTypes = json.implementedTypes.map((t: any) => this.deserializeType(t));
    }

    // Désérialiser les paramètres de type
    if (json.typeParameters?.length) {
      result.typeParameters = json.typeParameters.map((t: any) => 
        this.deserializeType(t) as unknown as any
      );
    }

    return result;
  }

  /**
   * Désérialiser un type générique
   */
  private deserializeGenericType(json: any): GenericType {
    const result = new GenericType();
    result.id = json.id;
    result.name = json.name;
    result.kind = TypeKind.Generic;

    if (json.typeParameters?.length) {
      result.typeParameters = json.typeParameters.map((t: any) => 
        this.deserializeType(t) as unknown as any
      );
    }

    if (json.typeArguments?.length) {
      result.typeArguments = json.typeArguments.map((t: any) => this.deserializeType(t));
    }

    if (json.constraint) {
      result.constraint = this.deserializeType(json.constraint);
    }

    if (json.defaultType) {
      result.defaultType = this.deserializeType(json.defaultType);
    }

    if (json.resolvedType) {
      result.resolvedType = this.deserializeType(json.resolvedType);
    }

    return result;
  }

  /**
   * Désérialiser un paramètre de type
   */
  private deserializeTypeParameter(json: any): any {
    const result = {
      kind: TypeKind.TypeParameter,
      id: json.id,
      name: json.name,
      toString: () => json.name,
      toJSON: () => json,
      equals: (other: any) => other.id === json.id && other.name === json.name,
      clone: () => ({ ...result }),
    };

    if (json.constraint) {
      (result as any).constraint = this.deserializeType(json.constraint);
    }
    if (json.defaultType) {
      (result as any).defaultType = this.deserializeType(json.defaultType);
    }

    return result;
  }

  /**
   * Désérialiser un type union
   */
  private deserializeUnionType(json: any): UnionType {
    return new UnionType(
      json.types.map((t: any) => this.deserializeType(t))
    );
  }

  /**
   * Désérialiser un type intersection
   */
  private deserializeIntersectionType(json: any): IntersectionType {
    return new IntersectionType(
      json.types.map((t: any) => this.deserializeType(t))
    );
  }
}

/**
 * Contexte de désérialisation
 */
export class DeserializationContext {
  // Références désérialisées
  references: Map<number, Type> = new Map();
  
  // Options
  options: SerializationOptions;

  constructor(options: SerializationOptions = {}) {
    this.options = {
      pretty: false,
      includeMetadata: true,
      handleCircular: true,
      maxDepth: 100,
      compressionLevel: 'none',
      ...options,
    };
  }

  /**
   * Ajouter une référence
   */
  addReference(ref: number, type: Type): void {
    this.references.set(ref, type);
  }

  /**
   * Obtenir une référence
   */
  getReference(ref: number): Type {
    return this.references.get(ref) || new PrimitiveType(TypeKind.Any, 'any');
  }

  /**
   * Vérifier si une référence existe
   */
  hasReference(ref: number): boolean {
    return this.references.has(ref);
  }
}

/**
 * Fabrique de sérialiseurs/désérialiseurs
 */
export class TypeSerializationFactory {
  private typeSystem: TypeSystem;

  constructor(typeSystem: TypeSystem) {
    this.typeSystem = typeSystem;
  }

  /**
   * Créer un sérialiseur
   */
  createSerializer(options: SerializationOptions = {}): TypeSerializer {
    return new TypeSerializer(this.typeSystem, options);
  }

  /**
   * Créer un désérialiseur
   */
  createDeserializer(options: SerializationOptions = {}): TypeDeserializer {
    return new TypeDeserializer(this.typeSystem, options);
  }

  /**
   * Sérialiser un type
   */
  serialize(type: Type, options: SerializationOptions = {}): any {
    return this.createSerializer(options).serialize(type);
  }

  /**
   * Sérialiser un type en chaîne
   */
  serializeToString(type: Type, options: SerializationOptions = {}): string {
    return this.createSerializer(options).serializeToString(type);
  }

  /**
   * Désérialiser un type
   */
  deserialize(json: any, options: SerializationOptions = {}): Type {
    return this.createDeserializer(options).deserialize(json);
  }

  /**
   * Désérialiser un type depuis une chaîne
   */
  deserializeFromString(jsonStr: string, options: SerializationOptions = {}): Type {
    return this.createDeserializer(options).deserializeFromString(jsonStr);
  }

  /**
   * Cloner un type (via sérialisation/désérialisation)
   */
  cloneType(type: Type): Type {
    const json = this.serialize(type);
    return this.deserialize(json);
  }
}

/**
 * Créer une fabrique de sérialisation
 */
export function createTypeSerializationFactory(typeSystem: TypeSystem): TypeSerializationFactory {
  return new TypeSerializationFactory(typeSystem);
}

/**
 * Utilitaires de sérialisation
 */
export class TypeSerializationUtils {
  /**
   * Vérifier si un type peut être sérialisé
   */
  static canSerialize(type: Type): boolean {
    // Tous les types devraient pouvoir être sérialisés
    return true;
  }

  /**
   * Vérifier si un JSON est un type valide
   */
  static isValidTypeJSON(json: any): boolean {
    if (!json || typeof json !== 'object') {
      return false;
    }

    if (!json.kind) {
      return false;
    }

    // Vérifier que le kind est valide
    const validKinds = Object.values(TypeKind);
    return validKinds.includes(json.kind as TypeKind);
  }

  /**
   * Comparer deux types sérialisés
   */
  static compareSerializedTypes(json1: any, json2: any): boolean {
    return JSON.stringify(json1) === JSON.stringify(json2);
  }

  /**
   * Obtenir la taille d'un type sérialisé
   */
  static getSerializedSize(type: Type, typeSystem: TypeSystem): number {
    const json = createTypeSerializationFactory(typeSystem).serialize(type);
    return JSON.stringify(json).length;
  }

  /**
   * Compresser un type sérialisé
   */
  static compressSerializedType(json: any, level: 'low' | 'medium' | 'high' = 'medium'): any {
    switch (level) {
      case 'low':
        return this.compressLow(json);
      case 'medium':
        return this.compressMedium(json);
      case 'high':
        return this.compressHigh(json);
      default:
        return json;
    }
  }

  /**
   * Compression basse
   */
  private static compressLow(json: any): any {
    // Supprimer les propriétés optionnelles non utilisées
    const result = { ...json };
    
    // Supprimer les propriétés vides
    if (result.properties && Object.keys(result.properties).length === 0) {
      delete result.properties;
    }
    
    if (result.baseTypes && result.baseTypes.length === 0) {
      delete result.baseTypes;
    }
    
    if (result.implementedTypes && result.implementedTypes.length === 0) {
      delete result.implementedTypes;
    }
    
    return result;
  }

  /**
   * Compression moyenne
   */
  private static compressMedium(json: any): any {
    const result = this.compressLow(json);
    
    // Remplacer les types primitifs par leurs noms
    if (result.kind && !result.types && !result.properties) {
      return result.kind;
    }
    
    return result;
  }

  /**
   * Compression haute
   */
  private static compressHigh(json: any): any {
    const result = this.compressMedium(json);
    
    // Utiliser des références pour les types répétés
    // (nécessite une analyse plus complexe)
    
    return result;
  }

  /**
   * Décompresser un type sérialisé
   */
  static decompressSerializedType(json: any): any {
    // Pour l'instant, on retourne juste le JSON
    // La décompression complète nécessiterait de connaître le contexte
    return json;
  }
}

export {
  SerializationOptions as default,
  SerializationContext,
  TypeSerializer,
  TypeDeserializer,
  DeserializationContext,
  TypeSerializationFactory,
  TypeSerializationUtils,
};
