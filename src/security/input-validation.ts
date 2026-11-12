/**
 * Zinga Security - Input Validation
 * 
 * Validates and sanitizes input data to prevent injection attacks.
 */

import { ZMap } from '../../runtime/values/maps';
import { ZString } from '../../runtime/values/strings';
import { ZArray } from '../../runtime/values/arrays';

/**
 * Validation rules
 */
export interface ValidationRule {
  type: string;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean;
  message?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  value?: any;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  value?: any;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  rule: string;
  message: string;
  value?: any;
}

/**
 * Input validation error
 */
export class InputValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly rule: string,
    public readonly value?: any
  ) {
    super(message);
    this.name = 'InputValidationError';
  }
}

/**
 * Input Validation Rules
 */
export const ValidationRules = {
  // String rules
  STRING: { type: 'string' } as ValidationRule,
  STRING_NOT_EMPTY: {
    type: 'string',
    min: 1,
    message: 'String cannot be empty'
  } as ValidationRule,
  STRING_ALPHANUMERIC: {
    type: 'string',
    pattern: /^[a-zA-Z0-9]+$/,
    message: 'String must be alphanumeric'
  } as ValidationRule,
  STRING_ALPHABETIC: {
    type: 'string',
    pattern: /^[a-zA-Z]+$/,
    message: 'String must be alphabetic'
  } as ValidationRule,
  STRING_NUMERIC: {
    type: 'string',
    pattern: /^[0-9]+$/,
    message: 'String must be numeric'
  } as ValidationRule,
  STRING_EMAIL: {
    type: 'string',
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: 'Invalid email format'
  } as ValidationRule,
  STRING_URL: {
    type: 'string',
    pattern: /^https?:\/\/[^\s\/$.?#].[^\s]*$/i,
    message: 'Invalid URL format'
  } as ValidationRule,
  STRING_UUID: {
    type: 'string',
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    message: 'Invalid UUID format'
  } as ValidationRule,

  // Number rules
  NUMBER: { type: 'number' } as ValidationRule,
  NUMBER_INTEGER: {
    type: 'number',
    custom: (value: any) => Number.isInteger(value),
    message: 'Value must be an integer'
  } as ValidationRule,
  NUMBER_POSITIVE: {
    type: 'number',
    min: 0,
    message: 'Value must be positive'
  } as ValidationRule,
  NUMBER_NEGATIVE: {
    type: 'number',
    max: 0,
    message: 'Value must be negative'
  } as ValidationRule,
  NUMBER_RANGE: (min: number, max: number) => ({
    type: 'number',
    min,
    max,
    message: `Value must be between ${min} and ${max}`
  } as ValidationRule),

  // Boolean rules
  BOOLEAN: { type: 'boolean' } as ValidationRule,

  // Array rules
  ARRAY: { type: 'array' } as ValidationRule,
  ARRAY_NOT_EMPTY: {
    type: 'array',
    min: 1,
    message: 'Array cannot be empty'
  } as ValidationRule,
  ARRAY_MIN_LENGTH: (min: number) => ({
    type: 'array',
    min,
    message: `Array must have at least ${min} elements`
  } as ValidationRule),
  ARRAY_MAX_LENGTH: (max: number) => ({
    type: 'array',
    max,
    message: `Array must have at most ${max} elements`
  } as ValidationRule),

  // Object rules
  OBJECT: { type: 'object' } as ValidationRule,
  OBJECT_NOT_EMPTY: {
    type: 'object',
    min: 1,
    message: 'Object cannot be empty'
  } as ValidationRule,

  // Date rules
  DATE: {
    type: 'date',
    custom: (value: any) => !isNaN(Date.parse(value)),
    message: 'Invalid date format'
  } as ValidationRule,
  DATE_FUTURE: {
    type: 'date',
    custom: (value: any) => {
      const date = new Date(value);
      return !isNaN(date.getTime()) && date > new Date();
    },
    message: 'Date must be in the future'
  } as ValidationRule,
  DATE_PAST: {
    type: 'date',
    custom: (value: any) => {
      const date = new Date(value);
      return !isNaN(date.getTime()) && date < new Date();
    },
    message: 'Date must be in the past'
  } as ValidationRule,

  // Security rules
  NO_HTML: {
    type: 'string',
    pattern: /^[^<>&"']*$/,
    message: 'Input contains HTML special characters'
  } as ValidationRule,
  NO_SCRIPT: {
    type: 'string',
    pattern: /^[^<]*(<\/(script)>|[^<])*$/i,
    message: 'Input contains script tags'
  } as ValidationRule,
  NO_SQL: {
    type: 'string',
    pattern: /^[^;\-\']*$/,
    message: 'Input contains SQL special characters'
  } as ValidationRule,
  NO_NEWLINE: {
    type: 'string',
    pattern: /^[^\n\r]*$/,
    message: 'Input contains newlines'
  } as ValidationRule,

  // Custom rules
  CUSTOM: (validator: (value: any) => boolean, message: string) => ({
    type: 'custom',
    custom: validator,
    message
  } as ValidationRule)
};

/**
 * Input Validator
 * 
 * Validates and sanitizes input data.
 */
export class InputValidator {
  private rules: ZMap<string, ValidationRule[]>;
  private sanitizers: ZMap<string, (value: any) => any>;
  private strictMode: boolean;

  constructor(strictMode: boolean = true) {
    this.rules = new ZMap();
    this.sanitizers = new ZMap();
    this.strictMode = strictMode;
  }

  /**
   * Add validation rule for a field
   */
  addRule(field: string, rule: ValidationRule): this {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
    return this;
  }

  /**
   * Add multiple validation rules for a field
   */
  addRules(field: string, rules: ValidationRule[]): this {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(...rules);
    return this;
  }

  /**
   * Add sanitizer for a field
   */
  addSanitizer(field: string, sanitizer: (value: any) => any): this {
    this.sanitizers.set(field, sanitizer);
    return this;
  }

  /**
   * Validate input
   */
  validate(input: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const validated: Record<string, any> = {};

    for (const [field, value] of Object.entries(input)) {
      const fieldRules = this.rules.get(field);
      const sanitizer = this.sanitizers.get(field);

      // Apply sanitizer
      const sanitized = sanitizer ? sanitizer(value) : value;

      if (fieldRules) {
        for (const rule of fieldRules) {
          const result = this.validateRule(field, sanitized, rule);
          if (!result.valid) {
            errors.push({
              field,
              rule: rule.type,
              message: rule.message || `Validation failed for ${rule.type}`,
              value: sanitized
            });
            if (this.strictMode) {
              break; // Stop on first error in strict mode
            }
          } else if (result.warning) {
            warnings.push({
              field,
              rule: rule.type,
              message: rule.message || `Validation warning for ${rule.type}`,
              value: sanitized
            });
          }
        }
      }

      validated[field] = sanitized;
    }

    return {
      valid: errors.length === 0,
      value: validated,
      errors,
      warnings
    };
  }

  /**
   * Validate and throw on error
   */
  validateOrThrow(input: Record<string, any>): Record<string, any> {
    const result = this.validate(input);
    if (!result.valid) {
      const firstError = result.errors[0];
      throw new InputValidationError(
        firstError.message,
        firstError.field,
        firstError.rule,
        firstError.value
      );
    }
    return result.value as Record<string, any>;
  }

  /**
   * Validate a single rule
   */
  private validateRule(
    field: string,
    value: any,
    rule: ValidationRule
  ): { valid: boolean; warning?: boolean } {
    // Check type
    if (rule.type && value !== undefined && value !== null) {
      const actualType = typeof value;
      
      if (rule.type === 'string' && actualType !== 'string') {
        return { valid: false };
      }
      if (rule.type === 'number' && actualType !== 'number' && isNaN(value)) {
        return { valid: false };
      }
      if (rule.type === 'boolean' && actualType !== 'boolean') {
        return { valid: false };
      }
      if (rule.type === 'array' && !Array.isArray(value)) {
        return { valid: false };
      }
      if (rule.type === 'object' && (actualType !== 'object' || Array.isArray(value) || value === null)) {
        return { valid: false };
      }
      if (rule.type === 'date' && !(value instanceof Date) && isNaN(Date.parse(value))) {
        return { valid: false };
      }
    }

    // Check pattern
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        return { valid: false };
      }
    }

    // Check min
    if (rule.min !== undefined) {
      if (typeof value === 'string' && value.length < rule.min) {
        return { valid: false };
      }
      if (typeof value === 'number' && value < rule.min) {
        return { valid: false };
      }
      if (Array.isArray(value) && value.length < rule.min) {
        return { valid: false };
      }
      if (value && typeof value === 'object' && Object.keys(value).length < rule.min) {
        return { valid: false };
      }
    }

    // Check max
    if (rule.max !== undefined) {
      if (typeof value === 'string' && value.length > rule.max) {
        return { valid: false };
      }
      if (typeof value === 'number' && value > rule.max) {
        return { valid: false };
      }
      if (Array.isArray(value) && value.length > rule.max) {
        return { valid: false };
      }
      if (value && typeof value === 'object' && Object.keys(value).length > rule.max) {
        return { valid: false };
      }
    }

    // Check custom validator
    if (rule.custom && !rule.custom(value)) {
      return { valid: false };
    }

    return { valid: true };
  }

  /**
   * Sanitize input
   */
  sanitize(input: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [field, value] of Object.entries(input)) {
      const sanitizer = this.sanitizers.get(field);
      sanitized[field] = sanitizer ? sanitizer(value) : value;
    }

    return sanitized;
  }

  /**
   * Get validation rules for a field
   */
  getRules(field: string): ValidationRule[] | undefined {
    return this.rules.get(field);
  }

  /**
   * Get all validation rules
   */
  getAllRules(): ZMap<string, ValidationRule[]> {
    return new ZMap(this.rules);
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules.clear();
  }

  /**
   * Clear all sanitizers
   */
  clearSanitizers(): void {
    this.sanitizers.clear();
  }

  /**
   * Set strict mode
   */
  setStrictMode(strict: boolean): void {
    this.strictMode = strict;
  }

  /**
   * Get strict mode
   */
  isStrictMode(): boolean {
    return this.strictMode;
  }
}

