/**
 * Borrowing - Emprunt de references pour Zinga
 * 
 * Ce module implemente un systeme d'emprunt de references (borrowing)
 * similaire a celui de Rust. Il permet d'emprunter des references
 * a des valeurs sans en prendre la propriete.
 */

import { Box, Rc, WeakRef } from './ownership';
import { MemoryException } from '../errors/exceptions';

/**
 * Type d'emprunt
 */
export enum BorrowType {
  // Emprunt immutable (lecture seule)
  Immutable = 'Immutable',
  // Emprunt mutable (lecture/ecriture)
  Mutable = 'Mutable',
}

/**
 * Emprunt de base
 */
export abstract class Borrow<T = any> {
  protected owner: Box<T> | Rc<T> | WeakRef<T>;
  protected type: BorrowType;
  protected isValidFlag: boolean = true;
  
  constructor(owner: Box<T> | Rc<T> | WeakRef<T>, type: BorrowType) {
    this.owner = owner;
    this.type = type;
  }
  
  /**
   * Obtenir le type d'emprunt
   */
  getBorrowType(): BorrowType {
    return this.type;
  }
  
  /**
   * Obtenir la valeur
   */
  get(): T {
    if (!this.isValid()) {
      throw new MemoryException('Cannot get value from invalid borrow');
    }
    
    const value = this.owner.get();
    if (value === undefined) {
      throw new MemoryException('Owner has no value');
    }
    
    return value;
  }
  
  /**
   * Verifier si l'emprunt est valide
   */
  isValid(): boolean {
    return this.isValidFlag && this.owner.isValid();
  }
  
  /**
   * Invalider l'emprunt
   */
  invalidate(): void {
    this.isValidFlag = false;
  }
  
  /**
   * Convertir en chaine
   */
  toString(): string {
    return `${this.type}Borrow`;
  }
}

/**
 * Emprunt immutable
 * 
 * Un emprunt immutable permet de lire la valeur mais pas de la modifier.
 * Plusieurs emprunts immutables peuvent exister simultanement.
 */
export class ImmutableBorrow<T = any> extends Borrow<T> {
  constructor(owner: Box<T> | Rc<T> | WeakRef<T>) {
    super(owner, BorrowType.Immutable);
  }
  
  /**
   * Obtenir la valeur (alias de get)
   */
  read(): T {
    return this.get();
  }
  
  /**
   * Cloner l'emprunt
   */
  clone(): ImmutableBorrow<T> {
    if (!this.isValid()) {
      throw new MemoryException('Cannot clone invalid borrow');
    }
    
    return new ImmutableBorrow<T>(this.owner);
  }
}

/**
 * Emprunt mutable
 * 
 * Un emprunt mutable permet de lire et modifier la valeur.
 * Un seul emprunt mutable peut exister a la fois.
 */
export class MutableBorrow<T = any> extends Borrow<T> {
  private isBorrowed: boolean = false;
  
  constructor(owner: Box<T>) {
    super(owner, BorrowType.Mutable);
    
    if (!(owner instanceof Box)) {
      throw new MemoryException('Mutable borrow requires a Box owner');
    }
  }
  
  /**
   * Obtenir la valeur
   */
  get(): T {
    if (!this.isValid()) {
      throw new MemoryException('Cannot get value from invalid mutable borrow');
    }
    
    const value = (this.owner as Box<T>).get();
    if (value === undefined) {
      throw new MemoryException('Owner has no value');
    }
    
    return value;
  }
  
  /**
   * Definir la valeur
   */
  set(value: T): void {
    if (!this.isValid()) {
      throw new MemoryException('Cannot set value on invalid mutable borrow');
    }
    
    (this.owner as Box<T>).set(value);
  }
  
  /**
   * Emprunter de maniere mutable
   */
  borrow(): MutableBorrow<T> {
    if (this.isBorrowed) {
      throw new MemoryException('Cannot borrow mutable reference while already borrowed');
    }
    
    this.isBorrowed = true;
    return this;
  }
  
  /**
   * Restituer l'emprunt
   */
  unborrow(): void {
    this.isBorrowed = false;
  }
  
  /**
   * Verifier si l'emprunt est en cours
   */
  isBorrowed(): boolean {
    return this.isBorrowed;
  }
  
  /**
   * Cloner l'emprunt (impossible pour les emprunts mutables)
   */
  clone(): never {
    throw new MemoryException('Cannot clone mutable borrow');
  }
}

/**
 * Gestionnaire d'emprunts
 */
export class BorrowManager {
  private immutableBorrows: Set<ImmutableBorrow<any>> = new Set();
  private mutableBorrows: Set<MutableBorrow<any>> = new Set();
  
  /**
   * Enregistrer un emprunt immutable
   */
  registerImmutableBorrow<T>(borrow: ImmutableBorrow<T>): void {
    this.immutableBorrows.add(borrow);
  }
  
  /**
   * Supprimer un emprunt immutable
   */
  unregisterImmutableBorrow<T>(borrow: ImmutableBorrow<T>): void {
    this.immutableBorrows.delete(borrow);
  }
  
  /**
   * Enregistrer un emprunt mutable
   */
  registerMutableBorrow<T>(borrow: MutableBorrow<T>): void {
    this.mutableBorrows.add(borrow);
  }
  
