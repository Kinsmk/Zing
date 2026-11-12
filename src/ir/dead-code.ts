/**
 * Dead Code Elimination - Elimination de code mort pour l'IR de Zinga
 * 
 * Ce module implemente l'optimisation d'elimination de code mort.
 * Le code mort est le code qui n'a pas d'effet sur le resultat final
 * du programme.
 */

import {
  IRModule,
  IRFunction,
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
  IRNodeType,
} from './ir-nodes';

/**
 * Type de code mort
 */
export enum DeadCodeType {
  // Code qui n'est jamais execute
  UnreachableCode = 'UnreachableCode',
  // Code dont le resultat n'est jamais utilise
  UnusedResult = 'UnusedResult',
  // Code qui n'a pas d'effet de bord et dont le resultat n'est pas utilise
  PureDeadCode = 'PureDeadCode',
}

/**
 * Resultat de l'elimination de code mort
 */
export interface DeadCodeEliminationResult {
  // Le module optimise
  module: IRModule;
  // Nombre d'instructions supprimees
  instructionsRemoved: number;
  // Nombre de blocs supprimes
  blocksRemoved: number;
  // Liste des instructions supprimees
  removedInstructions: IRInstruction[];
  // Liste des blocs supprimes
  removedBlocks: BasicBlock[];
}

/**
 * Eliminateur de code mort
 */
export class DeadCodeEliminator {
  private removedInstructions: IRInstruction[] = [];
  private removedBlocks: BasicBlock[] = [];
  
  /**
   * Eliminer le code mort d'un module
   */
  eliminate(module: IRModule): DeadCodeEliminationResult {
    this.removedInstructions = [];
    this.removedBlocks = [];
    
    // Eliminer le code mort dans chaque fonction
    for (const func of module.functions) {
      this.eliminateInFunction(func);
    }
    
    // Eliminer les variables globales non utilisees
    this.eliminateUnusedGlobals(module);
    
    return {
      module,
      instructionsRemoved: this.removedInstructions.length,
      blocksRemoved: this.removedBlocks.length,
      removedInstructions: this.removedInstructions,
      removedBlocks: this.removedBlocks,
    };
  }
  
  /**
   * Eliminer le code mort dans une fonction
   */
  private eliminateInFunction(func: IRFunction): void {
    // Trouver les instructions qui ont des effets de bord
    const sideEffectInstructions = this.findSideEffectInstructions(func);
    
    // Trouver les variables utilisees
    const usedVariables = this.findUsedVariables(func);
    
    // Eliminer les blocs et instructions morts
    this.eliminateDeadBlocks(func, sideEffectInstructions, usedVariables);
  }
  
  /**
   * Trouver les instructions avec des effets de bord
   */
  private findSideEffectInstructions(func: IRFunction): Set<IRInstruction> {
    const sideEffects = new Set<IRInstruction>();
    
    for (const block of func.body.blocks) {
      for (const instruction of block.instructions) {
        if (this.hasSideEffect(instruction)) {
          sideEffects.add(instruction);
        }
      }
    }
    
    return sideEffects;
  }
  
  /**
   * Verifier si une instruction a des effets de bord
   */
  private hasSideEffect(instruction: IRInstruction): boolean {
    return [
      IRNodeType.Store,
      IRNodeType.Call,
      IRNodeType.Allocate,
    ].includes(instruction.type);
  }
  
  /**
   * Trouver les variables utilisees dans une fonction
   */
  private findUsedVariables(func: IRFunction): Set<string> {
    const used = new Set<string>();
    
    // Les parametres sont toujours utilises
    for (const param of func.parameters) {
      used.add(param.name);
    }
    
    // Parcourir toutes les instructions pour trouver les variables utilisees
    for (const block of func.body.blocks) {
      for (const instruction of block.instructions) {
        this.findUsedInInstruction(instruction, used);
      }
    }
    
    return used;
  }
  
