/**
 * Verifier - Verificateur de l'IR pour Zinga
 * 
 * Ce module verifie que la representation intermediaire est valide.
 * Il detecte les erreurs semantiques et structurelles.
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
 * Type d'erreur de verification
 */
export enum VerificationErrorType {
  // Erreurs structurelles
  ModuleWithoutFunctions = 'ModuleWithoutFunctions',
  FunctionWithoutBody = 'FunctionWithoutBody',
  BlockWithoutTerminator = 'BlockWithoutTerminator',
  EmptyBlock = 'EmptyBlock',
  
  // Erreurs semantiques
  UndefinedVariable = 'UndefinedVariable',
  TypeMismatch = 'TypeMismatch',
  InvalidOperation = 'InvalidOperation',
  
  // Erreurs de flux de controle
  UnreachableCode = 'UnreachableCode',
  MissingReturn = 'MissingReturn',
  InvalidBranchTarget = 'InvalidBranchTarget',
  
  // Erreurs de memoire
  InvalidAllocation = 'InvalidAllocation',
  InvalidPointer = 'InvalidPointer',
}

/**
 * Erreur de verification
 */
export interface VerificationError {
  type: VerificationErrorType;
  message: string;
  node?: any;
  block?: BasicBlock;
  function?: IRFunction;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Resultat de verification
 */
export interface VerificationResult {
  valid: boolean;
  errors: VerificationError[];
  warnings: VerificationError[];
  infos: VerificationError[];
}

/**
 * Verificateur d'IR
 */
export class IRVerifier {
  private errors: VerificationError[] = [];
  private warnings: VerificationError[] = [];
  private infos: VerificationError[] = [];
  
  private variableScopes: Map<string, Set<string>> = new Map();
  private currentFunction: IRFunction | null = null;
  private currentBlock: BasicBlock | null = null;
  
  /**
   * Verifier un module IR
   */
  verify(module: IRModule): VerificationResult {
    this.errors = [];
    this.warnings = [];
    this.infos = [];
    this.variableScopes = new Map();
    this.currentFunction = null;
    this.currentBlock = null;
    
    // Verifier le module
    this.verifyModule(module);
    
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      infos: this.infos,
    };
  }
  
  /**
   * Verifier un module
   */
  private verifyModule(module: IRModule): void {
    // Verifier que le module a un nom
    if (!module.name) {
      this.addError(
        VerificationErrorType.ModuleWithoutFunctions,
        'Module must have a name',
        module
      );
    }
    
    // Verifier les variables globales
    for (const global of module.globals) {
      this.verifyVariable(global, module);
    }
    
    // Verifier les fonctions
    for (const func of module.functions) {
      this.verifyFunction(func, module);
    }
    
    // Verifier qu'il y a au moins une fonction
    if (module.functions.length === 0) {
      this.addWarning(
        VerificationErrorType.ModuleWithoutFunctions,
        'Module has no functions',
        module
      );
    }
  }
  
  /**
   * Verifier une fonction
   */
  private verifyFunction(func: IRFunction, module: IRModule): void {
    this.currentFunction = func;
    
    // Verifier que la fonction a un nom
    if (!func.name) {
      this.addError(
        VerificationErrorType.FunctionWithoutBody,
        'Function must have a name',
        func
      );
    }
    
    // Verifier que la fonction a un corps
    if (!func.body) {
      this.addError(
        VerificationErrorType.FunctionWithoutBody,
        'Function must have a body',
        func
      );
      return;
    }
    
    // Creer un nouveau scope pour la fonction
    this.variableScopes.set(func.name, new Set());
    
    // Ajouter les parametres au scope
    for (const param of func.parameters) {
      this.variableScopes.get(func.name)!.add(param.name);
    }
    
    // Verifier les parametres
    for (const param of func.parameters) {
      this.verifyFunctionParameter(param, func);
    }
    
    // Verifier le corps de la fonction
    this.verifyFunctionBody(func.body, func);
    
    // Verifier qu'il y a un retour si la fonction retourne autre chose que void
    if (func.returnType.toString() !== 'void' && !this.hasReturn(func.body)) {
      this.addWarning(
        VerificationErrorType.MissingReturn,
        `Function '${func.name}' may not return a value for all paths`,
        func
      );
    }
    
    this.currentFunction = null;
  }
  
  /**
   * Verifier un parametre de fonction
   */
  private verifyFunctionParameter(param: any, func: IRFunction): void {
    if (!param.name) {
      this.addError(
        VerificationErrorType.ModuleWithoutFunctions,
        'Parameter must have a name',
        param,
        undefined,
        func
      );
    }
  }
  
