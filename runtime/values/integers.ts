/**
 * Integers - Types entiers pour Zinga
 * 
 * Ce module implemente les types entiers utilise par le runtime Zinga.
 * Il prend en charge differentes tailles d'entiers (8, 16, 32, 64 bits)
 * avec ou sans signe.
 */

import { MemoryAllocator, getAllocator } from '../memory/allocator';
import { MemoryException } from '../errors/exceptions';

/**
 * Type d'entier
 */
export enum IntegerType {
  // Entiers non signes
  U8 = 'U8',
  U16 = 'U16',
  U32 = 'U32',
  U64 = 'U64',
  // Entiers signes
  I8 = 'I8',
  I16 = 'I16',
  I32 = 'I32',
  I64 = 'I64',
  // Entiers de taille variable
  USIZE = 'USIZE',
  ISIZE = 'ISIZE',
}

/**
 * Taille d'un type d'entier
 */
export const INTEGER_SIZES: Record<IntegerType, number> = {
  [IntegerType.U8]: 1,
  [IntegerType.U16]: 2,
  [IntegerType.U32]: 4,
  [IntegerType.U64]: 8,
  [IntegerType.I8]: 1,
  [IntegerType.I16]: 2,
  [IntegerType.I32]: 4,
  [IntegerType.I64]: 8,
  [IntegerType.USIZE]: 8,
  [IntegerType.ISIZE]: 8,
};

/**
 * Valeurs minimales pour les entiers signes
 */
export const INTEGER_MIN_VALUES: Record<IntegerType, bigint> = {
  [IntegerType.U8]: 0n,
  [IntegerType.U16]: 0n,
  [IntegerType.U32]: 0n,
  [IntegerType.U64]: 0n,
  [IntegerType.I8]: -128n,
  [IntegerType.I16]: -32768n,
  [IntegerType.I32]: -2147483648n,
  [IntegerType.I64]: -9223372036854775808n,
  [IntegerType.USIZE]: 0n,
  [IntegerType.ISIZE]: -9223372036854775808n,
};

/**
 * Valeurs maximales pour les entiers
 */
export const INTEGER_MAX_VALUES: Record<IntegerType, bigint> = {
  [IntegerType.U8]: 255n,
  [IntegerType.U16]: 65535n,
  [IntegerType.U32]: 4294967295n,
  [IntegerType.U64]: 18446744073709551615n,
  [IntegerType.I8]: 127n,
  [IntegerType.I16]: 32767n,
  [IntegerType.I32]: 2147483647n,
  [IntegerType.I64]: 9223372036854775807n,
  [IntegerType.USIZE]: 18446744073709551615n,
  [IntegerType.ISIZE]: 9223372036854775807n,
};

/**
 * Classe de base pour les entiers
 */
export abstract class Integer {
  protected value: bigint;
  protected type: IntegerType;
  
  constructor(value: bigint | number | string, type: IntegerType) {
    this.type = type;
    this.value = this.parseValue(value, type);
    this.validate(value, type);
  }
  
  /**
   * Analyser une valeur
   */
  protected parseValue(value: bigint | number | string, type: IntegerType): bigint {
    if (typeof value === 'bigint') {
      return value;
    }
    
    if (typeof value === 'number') {
      return BigInt(value);
    }
    
    if (typeof value === 'string') {
      return BigInt(value);
    }
    
    return BigInt(0);
  }
  
  /**
   * Valider une valeur
   */
  protected validate(value: bigint | number | string, type: IntegerType): void {
    const bigValue = this.parseValue(value, type);
    const min = INTEGER_MIN_VALUES[type];
    const max = INTEGER_MAX_VALUES[type];
    
    if (bigValue < min || bigValue > max) {
      throw new MemoryException(
        `Value ${bigValue} out of range for ${type}: [${min}, ${max}]`
      );
    }
  }
  
  /**
   * Obtenir la valeur
   */
  getValue(): bigint {
    return this.value;
  }
  
  /**
   * Obtenir la valeur comme number
   */
  getNumberValue(): number {
    return Number(this.value);
  }
  
  /**
   * Obtenir le type
   */
  getType(): IntegerType {
    return this.type;
  }
  
  /**
   * Obtenir la taille en octets
   */
  getSize(): number {
    return INTEGER_SIZES[this.type];
  }
  
  /**
   * Verifier si la valeur est negative
   */
  isNegative(): boolean {
    return this.value < 0;
  }
  
  /**
   * Verifier si la valeur est positive
   */
  isPositive(): boolean {
    return this.value > 0;
  }
  
