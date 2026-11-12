/**
 * SourceMap - Gestion des source maps pour Zinga
 * 
 * Ce module gère la génération et l'utilisation des source maps
 * pour le débogage et le mapping entre le code source et le code généré.
 */

import { SourceLocation } from '../lexer/positions';

/**
 * Position dans le code généré
 */
export interface GeneratedPosition {
  line: number;
  column: number;
}

/**
 * Position dans le code source
 */
export interface SourcePosition {
  source: string;
  line: number;
  column: number;
  name?: string;
}

/**
 * Mapping entre code généré et code source
 */
export interface Mapping {
  generated: GeneratedPosition;
  source: SourcePosition | null;
}

/**
 * Segment de source map
 */
export interface SourceMapSegment {
  generatedLine: number;
  generatedColumn: number;
  source?: string;
  sourceLine?: number;
  sourceColumn?: number;
  name?: string;
}

/**
 * Source map
 */
export interface SourceMap {
  version: number;
  sources: string[];
  names: string[];
  mappings: string;
  sourceRoot?: string;
  file?: string;
}

/**
 * Générateur de source map
 */
export class SourceMapGenerator {
  private version: number = 3;
  private sources: Set<string> = new Set();
  private names: Set<string> = new Set();
  private mappings: SourceMapSegment[] = [];
  private sourceRoot?: string;
  private file?: string;
  private currentLine: number = 0;
  private currentColumn: number = 0;
  private currentSource?: string;
  private currentSourceLine: number = 0;
  private currentSourceColumn: number = 0;

  constructor(file?: string, sourceRoot?: string) {
    this.file = file;
    this.sourceRoot = sourceRoot;
  }

  /**
   * Définir le fichier de sortie
   */
  public setFile(file: string): void {
    this.file = file;
  }

  /**
   * Définir le répertoire racine des sources
   */
  public setSourceRoot(sourceRoot: string): void {
    this.sourceRoot = sourceRoot;
  }

  /**
   * Ajouter une source
   */
  public addSource(source: string): void {
    this.sources.add(source);
  }

  /**
   * Ajouter un nom
   */
  public addName(name: string): void {
    this.names.add(name);
  }

  /**
   * Définir la position actuelle dans le code généré
   */
  public setPosition(line: number, column: number): void {
    this.currentLine = line;
    this.currentColumn = column;
  }

  /**
   * Définir la source actuelle
   */
  public setSource(source: string, line: number = 0, column: number = 0): void {
    this.currentSource = source;
    this.currentSourceLine = line;
    this.currentSourceColumn = column;
    this.addSource(source);
  }

  /**
   * Ajouter un mapping
   */
  public addMapping(
    generatedLine: number,
    generatedColumn: number,
    source?: string,
    sourceLine?: number,
    sourceColumn?: number,
    name?: string
  ): void {
    if (source) {
      this.addSource(source);
    }
    if (name) {
      this.addName(name);
    }

    this.mappings.push({
      generatedLine,
      generatedColumn,
      source,
      sourceLine,
      sourceColumn,
      name,
    });
  }

  /**
   * Ajouter un mapping avec la position actuelle
   */
  public addMappingHere(name?: string): void {
    this.addMapping(
      this.currentLine,
      this.currentColumn,
      this.currentSource,
      this.currentSourceLine,
      this.currentSourceColumn,
      name
    );
  }

  /**
   * Avancer dans le code généré
   */
  public advance(column: number): void {
    this.currentColumn += column;
  }

  /**
   * Nouvelle ligne dans le code généré
   */
  public newLine(): void {
    this.currentLine++;
    this.currentColumn = 0;
  }

  /**
   * Générer la source map
   */
  public generate(): SourceMap {
    // Trier les mappings par position générée
    this.mappings.sort((a, b) => {
      if (a.generatedLine !== b.generatedLine) {
        return a.generatedLine - b.generatedLine;
      }
      return a.generatedColumn - b.generatedColumn;
    });

    // Générer la chaîne de mappings
    const mappingsString = this.generateMappingsString();

    return {
      version: this.version,
      sources: Array.from(this.sources),
      names: Array.from(this.names),
      mappings: mappingsString,
      sourceRoot: this.sourceRoot,
      file: this.file,
    };
  }

