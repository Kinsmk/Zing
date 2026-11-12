/**
 * Functions - Types de fonctions avancés pour Zinga
 * 
 * Ce module étend les types de fonctions avec des fonctionnalités avancées
 * incluant les fonctions génériques, les surcharges, les constructeurs, etc.
 */

import { Type, TypeKind, TypeSystem, PrimitiveType, CompositeType } from './type-system';
import { FunctionType as BaseFunctionType } from './type-system';
import { GenericType, ParameterizedGenericType, GenericTypeParameter } from './generic-types';
import { UnionType } from './unions';

/**
 * Type de fonction étendu avec des fonctionnalités avancées
 */
export class FunctionType extends BaseFunctionType {
  // Nom de la fonction (optionnel)
  name?: string;
  
  // Documentation de la fonction
  documentation?: string;
  
  // Indique si la fonction est une méthode
  isMethod: boolean = false;
  
  // Indique si la fonction est statique
  isStatic: boolean = false;
  
  // Indique si la fonction est abstraite
  isAbstract: boolean = false;
  
  // Indique si la fonction est finale
  isFinal: boolean = false;
  
  // Indique si la fonction est une propriété accesseur (getter/setter)
  isAccessor: boolean = false;
  
  // Type du this (pour les méthodes)
  thisType?: Type;
  
  // Paramètres de type (pour les fonctions génériques)
  typeParameters: GenericTypeParameter[] = [];
  
  // Surcharges de la fonction
  overloads: FunctionType[] = [];
  
  // Implementation de la fonction (pour les fonctions abstraites)
  implementation?: FunctionType;
  
  // Visibilité (public, private, protected)
  visibility: 'public' | 'private' | 'protected' = 'public';

  constructor(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ) {
    super(returnType, parameters, parameterNames);
  }

