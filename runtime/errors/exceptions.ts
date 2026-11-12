/**
 * Exceptions - Gestion des exceptions pour Zinga
 * 
 * Ce module definit les different types d'exceptions utilisees par le runtime Zinga.
 */

/**
 * Type d'exception
 */
export enum ExceptionType {
  // Exceptions de runtime
  RuntimeError = 'RuntimeError',
  TypeError = 'TypeError',
  ReferenceError = 'ReferenceError',
  RangeError = 'RangeError',
  
  // Exceptions de memoire
  MemoryError = 'MemoryError',
  OutOfMemoryError = 'OutOfMemoryError',
  StackOverflowError = 'StackOverflowError',
  
  // Exceptions d'execution
  ExecutionError = 'ExecutionError',
  TimeoutError = 'TimeoutError',
  AbortError = 'AbortError',
  
  // Exceptions de type
  CastError = 'CastError',
  InvalidTypeError = 'InvalidTypeError',
  
  // Exceptions d'E/S
  IOError = 'IOError',
  FileNotFoundError = 'FileNotFoundError',
  PermissionError = 'PermissionError',
  
  // Exceptions de securite
  SecurityError = 'SecurityError',
  IsolationError = 'IsolationError',
  
  // Exceptions personnalisees
  CustomError = 'CustomError',
}

/**
 * Classe de base pour les exceptions Zinga
 */
export abstract class ZingaException extends Error {
  public readonly type: ExceptionType;
  public readonly timestamp: Date;
  public readonly stackTrace?: string;
  public readonly cause?: Error;
  
  constructor(
    type: ExceptionType,
    message: string,
    cause?: Error
  ) {
    super(message);
    this.type = type;
    this.name = type;
    this.timestamp = new Date();
    this.cause = cause;
    
    // Capturer la stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ZingaException);
    }
    
    // Stocker la stack trace
    this.stackTrace = this.stack;
  }
  
  /**
   * Convertir en objet JSON
   */
  toJSON(): ExceptionJSON {
    return {
      type: this.type,
      name: this.name,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      stackTrace: this.stackTrace,
      cause: this.cause ? this.cause.message : undefined,
    };
  }
  
  /**
   * Convertir en chaine
   */
  toString(): string {
    return `${this.type}: ${this.message}`;
  }
  
  /**
   * Verifier si l'exception est de type donne
   */
  isType(type: ExceptionType): boolean {
    return this.type === type;
  }
  
  /**
   * Verifier si l'exception est une erreur de runtime
   */
  isRuntimeError(): boolean {
    return [
      ExceptionType.RuntimeError,
      ExceptionType.TypeError,
      ExceptionType.ReferenceError,
      ExceptionType.RangeError,
    ].includes(this.type);
  }
  
  /**
   * Verifier si l'exception est une erreur de memoire
   */
  isMemoryError(): boolean {
    return [
      ExceptionType.MemoryError,
      ExceptionType.OutOfMemoryError,
      ExceptionType.StackOverflowError,
    ].includes(this.type);
  }
  
  /**
   * Verifier si l'exception est une erreur d'execution
   */
  isExecutionError(): boolean {
    return [
      ExceptionType.ExecutionError,
      ExceptionType.TimeoutError,
      ExceptionType.AbortError,
    ].includes(this.type);
  }
}

/**
 * Representation JSON d'une exception
 */
export interface ExceptionJSON {
  type: ExceptionType;
  name: string;
  message: string;
  timestamp: string;
  stackTrace?: string;
  cause?: string;
}

/**
 * Exception de runtime
 */
export class RuntimeException extends ZingaException {
  constructor(message: string, cause?: Error) {
    super(ExceptionType.RuntimeError, message, cause);
  }
}

/**
 * Exception de type
 */
export class TypeException extends ZingaException {
  constructor(message: string, cause?: Error) {
    super(ExceptionType.TypeError, message, cause);
  }
}

/**
 * Exception de reference
 */
export class ReferenceException extends ZingaException {
  constructor(message: string, cause?: Error) {
    super(ExceptionType.ReferenceError, message, cause);
  }
}

/**
 * Exception de plage
 */
export class RangeException extends ZingaException {
  constructor(message: string, cause?: Error) {
    super(ExceptionType.RangeError, message, cause);
  }
}

/**
 * Exception de memoire
 */