  /**
   * Verifier si la valeur est zero
   */
  isZero(): boolean {
    return this.value === 0n;
  }
  
  /**
   * Addition
   */
  abstract add(other: Integer): Integer;
  
  /**
   * Soustraction
   */
  abstract sub(other: Integer): Integer;
  
  /**
   * Multiplication
   */
  abstract mul(other: Integer): Integer;
  
  /**
   * Division
   */
  abstract div(other: Integer): Integer;
  
  /**
   * Modulo
   */
  abstract mod(other: Integer): Integer;
  
  /**
   * Negation
   */
  abstract neg(): Integer;
  
  /**
   * Incrementation
   */
  abstract inc(): Integer;
  
  /**
   * Decrementation
   */
  abstract dec(): Integer;
  
  /**
   * Comparaison
   */
  abstract compare(other: Integer): number;
  
  /**
   * Conversion en chaine
   */
  toString(): string {
    return this.value.toString();
  }
  
  /**
   * Conversion en JSON
   */
  toJSON(): { value: string; type: IntegerType } {
    return {
      value: this.value.toString(),
      type: this.type,
    };
  }
  
  /**
   * Verifier l'egalite
   */
  equals(other: Integer): boolean {
    return this.value === other.getValue();
  }
}

/**
 * Entier non signe 8 bits
 */
export class U8 extends Integer {
  constructor(value: bigint | number | string = 0) {
    super(value, IntegerType.U8);
  }
  
  add(other: Integer): U8 {
    return new U8(this.value + other.getValue());
  }
  
  sub(other: Integer): U8 {
    return new U8(this.value - other.getValue());
  }
  
  mul(other: Integer): U8 {
    return new U8(this.value * other.getValue());
  }
  
  div(other: Integer): U8 {
    return new U8(this.value / other.getValue());
  }
  
  mod(other: Integer): U8 {
    return new U8(this.value % other.getValue());
  }
  
  neg(): U8 {
    return new U8(-this.value);
  }
  
  inc(): U8 {
    return new U8(this.value + 1n);
  }
  
  dec(): U8 {
    return new U8(this.value - 1n);
  }
  
  compare(other: Integer): number {
    const otherValue = other.getValue();
    if (this.value < otherValue) return -1;
    if (this.value > otherValue) return 1;
    return 0;
  }
  
  /**
   * Conversion en number
   */
  toNumber(): number {
    return Number(this.value & 0xFFn);
  }
}

/**
 * Entier non signe 16 bits
 */
export class U16 extends Integer {
  constructor(value: bigint | number | string = 0) {
    super(value, IntegerType.U16);
  }
  
  add(other: Integer): U16 {
    return new U16(this.value + other.getValue());
  }
  
  sub(other: Integer): U16 {
    return new U16(this.value - other.getValue());
  }
  
  mul(other: Integer): U16 {
    return new U16(this.value * other.getValue());
  }
  
  div(other: Integer): U16 {
    return new U16(this.value / other.getValue());
  }
  
  mod(other: Integer): U16 {
    return new U16(this.value % other.getValue());
  }
  
  neg(): U16 {
    return new U16(-this.value);
  }
  
  inc(): U16 {
    return new U16(this.value + 1n);
  }
  
  dec(): U16 {
    return new U16(this.value - 1n);
  }
  
  compare(other: Integer): number {
    const otherValue = other.getValue();
    if (this.value < otherValue) return -1;
    if (this.value > otherValue) return 1;
    return 0;
  }
  
  toNumber(): number {
    return Number(this.value & 0xFFFFn);
  }
}

/**
 * Entier non signe 32 bits
 */
export class U32 extends Integer {
  constructor(value: bigint | number | string = 0) {
    super(value, IntegerType.U32);
  }
  
  add(other: Integer): U32 {
    return new U32(this.value + other.getValue());
  }
  
  sub(other: Integer): U32 {
    return new U32(this.value - other.getValue());
  }
  
  mul(other: Integer): U32 {
    return new U32(this.value * other.getValue());
  }
  
  div(other: Integer): U32 {
    return new U32(this.value / other.getValue());
  }
  
  mod(other: Integer): U32 {
    return new U32(this.value % other.getValue());
  }
  
  neg(): U32 {
    return new U32(-this.value);
  }
  
  inc(): U32 {
    return new U32(this.value + 1n);
  }
  
  dec(): U32 {
    return new U32(this.value - 1n);
  }
  
