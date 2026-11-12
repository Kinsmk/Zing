/**
 * IR Nodes - Noeuds de la Representation Intermediaire pour Zinga
 * 
 * Ce module definit tous les types de noeuds IR.
 */

import { Type } from '../types/type-system';

/**
 * Type des noeuds IR
 */
export enum IRNodeType {
  // Module
  Module = 'IRModule',
  
  // Fonctions
  Function = 'IRFunction',
  FunctionParameter = 'IRFunctionParameter',
  FunctionBody = 'IRFunctionBody',
  
  // Blocs
  BasicBlock = 'IRBasicBlock',
  
  // Instructions
  Return = 'IRReturn',
  Branch = 'IRBranch',
  ConditionalBranch = 'IRConditionalBranch',
  Call = 'IRCall',
  Allocate = 'IRAllocate',
  Store = 'IRStore',
  Load = 'IRLoad',
  BinaryOperation = 'IRBinaryOperation',
  UnaryOperation = 'IRUnaryOperation',
  Compare = 'IRCompare',
  Phi = 'IRPhi',
  
  // Valeurs
  Constant = 'IRConstant',
  Variable = 'IRVariable',
  Argument = 'IRArgument',
  
  // Types
  TypeLiteral = 'IRTypeLiteral',
  
  // Special
  Nop = 'IRNop',
  Unreachable = 'IRUnreachable',
}

/**
 * Base des noeuds IR
 */
export abstract class IRNode {
  abstract readonly type: IRNodeType;
  abstract toString(): string;
}

/**
 * Noeud avec un type
 */
export abstract class TypedIRNode extends IRNode {
  constructor(public readonly irType: Type) {
    super();
  }
}

/**
 * Noeud avec une position source (pour le debug)
 */
export abstract class LocatedIRNode extends IRNode {
  constructor(public readonly sourceLocation?: string) {
    super();
  }
}

/**
 * Module IR - Racine de l'IR
 */
export class IRModule extends IRNode {
  readonly type = IRNodeType.Module;
  
  constructor(
    public readonly name: string,
    public readonly functions: IRFunction[] = [],
    public readonly globals: IRVariable[] = [],
    public readonly sourceLocation?: string
  ) {
    super();
  }
  
  toString(): string {
    return `module ${this.name} { ${this.functions.length} functions, ${this.globals.length} globals }`;
  }
  
  addFunction(func: IRFunction): void {
    this.functions.push(func);
  }
  
  addGlobal(global: IRVariable): void {
    this.globals.push(global);
  }
}

/**
 * Fonction IR
 */
export class IRFunction extends LocatedIRNode {
  readonly type = IRNodeType.Function;
  
  constructor(
    public readonly name: string,
    public readonly returnType: Type,
    public readonly parameters: IRFunctionParameter[] = [],
    public readonly body: IRFunctionBody,
    public readonly isPublic: boolean = false,
    public readonly isStatic: boolean = false,
    sourceLocation?: string
  ) {
    super(sourceLocation);
  }
  
  toString(): string {
    const params = this.parameters.map(p => p.toString()).join(', ');
    return `function ${this.name}(${params}): ${this.returnType} ${this.body.toString()}`;
  }
}

/**
 * Parametre de fonction IR
 */
export class IRFunctionParameter extends TypedIRNode {
  readonly type = IRNodeType.FunctionParameter;
  
  constructor(
    public readonly name: string,
    irType: Type,
    public readonly index: number
  ) {
    super(irType);
  }
  
  toString(): string {
    return `${this.name}: ${this.irType}`;
  }
}

/**
 * Corps de fonction IR
 */
export class IRFunctionBody extends IRNode {
  readonly type = IRNodeType.FunctionBody;
  
  constructor(
    public readonly blocks: BasicBlock[] = [],
    public readonly entryBlock: BasicBlock | null = null
  ) {
    super();
  }
  
  toString(): string {
    return `{ ${this.blocks.length} blocks }`;
  }
  
  addBlock(block: BasicBlock): void {
    this.blocks.push(block);
    if (!this.entryBlock) {
      this.entryBlock = block;
    }
  }
}

/**
 * Bloc de base IR
 */
export class BasicBlock extends LocatedIRNode {
  readonly type = IRNodeType.BasicBlock;
  
  private _instructions: IRInstruction[] = [];
  private _terminator: IRInstruction | null = null;
  
  constructor(
    public readonly label: string,
    sourceLocation?: string
  ) {
    super(sourceLocation);
  }
  
  toString(): string {
    return `${this.label}: [${this._instructions.length} instructions, ${this._terminator ? 'terminated' : 'unterminated'}]`;
  }
  
  get instructions(): IRInstruction[] {
    return [...this._instructions];
  }
  
