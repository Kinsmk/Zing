/**
 * Inlining - Inlining de fonctions pour l'IR de Zinga
 * 
 * Ce module implemente l'optimisation d'inlining de fonctions.
 * L'inlining remplace les appels de fonctions par le corps de la fonction
 * pour reduire l'overhead des appels et permettre d'autres optimisations.
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
 * Strategie d'inlining
 */
export enum InliningStrategy {
  // Ne pas inliner
  None = 'None',
  // Inliner uniquement les petites fonctions
  SmallFunctions = 'SmallFunctions',
  // Inliner les fonctions marquees comme inline
  MarkedFunctions = 'MarkedFunctions',
  // Inliner agressivement
  Aggressive = 'Aggressive',
}

/**
 * Resultat de l'inlining
 */
export interface InliningResult {
  // Le module optimise
  module: IRModule;
  // Nombre de fonctions inlinees
  functionsInlined: number;
  // Nombre d'appels remplaces
  callsReplaced: number;
  // Nombre d'instructions ajoutees
  instructionsAdded: number;
  // Fonctions qui ont ete inlinees
  inlinedFunctions: IRFunction[];
}

/**
 * Information sur une fonction candidate pour l'inlining
 */
export interface InliningCandidate {
  function: IRFunction;
  callSites: IRCall[];
  size: number;
  isRecursive: boolean;
  isMarkedInline: boolean;
}

/**
 * Inlineur de fonctions
 */
export class FunctionInliner {
  private strategy: InliningStrategy;
  private maxFunctionSize: number;
  private inlinedFunctions: Set<string> = new Set();
  private functionsInlined: number = 0;
  private callsReplaced: number = 0;
  private instructionsAdded: number = 0;
  
  constructor(strategy: InliningStrategy = InliningStrategy.SmallFunctions) {
    this.strategy = strategy;
    this.maxFunctionSize = this.getMaxFunctionSize();
  }
  
  /**
   * Obtenir la taille maximale d'une fonction pour l'inlining
   */
  private getMaxFunctionSize(): number {
    switch (this.strategy) {
      case InliningStrategy.None:
        return 0;
      case InliningStrategy.SmallFunctions:
        return 10; // 10 instructions max
      case InliningStrategy.MarkedFunctions:
        return Infinity;
      case InliningStrategy.Aggressive:
        return 50; // 50 instructions max
      default:
        return 10;
    }
  }
  
  /**
   * Inliner les fonctions dans un module
   */
  inline(module: IRModule): InliningResult {
    this.inlinedFunctions = new Set();
    this.functionsInlined = 0;
    this.callsReplaced = 0;
    this.instructionsAdded = 0;
    
    // Trouver les candidats pour l'inlining
    const candidates = this.findInliningCandidates(module);
    
    // Trouver tous les appels
    const allCalls = this.findAllCalls(module);
    
    // Inliner les fonctions candidates
    for (const candidate of candidates) {
      if (this.shouldInline(candidate)) {
        this.inlinedFunctions.add(candidate.function.name);
        this.inlineFunction(candidate.function, allCalls, module);
        this.functionsInlined++;
      }
    }
    
    return {
      module,
      functionsInlined: this.functionsInlined,
      callsReplaced: this.callsReplaced,
      instructionsAdded: this.instructionsAdded,
      inlinedFunctions: candidates
        .filter(c => this.inlinedFunctions.has(c.function.name))
        .map(c => c.function),
    };
  }
  
  /**
   * Trouver les candidats pour l'inlining
   */
  private findInliningCandidates(module: IRModule): InliningCandidate[] {
    const candidates: InliningCandidate[] = [];
    
    for (const func of module.functions) {
      // Ne pas inliner les fonctions recursives
      if (this.isRecursive(func, module)) {
        continue;
      }
      
      // Calculer la taille de la fonction
      const size = this.calculateFunctionSize(func);
      
      candidates.push({
        function: func,
        callSites: [],
        size,
        isRecursive: false,
        isMarkedInline: func.name.startsWith('inline_') || func.name.includes('__inline'),
      });
    }
    
    // Trouver les appels pour chaque candidat
    const allCalls = this.findAllCalls(module);
    
    for (const candidate of candidates) {
      candidate.callSites = allCalls.filter(call => 
        call.function === candidate.function
      );
    }
    
    return candidates;
  }
  
  /**
   * Verifier si une fonction est recursive
   */
  private isRecursive(func: IRFunction, module: IRModule): boolean {
    // Vérifier si la fonction s'appelle elle-meme
    for (const block of func.body.blocks) {
      for (const instruction of block.instructions) {
        if (instruction.type === IRNodeType.Call) {
          const call = instruction as IRCall;
          if (call.function === func) {
            return true;
          }
        }
      }
    }
    return false;
  }
  
  /**
   * Calculer la taille d'une fonction
   */
  private calculateFunctionSize(func: IRFunction): number {
    let size = 0;
    
    for (const block of func.body.blocks) {
      size += block.instructions.length;
    }
    
    return size;
  }
  