  compare(other: Integer): number {
    const otherValue = other.getValue();
    if (this.value < otherValue) return -1;
    if (this.value > otherValue) return 1;
    return 0;
  }
  
  toNumber(): number {
    return Number(this.value & 0xFFFFFFFFn);
  }
}

/**
 * Entier non signe 64 bits
 */
export class U64 extends Integer {
  constructor(value: bigint | number | string = 0) {
    super(value, IntegerType.U64);
  }
  
  add(other: Integer): U64 {
    return new U64(this.value + other.getValue());
  }
  
  sub(other: Integer): U64 {
    return new U64(this.value - other.getValue());
  }
  
  mul(other: Integer): U64 {
    return new U64(this.value * other.getValue());
  }
  
  div(other: Integer): U64 {
    return new U64(this.value / other.getValue());
  }
  
  mod(other: Integer): U64 {
    return new U64(this.value % other.getValue());
  }
  
  neg(): U64 {
    return new U64(-this.value);
  }
  
  inc(): U64 {
    return new U64(this.value + 1n);
  }
  
  dec(): U64 {
    return new U64(this.value - 1n);
  }
  
  compare(other: Integer): number {
    const otherValue = other.getValue();
    if (this.value < otherValue) return -1;
    if (this.value > otherValue) return 1;
    return 0;
  }
}

/**
 * Entier signe 8 bits
 */
export class I8 extends Integer {
  constructor(value: bigint | number | string = 0) {
    super(value, IntegerType.I8);
  }
  
  add(other: Integer): I8 {
    return new I8(this.value + other.getValue());
  }
  
  sub(other: Integer): I8 {
    return new I8(this.value - other.getValue());
  }
  
  mul(other: Integer): I8 {
    return new I8(this.value * other.getValue());
  }
  
  div(other: Integer): I8 {
    return new I8(this.value / other.getValue());
  }
  
  mod(other: Integer): I8 {
    return new I8(this.value % other.getValue());
  }
  
  neg(): I8 {
    return new I8(-this.value);
  }
  
  inc(): I8 {
    return new I8(this.value + 1n);
  }
  
  dec(): I8 {
    return new I8(this.value - 1n);
  }
  
  compare(other: Integer): number {
    const otherValue = other.getValue();
    if (this.value < otherValue) return -1;
    if (this.value > otherValue) return 1;
    return 0;
  }
  
  toNumber(): number {
    return Number(this.value);
  }
}

/**
 * Entier signe 16 bits
 */
export class I16 extends Integer {
  constructor(value: bigint | number | string = 0) {
    super(value, IntegerType.I16);
  }
  
  add(other: Integer): I16 {
    return new I16(this.value + other.getValue());
  }
  
  sub(other: Integer): I16 {
    return new I16(this.value - other.getValue());
  }
  
  mul(other: Integer): I16 {
    return new I16(this.value * other.getValue());
  }
  
  div(other: Integer): I16 {
    return new I16(this.value / other.getValue());
  }
  
  mod(other: Integer): I16 {
    return new I16(this.value % other.getValue());
  }
  
  neg(): I16 {
    return new I16(-this.value);
  }
  
  inc(): I16 {
    return new I16(this.value + 1n);
  }
  
  dec(): I16 {
    return new I16(this.value - 1n);
  }
  
  compare(other: Integer): number {
    const otherValue = other.getValue();
    if (this.value < otherValue) return -1;
    if (this.value > otherValue) return 1;
    return 0;
  }
  
  toNumber(): number {
    return Number(this.value);
  }
}

/**
 * Entier signe 32 bits
 */
export class I32 extends Integer {
  constructor(value: bigint | number | string = 0) {
    super(value, IntegerType.I32);
  }
  
  add(other: Integer): I32 {
    return new I32(this.value + other.getValue());
  }
  
  sub(other: Integer): I32 {
    return new I32(this.value - other.getValue());
  }
  
  mul(other: Integer): I32 {
    return new I32(this.value * other.getValue());
  }
  
  div(other: Integer): I32 {
    return new I32(this.value / other.getValue());
  }
  
  mod(other: Integer): I32 {
    return new I32(this.value % other.getValue());
  }
  
  neg(): I32 {
    return new I32(-this.value);
  }
  
  inc(): I32 {
    return new I32(this.value + 1n);
  }
  
  dec(): I32 {
    return new I32(this.value - 1n);
  }
  
  compare(other: Integer): number {
    const otherValue = other.getValue();
    if (this.value < otherValue) return -1;
    if (this.value > otherValue) return 1;
    return 0;
  }
  
  toNumber(): number {
    return Number(this.value);
  }
}

