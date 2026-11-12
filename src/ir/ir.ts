/**
 * IR - Representation Intermediaire pour Zinga
 * 
 * Ce module definit la representation intermediaire (IR) de Zinga.
 * L'IR est une representation independante du backend qui permet de:
 * - Verifier la validite du code
 * - Optimiser le code
 * - Generer du code pour different backends (JavaScript, LLVM, WASM)
 */

export * from './ir-nodes';
export * from './ir-builder';
export * from './basic-blocks';
export * from './control-flow';
export * from './data-flow';
export * from './verifier';
export * from './optimizer';
export * from './constant-folding';
export * from './dead-code';
export * from './inlining';
export * from './lowering';
export * from './ir-printer';
