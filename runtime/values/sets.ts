/**
 * Zinga Runtime - Set Value Type
 * 
 * Implements set data structure with comprehensive operations,
 * including union, intersection, difference, and subset operations.
 */

import { Value, ValueType } from './integers';
import { ZArray } from './arrays';

/**
 * Set value implementation - unique element collection
 */
export class ZSet<T = Value> extends Value {
  private elements: Set<T>;
  private insertionOrder: T[];

  constructor(elements?: Iterable<T>) {
    super(ValueType.SET);
    this.elements = new Set<T>(elements);
    this.insertionOrder = [];
    
    if (elements) {
      for (const element of elements) {
        if (!this.elements.has(this.normalizeElement(element))) {
          this.insertionOrder.push(element);
        }
      }
    }
  }

  get size(): number {
    return this.elements.size;
  }

  isEmpty(): boolean {
    return this.elements.size === 0;
  }

  // Element operations
  has(element: T): boolean {
    return this.elements.has(this.normalizeElement(element));
  }

  add(element: T): this {
    const normalized = this.normalizeElement(element);
    if (!this.elements.has(normalized)) {
      this.elements.add(normalized);
      this.insertionOrder.push(element);
    }
    return this;
  }

  addAll(elements: Iterable<T>): this {
    for (const element of elements) {
      this.add(element);
    }
    return this;
  }

  delete(element: T): boolean {
    const normalized = this.normalizeElement(element);
    const index = this.insertionOrder.findIndex(e => 
      this.normalizeElement(e) === normalized
    );
    if (index !== -1) {
      this.insertionOrder.splice(index, 1);
    }
    return this.elements.delete(normalized);
  }

  deleteAll(elements: Iterable<T>): this {
    for (const element of elements) {
      this.delete(element);
    }
    return this;
  }

  clear(): void {
    this.elements.clear();
    this.insertionOrder = [];
  }

  // Set operations
  union(other: ZSet<T>): ZSet<T> {
    const result = new ZSet<T>(this.elements);
    for (const element of other.elements) {
      result.add(element);
    }
    return result;
  }

  intersection(other: ZSet<T>): ZSet<T> {
    const result = new ZSet<T>();
    for (const element of this.elements) {
      if (other.has(element)) {
        result.add(element);
      }
    }
    return result;
  }

  difference(other: ZSet<T>): ZSet<T> {
    const result = new ZSet<T>();
    for (const element of this.elements) {
      if (!other.has(element)) {
        result.add(element);
      }
    }
    return result;
  }

  symmetricDifference(other: ZSet<T>): ZSet<T> {
    const result = new ZSet<T>();
    for (const element of this.elements) {
      if (!other.has(element)) {
        result.add(element);
      }
    }
    for (const element of other.elements) {
      if (!this.has(element)) {
        result.add(element);
      }
    }
    return result;
  }

  isSubsetOf(other: ZSet<T>): boolean {
    for (const element of this.elements) {
      if (!other.has(element)) {
        return false;
      }
    }
    return true;
  }

  isSupersetOf(other: ZSet<T>): boolean {
    return other.isSubsetOf(this);
  }

  isDisjointFrom(other: ZSet<T>): boolean {
    for (const element of this.elements) {
      if (other.has(element)) {
        return false;
      }
    }
    return true;
  }

  // Conversion
  toArray(): ZArray<T> {
    return new ZArray([...this.insertionOrder]);
  }

  toString(): string {
    const elements = this.insertionOrder.map(e => 
      e instanceof Value ? e.toString() : String(e)
    );
    return `{${elements.join(', ')}}`;
  }

  toJSON(): T[] {
    return this.insertionOrder.map(e => 
      e instanceof Value ? e.toJSON() : e
    );
  }

  // Iteration
  forEach(callback: (value: T, set: ZSet<T>) => void): void {
    for (const element of this.insertionOrder) {
      callback(element, this);
    }
  }

  // Filtering
  filter(predicate: (value: T, set: ZSet<T>) => boolean): ZSet<T> {
    const result = new ZSet<T>();
    for (const element of this.insertionOrder) {
      if (predicate(element, this)) {
        result.add(element);
      }
    }
    return result;
  }

  // Mapping
  map<U>(callback: (value: T, set: ZSet<T>) => U): ZSet<U> {
    const result = new ZSet<U>();
    for (const element of this.insertionOrder) {
      result.add(callback(element, this));
    }
    return result;
  }

  // Reduction
  reduce<U>(callback: (accumulator: U, value: T, set: ZSet<T>) => U, initialValue: U): U {
    let accumulator = initialValue;
    for (const element of this.insertionOrder) {
      accumulator = callback(accumulator, element, this);
    }
    return accumulator;
  }

  // Search
  find(predicate: (value: T, set: ZSet<T>) => boolean): T | undefined {
    for (const element of this.insertionOrder) {
      if (predicate(element, this)) {
        return element;
      }
    }
    return undefined;
  }

  some(predicate: (value: T, set: ZSet<T>) => boolean): boolean {
    return this.insertionOrder.some(element => predicate(element, this));
  }

  every(predicate: (value: T, set: ZSet<T>) => boolean): boolean {
    return this.insertionOrder.every(element => predicate(element, this));
  }

  // Copy
  copy(): ZSet<T> {
    return new ZSet<T>(this.elements);
  }

  // Static utilities
  static of<T>(elements?: Iterable<T>): ZSet<T> {
    return new ZSet<T>(elements);
  }

  static from<T>(iterable: Iterable<T>): ZSet<T> {
    return new ZSet<T>(iterable);
  }

  static fromArray<T>(array: T[]): ZSet<T> {
    return new ZSet<T>(array);
  }

  static isSet(value: any): value is ZSet<any> {
    return value instanceof ZSet;
  }

  // Iteration
  [Symbol.iterator](): IterableIterator<T> {
    let index = 0;
    const elements = this.insertionOrder;
    return {
      next(): IteratorResult<T> {
        if (index < elements.length) {
          return { value: elements[index++], done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }

  // Internal methods
  private normalizeElement(element: T): T {
    if (element instanceof Value) {
      return element.toString() as any as T;
    }
    return element;
  }
}

// WeakSet implementation (for garbage-collected elements)
export class WeakZSet<T extends object = object> {
  private weakSet: WeakSet<T>;

  constructor(elements?: Iterable<T>) {
    this.weakSet = new WeakSet<T>(elements);
  }

  has(element: T): boolean {
    return this.weakSet.has(element);
  }

  add(element: T): this {
    this.weakSet.add(element);
    return this;
  }

  delete(element: T): boolean {
    return this.weakSet.delete(element);
  }

  static isWeakSet(value: any): value is WeakZSet<any> {
    return value instanceof WeakZSet;
  }
}

export type SetValue = ZSet<Value>;