/**
 * Entier signe 64 bits
 */
export class I64 extends Integer {
  constructor(value: bigint | number | string = 0) {
    super(value, IntegerType.I64);
  }
  
  add(other: Integer): I64 {
    return new I64(this.value + other.getValue());
  }
  
  sub(other: Integer): I64 {
    return new I64(this.value - other.getValue());
  }
  
  mul(other: Integer): I64 {
    return new I64(this.value * other.getValue());
  }
  
  div(other: Integer): I64 {
    return new I64(this.value / other.getValue());
  }
  
  mod(other: Integer): I64 {
    return new I64(this.value % other.getValue());
  }
  
  neg(): I64 {
    return new I64(-this.value);
  }
  
  inc(): I64 {
    return new I64(this.value + 1n);
  }
  
  dec(): I64 {
    return new I64(this.value - 1n);
  }
  
  compare(other: Integer): number {
    const otherValue = other.getValue();
    if (this.value < otherValue) return -1;
    if (this.value > otherValue) return 1;
    return 0;
  }
}

/**
 * Fabrique d'entiers
 */
export class IntegerFactory {
  /**
   * Creer un entier a partir d'un type et d'une valeur
   */
  static create(type: IntegerType, value: bigint | number | string = 0): Integer {
    switch (type) {
      case IntegerType.U8:
        return new U8(value);
      case IntegerType.U16:
        return new U16(value);
      case IntegerType.U32:
        return new U32(value);
      case IntegerType.U64:
        return new U64(value);
      case IntegerType.I8:
        return new I8(value);
      case IntegerType.I16:
        return new I16(value);
      case IntegerType.I32:
        return new I32(value);
      case IntegerType.I64:
        return new I64(value);
      case IntegerType.USIZE:
        return new U64(value);
      case IntegerType.ISIZE:
        return new I64(value);
      default:
        throw new MemoryException(`Unknown integer type: ${type}`);
    }
  }
  
  /**
   * Creer un entier U8
   */
  static u8(value: bigint | number | string = 0): U8 {
    return new U8(value);
  }
  
  /**
   * Creer un entier U16
   */
  static u16(value: bigint | number | string = 0): U16 {
    return new U16(value);
  }
  
  /**
   * Creer un entier U32
   */
  static u32(value: bigint | number | string = 0): U32 {
    return new U32(value);
  }
  
  /**
   * Creer un entier U64
   */
  static u64(value: bigint | number | string = 0): U64 {
    return new U64(value);
  }
  
  /**
   * Creer un entier I8
   */
  static i8(value: bigint | number | string = 0): I8 {
    return new I8(value);
  }
  
  /**
   * Creer un entier I16
   */
  static i16(value: bigint | number | string = 0): I16 {
    return new I16(value);
  }
  
  /**
   * Creer un entier I32
   */
  static i32(value: bigint | number | string = 0): I32 {
    return new I32(value);
  }
  
  /**
   * Creer un entier I64
   */
  static i64(value: bigint | number | string = 0): I64 {
    return new I64(value);
  }
  
  /**
   * Creer un entier USIZE
   */
  static usize(value: bigint | number | string = 0): U64 {
    return new U64(value);
  }
  
  /**
   * Creer un entier ISIZE
   */
  static isize(value: bigint | number | string = 0): I64 {
    return new I64(value);
  }
}

/**
 * Utilitaires pour les entiers
 */
export namespace IntegerUtils {
  /**
   * Verifier si une valeur est un entier valide pour un type donne
   */
  export function isValid(value: bigint | number | string, type: IntegerType): boolean {
    try {
      IntegerFactory.create(type, value);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Obtenir la valeur minimale pour un type
   */
  export function getMin(type: IntegerType): bigint {
    return INTEGER_MIN_VALUES[type];
  }
  
  /**
   * Obtenir la valeur maximale pour un type
   */
  export function getMax(type: IntegerType): bigint {
    return INTEGER_MAX_VALUES[type];
  }
  
  /**
   * Obtenir la taille pour un type
   */
  export function getSize(type: IntegerType): number {
    return INTEGER_SIZES[type];
  }
  
  /**
   * Convertir un entier en un autre type
   */
  export function convert(value: Integer, targetType: IntegerType): Integer {
    return IntegerFactory.create(targetType, value.getValue());
  }
}

/**
 * Exporter les classes
 */
export {
  U8,
  U16,
  U32,
  U64,
  I8,
  I16,
  I32,
  I64,
  IntegerFactory,
  IntegerUtils,
};
