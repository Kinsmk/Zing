/**
 * Formatter - Formatage avancé des diagnostics pour Zinga
 * 
 * Ce module fournit des fonctionnalités avancées pour le formatage
 * et l'affichage des diagnostics.
 */

import { Diagnostic, DiagnosticFormatter, Severity } from './errors';
import { SourceLocation } from '../lexer/positions';

/**
 * Options de formatage
 */
export interface FormatOptions {
  useColors?: boolean;
  showCode?: boolean;
  showSeverity?: boolean;
  showLocation?: boolean;
  showHint?: boolean;
  showRelated?: boolean;
  showStack?: boolean;
  showErrorCode?: boolean;
  maxContextLines?: number;
  maxMessageLength?: number;
}

/**
 * Formateur de diagnostics avancé
 */
export class AdvancedDiagnosticFormatter extends DiagnosticFormatter {
  private options: FormatOptions;

  constructor(options: FormatOptions = {}) {
    super(options.useColors || false);
    this.options = {
      useColors: true,
      showCode: true,
      showSeverity: true,
      showLocation: true,
      showHint: true,
      showRelated: true,
      showStack: true,
      showErrorCode: true,
      maxContextLines: 3,
      maxMessageLength: 100,
      ...options,
    };
  }

  /**
   * Formater un diagnostic avec contexte
   */
  public formatWithContext(
    diagnostic: Diagnostic,
    source: string,
    filename?: string
  ): string {
    const lines: string[] = [];

    // En-tête
    lines.push(this.formatHeader(diagnostic));

    // Contexte source
    if (this.options.showCode && source) {
      lines.push('');
      lines.push(...this.formatSourceContext(diagnostic, source, filename));
    }

    // Indice
    if (this.options.showHint && diagnostic.hint) {
      lines.push('');
      lines.push(this.formatHint(diagnostic.hint));
    }

    // Diagnostics liés
    if (this.options.showRelated && diagnostic.related && diagnostic.related.length > 0) {
      lines.push('');
      lines.push(this.formatRelated(diagnostic.related));
    }

    // Stack trace
    if (this.options.showStack && diagnostic.stack) {
      lines.push('');
      lines.push(this.formatStack(diagnostic.stack));
    }

    return lines.join('\n');
  }

  /**
   * Formater plusieurs diagnostics avec contexte
   */
  public formatAllWithContext(
    diagnostics: Diagnostic[],
    source: string,
    filename?: string
  ): string {
    return diagnostics.map(d => this.formatWithContext(d, source, filename)).join('\n\n');
  }

