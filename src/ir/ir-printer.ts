/**
 * IR Printer - Impression de l'IR pour Zinga
 * 
 * Ce module fournit des utilitaires pour imprimer la representation intermediaire
 * dans differents formats (texte, JSON, DOT, etc.).
 */

import {
  IRModule,
  IRFunction,
  IRFunctionParameter,
  IRFunctionBody,
  BasicBlock,
  IRInstruction,
  IRValue,
  IRVariable,
  IRConstant,
  IRReturn,
  IRBranch,
  IRConditionalBranch,
  IRCall,
  IRAllocate,
  IRStore,
  IRLoad,
  IRBinaryOperation,
  IRUnaryOperation,
  IRCompare,
  IRPhi,
  IRNop,
  IRUnreachable,
  BinaryOp,
  UnaryOp,
  CompareOp,
  IRNodeType,
} from './ir-nodes';

/**
 * Format de sortie
 */
export enum OutputFormat {
  Text = 'text',
  JSON = 'json',
  DOT = 'dot',
}

/**
 * Options d'impression
 */
export interface PrintOptions {
  format: OutputFormat;
  indent: number;
  showTypes: boolean;
  showLocations: boolean;
  showStats: boolean;
}

/**
 * Resultat de l'impression
 */
export interface PrintResult {
  output: string;
  stats: PrintStats;
}

/**
 * Statistiques d'impression
 */
export interface PrintStats {
  modules: number;
  functions: number;
  blocks: number;
  instructions: number;
  lines: number;
}

/**
 * Imprimeur d'IR
 */
export class IRPrinter {
  private options: PrintOptions;
  
  constructor(options: Partial<PrintOptions> = {}) {
    this.options = {
      format: OutputFormat.Text,
      indent: 2,
      showTypes: true,
      showLocations: true,
      showStats: true,
      ...options,
    };
  }
  
  /**
   * Imprimer un module IR
   */
  print(module: IRModule): PrintResult {
    let output: string;
    
    switch (this.options.format) {
      case OutputFormat.Text:
        output = this.printText(module);
        break;
      case OutputFormat.JSON:
        output = this.printJSON(module);
        break;
      case OutputFormat.DOT:
        output = this.printDOT(module);
        break;
      default:
        output = this.printText(module);
    }
    
    const stats = this.calculateStats(module);
    
    if (this.options.showStats && this.options.format === OutputFormat.Text) {
      output += '\n\n' + this.printStats(stats);
    }
    
    return { output, stats };
  }
  
