/**
 * Stack Trace - Gestion de la pile d'appels pour Zinga
 * 
 * Ce module fournit des utilitaires pour capturer, analyser et formater
 * la pile d'appels (stack trace) des exceptions.
 */

import { ZingaException, ExceptionType } from './exceptions';

/**
 * Element de la pile d'appels
 */
export interface StackFrame {
  // Nom de la fonction
  functionName: string;
  // Fichier source
  fileName?: string;
  // Numero de ligne
  lineNumber?: number;
  // Numero de colonne
  columnNumber?: number;
  // Code source (si disponible)
  sourceCode?: string;
  // Est-ce un appel natif
  isNative: boolean;
  // Est-ce un appel eval
  isEval: boolean;
  // Est-ce un appel constructeur
  isConstructor: boolean;
}

/**
 * Pile d'appels
 */
export interface StackTrace {
  // Tableau des elements de la pile
  frames: StackFrame[];
  // Exception associee
  exception?: ZingaException;
  // Message de l'exception
  message?: string;
}

/**
 * Parseur de pile d'appels
 */
export class StackTraceParser {
  /**
   * Analyser une pile d'appels JavaScript
   */
  static parse(stack?: string): StackFrame[] {
    if (!stack) {
      return [];
    }
    
    const frames: StackFrame[] = [];
    const lines = stack.split('\n');
    
    for (const line of lines) {
      const frame = this.parseFrame(line);
      if (frame) {
        frames.push(frame);
      }
    }
    
    return frames;
  }
  
  /**
   * Analyser une ligne de pile d'appels
   */
  private static parseFrame(line: string): StackFrame | null {
    // Format standard: at functionName (file:line:column)
    // Format Node.js: at file:line:column
    // Format browser: functionName@file:line:column
    
    line = line.trim();
    
    // Ignorer les lignes qui ne contiennent pas 'at'
    if (!line.includes('at') && !line.includes('@')) {
      return null;
    }
    
    // Essayer de parser different formats
    
    // Format 1: at functionName (file:line:column)
    const atMatch = line.match(/at\s+(\S+)\s+\(([^:]+):(\d+):(\d+)\)/);
    if (atMatch) {
      return {
        functionName: atMatch[1],
        fileName: atMatch[2],
        lineNumber: parseInt(atMatch[3], 10),
        columnNumber: parseInt(atMatch[4], 10),
        isNative: false,
        isEval: false,
        isConstructor: false,
      };
    }
    
    // Format 2: at file:line:column
    const fileMatch = line.match(/at\s+([^:]+):(\d+):(\d+)/);
    if (fileMatch) {
      return {
        functionName: '',
        fileName: fileMatch[1],
        lineNumber: parseInt(fileMatch[2], 10),
        columnNumber: parseInt(fileMatch[3], 10),
        isNative: false,
        isEval: false,
        isConstructor: false,
      };
    }
    
    // Format 3: functionName@file:line:column
    const browserMatch = line.match(/(\S+)@([^:]+):(\d+):(\d+)/);
    if (browserMatch) {
      return {
        functionName: browserMatch[1],
        fileName: browserMatch[2],
        lineNumber: parseInt(browserMatch[3], 10),
        columnNumber: parseInt(browserMatch[4], 10),
        isNative: false,
        isEval: false,
        isConstructor: false,
      };
    }
    
    // Format 4: Native code
    if (line.includes('native') || line.includes('Native')) {
      return {
        functionName: line,
        isNative: true,
        isEval: false,
        isConstructor: false,
      };
    }
    
    // Format 5: eval
    if (line.includes('eval')) {
      return {
        functionName: 'eval',
        isNative: false,
        isEval: true,
        isConstructor: false,
      };
    }
    
    // Si on ne peut pas parser, retourner une frame par defaut
    return {
      functionName: line,
      isNative: false,
      isEval: false,
      isConstructor: false,
    };
  }
  