  /**
   * Trouver tous les appels dans un module
   */
  private findAllCalls(module: IRModule): IRCall[] {
    const calls: IRCall[] = [];
    
    for (const func of module.functions) {
      for (const block of func.body.blocks) {
        for (const instruction of block.instructions) {
          if (instruction.type === IRNodeType.Call) {
            calls.push(instruction as IRCall);
          }
        }
      }
    }
    
    return calls;
  }
  
  /**
   * Verifier si une fonction doit etre inlinee
   */
  private shouldInline(candidate: InliningCandidate): boolean {
    switch (this.strategy) {
      case InliningStrategy.None:
        return false;
      
      case InliningStrategy.SmallFunctions:
        return candidate.size <= this.maxFunctionSize && 
               candidate.callSites.length > 0 &&
               !candidate.isRecursive;
      
      case InliningStrategy.MarkedFunctions:
        return candidate.isMarkedInline && 
               candidate.callSites.length > 0 &&
               !candidate.isRecursive;
      
      case InliningStrategy.Aggressive:
        return candidate.size <= this.maxFunctionSize && 
               candidate.callSites.length > 0 &&
               !candidate.isRecursive;
      
      default:
        return false;
    }
  }
  
  /**
   * Inliner une fonction
   */
  private inlineFunction(
    func: IRFunction,
    allCalls: IRCall[],
    module: IRModule
  ): void {
    // Trouver tous les appels a cette fonction
    const calls = allCalls.filter(call => call.function === func);
    
    for (const call of calls) {
      this.inlineCall(call, func, module);
      this.callsReplaced++;
    }
    
    // Supprimer la fonction du module (optionnel)
    // On peut garder la fonction si elle est appelee depuis ailleurs
  }
  
  /**
   * Inliner un appel
   */
  private inlineCall(call: IRCall, func: IRFunction, module: IRModule): void {
    // Obtenir le bloc contenant l'appel
    const block = this.findBlockContaining(module, call);
    
    if (!block) {
      return;
    }
    
    // Creer un mapping entre les parametres et les arguments
    const paramToArg = new Map<IRVariable, IRValue>();
    
    for (let i = 0; i < func.parameters.length; i++) {
      const param = func.parameters[i] as unknown as IRVariable;
      const arg = call.arguments[i];
      paramToArg.set(param, arg);
    }
    
    // Cloner le corps de la fonction
    const clonedBody = this.cloneFunctionBody(func, paramToArg, call);
    
    // Remplacer l'appel par le corps clone
    this.replaceCallWithBody(call, clonedBody, block);
    
    // Mettre a jour les compteurs
    this.instructionsAdded += clonedBody.blocks.length * 
      clonedBody.blocks.reduce((sum, b) => sum + b.instructions.length, 0);
  }
  
  /**
   * Trouver le bloc contenant une instruction
   */
  private findBlockContaining(
    module: IRModule,
    instruction: IRInstruction
  ): BasicBlock | null {
    for (const func of module.functions) {
      for (const block of func.body.blocks) {
        if (block.instructions.includes(instruction as any)) {
          return block;
        }
      }
    }
    return null;
  }
  
  /**
   * Cloner le corps d'une fonction
   */
  private cloneFunctionBody(
    func: IRFunction,
    paramToArg: Map<IRVariable, IRValue>,
    call: IRCall
  ): any {
    // Creer un nouveau corps
    const newBody = new (require('./ir-nodes').IRFunctionBody)();
    
    // Cloner chaque bloc
    for (const block of func.body.blocks) {
      const newBlock = this.cloneBlock(block, paramToArg, call);
      newBody.addBlock(newBlock);
    }
    
    return newBody;
  }
  
  /**
   * Cloner un bloc
   */
  private cloneBlock(
    block: BasicBlock,
    paramToArg: Map<IRVariable, IRValue>,
    call: IRCall
  ): BasicBlock {
    const newBlock = new BasicBlock(`${block.label}_inlined`);
    
    // Cloner chaque instruction
    for (const instruction of block.instructions) {
      const newInstruction = this.cloneInstruction(instruction, paramToArg, call);
      newBlock.addInstruction(newInstruction);
    }
    
    // Cloner le terminateur
    if (block.terminator) {
      const newTerminator = this.cloneInstruction(block.terminator, paramToArg, call);
      newBlock.setTerminator(newTerminator);
    }
    
    return newBlock;
  }
  
