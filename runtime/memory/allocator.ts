/**
 * Allocator - Allocateur de memoire pour Zinga
 * 
 * Ce module implemente un allocateur de memoire pour le runtime Zinga.
 * Il gere l'allocation, la liberation et le suivi de la memoire.
 */

import { MemoryException, OutOfMemoryException } from '../errors/exceptions';
import { getEnvironment } from '../environment';

/**
 * Type de bloc memoire
 */
export enum MemoryBlockType {
  // Bloc libre
  Free = 'Free',
  // Bloc alloue
  Allocated = 'Allocated',
  // Bloc reserve (pour l'alignement)
  Reserved = 'Reserved',
}

/**
 * Bloc de memoire
 */
export interface MemoryBlock {
  // Adresse de debut du bloc
  address: number;
  // Taille du bloc en octets
  size: number;
  // Type du bloc
  type: MemoryBlockType;
  // Adresse suivante (pour la liste chainee)
  next: number;
  // Adresse precedente
  prev: number;
  // Metadonnees (optionnel)
  metadata?: any;
}

/**
 * Configuration de l'allocateur
 */
export interface AllocatorConfig {
  // Taille initiale du tas en octets
  initialSize: number;
  // Taille maximale du tas en octets
  maxSize: number;
  // Alignement par defaut en octets
  alignment: number;
  // Strategie d'allocation
  strategy: AllocationStrategy;
  // Verifier les debordements
  checkOverflow: boolean;
  // Remplir la memoire liberee
  fillFreedMemory: boolean;
}

/**
 * Strategie d'allocation
 */
export enum AllocationStrategy {
  // Premier ajustement
  FirstFit = 'FirstFit',
  // Meilleur ajustement
  BestFit = 'BestFit',
  // Dernier ajustement
  LastFit = 'LastFit',
  // Ajustement suivant
  NextFit = 'NextFit',
  // Allocation par pool
  Pool = 'Pool',
}

/**
 * Statistiques de l'allocateur
 */
export interface AllocatorStats {
  // Taille totale du tas
  totalSize: number;
  // Taille utilisee
  usedSize: number;
  // Taille libre
  freeSize: number;
  // Nombre d'allocations
  allocations: number;
  // Nombre de liberations
  frees: number;
  // Nombre de blocs
  blocks: number;
  // Nombre de blocs libres
  freeBlocks: number;
  // Nombre de blocs alloues
  allocatedBlocks: number;
  // Fragmentation
  fragmentation: number;
}

/**
 * Allocateur de memoire
 */
export class MemoryAllocator {
  private buffer: Buffer;
  private config: AllocatorConfig;
  private stats: AllocatorStats;
  private lastAllocation: number = 0;
  private fillByte: number = 0xDD; // Byte de remplissage pour la detection de debordements
  
  constructor(config: Partial<AllocatorConfig> = {}) {
    this.config = {
      initialSize: 1024 * 1024, // 1 MB
      maxSize: 256 * 1024 * 1024, // 256 MB
      alignment: 8,
      strategy: AllocationStrategy.FirstFit,
      checkOverflow: true,
      fillFreedMemory: true,
      ...config,
    };
    
    // Allouer le buffer initial
    this.buffer = Buffer.alloc(this.config.initialSize, this.fillByte);
    
    // Initialiser les statistiques
    this.stats = {
      totalSize: this.config.initialSize,
      usedSize: 0,
      freeSize: this.config.initialSize,
      allocations: 0,
      frees: 0,
      blocks: 1,
      freeBlocks: 1,
      allocatedBlocks: 0,
      fragmentation: 0,
    };
    
    // Initialiser le premier bloc
    this.writeBlock(0, {
      address: 0,
      size: this.config.initialSize,
      type: MemoryBlockType.Free,
      next: 0xFFFFFFFF,
      prev: 0xFFFFFFFF,
    });
  }
  
