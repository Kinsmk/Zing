/**
 * Scanner - Scanneur de caractères pour Zinga
 * 
 * Ce module gère la lecture des caractères du code source.
 */

import { Position } from './positions';
import { Config } from '../config';

export class Scanner {
  private source: string = '';
  private filename: string = '<unknown>';
  private position: Position = new Position(0, 0, 0);
  private length: number = 0;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Définir la source à scanner
   */
  public setSource(source: string, filename?: string): void {
    this.source = source;
    this.filename = filename || '<unknown>';
    this.position = new Position(0, 0, 0);
    this.length = source.length;
  }

  /**
   * Vérifier s'il reste des caractères
   */
  public hasNext(): boolean {
    return this.position.index < this.length;
  }

  /**
   * Obtenir le caractère courant
   */
  public peek(offset: number = 0): string | null {
    const index = this.position.index + offset;
    if (index >= this.length) {
      return null;
    }
    return this.source[index];
  }

  /**
   * Obtenir le caractère suivant et avancer
   */
  public next(): string | null {
    if (!this.hasNext()) {
      return null;
    }

    const char = this.source[this.position.index];
    this.advance(char);
    return char;
  }

  /**
   * Avancer d'un caractère
   */
  private advance(char: string): void {
    this.position.index++;
    
    if (char === '\n') {
      this.position.line++;
      this.position.column = 0;
    } else {
      this.position.column++;
    }
  }

  /**
   * Reculer d'un caractère
   */
  public retreat(): void {
    if (this.position.index > 0) {
      this.position.index--;
      const char = this.source[this.position.index];
      
      if (char === '\n') {
        this.position.line--;
        // Trouver la fin de la ligne précédente
        let col = 0;
        for (let i = this.position.index - 1; i >= 0; i--) {
          if (this.source[i] === '\n') {
            break;
          }
          col++;
        }
        this.position.column = col;
      } else {
        this.position.column--;
      }
    }
  }

  /**
   * Obtenir la position actuelle
   */
  public getPosition(): Position {
    return new Position(
      this.position.index,
      this.position.line,
      this.position.column
    );
  }

  /**
   * Obtenir le nom du fichier
   */
  public getFilename(): string {
    return this.filename;
  }

  /**
   * Définir la position
   */
  public setPosition(position: Position): void {
    this.position = new Position(position.index, position.line, position.column);
  }

  /**
   * Obtenir la sous-chaîne à partir de la position actuelle
   */
  public substring(length: number): string {
    const end = Math.min(this.position.index + length, this.length);
    return this.source.slice(this.position.index, end);
  }

  /**
   * Vérifier si le caractère suivant correspond à une chaîne
   */
  public matchNext(expected: string): boolean {
    const next = this.peek(expected.length - 1);
    return this.substring(expected.length) === expected;
  }

  /**
   * Consommer une chaîne si elle correspond
   */
  public consume(expected: string): boolean {
    if (this.matchNext(expected)) {
      for (let i = 0; i < expected.length; i++) {
        this.next();
      }
      return true;
    }
    return false;
  }

  /**
   * Sauter les espaces blancs
   */
  public skipWhitespace(): void {
    while (this.hasNext()) {
      const char = this.peek();
      if (char && /\s/.test(char)) {
        this.next();
      } else {
        break;
      }
    }
  }

  /**
   * Sauter jusqu'à la fin de la ligne
   */
  public skipToEndOfLine(): void {
    while (this.hasNext()) {
      const char = this.peek();
      if (char === '\n') {
        this.next();
        break;
      }
      this.next();
    }
  }

  /**
   * Sauter jusqu'à un caractère spécifique
   */
  public skipUntil(char: string): void {
    while (this.hasNext()) {
      if (this.peek() === char) {
        break;
      }
      this.next();
    }
  }

  /**
   * Configurer le scanner
   */
  public configure(config: Config): void {
    this.config = config;
  }

  /**
   * Réinitialiser le scanner
   */
  public reset(): void {
    this.source = '';
    this.filename = '<unknown>';
    this.position = new Position(0, 0, 0);
    this.length = 0;
  }
}
