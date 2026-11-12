/**
 * Constant Folding - Plriage des constantes pour l'IR de Zinga
 * 
 * Ce module implemente l'optimisation de plriage des constantes (constant folding).
 * Il evalue les expressions constantes a la compilation pour reduire
 * le code execute a l'execution.
 */

import {
  IRInstruction,
  IRBinaryOperation,
  IRUnaryOperation,
  IRCompare,
  IRConstant,
  IRVariable,
  BinaryOp,
  UnaryOp,
  CompareOp,
  IRNodeType,
} from './ir-nodes';
import { Type, PrimitiveType } from '../types/type-system';

/**
 * Resultat du plriage des constantes
 */
export interface ConstantFoldingResult {
  // L'instruction originale
  original: IRInstruction;
  // L'instruction optimisee (ou null si pas d'optimisation possible)
  folded: IRInstruction | null;
  // La valeur constante calculee (si applicable)
  constantValue?: any;
}

/**
 * Plieur de constantes
 */
export class ConstantFolder {
  /**
   * Pliage d'une instruction
   */
  fold(instruction: IRInstruction): ConstantFoldingResult {
    switch (instruction.type) {
      case IRNodeType.BinaryOperation:
        return this.foldBinaryOperation(instruction as IRBinaryOperation);
      
      case IRNodeType.UnaryOperation:
        return this.foldUnaryOperation(instruction as IRUnaryOperation);
      
      case IRNodeType.Compare:
        return this.foldCompare(instruction as IRCompare);
      
      default:
        return { original: instruction, folded: null };
    }
  }
  
  /**
   * Pliage d'une operation binaire
   */
  private foldBinaryOperation(op: IRBinaryOperation): ConstantFoldingResult {
    const left = op.left;
    const right = op.right;
    
    // Si les deux operandes sont des constantes, evaluer l'expression
    if (left instanceof IRConstant && right instanceof IRConstant) {
      const result = this.evaluateBinaryOp(op.op, left.value, right.value);
      
      if (result !== undefined) {
        // Creer une nouvelle constante
        const constant = new IRConstant(result, left.irType);
        
        // L'instruction optimisee est une affectation de la constante au resultat
        const folded = new IRBinaryOperation(
          op.op,
          left,
          right,
          op.result,
          op.sourceLocation
        );
        
        return {
          original: op,
          folded,
          constantValue: result,
        };
      }
    }
    
    return { original: op, folded: null };
  }
  
  /**
   * Evaluer une operation binaire
   */
  private evaluateBinaryOp(
    op: BinaryOp,
    left: any,
    right: any
  ): any {
    // Si l'une des valeurs n'est pas un nombre, on ne peut pas evaluer
    if (typeof left !== 'number' || typeof right !== 'number') {
      return undefined;
    }
    
    switch (op) {
      case BinaryOp.Add:
        return left + right;
      case BinaryOp.Sub:
        return left - right;
      case BinaryOp.Mul:
        return left * right;
      case BinaryOp.Div:
        return left / right;
      case BinaryOp.Mod:
        return left % right;
      case BinaryOp.And:
        return left & right;
      case BinaryOp.Or:
        return left | right;
      case BinaryOp.Xor:
        return left ^ right;
      case BinaryOp.Shl:
        return left << right;
      case BinaryOp.Shr:
        return left >> right;
      default:
        return undefined;
    }
  }
  
  /**
   * Pliage d'une operation unaire
   */
  private foldUnaryOperation(op: IRUnaryOperation): ConstantFoldingResult {
    const operand = op.operand;
    
    // Si l'operande est une constante, evaluer l'expression
    if (operand instanceof IRConstant) {
      const result = this.evaluateUnaryOp(op.op, operand.value);
      
      if (result !== undefined) {
        // Creer une nouvelle constante
        const constant = new IRConstant(result, operand.irType);
        
        // L'instruction optimisee
        const folded = new IRUnaryOperation(
          op.op,
          operand,
          op.result,
          op.sourceLocation
        );
        
        return {
          original: op,
          folded,
          constantValue: result,
        };
      }
    }
    
    return { original: op, folded: null };
  }
  
  /**
   * Evaluer une operation unaire
   */
  private evaluateUnaryOp(op: UnaryOp, operand: any): any {
    if (typeof operand !== 'number') {
      return undefined;
    }
    
    switch (op) {
      case UnaryOp.Neg:
        return -operand;
      case UnaryOp.Not:
        return !operand;
      case UnaryOp.BitNot:
        return ~operand;
      default:
        return undefined;
    }
  }
  
  /**
   * Pliage d'une comparaison
   */
  private foldCompare(op: IRCompare): ConstantFoldingResult {
    const left = op.left;
    const right = op.right;
    
    // Si les deux operandes sont des constantes, evaluer la comparaison
    if (left instanceof IRConstant && right instanceof IRConstant) {
      const result = this.evaluateCompareOp(op.op, left.value, right.value);
      
      if (result !== undefined) {
        // Creer une nouvelle constante booleenne
        const boolType = new PrimitiveType('boolean');
        const constant = new IRConstant(result, boolType as Type);
        
        // L'instruction optimisee
        const folded = new IRCompare(
          op.op,
          left,
          right,
          op.result,
          op.sourceLocation
        );
        
        return {
          original: op,
          folded,
          constantValue: result,
        };
      }
    }
    
    return { original: op, folded: null };
  }
  
  /**
   * Evaluer une operation de comparaison
   */
  private evaluateCompareOp(
    op: CompareOp,
    left: any,
    right: any
  ): boolean | undefined {
    // Si les valeurs ne sont pas comparables, retourner undefined
    if (typeof left !== typeof right) {
      return undefined;
    }
    
    switch (op) {
      case CompareOp.Eq:
        return left === right;
      case CompareOp.Neq:
        return left !== right;
      case CompareOp.Lt:
        return left < right;
      case CompareOp.Gt:
        return left > right;
      case CompareOp.Le:
        return left <= right;
      case CompareOp.Ge:
        return left >= right;
      default:
        return undefined;
    }
  }
  
  /**
   * Pliage recursif d'une liste d'instructions
   */
  foldAll(instructions: IRInstruction[]): ConstantFoldingResult[] {
    return instructions.map(inst => this.fold(inst));
  }
  
  /**
   * Verifier si une instruction peut etre pliee
   */
  canFold(instruction: IRInstruction): boolean {
    return this.fold(instruction).folded !== null;
  }
}

/**
 * Creer un plieur de constantes
 */
export function createConstantFolder(): ConstantFolder {
  return new ConstantFolder();
}

/**
 * Pliage des constantes sur un tableau d'instructions
 */
export function foldConstants(
  instructions: IRInstruction[]
): { folded: IRInstruction[]; results: ConstantFoldingResult[] } {
  const folder = new ConstantFolder();
  const results = folder.foldAll(instructions);
  const folded = instructions.map((inst, i) => results[i].folded || inst);
  
  return { folded, results };
}
