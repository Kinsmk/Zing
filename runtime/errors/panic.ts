/**
 * Panic - Gestion des paniques pour Zinga
 * 
 * Ce module fournit un mecanisme de panique similaire a celui de Rust ou Go.
 * Une panique est une erreur irrecoverable qui arrete l'execution normale
 * du programme.
 */

import { ZingaException, ExceptionType, ExceptionFactory } from './exceptions';
import { StackTrace, StackTraceUtils } from './stack-trace';

/**
 * Type de panique
 */
export enum PanicType {
  // Paniques de runtime
  AssertionFailed = 'AssertionFailed',
  UnreachableCode = 'UnreachableCode',
  InvalidState = 'InvalidState',
  
  // Paniques de memoire
  AllocationFailed = 'AllocationFailed',
  DoubleFree = 'DoubleFree',
  UseAfterFree = 'UseAfterFree',
  
  // Paniques d'execution
  StackOverflow = 'StackOverflow',
  InfiniteRecursion = 'InfiniteRecursion',
  
  // Paniques de type
  TypeMismatch = 'TypeMismatch',
  InvalidCast = 'InvalidCast',
  
  // Paniques personnalisees
  Custom = 'Custom',
}

/**
 * Information de panique
 */
export interface PanicInfo {
  type: PanicType;
  message: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  stackTrace?: StackTrace;
  timestamp: Date;
  cause?: Error;
}

/**
 * Resultat d'une operation qui peut paniquer
 */
export type PanicResult<T> = { ok: true; value: T } | { ok: false; panic: PanicInfo };

/**
 * Gestionnaire de panique
 */
export class PanicHandler {
  private handlers: Map<PanicType, (panic: PanicInfo) => void> = new Map();
  private globalHandler?: (panic: PanicInfo) => void;
  private panicHook?: (panic: PanicInfo) => void;
  
  /**
   * Enregistrer un gestionnaire pour un type de panique
   */
  registerHandler(type: PanicType, handler: (panic: PanicInfo) => void): void {
    this.handlers.set(type, handler);
  }
  
  /**
   * Enregistrer un gestionnaire global
   */
  registerGlobalHandler(handler: (panic: PanicInfo) => void): void {
    this.globalHandler = handler;
  }
  
  /**
   * Enregistrer un hook de panique (appele avant le gestionnaire)
   */
  registerPanicHook(hook: (panic: PanicInfo) => void): void {
    this.panicHook = hook;
  }
  
  /**
   * Declencher une panique
   */
  panic(
    type: PanicType,
    message: string,
    fileName?: string,
    lineNumber?: number,
    columnNumber?: number,
    cause?: Error
  ): never {
    const panicInfo: PanicInfo = {
      type,
      message,
      fileName,
      lineNumber,
      columnNumber,
      stackTrace: StackTraceUtils.capture(),
      timestamp: new Date(),
      cause,
    };
    
    // Appeler le hook de panique
    if (this.panicHook) {
      this.panicHook(panicInfo);
    }
    
    // Appeler le gestionnaire specifique
    const handler = this.handlers.get(type);
    if (handler) {
      handler(panicInfo);
    }
    
    // Appeler le gestionnaire global
    if (this.globalHandler) {
      this.globalHandler(panicInfo);
    }
    
    // Par defaut, logger et lancer une exception
    this.defaultPanicHandler(panicInfo);
    
    // Cette fonction ne retourne jamais
    throw new Error('Panic: ' + message);
  }
  
  /**
   * Gestionnaire de panique par defaut
   */
  private defaultPanicHandler(panic: PanicInfo): void {
    console.error('\n=== PANIC ===');
    console.error(`Type: ${panic.type}`);
    console.error(`Message: ${panic.message}`);
    
    if (panic.fileName && panic.lineNumber) {
      console.error(`Location: ${panic.fileName}:${panic.lineNumber}`);
      if (panic.columnNumber) {
        console.error(`Column: ${panic.columnNumber}`);
      }
    }
    
    if (panic.stackTrace) {
      console.error('\nStack Trace:');
      console.error(StackTraceUtils.formatStackTrace(panic.stackTrace));
    }
    
    if (panic.cause) {
      console.error('\nCaused by:');
      console.error(panic.cause);
    }
    
    console.error('==================\n');
  }
  
  /**
   * Declencher une panique avec une assertion
   */
  assert(
    condition: boolean,
    message: string,
    fileName?: string,
    lineNumber?: number,
    columnNumber?: number
  ): void {
    if (!condition) {
      this.panic(
        PanicType.AssertionFailed,
        message,
        fileName,
        lineNumber,
        columnNumber
      );
    }
  }
  