  get terminator(): IRInstruction | null {
    return this._terminator;
  }
  
  addInstruction(instruction: IRInstruction): void {
    // Verifier que ce n'est pas un terminateur
    if (isTerminator(instruction)) {
      if (this._terminator) {
        throw new Error('BasicBlock already has a terminator');
      }
      this._terminator = instruction;
    }
    this._instructions.push(instruction);
  }
  
  setTerminator(terminator: IRInstruction): void {
    if (!isTerminator(terminator)) {
      throw new Error('Instruction is not a terminator');
    }
    if (this._terminator) {
      throw new Error('BasicBlock already has a terminator');
    }
    this._terminator = terminator;
    this._instructions.push(terminator);
  }
}

/**
 * Instruction IR de base
 */
export abstract class IRInstruction extends LocatedIRNode {
  constructor(sourceLocation?: string) {
    super(sourceLocation);
  }
}

/**
 * Instruction terminatrice (termine un bloc)
 */
export abstract class TerminatorInstruction extends IRInstruction {
  constructor(sourceLocation?: string) {
    super(sourceLocation);
  }
}

/**
 * Verifie si une instruction est un terminateur
 */
export function isTerminator(instruction: IRInstruction): instruction is TerminatorInstruction {
  return instruction instanceof TerminatorInstruction;
}

/**
 * Instruction Return
 */
export class IRReturn extends TerminatorInstruction {
  readonly type = IRNodeType.Return;
  
  constructor(
    public readonly value: IRValue | null,
    sourceLocation?: string
  ) {
    super(sourceLocation);
  }
  
  toString(): string {
    return `return ${this.value ? this.value.toString() : 'void'}`;
  }
}

/**
 * Instruction Branch (saut inconditionnel)
 */
export class IRBranch extends TerminatorInstruction {
  readonly type = IRNodeType.Branch;
  
  constructor(
    public readonly target: BasicBlock,
    sourceLocation?: string
  ) {
    super(sourceLocation);
  }
  
  toString(): string {
    return `br ${this.target.label}`;
  }
}

/**
 * Instruction ConditionalBranch (saut conditionnel)
 */
export class IRConditionalBranch extends TerminatorInstruction {
  readonly type = IRNodeType.ConditionalBranch;
  
  constructor(
    public readonly condition: IRValue,
    public readonly thenBlock: BasicBlock,
    public readonly elseBlock: BasicBlock,
    sourceLocation?: string
  ) {
    super(sourceLocation);
  }
  
  toString(): string {
    return `br ${this.condition.toString()} ? ${this.thenBlock.label} : ${this.elseBlock.label}`;
  }
}

/**
 * Instruction Call (appel de fonction)
 */
export class IRCall extends IRInstruction {
  readonly type = IRNodeType.Call;
  
  constructor(
    public readonly function: IRFunction,
    public readonly arguments: IRValue[] = [],
    public readonly resultType: Type,
    sourceLocation?: string
  ) {
    super(sourceLocation);
  }
  
  toString(): string {
    const args = this.arguments.map(a => a.toString()).join(', ');
    return `${this.function.name}(${args})`;
  }
}

/**
 * Instruction Allocate (allocation memoire)
 */
export class IRAllocate extends IRInstruction {
  readonly type = IRNodeType.Allocate;
  
  constructor(
    public readonly type: Type,
    public readonly size: number,
    public readonly result: IRVariable,
    sourceLocation?: string
  ) {
    super(sourceLocation);
  }
  
  toString(): string {
    return `${this.result.name} = allocate ${this.type}, ${this.size}`;
  }
}

/**
 * Instruction Store (stocker une valeur)
 */
export class IRStore extends IRInstruction {
  readonly type = IRNodeType.Store;
  
  constructor(
    public readonly pointer: IRValue,
    public readonly value: IRValue,
    sourceLocation?: string
  ) {
    super(sourceLocation);
  }
  
  toString(): string {
    return `store ${this.value.toString()} to ${this.pointer.toString()}`;
  }
}

/**
 * Instruction Load (charger une valeur)
 */
export class IRLoad extends IRInstruction {
  readonly type = IRNodeType.Load;
  
  constructor(
    public readonly pointer: IRValue,
    public readonly result: IRVariable,
    sourceLocation?: string
  ) {
    super(sourceLocation);
  }
  
  toString(): string {
    return `${this.result.name} = load ${this.pointer.toString()}`;
  }
}

/**
 * Operation binaire
 */
export enum BinaryOp {
  Add = 'add',
  Sub = 'sub',
  Mul = 'mul',
  Div = 'div',
  Mod = 'mod',
  And = 'and',
  Or = 'or',
  Xor = 'xor',
  Shl = 'shl',
  Shr = 'shr',
}

/**
 * Instruction BinaryOperation
 */