  /**
   * Ecrire un bloc de memoire
   */
  private writeBlock(address: number, block: MemoryBlock): void {
    // Ecrire l'en-tete du bloc
    this.buffer.writeUInt32LE(block.address, address);
    this.buffer.writeUInt32LE(block.size, address + 4);
    this.buffer.writeUInt8(block.type === MemoryBlockType.Free ? 0 : 
                           block.type === MemoryBlockType.Allocated ? 1 : 2, 
                           address + 8);
    this.buffer.writeUInt32LE(block.next, address + 12);
    this.buffer.writeUInt32LE(block.prev, address + 16);
    
    // Ecrire les metadonnees si presentes
    if (block.metadata) {
      // Reserver de l'espace pour les metadonnees
    }
  }
  
  /**
   * Lire un bloc de memoire
   */
  private readBlock(address: number): MemoryBlock | null {
    if (address < 0 || address >= this.buffer.length) {
      return null;
    }
    
    const block: MemoryBlock = {
      address: this.buffer.readUInt32LE(address),
      size: this.buffer.readUInt32LE(address + 4),
      type: this.buffer.readUInt8(address + 8) as MemoryBlockType,
      next: this.buffer.readUInt32LE(address + 12),
      prev: this.buffer.readUInt32LE(address + 16),
    };
    
    return block;
  }
  
  /**
   * Allouer de la memoire
   */
  allocate(size: number, alignment: number = this.config.alignment): number {
    // Verifier que la taille est valide
    if (size <= 0) {
      throw new MemoryException('Allocation size must be positive');
    }
    
    // Ajouter l'en-tete du bloc
    const totalSize = size + 20; // 20 octets pour l'en-tete
    
    // Aligner la taille
    const alignedSize = this.alignSize(totalSize, alignment);
    
    // Verifier si on a assez de memoire
    if (alignedSize > this.stats.freeSize) {
      // Essayer d'etendre le tas
      if (this.extendHeap(alignedSize)) {
        // Reessayer l'allocation
        return this.allocate(size, alignment);
      }
      
      // Pas assez de memoire
      throw new OutOfMemoryException(alignedSize, this.stats.freeSize);
    }
    
    // Trouver un bloc libre
    const blockAddress = this.findFreeBlock(alignedSize);
    
    if (blockAddress === -1) {
      throw new OutOfMemoryException(alignedSize, this.stats.freeSize);
    }
    
    // Allouer le bloc
    const block = this.readBlock(blockAddress)!;
    
    // Si le bloc est plus grand que necessaire, le diviser
    if (block.size > alignedSize + 20) {
      this.splitBlock(blockAddress, alignedSize);
    }
    
    // Marquer le bloc comme alloue
    this.writeBlock(blockAddress, {
      ...block,
      type: MemoryBlockType.Allocated,
      size: alignedSize,
    });
    
    // Mettre a jour les statistiques
    this.stats.usedSize += alignedSize;
    this.stats.freeSize -= alignedSize;
    this.stats.allocations++;
    this.stats.allocatedBlocks++;
    this.stats.freeBlocks--;
    
    // Retourner l'adresse des donnees (apres l'en-tete)
    const dataAddress = blockAddress + 20;
    
    // Remplir la memoire avec le byte de remplissage (pour le debug)
    if (getEnvironment().isDev()) {
      this.buffer.fill(this.fillByte, dataAddress, dataAddress + size);
    }
    
    this.lastAllocation = dataAddress;
    
    return dataAddress;
  }
  
  /**
   * Liberer de la memoire
   */
  free(address: number): void {
    if (address < 20 || address >= this.buffer.length) {
      throw new MemoryException(`Invalid address: ${address}`);
    }
    
    // Lire le bloc
    const blockAddress = address - 20;
    const block = this.readBlock(blockAddress);
    
    if (!block) {
      throw new MemoryException(`No block found at address: ${address}`);
    }
    
    if (block.type !== MemoryBlockType.Allocated) {
      throw new MemoryException(`Block at address ${address} is not allocated`);
    }
    
    // Verifier les debordements (en mode dev)
    if (this.config.checkOverflow && getEnvironment().isDev()) {
      this.checkMemoryOverflow(blockAddress, block.size);
    }
    
    // Remplir la memoire liberee
    if (this.config.fillFreedMemory) {
      this.buffer.fill(0xFF, blockAddress, blockAddress + block.size);
    }
    
    // Marquer le bloc comme libre
    this.writeBlock(blockAddress, {
      ...block,
      type: MemoryBlockType.Free,
    });
    
    // Fusionner avec les blocs adjacents
    this.mergeBlocks(blockAddress);
    
    // Mettre a jour les statistiques
    this.stats.usedSize -= block.size;
    this.stats.freeSize += block.size;
    this.stats.frees++;
    this.stats.allocatedBlocks--;
    this.stats.freeBlocks++;
  }
  