  /**
   * Trouver les variables utilisees dans une instruction
   */
  private findUsedInInstruction(
    instruction: IRInstruction,
    used: Set<string>
  ): void {
    switch (instruction.type) {
      case IRNodeType.Return:
        const ret = instruction as IRReturn;
        if (ret.value && ret.value instanceof IRVariable) {
          used.add(ret.value.name);
        }
        break;
      
      case IRNodeType.Store:
        const store = instruction as IRStore;
        if (store.pointer instanceof IRVariable) {
          used.add(store.pointer.name);
        }
        if (store.value instanceof IRVariable) {
          used.add(store.value.name);
        }
        break;
      
      case IRNodeType.Load:
        const load = instruction as IRLoad;
        if (load.pointer instanceof IRVariable) {
          used.add(load.pointer.name);
        }
        break;
      
      case IRNodeType.BinaryOperation:
        const binOp = instruction as IRBinaryOperation;
        if (binOp.left instanceof IRVariable) {
          used.add(binOp.left.name);
        }
        if (binOp.right instanceof IRVariable) {
          used.add(binOp.right.name);
        }
        break;
      
      case IRNodeType.UnaryOperation:
        const unaryOp = instruction as IRUnaryOperation;
        if (unaryOp.operand instanceof IRVariable) {
          used.add(unaryOp.operand.name);
        }
        break;
      
      case IRNodeType.Compare:
        const compare = instruction as IRCompare;
        if (compare.left instanceof IRVariable) {
          used.add(compare.left.name);
        }
        if (compare.right instanceof IRVariable) {
          used.add(compare.right.name);
        }
        break;
      
      case IRNodeType.Call:
        const call = instruction as IRCall;
        for (const arg of call.arguments) {
          if (arg instanceof IRVariable) {
            used.add(arg.name);
          }
        }
        break;
      
      case IRNodeType.Branch:
        const branch = instruction as IRBranch;
        // La cible est un bloc, pas une variable
        break;
      
      case IRNodeType.ConditionalBranch:
        const condBranch = instruction as IRConditionalBranch;
        if (condBranch.condition instanceof IRVariable) {
          used.add(condBranch.condition.name);
        }
        break;
      
      case IRNodeType.Phi:
        const phi = instruction as IRPhi;
        for (const [, value] of phi.incoming) {
          if (value instanceof IRVariable) {
            used.add(value.name);
          }
        }
        break;
    }
  }
  
  /**
   * Eliminer les blocs et instructions morts
   */
  private eliminateDeadBlocks(
    func: IRFunction,
    sideEffectInstructions: Set<IRInstruction>,
    usedVariables: Set<string>
  ): void {
    // Trouver les blocs qui sont atteignables
    const reachableBlocks = this.findReachableBlocks(func);
    
    // Eliminer les blocs non atteignables
    for (let i = func.body.blocks.length - 1; i >= 0; i--) {
      const block = func.body.blocks[i];
      
      if (!reachableBlocks.has(block)) {
        this.removedBlocks.push(block);
        func.body.blocks.splice(i, 1);
      }
    }
    
    // Eliminer les instructions mortes dans les blocs atteignables
    for (const block of func.body.blocks) {
      this.eliminateDeadInstructions(block, sideEffectInstructions, usedVariables);
    }
  }
  
  /**
   * Trouver les blocs atteignables
   */
  private findReachableBlocks(func: IRFunction): Set<BasicBlock> {
    const reachable = new Set<BasicBlock>();
    const toVisit: BasicBlock[] = [];
    
    // Commencer par le bloc d'entree
    if (func.body.entryBlock) {
      reachable.add(func.body.entryBlock);
      toVisit.push(func.body.entryBlock);
    }
    
    // Parcourir les blocs
    while (toVisit.length > 0) {
      const block = toVisit.pop()!;
      
      // Trouver les successeurs
      const terminator = block.terminator;
      
      if (terminator) {
        if (terminator.type === IRNodeType.Branch) {
          const branch = terminator as IRBranch;
          if (!reachable.has(branch.target)) {
            reachable.add(branch.target);
            toVisit.push(branch.target);
          }
        } else if (terminator.type === IRNodeType.ConditionalBranch) {
          const condBranch = terminator as IRConditionalBranch;
          if (!reachable.has(condBranch.thenBlock)) {
            reachable.add(condBranch.thenBlock);
            toVisit.push(condBranch.thenBlock);
          }
          if (!reachable.has(condBranch.elseBlock)) {
            reachable.add(condBranch.elseBlock);
            toVisit.push(condBranch.elseBlock);
          }
        }
      }
    }
    
    return reachable;
  }
  
