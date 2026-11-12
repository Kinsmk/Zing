/**
 * IR Builder - Constructeur de Representation Intermediaire pour Zinga
 * 
 * Ce module fournit un constructeur (builder) pour faciliter la creation de l'IR.
 * Il gere la creation des blocs, variables, et instructions avec une API fluide.
 */

import {
  IRModule,
  IRFunction,
  IRFunctionParameter,
  IRFunctionBody,
  BasicBlock,
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
  IRConstant,
  IRVariable,
  IRArgument,
  IRNop,
  IRUnreachable,
  BinaryOp,
  UnaryOp,
  CompareOp,
  IRNodeType,
} from './ir-nodes';
import { Type, PrimitiveType, CompositeType } from '../types/type-system';

/**
 * Constructeur d'IR
 */
export class IRBuilder {
  private currentModule: IRModule | null = null;
  private currentFunction: IRFunction | null = null;
  private currentBlock: BasicBlock | null = null;
  
  private blockCounter: number = 0;
  private variableCounter: number = 0;
  private labelCounter: number = 0;
  
  /**
   * Creer un nouveau module
   */
  createModule(name: string): IRModule {
    this.currentModule = new IRModule(name);
    this.currentFunction = null;
    this.currentBlock = null;
    return this.currentModule;
  }
  
  /**
   * Creer une nouvelle fonction
   */
  createFunction(
    name: string,
    returnType: Type,
    isPublic: boolean = false,
    isStatic: boolean = false
  ): IRFunction {
    if (!this.currentModule) {
      throw new Error('No current module');
    }
    
    const func = new IRFunction(
      name,
      returnType,
      [],
      new IRFunctionBody(),
      isPublic,
      isStatic
    );
    
    this.currentFunction = func;
    this.currentModule.addFunction(func);
    
    return func;
  }
  
  /**
   * Creer un parametre de fonction
   */
  createParameter(name: string, type: Type, index: number): IRFunctionParameter {
    if (!this.currentFunction) {
      throw new Error('No current function');
    }
    
    const param = new IRFunctionParameter(name, type, index);
    this.currentFunction.parameters.push(param);
    return param;
  }
  
  /**
   * Creer un bloc de base
   */
  createBlock(name?: string): BasicBlock {
    const label = name || `block_${this.blockCounter++}`;
    const block = new BasicBlock(label);
    
    if (this.currentFunction) {
      this.currentFunction.body.addBlock(block);
      if (!this.currentFunction.body.entryBlock) {
        this.currentFunction.body.entryBlock = block;
      }
    }
    
    this.currentBlock = block;
    return block;
  }
  
  /**
   * Creer une variable
   */
  createVariable(name: string, type: Type, isGlobal: boolean = false): IRVariable {
    return new IRVariable(name, type, isGlobal);
  }
  
  /**
   * Creer une variable temporaire
   */
  createTempVariable(type: Type): IRVariable {
    const name = `temp_${this.variableCounter++}`;
    return new IRVariable(name, type, false);
  }
  
  /**
   * Creer une constante
   */
  createConstant(value: string | number | boolean | null, type: Type): IRConstant {
    return new IRConstant(value, type);
  }
  
  /**
   * Creer une instruction Return
   */
  createReturn(value: IRVariable | IRConstant | null): IRReturn {
    const instruction = new IRReturn(value);
    this.addInstruction(instruction);
    return instruction;
  }
  
  /**
   * Creer une instruction Branch
   */
  createBranch(target: BasicBlock): IRBranch {
    const instruction = new IRBranch(target);
    this.addInstruction(instruction);
    return instruction;
  }
  
  /**
   * Creer une instruction ConditionalBranch
   */
  createConditionalBranch(
    condition: IRVariable | IRConstant,
    thenBlock: BasicBlock,
    elseBlock: BasicBlock
  ): IRConditionalBranch {
    const instruction = new IRConditionalBranch(condition, thenBlock, elseBlock);
    this.addInstruction(instruction);
    return instruction;
  }
  