  /**
   * Trouver un bloc libre
   */
  private findFreeBlock(size: number): number {
    let current = 0;
    let bestFit = -1;
    let bestFitSize = Infinity;
    
    while (current < this.buffer.length) {
      const block = this.readBlock(current);
      
      if (!block) {
        break;
      }
      
      if (block.type === MemoryBlockType.Free && block.size >= size) {
        switch (this.config.strategy) {
          case AllocationStrategy.FirstFit:
            return current;
          
          case AllocationStrategy.BestFit:
            if (block.size < bestFitSize) {
              bestFit = current;
              bestFitSize = block.size;
            }
            break;
          
          case AllocationStrategy.LastFit:
            bestFit = current;
            bestFitSize = block.size;
            break;
          
          case AllocationStrategy.NextFit:
            if (current >= this.lastAllocation) {
              return current;
            }
            if (bestFit === -1) {
              bestFit = current;
              bestFitSize = block.size;
            }
            break;
        }
      }
      
      // Passer au bloc suivant
      if (block.next === 0xFFFFFFFF) {
        break;
      }
      current = block.next;
    }
    
    // Pour BestFit et LastFit, retourner le meilleur ajustement
    if (bestFit !== -1) {
      return bestFit;
    }
    
    // Pour NextFit, revenir au debut
    if (this.config.strategy === AllocationStrategy.NextFit) {
      return this.findFreeBlockFromStart(size);
    }
    
    return -1;
  }
  
  /**
   * Trouver un bloc libre depuis le debut (pour NextFit)
   */
  private findFreeBlockFromStart(size: number): number {
    let current = 0;
    
    while (current < this.buffer.length) {
      const block = this.readBlock(current);
      
      if (!block) {
        break;
      }
      
      if (block.type === MemoryBlockType.Free && block.size >= size) {
        return current;
      }
      
      if (block.next === 0xFFFFFFFF) {
        break;
      }
      current = block.next;
    }
    
    return -1;
  }
  
  /**
   * Diviser un bloc
   */
  private splitBlock(address: number, size: number): void {
    const block = this.readBlock(address)!;
    
    // Calculer la taille du nouveau bloc libre
    const newBlockSize = block.size - size - 20;
    
    if (newBlockSize < 20) {
      // Pas assez d'espace pour un nouveau bloc, ne pas diviser
      return;
    }
    
    // Ecrire le bloc alloue
    this.writeBlock(address, {
      ...block,
      size,
      type: MemoryBlockType.Allocated,
    });
    
    // Ecrire le nouveau bloc libre
    const newBlockAddress = address + size;
    this.writeBlock(newBlockAddress, {
      address: newBlockAddress,
      size: newBlockSize,
      type: MemoryBlockType.Free,
      next: block.next,
      prev: address,
    });
    
    // Mettre a jour le bloc suivant
    if (block.next !== 0xFFFFFFFF) {
      const nextBlock = this.readBlock(block.next)!;
      this.writeBlock(block.next, {
        ...nextBlock,
        prev: newBlockAddress,
      });
    }
    
    // Mettre a jour les statistiques
    this.stats.blocks++;
    this.stats.freeBlocks++;
  }
  
