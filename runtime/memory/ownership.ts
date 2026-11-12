/**
 * Ownership - Gestion de la propriete pour Zinga
 * 
 * Ce module implemente un systeme de gestion de la propriete (ownership)
 * similaire a celui de Rust. Chaque valeur a un unique proprietaire,
 * et la memoire est liberee lorsque le proprietaire est detruit.
 */

import { MemoryAllocator, getAllocator } from './allocator';
import { MemoryException } from '../errors/exceptions';

/**
 * Type de propriete
 */
export enum OwnershipType {
  // Propriete unique (un seul proprietaire)
  Unique = 'Unique',
  // Propriete partagee (plusieurs references)
  Shared = 'Shared',
  // Propriete faible (reference faible)
  Weak = 'Weak',
}

/**
 * Proprietaire de base
 */
export abstract class Owner<T = any> {
  protected address: number;
  protected size: number;
  protected type: OwnershipType;
  protected value?: T;
  
  constructor(address: number, size: number, type: OwnershipType) {
    this.address = address;
    this.size = size;
    this.type = type;
  }
  
  /**
   * Obtenir l'adresse
   */
  getAddress(): number {
    return this.address;
  }
  
  /**
   * Obtenir la taille
   */
  getSize(): number {
    return this.size;
  }
  
  /**
   * Obtenir le type de propriete
   */
  getOwnershipType(): OwnershipType {
    return this.type;
  }
  
  /**
   * Obtenir la valeur
   */
  get(): T | undefined {
    return this.value;
  }
  
  /**
   * Definir la valeur
   */
  set(value: T): void {
    this.value = value;
  }
  
  /**
   * Verifier si le proprietaire est valide
   */
  isValid(): boolean {
    return this.value !== undefined;
  }
  
  /**
   * Liberer la memoire
   */
  abstract free(): void;
  
  /**
   * Transférer la propriété
   */
  abstract transfer(): Owner<T> | null;
  
  /**
   * Cloner le propriétaire
   */
  abstract clone(): Owner<T>;
  
  /**
   * Convertir en chaîne
   */
  toString(): string {
    return `${this.type}Owner(${this.address}, ${this.size})`;
  }
}

/**
 * Proprietaire unique (Box)
 * 
 * Un Box a une propriete unique sur une valeur.
 * Lorsque le Box est detruit, la valeur est liberee.
 */
export class Box<T = any> extends Owner<T> {
  private allocator: MemoryAllocator;
  
  constructor(value: T, allocator?: MemoryAllocator) {
    const size = this.estimateSize(value);
    const address = (allocator || getAllocator()).allocate(size);
    
    super(address, size, OwnershipType.Unique);
    this.allocator = allocator || getAllocator();
    this.value = value;
  }
  
  /**
   * Estimer la taille d'une valeur
   */
  private estimateSize(value: T): number {
    if (value === null || value === undefined) {
      return 8;
    }
    
    switch (typeof value) {
      case 'boolean':
        return 1;
      case 'number':
        return 8;
      case 'bigint':
        return 16;
      case 'string':
        return Buffer.byteLength(value as string, 'utf8') + 8;
      case 'object':
        if (Array.isArray(value)) {
          return (value as any[]).length * 8 + 16;
        }
        return 32; // Taille par defaut pour les objets
      default:
        return 8;
    }
  }
  
  /**
   * Liberer la memoire
   */
  free(): void {
    if (this.value !== undefined) {
      this.allocator.free(this.address);
      this.value = undefined;
    }
  }
  
  /**
   * Transférer la propriété
   * 
   * Le Box actuel est invalide apres le transfert.
   */
  transfer(): Box<T> | null {
    if (!this.isValid()) {
      return null;
    }
    
    const value = this.value!;
    this.value = undefined;
    
    // Creer un nouveau Box avec la meme adresse
    const newBox = new Box<T>(value, this.allocator);
    newBox.address = this.address;
    newBox.size = this.size;
    
    return newBox;
  }
  