export class MemoryException extends ZingaException {
  constructor(message: string, cause?: Error) {
    super(ExceptionType.MemoryError, message, cause);
  }
}

/**
 * Exception de memoire insuffisante
 */
export class OutOfMemoryException extends ZingaException {
  public readonly requested: number;
  public readonly available: number;
  
  constructor(requested: number, available: number, cause?: Error) {
    super(
      ExceptionType.OutOfMemoryError,
      `Out of memory: requested ${requested} bytes, available ${available} bytes`,
      cause
    );
    this.requested = requested;
    this.available = available;
  }
  
  toJSON(): ExceptionJSON & { requested: number; available: number } {
    return {
      ...super.toJSON(),
      requested: this.requested,
      available: this.available,
    };
  }
}

/**
 * Exception de debordement de pile
 */
export class StackOverflowException extends ZingaException {
  public readonly depth: number;
  public readonly maxDepth: number;
  
  constructor(depth: number, maxDepth: number, cause?: Error) {
    super(
      ExceptionType.StackOverflowError,
      `Stack overflow: depth ${depth} exceeds maximum ${maxDepth}`,
      cause
    );
    this.depth = depth;
    this.maxDepth = maxDepth;
  }
  
  toJSON(): ExceptionJSON & { depth: number; maxDepth: number } {
    return {
      ...super.toJSON(),
      depth: this.depth,
      maxDepth: this.maxDepth,
    };
  }
}

/**
 * Exception d'execution
 */
export class ExecutionException extends ZingaException {
  constructor(message: string, cause?: Error) {
    super(ExceptionType.ExecutionError, message, cause);
  }
}

/**
 * Exception de timeout
 */
export class TimeoutException extends ZingaException {
  public readonly timeout: number;
  
  constructor(timeout: number, cause?: Error) {
    super(
      ExceptionType.TimeoutError,
      `Execution timed out after ${timeout}ms`,
      cause
    );
    this.timeout = timeout;
  }
  
  toJSON(): ExceptionJSON & { timeout: number } {
    return {
      ...super.toJSON(),
      timeout: this.timeout,
    };
  }
}

/**
 * Exception d'abandon
 */
export class AbortException extends ZingaException {
  public readonly reason: string;
  
  constructor(reason: string = 'Execution aborted', cause?: Error) {
    super(ExceptionType.AbortError, reason, cause);
    this.reason = reason;
  }
  
  toJSON(): ExceptionJSON & { reason: string } {
    return {
      ...super.toJSON(),
      reason: this.reason,
    };
  }
}

/**
 * Exception de cast
 */
export class CastException extends ZingaException {
  public readonly fromType: string;
  public readonly toType: string;
  
  constructor(fromType: string, toType: string, cause?: Error) {
    super(
      ExceptionType.CastError,
      `Cannot cast from ${fromType} to ${toType}`,
      cause
    );
    this.fromType = fromType;
    this.toType = toType;
  }
  
  toJSON(): ExceptionJSON & { fromType: string; toType: string } {
    return {
      ...super.toJSON(),
      fromType: this.fromType,
      toType: this.toType,
    };
  }
}

/**
 * Exception de type invalide
 */
export class InvalidTypeException extends ZingaException {
  public readonly type: string;
  
  constructor(type: string, cause?: Error) {
    super(
      ExceptionType.InvalidTypeError,
      `Invalid type: ${type}`,
      cause
    );
    this.type = type;
  }
  
  toJSON(): ExceptionJSON & { type: string } {
    return {
      ...super.toJSON(),
      type: this.type,
    };
  }
}

/**
 * Exception d'E/S
 */
export class IOException extends ZingaException {
  public readonly operation: string;
  public readonly path?: string;
  
  constructor(operation: string, path?: string, cause?: Error) {
    super(
      ExceptionType.IOError,
      `I/O error during ${operation}${path ? ` on ${path}` : ''}`,
      cause
    );
    this.operation = operation;
    this.path = path;
  }
  
  toJSON(): ExceptionJSON & { operation: string; path?: string } {
    return {
      ...super.toJSON(),
      operation: this.operation,
      path: this.path,
    };
  }
}

/**
 * Exception de fichier non trouve
 */
export class FileNotFoundException extends IOException {
  constructor(path: string, cause?: Error) {
    super('read', path, cause);
    this.type = ExceptionType.FileNotFoundError;
    this.name = ExceptionType.FileNotFoundError;
  }
}