  /**
   * Verifier le corps d'une fonction
   */
  private verifyFunctionBody(body: any, func: IRFunction): void {
    // Verifier qu'il y a un bloc d'entree
    if (!body.entryBlock) {
      this.addError(
        VerificationErrorType.BlockWithoutTerminator,
        'Function body must have an entry block',
        body,
        undefined,
        func
      );
      return;
    }
    
    // Verifier tous les blocs
    for (const block of body.blocks) {
      this.verifyBlock(block, func);
    }
    
    // Verifier que le bloc d'entree est dans la liste des blocs
    if (!body.blocks.includes(body.entryBlock)) {
      this.addError(
        VerificationErrorType.BlockWithoutTerminator,
        'Entry block is not in the block list',
        body,
        undefined,
        func
      );
    }
  }
  
  /**
   * Verifier un bloc
   */
  private verifyBlock(block: BasicBlock, func: IRFunction): void {
    this.currentBlock = block;
    
    // Verifier que le bloc a au moins une instruction
    if (block.instructions.length === 0) {
      this.addWarning(
        VerificationErrorType.EmptyBlock,
        `Block '${block.label}' is empty`,
        block,
        block,
        func
      );
    }
    
    // Verifier chaque instruction
    for (const instruction of block.instructions) {
      this.verifyInstruction(instruction, block, func);
    }
    
    // Verifier que le bloc a un terminateur (sauf si c'est le dernier bloc)
    if (!block.terminator && block !== func.body.blocks[func.body.blocks.length - 1]) {
      this.addError(
        VerificationErrorType.BlockWithoutTerminator,
        `Block '${block.label}' has no terminator`,
        block,
        block,
        func
      );
    }
    
    this.currentBlock = null;
  }
  
  /**
   * Verifier une instruction
   */
  private verifyInstruction(instruction: IRInstruction, block: BasicBlock, func: IRFunction): void {
    switch (instruction.type) {
      case IRNodeType.Return:
        this.verifyReturn(instruction as IRReturn, block, func);
        break;
      case IRNodeType.Branch:
        this.verifyBranch(instruction as IRBranch, block, func);
        break;
      case IRNodeType.ConditionalBranch:
        this.verifyConditionalBranch(instruction as IRConditionalBranch, block, func);
        break;
      case IRNodeType.Call:
        this.verifyCall(instruction as IRCall, block, func);
        break;
      case IRNodeType.Allocate:
        this.verifyAllocate(instruction as IRAllocate, block, func);
        break;
      case IRNodeType.Store:
        this.verifyStore(instruction as IRStore, block, func);
        break;
      case IRNodeType.Load:
        this.verifyLoad(instruction as IRLoad, block, func);
        break;
      case IRNodeType.BinaryOperation:
        this.verifyBinaryOperation(instruction as IRBinaryOperation, block, func);
        break;
      case IRNodeType.UnaryOperation:
        this.verifyUnaryOperation(instruction as IRUnaryOperation, block, func);
        break;
      case IRNodeType.Compare:
        this.verifyCompare(instruction as IRCompare, block, func);
        break;
      case IRNodeType.Phi:
        this.verifyPhi(instruction as IRPhi, block, func);
        break;
      case IRNodeType.Nop:
      case IRNodeType.Unreachable:
        // Pas de verification necessaire
        break;
      default:
        this.addWarning(
          VerificationErrorType.InvalidOperation,
          `Unknown instruction type: ${instruction.type}`,
          instruction,
          block,
          func
        );
    }
  }
  
  /**
   * Verifier une instruction Return
   */
  private verifyReturn(ret: IRReturn, block: BasicBlock, func: IRFunction): void {
    // Verifier que la valeur de retour correspond au type de retour de la fonction
    if (ret.value && func.returnType.toString() !== 'void') {
      // Verification simplifiée - une verification complete necessiterait
      // une comparaison de types
    }
  }
  
  /**
   * Verifier une instruction Branch
   */
  private verifyBranch(branch: IRBranch, block: BasicBlock, func: IRFunction): void {
    // Verifier que la cible existe dans la fonction
    if (!this.blockExists(branch.target, func)) {
      this.addError(
        VerificationErrorType.InvalidBranchTarget,
        `Branch target block '${(branch as any).target.label}' does not exist`,
        branch,
        block,
        func
      );
    }
  }
  
  /**
   * Verifier une instruction ConditionalBranch
   */
  private verifyConditionalBranch(
    condBranch: IRConditionalBranch,
    block: BasicBlock,
    func: IRFunction
  ): void {
    // Verifier que les cibles existent dans la fonction
    if (!this.blockExists(condBranch.thenBlock, func)) {
      this.addError(
        VerificationErrorType.InvalidBranchTarget,
        `Conditional branch then target block '${(condBranch as any).thenBlock.label}' does not exist`,
        condBranch,
        block,
        func
      );
    }
    
    if (!this.blockExists(condBranch.elseBlock, func)) {
      this.addError(
        VerificationErrorType.InvalidBranchTarget,
        `Conditional branch else target block '${(condBranch as any).elseBlock.label}' does not exist`,
        condBranch,
        block,
        func
      );
    }
  }
  
