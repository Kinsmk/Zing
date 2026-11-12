/**
 * PrimitiveTypes - Types primitifs pour Zinga
 * 
 * Ce module définit les types primitifs de base du langage.
 */

import { Type, TypeKind, PrimitiveType } from './type-system';

/**
 * Types primitifs de base
 */
export class NumberType extends PrimitiveType {
  constructor() {
    super(TypeKind.Number, 'number');
  }

  static readonly INSTANCE = new NumberType();
}

export class StringType extends PrimitiveType {
  constructor() {
    super(TypeKind.String, 'string');
  }

  static readonly INSTANCE = new StringType();
}

export class BooleanType extends PrimitiveType {
  constructor() {
    super(TypeKind.Boolean, 'boolean');
  }

  static readonly INSTANCE = new BooleanType();
}

export class NullType extends PrimitiveType {
  constructor() {
    super(TypeKind.Null, 'null');
  }

  static readonly INSTANCE = new NullType();
}

export class UndefinedType extends PrimitiveType {
  constructor() {
    super(TypeKind.Undefined, 'undefined');
  }

  static readonly INSTANCE = new UndefinedType();
}

export class VoidType extends PrimitiveType {
  constructor() {
    super(TypeKind.Void, 'void');
  }

  static readonly INSTANCE = new VoidType();
}

export class AnyType extends PrimitiveType {
  constructor() {
    super(TypeKind.Any, 'any');
  }

  static readonly INSTANCE = new AnyType();
}

export class UnknownType extends PrimitiveType {
  constructor() {
    super(TypeKind.Unknown, 'unknown');
  }

  static readonly INSTANCE = new UnknownType();
}

export class NeverType extends PrimitiveType {
  constructor() {
    super(TypeKind.Never, 'never');
  }

  static readonly INSTANCE = new NeverType();
}

export class SymbolType extends PrimitiveType {
  constructor() {
    super(TypeKind.Symbol, 'symbol');
  }

  static readonly INSTANCE = new SymbolType();
}

export class BigIntType extends PrimitiveType {
  constructor() {
    super(TypeKind.BigInt, 'bigint');
  }

  static readonly INSTANCE = new BigIntType();
}

/**
 * Types numériques
 */
export class IntType extends PrimitiveType {
  constructor() {
    super(TypeKind.Number, 'int');
  }

  static readonly INSTANCE = new IntType();
}

export class FloatType extends PrimitiveType {
  constructor() {
    super(TypeKind.Number, 'float');
  }

  static readonly INSTANCE = new FloatType();
}

export class DoubleType extends PrimitiveType {
  constructor() {
    super(TypeKind.Number, 'double');
  }

  static readonly INSTANCE = new DoubleType();
}

/**
 * Types texte
 */
export class CharType extends PrimitiveType {
  constructor() {
    super(TypeKind.String, 'char');
  }

  static readonly INSTANCE = new CharType();
}

/**
 * Types booléens étendus
 */
export class TrueType extends PrimitiveType {
  constructor() {
    super(TypeKind.Boolean, 'true');
  }

  static readonly INSTANCE = new TrueType();
}

export class FalseType extends PrimitiveType {
  constructor() {
    super(TypeKind.Boolean, 'false');
  }

  static readonly INSTANCE = new FalseType();
}

/**
 * Fabrique de types primitifs
 */
export class PrimitiveTypeFactory {
  private static instance: PrimitiveTypeFactory;

  private constructor() {}

  public static getInstance(): PrimitiveTypeFactory {
    if (!PrimitiveTypeFactory.instance) {
      PrimitiveTypeFactory.instance = new PrimitiveTypeFactory();
    }
    return PrimitiveTypeFactory.instance;
  }

  public number(): NumberType {
    return NumberType.INSTANCE;
  }

  public string(): StringType {
    return StringType.INSTANCE;
  }

  public boolean(): BooleanType {
    return BooleanType.INSTANCE;
  }

  public null(): NullType {
    return NullType.INSTANCE;
  }

  public undefined(): UndefinedType {
    return UndefinedType.INSTANCE;
  }

  public void(): VoidType {
    return VoidType.INSTANCE;
  }

  public any(): AnyType {
    return AnyType.INSTANCE;
  }

  public unknown(): UnknownType {
    return UnknownType.INSTANCE;
  }

  public never(): NeverType {
    return NeverType.INSTANCE;
  }

  public symbol(): SymbolType {
    return SymbolType.INSTANCE;
  }

  public bigint(): BigIntType {
    return BigIntType.INSTANCE;
  }

  public int(): IntType {
    return IntType.INSTANCE;
  }

  public float(): FloatType {
    return FloatType.INSTANCE;
  }

  public double(): DoubleType {
    return DoubleType.INSTANCE;
  }

  public char(): CharType {
    return CharType.INSTANCE;
  }

  public true(): TrueType {
    return TrueType.INSTANCE;
  }

  public false(): FalseType {
    return FalseType.INSTANCE;
  }

  public fromString(name: string): PrimitiveType {
    const types: Record<string, PrimitiveType> = {
      'number': this.number(),
      'string': this.string(),
      'boolean': this.boolean(),
      'null': this.null(),
      'undefined': this.undefined(),
      'void': this.void(),
      'any': this.any(),
      'unknown': this.unknown(),
      'never': this.never(),
      'symbol': this.symbol(),
      'bigint': this.bigint(),
      'int': this.int(),
      'float': this.float(),
      'double': this.double(),
      'char': this.char(),
      'true': this.true(),
      'false': this.false(),
    };

    return types[name.toLowerCase()] || this.any();
  }
}

/**
 * Obtenir la fabrique de types primitifs
 */
export function getPrimitiveTypeFactory(): PrimitiveTypeFactory {
  return PrimitiveTypeFactory.getInstance();
}

/**
 * Types primitifs par défaut
 */
export const PrimitiveTypes = {
  number: NumberType.INSTANCE,
  string: StringType.INSTANCE,
  boolean: BooleanType.INSTANCE,
  null: NullType.INSTANCE,
  undefined: UndefinedType.INSTANCE,
  void: VoidType.INSTANCE,
  any: AnyType.INSTANCE,
  unknown: UnknownType.INSTANCE,
  never: NeverType.INSTANCE,
  symbol: SymbolType.INSTANCE,
  bigint: BigIntType.INSTANCE,
  int: IntType.INSTANCE,
  float: FloatType.INSTANCE,
  double: DoubleType.INSTANCE,
  char: CharType.INSTANCE,
  true: TrueType.INSTANCE,
  false: FalseType.INSTANCE,
};