  /**
   * Formater l'en-tête du diagnostic
   */
  private formatHeader(diagnostic: Diagnostic): string {
    const parts: string[] = [];

    if (this.options.showSeverity) {
      parts.push(this.formatSeverity(diagnostic.severity));
    }

    if (this.options.showErrorCode) {
      parts.push(this.formatCode(diagnostic.code));
    }

    if (this.options.showLocation) {
      parts.push(this.formatLocation(diagnostic.location));
    }

    // Message (tronqué si nécessaire)
    let message = diagnostic.message;
    if (this.options.maxMessageLength && message.length > this.options.maxMessageLength) {
      message = message.substring(0, this.options.maxMessageLength) + '...';
    }
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Formater le contexte source
   */
  private formatSourceContext(
    diagnostic: Diagnostic,
    source: string,
    filename?: string
  ): string[] {
    const lines: string[] = [];
    const sourceLines = source.split('\n');
    const lineNumber = diagnostic.location.start.line;
    const columnNumber = diagnostic.location.start.column;
    const endLineNumber = diagnostic.location.end.line;
    
    // Calculer la plage de lignes à afficher
    let startLine = Math.max(0, lineNumber - Math.floor(this.options.maxContextLines! / 2));
    let endLine = Math.min(sourceLines.length - 1, lineNumber + Math.ceil(this.options.maxContextLines! / 2));

    // S'assurer que la plage contient au moins la ligne de l'erreur
    if (lineNumber < startLine) startLine = lineNumber;
    if (lineNumber > endLine) endLine = lineNumber;

    // Calculer la largeur du numéro de ligne
    const lineNumberWidth = String(endLine + 1).length;

    // Ajouter les lignes de contexte
    for (let i = startLine; i <= endLine; i++) {
      const line = sourceLines[i] || '';
      const isErrorLine = i >= lineNumber && i <= endLineNumber;
      const gutter = String(i + 1).padStart(lineNumberWidth);

      if (isErrorLine) {
        // Ligne avec erreur
        lines.push(`    ${gutter} | ${line}`);
        
        // Indicateur de position
        const startCol = i === lineNumber ? columnNumber : 0;
        const endCol = i === endLineNumber ? diagnostic.location.end.column : line.length;
        const underlineLength = Math.max(1, endCol - startCol);
        const underline = ' '.repeat(startCol) + '^'.repeat(underlineLength);
        lines.push(`       | ${underline}`);
      } else {
        // Ligne de contexte
        lines.push(`    ${gutter} | ${line}`);
      }
    }

    return lines;
  }

  /**
   * Formater un indice
   */
  protected formatHint(hint: string): string {
    const color = this.useColors ? '\x1b[90m' : ''; // Gris
    const reset = this.useColors ? '\x1b[0m' : '';
    return `${color}    hint: ${hint}${reset}`;
  }

  /**
   * Formater les diagnostics liés
   */
  private formatRelated(related: Diagnostic[]): string {
    const color = this.useColors ? '\x1b[90m' : ''; // Gris
    const reset = this.useColors ? '\x1b[0m' : '';
    
    return related.map(d => {
      return `${color}    related: ${this.formatLocation(d.location)}: ${d.message}${reset}`;
    }).join('\n');
  }

  /**
   * Formater la stack trace
   */
  private formatStack(stack: string): string {
    const color = this.useColors ? '\x1b[90m' : ''; // Gris
    const reset = this.useColors ? '\x1b[0m' : '';
    
    return stack.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `${color}    ${line}${reset}`)
      .join('\n');
  }

  /**
   * Formater un diagnostic en JSON
   */
  public formatJSON(diagnostic: Diagnostic): string {
    return JSON.stringify(diagnostic, null, 2);
  }

  /**
   * Formater plusieurs diagnostics en JSON
   */
  public formatAllJSON(diagnostics: Diagnostic[]): string {
    return JSON.stringify(diagnostics, null, 2);
  }

  /**
   * Formater un diagnostic en HTML
   */
  public formatHTML(diagnostic: Diagnostic): string {
    const severityClass = this.getSeverityClass(diagnostic.severity);
    const severityLabel = this.getSeverityLabel(diagnostic.severity);

    return `
<div class="diagnostic ${severityClass}">
  <div class="diagnostic-header">
    <span class="severity">${severityLabel}</span>
    <span class="code">[${diagnostic.code}]</span>
    <span class="location">${this.formatLocation(diagnostic.location)}</span>
  </div>
  <div class="diagnostic-message">${this.escapeHTML(diagnostic.message)}</div>
  ${diagnostic.hint ? `<div class="diagnostic-hint">hint: ${this.escapeHTML(diagnostic.hint)}</div>` : ''}
</div>
    `;
  }

  /**
   * Formater plusieurs diagnostics en HTML
   */
  public formatAllHTML(diagnostics: Diagnostic[]): string {
    return diagnostics.map(d => this.formatHTML(d)).join('\n');
  }

  /**
   * Échapper le HTML
   */
  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Obtenir la classe CSS pour la sévérité
   */
  private getSeverityClass(severity: Severity): string {
    const classes = {
      error: 'error',
      warning: 'warning',
      info: 'info',
      debug: 'debug',
    };
    return classes[severity] || 'info';
  }

  /**
   * Obtenir le label pour la sévérité
   */
  private getSeverityLabel(severity: Severity): string {
    const labels = {
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
      debug: 'Debug',
    };
    return labels[severity] || severity;
  }

