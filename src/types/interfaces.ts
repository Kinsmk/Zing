/**
 * Interfaces - Types interface pour Zinga
 * 
 * Ce module fournit des utilitaires pour travailler avec les interfaces.
 */

import { Type, TypeKind, InterfaceType, CompositeType, FunctionType, TypeSystem, TypeParameter, GenericType } from './type-system';
import { GenericClassType } from './generic-types';

/**
 * Constructeur d'interfaces
 */
export class InterfaceBuilder {
  private typeSystem: TypeSystem;
  private interfaceType: InterfaceType;

  constructor(typeSystem: TypeSystem, name: string) {
    this.typeSystem = typeSystem;
    this.interfaceType = new InterfaceType(name);
  }

  /**
   * Obtenir l'interface
   */
  public getInterface(): InterfaceType {
    return this.interfaceType;
  }

  /**
   * Définir le nom
   */
  public setName(name: string): this {
    this.interfaceType.name = name;
    return this;
  }

  /**
   * Ajouter une propriété
   */
  public addProperty(name: string, type: Type, optional: boolean = false): this {
    if (optional) {
      type = this.typeSystem.unionTypes(type, this.typeSystem.undefinedType);
    }
    this.interfaceType.addProperty(name, type);
    return this;
  }

  /**
   * Ajouter une propriété de type string
   */
  public addStringProperty(name: string, optional: boolean = false): this {
    return this.addProperty(name, this.typeSystem.stringType, optional);
  }

  /**
   * Ajouter une propriété de type number
   */
  public addNumberProperty(name: string, optional: boolean = false): this {
    return this.addProperty(name, this.typeSystem.numberType, optional);
  }

  /**
   * Ajouter une propriété de type boolean
   */
  public addBooleanProperty(name: string, optional: boolean = false): this {
    return this.addProperty(name, this.typeSystem.booleanType, optional);
  }

  /**
   * Ajouter une propriété de type any
   */
  public addAnyProperty(name: string, optional: boolean = false): this {
    return this.addProperty(name, this.typeSystem.anyType, optional);
  }

  /**
   * Ajouter une propriété de type array
   */
  public addArrayProperty(name: string, elementType: Type, optional: boolean = false): this {
    return this.addProperty(name, this.typeSystem.createArrayType(elementType), optional);
  }

  /**
   * Ajouter une propriété de type objet
   */
  public addObjectProperty(name: string, properties: Map<string, Type>, optional: boolean = false): this {
    return this.addProperty(name, this.typeSystem.createObjectType(properties), optional);
  }

  /**
   * Ajouter une propriété de type fonction
   */
  public addFunctionProperty(
    name: string,
    returnType: Type,
    parameters: Type[] = [],
    optional: boolean = false
  ): this {
    return this.addProperty(name, this.typeSystem.createFunctionType(returnType, parameters), optional);
  }

  /**
   * Ajouter une méthode
   */
  public addMethod(
    name: string,
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ): this {
    const functionType = this.typeSystem.createFunctionType(returnType, parameters, parameterNames);
    this.interfaceType.addMethod(name, functionType);
    return this;
  }

  /**
   * Ajouter un getter
   */
  public addGetter(name: string, returnType: Type): this {
    const getter = this.typeSystem.createFunctionType(returnType, []);
    this.interfaceType.addGetter(name, getter);
    return this;
  }

  /**
   * Ajouter un setter
   */
  public addSetter(name: string, parameterType: Type): this {
    const setter = this.typeSystem.createFunctionType(this.typeSystem.voidType, [parameterType]);
    this.interfaceType.addSetter(name, setter);
    return this;
  }

  /**
   * Ajouter une signature d'index
   */
  public addIndexSignature(
    keyType: Type = this.typeSystem.stringType,
    valueType: Type = this.typeSystem.anyType
  ): this {
    const signature = this.typeSystem.createFunctionType(valueType, [keyType]);
    this.interfaceType.addIndexSignature(signature);
    return this;
  }

  /**
   * Ajouter une interface de base (héritage)
   */
  public extend(interfaceType: InterfaceType): this {
    this.interfaceType.addBaseType(interfaceType);
    return this;
  }

  /**
   * Ajouter un paramètre de type
   */
  public addTypeParameter(
    name: string,
    constraint?: Type,
    defaultType?: Type
  ): this {
    const typeParam = this.typeSystem.createTypeParameter(name, constraint, defaultType);
    this.interfaceType.addTypeParameter(typeParam);
    return this;
  }

  /**
   * Créer l'interface
   */
  public build(): InterfaceType {
    return this.interfaceType;
  }
}

/**
 * Vérificateur d'interfaces
 */
export class InterfaceChecker {
  private typeSystem: TypeSystem;

  constructor(typeSystem: TypeSystem) {
    this.typeSystem = typeSystem;
  }

