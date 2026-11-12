/**
 * Data Flow - Analyse de flux de donnees pour l'IR de Zinga
 * 
 * Ce module fournit des utilitaires pour analyser le flux de donnees
 * dans la representation intermediaire.
 */

import { BasicBlock, IRInstruction, IRVariable, IRValue, IRFunction } from './ir-nodes';

/**
 * Type de dependance de donnees
 */
export enum DataDependencyType {
  // La valeur est definie dans le bloc
  DefinedInBlock = 'DefinedInBlock',
  // La valeur est utilisee dans le bloc
  UsedInBlock = 'UsedInBlock',
  // La valeur est definie avant utilisation (def-use)
  DefUse = 'DefUse',
  // La valeur est utilisee avant definition (use-def)
  UseDef = 'UseDef',
  // La valeur est transmise via un parametre
  Parameter = 'Parameter',
  // La valeur est un resultats de fonction
  ReturnValue = 'ReturnValue',
}

/**
 * Dependance de donnees
 */
export interface DataDependency {
  type: DataDependencyType;
  from: IRValue;
  to: IRValue;
  instruction?: IRInstruction;
  block?: BasicBlock;
}

/**
 * Etat d'une variable
 */
export interface VariableState {
  variable: IRVariable;
  isDefined: boolean;
  isUsed: boolean;
  definitions: IRInstruction[];
  uses: IRInstruction[];
}

/**
 * Analyseur de flux de donnees
 */
export class DataFlowAnalyzer {
  private function: IRFunction;
  private dependencies: DataDependency[] = [];
  private variableStates: Map<string, VariableState> = new Map();
  
  constructor(func: IRFunction) {
    this.function = func;
    this.analyze();
  }
  
  /**
   * Analyser le flux de donnees
   */
  private analyze(): void {
    // Reinitialiser
    this.dependencies = [];
    this.variableStates = new Map();
    
    // Initialiser les etats des variables
    for (const param of this.function.parameters) {
      this.variableStates.set(param.name, {
        variable: param as unknown as IRVariable,
        isDefined: true,
        isUsed: false,
        definitions: [],
        uses: [],
      });
    }
    
    // Analyser chaque bloc
    for (const block of this.function.body.blocks) {
      this.analyzeBlock(block);
    }
    
    // Analyser les dependances entre blocs
    this.analyzeBlockDependencies();
  }
  
  /**
   * Analyser un bloc
   */
  private analyzeBlock(block: BasicBlock): void {
    for (const instruction of block.instructions) {
      this.analyzeInstruction(instruction, block);
    }
  }
  
  /**
   * Analyser une instruction
   */
  private analyzeInstruction(instruction: IRInstruction, block: BasicBlock): void {
    // Trouver les variables definies et utilisees
    const definedVars = this.getDefinedVariables(instruction);
    const usedVars = this.getUsedVariables(instruction);
    
    // Mettre a jour les etats des variables
    for (const varName of definedVars) {
      if (!this.variableStates.has(varName)) {
        this.variableStates.set(varName, {
          variable: { name: varName } as IRVariable,
          isDefined: false,
          isUsed: false,
          definitions: [],
          uses: [],
        });
      }
      
      const state = this.variableStates.get(varName)!;
      state.isDefined = true;
      state.definitions.push(instruction);
    }
    
    for (const varName of usedVars) {
      if (!this.variableStates.has(varName)) {
        this.variableStates.set(varName, {
          variable: { name: varName } as IRVariable,
          isDefined: false,
          isUsed: false,
          definitions: [],
          uses: [],
        });
      }
      
      const state = this.variableStates.get(varName)!;
      state.isUsed = true;
      state.uses.push(instruction);
    }
    
    // Creer les dependances def-use
    for (const defVar of definedVars) {
      for (const useVar of usedVars) {
        if (defVar === useVar) {
          this.dependencies.push({
            type: DataDependencyType.DefUse,
            from: { name: defVar } as IRValue,
            to: { name: useVar } as IRValue,
            instruction,
            block,
          });
        }
      }
    }
  }
  
  /**
   * Analyser les dependances entre blocs
   */
  private analyzeBlockDependencies(): void {
    // Implémentation simplifiée
    // Une analyse complete necessiterait de suivre les variables
    // a travers les blocs et d'identifier les dependances inter-bloc
  }
  