  /**
   * Générer la chaîne de mappings
   */
  private generateMappingsString(): string {
    let result = '';
    let prevLine = 0;
    let prevColumn = 0;
    let prevSource = 0;
    let prevSourceLine = 0;
    let prevSourceColumn = 0;
    let prevName = 0;

    for (const mapping of this.mappings) {
      const sourceIndex = mapping.source ? this.getSourceIndex(mapping.source) : -1;
      const nameIndex = mapping.name ? this.getNameIndex(mapping.name) : -1;

      // Calculer les deltas
      const lineDelta = mapping.generatedLine - prevLine;
      const columnDelta = mapping.generatedColumn - prevColumn;
      const sourceDelta = sourceIndex - prevSource;
      const sourceLineDelta = (mapping.sourceLine || 0) - prevSourceLine;
      const sourceColumnDelta = (mapping.sourceColumn || 0) - prevSourceColumn;
      const nameDelta = nameIndex - prevName;

      // Encoder les deltas en VLQ
      const parts: number[] = [
        lineDelta,
        columnDelta,
        sourceDelta,
        sourceLineDelta,
        sourceColumnDelta,
      ];

      if (nameIndex >= 0) {
        parts.push(nameDelta);
      }

      const encoded = parts.map(delta => this.encodeVLQ(delta)).join('');
      result += encoded;

      // Mettre à jour les valeurs précédentes
      prevLine = mapping.generatedLine;
      prevColumn = mapping.generatedColumn;
      prevSource = sourceIndex;
      prevSourceLine = mapping.sourceLine || 0;
      prevSourceColumn = mapping.sourceColumn || 0;
      prevName = nameIndex;
    }

    return result;
  }

  /**
   * Obtenir l'index d'une source
   */
  private getSourceIndex(source: string): number {
    const sources = Array.from(this.sources);
    return sources.indexOf(source);
  }

  /**
   * Obtenir l'index d'un nom
   */
  private getNameIndex(name: string): number {
    const names = Array.from(this.names);
    return names.indexOf(name);
  }

  /**
   * Encoder un nombre en VLQ (Variable Length Quantity)
   */
  private encodeVLQ(value: number): string {
    const VLQ_BASE_SHIFT = 5;
    const VLQ_BASE = 1 << VLQ_BASE_SHIFT;
    const VLQ_BASE_MASK = VLQ_BASE - 1;
    const VLQ_CONTINUATION_BIT = VLQ_BASE;

    let encoded = '';
    let digit: number;

    // Gérer les nombres négatifs
    value = value < 0 ? ((-value << 1) | 1) : (value << 1);

    do {
      digit = value & VLQ_BASE_MASK;
      value >>>= VLQ_BASE_SHIFT;
      if (value > 0) {
        digit |= VLQ_CONTINUATION_BIT;
      }
      encoded += this.encodeBase64(digit);
    } while (value > 0);

    return encoded;
  }

  /**
   * Encoder un digit en Base64
   */
  private encodeBase64(digit: number): string {
    const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    return base64[digit];
  }

  /**
   * Réinitialiser le générateur
   */
  public reset(): void {
    this.sources.clear();
    this.names.clear();
    this.mappings = [];
    this.currentLine = 0;
    this.currentColumn = 0;
    this.currentSource = undefined;
    this.currentSourceLine = 0;
    this.currentSourceColumn = 0;
  }
}

/**
 * Consommateur de source map
 */
export class SourceMapConsumer {
  private version: number;
  private sources: string[];
  private names: string[];
  private mappings: Mapping[];
  private sourceRoot?: string;
  private file?: string;

  constructor(sourceMap: SourceMap) {
    this.version = sourceMap.version;
    this.sources = sourceMap.sources;
    this.names = sourceMap.names;
    this.sourceRoot = sourceMap.sourceRoot;
    this.file = sourceMap.file;
    this.mappings = this.parseMappings(sourceMap.mappings);
  }

  /**
   * Analyser les mappings
   */
  private parseMappings(mappingsString: string): Mapping[] {
    const mappings: Mapping[] = [];
    let line = 0;
    let column = 0;
    let prevSource: string | null = null;
    let prevSourceLine = 0;
    let prevSourceColumn = 0;
    let prevName: string | null = null;

    let i = 0;
    while (i < mappingsString.length) {
      const char = mappingsString[i];
      
      if (char === ';') {
        // Nouvelle ligne
        line++;
        column = 0;
        i++;
        continue;
      }

      if (char === ',') {
        // Nouvelle colonne
        column++;
        i++;
        continue;
      }

      // Lire un segment VLQ
      let value = 0;
      let shift = 0;
      let more = true;

      while (more) {
        const digit = this.decodeBase64(char);
        if (digit === -1) {
          i++;
          continue;
        }

        value |= (digit & 0x1f) << shift;
        shift += 5;
        more = (digit & 0x20) !== 0;

        i++;
        if (i >= mappingsString.length) break;
      }

      // Décoder la valeur VLQ
      const decoded = this.decodeVLQ(value);

      // Le premier segment est toujours la colonne
      if (mappings.length === 0 || mappings[mappings.length - 1].generated.line !== line) {
        column = decoded;
      } else {
        column += decoded;
      }

      // Créer le mapping
      mappings.push({
        generated: { line, column },
        source: prevSource ? {
          source: prevSource,
          line: prevSourceLine,
          column: prevSourceColumn,
          name: prevName || undefined,
        } : null,
      });

      // Mettre à jour les valeurs précédentes
      // (simplifié - une implémentation complète nécessiterait de parser tous les segments)
    }

    return mappings;
  }