  toString(): string {
    let result = '';
    
    // Nom de la fonction
    if (this.name) {
      result += this.name;
    }
    
    // Paramètres de type
    if (this.typeParameters.length > 0) {
      const params = this.typeParameters.map(p => p.toString()).join(', ');
      result += `<${params}>`;
    }
    
    // Paramètres
    const params = this.parameters.map((t, i) => {
      const name = this.parameterNames[i] || `arg${i}`;
      return `${name}: ${t.toString()}`;
    }).join(', ');
    
    result += `(${params})`;
    
    // Type de retour
    result += ` => ${this.returnType.toString()}`;
    
    // Modificateurs
    const modifiers: string[] = [];
    if (this.isAsync) {
      modifiers.push('async');
    }
    if (this.isGenerator) {
      modifiers.push('*');
    }
    if (this.isMethod) {
      modifiers.push('method');
    }
    if (this.isStatic) {
      modifiers.push('static');
    }
    if (this.isAbstract) {
      modifiers.push('abstract');
    }
    if (this.isFinal) {
      modifiers.push('final');
    }
    
    if (modifiers.length > 0) {
      result = `${modifiers.join(' ')} ${result}`;
    }
    
    return result;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      name: this.name,
      documentation: this.documentation,
      isMethod: this.isMethod,
      isStatic: this.isStatic,
      isAbstract: this.isAbstract,
      isFinal: this.isFinal,
      isAccessor: this.isAccessor,
      thisType: this.thisType?.toJSON(),
      typeParameters: this.typeParameters.map(t => t.toJSON()),
      overloads: this.overloads.map(o => o.toJSON()),
      implementation: this.implementation?.toJSON(),
      visibility: this.visibility,
    };
  }

  clone(): FunctionType {
    const clone = new FunctionType(
      this.returnType.clone(),
      this.parameters.map(t => t.clone()),
      [...this.parameterNames]
    );
    
    clone.name = this.name;
    clone.documentation = this.documentation;
    clone.isArrow = this.isArrow;
    clone.isMethod = this.isMethod;
    clone.isConstructor = this.isConstructor;
    clone.isStatic = this.isStatic;
    clone.isAbstract = this.isAbstract;
    clone.isFinal = this.isFinal;
    clone.isAccessor = this.isAccessor;
    clone.isAsync = this.isAsync;
    clone.isGenerator = this.isGenerator;
    clone.thisType = this.thisType?.clone();
    clone.typeParameters = this.typeParameters.map(t => t.clone() as GenericTypeParameter);
    clone.overloads = this.overloads.map(o => o.clone() as FunctionType);
    clone.implementation = this.implementation?.clone() as FunctionType | undefined;
    clone.visibility = this.visibility;
    
    return clone;
  }

  /**
   * Ajouter un paramètre de type
   */
  addTypeParameter(param: GenericTypeParameter): void {
    this.typeParameters.push(param);
  }

  /**
   * Obtenir les paramètres de type
   */
  getTypeParameters(): GenericTypeParameter[] {
    return [...this.typeParameters];
  }

  /**
   * Définir le nom de la fonction
   */
  setName(name: string): void {
    this.name = name;
  }

  /**
   * Obtenir le nom de la fonction
   */
  getName(): string | undefined {
    return this.name;
  }

  /**
   * Définir la documentation
   */
  setDocumentation(doc: string): void {
    this.documentation = doc;
  }

  /**
   * Obtenir la documentation
   */
  getDocumentation(): string | undefined {
    return this.documentation;
  }

  /**
   * Définir si la fonction est une méthode
   */
  setIsMethod(isMethod: boolean): void {
    this.isMethod = isMethod;
  }

  /**
   * Vérifier si la fonction est une méthode
   */
  isFunctionMethod(): boolean {
    return this.isMethod;
  }

  /**
   * Définir si la fonction est statique
   */
  setIsStatic(isStatic: boolean): void {
    this.isStatic = isStatic;
  }

  /**
   * Vérifier si la fonction est statique
   */
  isStaticFunction(): boolean {
    return this.isStatic;
  }

  /**
   * Définir si la fonction est abstraite
   */
  setIsAbstract(isAbstract: boolean): void {
    this.isAbstract = isAbstract;
  }

  /**
   * Vérifier si la fonction est abstraite
   */
  isAbstractFunction(): boolean {
    return this.isAbstract;
  }

  /**
   * Définir si la fonction est finale
   */
  setIsFinal(isFinal: boolean): void {
    this.isFinal = isFinal;
  }

  /**
   * Vérifier si la fonction est finale
   */
  isFinalFunction(): boolean {
    return this.isFinal;
  }

  /**
   * Définir si la fonction est un accesseur
   */
  setIsAccessor(isAccessor: boolean): void {
    this.isAccessor = isAccessor;
  }

  /**
   * Vérifier si la fonction est un accesseur
   */
  isAccessorFunction(): boolean {
    return this.isAccessor;
  }

  /**
   * Définir le type du this
   */
  setThisType(type: Type): void {
    this.thisType = type;
  }

  /**
   * Obtenir le type du this
   */
  getThisType(): Type | undefined {
    return this.thisType;
  }

  /**
   * Ajouter une surcharge
   */
  addOverload(overload: FunctionType): void {
    this.overloads.push(overload);
  }

  /**
   * Obtenir les surcharges
   */
  getOverloads(): FunctionType[] {
    return [...this.overloads];
  }

  /**
   * Définir l'implémentation
   */
  setImplementation(implementation: FunctionType): void {
    this.implementation = implementation;
  }

  /**
   * Obtenir l'implémentation
   */
  getImplementation(): FunctionType | undefined {
    return this.implementation;
  }

  /**
   * Définir la visibilité
   */
  setVisibility(visibility: 'public' | 'private' | 'protected'): void {
    this.visibility = visibility;
  }

  /**
   * Obtenir la visibilité
   */
  getVisibility(): 'public' | 'private' | 'protected' {
    return this.visibility;
  }

  /**
   * Vérifier si la fonction a des paramètres de type
   */
  hasTypeParameters(): boolean {
    return this.typeParameters.length > 0;
  }

  /**
   * Vérifier si la fonction a des surcharges
   */
  hasOverloads(): boolean {
    return this.overloads.length > 0;
  }

  /**
   * Vérifier si la fonction est générique
   */
  isGeneric(): boolean {
    return this.typeParameters.length > 0;
  }

  /**
   * Obtenir la signature de la fonction
   */
  getSignature(): string {
    const params = this.parameters.map((t, i) => {
      const name = this.parameterNames[i] || `arg${i}`;
      return `${name}: ${t.toString()}`;
    }).join(', ');
    
    return `(${params}) => ${this.returnType.toString()}`;
  }

  /**
   * Vérifier la compatibilité avec une autre fonction
   */
  isCompatibleWith(other: FunctionType, typeSystem: TypeSystem): boolean {
    // Vérifier le nombre de paramètres
    if (this.parameters.length !== other.parameters.length) {
      // Les fonctions avec moins de paramètres sont compatibles si les autres sont optionnels
      if (this.parameters.length < other.parameters.length) {
        return false;
      }
    }
    
    // Vérifier la compatibilité des paramètres (contravariance)
    for (let i = 0; i < Math.min(this.parameters.length, other.parameters.length); i++) {
      if (!typeSystem.isAssignable(other.parameters[i], this.parameters[i])) {
        return false;
      }
    }
    
    // Vérifier la compatibilité du type de retour (covariance)
    if (!typeSystem.isAssignable(this.returnType, other.returnType)) {
      return false;
    }
    
    // Vérifier la compatibilité du this type
    if (this.thisType && other.thisType) {
      if (!typeSystem.isAssignable(other.thisType, this.thisType)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Appliquer des arguments de type
   */
  applyTypeArguments(typeArguments: Type[]): FunctionType {
    if (this.typeParameters.length !== typeArguments.length) {
      throw new Error(`Nombre incorrect d'arguments de type: attendu ${this.typeParameters.length}, reçu ${typeArguments.length}`);
    }
    
    const clone = this.clone() as FunctionType;
    
    // Remplacer les paramètres de type par les arguments
    const typeMap = new Map<string, Type>();
    for (let i = 0; i < this.typeParameters.length; i++) {
      typeMap.set(this.typeParameters[i].name, typeArguments[i]);
    }
    
    // Appliquer la substitution aux paramètres et au type de retour
    clone.parameters = this.parameters.map(p => this.substituteType(p, typeMap));
    clone.returnType = this.substituteType(this.returnType, typeMap);
    
    // Appliquer la substitution au this type
    if (this.thisType) {
      clone.thisType = this.substituteType(this.thisType, typeMap);
    }
    
    // Appliquer la substitution aux surcharges
    clone.overloads = this.overloads.map(o => {
      const overloadClone = o.clone() as FunctionType;
      overloadClone.parameters = o.parameters.map(p => this.substituteType(p, typeMap));
      overloadClone.returnType = this.substituteType(o.returnType, typeMap);
      return overloadClone;
    });
    
    // Appliquer la substitution à l'implémentation
    if (this.implementation) {
      const implClone = this.implementation.clone() as FunctionType;
      implClone.parameters = this.implementation.parameters.map(p => this.substituteType(p, typeMap));
      implClone.returnType = this.substituteType(this.implementation.returnType, typeMap);
      clone.implementation = implClone;
    }
    
    // Supprimer les paramètres de type après application
    clone.typeParameters = [];
    
    return clone;
  }

  /**
   * Substituer les types dans un type donné
   */
  private substituteType(type: Type, typeMap: Map<string, Type>): Type {
    // Vérifier si le type est un paramètre de type
    if (type.kind === TypeKind.TypeParameter) {
      const param = type as unknown as GenericTypeParameter;
      const substituted = typeMap.get(param.name);
      if (substituted) {
        return substituted;
      }
    }
    
    // Pour les types composites, appliquer la substitution récursivement
    if (type instanceof BaseFunctionType) {
      const func = type as FunctionType;
      const clone = func.clone() as FunctionType;
      clone.parameters = func.parameters.map(p => this.substituteType(p, typeMap));
      clone.returnType = this.substituteType(func.returnType, typeMap);
      return clone;
    }
    
    if (type instanceof CompositeType) {
      const composite = type as CompositeType;
      const clone = composite.clone() as CompositeType;
      const members = new Map<string, Type>();
      for (const [name, memberType] of composite.members) {
        members.set(name, this.substituteType(memberType, typeMap));
      }
      clone.members = members;
      return clone;
    }
    
    return type;
  }
}

/**
 * Type de constructeur
 */
export class ConstructorType extends FunctionType {
  // Classe à laquelle le constructeur appartient
  classType?: Type;
  
  // Indique si le constructeur est le constructeur principal
  isPrimary: boolean = true;

  constructor(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ) {
    super(returnType, parameters, parameterNames);
    this.isConstructor = true;
  }

  toString(): string {
    let result = 'new ';
    
    if (this.name) {
      result += this.name;
    }
    
    // Paramètres de type
    if (this.typeParameters.length > 0) {
      const params = this.typeParameters.map(p => p.toString()).join(', ');
      result += `<${params}>`;
    }
    
    // Paramètres
    const params = this.parameters.map((t, i) => {
      const name = this.parameterNames[i] || `arg${i}`;
      return `${name}: ${t.toString()}`;
    }).join(', ');
    
    result += `(${params})`;
    
    return result;
  }

  clone(): ConstructorType {
    const clone = new ConstructorType(
      this.returnType.clone(),
      this.parameters.map(t => t.clone()),
      [...this.parameterNames]
    );
    
    clone.name = this.name;
    clone.classType = this.classType?.clone();
    clone.isPrimary = this.isPrimary;
    clone.isArrow = this.isArrow;
    clone.isMethod = this.isMethod;
    clone.isStatic = this.isStatic;
    clone.isAbstract = this.isAbstract;
    clone.isFinal = this.isFinal;
    clone.isAccessor = this.isAccessor;
    clone.isAsync = this.isAsync;
    clone.isGenerator = this.isGenerator;
    clone.thisType = this.thisType?.clone();
    clone.typeParameters = this.typeParameters.map(t => t.clone() as GenericTypeParameter);
    clone.overloads = this.overloads.map(o => o.clone() as FunctionType);
    clone.implementation = this.implementation?.clone() as FunctionType | undefined;
    clone.visibility = this.visibility;
    
    return clone;
  }

  /**
   * Définir le type de la classe
   */
  setClassType(type: Type): void {
    this.classType = type;
  }

  /**
   * Obtenir le type de la classe
   */
  getClassType(): Type | undefined {
    return this.classType;
  }

  /**
   * Définir si c'est le constructeur principal
   */
  setIsPrimary(isPrimary: boolean): void {
    this.isPrimary = isPrimary;
  }

  /**
   * Vérifier si c'est le constructeur principal
   */
  isPrimaryConstructor(): boolean {
    return this.isPrimary;
  }
}

/**
 * Type de méthode
 */
export class MethodType extends FunctionType {
  // Classe ou interface à laquelle la méthode appartient
  parentType?: Type;

  constructor(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ) {
    super(returnType, parameters, parameterNames);
    this.isMethod = true;
  }

  toString(): string {
    const modifiers: string[] = [];
    
    if (this.isStatic) {
      modifiers.push('static');
    }
    if (this.isAbstract) {
      modifiers.push('abstract');
    }
    if (this.isFinal) {
      modifiers.push('final');
    }
    if (this.visibility !== 'public') {
      modifiers.push(this.visibility);
    }
    if (this.isAsync) {
      modifiers.push('async');
    }
    if (this.isGenerator) {
      modifiers.push('*');
    }
    
    let result = '';
    if (modifiers.length > 0) {
      result += `${modifiers.join(' ')} `;
    }
    
    if (this.name) {
      result += this.name;
    }
    
    // Paramètres de type
    if (this.typeParameters.length > 0) {
      const params = this.typeParameters.map(p => p.toString()).join(', ');
      result += `<${params}>`;
    }
    
    // Paramètres
    const params = this.parameters.map((t, i) => {
      const name = this.parameterNames[i] || `arg${i}`;
      return `${name}: ${t.toString()}`;
    }).join(', ');
    
    result += `(${params})`;
    
    // Type de retour
    result += ` => ${this.returnType.toString()}`;
    
    return result;
  }

  clone(): MethodType {
    const clone = new MethodType(
      this.returnType.clone(),
      this.parameters.map(t => t.clone()),
      [...this.parameterNames]
    );
    
    clone.name = this.name;
    clone.parentType = this.parentType?.clone();
    clone.isStatic = this.isStatic;
    clone.isAbstract = this.isAbstract;
    clone.isFinal = this.isFinal;
    clone.isAccessor = this.isAccessor;
    clone.isAsync = this.isAsync;
    clone.isGenerator = this.isGenerator;
    clone.thisType = this.thisType?.clone();
    clone.typeParameters = this.typeParameters.map(t => t.clone() as GenericTypeParameter);
    clone.overloads = this.overloads.map(o => o.clone() as FunctionType);
    clone.implementation = this.implementation?.clone() as FunctionType | undefined;
    clone.visibility = this.visibility;
    
    return clone;
  }

  /**
   * Définir le type parent
   */
  setParentType(type: Type): void {
    this.parentType = type;
  }

  /**
   * Obtenir le type parent
   */
  getParentType(): Type | undefined {
    return this.parentType;
  }
}

/**
 * Type de fonction surchargée
 */
export class OverloadedFunctionType extends FunctionType {
  // Surcharges de la fonction
  overloads: FunctionType[] = [];

  constructor(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ) {
    super(returnType, parameters, parameterNames);
  }

  toString(): string {
    if (this.overloads.length === 0) {
      return super.toString();
    }
    
    const overloadStrings = this.overloads.map(o => o.toString());
    return `Overloads:\n  ${overloadStrings.join('\n  ')}`;
  }

  clone(): OverloadedFunctionType {
    const clone = new OverloadedFunctionType(
      this.returnType.clone(),
      this.parameters.map(t => t.clone()),
      [...this.parameterNames]
    );
    
    clone.name = this.name;
    clone.overloads = this.overloads.map(o => o.clone() as FunctionType);
    clone.isMethod = this.isMethod;
    clone.isStatic = this.isStatic;
    clone.isAbstract = this.isAbstract;
    clone.isFinal = this.isFinal;
    clone.isAccessor = this.isAccessor;
    clone.isAsync = this.isAsync;
    clone.isGenerator = this.isGenerator;
    clone.thisType = this.thisType?.clone();
    clone.typeParameters = this.typeParameters.map(t => t.clone() as GenericTypeParameter);
    clone.implementation = this.implementation?.clone() as FunctionType | undefined;
    clone.visibility = this.visibility;
    
    return clone;
  }

  /**
   * Ajouter une surcharge
   */
  addOverload(overload: FunctionType): void {
    this.overloads.push(overload);
  }

  /**
   * Obtenir les surcharges
   */
  getOverloads(): FunctionType[] {
    return [...this.overloads];
  }

  /**
   * Résoudre la surcharge appropriée pour des arguments donnés
   */
  resolveOverload(argumentTypes: Type[], typeSystem: TypeSystem): FunctionType | undefined {
    // Trouver la surcharge la plus spécifique
    let bestMatch: FunctionType | undefined;
    let bestMatchScore = -1;
    
    const candidates = [this, ...this.overloads];
    
    for (const overload of candidates) {
      const score = this.calculateOverloadScore(overload, argumentTypes, typeSystem);
      
      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = overload;
      }
    }
    
    return bestMatch;
  }

  /**
   * Calculer le score de correspondance d'une surcharge
   */
  private calculateOverloadScore(
    overload: FunctionType,
    argumentTypes: Type[],
    typeSystem: TypeSystem
  ): number {
    let score = 0;
    
    // Vérifier le nombre de paramètres
    if (overload.parameters.length === argumentTypes.length) {
      score += 100;
    } else if (overload.parameters.length < argumentTypes.length) {
      // Vérifier si les paramètres supplémentaires sont optionnels
      score += 50;
    } else {
      // Plus de paramètres que d'arguments
      score -= 100;
    }
    
    // Vérifier la compatibilité des types
    for (let i = 0; i < Math.min(overload.parameters.length, argumentTypes.length); i++) {
      if (typeSystem.isAssignable(argumentTypes[i], overload.parameters[i])) {
        score += 10;
      } else if (typeSystem.isAssignable(overload.parameters[i], argumentTypes[i])) {
        score += 5; // Contravariance
      } else {
        score -= 100;
        break;
      }
    }
    
    return score;
  }
}

/**
 * Type de fonction générique
 */
export class GenericFunctionType extends FunctionType {
  // Paramètres de type par défaut
  defaultTypeParameters: Type[] = [];

  constructor(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ) {
    super(returnType, parameters, parameterNames);
  }

  toString(): string {
    let result = '';
    
    if (this.name) {
      result += this.name;
    }
    
    // Paramètres de type
    if (this.typeParameters.length > 0) {
      const params = this.typeParameters.map(p => p.toString()).join(', ');
      result += `<${params}>`;
    }
    
    // Paramètres
    const params = this.parameters.map((t, i) => {
      const name = this.parameterNames[i] || `arg${i}`;
      return `${name}: ${t.toString()}`;
    }).join(', ');
    
    result += `(${params})`;
    
    // Type de retour
    result += ` => ${this.returnType.toString()}`;
    
    return result;
  }

  clone(): GenericFunctionType {
    const clone = new GenericFunctionType(
      this.returnType.clone(),
      this.parameters.map(t => t.clone()),
      [...this.parameterNames]
    );
    
    clone.name = this.name;
    clone.typeParameters = this.typeParameters.map(t => t.clone() as GenericTypeParameter);
    clone.defaultTypeParameters = this.defaultTypeParameters.map(t => t.clone());
    clone.isMethod = this.isMethod;
    clone.isStatic = this.isStatic;
    clone.isAbstract = this.isAbstract;
    clone.isFinal = this.isFinal;
    clone.isAccessor = this.isAccessor;
    clone.isAsync = this.isAsync;
    clone.isGenerator = this.isGenerator;
    clone.thisType = this.thisType?.clone();
    clone.overloads = this.overloads.map(o => o.clone() as FunctionType);
    clone.implementation = this.implementation?.clone() as FunctionType | undefined;
    clone.visibility = this.visibility;
    
    return clone;
  }

  /**
   * Définir les paramètres de type par défaut
   */
  setDefaultTypeParameters(params: Type[]): void {
    this.defaultTypeParameters = params;
  }

  /**
   * Obtenir les paramètres de type par défaut
   */
  getDefaultTypeParameters(): Type[] {
    return [...this.defaultTypeParameters];
  }

  /**
   * Appliquer des arguments de type partiels (avec valeurs par défaut)
   */
  applyPartialTypeArguments(typeArguments: Type[]): FunctionType {
    const fullArguments = [...typeArguments];
    
    // Compléter avec les valeurs par défaut
    while (fullArguments.length < this.typeParameters.length) {
      const index = fullArguments.length;
      if (index < this.defaultTypeParameters.length) {
        fullArguments.push(this.defaultTypeParameters[index]);
      } else {
        throw new Error(`Argument de type manquant pour ${this.typeParameters[index].name}`);
      }
    }
    
    return this.applyTypeArguments(fullArguments);
  }
}

/**
 * Fabrique de types de fonctions
 */
export class FunctionTypeFactory {
  private typeSystem: TypeSystem;

  constructor(typeSystem: TypeSystem) {
    this.typeSystem = typeSystem;
  }

  /**
   * Créer un type de fonction
   */
  createFunction(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ): FunctionType {
    return new FunctionType(returnType, parameters, parameterNames);
  }

  /**
   * Créer un type de constructeur
   */
  createConstructor(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ): ConstructorType {
    return new ConstructorType(returnType, parameters, parameterNames);
  }

  /**
   * Créer un type de méthode
   */
  createMethod(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ): MethodType {
    return new MethodType(returnType, parameters, parameterNames);
  }

  /**
   * Créer un type de fonction surchargée
   */
  createOverloadedFunction(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ): OverloadedFunctionType {
    return new OverloadedFunctionType(returnType, parameters, parameterNames);
  }

  /**
   * Créer un type de fonction générique
   */
  createGenericFunction(
    returnType: Type,
    parameters: Type[] = [],
    parameterNames: string[] = []
  ): GenericFunctionType {
    return new GenericFunctionType(returnType, parameters, parameterNames);
  }

  /**
   * Créer une fonction depuis une signature
   */
  createFromSignature(signature: string): FunctionType {
    // Parsing simple de la signature (à améliorer)
    // Format attendu: (param1: type1, param2: type2) => returnType
    const match = signature.match(/^\(([^)]*)\)\s*=>\s*([^\s]+)/);
    
    if (!match) {
      throw new Error(`Signature de fonction invalide: ${signature}`);
    }
    
    const paramsStr = match[1];
    const returnTypeStr = match[2];
    
    // Parser les paramètres
    const paramPairs = paramsStr.split(',').map(p => p.trim());
    const parameters: Type[] = [];
    const parameterNames: string[] = [];
    
    for (const pair of paramPairs) {
      if (!pair) continue;
      
      const [name, type] = pair.split(':').map(s => s.trim());
      const parsedType = this.parseType(type);
      
      parameters.push(parsedType);
      parameterNames.push(name);
    }
    
    const returnType = this.parseType(returnTypeStr);
    
    return new FunctionType(returnType, parameters, parameterNames);
  }

  /**
   * Parser un type depuis une chaîne
   */
  private parseType(typeStr: string): Type {
    // Implémentation simplifiée - à compléter
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

  /**
   * Créer depuis un JSON
   */
  fromJSON(json: any): FunctionType {
    switch (json.kind) {
      case 'Function':
        return this.createFunction(
          this.typeSystem.fromJSON(json.returnType),
          json.parameters.map((p: any) => this.typeSystem.fromJSON(p)),
          json.parameterNames || []
        );
      case 'Constructor':
        return this.createConstructor(
          this.typeSystem.fromJSON(json.returnType),
          json.parameters.map((p: any) => this.typeSystem.fromJSON(p)),
          json.parameterNames || []
        );
      case 'Method':
        return this.createMethod(
          this.typeSystem.fromJSON(json.returnType),
          json.parameters.map((p: any) => this.typeSystem.fromJSON(p)),
          json.parameterNames || []
        );
      default:
        return this.createFunction(
          this.typeSystem.fromJSON(json.returnType),
          json.parameters.map((p: any) => this.typeSystem.fromJSON(p)),
          json.parameterNames || []
        );
    }
  }
}

/**
 * Créer une fabrique de types de fonctions
 */
export function createFunctionTypeFactory(typeSystem: TypeSystem): FunctionTypeFactory {
  return new FunctionTypeFactory(typeSystem);
}

/**
 * Utilitaires pour les types de fonctions
 */
export class FunctionUtils {
  /**
   * Vérifier si un type est une fonction
   */
  static isFunctionType(type: Type): type is FunctionType {
    return type instanceof FunctionType ||
           type instanceof ConstructorType ||
           type instanceof MethodType ||
           type instanceof OverloadedFunctionType ||
           type instanceof GenericFunctionType;
  }

  /**
   * Vérifier si un type est un constructeur
   */
  static isConstructorType(type: Type): type is ConstructorType {
    return type instanceof ConstructorType;
  }

  /**
   * Vérifier si un type est une méthode
   */
  static isMethodType(type: Type): type is MethodType {
    return type instanceof MethodType;
  }

  /**
   * Vérifier si un type est une fonction surchargée
   */
  static isOverloadedFunctionType(type: Type): type is OverloadedFunctionType {
    return type instanceof OverloadedFunctionType;
  }

  /**
   * Vérifier si un type est une fonction générique
   */
  static isGenericFunctionType(type: Type): type is GenericFunctionType {
    return type instanceof GenericFunctionType;
  }

  /**
   * Obtenir le nombre de paramètres d'une fonction
   */
  static getParameterCount(func: FunctionType): number {
    return func.parameters.length;
  }

  /**
   * Obtenir le type de retour d'une fonction
   */
  static getReturnType(func: FunctionType): Type {
    return func.returnType;
  }

  /**
   * Obtenir les types des paramètres d'une fonction
   */
  static getParameterTypes(func: FunctionType): Type[] {
    return [...func.parameters];
  }

  /**
   * Obtenir les noms des paramètres d'une fonction
   */
  static getParameterNames(func: FunctionType): string[] {
    return [...func.parameterNames];
  }

  /**
   * Vérifier si une fonction est asynchrone
   */
  static isAsync(func: FunctionType): boolean {
    return func.isAsync;
  }

  /**
   * Vérifier si une fonction est un générateur
   */
  static isGenerator(func: FunctionType): boolean {
    return func.isGenerator;
  }

  /**
   * Vérifier si une fonction est générique
   */
  static isGeneric(func: FunctionType): boolean {
    return func.typeParameters.length > 0;
  }

  /**
   * Vérifier si deux fonctions sont compatibles
   */
  static areCompatible(func1: FunctionType, func2: FunctionType, typeSystem: TypeSystem): boolean {
    return func1.isCompatibleWith(func2, typeSystem);
  }

  /**
   * Créer une signature de fonction
   */
  static createSignature(
    parameters: Type[],
    parameterNames: string[],
    returnType: Type
  ): string {
    const params = parameters.map((t, i) => {
      const name = parameterNames[i] || `arg${i}`;
      return `${name}: ${t.toString()}`;
    }).join(', ');
    
    return `(${params}) => ${returnType.toString()}`;
  }
}

export {
  FunctionType as default,
  ConstructorType,
  MethodType,
  OverloadedFunctionType,
  GenericFunctionType,
  FunctionTypeFactory,
  FunctionUtils,
};
