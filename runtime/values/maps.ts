/**
 * Zinga Runtime - Map/Dictionary Value Type
 * 
 * Implements key-value pair storage with comprehensive operations,
 * including iteration, manipulation, and lookup methods.
 */

import { Value, ValueType } from './integers';
import { ZString } from './strings';
import { ZArray } from './arrays';

/**
 * Map entry interface
 */
export interface MapEntry<K, V> {
  key: K;
  value: V;
}

/**
 * Map value implementation - key-value storage
 */
export class ZMap<K = string | number | Value, V = Value> extends Value {
  private entries: Map<K, V>;
  private insertionOrder: K[];

  constructor(entries?: Iterable<[K, V]>) {
    super(ValueType.MAP);
    this.entries = new Map<K, V>(entries);
    this.insertionOrder = [];
    
    // Track insertion order
    if (entries) {
      for (const [key] of entries) {
        this.insertionOrder.push(key);
      }
    }
  }

  get size(): number {
    return this.entries.size;
  }

  isEmpty(): boolean {
    return this.entries.size === 0;
  }

  // Key operations
  has(key: K): boolean {
    return this.entries.has(this.normalizeKey(key));
  }

  get(key: K): V | undefined {
    return this.entries.get(this.normalizeKey(key));
  }

  getOrDefault(key: K, defaultValue: V): V {
    const normalized = this.normalizeKey(key);
    return this.entries.has(normalized) ? this.entries.get(normalized)! : defaultValue;
  }

  set(key: K, value: V): this {
    const normalized = this.normalizeKey(key);
    if (!this.entries.has(normalized)) {
      this.insertionOrder.push(key);
    }
    this.entries.set(normalized, value);
    return this;
  }

  delete(key: K): boolean {
    const normalized = this.normalizeKey(key);
    const index = this.insertionOrder.indexOf(key);
    if (index !== -1) {
      this.insertionOrder.splice(index, 1);
    }
    return this.entries.delete(normalized);
  }

  clear(): void {
    this.entries.clear();
    this.insertionOrder = [];
  }

  // Bulk operations
  setAll(entries: Iterable<[K, V]>): this {
    for (const [key, value] of entries) {
      this.set(key, value);
    }
    return this;
  }

  merge(other: ZMap<K, V>): ZMap<K, V> {
    const result = new ZMap<K, V>(this.entries);
    for (const [key, value] of other.entries) {
      result.set(key, value);
    }
    return result;
  }

  // Keys, values, entries
  keys(): ZArray<K> {
    return new ZArray([...this.insertionOrder]);
  }

  values(): ZArray<V> {
    return new ZArray([...this.entries.values()]);
  }

  entries(): ZArray<MapEntry<K, V>> {
    const result: MapEntry<K, V>[] = [];
    for (const key of this.insertionOrder) {
      const normalized = this.normalizeKey(key);
      if (this.entries.has(normalized)) {
        result.push({ key, value: this.entries.get(normalized)! });
      }
    }
    return new ZArray(result);
  }

  // Iteration
  forEach(callback: (value: V, key: K, map: ZMap<K, V>) => void): void {
    for (const key of this.insertionOrder) {
      const normalized = this.normalizeKey(key);
      if (this.entries.has(normalized)) {
        callback(this.entries.get(normalized)!, key, this);
      }
    }
  }

  // Filtering
  filter(predicate: (value: V, key: K, map: ZMap<K, V>) => boolean): ZMap<K, V> {
    const result = new ZMap<K, V>();
    for (const key of this.insertionOrder) {
      const normalized = this.normalizeKey(key);
      if (this.entries.has(normalized)) {
        const value = this.entries.get(normalized)!;
        if (predicate(value, key, this)) {
          result.set(key, value);
        }
      }
    }
    return result;
  }

  // Mapping
  map<U>(callback: (value: V, key: K, map: ZMap<K, V>) => U): ZMap<K, U> {
    const result = new ZMap<K, U>();
    for (const key of this.insertionOrder) {
      const normalized = this.normalizeKey(key);
      if (this.entries.has(normalized)) {
        const value = this.entries.get(normalized)!;
        result.set(key, callback(value, key, this));
      }
    }
    return result;
  }

  // Reduction
  reduce<U>(callback: (accumulator: U, value: V, key: K, map: ZMap<K, V>) => U, initialValue: U): U {
    let accumulator = initialValue;
    for (const key of this.insertionOrder) {
      const normalized = this.normalizeKey(key);
      if (this.entries.has(normalized)) {
        accumulator = callback(accumulator, this.entries.get(normalized)!, key, this);
      }
    }
    return accumulator;
  }

