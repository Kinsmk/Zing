/**
 * Basic Blocks - Gestion des blocs de base pour l'IR de Zinga
 * 
 * Ce module fournit des utilitaires pour manipuler les blocs de base (Basic Blocks)
 * dans la representation intermediaire.
 */

import { BasicBlock, IRInstruction, IRValue, IRVariable, IRConstant } from './ir-nodes';

/**
 * Type de relation entre blocs
 */
export enum BlockRelationType {
  // Le bloc A est le predcesseur du bloc B
  Predecessor = 'Predecessor',
  // Le bloc A est le successeur du bloc B
  Successor = 'Successor',
  // Le bloc A domine le bloc B
  Dominates = 'Dominates',
  // Le bloc A est domine par le bloc B
  DominatedBy = 'DominatedBy',
}

/**
 * Relation entre deux blocs
 */
export interface BlockRelation {
  type: BlockRelationType;
  from: BasicBlock;
  to: BasicBlock;
}

/**
 * Analyseur de flux de controle pour les blocs
 */
export class BasicBlockAnalyzer {
  private blocks: BasicBlock[];
  private relations: BlockRelation[] = [];
  
  constructor(blocks: BasicBlock[]) {
    this.blocks = blocks;
    this.analyze();
  }
  
  /**
   * Analyser les relations entre les blocs
   */
  private analyze(): void {
    // Reinitialiser les relations
    this.relations = [];
    
    // Pour chaque bloc, trouver ses successeurs
    for (const block of this.blocks) {
      const terminator = block.terminator;
      
      if (!terminator) {
        // Bloc non termine - pas de successeur
        continue;
      }
      
      // Trouver les successeurs en fonction du type de terminateur
      if (terminator.type === 'IRBranch') {
        // Saut inconditionnel
        const branch = terminator as any;
        const target = branch.target as BasicBlock;
        this.addRelation(block, target, BlockRelationType.Successor);
        this.addRelation(target, block, BlockRelationType.Predecessor);
      } else if (terminator.type === 'IRConditionalBranch') {
        // Saut conditionnel
        const condBranch = terminator as any;
        const thenBlock = condBranch.thenBlock as BasicBlock;
        const elseBlock = condBranch.elseBlock as BasicBlock;
        
        this.addRelation(block, thenBlock, BlockRelationType.Successor);
        this.addRelation(block, elseBlock, BlockRelationType.Successor);
        this.addRelation(thenBlock, block, BlockRelationType.Predecessor);
        this.addRelation(elseBlock, block, BlockRelationType.Predecessor);
      } else if (terminator.type === 'IRReturn' || terminator.type === 'IRUnreachable') {
        // Pas de successeur
        continue;
      }
    }
    
    // Analyser la domination
    this.analyzeDominance();
  }
  
  /**
   * Ajouter une relation
   */
  private addRelation(from: BasicBlock, to: BasicBlock, type: BlockRelationType): void {
    this.relations.push({ type, from, to });
  }
  
  /**
   * Analyser les relations de domination
   */
  private analyzeDominance(): void {
    // Implémentation simplifiée de l'analyse de domination
    // Une implémentation complete utiliserait un algorithme plus complexe
    
    // Le bloc d'entree domine tous les autres blocs
    const entryBlock = this.blocks.find(b => b.label === 'entry') || this.blocks[0];
    
    if (entryBlock) {
      for (const block of this.blocks) {
        if (block !== entryBlock) {
          this.addRelation(entryBlock, block, BlockRelationType.Dominates);
          this.addRelation(block, entryBlock, BlockRelationType.DominatedBy);
        }
      }
    }
  }
  
  /**
   * Obtenir les successeurs d'un bloc
   */
  getSuccessors(block: BasicBlock): BasicBlock[] {
    return this.relations
      .filter(r => r.from === block && r.type === BlockRelationType.Successor)
      .map(r => r.to);
  }
  
  /**
   * Obtenir les predcesseurs d'un bloc
   */
  getPredecessors(block: BasicBlock): BasicBlock[] {
    return this.relations
      .filter(r => r.to === block && r.type === BlockRelationType.Predecessor)
      .map(r => r.from);
  }
  
  /**
   * Obtenir les blocs dominés par un bloc
   */
  getDominated(block: BasicBlock): BasicBlock[] {
    return this.relations
      .filter(r => r.from === block && r.type === BlockRelationType.Dominates)
      .map(r => r.to);
  }
  
  /**
   * Verifier si un bloc domine un autre
   */
  dominates(dominator: BasicBlock, dominated: BasicBlock): boolean {
    return this.relations.some(
      r => r.from === dominator && r.to === dominated && r.type === BlockRelationType.Dominates
    );
  }
  