  /**
   * Formater un diagnostic en Markdown
   */
  public formatMarkdown(diagnostic: Diagnostic): string {
    const severity = this.formatSeverity(diagnostic.severity);
    const code = this.formatCode(diagnostic.code);
    const location = this.formatLocation(diagnostic.location);
    const message = diagnostic.message;

    let result = `### ${severity} ${code}\n\n`;
    result += `**Location:** ${location}\n\n`;
    result += `**Message:** ${message}\n`;

    if (diagnostic.hint) {
      result += `\n**Hint:** ${diagnostic.hint}\n`;
    }

    if (diagnostic.related && diagnostic.related.length > 0) {
      result += `\n**Related:**\n`;
      for (const related of diagnostic.related) {
        result += `- ${this.formatLocation(related.location)}: ${related.message}\n`;
      }
    }

    return result;
  }

  /**
   * Formater plusieurs diagnostics en Markdown
   */
  public formatAllMarkdown(diagnostics: Diagnostic[]): string {
    return diagnostics.map(d => this.formatMarkdown(d)).join('\n---\n');
  }

  /**
   * Formater un rapport de diagnostics
   */
  public formatReport(diagnostics: Diagnostic[]): string {
    const errors = diagnostics.filter(d => d.severity === 'error');
    const warnings = diagnostics.filter(d => d.severity === 'warning');
    const infos = diagnostics.filter(d => d.severity === 'info');

    let report = '## Diagnostic Report\n\n';
    report += `**Total:** ${diagnostics.length}\n`;
    report += `**Errors:** ${errors.length}\n`;
    report += `**Warnings:** ${warnings.length}\n`;
    report += `**Infos:** ${infos.length}\n\n`;

    if (errors.length > 0) {
      report += '### Errors\n\n';
      report += this.formatAllMarkdown(errors);
    }

    if (warnings.length > 0) {
      report += '\n### Warnings\n\n';
      report += this.formatAllMarkdown(warnings);
    }

    if (infos.length > 0) {
      report += '\n### Infos\n\n';
      report += this.formatAllMarkdown(infos);
    }

    return report;
  }

  /**
   * Formater un résumé des diagnostics
   */
  public formatSummary(diagnostics: Diagnostic[]): string {
    const errors = diagnostics.filter(d => d.severity === 'error');
    const warnings = diagnostics.filter(d => d.severity === 'warning');
    const infos = diagnostics.filter(d => d.severity === 'info');

    const errorColor = this.useColors ? '\x1b[31m' : '';
    const warningColor = this.useColors ? '\x1b[33m' : '';
    const infoColor = this.useColors ? '\x1b[36m' : '';
    const reset = this.useColors ? '\x1b[0m' : '';

    let summary = '';
    
    if (errors.length > 0) {
      summary += `${errorColor}Found ${errors.length} error(s)${reset}`;
    }

    if (warnings.length > 0) {
      if (summary.length > 0) summary += ', ';
      summary += `${warningColor}${warnings.length} warning(s)${reset}`;
    }

    if (infos.length > 0) {
      if (summary.length > 0) summary += ', ';
      summary += `${infoColor}${infos.length} info(s)${reset}`;
    }

    if (summary.length === 0) {
      summary = 'No issues found';
    }

    return summary;
  }

  /**
   * Configurer les options
   */
  public configure(options: FormatOptions): void {
    this.options = { ...this.options, ...options };
    this.setUseColors(options.useColors || this.options.useColors);
  }
}

/**
 * Créer un formateur de diagnostics avancé
 */
export function createAdvancedFormatter(options?: FormatOptions): AdvancedDiagnosticFormatter {
  return new AdvancedDiagnosticFormatter(options);
}

/**
 * Formater un diagnostic avec contexte
 */
export function formatDiagnosticWithContext(
  diagnostic: Diagnostic,
  source: string,
  filename?: string,
  options?: FormatOptions
): string {
  const formatter = new AdvancedDiagnosticFormatter(options);
  return formatter.formatWithContext(diagnostic, source, filename);
}

/**
 * Formater un rapport de diagnostics
 */
export function formatDiagnosticReport(
  diagnostics: Diagnostic[],
  source: string,
  filename?: string,
  options?: FormatOptions
): string {
  const formatter = new AdvancedDiagnosticFormatter(options);
  return formatter.formatReport(diagnostics);
}

/**
 * Formater un résumé des diagnostics
 */
export function formatDiagnosticSummary(
  diagnostics: Diagnostic[],
  options?: FormatOptions
): string {
  const formatter = new AdvancedDiagnosticFormatter(options);
  return formatter.formatSummary(diagnostics);
}