  /**
   * Cloner une instruction
   */
  private cloneInstruction(
    instruction: IRInstruction,
    paramToArg: Map<IRVariable, IRValue>,
    call: IRCall
  ): IRInstruction {
    // Remplacer les references aux parametres par les arguments
    const replaceParam = (value: IRValue): IRValue => {
      if (value instanceof IRVariable) {
        const param = paramToArg.get(value);
        if (param) {
          return param;
        }
      }
      return value;
    };
    
    switch (instruction.type) {
      case IRNodeType.Return:
        const ret = instruction as IRReturn;
        return new IRReturn(
          ret.value ? replaceParam(ret.value) : null,
          ret.sourceLocation
        );
      
      case IRNodeType.Branch:
        const branch = instruction as IRBranch;
        return new IRBranch(branch.target, branch.sourceLocation);
      
      case IRNodeType.ConditionalBranch:
        const condBranch = instruction as IRConditionalBranch;
        return new IRConditionalBranch(
          replaceParam(condBranch.condition),
          condBranch.thenBlock,
          condBranch.elseBlock,
          condBranch.sourceLocation
        );
      
      case IRNodeType.Call:
        const nestedCall = instruction as IRCall;
        // Ne pas inliner les appels nestes pour eviter une expansion exponentielle
        return new IRCall(
          nestedCall.function,
          nestedCall.arguments.map(a => replaceParam(a)),
          nestedCall.resultType,
          nestedCall.sourceLocation
        );
      
      case IRNodeType.Allocate:
        const allocate = instruction as IRAllocate;
        return new IRAllocate(
          allocate.type,
          allocate.size,
          allocate.result,
          allocate.sourceLocation
        );
      
      case IRNodeType.Store:
        const store = instruction as IRStore;
        return new IRStore(
          replaceParam(store.pointer),
          replaceParam(store.value),
          store.sourceLocation
        );
      
      case IRNodeType.Load:
        const load = instruction as IRLoad;
        return new IRLoad(
          replaceParam(load.pointer),
          load.result,
          load.sourceLocation
        );
      
      case IRNodeType.BinaryOperation:
        const binOp = instruction as IRBinaryOperation;
        return new IRBinaryOperation(
          binOp.op,
          replaceParam(binOp.left),
          replaceParam(binOp.right),
          binOp.result,
          binOp.sourceLocation
        );
      
      case IRNodeType.UnaryOperation:
        const unaryOp = instruction as IRUnaryOperation;
        return new IRUnaryOperation(
          unaryOp.op,
          replaceParam(unaryOp.operand),
          unaryOp.result,
          unaryOp.sourceLocation
        );
      
      case IRNodeType.Compare:
        const compare = instruction as IRCompare;
        return new IRCompare(
          compare.op,
          replaceParam(compare.left),
          replaceParam(compare.right),
          compare.result,
          compare.sourceLocation
        );
      
      case IRNodeType.Phi:
        const phi = instruction as IRPhi;
        const newPhi = new IRPhi(phi.variable, new Map(), phi.sourceLocation);
        for (const [block, value] of phi.incoming) {
          newPhi.addIncoming(block, replaceParam(value));
        }
        return newPhi;
      
      case IRNodeType.Nop:
        return new IRNop(instruction.sourceLocation);
      
      case IRNodeType.Unreachable:
        return new IRUnreachable(instruction.sourceLocation);
      
      default:
        // Retourner une copie de l'instruction
        return { ...instruction } as IRInstruction;
    }
  }
  
  /**
   * Remplacer un appel par le corps de la fonction
   */
  private replaceCallWithBody(
    call: IRCall,
    body: any,
    block: BasicBlock
  ): void {
    // Trouver l'index de l'appel dans le bloc
    const index = block.instructions.indexOf(call as any);
    
    if (index === -1) {
      return;
    }
    
    // Supprimer l'appel
    block['_instructions'].splice(index, 1);
    
    // Inserer le corps de la fonction
    for (const newBlock of body.blocks) {
      // Inserer les instructions du nouveau bloc
      for (const inst of newBlock.instructions) {
        block.addInstruction(inst);
      }
    }
    
    // Si l'appel avait un resultat, il faut le gerer
    if (call.result) {
      // Trouver l'instruction de retour dans le corps inline
      // et remplacer le resultat
      const lastBlock = body.blocks[body.blocks.length - 1];
      const lastInstruction = lastBlock.instructions[lastBlock.instructions.length - 1];
      
      if (lastInstruction && lastInstruction.type === IRNodeType.Return) {
        const ret = lastInstruction as IRReturn;
        if (ret.value) {
          // Creer une instruction d'affectation
          const assign = new IRStore(
            call.result,
            ret.value,
            call.sourceLocation
          );
          block.addInstruction(assign);
        }
      }
    }
  }
  
  /**
   * Obtenir la strategie d'inlining
   */
  getStrategy(): InliningStrategy {
    return this.strategy;
  }
  
  /**
   * Changer la strategie d'inlining
   */
  setStrategy(strategy: InliningStrategy): void {
    this.strategy = strategy;
    this.maxFunctionSize = this.getMaxFunctionSize();
  }
}

/**
 * Creer un inlineur de fonctions
 */
export function createFunctionInliner(strategy?: InliningStrategy): FunctionInliner {
  return new FunctionInliner(strategy);
}

/**
 * Inliner les fonctions dans un module
 */
export function inlineFunctions(
  module: IRModule,
  strategy?: InliningStrategy
): InliningResult {
  const inliner = new FunctionInliner(strategy);
  return inliner.inline(module);
}