  /**
   * Declencher une panique pour du code inaccessible
   */
  unreachable(
    message: string = 'Unreachable code reached',
    fileName?: string,
    lineNumber?: number,
    columnNumber?: number
  ): never {
    this.panic(
      PanicType.UnreachableCode,
      message,
      fileName,
      lineNumber,
      columnNumber
    );
  }
  
  /**
   * Declencher une panique pour un etat invalide
   */
  invalidState(
    message: string,
    fileName?: string,
    lineNumber?: number,
    columnNumber?: number
  ): never {
    this.panic(
      PanicType.InvalidState,
      message,
      fileName,
      lineNumber,
      columnNumber
    );
  }
  
  /**
   * Declencher une panique pour une allocation echouee
   */
  allocationFailed(
    size: number,
    reason: string,
    fileName?: string,
    lineNumber?: number,
    columnNumber?: number
  ): never {
    this.panic(
      PanicType.AllocationFailed,
      `Allocation failed: ${size} bytes - ${reason}`,
      fileName,
      lineNumber,
      columnNumber
    );
  }
  
  /**
   * Declencher une panique pour un double free
   */
  doubleFree(
    address: number,
    fileName?: string,
    lineNumber?: number,
    columnNumber?: number
  ): never {
    this.panic(
      PanicType.DoubleFree,
      `Double free detected at address 0x${address.toString(16)}`,
      fileName,
      lineNumber,
      columnNumber
    );
  }
  
  /**
   * Declencher une panique pour un use-after-free
   */
  useAfterFree(
    address: number,
    fileName?: string,
    lineNumber?: number,
    columnNumber?: number
  ): never {
    this.panic(
      PanicType.UseAfterFree,
      `Use after free detected at address 0x${address.toString(16)}`,
      fileName,
      lineNumber,
      columnNumber
    );
  }
  
  /**
   * Declencher une panique pour un debordement de pile
   */
  stackOverflow(
    depth: number,
    maxDepth: number,
    fileName?: string,
    lineNumber?: number,
    columnNumber?: number
  ): never {
    this.panic(
      PanicType.StackOverflow,
      `Stack overflow: depth ${depth} exceeds maximum ${maxDepth}`,
      fileName,
      lineNumber,
      columnNumber
    );
  }
  
  /**
   * Declencher une panique pour une recursion infinie
   */
  infiniteRecursion(
    functionName: string,
    depth: number,
    fileName?: string,
    lineNumber?: number,
    columnNumber?: number
  ): never {
    this.panic(
      PanicType.InfiniteRecursion,
      `Infinite recursion detected in ${functionName} at depth ${depth}`,
      fileName,
      lineNumber,
      columnNumber
    );
  }
  
  /**
   * Declencher une panique pour une incompatibilite de type
   */
  typeMismatch(
    expected: string,
    actual: string,
    fileName?: string,
    lineNumber?: number,
    columnNumber?: number
  ): never {
    this.panic(
      PanicType.TypeMismatch,
      `Type mismatch: expected ${expected}, got ${actual}`,
      fileName,
      lineNumber,
      columnNumber
    );
  }
  
  /**
   * Declencher une panique pour un cast invalide
   */
  invalidCast(
    from: string,
    to: string,
    fileName?: string,
    lineNumber?: number,
    columnNumber?: number
  ): never {
    this.panic(
      PanicType.InvalidCast,
      `Invalid cast from ${from} to ${to}`,
      fileName,
      lineNumber,
      columnNumber
    );
  }
  
  /**
   * Declencher une panique personnalisee
   */
  customPanic(
    type: PanicType,
    message: string,
    fileName?: string,
    lineNumber?: number,
    columnNumber?: number,
    cause?: Error
  ): never {
    this.panic(type, message, fileName, lineNumber, columnNumber, cause);
  }
  
  /**
   * Supprimer un gestionnaire
   */
  unregisterHandler(type: PanicType): void {
    this.handlers.delete(type);
  }
  
  /**
   * Supprimer le gestionnaire global
   */
  unregisterGlobalHandler(): void {
    this.globalHandler = undefined;
  }
  
  /**
   * Supprimer le hook de panique
   */
  unregisterPanicHook(): void {
    this.panicHook = undefined;
  }
  
