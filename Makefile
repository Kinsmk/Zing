# Makefile pour Zinga

.PHONY: all build test lint format clean docs

# Variables
SRC = src
DIST = dist
TESTS = tests
DOCS = docs

# Outils
NODE = node
NPM = npm
TSC = npx tsc
JEST = npx jest
ESLINT = npx eslint
PRETTIER = npx prettier

# Cibles principales
all: build test lint

build: 
	$(TSC)

build:watch:
	$(TSC) --watch

test: 
	$(JEST)

test:watch:
	$(JEST) --watch

test:coverage:
	$(JEST) --coverage

lint:
	$(ESLINT) $(SRC)/**/*.ts

lint:fix:
	$(ESLINT) $(SRC)/**/*.ts --fix

format:
	$(PRETTIER) --write "$(SRC)/**/*.ts"

check:
	$(TSC) --noEmit

clean:
	rm -rf $(DIST) coverage

# Cibles pour Zinga
zinga:
	$(NODE) bin/zinga.js

zinga-new:
	$(NODE) bin/zinga.js new

zinga-check:
	$(NODE) bin/zinga.js check

zinga-run:
	$(NODE) bin/zinga.js run

# Cibles pour la documentation
docs:
	@echo "Génération de la documentation..."
	# TODO: Ajouter la génération de documentation

# Cibles utilitaires
install:
	$(NPM) install

update:
	$(NPM) update

# Cibles pour le développement
dev:
	$(NODE) --watch src/index.ts

# Cibles pour la publication
publish:
	$(NPM) publish

publish:dry-run:
	$(NPM) publish --dry-run

# Cibles pour le debugging
debug:
	$(NODE) --inspect-brk src/index.ts

debug:test:
	$(NODE) --inspect-brk $(JEST)

# Cibles pour les benchmarks
benchmark:
	@echo "Exécution des benchmarks..."
	# TODO: Ajouter les benchmarks

# Affichage de l'aide
help:
	@echo "Cibles disponibles:"
	@echo ""
	@echo "  all           - Construire, tester et linter"
	@echo "  build         - Construire le projet"
	@echo "  build:watch   - Construire en mode watch"
	@echo "  test          - Exécuter les tests"
	@echo "  test:watch    - Exécuter les tests en mode watch"
	@echo "  test:coverage - Exécuter les tests avec couverture"
	@echo "  lint          - Linter le code"
	@echo "  lint:fix      - Linter et corriger le code"
	@echo "  format        - Formater le code"
	@echo "  check         - Vérifier la compilation TypeScript"
	@echo "  clean         - Nettoyer les fichiers générés"
	@echo ""
	@echo "  zinga         - Exécuter Zinga"
	@echo "  zinga-new     - Créer un nouveau projet Zinga"
	@echo "  zinga-check   - Vérifier la syntaxe"
	@echo "  zinga-run     - Exécuter un fichier Zinga"
	@echo ""
	@echo "  install       - Installer les dépendances"
	@echo "  update        - Mettre à jour les dépendances"
	@echo "  dev           - Mode développement"
	@echo "  debug         - Mode debug"
	@echo "  benchmark     - Exécuter les benchmarks"
	@echo ""
	@echo "  help          - Afficher cette aide"