export class IRBinaryOperation extends IRInstruction {
  readonly type = IRNodeType.BinaryOperation;
  
  constructor(
    public readonly op: BinaryOp,
    public readonly left: IRValue,
    public readonly right: IRValue,
    public readonly result: IRVariable,
    sourceLocation?: string
  ) {
    super(sourceLocation);
  }
  
  toString(): string {
    return `${this.result.name} = ${this.left.toString()} ${this.op} ${this.right.toString()}`;
  }
}

/**
 * Operation unaire
 */
export enum UnaryOp {
  Neg = 'neg',
  Not = 'not',
  BitNot = 'bitnot',
}

/**
 * Instruction UnaryOperation
 */
export class IRUnaryOperation extends IRInstruction {
  readonly type = IRNodeType.UnaryOperation;
  
  constructor(
    public readonly op: UnaryOp,
    public readonly operand: IRValue,
    public readonly result: IRVariable,
    sourceLocation?: string
  ) {
    super(sourceLocation);
  }
  
  toString(): string {
    return `${this.result.name} = ${this.op}${this.operand.toString()}`;
  }
}

/**
 * Operation de comparaison
 */
export enum CompareOp {
  Eq = 'eq',
  Neq = 'neq',
  Lt = 'lt',
  Gt = 'gt',
  Le = 'le',
  Ge = 'ge',
}

/**
 * Instruction Compare
 */
export class IRCompare extends IRInstruction {
  readonly type = IRNodeType.Compare;
  
  constructor(
    public readonly op: CompareOp,
    public readonly left: IRValue,
    public readonly right: IRValue,
    public readonly result: IRVariable,
    sourceLocation?: string
  ) {
    super(sourceLocation);
  }
  
  toString(): string {
    return `${this.result.name} = ${this.left.toString()} ${this.op} ${this.right.toString()}`;
  }
}

/**
 * Instruction Phi (pour SSA form)
 */
export class IRPhi extends IRInstruction {
  readonly type = IRNodeType.Phi;
  
  constructor(
    public readonly variable: IRVariable,
    public readonly incoming: Map<BasicBlock, IRValue> = new Map(),
    sourceLocation?: string
  ) {
    super(sourceLocation);
  }
  
  toString(): string {
    const incoming = Array.from(this.incoming.entries())
      .map(([block, value]) => `[${block.label}: ${value.toString()}]`)
      .join(', ');
    return `${this.variable.name} = phi(${incoming})`;
  }
  
  addIncoming(block: BasicBlock, value: IRValue): void {
    this.incoming.set(block, value);
  }
}

/**
 * Valeur IR de base
 */
export abstract class IRValue extends IRNode {
  constructor() {
    super();
  }
}

/**
 * Constante IR
 */
export class IRConstant extends IRValue {
  readonly type = IRNodeType.Constant;
  
  constructor(
    public readonly value: string | number | boolean | null,
    public readonly irType: Type
  ) {
    super();
  }
  
  toString(): string {
    return `const ${this.value} : ${this.irType}`;
  }
}

/**
 * Variable IR
 */
export class IRVariable extends TypedIRNode {
  readonly type = IRNodeType.Variable;
  
  constructor(
    public readonly name: string,
    irType: Type,
    public readonly isGlobal: boolean = false
  ) {
    super(irType);
  }
  
  toString(): string {
    return `${this.name} : ${this.irType}${this.isGlobal ? ' (global)' : ''}`;
  }
}

/**
 * Argument IR
 */
export class IRArgument extends TypedIRNode {
  readonly type = IRNodeType.Argument;
  
  constructor(
    public readonly name: string,
    irType: Type,
    public readonly index: number
  ) {
    super(irType);
  }
  
  toString(): string {
    return `arg${this.index} (${this.name}): ${this.irType}`;
  }
}

/**
 * Instruction Nop (no operation)
 */
export class IRNop extends IRInstruction {
  readonly type = IRNodeType.Nop;
  
  toString(): string {
    return 'nop';
  }
}

/**
 * Instruction Unreachable
 */
export class IRUnreachable extends TerminatorInstruction {
  readonly type = IRNodeType.Unreachable;
  
  toString(): string {
    return 'unreachable';
  }
}

/**
 * Type literal IR
 */
export class IRTypeLiteral extends IRValue {
  readonly type = IRNodeType.TypeLiteral;
  
  constructor(public readonly type: Type) {
    super();
  }
  
  toString(): string {
    return `type ${this.type}`;
  }
}

// Types pour les noeuds IR
export type IRNodeChild = 
  | IRModule
  | IRFunction
  | IRFunctionParameter
  | IRFunctionBody
  | BasicBlock
  | IRInstruction
  | IRValue
  | IRConstant
  | IRVariable
  | IRArgument;