  /**
   * Décoder un digit Base64
   */
  private decodeBase64(char: string): number {
    const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    return base64.indexOf(char);
  }

  /**
   * Décoder une valeur VLQ
   */
  private decodeVLQ(value: number): number {
    const isNegative = (value & 1) === 1;
    const result = value >>> 1;
    return isNegative ? -result : result;
  }

  /**
   * Obtenir la position source pour une position générée
   */
  public getSourcePosition(line: number, column: number): SourcePosition | null {
    // Trouver le mapping le plus proche
    const mapping = this.findMapping(line, column);
    
    if (!mapping || !mapping.source) {
      return null;
    }

    return mapping.source;
  }

  /**
   * Trouver un mapping pour une position générée
   */
  private findMapping(line: number, column: number): Mapping | null {
    // Recherche binaire pour trouver le mapping
    let left = 0;
    let right = this.mappings.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const mapping = this.mappings[mid];

      if (mapping.generated.line < line || 
          (mapping.generated.line === line && mapping.generated.column <= column)) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return right >= 0 ? this.mappings[right] : null;
  }

  /**
   * Obtenir toutes les sources
   */
  public getSources(): string[] {
    return [...this.sources];
  }

  /**
   * Obtenir le contenu d'une source
   */
  public getSourceContent(source: string): string | null {
    // Dans une implémentation réelle, on lirait le fichier
    return null;
  }

  /**
   * Obtenir le nom du fichier
   */
  public getFile(): string | undefined {
    return this.file;
  }

  /**
   * Obtenir le répertoire racine des sources
   */
  public getSourceRoot(): string | undefined {
    return this.sourceRoot;
  }
}

/**
 * Utilitaire pour créer des source maps
 */
export class SourceMapUtil {
  /**
   * Créer un générateur de source map
   */
  public static createGenerator(file?: string, sourceRoot?: string): SourceMapGenerator {
    return new SourceMapGenerator(file, sourceRoot);
  }

  /**
   * Créer un consommateur de source map
   */
  public static createConsumer(sourceMap: SourceMap): SourceMapConsumer {
    return new SourceMapConsumer(sourceMap);
  }

  /**
   * Convertir une SourceLocation en position pour la source map
   */
  public static locationToPosition(location: SourceLocation): { line: number; column: number } {
    return {
      line: location.start.line + 1, // +1 car les source maps sont 1-based
      column: location.start.column,
    };
  }

  /**
   * Convertir une position en SourceLocation
   */
  public static positionToLocation(
    line: number,
    column: number,
    filename: string
  ): SourceLocation {
    return new SourceLocation(
      filename,
      { line: line - 1, column, index: 0 }, // -1 car les source maps sont 1-based
      { line: line - 1, column, index: 0 }
    );
  }

  /**
   * Générer une source map pour un fichier
   */
  public static generateSourceMap(
    generatedCode: string,
    source: string,
    filename: string,
    mappings: { generated: { line: number; column: number }; source: { line: number; column: number } }[]
  ): SourceMap {
    const generator = new SourceMapGenerator(filename);
    generator.addSource(filename);

    for (const mapping of mappings) {
      generator.addMapping(
        mapping.generated.line,
        mapping.generated.column,
        filename,
        mapping.source.line,
        mapping.source.column
      );
    }

    return generator.generate();
  }

  /**
   * Appliquer une source map à une position
   */
  public static applySourceMap(
    line: number,
    column: number,
    sourceMap: SourceMap
  ): SourcePosition | null {
    const consumer = new SourceMapConsumer(sourceMap);
    return consumer.getSourcePosition(line, column);
  }
}

/**
 * Exporter les utilitaires
 */
export const SourceMapTools = SourceMapUtil;