  /**
   * Obtenir toutes les relations
   */
  getAllRelations(): BlockRelation[] {
    return [...this.relations];
  }
  
  /**
   * Trouver les blocs de base dans une fonction
   */
  static findBasicBlocks(instructions: IRInstruction[]): BasicBlock[] {
    const blocks: BasicBlock[] = [];
    let currentBlock: BasicBlock | null = null;
    
    // Creer le bloc d'entree
    currentBlock = new BasicBlock('entry');
    blocks.push(currentBlock);
    
    for (const instruction of instructions) {
      currentBlock.addInstruction(instruction);
      
      // Si l'instruction est un terminateur, commencer un nouveau bloc
      if (isTerminatorInstruction(instruction)) {
        currentBlock = new BasicBlock(`block_${blocks.length}`);
        blocks.push(currentBlock);
      }
    }
    
    return blocks;
  }
  
  /**
   * Optimiser les blocs de base (supprimer les blocs vides, etc.)
   */
  static optimizeBlocks(blocks: BasicBlock[]): BasicBlock[] {
    const optimized: BasicBlock[] = [];
    
    for (const block of blocks) {
      // Supprimer les blocs vides (sauf le bloc d'entree)
      if (block.instructions.length === 0 && block.label !== 'entry') {
        continue;
      }
      
      optimized.push(block);
    }
    
    return optimized;
  }
}

/**
 * Verifier si une instruction est un terminateur
 */
function isTerminatorInstruction(instruction: IRInstruction): boolean {
  return [
    'IRReturn',
    'IRBranch', 
    'IRConditionalBranch',
    'IRUnreachable'
  ].includes(instruction.type);
}

/**
 * Constructeur de blocs de base
 */
export class BasicBlockBuilder {
  private blocks: BasicBlock[] = [];
  private currentBlock: BasicBlock | null = null;
  private blockCounter: number = 0;
  
  /**
   * Creer un nouveau bloc
   */
  createBlock(name?: string): BasicBlock {
    const label = name || `block_${this.blockCounter++}`;
    const block = new BasicBlock(label);
    this.blocks.push(block);
    
    if (!this.currentBlock) {
      this.currentBlock = block;
    }
    
    return block;
  }
  
  /**
   * Ajouter une instruction au bloc courant
   */
  addInstruction(instruction: IRInstruction): void {
    if (!this.currentBlock) {
      this.createBlock();
    }
    this.currentBlock!.addInstruction(instruction);
  }
  
  /**
   * Changer le bloc courant
   */
  setCurrentBlock(block: BasicBlock): void {
    this.currentBlock = block;
  }
  
  /**
   * Obtenir le bloc courant
   */
  getCurrentBlock(): BasicBlock | null {
    return this.currentBlock;
  }
  
  /**
   * Obtenir tous les blocs
   */
  getBlocks(): BasicBlock[] {
    return [...this.blocks];
  }
  
  /**
   * Connecter deux blocs avec un saut inconditionnel
   */
  connectBlocks(from: BasicBlock, to: BasicBlock): void {
    from.addInstruction(new (require('./ir-nodes').IRBranch)(to));
  }
  
  /**
   * Connecter deux blocs avec un saut conditionnel
   */
  connectConditionally(
    from: BasicBlock,
    condition: IRVariable | IRConstant,
    thenBlock: BasicBlock,
    elseBlock: BasicBlock
  ): void {
    from.addInstruction(new (require('./ir-nodes').IRConditionalBranch)(
      condition, thenBlock, elseBlock
    ));
  }
  
  /**
   * Reinitialiser
   */
  reset(): void {
    this.blocks = [];
    this.currentBlock = null;
    this.blockCounter = 0;
  }
}

/**
 * Utilitaires pour les blocs de base
 */
export namespace BasicBlockUtils {
  /**
   * Verifier si un bloc est vide
   */
  export function isEmpty(block: BasicBlock): boolean {
    return block.instructions.length === 0;
  }
  
  /**
   * Verifier si un bloc est termine
   */
  export function isTerminated(block: BasicBlock): boolean {
    return block.terminator !== null;
  }
  
  /**
   * Obtenir le nombre d'instructions dans un bloc
   */
  export function instructionCount(block: BasicBlock): number {
    return block.instructions.length;
  }
  
  /**
   * Cloner un bloc
   */
  export function cloneBlock(block: BasicBlock): BasicBlock {
    const newBlock = new BasicBlock(`${block.label}_clone`);
    
    for (const instruction of block.instructions) {
      // Note: Cela cree une copie superficielle
      // Une copie profonde necessiterait un clone de chaque instruction
      newBlock.addInstruction(instruction);
    }
    
    return newBlock;
  }
}