  /**
   * Analyser une pile d'appels a partir d'une erreur
   */
  static fromError(error: Error): StackFrame[] {
    return this.parse(error.stack);
  }
  
  /**
   * Analyser une pile d'appels a partir d'une exception Zinga
   */
  static fromException(exception: ZingaException): StackFrame[] {
    return this.parse(exception.stackTrace);
  }
}

/**
 * Constructeur de pile d'appels
 */
export class StackTraceBuilder {
  private frames: StackFrame[] = [];
  
  /**
   * Ajouter une frame
   */
  addFrame(frame: StackFrame): void {
    this.frames.push(frame);
  }
  
  /**
   * Ajouter une frame avec des informations de base
   */
  addFunction(functionName: string): void {
    this.frames.push({
      functionName,
      isNative: false,
      isEval: false,
      isConstructor: false,
    });
  }
  
  /**
   * Ajouter une frame avec fichier et ligne
   */
  addLocation(
    functionName: string,
    fileName: string,
    lineNumber: number,
    columnNumber?: number
  ): void {
    this.frames.push({
      functionName,
      fileName,
      lineNumber,
      columnNumber,
      isNative: false,
      isEval: false,
      isConstructor: false,
    });
  }
  
  /**
   * Obtenir la pile d'appels
   */
  getStackTrace(): StackFrame[] {
    return [...this.frames];
  }
  
  /**
   * Reinitialiser
   */
  clear(): void {
    this.frames = [];
  }
  
  /**
   * Obtenir le nombre de frames
   */
  getFrameCount(): number {
    return this.frames.length;
  }
  
  /**
   * Obtenir la frame a un index donne
   */
  getFrame(index: number): StackFrame | undefined {
    return this.frames[index];
  }
  
  /**
   * Obtenir la premiere frame
   */
  getTopFrame(): StackFrame | undefined {
    return this.frames[0];
  }
  
  /**
   * Obtenir la derniere frame
   */
  getBottomFrame(): StackFrame | undefined {
    return this.frames[this.frames.length - 1];
  }
}

/**
 * Formateur de pile d'appels
 */
export class StackTraceFormatter {
  private options: FormatOptions;
  
  constructor(options: Partial<FormatOptions> = {}) {
    this.options = {
      showFunctionNames: true,
      showFileNames: true,
      showLineNumbers: true,
      showColumnNumbers: true,
      showNative: true,
      showEval: true,
      maxFrames: Infinity,
      ...options,
    };
  }
  
