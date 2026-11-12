/**
 * Positions - Gestion des positions dans le code source
 * 
 * Ce module gère les positions des caractères dans le code source,
 * ce qui est essentiel pour le reporting d'erreurs.
 */

export class Position {
  constructor(
    public index: number,
    public line: number,
    public column: number
  ) {}

  /**
   * Créer une nouvelle position avec un décalage
   */
  public offsetBy(offset: number): Position {
    return new Position(this.index + offset, this.line, this.column + offset);
  }

  /**
   * Vérifier si cette position est avant une autre
   */
  public isBefore(other: Position): boolean {
    if (this.line < other.line) return true;
    if (this.line > other.line) return false;
    return this.column < other.column;
  }

  /**
   * Vérifier si cette position est après une autre
   */
  public isAfter(other: Position): boolean {
    if (this.line > other.line) return true;
    if (this.line < other.line) return false;
    return this.column > other.column;
  }

  /**
   * Vérifier si cette position est égale à une autre
   */
  public equals(other: Position): boolean {
    return this.index === other.index && this.line === other.line && this.column === other.column;
  }

  /**
   * Convertir en objet JSON
   */
  public toJSON(): { index: number; line: number; column: number } {
    return {
      index: this.index,
      line: this.line,
      column: this.column,
    };
  }

  /**
   * Convertir en chaîne
   */
  public toString(): string {
    return `Position(index: ${this.index}, line: ${this.line}, column: ${this.column})`;
  }

  /**
   * Créer une position à partir d'un objet JSON
   */
  public static fromJSON(json: { index: number; line: number; column: number }): Position {
    return new Position(json.index, json.line, json.column);
  }

  /**
   * Créer une position initiale
   */
  public static zero(): Position {
    return new Position(0, 0, 0);
  }
}

export class SourceLocation {
  constructor(
    public readonly filename: string,
    public readonly start: Position,
    public readonly end: Position
  ) {}

  /**
   * Obtenir la ligne de début
   */
  public get startLine(): number {
    return this.start.line;
  }

  /**
   * Obtenir la colonne de début
   */
  public get startColumn(): number {
    return this.start.column;
  }

  /**
   * Obtenir la ligne de fin
   */
  public get endLine(): number {
    return this.end.line;
  }

  /**
   * Obtenir la colonne de fin
   */
  public get endColumn(): number {
    return this.end.column;
  }

  /**
   * Vérifier si la location est valide
   */
  public isValid(): boolean {
    return this.start.isBefore(this.end) || this.start.equals(this.end);
  }

  /**
   * Fusionner avec une autre location
   */
  public merge(other: SourceLocation): SourceLocation {
    const newStart = this.start.isBefore(other.start) ? this.start : other.start;
    const newEnd = this.end.isAfter(other.end) ? this.end : other.end;
    return new SourceLocation(this.filename, newStart, newEnd);
  }

  /**
   * Convertir en chaîne
   */
  public toString(): string {
    if (this.start.line === this.end.line) {
      return `${this.filename}:${this.start.line + 1}:${this.start.column + 1}-${this.end.column + 1}`;
    }
    return `${this.filename}:${this.start.line + 1}:${this.start.column + 1}-${this.end.line + 1}:${this.end.column + 1}`;
  }

  /**
   * Convertir en format court (pour les erreurs)
   */
  public toErrorString(): string {
    if (this.start.line === this.end.line) {
      return `at ${this.filename}:${this.start.line + 1}:${this.start.column + 1}`;
    }
    return `at ${this.filename}:${this.start.line + 1}:${this.start.column + 1}-${this.end.line + 1}:${this.end.column + 1}`;
  }

  /**
   * Convertir en objet JSON
   */
  public toJSON(): { filename: string; start: { index: number; line: number; column: number }; end: { index: number; line: number; column: number } } {
    return {
      filename: this.filename,
      start: this.start.toJSON(),
      end: this.end.toJSON(),
    };
  }

  /**
   * Créer une location à partir d'un objet JSON
   */
  public static fromJSON(json: { filename: string; start: { index: number; line: number; column: number }; end: { index: number; line: number; column: number } }): SourceLocation {
    return new SourceLocation(
      json.filename,
      Position.fromJSON(json.start),
      Position.fromJSON(json.end)
    );
  }

  /**
   * Créer une location pour un seul point
   */
  public static point(filename: string, position: Position): SourceLocation {
    return new SourceLocation(filename, position, position);
  }

  /**
   * Créer une location entre deux positions
   */
  public static between(filename: string, start: Position, end: Position): SourceLocation {
    return new SourceLocation(filename, start, end);
  }
}
