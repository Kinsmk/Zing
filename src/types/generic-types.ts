/**
 * GenericTypes - Types génériques pour Zinga
 * 
 * Ce module définit les types génériques et les paramètres de type.
 */

import { Type, TypeKind, GenericType, TypeParameter, TypeSystem, CompositeType, FunctionType } from './type-system';

/**
 * Paramètre de type générique
 */
export class GenericTypeParameter extends TypeParameter {
  // Contrainte du paramètre
  constraint?: Type;
  
  // Type par défaut
  defaultType?: Type;

  constructor(name: string, constraint?: Type, defaultType?: Type) {
    super(name, constraint, defaultType);
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

  clone(): GenericTypeParameter {
    return new GenericTypeParameter(
      this.name,
      this.constraint?.clone(),
      this.defaultType?.clone()
    );
  }

  /**
   * Vérifier si le paramètre a une contrainte
   */
  hasConstraint(): boolean {
    return this.constraint !== undefined;
  }

  /**
   * Vérifier si le paramètre a un type par défaut
   */
  hasDefaultType(): boolean {
    return this.defaultType !== undefined;
  }
}

/**
 * Type générique avec paramètres
 */
export class ParameterizedGenericType extends GenericType {
  // Type de base (classe, interface, etc.)
  baseType: CompositeType;
  
  // Arguments de type
  typeArguments: Type[] = [];

  constructor(id: string, baseType: CompositeType, name?: string) {
    super(id, name || baseType.name);
    this.baseType = baseType;
  }

  toString(): string {
    if (this.typeArguments.length > 0) {
      const args = this.typeArguments.map(t => t.toString()).join(', ');
      return `${this.name}<${args}>`;
    }
    return this.name;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      id: this.id,
      name: this.name,
      baseType: this.baseType.toJSON(),
      typeArguments: this.typeArguments.map(t => t.toJSON()),
    };
  }

  clone(): ParameterizedGenericType {
    const clone = new ParameterizedGenericType(this.id, this.baseType.clone() as CompositeType, this.name);
    clone.typeArguments = this.typeArguments.map(t => t.clone());
    clone.typeParameters = this.typeParameters?.map(t => t.clone() as TypeParameter);
    clone.constraint = this.constraint?.clone();
    clone.defaultType = this.defaultType?.clone();
    clone.resolvedType = this.resolvedType?.clone();
    return clone;
  }

  /**
   * Obtenir le type de base
   */
  getBaseType(): CompositeType {
    return this.baseType;
  }

  /**
   * Définir le type de base
   */
  setBaseType(type: CompositeType): void {
    this.baseType = type;
  }

  /**
   * Ajouter un argument de type
   */
  addTypeArgument(arg: Type): void {
    this.typeArguments.push(arg);
  }

  /**
   * Obtenir les arguments de type
   */
  getTypeArguments(): Type[] {
    return [...this.typeArguments];
  }

  /**
   * Définir les arguments de type
   */
  setTypeArguments(args: Type[]): void {
    this.typeArguments = [...args];
  }

  /**
   * Obtenir le nombre d'arguments de type
   */
  getTypeArgumentCount(): number {
    return this.typeArguments.length;
  }

  /**
   * Vérifier si tous les arguments de type sont fournis
   */
  isFullyParameterized(): boolean {
    const expectedCount = this.baseType.typeParameters?.length || 0;
    return this.typeArguments.length === expectedCount;
  }

  /**
   * Appliquer les arguments de type aux paramètres de type du type de base
   */
  applyTypeArguments(): void {
    const typeParams = this.baseType.typeParameters || [];
    
    for (let i = 0; i < Math.min(typeParams.length, this.typeArguments.length); i++) {
      const param = typeParams[i];
      const arg = this.typeArguments[i];
      
      // Remplacer les références au paramètre par l'argument
      this.replaceTypeParameter(this.baseType, param, arg);
    }
  }

