/**
 * Zinga Runtime - Object/Struct Value Type
 * 
 * Implements object/struct type with properties, methods, and dynamic behavior.
 */

import { Value, ValueType } from './integers';
import { ZString } from './strings';
import { ZArray } from './arrays';
import { ZMap } from './maps';

/**
 * Property descriptor for object properties
 */
export interface PropertyDescriptor {
  value?: Value;
  get?: () => Value;
  set?: (value: Value) => void;
  enumerable?: boolean;
  configurable?: boolean;
  writable?: boolean;
}

/**
 * Object value implementation - dynamic object with properties and methods
 */
export class ZObject extends Value {
  private properties: Map<string, PropertyDescriptor>;
  private prototype: ZObject | null;
  private className: string;

  constructor(prototype: ZObject | null = null, className: string = 'Object') {
    super(ValueType.OBJECT);
    this.properties = new Map();
    this.prototype = prototype;
    this.className = className;
  }

  getClassName(): string {
    return this.className;
  }

  getPrototype(): ZObject | null {
    return this.prototype;
  }

  setPrototype(prototype: ZObject | null): void {
    this.prototype = prototype;
  }

  // Property access
  hasProperty(key: string): boolean {
    return this.properties.has(key) || 
      (this.prototype ? this.prototype.hasProperty(key) : false);
  }

  getProperty(key: string): Value | undefined {
    const descriptor = this.properties.get(key);
    if (descriptor) {
      if (descriptor.get) {
        return descriptor.get();
      }
      return descriptor.value;
    }
    if (this.prototype) {
      return this.prototype.getProperty(key);
    }
    return undefined;
  }

  setProperty(key: string, value: Value | PropertyDescriptor): void {
    if (value instanceof Value || typeof value !== 'object') {
      this.properties.set(key, { value, enumerable: true, writable: true, configurable: true });
    } else {
      this.properties.set(key, value);
    }
  }

  defineProperty(key: string, descriptor: PropertyDescriptor): void {
    this.properties.set(key, descriptor);
  }

  deleteProperty(key: string): boolean {
    const descriptor = this.properties.get(key);
    if (descriptor && descriptor.configurable !== false) {
      this.properties.delete(key);
      return true;
    }
    return false;
  }

  // Property enumeration
  getOwnPropertyNames(): ZArray<ZString> {
    const names = [...this.properties.keys()];
    return new ZArray(names.map(name => new ZString(name)));
  }

  getPropertyNames(): ZArray<ZString> {
    const names = [...this.properties.keys()];
    if (this.prototype) {
      const protoNames = this.prototype.getPropertyNames().getValue();
      for (const name of protoNames) {
        if (!names.includes(name.getValue())) {
          names.push(name.getValue());
        }
      }
    }
    return new ZArray(names.map(name => new ZString(name)));
  }

  getOwnEnumerablePropertyNames(): ZArray<ZString> {
    const names: string[] = [];
    for (const [key, descriptor] of this.properties) {
      if (descriptor.enumerable !== false) {
        names.push(key);
      }
    }
    return new ZArray(names.map(name => new ZString(name)));
  }

  // Object manipulation
  assign(other: ZObject): this {
    for (const [key, descriptor] of other.properties) {
      if (descriptor.enumerable !== false) {
        if (descriptor.get) {
          this.setProperty(key, descriptor.get());
        } else if (descriptor.value) {
          this.setProperty(key, descriptor.value);
        }
      }
    }
    return this;
  }

  merge(...objects: ZObject[]): ZObject {
    const result = new ZObject(this.prototype, this.className);
    // Copy own properties
    for (const [key, descriptor] of this.properties) {
      result.properties.set(key, { ...descriptor });
    }
    // Merge with others
    for (const obj of objects) {
      for (const [key, descriptor] of obj.properties) {
        if (descriptor.enumerable !== false) {
          result.properties.set(key, { ...descriptor });
        }
      }
    }
    return result;
  }

  // Method invocation
  invokeMethod(methodName: string, args: Value[] = []): Value {
    const method = this.getProperty(methodName);
    if (method && method instanceof ZFunction) {
      return method.call(this, ...args);
    }
    throw new Error(`Method ${methodName} not found`);
  }

  // Conversion
  toString(): string {
    const entries: string[] = [];
    for (const [key, descriptor] of this.properties) {
      if (descriptor.enumerable !== false) {
        let value: Value | undefined;
        if (descriptor.get) {
          value = descriptor.get();
        } else {
          value = descriptor.value;
        }
        if (value) {
          entries.push(`${key}: ${value.toString()}`);
        }
      }
    }
    return `{${entries.join(', ')}}`;
  }