  /**
   * Fusionner les blocs adjacents
   */
  private mergeBlocks(address: number): void {
    const block = this.readBlock(address)!;
    
    // Fusionner avec le bloc precedent
    if (block.prev !== 0xFFFFFFFF) {
      const prevBlock = this.readBlock(block.prev)!;
      
      if (prevBlock.type === MemoryBlockType.Free) {
        // Fusionner avec le precedent
        this.writeBlock(prevBlock.address, {
          ...prevBlock,
          size: prevBlock.size + block.size + 20,
          next: block.next,
        });
        
        // Mettre a jour le bloc suivant
        if (block.next !== 0xFFFFFFFF) {
          const nextBlock = this.readBlock(block.next)!;
          this.writeBlock(block.next, {
            ...nextBlock,
            prev: prevBlock.address,
          });
        }
        
        // Mettre a jour les statistiques
        this.stats.blocks--;
        this.stats.freeBlocks--;
        
        // Continuer avec le bloc precedent
        address = prevBlock.address;
      }
    }
    
    // Fusionner avec le bloc suivant
    if (block.next !== 0xFFFFFFFF) {
      const nextBlock = this.readBlock(block.next)!;
      
      if (nextBlock.type === MemoryBlockType.Free) {
        const currentBlock = this.readBlock(address)!;
        
        this.writeBlock(address, {
          ...currentBlock,
          size: currentBlock.size + nextBlock.size + 20,
          next: nextBlock.next,
        });
        
        // Mettre a jour le bloc suivant
        if (nextBlock.next !== 0xFFFFFFFF) {
          const nextNextBlock = this.readBlock(nextBlock.next)!;
          this.writeBlock(nextBlock.next, {
            ...nextNextBlock,
            prev: address,
          });
        }
        
        // Mettre a jour les statistiques
        this.stats.blocks--;
        this.stats.freeBlocks--;
      }
    }
  }
  
  /**
   * Etendre le tas
   */
  private extendHeap(size: number): boolean {
    // Calculer la nouvelle taille
    const newSize = Math.min(
      this.stats.totalSize + size,
      this.config.maxSize
    );
    
    if (newSize <= this.stats.totalSize) {
      return false;
    }
    
    // Creer un nouveau buffer
    const newBuffer = Buffer.alloc(newSize, this.fillByte);
    
    // Copier l'ancien buffer
    this.buffer.copy(newBuffer);
    
    // Mettre a jour le buffer
    this.buffer = newBuffer;
    
    // Mettre a jour les statistiques
    const oldSize = this.stats.totalSize;
    this.stats.totalSize = newSize;
    this.stats.freeSize += newSize - oldSize;
    
    // Creer un nouveau bloc libre avec l'espace additionnel
    const lastBlock = this.findLastBlock();
    const newBlockAddress = lastBlock.address + lastBlock.size;
    const newBlockSize = newSize - (newBlockAddress + 20);
    
    this.writeBlock(lastBlock.address, {
      ...lastBlock,
      next: newBlockAddress,
    });
    
    this.writeBlock(newBlockAddress, {
      address: newBlockAddress,
      size: newBlockSize,
      type: MemoryBlockType.Free,
      next: 0xFFFFFFFF,
      prev: lastBlock.address,
    });
    
    this.stats.blocks++;
    this.stats.freeBlocks++;
    
    return true;
  }
  
  /**
   * Trouver le dernier bloc
   */
  private findLastBlock(): MemoryBlock {
    let current = 0;
    let lastBlock: MemoryBlock | null = null;
    
    while (current < this.buffer.length) {
      const block = this.readBlock(current);
      
      if (!block) {
        break;
      }
      
      lastBlock = block;
      
      if (block.next === 0xFFFFFFFF) {
        break;
      }
      
      current = block.next;
    }
    
    return lastBlock!;
  }
  
  /**
   * Verifier les debordements memoire
   */
  private checkMemoryOverflow(address: number, size: number): void {
    // Verifier avant le bloc
    const before = this.buffer.readUInt32LE(address - 4);
    if (before !== this.fillByte) {
      throw new MemoryException(`Memory overflow detected before block at ${address}`);
    }
    
    // Verifier apres le bloc
    const afterAddress = address + size;
    if (afterAddress < this.buffer.length) {
      const after = this.buffer.readUInt32LE(afterAddress);
      if (after !== this.fillByte) {
        throw new MemoryException(`Memory overflow detected after block at ${address}`);
      }
    }
  }
  