  /**
   * Cloner le propriétaire
   */
  clone(): Box<T> {
    if (!this.isValid()) {
      throw new MemoryException('Cannot clone invalid Box');
    }
    
    return new Box<T>(this.value!, this.allocator);
  }
  
  /**
   * Prendre la valeur et liberer le Box
   */
  take(): T {
    const value = this.value!;
    this.free();
    return value;
  }
  
  /**
   * Remplacer la valeur
   */
  replace(value: T): T {
    const oldValue = this.value!;
    this.value = value;
    return oldValue;
  }
  
  /**
   * Vérifier si le Box contient une valeur
   */
  hasValue(): boolean {
    return this.isValid();
  }
}

/**
 * Proprietaire partagé (Rc)
 * 
 * Un Rc (Reference Counting) permet le partage de la propriete.
 * La valeur est liberee lorsque le dernier Rc est detruit.
 */
export class Rc<T = any> extends Owner<T> {
  private refCount: number = 1;
  private allocator: MemoryAllocator;
  private weakRefs: Set<WeakRef<T>> = new Set();
  
  constructor(value: T, allocator?: MemoryAllocator) {
    const size = new Box<T>(value, allocator).getSize();
    const address = (allocator || getAllocator()).allocate(size);
    
    super(address, size, OwnershipType.Shared);
    this.allocator = allocator || getAllocator();
    this.value = value;
  }
  
  /**
   * Augmenter le compteur de references
   */
  increment(): void {
    this.refCount++;
  }
  
  /**
   * Diminuer le compteur de references
   */
  decrement(): void {
    this.refCount--;
    
    if (this.refCount <= 0) {
      // Liberer la memoire
      this.free();
      
      // Notifier les references faibles
      for (const weakRef of this.weakRefs) {
        weakRef.notify();
      }
      this.weakRefs.clear();
    }
  }
  
  /**
   * Obtenir le compteur de references
   */
  getRefCount(): number {
    return this.refCount;
  }
  
  /**
   * Liberer la memoire
   */
  free(): void {
    if (this.value !== undefined) {
      this.allocator.free(this.address);
      this.value = undefined;
    }
  }
  
  /**
   * Transférer la propriété
   */
  transfer(): Rc<T> | null {
    if (!this.isValid()) {
      return null;
    }
    
    this.increment();
    return this;
  }
  
  /**
   * Cloner le propriétaire
   */
  clone(): Rc<T> {
    if (!this.isValid()) {
      throw new MemoryException('Cannot clone invalid Rc');
    }
    
    this.increment();
    return this;
  }
  
  /**
   * Creer une reference faible
   */
  weak(): WeakRef<T> {
    const weakRef = new WeakRef<T>(this.address, this);
    this.weakRefs.add(weakRef);
    return weakRef;
  }
}

/**
 * Reference faible
 */
export class WeakRef<T = any> extends Owner<T> {
  private target: Rc<T> | null = null;
  private isValidFlag: boolean = true;
  
  constructor(address: number, target: Rc<T>) {
    super(address, target.getSize(), OwnershipType.Weak);
    this.target = target;
    this.value = target.get();
  }
  
  /**
   * Verifier si la reference est valide
   */
  isValid(): boolean {
    return this.isValidFlag && this.target !== null;
  }
  
  /**
   * Liberer la memoire
   */
  free(): void {
    this.target = null;
    this.value = undefined;
    this.isValidFlag = false;
  }
  
  /**
   * Transférer la propriété
   */
  transfer(): WeakRef<T> | null {
    return null; // Les references faibles ne peuvent pas etre transferees
  }
  
  /**
   * Cloner le propriétaire
   */
  clone(): WeakRef<T> {
    if (!this.isValid()) {
      throw new MemoryException('Cannot clone invalid WeakRef');
    }
    
    return new WeakRef<T>(this.address, this.target!);
  }
  
  /**
   * Notifier que la cible a ete liberee
   */
  notify(): void {
    this.isValidFlag = false;
    this.value = undefined;
    this.target = null;
  }
  
  /**
   * Promouvoir en Rc
   */
  promote(): Rc<T> | null {
    if (!this.isValid()) {
      return null;
    }
    
    return this.target!.clone();
  }
}

