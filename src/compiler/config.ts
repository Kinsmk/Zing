/**
 * Config - Configuration du compilateur Zinga
 * 
 * Ce module gère toutes les options de configuration du compilateur,
 * y compris les paramètres de syntaxe, d'optimisation et de génération de code.
 */

export interface CompilerConfig {
  // Paramètres de syntaxe
  syntax?: {
    allowFrench?: boolean;
    allowEnglish?: boolean;
    defaultSyntax?: 'french' | 'english' | 'both';
    unicode?: boolean;
  };

  // Paramètres du lexer
  lexer?: {
    ignoreWhitespace?: boolean;
    ignoreComments?: boolean;
    trackPositions?: boolean;
  };

  // Paramètres du parser
  parser?: {
    recovery?: boolean;
    strict?: boolean;
    maxErrors?: number;
  };

  // Paramètres de vérification des types
  types?: {
    strict?: boolean;
    inference?: boolean;
    nullableByDefault?: boolean;
  };

  // Paramètres d'optimisation
  optimize?: {
    enabled?: boolean;
    level?: 0 | 1 | 2 | 3;
    constantFolding?: boolean;
    deadCodeElimination?: boolean;
    inlining?: boolean;
  };

  // Paramètres du backend
  backend?: {
    target?: 'javascript' | 'wasm' | 'llvm' | 'native';
    sourceMaps?: boolean;
    minify?: boolean;
    prettyPrint?: boolean;
  };

  // Paramètres de sécurité
  security?: {
    sandbox?: boolean;
    maxMemory?: number;
    maxExecutionTime?: number;
    allowFileAccess?: boolean;
    allowNetworkAccess?: boolean;
  };

  // Paramètres de débogage
  debug?: {
    verbose?: boolean;
    dumpTokens?: boolean;
    dumpAST?: boolean;
    dumpIR?: boolean;
    dumpOutput?: boolean;
  };
}

export interface ConfigOptions extends CompilerConfig {}

export class Config {
  private config: CompilerConfig;

  constructor(options: ConfigOptions = {}) {
    this.config = {
      syntax: {
        allowFrench: true,
        allowEnglish: true,
        defaultSyntax: 'both',
        unicode: true,
      },
      lexer: {
        ignoreWhitespace: false,
        ignoreComments: false,
        trackPositions: true,
      },
      parser: {
        recovery: true,
        strict: false,
        maxErrors: 10,
      },
      types: {
        strict: true,
        inference: true,
        nullableByDefault: false,
      },
      optimize: {
        enabled: true,
        level: 2,
        constantFolding: true,
        deadCodeElimination: true,
        inlining: true,
      },
      backend: {
        target: 'javascript',
        sourceMaps: true,
        minify: false,
        prettyPrint: true,
      },
      security: {
        sandbox: true,
        maxMemory: 1024 * 1024 * 256, // 256MB
        maxExecutionTime: 5000, // 5 secondes
        allowFileAccess: false,
        allowNetworkAccess: false,
      },
      debug: {
        verbose: false,
        dumpTokens: false,
        dumpAST: false,
        dumpIR: false,
        dumpOutput: false,
      },
      ...options,
    };
  }

  /**
   * Obtenir la configuration complète
   */
  public get(): CompilerConfig {
    return { ...this.config };
  }

  /**
   * Obtenir une valeur de configuration spécifique
   */
  public getValue<T extends keyof CompilerConfig>(key: T): CompilerConfig[T] {
    return this.config[key];
  }

  /**
   * Mettre à jour la configuration
   */
  public update(options: Partial<CompilerConfig>): void {
    this.config = {
      ...this.config,
      ...options,
      // Fusionner les sous-objets
      syntax: { ...this.config.syntax, ...options.syntax },
      lexer: { ...this.config.lexer, ...options.lexer },
      parser: { ...this.config.parser, ...options.parser },
      types: { ...this.config.types, ...options.types },
      optimize: { ...this.config.optimize, ...options.optimize },
      backend: { ...this.config.backend, ...options.backend },
      security: { ...this.config.security, ...options.security },
      debug: { ...this.config.debug, ...options.debug },
    };
  }

  /**
   * Réinitialiser à la configuration par défaut
   */
  public reset(): void {
    this.config = {
      syntax: {
        allowFrench: true,
        allowEnglish: true,
        defaultSyntax: 'both',
        unicode: true,
      },
      lexer: {
        ignoreWhitespace: false,
        ignoreComments: false,
        trackPositions: true,
      },
      parser: {
        recovery: true,
        strict: false,
        maxErrors: 10,
      },
      types: {
        strict: true,
        inference: true,
        nullableByDefault: false,
      },
      optimize: {
        enabled: true,
        level: 2,
        constantFolding: true,
        deadCodeElimination: true,
        inlining: true,
      },
      backend: {
        target: 'javascript',
        sourceMaps: true,
        minify: false,
        prettyPrint: true,
      },
      security: {
        sandbox: true,
        maxMemory: 1024 * 1024 * 256,
        maxExecutionTime: 5000,
        allowFileAccess: false,
        allowNetworkAccess: false,
      },
      debug: {
        verbose: false,
        dumpTokens: false,
        dumpAST: false,
        dumpIR: false,
        dumpOutput: false,
      },
    };
  }
}