  /**
   * Obtenir les variables definies par une instruction
   */
  private getDefinedVariables(instruction: IRInstruction): string[] {
    const defined: string[] = [];
    
    switch (instruction.type) {
      case 'IRAllocate':
        const allocate = instruction as any;
        if (allocate.result && allocate.result.name) {
          defined.push(allocate.result.name);
        }
        break;
      
      case 'IRLoad':
        const load = instruction as any;
        if (load.result && load.result.name) {
          defined.push(load.result.name);
        }
        break;
      
      case 'IRBinaryOperation':
        const binOp = instruction as any;
        if (binOp.result && binOp.result.name) {
          defined.push(binOp.result.name);
        }
        break;
      
      case 'IRUnaryOperation':
        const unaryOp = instruction as any;
        if (unaryOp.result && unaryOp.result.name) {
          defined.push(unaryOp.result.name);
        }
        break;
      
      case 'IRCompare':
        const compare = instruction as any;
        if (compare.result && compare.result.name) {
          defined.push(compare.result.name);
        }
        break;
      
      case 'IRCall':
        const call = instruction as any;
        if (call.result && call.result.name) {
          defined.push(call.result.name);
        }
        break;
      
      case 'IRPhi':
        const phi = instruction as any;
        if (phi.variable && phi.variable.name) {
          defined.push(phi.variable.name);
        }
        break;
    }
    
    return defined;
  }
  
  /**
   * Obtenir les variables utilisees par une instruction
   */
  private getUsedVariables(instruction: IRInstruction): string[] {
    const used: string[] = [];
    
    switch (instruction.type) {
      case 'IRStore':
        const store = instruction as any;
        if (store.pointer && store.pointer.name) {
          used.push(store.pointer.name);
        }
        if (store.value && store.value.name) {
          used.push(store.value.name);
        }
        break;
      
      case 'IRLoad':
        const load = instruction as any;
        if (load.pointer && load.pointer.name) {
          used.push(load.pointer.name);
        }
        break;
      
      case 'IRBinaryOperation':
        const binOp = instruction as any;
        if (binOp.left && binOp.left.name) {
          used.push(binOp.left.name);
        }
        if (binOp.right && binOp.right.name) {
          used.push(binOp.right.name);
        }
        break;
      
      case 'IRUnaryOperation':
        const unaryOp = instruction as any;
        if (unaryOp.operand && unaryOp.operand.name) {
          used.push(unaryOp.operand.name);
        }
        break;
      
      case 'IRCompare':
        const compare = instruction as any;
        if (compare.left && compare.left.name) {
          used.push(compare.left.name);
        }
        if (compare.right && compare.right.name) {
          used.push(compare.right.name);
        }
        break;
      
      case 'IRCall':
        const call = instruction as any;
        if (call.arguments) {
          for (const arg of call.arguments) {
            if (arg.name) {
              used.push(arg.name);
            }
          }
        }
        break;
      
      case 'IRBranch':
        const branch = instruction as any;
        if (branch.target && branch.target.label) {
          used.push(branch.target.label);
        }
        break;
      
      case 'IRConditionalBranch':
        const condBranch = instruction as any;
        if (condBranch.condition && condBranch.condition.name) {
          used.push(condBranch.condition.name);
        }
        if (condBranch.thenBlock && condBranch.thenBlock.label) {
          used.push(condBranch.thenBlock.label);
        }
        if (condBranch.elseBlock && condBranch.elseBlock.label) {
          used.push(condBranch.elseBlock.label);
        }
        break;
      
      case 'IRReturn':
        const ret = instruction as any;
        if (ret.value && ret.value.name) {
          used.push(ret.value.name);
        }
        break;
    }
    
    return used;
  }
  
  /**
   * Obtenir toutes les dependances
   */
  getDependencies(): DataDependency[] {
    return [...this.dependencies];
  }
  
  /**
   * Obtenir l'etat d'une variable
   */
  getVariableState(variableName: string): VariableState | undefined {
    return this.variableStates.get(variableName);
  }
  
  /**
   * Obtenir toutes les etats des variables
   */
  getAllVariableStates(): VariableState[] {
    return Array.from(this.variableStates.values());
  }
  
  /**
   * Trouver les variables non utilisees
   */
  findUnusedVariables(): IRVariable[] {
    const unused: IRVariable[] = [];
    
    for (const state of this.variableStates.values()) {
      if (state.isDefined && !state.isUsed) {
        unused.push(state.variable);
      }
    }
    
    return unused;
  }
  
