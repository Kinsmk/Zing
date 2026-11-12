/**
 * Zinga Runtime - Array Value Type
 * 
 * Implements dynamic array type with comprehensive operations,
 * including iteration, manipulation, and functional programming methods.
 */

import { Value, ValueType } from './integers';
import { ZString } from './strings';
import { F32, F64 } from './floats';

/**
 * Array value implementation - dynamic typed array
 */
export class ZArray<T = Value> extends Value {
  private elements: T[];
  private capacity: number;

  constructor(elements: T[] = [], capacity: number = 16) {
    super(ValueType.ARRAY);
    this.elements = [...elements];
    this.capacity = Math.max(capacity, this.elements.length);
  }

  getValue(): T[] {
    return [...this.elements];
  }

  getLength(): number {
    return this.elements.length;
  }

  getCapacity(): number {
    return this.capacity;
  }

  isEmpty(): boolean {
    return this.elements.length === 0;
  }

  // Element access
  get(index: number): T {
    this.checkBounds(index);
    return this.elements[index];
  }

  set(index: number, value: T): void {
    this.checkBounds(index);
    this.elements[index] = value;
  }

  first(): T | undefined {
    return this.elements[0];
  }

  last(): T | undefined {
    return this.elements[this.elements.length - 1];
  }

  at(index: number): T | undefined {
    const normalized = index < 0 ? this.elements.length + index : index;
    return this.elements[normalized];
  }

  // Array manipulation
  push(...items: T[]): number {
    this.ensureCapacity(this.elements.length + items.length);
    this.elements.push(...items);
    return this.elements.length;
  }

  pop(): T | undefined {
    return this.elements.pop();
  }

  unshift(...items: T[]): number {
    this.ensureCapacity(this.elements.length + items.length);
    this.elements.unshift(...items);
    return this.elements.length;
  }

  shift(): T | undefined {
    return this.elements.shift();
  }

  insert(index: number, ...items: T[]): void {
    this.checkBounds(index, true);
    this.ensureCapacity(this.elements.length + items.length);
    this.elements.splice(index, 0, ...items);
  }

  remove(index: number, count: number = 1): T[] {
    this.checkBounds(index);
    return this.elements.splice(index, count);
  }

  // Slicing
  slice(start: number, end?: number): ZArray<T> {
    const result = this.elements.slice(start, end);
    return new ZArray(result, result.length);
  }

  // Concatenation
  concat(other: ZArray<T>): ZArray<T> {
    return new ZArray([...this.elements, ...other.getValue()], this.elements.length + other.getLength());
  }

  // Search
  includes(value: T): boolean {
    return this.elements.includes(value);
  }

  indexOf(value: T): number {
    return this.elements.indexOf(value);
  }

  lastIndexOf(value: T): number {
    return this.elements.lastIndexOf(value);
  }

  find(predicate: (value: T, index: number, array: ZArray<T>) => boolean): T | undefined {
    for (let i = 0; i < this.elements.length; i++) {
      if (predicate(this.elements[i], i, this)) {
        return this.elements[i];
      }
    }
    return undefined;
  }

  findIndex(predicate: (value: T, index: number, array: ZArray<T>) => boolean): number {
    for (let i = 0; i < this.elements.length; i++) {
      if (predicate(this.elements[i], i, this)) {
        return i;
      }
    }
    return -1;
  }

  // Filtering
  filter(predicate: (value: T, index: number, array: ZArray<T>) => boolean): ZArray<T> {
    const result = this.elements.filter((value, index) => predicate(value, index, this));
    return new ZArray(result, result.length);
  }

  // Mapping
  map<U>(callback: (value: T, index: number, array: ZArray<T>) => U): ZArray<U> {
    const result = this.elements.map((value, index) => callback(value, index, this));
    return new ZArray(result, result.length);
  }

  // Reduction
  reduce<U>(callback: (accumulator: U, value: T, index: number, array: ZArray<T>) => U, initialValue: U): U {
    return this.elements.reduce((acc, value, index) => callback(acc, value, index, this), initialValue);
  }

  reduceRight<U>(callback: (accumulator: U, value: T, index: number, array: ZArray<T>) => U, initialValue: U): U {
    return this.elements.reduceRight((acc, value, index) => callback(acc, value, index, this), initialValue);
  }

  // Transformation
  reverse(): ZArray<T> {
    return new ZArray([...this.elements].reverse(), this.elements.length);
  }