  /**
   * Remplacer un paramètre de type par un type concret
   */
  private replaceTypeParameter(type: Type, param: TypeParameter, replacement: Type): void {
    if (type.kind === TypeKind.TypeParameter && (type as TypeParameter).name === param.name) {
      // Ce type est le paramètre à remplacer
      // À implémenter selon la structure
    }
    
    if (type.kind === TypeKind.Composite) {
      const composite = type as CompositeType;
      for (const member of composite.members.values()) {
        this.replaceTypeParameter(member, param, replacement);
      }
    }
    
    if (type.kind === TypeKind.Function) {
      const func = type as FunctionType;
      this.replaceTypeParameter(func.returnType, param, replacement);
      for (const paramType of func.parameters) {
        this.replaceTypeParameter(paramType, param, replacement);
      }
    }
    
    if (type.kind === TypeKind.Array) {
      const array = type as any;
      this.replaceTypeParameter(array.elementType, param, replacement);
    }
    
    if (type.kind === TypeKind.Tuple) {
      const tuple = type as any;
      for (const elementType of tuple.elementTypes) {
        this.replaceTypeParameter(elementType, param, replacement);
      }
    }
    
    if (type.kind === TypeKind.Object) {
      const obj = type as any;
      for (const propType of obj.properties.values()) {
        this.replaceTypeParameter(propType, param, replacement);
      }
    }
    
    if (type.kind === TypeKind.Union) {
      const union = type as any;
      for (const unionType of union.types) {
        this.replaceTypeParameter(unionType, param, replacement);
      }
    }
    
    if (type.kind === TypeKind.Intersection) {
      const intersection = type as any;
      for (const intersectionType of intersection.types) {
        this.replaceTypeParameter(intersectionType, param, replacement);
      }
    }
  }
}

/**
 * Type générique pour les fonctions
 */
export class GenericFunctionType extends FunctionType {
  // Paramètres de type
  typeParameters: TypeParameter[] = [];

  constructor(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ) {
    super(returnType, parameters, parameterNames);
  }

  toString(): string {
    const typeParams = this.typeParameters.map(t => t.toString()).join(', ');
    const params = this.parameters.map((t, i) => 
      `${this.parameterNames[i] || `arg${i}`}: ${t.toString()}`
    ).join(', ');
    return `<${typeParams}>(${params}) => ${this.returnType.toString()}`;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      returnType: this.returnType.toJSON(),
      parameters: this.parameters.map(t => t.toJSON()),
      parameterNames: this.parameterNames,
      typeParameters: this.typeParameters.map(t => t.toJSON()),
      isArrow: this.isArrow,
      isMethod: this.isMethod,
      isConstructor: this.isConstructor,
      isAsync: this.isAsync,
      isGenerator: this.isGenerator,
    };
  }

  clone(): GenericFunctionType {
    const clone = new GenericFunctionType(
      this.returnType.clone(),
      this.parameters.map(t => t.clone()),
      [...this.parameterNames]
    );
    clone.typeParameters = this.typeParameters.map(t => t.clone() as TypeParameter);
    clone.isArrow = this.isArrow;
    clone.isMethod = this.isMethod;
    clone.isConstructor = this.isConstructor;
    clone.isAsync = this.isAsync;
    clone.isGenerator = this.isGenerator;
    return clone;
  }

  /**
   * Ajouter un paramètre de type
   */
  addTypeParameter(param: TypeParameter): void {
    this.typeParameters.push(param);
  }

  /**
   * Obtenir les paramètres de type
   */
  getTypeParameters(): TypeParameter[] {
    return [...this.typeParameters];
  }

  /**
   * Instancier la fonction avec des arguments de type
   */
  instantiate(typeArguments: Type[]): FunctionType {
    const returnType = this.instantiateType(this.returnType, typeArguments);
    const parameters = this.parameters.map(p => this.instantiateType(p, typeArguments));
    
    return new FunctionType(returnType, parameters, [...this.parameterNames]);
  }

  /**
   * Instancier un type avec des arguments de type
   */
  private instantiateType(type: Type, typeArguments: Type[]): Type {
    if (type.kind === TypeKind.TypeParameter) {
      const param = type as TypeParameter;
      const index = this.typeParameters.findIndex(p => p.name === param.name);
      if (index !== -1 && index < typeArguments.length) {
        return typeArguments[index];
      }
      return type;
    }
    
    if (type.kind === TypeKind.Generic) {
      const generic = type as GenericType;
      if (generic.isResolved()) {
        return generic.resolvedType!;
      }
      return type;
    }
    
    if (type.kind === TypeKind.Function) {
      const func = type as FunctionType;
      const returnType = this.instantiateType(func.returnType, typeArguments);
      const parameters = func.parameters.map(p => this.instantiateType(p, typeArguments));
      return new FunctionType(returnType, parameters, [...func.parameterNames]);
    }
    
    if (type.kind === TypeKind.Array) {
      const array = type as any;
      return new (array.constructor)(this.instantiateType(array.elementType, typeArguments));
    }
    
    if (type.kind === TypeKind.Composite) {
      const composite = type as CompositeType;
      const clone = composite.clone() as CompositeType;
      for (const [name, member] of composite.members) {
        clone.members.set(name, this.instantiateType(member, typeArguments));
      }
      return clone;
    }
    
    return type;
  }
}

/**
 * Type générique pour les classes
 */
export class GenericClassType extends CompositeType {
  kind: TypeKind = TypeKind.Class;
  
  // Paramètres de type
  typeParameters: TypeParameter[] = [];

  constructor(name: string) {
    super(name, TypeKind.Class);
  }