  /**
   * Eliminer les instructions mortes dans un bloc
   */
  private eliminateDeadInstructions(
    block: BasicBlock,
    sideEffectInstructions: Set<IRInstruction>,
    usedVariables: Set<string>
  ): void {
    const newInstructions: IRInstruction[] = [];
    const definedVariables = new Set<string>();
    
    // Parcourir en inverse pour detecter les instructions sans effet
    for (let i = block.instructions.length - 1; i >= 0; i--) {
      const instruction = block.instructions[i];
      
      // Si l'instruction a des effets de bord, la garder
      if (sideEffectInstructions.has(instruction)) {
        newInstructions.unshift(instruction);
        this.findDefinedInInstruction(instruction, definedVariables);
        continue;
      }
      
      // Si l'instruction definit une variable utilisee, la garder
      const defined = this.getDefinedVariables(instruction);
      const shouldKeep = defined.some(varName => usedVariables.has(varName));
      
      if (shouldKeep) {
        newInstructions.unshift(instruction);
        for (const varName of defined) {
          definedVariables.add(varName);
        }
      } else {
        this.removedInstructions.push(instruction);
      }
    }
    
    // Reconstruire le bloc
    block['_instructions'] = newInstructions;
    
    // Re-definir le terminateur
    if (newInstructions.length > 0) {
      const last = newInstructions[newInstructions.length - 1];
      if (this.isTerminator(last)) {
        block['_terminator'] = last;
      } else {
        block['_terminator'] = null;
      }
    } else {
      block['_terminator'] = null;
    }
  }
  
  /**
   * Trouver les variables definies dans une instruction
   */
  private findDefinedInInstruction(
    instruction: IRInstruction,
    defined: Set<string>
  ): void {
    const vars = this.getDefinedVariables(instruction);
    for (const varName of vars) {
      defined.add(varName);
    }
  }
  
  /**
   * Obtenir les variables definies par une instruction
   */
  private getDefinedVariables(instruction: IRInstruction): string[] {
    const defined: string[] = [];
    
    switch (instruction.type) {
      case IRNodeType.Allocate:
        const allocate = instruction as IRAllocate;
        defined.push(allocate.result.name);
        break;
      case IRNodeType.Load:
        const load = instruction as IRLoad;
        defined.push(load.result.name);
        break;
      case IRNodeType.BinaryOperation:
        const binOp = instruction as IRBinaryOperation;
        defined.push(binOp.result.name);
        break;
      case IRNodeType.UnaryOperation:
        const unaryOp = instruction as IRUnaryOperation;
        defined.push(unaryOp.result.name);
        break;
      case IRNodeType.Compare:
        const compare = instruction as IRCompare;
        defined.push(compare.result.name);
        break;
      case IRNodeType.Call:
        const call = instruction as IRCall;
        if (call.result) {
          defined.push(call.result.name);
        }
        break;
      case IRNodeType.Phi:
        const phi = instruction as IRPhi;
        defined.push(phi.variable.name);
        break;
    }
    
    return defined;
  }
  
  /**
   * Verifier si une instruction est un terminateur
   */
  private isTerminator(instruction: IRInstruction): boolean {
    return [
      IRNodeType.Return,
      IRNodeType.Branch,
      IRNodeType.ConditionalBranch,
      IRNodeType.Unreachable,
    ].includes(instruction.type);
  }
  
  /**
   * Eliminer les variables globales non utilisees
   */
  private eliminateUnusedGlobals(module: IRModule): void {
    const usedGlobals = new Set<string>();
    
    // Trouver les globales utilisees
    for (const func of module.functions) {
      for (const block of func.body.blocks) {
        for (const instruction of block.instructions) {
          if (instruction.type === IRNodeType.Load) {
            const load = instruction as IRLoad;
            if (load.pointer instanceof IRVariable && load.pointer.isGlobal) {
              usedGlobals.add(load.pointer.name);
            }
          } else if (instruction.type === IRNodeType.Store) {
            const store = instruction as IRStore;
            if (store.pointer instanceof IRVariable && store.pointer.isGlobal) {
              usedGlobals.add(store.pointer.name);
            }
          }
        }
      }
    }
    
    // Eliminer les globales non utilisees
    for (let i = module.globals.length - 1; i >= 0; i--) {
      const global = module.globals[i];
      if (!usedGlobals.has(global.name)) {
        module.globals.splice(i, 1);
      }
    }
  }
}

/**
 * Creer un eliminateur de code mort
 */
export function createDeadCodeEliminator(): DeadCodeEliminator {
  return new DeadCodeEliminator();
}

/**
 * Eliminer le code mort d'un module
 */
export function eliminateDeadCode(module: IRModule): DeadCodeEliminationResult {
  const eliminator = new DeadCodeEliminator();
  return eliminator.eliminate(module);
}