  /**
   * Reinitialiser tous les gestionnaires
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandler = undefined;
    this.panicHook = undefined;
  }
}

/**
 * Gestionnaire global de panique
 */
let globalPanicHandler: PanicHandler | null = null;

/**
 * Obtenir le gestionnaire global de panique
 */
export function getPanicHandler(): PanicHandler {
  if (!globalPanicHandler) {
    globalPanicHandler = new PanicHandler();
  }
  return globalPanicHandler;
}

/**
 * Declencher une panique de maniere globale
 */
export function panic(
  type: PanicType,
  message: string,
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number,
  cause?: Error
): never {
  return getPanicHandler().panic(type, message, fileName, lineNumber, columnNumber, cause);
}

/**
 * Declencher une assertion
 */
export function assert(
  condition: boolean,
  message: string,
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number
): void {
  getPanicHandler().assert(condition, message, fileName, lineNumber, columnNumber);
}

/**
 * Declencher une panique pour du code inaccessible
 */
export function unreachable(
  message: string = 'Unreachable code reached',
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number
): never {
  return getPanicHandler().unreachable(message, fileName, lineNumber, columnNumber);
}

/**
 * Declencher une panique pour un etat invalide
 */
export function invalidState(
  message: string,
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number
): never {
  return getPanicHandler().invalidState(message, fileName, lineNumber, columnNumber);
}

/**
 * Declencher une panique pour une allocation echouee
 */
export function allocationFailed(
  size: number,
  reason: string,
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number
): never {
  return getPanicHandler().allocationFailed(size, reason, fileName, lineNumber, columnNumber);
}

/**
 * Declencher une panique pour un double free
 */
export function doubleFree(
  address: number,
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number
): never {
  return getPanicHandler().doubleFree(address, fileName, lineNumber, columnNumber);
}

/**
 * Declencher une panique pour un use-after-free
 */
export function useAfterFree(
  address: number,
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number
): never {
  return getPanicHandler().useAfterFree(address, fileName, lineNumber, columnNumber);
}

/**
 * Declencher une panique pour un debordement de pile
 */
export function stackOverflow(
  depth: number,
  maxDepth: number,
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number
): never {
  return getPanicHandler().stackOverflow(depth, maxDepth, fileName, lineNumber, columnNumber);
}

/**
 * Declencher une panique pour une recursion infinie
 */
export function infiniteRecursion(
  functionName: string,
  depth: number,
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number
): never {
  return getPanicHandler().infiniteRecursion(functionName, depth, fileName, lineNumber, columnNumber);
}

/**
 * Declencher une panique pour une incompatibilite de type
 */
export function typeMismatch(
  expected: string,
  actual: string,
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number
): never {
  return getPanicHandler().typeMismatch(expected, actual, fileName, lineNumber, columnNumber);
}

/**
 * Declencher une panique pour un cast invalide
 */
export function invalidCast(
  from: string,
  to: string,
  fileName?: string,
  lineNumber?: number,
  columnNumber?: number
): never {
  return getPanicHandler().invalidCast(from, to, fileName, lineNumber, columnNumber);
}

/**
 * Utilitaires pour les operations qui peuvent paniquer
 */
export namespace PanicUtils {
  /**
   * Executer une operation qui peut paniquer
   */
  export function tryPanic<T>(
    operation: () => T,
    panicHandler?: (error: Error) => never
  ): PanicResult<T> {
    try {
      const result = operation();
      return { ok: true, value: result };
    } catch (error) {
      if (panicHandler) {
        return panicHandler(error as Error);
      }
      return { 
        ok: false, 
        panic: {
          type: PanicType.Custom,
          message: (error as Error).message,
          timestamp: new Date(),
        }
      };
    }
  }
  
  /**
   * Executer une operation et paniquer en cas d'erreur
   */
  export function unwrap<T>(
    result: PanicResult<T>,
    message?: string
  ): T {
    if (result.ok) {
      return result.value;
    }
    
    const panic = result.panic;
    panic(
      panic.type,
      message || panic.message,
      panic.fileName,
      panic.lineNumber,
      panic.columnNumber,
      panic.cause
    );
  }
  
  /**
   * Executer une operation et retourner une valeur par defaut en cas de panique
   */
  export function unwrapOr<T>(
    result: PanicResult<T>,
    defaultValue: T
  ): T {
    if (result.ok) {
      return result.value;
    }
    return defaultValue;
  }
  
  /**
   * Executer une operation et retourner null en cas de panique
   */
  export function unwrapOrNull<T>(
    result: PanicResult<T>
  ): T | null {
    return this.unwrapOr(result, null);
  }
  
  /**
   * Executer une operation et retourner undefined en cas de panique
   */
  export function unwrapOrUndefined<T>(
    result: PanicResult<T>
  ): T | undefined {
    return this.unwrapOr(result, undefined);
  }
}

/**
 * Decorateur pour les fonctions qui peuvent paniquer
 */
export function panicHandler(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;
  
  descriptor.value = function (...args: any[]) {
    try {
      return originalMethod.apply(this, args);
    } catch (error) {
      const panicHandler = getPanicHandler();
      panicHandler.panic(
        PanicType.Custom,
        (error as Error).message,
        undefined,
        undefined,
        undefined,
        error as Error
      );
    }
  };
  
  return descriptor;
}