  toJSON(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, descriptor] of this.properties) {
      if (descriptor.enumerable !== false) {
        let value: Value | undefined;
        if (descriptor.get) {
          value = descriptor.get();
        } else {
          value = descriptor.value;
        }
        if (value) {
          result[key] = value.toJSON();
        }
      }
    }
    return result;
  }

  // Copy
  clone(): ZObject {
    const result = new ZObject(this.prototype, this.className);
    for (const [key, descriptor] of this.properties) {
      result.properties.set(key, { ...descriptor });
    }
    return result;
  }

  // Freeze and seal
  freeze(): ZObject {
    const result = this.clone();
    for (const [key, descriptor] of result.properties) {
      result.properties.set(key, { 
        ...descriptor, 
        configurable: false,
        writable: false 
      });
    }
    return result;
  }

  seal(): ZObject {
    const result = this.clone();
    for (const [key, descriptor] of result.properties) {
      result.properties.set(key, { 
        ...descriptor, 
        configurable: false 
      });
    }
    return result;
  }

  // Iteration
  [Symbol.iterator](): IterableIterator<[string, Value]> {
    const object = this;
    const keys = [...this.properties.keys()].filter(key => 
      this.properties.get(key)?.enumerable !== false
    );
    let index = 0;
    return {
      next(): IteratorResult<[string, Value]> {
        if (index < keys.length) {
          const key = keys[index++];
          const descriptor = object.properties.get(key)!;
          let value: Value;
          if (descriptor.get) {
            value = descriptor.get();
          } else {
            value = descriptor.value!;
          }
          return { value: [key, value], done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }

  // Static utilities
  static create(className: string = 'Object'): ZObject {
    return new ZObject(null, className);
  }

  static fromJSON(json: Record<string, any>, className: string = 'Object'): ZObject {
    const obj = new ZObject(null, className);
    for (const [key, value] of Object.entries(json)) {
      obj.setProperty(key, ZObject.valueToValue(value));
    }
    return obj;
  }

  static isObject(value: any): value is ZObject {
    return value instanceof ZObject;
  }

  // Internal helper to convert JSON to Value
  private static valueToValue(value: any): Value {
    if (value === null) {
      return new ZNull();
    }
    if (typeof value === 'boolean') {
      return new ZBoolean(value);
    }
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return new (require('./integers').I64)(value);
      }
      return new (require('./floats').F64)(value);
    }
    if (typeof value === 'string') {
      return new ZString(value);
    }
    if (Array.isArray(value)) {
      return new ZArray(value.map(v => ZObject.valueToValue(v)));
    }
    if (typeof value === 'object') {
      return ZObject.fromJSON(value);
    }
    return new ZNull();
  }
}

/**
 * Function value implementation
 */
export class ZFunction extends Value {
  private name: string;
  private parameters: string[];
  private body: (...args: Value[]) => Value;
  private thisArg: ZObject | null;

  constructor(
    name: string,
    parameters: string[],
    body: (...args: Value[]) => Value,
    thisArg: ZObject | null = null
  ) {
    super(ValueType.OBJECT); // Functions are objects
    this.name = name;
    this.parameters = parameters;
    this.body = body;
    this.thisArg = thisArg;
  }

  getName(): string {
    return this.name;
  }

  getParameters(): string[] {
    return [...this.parameters];
  }

  call(thisArg: ZObject | null, ...args: Value[]): Value {
    const previousThis = this.thisArg;
    this.thisArg = thisArg;
    try {
      return this.body(...args);
    } finally {
      this.thisArg = previousThis;
    }
  }

  apply(thisArg: ZObject | null, args: Value[]): Value {
    return this.call(thisArg, ...args);
  }

  bind(thisArg: ZObject): ZFunction {
    return new ZFunction(this.name, this.parameters, this.body, thisArg);
  }

  toString(): string {
    return `[Function: ${this.name}]`;
  }

  toJSON(): string {
    return `[Function: ${this.name}]`;
  }

  static isFunction(value: any): value is ZFunction {
    return value instanceof ZFunction;
  }
}

/**
 * Null value implementation
 */
export class ZNull extends Value {
  constructor() {
    super(ValueType.NULL);
  }

  toString(): string {
    return 'null';
  }

  toJSON(): null {
    return null;
  }

  static readonly INSTANCE: ZNull = new ZNull();

  static isNull(value: any): value is ZNull {
    return value instanceof ZNull;
  }
}

/**
 * Boolean value implementation
 */
export class ZBoolean extends Value {
  private value: boolean;

  constructor(value: boolean = false) {
    super(ValueType.BOOL);
    this.value = value;
  }

  getValue(): boolean {
    return this.value;
  }

  toString(): string {
    return this.value.toString();
  }

  toJSON(): boolean {
    return this.value;
  }

  static readonly TRUE: ZBoolean = new ZBoolean(true);
  static readonly FALSE: ZBoolean = new ZBoolean(false);

  static isBoolean(value: any): value is ZBoolean {
    return value instanceof ZBoolean;
  }
}

/**
 * Undefined value implementation
 */
export class ZUndefined extends Value {
  constructor() {
    super(ValueType.UNDEFINED);
  }

  toString(): string {
    return 'undefined';
  }

  toJSON(): undefined {
    return undefined;
  }

  static readonly INSTANCE: ZUndefined = new ZUndefined();

  static isUndefined(value: any): value is ZUndefined {
    return value instanceof ZUndefined;
  }
}

export type ObjectValue = ZObject | ZFunction | ZNull | ZBoolean | ZUndefined;
