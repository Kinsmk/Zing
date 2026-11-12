/**
 * Zinga Runtime - String Value Type
 * 
 * Implements UTF-8/UTF-16 string type with comprehensive operations,
 * encoding/decoding, and manipulation functions.
 */

import { Value, ValueType } from './integers';

/**
 * String encoding types
 */
export enum StringEncoding {
  UTF8 = 'utf8',
  UTF16 = 'utf16',
  ASCII = 'ascii',
  BASE64 = 'base64',
  HEX = 'hex'
}

/**
 * String value implementation
 */
export class ZString extends Value {
  private value: string;
  private encoding: StringEncoding;

  constructor(value: string = '', encoding: StringEncoding = StringEncoding.UTF8) {
    super(ValueType.STRING);
    this.value = value;
    this.encoding = encoding;
  }

  getValue(): string {
    return this.value;
  }

  getEncoding(): StringEncoding {
    return this.encoding;
  }

  getLength(): number {
    return this.value.length;
  }

  getByteLength(): number {
    return new TextEncoder().encode(this.value).length;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  // Comparison
  equals(other: ZString): boolean {
    return this.value === other.getValue();
  }

  compareTo(other: ZString): number {
    return this.value.localeCompare(other.getValue());
  }

  // String manipulation
  concat(other: ZString): ZString {
    return new ZString(this.value + other.getValue(), this.encoding);
  }

  substring(start: number, end?: number): ZString {
    const result = end !== undefined 
      ? this.value.substring(start, end) 
      : this.value.substring(start);
    return new ZString(result, this.encoding);
  }

  slice(start: number, end?: number): ZString {
    const result = end !== undefined 
      ? this.value.slice(start, end) 
      : this.value.slice(start);
    return new ZString(result, this.encoding);
  }

  charAt(index: number): ZString {
    return new ZString(this.value.charAt(index), this.encoding);
  }

  charCodeAt(index: number): number {
    return this.value.charCodeAt(index);
  }

  codePointAt(index: number): number | undefined {
    return this.value.codePointAt(index);
  }

  // Search
  includes(search: string, position?: number): boolean {
    return this.value.includes(search, position);
  }

  startsWith(search: string, position?: number): boolean {
    return this.value.startsWith(search, position);
  }

  endsWith(search: string, length?: number): boolean {
    return this.value.endsWith(search, length);
  }

  indexOf(search: string, fromIndex?: number): number {
    return this.value.indexOf(search, fromIndex);
  }

  lastIndexOf(search: string, fromIndex?: number): number {
    return this.value.lastIndexOf(search, fromIndex);
  }

  // Transformation
  toLowerCase(): ZString {
    return new ZString(this.value.toLowerCase(), this.encoding);
  }

  toUpperCase(): ZString {
    return new ZString(this.value.toUpperCase(), this.encoding);
  }

  trim(): ZString {
    return new ZString(this.value.trim(), this.encoding);
  }

  trimStart(): ZString {
    return new ZString(this.value.trimStart(), this.encoding);
  }

  trimEnd(): ZString {
    return new ZString(this.value.trimEnd(), this.encoding);
  }

  replace(search: string, replace: string): ZString {
    return new ZString(this.value.replace(search, replace), this.encoding);
  }

  replaceAll(search: string, replace: string): ZString {
    return new ZString(this.value.replaceAll(search, replace), this.encoding);
  }

  // Splitting
  split(separator: string, limit?: number): ZString[] {
    const parts = separator.length > 0 
      ? this.value.split(separator, limit) 
      : [this.value];
    return parts.map(part => new ZString(part, this.encoding));
  }

  splitLines(): ZString[] {
    return this.value.split('\n').map(line => new ZString(line, this.encoding));
  }

  // Padding
  padStart(targetLength: number, padString: string = ' '): ZString {
    return new ZString(this.value.padStart(targetLength, padString), this.encoding);
  }

  padEnd(targetLength: number, padString: string = ' '): ZString {
    return new ZString(this.value.padEnd(targetLength, padString), this.encoding);
  }

  // Case conversion
  toTitleCase(): ZString {
    const words = this.value.split(/\s+/);
    const title = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    return new ZString(title, this.encoding);
  }

  toCamelCase(): ZString {
    const words = this.value.toLowerCase().split(/[\s-_]+/);
    const camel = words[0] + words.slice(1).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
    return new ZString(camel, this.encoding);
  }

  toSnakeCase(): ZString {
    const snake = this.value
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/[\s]+/g, '_');
    return new ZString(snake, this.encoding);
  }

  // Encoding/Decoding
  toUTF8Bytes(): Uint8Array {
    return new TextEncoder().encode(this.value);
  }

  toUTF16Bytes(): Uint8Array {
    const buffer = new ArrayBuffer(this.value.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < this.value.length; i++) {
      view.setUint16(i * 2, this.value.charCodeAt(i), true);
    }
    return new Uint8Array(buffer);
  }

  static fromUTF8Bytes(bytes: Uint8Array): ZString {
    return new ZString(new TextDecoder().decode(bytes), StringEncoding.UTF8);
  }

  static fromUTF16Bytes(bytes: Uint8Array): ZString {
    const buffer = bytes.buffer;
    const view = new DataView(buffer);
    let result = '';
    for (let i = 0; i < bytes.length; i += 2) {
      result += String.fromCharCode(view.getUint16(i, true));
    }
    return new ZString(result, StringEncoding.UTF16);
  }

  // Base64 encoding
  toBase64(): ZString {
    const bytes = this.toUTF8Bytes();
    const base64 = btoa(String.fromCharCode(...bytes));
    return new ZString(base64, StringEncoding.BASE64);
  }

  static fromBase64(base64: string): ZString {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return ZString.fromUTF8Bytes(bytes);
  }

  // Hex encoding
  toHex(): ZString {
    const bytes = this.toUTF8Bytes();
    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return new ZString(hex, StringEncoding.HEX);
  }

  static fromHex(hex: string): ZString {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return ZString.fromUTF8Bytes(bytes);
  }

  // Validation
  isEmpty(): boolean {
    return this.value.length === 0;
  }

  isBlank(): boolean {
    return this.value.trim().length === 0;
  }

  containsOnly(chars: string): boolean {
    return [...this.value].every(c => chars.includes(c));
  }

  isNumeric(): boolean {
    return /^[+-]?\d+(\.\d+)?$/.test(this.value);
  }

  isAlphabetic(): boolean {
    return /^[a-zA-Z]+$/.test(this.value);
  }

  isAlphanumeric(): boolean {
    return /^[a-zA-Z0-9]+$/.test(this.value);
  }

  // Formatting
  format(...args: (string | number)[]): ZString {
    let result = this.value;
    for (let i = 0; i < args.length; i++) {
      result = result.replace(new RegExp(`\\{${i}\\}`, 'g'), String(args[i]));
    }
    return new ZString(result, this.encoding);
  }

  repeat(count: number): ZString {
    return new ZString(this.value.repeat(count), this.encoding);
  }

  // Iteration
  [Symbol.iterator](): IterableIterator<ZString> {
    const chars = [...this.value];
    let index = 0;
    return {
      next(): IteratorResult<ZString> {
        if (index < chars.length) {
          return { value: new ZString(chars[index++], this.encoding), done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }

  // Static utilities
  static empty(): ZString {
    return new ZString('');
  }

  static fromNumber(num: number): ZString {
    return new ZString(num.toString());
  }

  static fromBoolean(bool: boolean): ZString {
    return new ZString(bool.toString());
  }

  static isString(value: any): value is ZString {
    return value instanceof ZString;
  }
}

// Export string type
export type StringValue = ZString;
