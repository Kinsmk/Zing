/**
 * Zinga Runtime - Floating Point Value Types
 * 
 * Implements IEEE 754 floating point types (F32, F64) with arithmetic operations,
 * comparisons, and type validation.
 */

import { Value, ValueType } from './integers';

/**
 * Base class for floating point values
 */
export abstract class Float extends Value {
  protected value: number;

  constructor(value: number | string, type: ValueType) {
    super(type);
    this.value = this.parseValue(value);
    this.validate();
  }

  protected parseValue(input: number | string): number {
    if (typeof input === 'string') {
      const parsed = parseFloat(input);
      if (isNaN(parsed)) {
        throw new Error(`Invalid float value: ${input}`);
      }
      return parsed;
    }
    return input;
  }

  protected validate(): void {
    if (isNaN(this.value)) {
      throw new Error('Float value cannot be NaN');
    }
    if (!isFinite(this.value)) {
      throw new Error('Float value cannot be Infinity');
    }
  }

  getValue(): number {
    return this.value;
  }

  toString(): string {
    return this.value.toString();
  }

  toJSON(): number {
    return this.value;
  }

  equals(other: Float): boolean {
    return this.value === other.getValue();
  }

  // Arithmetic operations
  abstract add(other: Float): Float;
  abstract subtract(other: Float): Float;
  abstract multiply(other: Float): Float;
  abstract divide(other: Float): Float;
  abstract modulo(other: Float): Float;

  // Comparison operations
  lessThan(other: Float): boolean {
    return this.value < other.getValue();
  }

  lessThanOrEqual(other: Float): boolean {
    return this.value <= other.getValue();
  }

  greaterThan(other: Float): boolean {
    return this.value > other.getValue();
  }

  greaterThanOrEqual(other: Float): boolean {
    return this.value >= other.getValue();
  }

  // Math operations
  abs(): Float {
    return this.create(Math.abs(this.value));
  }

  negate(): Float {
    return this.create(-this.value);
  }

  sqrt(): Float {
    return this.create(Math.sqrt(this.value));
  }

  pow(exponent: Float): Float {
    return this.create(Math.pow(this.value, exponent.getValue()));
  }

  // Trigonometric operations
  sin(): Float {
    return this.create(Math.sin(this.value));
  }

  cos(): Float {
    return this.create(Math.cos(this.value));
  }

  tan(): Float {
    return this.create(Math.tan(this.value));
  }

  // Conversion operations
  toInt(): number {
    return Math.trunc(this.value);
  }

  floor(): Float {
    return this.create(Math.floor(this.value));
  }

  ceil(): Float {
    return this.create(Math.ceil(this.value));
  }

  round(): Float {
    return this.create(Math.round(this.value));
  }

  // Type checking
  isNaN(): boolean {
    return isNaN(this.value);
  }

  isInfinite(): boolean {
    return !isFinite(this.value);
  }

  isFinite(): boolean {
    return isFinite(this.value);
  }

  // Factory method to be implemented by subclasses
  protected abstract create(value: number): Float;
}

/**
 * 32-bit floating point number (IEEE 754 single precision)
 */
export class F32 extends Float {
  constructor(value: number | string = 0) {
    super(value, ValueType.F32);
  }

  protected create(value: number): F32 {
    return new F32(value);
  }

  add(other: Float): F32 {
    return new F32(this.value + other.getValue());
  }

  subtract(other: Float): F32 {
    return new F32(this.value - other.getValue());
  }

  multiply(other: Float): F32 {
    return new F32(this.value * other.getValue());
  }

  divide(other: Float): F32 {
    const divisor = other.getValue();
    if (divisor === 0) {
      throw new Error('Division by zero');
    }
    return new F32(this.value / divisor);
  }

  modulo(other: Float): F32 {
    const divisor = other.getValue();
    if (divisor === 0) {
      throw new Error('Modulo by zero');
    }
    return new F32(this.value % divisor);
  }

  // F32-specific operations
  toF64(): F64 {
    return new F64(this.value);
  }

  static readonly MIN_VALUE: number = -3.4028234663852886e+38;
  static readonly MAX_VALUE: number = 3.4028234663852886e+38;
  static readonly EPSILON: number = 1.1920928955078125e-07;
}

/**
 * 64-bit floating point number (IEEE 754 double precision)
 */
export class F64 extends Float {
  constructor(value: number | string = 0) {
    super(value, ValueType.F64);
  }

  protected create(value: number): F64 {
    return new F64(value);
  }

  add(other: Float): F64 {
    return new F64(this.value + other.getValue());
  }

  subtract(other: Float): F64 {
    return new F64(this.value - other.getValue());
  }

  multiply(other: Float): F64 {
    return new F64(this.value * other.getValue());
  }

  divide(other: Float): F64 {
    const divisor = other.getValue();
    if (divisor === 0) {
      throw new Error('Division by zero');
    }
    return new F64(this.value / divisor);
  }

  modulo(other: Float): F64 {
    const divisor = other.getValue();
    if (divisor === 0) {
      throw new Error('Modulo by zero');
    }
    return new F64(this.value % divisor);
  }

  // F64-specific operations
  toF32(): F32 {
    return new F32(this.value);
  }

  static readonly MIN_VALUE: number = -1.7976931348623157e+308;
  static readonly MAX_VALUE: number = 1.7976931348623157e+308;
  static readonly EPSILON: number = 2.220446049250313e-16;
}

/**
 * Float type utility functions
 */
export const FloatUtils = {
  // Check if a value is a valid F32
  isF32(value: number): boolean {
    return value >= F32.MIN_VALUE && value <= F32.MAX_VALUE;
  },

  // Check if a value is a valid F64
  isF64(value: number): boolean {
    return value >= F64.MIN_VALUE && value <= F64.MAX_VALUE;
  },

  // Parse a string to F32
  parseF32(input: string): F32 {
    return new F32(input);
  },

  // Parse a string to F64
  parseF64(input: string): F64 {
    return new F64(input);
  },

  // Convert F32 to F64
  toF64(float: F32): F64 {
    return float.toF64();
  },

  // Convert F64 to F32 (with precision loss warning)
  toF32(float: F64): F32 {
    const value = float.getValue();
    if (value < F32.MIN_VALUE || value > F32.MAX_VALUE) {
      console.warn('Precision loss: F64 value out of F32 range');
    }
    return float.toF32();
  }
};

// Extend ValueType enum
export enum ValueType {
  U8 = 'U8',
  U16 = 'U16',
  U32 = 'U32',
  U64 = 'U64',
  I8 = 'I8',
  I16 = 'I16',
  I32 = 'I32',
  I64 = 'I64',
  F32 = 'F32',
  F64 = 'F64',
  BOOL = 'BOOL',
  STRING = 'STRING',
  ARRAY = 'ARRAY',
  MAP = 'MAP',
  SET = 'SET',
  OBJECT = 'OBJECT',
  NULL = 'NULL',
  UNDEFINED = 'UNDEFINED'
}

export type FloatValue = F32 | F64;
