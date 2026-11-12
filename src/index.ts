/**
 * Zinga - Point d'entrée principal
 * 
 * Ce fichier est le point d'entrée principal du compilateur Zinga.
 * Il initialise et orchestré tous les composants du langage.
 */

import { Compiler } from './compiler/compiler';
import { CLI } from '../tools/cli';

export * from './compiler/compiler';
export * from './compiler/pipeline';
export * from './compiler/config';

// Exporter les composants principaux
export { Compiler };

export default {
  Compiler,
  CLI,
};

// Initialisation du compilateur
const compiler = new Compiler();
const cli = new CLI(compiler);

// Démarrer l'interface CLI si exécuté directement
if (require.main === module) {
  cli.run(process.argv.slice(2));
}