/**
 * Exception de permission
 */
export class PermissionException extends IOException {
  constructor(operation: string, path?: string, cause?: Error) {
    super(operation, path, cause);
    this.type = ExceptionType.PermissionError;
    this.name = ExceptionType.PermissionError;
  }
}

/**
 * Exception de securite
 */
export class SecurityException extends ZingaException {
  public readonly operation: string;
  public readonly reason: string;
  
  constructor(operation: string, reason: string, cause?: Error) {
    super(
      ExceptionType.SecurityError,
      `Security violation: ${operation} - ${reason}`,
      cause
    );
    this.operation = operation;
    this.reason = reason;
  }
  
  toJSON(): ExceptionJSON & { operation: string; reason: string } {
    return {
      ...super.toJSON(),
      operation: this.operation,
      reason: this.reason,
    };
  }
}

/**
 * Exception d'isolation
 */
export class IsolationException extends ZingaException {
  public readonly boundary: string;
  public readonly violation: string;
  
  constructor(boundary: string, violation: string, cause?: Error) {
    super(
      ExceptionType.IsolationError,
      `Isolation violation at ${boundary}: ${violation}`,
      cause
    );
    this.boundary = boundary;
    this.violation = violation;
  }
  
  toJSON(): ExceptionJSON & { boundary: string; violation: string } {
    return {
      ...super.toJSON(),
      boundary: this.boundary,
      violation: this.violation,
    };
  }
}

/**
 * Exception personnalisee
 */
export class CustomException extends ZingaException {
  public readonly code: string;
  public readonly data?: any;
  
  constructor(
    code: string,
    message: string,
    data?: any,
    cause?: Error
  ) {
    super(ExceptionType.CustomError, message, cause);
    this.code = code;
    this.data = data;
  }
  
  toJSON(): ExceptionJSON & { code: string; data?: any } {
    return {
      ...super.toJSON(),
      code: this.code,
      data: this.data,
    };
  }
}

/**
 * Fabrique d'exceptions
 */
export class ExceptionFactory {
  /**
   * Creer une exception a partir d'un type
   */
  static create(
    type: ExceptionType,
    message: string,
    cause?: Error,
    additional?: any
  ): ZingaException {
    switch (type) {
      case ExceptionType.RuntimeError:
        return new RuntimeException(message, cause);
      case ExceptionType.TypeError:
        return new TypeException(message, cause);
      case ExceptionType.ReferenceError:
        return new ReferenceException(message, cause);
      case ExceptionType.RangeError:
        return new RangeException(message, cause);
      case ExceptionType.MemoryError:
        return new MemoryException(message, cause);
      case ExceptionType.OutOfMemoryError:
        return new OutOfMemoryException(
          additional?.requested || 0,
          additional?.available || 0,
          cause
        );
      case ExceptionType.StackOverflowError:
        return new StackOverflowException(
          additional?.depth || 0,
          additional?.maxDepth || 0,
          cause
        );
      case ExceptionType.ExecutionError:
        return new ExecutionException(message, cause);
      case ExceptionType.TimeoutError:
        return new TimeoutException(additional?.timeout || 0, cause);
      case ExceptionType.AbortError:
        return new AbortException(additional?.reason || message, cause);
      case ExceptionType.CastError:
        return new CastException(
          additional?.fromType || '',
          additional?.toType || '',
          cause
        );
      case ExceptionType.InvalidTypeError:
        return new InvalidTypeException(additional?.type || '', cause);
      case ExceptionType.IOError:
        return new IOException(
          additional?.operation || '',
          additional?.path || '',
          cause
        );
      case ExceptionType.FileNotFoundError:
        return new FileNotFoundException(additional?.path || '', cause);
      case ExceptionType.PermissionError:
        return new PermissionException(
          additional?.operation || '',
          additional?.path || '',
          cause
        );
      case ExceptionType.SecurityError:
        return new SecurityException(
          additional?.operation || '',
          additional?.reason || '',
          cause
        );
      case ExceptionType.IsolationError:
        return new IsolationException(
          additional?.boundary || '',
          additional?.violation || '',
          cause
        );
      case ExceptionType.CustomError:
        return new CustomException(
          additional?.code || '',
          message,
          additional?.data,
          cause
        );
      default:
        return new RuntimeException(message, cause);
    }
  }
  