  // Search
  find(predicate: (value: V, key: K, map: ZMap<K, V>) => boolean): MapEntry<K, V> | undefined {
    for (const key of this.insertionOrder) {
      const normalized = this.normalizeKey(key);
      if (this.entries.has(normalized)) {
        const value = this.entries.get(normalized)!;
        if (predicate(value, key, this)) {
          return { key, value };
        }
      }
    }
    return undefined;
  }

  findKey(predicate: (value: V, key: K, map: ZMap<K, V>) => boolean): K | undefined {
    for (const key of this.insertionOrder) {
      const normalized = this.normalizeKey(key);
      if (this.entries.has(normalized)) {
        const value = this.entries.get(normalized)!;
        if (predicate(value, key, this)) {
          return key;
        }
      }
    }
    return undefined;
  }

  // Transformation
  toArray(): ZArray<[K, V]> {
    const result: [K, V][] = [];
    for (const key of this.insertionOrder) {
      const normalized = this.normalizeKey(key);
      if (this.entries.has(normalized)) {
        result.push([key, this.entries.get(normalized)!]);
      }
    }
    return new ZArray(result);
  }

  // Conversion
  toString(): string {
    const entries = [];
    for (const key of this.insertionOrder) {
      const normalized = this.normalizeKey(key);
      if (this.entries.has(normalized)) {
        const value = this.entries.get(normalized)!;
        const keyStr = this.keyToString(key);
        const valueStr = value instanceof Value ? value.toString() : String(value);
        entries.push(`${keyStr}: ${valueStr}`);
      }
    }
    return `{${entries.join(', ')}}`;
  }

  toJSON(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key of this.insertionOrder) {
      const normalized = this.normalizeKey(key);
      if (this.entries.has(normalized)) {
        const value = this.entries.get(normalized)!;
        const keyStr = this.keyToString(key);
        result[keyStr] = value instanceof Value ? value.toJSON() : value;
      }
    }
    return result;
  }

  // Copy
  copy(): ZMap<K, V> {
    const result = new ZMap<K, V>();
    for (const key of this.insertionOrder) {
      const normalized = this.normalizeKey(key);
      if (this.entries.has(normalized)) {
        result.set(key, this.entries.get(normalized)!);
      }
    }
    return result;
  }

  // Static utilities
  static of<K, V>(entries?: Iterable<[K, V]>): ZMap<K, V> {
    return new ZMap<K, V>(entries);
  }

  static fromObject(obj: Record<string, V>): ZMap<string, V> {
    return new ZMap<string, V>(Object.entries(obj));
  }

  static fromArray(entries: [K, V][]): ZMap<K, V> {
    return new ZMap<K, V>(entries);
  }

  static isMap(value: any): value is ZMap<any, any> {
    return value instanceof ZMap;
  }

  // Iteration
  [Symbol.iterator](): IterableIterator<[K, V]> {
    const map = this;
    let index = 0;
    return {
      next(): IteratorResult<[K, V]> {
        while (index < map.insertionOrder.length) {
          const key = map.insertionOrder[index++];
          const normalized = map.normalizeKey(key);
          if (map.entries.has(normalized)) {
            return { value: [key, map.entries.get(normalized)!], done: false };
          }
        }
        return { value: undefined, done: true };
      }
    };
  }

  // Internal methods
  private normalizeKey(key: K): K {
    // Normalize keys for comparison
    if (typeof key === 'string') {
      return key as K;
    }
    if (typeof key === 'number') {
      return key as K;
    }
    if (key instanceof Value) {
      return key.toString() as any as K;
    }
    return key;
  }

  private keyToString(key: K): string {
    if (typeof key === 'string') {
      return key;
    }
    if (typeof key === 'number') {
      return String(key);
    }
    if (key instanceof Value) {
      return key.toString();
    }
    return String(key);
  }
}

// WeakMap implementation (for garbage-collected keys)
export class WeakZMap<K extends object = object, V = Value> {
  private weakMap: WeakMap<K, V>;

  constructor() {
    this.weakMap = new WeakMap();
  }

  has(key: K): boolean {
    return this.weakMap.has(key);
  }

  get(key: K): V | undefined {
    return this.weakMap.get(key);
  }

  set(key: K, value: V): this {
    this.weakMap.set(key, value);
    return this;
  }

  delete(key: K): boolean {
    return this.weakMap.delete(key);
  }

  static isWeakMap(value: any): value is WeakZMap<any, any> {
    return value instanceof WeakZMap;
  }
}

export type MapValue = ZMap<Value, Value>;