  /**
   * Supprimer un emprunt mutable
   */
  unregisterMutableBorrow<T>(borrow: MutableBorrow<T>): void {
    this.mutableBorrows.delete(borrow);
  }
  
  /**
   * Verifier si un emprunt mutable existe
   */
  hasMutableBorrow<T>(owner: Box<T>): boolean {
    for (const borrow of this.mutableBorrows) {
      if ((borrow as any).owner === owner) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Verifier si un emprunt immutable existe
   */
  hasImmutableBorrow<T>(owner: Box<T> | Rc<T> | WeakRef<T>): boolean {
    for (const borrow of this.immutableBorrows) {
      if ((borrow as any).owner === owner) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Invalider tous les emprunts pour un propriétaire
   */
  invalidateBorrowsFor<T>(owner: Box<T> | Rc<T> | WeakRef<T>): void {
    for (const borrow of this.immutableBorrows) {
      if ((borrow as any).owner === owner) {
        borrow.invalidate();
        this.immutableBorrows.delete(borrow);
      }
    }
    
    for (const borrow of this.mutableBorrows) {
      if ((borrow as any).owner === owner) {
        borrow.invalidate();
        this.mutableBorrows.delete(borrow);
      }
    }
  }
  
  /**
   * Invalider tous les emprunts
   */
  invalidateAllBorrows(): void {
    for (const borrow of this.immutableBorrows) {
      borrow.invalidate();
    }
    this.immutableBorrows.clear();
    
    for (const borrow of this.mutableBorrows) {
      borrow.invalidate();
    }
    this.mutableBorrows.clear();
  }
  
  /**
   * Obtenir le nombre d'emprunts immutables
   */
  getImmutableBorrowCount(): number {
    return this.immutableBorrows.size;
  }
  
  /**
   * Obtenir le nombre d'emprunts mutables
   */
  getMutableBorrowCount(): number {
    return this.mutableBorrows.size;
  }
  
  /**
   * Reinitialiser
   */
  clear(): void {
    this.immutableBorrows.clear();
    this.mutableBorrows.clear();
  }
}

/**
 * Fabrique d'emprunts
 */
export class BorrowFactory {
  private manager: BorrowManager;
  
  constructor(manager?: BorrowManager) {
    this.manager = manager || new BorrowManager();
  }
  
  /**
   * Creer un emprunt immutable
   */
  createImmutableBorrow<T>(owner: Box<T> | Rc<T> | WeakRef<T>): ImmutableBorrow<T> {
    const borrow = new ImmutableBorrow<T>(owner);
    this.manager.registerImmutableBorrow(borrow);
    return borrow;
  }
  
  /**
   * Creer un emprunt mutable
   */
  createMutableBorrow<T>(owner: Box<T>): MutableBorrow<T> {
    const borrow = new MutableBorrow<T>(owner);
    this.manager.registerMutableBorrow(borrow);
    return borrow;
  }
  
  /**
   * Obtenir le gestionnaire
   */
  getManager(): BorrowManager {
    return this.manager;
  }
}

/**
 * Gestionnaire global d'emprunts
 */
let globalBorrowManager: BorrowManager | null = null;

/**
 * Obtenir le gestionnaire global d'emprunts
 */
export function getBorrowManager(): BorrowManager {
  if (!globalBorrowManager) {
    globalBorrowManager = new BorrowManager();
  }
  return globalBorrowManager;
}

/**
 * Creer un emprunt immutable
 */
export function createImmutableBorrow<T>(
  owner: Box<T> | Rc<T> | WeakRef<T>
): ImmutableBorrow<T> {
  return new BorrowFactory().createImmutableBorrow(owner);
}

/**
 * Creer un emprunt mutable
 */
export function createMutableBorrow<T>(owner: Box<T>): MutableBorrow<T> {
  return new BorrowFactory().createMutableBorrow(owner);
}

/**
 * Utilitaires pour le borrowing
 */
export namespace BorrowUtils {
  /**
   * Emprunter de maniere immutable
   */
  export function borrowImmutable<T>(
    owner: Box<T> | Rc<T> | WeakRef<T>
  ): ImmutableBorrow<T> {
    return createImmutableBorrow(owner);
  }
  
  /**
   * Emprunter de maniere mutable
   */
  export function borrowMutable<T>(owner: Box<T>): MutableBorrow<T> {
    return createMutableBorrow(owner);
  }
  
  /**
   * Emprunter et executer une fonction
   */
  export function withBorrow<T, R>(
    owner: Box<T> | Rc<T> | WeakRef<T>,
    callback: (value: T) => R
  ): R {
    const borrow = borrowImmutable(owner);
    try {
      return callback(borrow.get());
    } finally {
      // L'emprunt est automatiquement invalide
    }
  }
  
  /**
   * Emprunter de maniere mutable et executer une fonction
   */
  export function withMutableBorrow<T, R>(
    owner: Box<T>,
    callback: (value: T) => R
  ): R {
    const borrow = borrowMutable(owner);
    try {
      return callback(borrow.get());
    } finally {
      // L'emprunt est automatiquement invalide
    }
  }
  
  /**
   * Emprunter et modifier
   */
  export function withBorrowModify<T>(
    owner: Box<T>,
    callback: (value: T) => T
  ): void {
    const borrow = borrowMutable(owner);
    try {
      const newValue = callback(borrow.get());
      borrow.set(newValue);
    } finally {
      // L'emprunt est automatiquement invalide
    }
  }
}