  /**
   * Creer une exception de memoire insuffisante
   */
  static outOfMemory(requested: number, available: number): OutOfMemoryException {
    return new OutOfMemoryException(requested, available);
  }
  
  /**
   * Creer une exception de debordement de pile
   */
  static stackOverflow(depth: number, maxDepth: number): StackOverflowException {
    return new StackOverflowException(depth, maxDepth);
  }
  
  /**
   * Creer une exception de timeout
   */
  static timeout(timeout: number): TimeoutException {
    return new TimeoutException(timeout);
  }
  
  /**
   * Creer une exception de cast
   */
  static castError(fromType: string, toType: string): CastException {
    return new CastException(fromType, toType);
  }
  
  /**
   * Creer une exception de fichier non trouve
   */
  static fileNotFound(path: string): FileNotFoundException {
    return new FileNotFoundException(path);
  }
  
  /**
   * Creer une exception de securite
   */
  static securityError(operation: string, reason: string): SecurityException {
    return new SecurityException(operation, reason);
  }
  
  /**
   * Creer une exception d'isolation
   */
  static isolationError(boundary: string, violation: string): IsolationException {
    return new IsolationException(boundary, violation);
  }
}

/**
 * Gestionnaire d'exceptions
 */
export class ExceptionHandler {
  private handlers: Map<ExceptionType, (exception: ZingaException) => void> = new Map();
  private globalHandler?: (exception: ZingaException) => void;
  
  /**
   * Enregistrer un gestionnaire pour un type d'exception
   */
  registerHandler(
    type: ExceptionType,
    handler: (exception: ZingaException) => void
  ): void {
    this.handlers.set(type, handler);
  }
  
  /**
   * Enregistrer un gestionnaire global
   */
  registerGlobalHandler(handler: (exception: ZingaException) => void): void {
    this.globalHandler = handler;
  }
  
  /**
   * Gerer une exception
   */
  handle(exception: ZingaException): void {
    // Verifier s'il y a un gestionnaire pour ce type
    const handler = this.handlers.get(exception.type);
    
    if (handler) {
      handler(exception);
      return;
    }
    
    // Verifier s'il y a un gestionnaire pour la categorie
    if (exception.isRuntimeError() && this.handlers.has(ExceptionType.RuntimeError)) {
      this.handlers.get(ExceptionType.RuntimeError)!(exception);
      return;
    }
    
    if (exception.isMemoryError() && this.handlers.has(ExceptionType.MemoryError)) {
      this.handlers.get(ExceptionType.MemoryError)!(exception);
      return;
    }
    
    if (exception.isExecutionError() && this.handlers.has(ExceptionType.ExecutionError)) {
      this.handlers.get(ExceptionType.ExecutionError)!(exception);
      return;
    }
    
    // Utiliser le gestionnaire global
    if (this.globalHandler) {
      this.globalHandler(exception);
      return;
    }
    
    // Par defaut, logger l'exception
    console.error('Unhandled exception:', exception);
  }
  
  /**
   * Gerer une erreur JavaScript
   */
  handleError(error: Error): void {
    if (error instanceof ZingaException) {
      this.handle(error);
    } else {
      // Convertir en exception Zinga
      const exception = new RuntimeException(error.message, error);
      this.handle(exception);
    }
  }
  
  /**
   * Supprimer un gestionnaire
   */
  unregisterHandler(type: ExceptionType): void {
    this.handlers.delete(type);
  }
  
  /**
   * Supprimer le gestionnaire global
   */
  unregisterGlobalHandler(): void {
    this.globalHandler = undefined;
  }
  
  /**
   * Reinitialiser tous les gestionnaires
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandler = undefined;
  }
}

/**
 * Gestionnaire global d'exceptions
 */
let globalExceptionHandler: ExceptionHandler | null = null;

/**
 * Obtenir le gestionnaire global d'exceptions
 */
export function getExceptionHandler(): ExceptionHandler {
  if (!globalExceptionHandler) {
    globalExceptionHandler = new ExceptionHandler();
  }
  return globalExceptionHandler;
}

/**
 * Gerer une exception de maniere globale
 */
export function handleException(exception: ZingaException): void {
  getExceptionHandler().handle(exception);
}

/**
 * Gerer une erreur de maniere globale
 */
export function handleError(error: Error): void {
  getExceptionHandler().handleError(error);
}