  /**
   * Creer une instruction Call
   */
  createCall(
    func: IRFunction,
    args: (IRVariable | IRConstant)[] = [],
    returnType: Type
  ): IRCall {
    const instruction = new IRCall(func, args, returnType);
    this.addInstruction(instruction);
    return instruction;
  }
  
  /**
   * Creer une instruction Allocate
   */
  createAllocate(type: Type, size: number, result: IRVariable): IRAllocate {
    const instruction = new IRAllocate(type, size, result);
    this.addInstruction(instruction);
    return instruction;
  }
  
  /**
   * Creer une instruction Store
   */
  createStore(pointer: IRVariable | IRConstant, value: IRVariable | IRConstant): IRStore {
    const instruction = new IRStore(pointer, value);
    this.addInstruction(instruction);
    return instruction;
  }
  
  /**
   * Creer une instruction Load
   */
  createLoad(pointer: IRVariable | IRConstant, result: IRVariable): IRLoad {
    const instruction = new IRLoad(pointer, result);
    this.addInstruction(instruction);
    return instruction;
  }
  
  /**
   * Creer une operation binaire
   */
  createBinaryOp(
    op: BinaryOp,
    left: IRVariable | IRConstant,
    right: IRVariable | IRConstant,
    result: IRVariable
  ): IRBinaryOperation {
    const instruction = new IRBinaryOperation(op, left, right, result);
    this.addInstruction(instruction);
    return instruction;
  }
  
  /**
   * Creer une operation unaire
   */
  createUnaryOp(
    op: UnaryOp,
    operand: IRVariable | IRConstant,
    result: IRVariable
  ): IRUnaryOperation {
    const instruction = new IRUnaryOperation(op, operand, result);
    this.addInstruction(instruction);
    return instruction;
  }
  
  /**
   * Creer une comparaison
   */
  createCompare(
    op: CompareOp,
    left: IRVariable | IRConstant,
    right: IRVariable | IRConstant,
    result: IRVariable
  ): IRCompare {
    const instruction = new IRCompare(op, left, right, result);
    this.addInstruction(instruction);
    return instruction;
  }
  
  /**
   * Creer une instruction Phi
   */
  createPhi(variable: IRVariable): IRPhi {
    const instruction = new IRPhi(variable);
    this.addInstruction(instruction);
    return instruction;
  }
  
  /**
   * Creer une instruction Nop
   */
  createNop(): IRNop {
    const instruction = new IRNop();
    this.addInstruction(instruction);
    return instruction;
  }
  
  /**
   * Creer une instruction Unreachable
   */
  createUnreachable(): IRUnreachable {
    const instruction = new IRUnreachable();
    this.addInstruction(instruction);
    return instruction;
  }
  
  /**
   * Ajouter une instruction au bloc courant
   */
  private addInstruction(instruction: any): void {
    if (!this.currentBlock) {
      // Creer un bloc par defaut si aucun bloc courant
      this.createBlock();
    }
    this.currentBlock!.addInstruction(instruction);
  }
  
  /**
   * Obtenir le module courant
   */
  getModule(): IRModule | null {
    return this.currentModule;
  }
  
  /**
   * Obtenir la fonction courante
   */
  getFunction(): IRFunction | null {
    return this.currentFunction;
  }
  
  /**
   * Obtenir le bloc courant
   */
  getBlock(): BasicBlock | null {
    return this.currentBlock;
  }
  
  /**
   * Changer le bloc courant
   */
  setBlock(block: BasicBlock): void {
    this.currentBlock = block;
  }
  
  /**
   * Generer un label unique
   */
  generateLabel(prefix: string = 'label'): string {
    return `${prefix}_${this.labelCounter++}`;
  }
  
  /**
   * Reinitialiser le constructeur
   */
  reset(): void {
    this.currentModule = null;
    this.currentFunction = null;
    this.currentBlock = null;
    this.blockCounter = 0;
    this.variableCounter = 0;
    this.labelCounter = 0;
  }
}

/**
 * Creer un nouveau IRBuilder
 */
export function createIRBuilder(): IRBuilder {
  return new IRBuilder();
}