  /**
   * Vérifier si un type implémente une interface
   */
  public implementsInterface(type: Type, interfaceType: InterfaceType): boolean {
    if (!this.typeSystem.isComposite(type)) {
      return false;
    }

    const compositeType = type as CompositeType;

    // Vérifier toutes les propriétés
    for (const [name, propType] of interfaceType.getProperties()) {
      const implType = compositeType.getProperty(name);
      if (!implType || !this.typeSystem.isAssignable(implType, propType)) {
        return false;
      }
    }

    // Vérifier toutes les méthodes
    for (const [name, methodType] of interfaceType.getMethods()) {
      const implMethod = compositeType.getMethod(name);
      if (!implMethod || !this.typeSystem.isAssignable(implMethod, methodType)) {
        return false;
      }
    }

    // Vérifier les signatures d'index
    for (const indexSig of interfaceType.indexSignatures) {
      // Vérifier que le type a une signature d'index compatible
      if (!this.hasCompatibleIndexSignature(compositeType, indexSig)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Vérifier si un type a une signature d'index compatible
   */
  private hasCompatibleIndexSignature(
    type: CompositeType,
    signature: FunctionType
  ): boolean {
    // À implémenter
    return true;
  }

  /**
   * Vérifier si un type est compatible avec une interface
   */
  public isCompatibleWithInterface(type: Type, interfaceType: InterfaceType): boolean {
    return this.implementsInterface(type, interfaceType);
  }

  /**
   * Vérifier si deux interfaces sont compatibles
   */
  public areInterfacesCompatible(interface1: InterfaceType, interface2: InterfaceType): boolean {
    // Vérifier que interface1 a toutes les propriétés de interface2
    for (const [name, propType] of interface2.getProperties()) {
      const prop1 = interface1.getProperty(name);
      if (!prop1 || !this.typeSystem.isAssignable(prop1, propType)) {
        return false;
      }
    }

    // Vérifier que interface1 a toutes les méthodes de interface2
    for (const [name, methodType] of interface2.getMethods()) {
      const method1 = interface1.getMethod(name);
      if (!method1 || !this.typeSystem.isAssignable(method1, methodType)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Vérifier si une interface hérite d'une autre
   */
  public extendsInterface(interfaceType: InterfaceType, baseInterface: InterfaceType): boolean {
    return interfaceType.baseTypes.some(base => 
      this.typeSystem.areEqual(base, baseInterface)
    );
  }

  /**
   * Obtenir toutes les interfaces de base
   */
  public getBaseInterfaces(interfaceType: InterfaceType): InterfaceType[] {
    return interfaceType.baseTypes.filter(
      base => this.typeSystem.isInterface(base)
    ) as InterfaceType[];
  }

  /**
   * Obtenir toutes les interfaces dérivées
   */
  public getDerivedInterfaces(interfaceType: InterfaceType, allInterfaces: InterfaceType[]): InterfaceType[] {
    return allInterfaces.filter(derived => 
      this.extendsInterface(derived, interfaceType)
    );
  }

  /**
   * Vérifier si une interface est vide
   */
  public isEmptyInterface(interfaceType: InterfaceType): boolean {
    return interfaceType.getProperties().size === 0 &&
           interfaceType.getMethods().size === 0 &&
           interfaceType.indexSignatures.length === 0;
  }
}

/**
 * Fusionneur d'interfaces
 */
export class InterfaceMerger {
  private typeSystem: TypeSystem;

  constructor(typeSystem: TypeSystem) {
    this.typeSystem = typeSystem;
  }

  /**
   * Fusionner plusieurs interfaces
   */
  public mergeInterfaces(...interfaces: InterfaceType[]): InterfaceType {
    if (interfaces.length === 0) {
      return new InterfaceType('MergedInterface');
    }

    if (interfaces.length === 1) {
      return interfaces[0].clone() as InterfaceType;
    }

    // Créer une nouvelle interface
    const merged = new InterfaceType('MergedInterface');

    // Fusionner les propriétés
    for (const interfaceType of interfaces) {
      for (const [name, propType] of interfaceType.getProperties()) {
        const existingProp = merged.getProperty(name);
        if (existingProp) {
          // Fusionner les types
          const mergedType = this.mergeTypes(existingProp, propType);
          merged.addProperty(name, mergedType);
        } else {
          merged.addProperty(name, propType.clone());
        }
      }
    }

    // Fusionner les méthodes
    for (const interfaceType of interfaces) {
      for (const [name, methodType] of interfaceType.getMethods()) {
        const existingMethod = merged.getMethod(name);
        if (existingMethod) {
          // Fusionner les signatures de méthode
          const mergedMethod = this.mergeFunctionTypes(existingMethod, methodType);
          merged.addMethod(name, mergedMethod);
        } else {
          merged.addMethod(name, methodType.clone() as FunctionType);
        }
      }
    }

    // Fusionner les signatures d'index
    for (const interfaceType of interfaces) {
      for (const indexSig of interfaceType.indexSignatures) {
        merged.addIndexSignature(indexSig.clone() as FunctionType);
      }
    }

    // Fusionner les paramètres de type
    for (const interfaceType of interfaces) {
      for (const typeParam of interfaceType.typeParameters || []) {
        merged.addTypeParameter(typeParam.clone() as TypeParameter);
      }
    }

    return merged;
  }

  /**
   * Fusionner deux types
   */
  private mergeTypes(type1: Type, type2: Type): Type {
    // Si les types sont identiques, retourner l'un d'eux
    if (this.typeSystem.areEqual(type1, type2)) {
      return type1.clone();
    }

    // Si l'un est assignable à l'autre, retourner le plus général
    if (this.typeSystem.isAssignable(type1, type2)) {
      return type2.clone();
    }
    if (this.typeSystem.isAssignable(type2, type1)) {
      return type1.clone();
    }

    // Créer une union
    return this.typeSystem.unionTypes(type1, type2);
  }

  /**
   * Fusionner deux types de fonction
   */
  private mergeFunctionTypes(func1: FunctionType, func2: FunctionType): FunctionType {
    // Fusionner les paramètres (contravariance)
    const mergedParams: Type[] = [];
    for (let i = 0; i < Math.max(func1.parameters.length, func2.parameters.length); i++) {
      const param1 = i < func1.parameters.length ? func1.parameters[i] : this.typeSystem.anyType;
      const param2 = i < func2.parameters.length ? func2.parameters[i] : this.typeSystem.anyType;
      mergedParams.push(this.mergeTypes(param1, param2));
    }

    // Fusionner le type de retour (covariance)
    const mergedReturnType = this.mergeTypes(func1.returnType, func2.returnType);

    return this.typeSystem.createFunctionType(
      mergedReturnType,
      mergedParams
    ) as FunctionType;
  }
}

/**
 * Utilitaires pour les interfaces
 */
export class InterfaceUtils {
  private typeSystem: TypeSystem;

  constructor(typeSystem: TypeSystem) {
    this.typeSystem = typeSystem;
  }

  /**
   * Créer un constructeur d'interfaces
   */
  public createBuilder(name: string): InterfaceBuilder {
    return new InterfaceBuilder(this.typeSystem, name);
  }

  /**
   * Créer un vérificateur d'interfaces
   */
  public createChecker(): InterfaceChecker {
    return new InterfaceChecker(this.typeSystem);
  }

  /**
   * Créer un fusionneur d'interfaces
   */
  public createMerger(): InterfaceMerger {
    return new InterfaceMerger(this.typeSystem);
  }

  /**
   * Vérifier si un type est une interface
   */
  public isInterface(type: Type): type is InterfaceType {
    return this.typeSystem.isInterface(type);
  }

  /**
   * Convertir un type en interface
   */
  public toInterface(type: Type): InterfaceType | null {
    if (!this.isInterface(type)) {
      return null;
    }
    return type as InterfaceType;
  }

  /**
   * Obtenir le nom d'une interface
   */
  public getInterfaceName(interfaceType: InterfaceType): string {
    return interfaceType.name;
  }

  /**
   * Obtenir toutes les propriétés d'une interface
   */
  public getInterfaceProperties(interfaceType: InterfaceType): Map<string, Type> {
    return interfaceType.getProperties();
  }

  /**
   * Obtenir toutes les méthodes d'une interface
   */
  public getInterfaceMethods(interfaceType: InterfaceType): Map<string, FunctionType> {
    return interfaceType.getMethods();
  }

  /**
   * Obtenir toutes les signatures d'index d'une interface
   */
  public getInterfaceIndexSignatures(interfaceType: InterfaceType): FunctionType[] {
    return [...interfaceType.indexSignatures];
  }

  /**
   * Obtenir les interfaces de base d'une interface
   */
  public getBaseInterfaces(interfaceType: InterfaceType): InterfaceType[] {
    return interfaceType.baseTypes.filter(
      base => this.typeSystem.isInterface(base)
    ) as InterfaceType[];
  }

  /**
   * Créer une interface vide
   */
  public createEmptyInterface(name: string): InterfaceType {
    return new InterfaceType(name);
  }

  /**
   * Créer une interface à partir d'un objet
   */
  public createInterfaceFromObject(
    name: string,
    obj: Record<string, any>,
    typeSystem: TypeSystem
  ): InterfaceType {
    const interfaceType = new InterfaceType(name);
    
    for (const [key, value] of Object.entries(obj)) {
      let type: Type;
      
      if (value === null) {
        type = typeSystem.nullType;
      } else if (value === undefined) {
        type = typeSystem.undefinedType;
      } else if (typeof value === 'boolean') {
        type = typeSystem.booleanType;
      } else if (typeof value === 'number') {
        type = typeSystem.numberType;
      } else if (typeof value === 'string') {
        type = typeSystem.stringType;
      } else if (Array.isArray(value)) {
        type = typeSystem.createArrayType(typeSystem.anyType);
      } else if (typeof value === 'object') {
        type = this.createInterfaceFromObject(`${name}_${key}`, value, typeSystem);
      } else if (typeof value === 'function') {
        type = typeSystem.createFunctionType(typeSystem.anyType, []);
      } else {
        type = typeSystem.anyType;
      }
      
      interfaceType.addProperty(key, type);
    }
    
    return interfaceType;
  }
}

/**
 * Créer un utilitaire pour les interfaces
 */
export function createInterfaceUtils(typeSystem: TypeSystem): InterfaceUtils {
  return new InterfaceUtils(typeSystem);
}