/**
 * Input Sanitizers
 */
export const Sanitizers = {
  // String sanitizers
  TRIM: (value: any) => typeof value === 'string' ? value.trim() : value,
  TO_LOWER_CASE: (value: any) => typeof value === 'string' ? value.toLowerCase() : value,
  TO_UPPER_CASE: (value: any) => typeof value === 'string' ? value.toUpperCase() : value,
  ESCAPE_HTML: (value: any) => {
    if (typeof value !== 'string') return value;
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },
  ESCAPE_SQL: (value: any) => {
    if (typeof value !== 'string') return value;
    return value.replace(/'/g, "''");
  },
  REMOVE_WHITESPACE: (value: any) => typeof value === 'string' ? value.replace(/\s+/g, '') : value,
  NORMALIZE_WHITESPACE: (value: any) => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value,

  // Number sanitizers
  TO_NUMBER: (value: any) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  },
  TO_INTEGER: (value: any) => {
    const num = Number(value);
    return isNaN(num) ? 0 : Math.trunc(num);
  },
  TO_FLOAT: (value: any) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  },
  ABS: (value: any) => typeof value === 'number' ? Math.abs(value) : value,
  ROUND: (value: any) => typeof value === 'number' ? Math.round(value) : value,
  FLOOR: (value: any) => typeof value === 'number' ? Math.floor(value) : value,
  CEIL: (value: any) => typeof value === 'number' ? Math.ceil(value) : value,

  // Boolean sanitizers
  TO_BOOLEAN: (value: any) => Boolean(value),

  // Array sanitizers
  TO_ARRAY: (value: any) => Array.isArray(value) ? value : [value],
  FILTER_EMPTY: (value: any) => Array.isArray(value) ? value.filter(v => v !== undefined && v !== null && v !== '') : value,
  UNIQUE: (value: any) => Array.isArray(value) ? [...new Set(value)] : value,

  // Object sanitizers
  TO_OBJECT: (value: any) => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
  PICK: (fields: string[]) => (value: any) => {
    if (value && typeof value === 'object') {
      const result: Record<string, any> = {};
      for (const field of fields) {
        if (field in value) {
          result[field] = value[field];
        }
      }
      return result;
    }
    return value;
  },
  OMIT: (fields: string[]) => (value: any) => {
    if (value && typeof value === 'object') {
      const result: Record<string, any> = { ...value };
      for (const field of fields) {
        delete result[field];
      }
      return result;
    }
    return value;
  }
};

/**
 * Global input validator instance
 */
export const globalInputValidator = new InputValidator();

export type InputValidationValue = InputValidator;
