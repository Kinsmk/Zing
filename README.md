# Zinga

**Zinga** est un langage de programmation généraliste moderne conçu pour être à la fois puissant, expressif et accessible. Il supporte à la fois la syntaxe française et anglaise, ce qui le rend unique parmi les langages de programmation.

## 🚀 État du projet

- **Version actuelle**: 0.2.0
- **Objectif**: 1.0 (220-250 fichiers)
- **Statut**: En développement actif

## 📋 Architecture

Zinga est structuré en plusieurs composants principaux:

- **Compilateur**: Lexer, Parser, AST, Vérificateur de types
- **Système de types**: Types primitifs, composites, génériques, interfaces
- **IR (Représentation Intermédiaire)**: Indépendante du backend
- **Runtime**: Gestion mémoire, exécution, concurrence
- **Bibliothèque standard**: IO, Network, Data, Math, Security
- **Backends**: JavaScript, WebAssembly, LLVM (natif)
- **Sécurité**: Sandbox, isolation, permissions
- **CLI**: Gestionnaire de paquets, compilation, exécution
- **Outils**: Debugger, LSP, Formatter, Profiler

## 🛠 Installation

```bash
# Cloner le dépôt
git clone https://github.com/Kinsmk/Zing.git
cd Zing

# Installer les dépendances
npm install

# Construire le projet
npm run build

# Exécuter Zinga
npm run zinga
```

## 📖 Utilisation

```bash
# Créer un nouveau projet
zinga new mon-projet

# Vérifier la syntaxe
zinga check

# Exécuter un fichier
zinga run main.zng

# Compiler
zinga build

# Tester
zinga test

# Formater
zinga format

# Installer un paquet
zinga install nom-paquet

# Publier un paquet
zinga publish

# Diagnostiquer
zinga doctor
```

## 🏗 Feuille de route

| Version | Objectifs | État |
|---------|-----------|------|
| 0.2.1 | Corrections (mémoire, délais, isolation) | ⏳ |
| 0.3.0 | Fondations avancées (IR, types, modules) | ⏳ |
| 0.4.0 | Écosystème (stdlib, paquets, CLI) | ⏳ |
| 0.5.0 | Compilation native (LLVM) | ⏳ |
| 0.6.0 | WebAssembly | ⏳ |
| 0.7.0 | Langage avancé (génériques, concurrence) | ⏳ |
| 0.8.0 | Outils professionnels (debugger, LSP) | ⏳ |
| 0.9.0 | Préparation publique (audits, tests) | ⏳ |
| 1.0.0 | Première version stable | ⏳ |

## 📂 Structure du projet

```
Zing/
├── src/
│   ├── compiler/
│   ├── types/
│   ├── ir/
│   └── backends/
├── runtime/
├── stdlib/
├── tools/
├── tests/
├── docs/
├── examples/
└── bin/
```

## 🤝 Contribution

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les directives de contribution.

## 📜 Licence

MIT - Voir [LICENSE](LICENSE) pour plus de détails.

## 🔗 Liens

- [Documentation](docs/)
- [Changelog](CHANGELOG.md)
- [Roadmap](ROADMAP.md)
- [Code de conduite](CODE_OF_CONDUCT.md)
- [Sécurité](SECURITY.md)