  /**
   * Trouver les variables utilisees avant definition
   */
  findUsedBeforeDefined(): IRVariable[] {
    const usedBeforeDefined: IRVariable[] = [];
    
    for (const state of this.variableStates.values()) {
      if (state.isUsed && !state.isDefined) {
        usedBeforeDefined.push(state.variable);
      }
    }
    
    return usedBeforeDefined;
  }
  
  /**
   * Verifier si le flux de donnees est valide
   */
  isValid(): boolean {
    return this.findUsedBeforeDefined().length === 0;
  }
}

/**
 * Analyseur de dependances def-use
 */
export class DefUseAnalyzer {
  private dependencies: DataDependency[];
  
  constructor(dependencies: DataDependency[]) {
    this.dependencies = dependencies;
  }
  
  /**
   * Obtenir les chaines def-use
   */
  getDefUseChains(): Map<string, IRInstruction[]> {
    const chains = new Map<string, IRInstruction[]>();
    
    for (const dep of this.dependencies) {
      if (dep.type === DataDependencyType.DefUse) {
        const fromName = (dep.from as any).name;
        if (!chains.has(fromName)) {
          chains.set(fromName, []);
        }
        chains.get(fromName)!.push(dep.instruction!);
      }
    }
    
    return chains;
  }
  
  /**
   * Obtenir les chaines use-def
   */
  getUseDefChains(): Map<string, IRInstruction[]> {
    const chains = new Map<string, IRInstruction[]>();
    
    for (const dep of this.dependencies) {
      if (dep.type === DataDependencyType.UseDef) {
        const toName = (dep.to as any).name;
        if (!chains.has(toName)) {
          chains.set(toName, []);
        }
        chains.get(toName)!.push(dep.instruction!);
      }
    }
    
    return chains;
  }
}

/**
 * Optimiseur de flux de donnees
 */
export class DataFlowOptimizer {
  /**
   * Eliminer le code mort base sur l'analyse de flux de donnees
   */
  static eliminateDeadCode(
    function: IRFunction,
    analyzer: DataFlowAnalyzer
  ): IRFunction {
    // Implémentation simplifiée
    // Une elimination complete de code mort necessiterait
    // une analyse plus approfondie
    
    const unusedVars = analyzer.findUnusedVariables();
    
    // Supprimer les instructions qui definissent des variables non utilisees
    for (const block of function.body.blocks) {
      const newInstructions = [];
      
      for (const instruction of block.instructions) {
        const definedVars = this.getDefinedVariables(instruction);
        const shouldRemove = definedVars.some(varName => 
          unusedVars.some(v => v.name === varName)
        );
        
        if (!shouldRemove) {
          newInstructions.push(instruction);
        }
      }
      
      // Reconstruire le bloc
      const newBlock = new BasicBlock(block.label);
      for (const inst of newInstructions) {
        newBlock.addInstruction(inst);
      }
      if (block.terminator) {
        newBlock.setTerminator(block.terminator);
      }
      
      // Remplacer le bloc
      const index = function.body.blocks.indexOf(block);
      if (index !== -1) {
        function.body.blocks[index] = newBlock;
      }
    }
    
    return function;
  }
  
  /**
   * Obtenir les variables definies par une instruction
   */
  private static getDefinedVariables(instruction: IRInstruction): string[] {
    const defined: string[] = [];
    
    switch (instruction.type) {
      case 'IRAllocate':
        const allocate = instruction as any;
        if (allocate.result && allocate.result.name) {
          defined.push(allocate.result.name);
        }
        break;
      case 'IRLoad':
        const load = instruction as any;
        if (load.result && load.result.name) {
          defined.push(load.result.name);
        }
        break;
      case 'IRBinaryOperation':
        const binOp = instruction as any;
        if (binOp.result && binOp.result.name) {
          defined.push(binOp.result.name);
        }
        break;
      case 'IRUnaryOperation':
        const unaryOp = instruction as any;
        if (unaryOp.result && unaryOp.result.name) {
          defined.push(unaryOp.result.name);
        }
        break;
      case 'IRCompare':
        const compare = instruction as any;
        if (compare.result && compare.result.name) {
          defined.push(compare.result.name);
        }
        break;
      case 'IRCall':
        const call = instruction as any;
        if (call.result && call.result.name) {
          defined.push(call.result.name);
        }
        break;
      case 'IRPhi':
        const phi = instruction as any;
        if (phi.variable && phi.variable.name) {
          defined.push(phi.variable.name);
        }
        break;
    }
    
    return defined;
  }
}