  /**
   * Verifier une instruction Call
   */
  private verifyCall(call: IRCall, block: BasicBlock, func: IRFunction): void {
    // Verifier que la fonction existe
    if (!this.functionExists(call.function as any, func)) {
      this.addError(
        VerificationErrorType.UndefinedVariable,
        `Function '${(call as any).function.name}' is not defined`,
        call,
        block,
        func
      );
    }
    
    // Verifier que le nombre d'arguments correspond
    const expectedArgs = (call as any).function.parameters.length;
    const actualArgs = (call as any).arguments.length;
    
    if (expectedArgs !== actualArgs) {
      this.addError(
        VerificationErrorType.InvalidOperation,
        `Function call has ${actualArgs} arguments, expected ${expectedArgs}`,
        call,
        block,
        func
      );
    }
  }
  
  /**
   * Verifier une instruction Allocate
   */
  private verifyAllocate(allocate: IRAllocate, block: BasicBlock, func: IRFunction): void {
    // Verifier que la taille est positive
    if (allocate.size <= 0) {
      this.addError(
        VerificationErrorType.InvalidAllocation,
        'Allocation size must be positive',
        allocate,
        block,
        func
      );
    }
  }
  
  /**
   * Verifier une instruction Store
   */
  private verifyStore(store: IRStore, block: BasicBlock, func: IRFunction): void {
    // Verification simplifiée
  }
  
  /**
   * Verifier une instruction Load
   */
  private verifyLoad(load: IRLoad, block: BasicBlock, func: IRFunction): void {
    // Verification simplifiée
  }
  
  /**
   * Verifier une instruction BinaryOperation
   */
  private verifyBinaryOperation(op: IRBinaryOperation, block: BasicBlock, func: IRFunction): void {
    // Verification simplifiée
  }
  
  /**
   * Verifier une instruction UnaryOperation
   */
  private verifyUnaryOperation(op: IRUnaryOperation, block: BasicBlock, func: IRFunction): void {
    // Verification simplifiée
  }
  
  /**
   * Verifier une instruction Compare
   */
  private verifyCompare(compare: IRCompare, block: BasicBlock, func: IRFunction): void {
    // Verification simplifiée
  }
  
  /**
   * Verifier une instruction Phi
   */
  private verifyPhi(phi: IRPhi, block: BasicBlock, func: IRFunction): void {
    // Verification simplifiée
  }
  
  /**
   * Verifier une variable
   */
  private verifyVariable(variable: IRVariable, context: any): void {
    if (!variable.name) {
      this.addError(
        VerificationErrorType.UndefinedVariable,
        'Variable must have a name',
        variable
      );
    }
  }
  
  /**
   * Verifier si un bloc existe dans une fonction
   */
  private blockExists(block: BasicBlock, func: IRFunction): boolean {
    return func.body.blocks.includes(block);
  }
  
  /**
   * Verifier si une fonction existe
   */
  private functionExists(func: any, context: IRFunction): boolean {
    // Verifier dans le module
    if (this.currentFunction) {
      const module = this.currentFunction as any;
      return module.functions?.includes(func) || false;
    }
    return false;
  }
  
  /**
   * Verifier si le corps de la fonction a un retour
   */
  private hasReturn(body: any): boolean {
    for (const block of body.blocks) {
      if (block.terminator && block.terminator.type === IRNodeType.Return) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Ajouter une erreur
   */
  private addError(
    type: VerificationErrorType,
    message: string,
    node?: any,
    block?: BasicBlock,
    func?: IRFunction
  ): void {
    this.errors.push({ type, message, node, block, func, severity: 'error' });
  }
  
  /**
   * Ajouter un avertissement
   */
  private addWarning(
    type: VerificationErrorType,
    message: string,
    node?: any,
    block?: BasicBlock,
    func?: IRFunction
  ): void {
    this.warnings.push({ type, message, node, block, func, severity: 'warning' });
  }
  
  /**
   * Ajouter une information
   */
  private addInfo(
    type: VerificationErrorType,
    message: string,
    node?: any,
    block?: BasicBlock,
    func?: IRFunction
  ): void {
    this.infos.push({ type, message, node, block, func, severity: 'info' });
  }
}

/**
 * Creer un verificateur d'IR
 */
export function createIRVerifier(): IRVerifier {
  return new IRVerifier();
}

/**
 * Verifier un module IR
 */
export function verifyIR(module: IRModule): VerificationResult {
  const verifier = new IRVerifier();
  return verifier.verify(module);
}