  /**
   * Formater une pile d'appels
   */
  format(stackTrace: StackFrame[] | StackTrace): string {
    const frames = Array.isArray(stackTrace) ? stackTrace : stackTrace.frames;
    
    const lines: string[] = [];
    
    // Limiter le nombre de frames
    const limitedFrames = frames.slice(0, this.options.maxFrames);
    
    for (let i = 0; i < limitedFrames.length; i++) {
      const frame = limitedFrames[i];
      const line = this.formatFrame(frame, i);
      lines.push(line);
    }
    
    // Ajouter un message si des frames ont ete troncques
    if (frames.length > this.options.maxFrames) {
      lines.push(`    ... ${frames.length - this.options.maxFrames} more frames`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Formater une frame
   */
  private formatFrame(frame: StackFrame, index: number): string {
    const parts: string[] = [];
    
    // Numero de frame
    parts.push(`#${index}`);
    
    // Nom de la fonction
    if (this.options.showFunctionNames && frame.functionName) {
      parts.push(frame.functionName);
    }
    
    // Fichier et ligne
    if (this.options.showFileNames && frame.fileName) {
      let location = frame.fileName;
      
      if (this.options.showLineNumbers && frame.lineNumber !== undefined) {
        location += `:${frame.lineNumber}`;
        
        if (this.options.showColumnNumbers && frame.columnNumber !== undefined) {
          location += `:${frame.columnNumber}`;
        }
      }
      
      parts.push(location);
    }
    
    // Indicateur natif
    if (this.options.showNative && frame.isNative) {
      parts.push('(native)');
    }
    
    // Indicateur eval
    if (this.options.showEval && frame.isEval) {
      parts.push('(eval)');
    }
    
    return `    ${parts.join(' ')}`;
  }
  
  /**
   * Formater une pile d'appels en JSON
   */
  formatJSON(stackTrace: StackFrame[] | StackTrace): string {
    const frames = Array.isArray(stackTrace) ? stackTrace : stackTrace.frames;
    return JSON.stringify(frames, null, 2);
  }
  
  /**
   * Formater une pile d'appels en format court
   */
  formatShort(stackTrace: StackFrame[] | StackTrace): string {
    const frames = Array.isArray(stackTrace) ? stackTrace : stackTrace.frames;
    
    if (frames.length === 0) {
      return '';
    }
    
    // Retourner seulement la premiere frame
    return this.formatFrame(frames[0], 0);
  }
}

/**
 * Options de formatage
 */
export interface FormatOptions {
  showFunctionNames: boolean;
  showFileNames: boolean;
  showLineNumbers: boolean;
  showColumnNumbers: boolean;
  showNative: boolean;
  showEval: boolean;
  maxFrames: number;
}

/**
 * Utilitaires pour les piles d'appels
 */
export namespace StackTraceUtils {
  /**
   * Creer une pile d'appels a partir d'une erreur
   */
  export function fromError(error: Error): StackTrace {
    return {
      frames: StackTraceParser.fromError(error),
      message: error.message,
    };
  }
  
  /**
   * Creer une pile d'appels a partir d'une exception
   */
  export function fromException(exception: ZingaException): StackTrace {
    return {
      frames: StackTraceParser.fromException(exception),
      exception,
      message: exception.message,
    };
  }
  
  /**
   * Capturer la pile d'appels courante
   */
  export function capture(): StackTrace {
    const stack = new Error().stack;
    return {
      frames: StackTraceParser.parse(stack),
    };
  }
  
  /**
   * Obtenir la fonction appelante
   */
  export function getCaller(): StackFrame | undefined {
    const stack = capture();
    // La premiere frame est cette fonction, la deuxieme est l'appelant
    return stack.frames[2];
  }
  
  /**
   * Obtenir le nom de la fonction appelante
   */
  export function getCallerName(): string | undefined {
    const caller = getCaller();
    return caller?.functionName;
  }
  
  /**
   * Verifier si une frame est native
   */
  export function isNative(frame: StackFrame): boolean {
    return frame.isNative || 
           !frame.fileName || 
           frame.fileName.includes('native') ||
           frame.fileName.includes('node:') ||
           frame.fileName.includes('internal/');
  }
  
  /**
   * Filtrer les frames natives
   */
  export function filterNativeFrames(frames: StackFrame[]): StackFrame[] {
    return frames.filter(f => !isNative(f));
  }
  
  /**
   * Filtrer les frames eval
   */
  export function filterEvalFrames(frames: StackFrame[]): StackFrame[] {
    return frames.filter(f => !f.isEval);
  }
  
  /**
   * Obtenir les frames utilisateur
   */
  export function getUserFrames(frames: StackFrame[]): StackFrame[] {
    return frames.filter(f => !isNative(f) && !f.isEval);
  }
}

/**
 * Formateur par defaut
 */
const defaultFormatter = new StackTraceFormatter();

/**
 * Formater une pile d'appels
 */
export function formatStackTrace(stackTrace: StackFrame[] | StackTrace): string {
  return defaultFormatter.format(stackTrace);
}

/**
 * Formater une pile d'appels en JSON
 */
export function formatStackTraceJSON(stackTrace: StackFrame[] | StackTrace): string {
  return defaultFormatter.formatJSON(stackTrace);
}

/**
 * Capturer et formater la pile d'appels courante
 */
export function captureAndFormatStackTrace(): string {
  const stack = StackTraceUtils.capture();
  return defaultFormatter.format(stack);
}