  /**
   * Imprimer en format texte
   */
  private printText(module: IRModule): string {
    const lines: string[] = [];
    
    lines.push(`// Zinga IR Module: ${module.name}`);
    lines.push('');
    
    // Imprimer les variables globales
    if (module.globals.length > 0) {
      lines.push('// Global Variables');
      for (const global of module.globals) {
        lines.push(this.printVariable(global, 0));
      }
      lines.push('');
    }
    
    // Imprimer les fonctions
    for (const func of module.functions) {
      lines.push(this.printFunction(func));
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  /**
   * Imprimer une fonction
   */
  private printFunction(func: IRFunction): string {
    const lines: string[] = [];
    const indent = '  ';
    
    // En-tete de la fonction
    const visibility = func.isPublic ? 'public ' : '';
    const modifier = func.isStatic ? 'static ' : '';
    const params = func.parameters.map(p => this.printParameter(p)).join(', ');
    
    lines.push(`${visibility}${modifier}function ${func.name}(${params}) -> ${func.returnType}`);
    lines.push('{');
    
    // Imprimer le corps
    for (const block of func.body.blocks) {
      lines.push(...this.printBlock(block, 1).map(l => indent + l));
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }
  
  /**
   * Imprimer un parametre
   */
  private printParameter(param: IRFunctionParameter): string {
    return `${param.name}: ${param.irType}`;
  }
  
  /**
   * Imprimer un bloc
   */
  private printBlock(block: BasicBlock, indentLevel: number): string[] {
    const lines: string[] = [];
    const indent = '  '.repeat(indentLevel);
    
    // Label du bloc
    lines.push(`${indent}${block.label}:`);
    
    // Instructions
    for (const instruction of block.instructions) {
      const instLines = this.printInstruction(instruction, indentLevel + 1);
      lines.push(...instLines);
    }
    
    // Terminateur
    if (block.terminator) {
      const termLines = this.printInstruction(block.terminator, indentLevel + 1);
      lines.push(...termLines);
    }
    
    return lines;
  }
  
  /**
   * Imprimer une instruction
   */
  private printInstruction(instruction: IRInstruction, indentLevel: number): string[] {
    const indent = '  '.repeat(indentLevel);
    
    switch (instruction.type) {
      case IRNodeType.Return:
        return [this.printReturn(instruction as IRReturn, indent)];
      
      case IRNodeType.Branch:
        return [this.printBranch(instruction as IRBranch, indent)];
      
      case IRNodeType.ConditionalBranch:
        return [this.printConditionalBranch(instruction as IRConditionalBranch, indent)];
      
      case IRNodeType.Call:
        return [this.printCall(instruction as IRCall, indent)];
      
      case IRNodeType.Allocate:
        return [this.printAllocate(instruction as IRAllocate, indent)];
      
      case IRNodeType.Store:
        return [this.printStore(instruction as IRStore, indent)];
      
      case IRNodeType.Load:
        return [this.printLoad(instruction as IRLoad, indent)];
      
      case IRNodeType.BinaryOperation:
        return [this.printBinaryOperation(instruction as IRBinaryOperation, indent)];
      
      case IRNodeType.UnaryOperation:
        return [this.printUnaryOperation(instruction as IRUnaryOperation, indent)];
      
      case IRNodeType.Compare:
        return [this.printCompare(instruction as IRCompare, indent)];
      
      case IRNodeType.Phi:
        return [this.printPhi(instruction as IRPhi, indent)];
      
      case IRNodeType.Nop:
        return [this.printNop(instruction as IRNop, indent)];
      
      case IRNodeType.Unreachable:
        return [this.printUnreachable(instruction as IRUnreachable, indent)];
      
      default:
        return [`${indent}// Unknown instruction: ${instruction.type}`];
    }
  }
  
  /**
   * Imprimer une instruction Return
   */
  private printReturn(ret: IRReturn, indent: string): string {
    const value = ret.value ? this.printValue(ret.value) : 'void';
    return `${indent}return ${value};`;
  }
  
  /**
   * Imprimer une instruction Branch
   */
  private printBranch(branch: IRBranch, indent: string): string {
    return `${indent}br ${(branch as any).target.label};`;
  }
  
  /**
   * Imprimer une instruction ConditionalBranch
   */
  private printConditionalBranch(condBranch: IRConditionalBranch, indent: string): string {
    const condition = this.printValue((condBranch as any).condition);
    const thenBlock = (condBranch as any).thenBlock.label;
    const elseBlock = (condBranch as any).elseBlock.label;
    return `${indent}br ${condition} ? ${thenBlock} : ${elseBlock};`;
  }
  
  /**
   * Imprimer une instruction Call
   */
  private printCall(call: IRCall, indent: string): string {
    const args = (call as any).arguments.map((arg: any) => this.printValue(arg)).join(', ');
    const result = (call as any).result ? `${this.printValue((call as any).result)} = ` : '';
    return `${indent}${result}${call.function.name}(${args});`;
  }
  
  /**
   * Imprimer une instruction Allocate
   */
  private printAllocate(allocate: IRAllocate, indent: string): string {
    const result = this.printValue(allocate.result);
    return `${indent}${result} = allocate ${allocate.type}, ${allocate.size};`;
  }
  
  /**
   * Imprimer une instruction Store
   */
  private printStore(store: IRStore, indent: string): string {
    const pointer = this.printValue(store.pointer);
    const value = this.printValue(store.value);
    return `${indent}store ${value} to ${pointer};`;
  }
  
  /**
   * Imprimer une instruction Load
   */
  private printLoad(load: IRLoad, indent: string): string {
    const pointer = this.printValue(load.pointer);
    const result = this.printValue(load.result);
    return `${indent}${result} = load ${pointer};`;
  }
  
  /**
   * Imprimer une instruction BinaryOperation
   */
  private printBinaryOperation(binOp: IRBinaryOperation, indent: string): string {
    const left = this.printValue(binOp.left);
    const right = this.printValue(binOp.right);
    const result = this.printValue(binOp.result);
    return `${indent}${result} = ${left} ${binOp.op} ${right};`;
  }
  
  /**
   * Imprimer une instruction UnaryOperation
   */
  private printUnaryOperation(unaryOp: IRUnaryOperation, indent: string): string {
    const operand = this.printValue(unaryOp.operand);
    const result = this.printValue(unaryOp.result);
    return `${indent}${result} = ${unaryOp.op}${operand};`;
  }
  
  /**
   * Imprimer une instruction Compare
   */
  private printCompare(compare: IRCompare, indent: string): string {
    const left = this.printValue(compare.left);
    const right = this.printValue(compare.right);
    const result = this.printValue(compare.result);
    return `${indent}${result} = ${left} ${compare.op} ${right};`;
  }
  
  /**
   * Imprimer une instruction Phi
   */
  private printPhi(phi: IRPhi, indent: string): string {
    const variable = this.printValue(phi.variable);
    const incoming = Array.from((phi as any).incoming.entries())
      .map(([block, value]: any) => `${block.label}: ${this.printValue(value)}`)
      .join(', ');
    return `${indent}${variable} = phi(${incoming});`;
  }
  
  /**
   * Imprimer une instruction Nop
   */
  private printNop(nop: IRNop, indent: string): string {
    return `${indent}nop;`;
  }
  
  /**
   * Imprimer une instruction Unreachable
   */
  private printUnreachable(unreachable: IRUnreachable, indent: string): string {
    return `${indent}unreachable;`;
  }
  
  /**
   * Imprimer une valeur
   */
  private printValue(value: IRValue): string {
    if (value instanceof IRVariable) {
      return value.name;
    } else if (value instanceof IRConstant) {
      return `${value.value}`;
    } else {
      return `(value: ${value.type})`;
    }
  }
  
  /**
   * Imprimer une variable
   */
  private printVariable(variable: IRVariable, indentLevel: number): string {
    const indent = '  '.repeat(indentLevel);
    const type = this.options.showTypes ? `: ${variable.irType}` : '';
    const global = variable.isGlobal ? 'global ' : '';
    return `${indent}${global}var ${variable.name}${type};`;
  }
  
  /**
   * Imprimer en format JSON
   */
  private printJSON(module: IRModule): string {
    return JSON.stringify(this.toJSON(module), null, this.options.indent);
  }
  
  /**
   * Convertir en JSON
   */
  private toJSON(module: IRModule): any {
    return {
      type: 'IRModule',
      name: module.name,
      globals: module.globals.map(g => this.variableToJSON(g)),
      functions: module.functions.map(f => this.functionToJSON(f)),
    };
  }
  
  /**
   * Convertir une variable en JSON
   */
  private variableToJSON(variable: IRVariable): any {
    return {
      type: 'IRVariable',
      name: variable.name,
      irType: variable.irType.toString(),
      isGlobal: variable.isGlobal,
    };
  }
  
  /**
   * Convertir une fonction en JSON
   */
  private functionToJSON(func: IRFunction): any {
    return {
      type: 'IRFunction',
      name: func.name,
      returnType: func.returnType.toString(),
      isPublic: func.isPublic,
      isStatic: func.isStatic,
      parameters: func.parameters.map(p => this.parameterToJSON(p)),
      body: this.functionBodyToJSON(func.body),
    };
  }
  
  /**
   * Convertir un parametre en JSON
   */
  private parameterToJSON(param: IRFunctionParameter): any {
    return {
      type: 'IRFunctionParameter',
      name: param.name,
      irType: param.irType.toString(),
      index: param.index,
    };
  }
  
  /**
   * Convertir un corps de fonction en JSON
   */
  private functionBodyToJSON(body: IRFunctionBody): any {
    return {
      type: 'IRFunctionBody',
      blocks: body.blocks.map(b => this.blockToJSON(b)),
    };
  }
  
  /**
   * Convertir un bloc en JSON
   */
  private blockToJSON(block: BasicBlock): any {
    return {
      type: 'BasicBlock',
      label: block.label,
      instructions: block.instructions.map(i => this.instructionToJSON(i)),
      terminator: block.terminator ? this.instructionToJSON(block.terminator) : null,
    };
  }
  
  /**
   * Convertir une instruction en JSON
   */
  private instructionToJSON(instruction: IRInstruction): any {
    const base = {
      type: instruction.type,
    };
    
    switch (instruction.type) {
      case IRNodeType.Return:
        return {
          ...base,
          value: (instruction as IRReturn).value ? this.valueToJSON((instruction as IRReturn).value) : null,
        };
      case IRNodeType.Branch:
        return {
          ...base,
          target: this.blockToJSON((instruction as IRBranch).target as any),
        };
      case IRNodeType.ConditionalBranch:
        return {
          ...base,
          condition: this.valueToJSON((instruction as IRConditionalBranch).condition),
          thenBlock: this.blockToJSON((instruction as IRConditionalBranch).thenBlock as any),
          elseBlock: this.blockToJSON((instruction as IRConditionalBranch).elseBlock as any),
        };
      case IRNodeType.Call:
        return {
          ...base,
          function: (instruction as IRCall).function.name,
          arguments: (instruction as IRCall).arguments.map(a => this.valueToJSON(a)),
          resultType: (instruction as IRCall).resultType.toString(),
        };
      case IRNodeType.Allocate:
        return {
          ...base,
          type: (instruction as IRAllocate).type.toString(),
          size: (instruction as IRAllocate).size,
          result: this.variableToJSON((instruction as IRAllocate).result),
        };
      case IRNodeType.Store:
        return {
          ...base,
          pointer: this.valueToJSON((instruction as IRStore).pointer),
          value: this.valueToJSON((instruction as IRStore).value),
        };
      case IRNodeType.Load:
        return {
          ...base,
          pointer: this.valueToJSON((instruction as IRLoad).pointer),
          result: this.variableToJSON((instruction as IRLoad).result),
        };
      case IRNodeType.BinaryOperation:
        return {
          ...base,
          op: (instruction as IRBinaryOperation).op,
          left: this.valueToJSON((instruction as IRBinaryOperation).left),
          right: this.valueToJSON((instruction as IRBinaryOperation).right),
          result: this.variableToJSON((instruction as IRBinaryOperation).result),
        };
      case IRNodeType.UnaryOperation:
        return {
          ...base,
          op: (instruction as IRUnaryOperation).op,
          operand: this.valueToJSON((instruction as IRUnaryOperation).operand),
          result: this.variableToJSON((instruction as IRUnaryOperation).result),
        };
      case IRNodeType.Compare:
        return {
          ...base,
          op: (instruction as IRCompare).op,
          left: this.valueToJSON((instruction as IRCompare).left),
          right: this.valueToJSON((instruction as IRCompare).right),
          result: this.variableToJSON((instruction as IRCompare).result),
        };
      case IRNodeType.Phi:
        return {
          ...base,
          variable: this.variableToJSON((instruction as IRPhi).variable),
          incoming: Array.from((instruction as any).incoming.entries())
            .map(([block, value]: any) => ({
              block: this.blockToJSON(block),
              value: this.valueToJSON(value),
            })),
        };
      case IRNodeType.Nop:
      case IRNodeType.Unreachable:
        return base;
      default:
        return base;
    }
  }
  
  /**
   * Convertir une valeur en JSON
   */
  private valueToJSON(value: IRValue): any {
    if (value instanceof IRVariable) {
      return this.variableToJSON(value);
    } else if (value instanceof IRConstant) {
      return {
        type: 'IRConstant',
        value: value.value,
        irType: value.irType.toString(),
      };
    } else {
      return {
        type: value.type,
      };
    }
  }
  
  /**
   * Imprimer en format DOT (Graphviz)
   */
  private printDOT(module: IRModule): string {
    let dot = 'digraph IRModule {\n';
    dot += '  rankdir="TB";\n';
    dot += '  node [shape="box"];\n\n';
    
    // Ajouter les fonctions
    for (const func of module.functions) {
      dot += this.functionToDOT(func);
    }
    
    dot += '}\n';
    return dot;
  }
  
  /**
   * Convertir une fonction en DOT
   */
  private functionToDOT(func: IRFunction): string {
    let dot = `  subgraph cluster_${func.name} {\n`;
    dot += `    label="${func.name}";\n`;
    dot += '    color="blue";\n\n';
    
    // Ajouter les blocs
    for (const block of func.body.blocks) {
      dot += this.blockToDOT(block);
    }
    
    // Ajouter les transitions
    for (const block of func.body.blocks) {
      dot += this.transitionsToDOT(block);
    }
    
    dot += '  }\n\n';
    return dot;
  }
  
  /**
   * Convertir un bloc en DOT
   */
  private blockToDOT(block: BasicBlock): string {
    const label = block.label.replace(/"/g, '\\"');
    return `    "${label}" [label="${label}"];\n`;
  }
  
  /**
   * Convertir les transitions en DOT
   */
  private transitionsToDOT(block: BasicBlock): string {
    let dot = '';
    
    const terminator = block.terminator;
    
    if (terminator) {
      if (terminator.type === IRNodeType.Branch) {
        const branch = terminator as IRBranch;
        dot += `    "${block.label}" -> "${(branch as any).target.label}";\n`;
      } else if (terminator.type === IRNodeType.ConditionalBranch) {
        const condBranch = terminator as IRConditionalBranch;
        dot += `    "${block.label}" -> "${(condBranch as any).thenBlock.label}" [label="true"];\n`;
        dot += `    "${block.label}" -> "${(condBranch as any).elseBlock.label}" [label="false"];\n`;
      }
    }
    
    return dot;
  }
  
  /**
   * Calculer les statistiques
   */
  private calculateStats(module: IRModule): PrintStats {
    let functions = 0;
    let blocks = 0;
    let instructions = 0;
    
    for (const func of module.functions) {
      functions++;
      for (const block of func.body.blocks) {
        blocks++;
        instructions += block.instructions.length;
        if (block.terminator) {
          instructions++;
        }
      }
    }
    
    return {
      modules: 1,
      functions,
      blocks,
      instructions,
      lines: this.estimateLines(module),
    };
  }
  
  /**
   * Estimer le nombre de lignes
   */
  private estimateLines(module: IRModule): number {
    let lines = 0;
    
    for (const func of module.functions) {
      lines++; // Fonction
      for (const block of func.body.blocks) {
        lines++; // Bloc
        lines += block.instructions.length;
        if (block.terminator) {
          lines++;
        }
      }
    }
    
    return lines;
  }
  
  /**
   * Imprimer les statistiques
   */
  private printStats(stats: PrintStats): string {
    return `// Statistics:\n` +
      `//   Modules: ${stats.modules}\n` +
      `//   Functions: ${stats.functions}\n` +
      `//   Blocks: ${stats.blocks}\n` +
      `//   Instructions: ${stats.instructions}\n` +
      `//   Lines: ${stats.lines}`;
  }
  
  /**
   * Obtenir les options
   */
  getOptions(): PrintOptions {
    return { ...this.options };
  }
  
  /**
   * Changer les options
   */
  setOptions(options: Partial<PrintOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

/**
 * Creer un imprimeur d'IR
 */
export function createIRPrinter(options?: Partial<PrintOptions>): IRPrinter {
  return new IRPrinter(options);
}

/**
 * Imprimer un module IR
 */
export function printIR(
  module: IRModule,
  options?: Partial<PrintOptions>
): PrintResult {
  const printer = new IRPrinter(options);
  return printer.print(module);
}