  toString(): string {
    const typeParams = this.typeParameters.map(t => t.toString()).join(', ');
    return `${this.name}<${typeParams}>`;
  }

  toJSON(): any {
    return {
      kind: TypeKind[this.kind],
      name: this.name,
      members: Object.fromEntries(this.members),
      typeParameters: this.typeParameters.map(t => t.toJSON()),
      baseTypes: this.baseTypes.map(t => t.toJSON()),
      implementedTypes: this.implementedTypes.map(t => t.toJSON()),
    };
  }

  clone(): GenericClassType {
    const clone = new GenericClassType(this.name);
    clone.members = new Map(this.members);
    clone.typeParameters = this.typeParameters.map(t => t.clone() as TypeParameter);
    clone.baseTypes = this.baseTypes.map(t => t.clone());
    clone.implementedTypes = this.implementedTypes.map(t => t.clone());
    return clone;
  }

  /**
   * Ajouter un paramètre de type
   */
  addTypeParameter(param: TypeParameter): void {
    this.typeParameters.push(param);
  }

  /**
   * Obtenir les paramètres de type
   */
  getTypeParameters(): TypeParameter[] {
    return [...this.typeParameters];
  }

  /**
   * Instancier la classe avec des arguments de type
   */
  instantiate(typeArguments: Type[]): CompositeType {
    const clone = this.clone() as GenericClassType;
    
    for (let i = 0; i < Math.min(this.typeParameters.length, typeArguments.length); i++) {
      const param = this.typeParameters[i];
      const arg = typeArguments[i];
      
      // Remplacer les références au paramètre par l'argument
      this.replaceTypeParameter(clone, param, arg);
    }
    
    return clone;
  }

  /**
   * Remplacer un paramètre de type par un type concret
   */
  private replaceTypeParameter(type: Type, param: TypeParameter, replacement: Type): void {
    if (type.kind === TypeKind.TypeParameter && (type as TypeParameter).name === param.name) {
      // Ce type est le paramètre à remplacer
      // À implémenter selon la structure
    }
    
    if (type.kind === TypeKind.Composite) {
      const composite = type as CompositeType;
      for (const [name, member] of composite.members) {
        const memberType = composite.getProperty(name);
        if (memberType) {
          this.replaceTypeParameter(memberType, param, replacement);
        }
      }
    }
    
    if (type.kind === TypeKind.Function) {
      const func = type as FunctionType;
      this.replaceTypeParameter(func.returnType, param, replacement);
      for (const paramType of func.parameters) {
        this.replaceTypeParameter(paramType, param, replacement);
      }
    }
  }
}

/**
 * Fabrique de types génériques
 */
export class GenericTypeFactory {
  private typeSystem: TypeSystem;

  constructor(typeSystem: TypeSystem) {
    this.typeSystem = typeSystem;
  }

  public createTypeParameter(name: string, constraint?: Type, defaultType?: Type): GenericTypeParameter {
    return new GenericTypeParameter(name, constraint, defaultType);
  }

  public createGenericType(id: string, name?: string): GenericType {
    return new GenericType(id, name);
  }

  public createParameterizedGenericType(id: string, baseType: CompositeType, name?: string): ParameterizedGenericType {
    return new ParameterizedGenericType(id, baseType, name);
  }

  public createGenericFunctionType(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ): GenericFunctionType {
    return new GenericFunctionType(returnType, parameters, parameterNames);
  }

  public createGenericClassType(name: string): GenericClassType {
    return new GenericClassType(name);
  }

  public fromJSON(json: any): Type {
    switch (json.kind) {
      case 'TypeParameter':
        return this.createTypeParameter(
          json.name,
          json.constraint ? this.fromJSON(json.constraint) : undefined,
          json.defaultType ? this.fromJSON(json.defaultType) : undefined
        );
      case 'Generic':
        return this.createGenericType(json.id, json.name);
      case 'Function':
        if (json.typeParameters) {
          const returnType = this.fromJSON(json.returnType);
          const parameters = json.parameters.map((p: any) => this.fromJSON(p));
          const parameterNames = json.parameterNames || [];
          const func = this.createGenericFunctionType(returnType, parameters, parameterNames);
          for (const tp of json.typeParameters) {
            func.addTypeParameter(this.fromJSON(tp) as GenericTypeParameter);
          }
          return func;
        }
        return this.typeSystem.createFunctionType(
          this.fromJSON(json.returnType),
          json.parameters.map((p: any) => this.fromJSON(p)),
          json.parameterNames || []
        );
      default:
        return this.typeSystem.anyType;
    }
  }
}

/**
 * Créer une fabrique de types génériques
 */
export function createGenericTypeFactory(typeSystem: TypeSystem): GenericTypeFactory {
  return new GenericTypeFactory(typeSystem);
}