  /**
   * Aligner une taille
   */
  private alignSize(size: number, alignment: number): number {
    return Math.ceil(size / alignment) * alignment;
  }
  
  /**
   * Obtenir les statistiques
   */
  getStats(): AllocatorStats {
    return { ...this.stats };
  }
  
  /**
   * Reinitialiser les statistiques
   */
  resetStats(): void {
    this.stats.allocations = 0;
    this.stats.frees = 0;
  }
  
  /**
   * Obtenir la taille totale
   */
  getTotalSize(): number {
    return this.stats.totalSize;
  }
  
  /**
   * Obtenir la taille utilisee
   */
  getUsedSize(): number {
    return this.stats.usedSize;
  }
  
  /**
   * Obtenir la taille libre
   */
  getFreeSize(): number {
    return this.stats.freeSize;
  }
  
  /**
   * Verifier l'integrite de la memoire
   */
  checkIntegrity(): boolean {
    let current = 0;
    let blockCount = 0;
    let freeCount = 0;
    let allocatedCount = 0;
    let totalSize = 0;
    
    while (current < this.buffer.length) {
      const block = this.readBlock(current);
      
      if (!block) {
        return false;
      }
      
      blockCount++;
      totalSize += block.size;
      
      if (block.type === MemoryBlockType.Free) {
        freeCount++;
      } else if (block.type === MemoryBlockType.Allocated) {
        allocatedCount++;
      }
      
      if (block.next === 0xFFFFFFFF) {
        break;
      }
      
      current = block.next;
    }
    
    // Verifier que les compteurs correspondent
    return blockCount === this.stats.blocks &&
           freeCount === this.stats.freeBlocks &&
           allocatedCount === this.stats.allocatedBlocks;
  }
  
  /**
   * Defragmenter la memoire
   */
  defragment(): void {
    // Implémentation simplifiée
    // Une defragmentation complete necessiterait de deplacer les blocs alloues
  }
  
  /**
   * Obtenir la configuration
   */
  getConfig(): AllocatorConfig {
    return { ...this.config };
  }
  
  /**
   * Mettre a jour la configuration
   */
  updateConfig(config: Partial<AllocatorConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Reinitialiser l'allocateur
   */
  reset(): void {
    this.buffer = Buffer.alloc(this.config.initialSize, this.fillByte);
    
    this.stats = {
      totalSize: this.config.initialSize,
      usedSize: 0,
      freeSize: this.config.initialSize,
      allocations: 0,
      frees: 0,
      blocks: 1,
      freeBlocks: 1,
      allocatedBlocks: 0,
      fragmentation: 0,
    };
    
    this.lastAllocation = 0;
    
    this.writeBlock(0, {
      address: 0,
      size: this.config.initialSize,
      type: MemoryBlockType.Free,
      next: 0xFFFFFFFF,
      prev: 0xFFFFFFFF,
    });
  }
}

/**
 * Allocateur global
 */
let globalAllocator: MemoryAllocator | null = null;

/**
 * Obtenir l'allocateur global
 */
export function getAllocator(config?: Partial<AllocatorConfig>): MemoryAllocator {
  if (!globalAllocator) {
    globalAllocator = new MemoryAllocator(config);
  }
  return globalAllocator;
}

/**
 * Creer un nouvel allocateur
 */
export function createAllocator(config?: Partial<AllocatorConfig>): MemoryAllocator {
  return new MemoryAllocator(config);
}

/**
 * Allouer de la memoire
 */
export function allocate(size: number, alignment?: number): number {
  return getAllocator().allocate(size, alignment);
}

/**
 * Liberer de la memoire
 */
export function free(address: number): void {
  getAllocator().free(address);
}

/**
 * Obtenir les statistiques de l'allocateur
 */
export function getAllocatorStats(): AllocatorStats {
  return getAllocator().getStats();
}