/**
 * Gestionnaire de propriete
 */
export class OwnershipManager {
  private boxes: Set<Box<any>> = new Set();
  private rcObjects: Set<Rc<any>> = new Set();
  private weakRefs: Set<WeakRef<any>> = new Set();
  
  /**
   * Enregistrer un Box
   */
  registerBox<T>(box: Box<T>): void {
    this.boxes.add(box);
  }
  
  /**
   * Supprimer un Box
   */
  unregisterBox<T>(box: Box<T>): void {
    this.boxes.delete(box);
  }
  
  /**
   * Enregistrer un Rc
   */
  registerRc<T>(rc: Rc<T>): void {
    this.rcObjects.add(rc);
  }
  
  /**
   * Supprimer un Rc
   */
  unregisterRc<T>(rc: Rc<T>): void {
    this.rcObjects.delete(rc);
  }
  
  /**
   * Enregistrer une WeakRef
   */
  registerWeakRef<T>(weakRef: WeakRef<T>): void {
    this.weakRefs.add(weakRef);
  }
  
  /**
   * Supprimer une WeakRef
   */
  unregisterWeakRef<T>(weakRef: WeakRef<T>): void {
    this.weakRefs.delete(weakRef);
  }
  
  /**
   * Liberer tous les objets
   */
  freeAll(): void {
    for (const box of this.boxes) {
      box.free();
    }
    this.boxes.clear();
    
    for (const rc of this.rcObjects) {
      rc.free();
    }
    this.rcObjects.clear();
    
    for (const weakRef of this.weakRefs) {
      weakRef.free();
    }
    this.weakRefs.clear();
  }
  
  /**
   * Obtenir le nombre de Box
   */
  getBoxCount(): number {
    return this.boxes.size;
  }
  
  /**
   * Obtenir le nombre de Rc
   */
  getRcCount(): number {
    return this.rcObjects.size;
  }
  
  /**
   * Obtenir le nombre de WeakRef
   */
  getWeakRefCount(): number {
    return this.weakRefs.size;
  }
  
  /**
   * Reinitialiser
   */
  clear(): void {
    this.boxes.clear();
    this.rcObjects.clear();
    this.weakRefs.clear();
  }
}

/**
 * Fabrique de propriétaires
 */
export class OwnershipFactory {
  private manager: OwnershipManager;
  
  constructor(manager?: OwnershipManager) {
    this.manager = manager || new OwnershipManager();
  }
  
  /**
   * Creer un Box
   */
  createBox<T>(value: T): Box<T> {
    const box = new Box<T>(value);
    this.manager.registerBox(box);
    return box;
  }
  
  /**
   * Creer un Rc
   */
  createRc<T>(value: T): Rc<T> {
    const rc = new Rc<T>(value);
    this.manager.registerRc(rc);
    return rc;
  }
  
  /**
   * Creer une WeakRef
   */
  createWeakRef<T>(rc: Rc<T>): WeakRef<T> {
    const weakRef = rc.weak();
    this.manager.registerWeakRef(weakRef);
    return weakRef;
  }
  
  /**
   * Obtenir le gestionnaire
   */
  getManager(): OwnershipManager {
    return this.manager;
  }
}

/**
 * Gestionnaire global de propriete
 */
let globalOwnershipManager: OwnershipManager | null = null;

/**
 * Obtenir le gestionnaire global de propriete
 */
export function getOwnershipManager(): OwnershipManager {
  if (!globalOwnershipManager) {
    globalOwnershipManager = new OwnershipManager();
  }
  return globalOwnershipManager;
}

/**
 * Creer un Box
 */
export function createBox<T>(value: T): Box<T> {
  return new OwnershipFactory().createBox(value);
}

/**
 * Creer un Rc
 */
export function createRc<T>(value: T): Rc<T> {
  return new OwnershipFactory().createRc(value);
}

/**
 * Creer une WeakRef
 */
export function createWeakRef<T>(rc: Rc<T>): WeakRef<T> {
  return new OwnershipFactory().createWeakRef(rc);
}