  sort(compareFn?: (a: T, b: T) => number): ZArray<T> {
    const sorted = [...this.elements];
    if (compareFn) {
      sorted.sort(compareFn);
    } else {
      sorted.sort();
    }
    return new ZArray(sorted, sorted.length);
  }

  // Aggregation
  forEach(callback: (value: T, index: number, array: ZArray<T>) => void): void {
    this.elements.forEach((value, index) => callback(value, index, this));
  }

  some(predicate: (value: T, index: number, array: ZArray<T>) => boolean): boolean {
    return this.elements.some((value, index) => predicate(value, index, this));
  }

  every(predicate: (value: T, index: number, array: ZArray<T>) => boolean): boolean {
    return this.elements.every((value, index) => predicate(value, index, this));
  }

  // Joining
  join(separator: string = ','): ZString {
    return new ZString(this.elements.map(e => 
      e instanceof Value ? e.toString() : String(e)
    ).join(separator));
  }

  // Conversion
  toString(): string {
    return `[${this.elements.map(e => 
      e instanceof Value ? e.toString() : String(e)
    ).join(', ')}]`;
  }

  toJSON(): T[] {
    return this.elements.map(e => 
      e instanceof Value ? e.toJSON() : e
    );
  }

  // Type-safe operations
  static of<T>(...elements: T[]): ZArray<T> {
    return new ZArray(elements, elements.length);
  }

  static from<T>(iterable: Iterable<T>): ZArray<T> {
    return new ZArray(Array.from(iterable));
  }

  static range(start: number, end: number, step: number = 1): ZArray<number> {
    const length = Math.ceil((end - start) / step);
    const elements = Array.from({ length }, (_, i) => start + i * step);
    return new ZArray(elements, length);
  }

  static fill<T>(value: T, length: number): ZArray<T> {
    return new ZArray(Array(length).fill(value), length);
  }

  // Utility methods
  clear(): void {
    this.elements = [];
  }

  copy(): ZArray<T> {
    return new ZArray([...this.elements], this.capacity);
  }

  resize(newSize: number, fillValue?: T): void {
    if (newSize > this.elements.length) {
      this.ensureCapacity(newSize);
      while (this.elements.length < newSize) {
        this.elements.push(fillValue!);
      }
    } else {
      this.elements.length = newSize;
    }
  }

  // Internal methods
  private checkBounds(index: number, allowEnd: boolean = false): void {
    const max = allowEnd ? this.elements.length : this.elements.length - 1;
    if (index < 0 || index > max) {
      throw new Error(`Index ${index} out of bounds for array of length ${this.elements.length}`);
    }
  }

  private ensureCapacity(required: number): void {
    if (required > this.capacity) {
      this.capacity = Math.max(this.capacity * 2, required);
    }
  }

  // Iteration
  [Symbol.iterator](): IterableIterator<T> {
    let index = 0;
    const elements = this.elements;
    return {
      next(): IteratorResult<T> {
        if (index < elements.length) {
          return { value: elements[index++], done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }

  // Static type utilities
  static isArray(value: any): value is ZArray<any> {
    return value instanceof ZArray;
  }
}

// Typed array implementations
export class Int8ArrayValue extends ZArray<number> {
  constructor(length: number = 0) {
    super(new Array(length).fill(0), length);
  }
}

export class Uint8ArrayValue extends ZArray<number> {
  constructor(length: number = 0) {
    super(new Array(length).fill(0), length);
  }
}

export class Int16ArrayValue extends ZArray<number> {
  constructor(length: number = 0) {
    super(new Array(length).fill(0), length);
  }
}

export class Uint16ArrayValue extends ZArray<number> {
  constructor(length: number = 0) {
    super(new Array(length).fill(0), length);
  }
}

export class Int32ArrayValue extends ZArray<number> {
  constructor(length: number = 0) {
    super(new Array(length).fill(0), length);
  }
}

export class Uint32ArrayValue extends ZArray<number> {
  constructor(length: number = 0) {
    super(new Array(length).fill(0), length);
  }
}

export class Float32ArrayValue extends ZArray<number> {
  constructor(length: number = 0) {
    super(new Array(length).fill(0), length);
  }
}

export class Float64ArrayValue extends ZArray<number> {
  constructor(length: number = 0) {
    super(new Array(length).fill(0), length);
  }
}

export type ArrayValue = ZArray<Value>;
