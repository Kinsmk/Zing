/**
 * Nodes Declarations - Définitions des nœuds de déclarations AST pour Zinga
 * 
 * Ce module définit tous les types de nœuds de déclarations de l'AST.
 */

import { SourceLocation } from '../lexer/positions';
import { BaseNode, NodeType, Statement, Expression } from './nodes-base';
import { Identifier, SpreadElement, RestElement } from './nodes-expressions';

/**
 * Déclaration de variable
 */
export class VariableDeclaration extends BaseNode implements Statement {
  type: NodeType.VariableDeclaration = NodeType.VariableDeclaration;
  declarations: VariableDeclarator[] = [];
  kind: 'var' | 'let' | 'const' = 'let';

  constructor(kind: 'var' | 'let' | 'const' = 'let', location?: SourceLocation) {
    super(NodeType.VariableDeclaration, location);
    this.kind = kind;
  }

  toString(): string {
    const declarations = this.declarations.map(d => d.toString()).join(', ');
    return `${this.kind} ${declarations};`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      declarations: this.declarations.map(d => d.toJSON()),
      kind: this.kind,
    };
  }

  addDeclaration(declaration: VariableDeclarator): void {
    this.declarations.push(declaration);
  }
}

/**
 * Déclarateur de variable
 */
export class VariableDeclarator extends BaseNode {
  type: NodeType.VariableDeclarator = NodeType.VariableDeclarator;
  id: Expression;
  init?: Expression | null;
  definite?: boolean = false;

  constructor(id: Expression, init?: Expression | null, location?: SourceLocation) {
    super(NodeType.VariableDeclarator, location);
    this.id = id;
    this.init = init || null;
  }

  toString(): string {
    const init = this.init ? ` = ${this.init.toString()}` : '';
    return `${this.id.toString()}${init}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      id: this.id.toJSON(),
      init: this.init?.toJSON(),
      definite: this.definite,
    };
  }
}

/**
 * Déclaration de fonction
 */
export class FunctionDeclaration extends BaseNode implements Statement {
  type: NodeType.FunctionDeclaration = NodeType.FunctionDeclaration;
  id: Identifier;
  params: (Identifier | RestElement)[] = [];
  body: any; // BlockStatement
  generator: boolean = false;
  async: boolean = false;
  typeParameters?: any;
  returnType?: any;
  modifiers: ('public' | 'private' | 'protected' | 'static' | 'abstract' | 'final')[] = [];

  constructor(
    id: Identifier,
    params: (Identifier | RestElement)[] = [],
    body: any,
    location?: SourceLocation
  ) {
    super(NodeType.FunctionDeclaration, location);
    this.id = id;
    this.params = params;
    this.body = body;
  }

  toString(): string {
    const modifiers = this.modifiers.length > 0 ? `${this.modifiers.join(' ')} ` : '';
    const asyncPrefix = this.async ? 'async ' : '';
    const generatorSuffix = this.generator ? '*' : '';
    const params = this.params.map(p => p.toString()).join(', ');
    return `${modifiers}${asyncPrefix}function${generatorSuffix} ${this.id.toString()}(${params}) ${this.body.toString()}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      id: this.id.toJSON(),
      params: this.params.map(p => p.toJSON()),
      body: this.body.toJSON?.(),
      generator: this.generator,
      async: this.async,
      typeParameters: this.typeParameters,
      returnType: this.returnType,
      modifiers: this.modifiers,
    };
  }
}

/**
 * Déclaration de classe
 */
export class ClassDeclaration extends BaseNode implements Statement {
  type: NodeType.ClassDeclaration = NodeType.ClassDeclaration;
  id: Identifier;
  superClass?: Expression | null;
  body: ClassBody;
  abstract: boolean = false;
  final: boolean = false;
  typeParameters?: any;
  superTypeParameters?: any;
  implements?: Expression[] = [];
  modifiers: ('public' | 'private' | 'protected' | 'static' | 'abstract' | 'final')[] = [];

  constructor(
    id: Identifier,
    body: ClassBody,
    superClass?: Expression | null,
    location?: SourceLocation
  ) {
    super(NodeType.ClassDeclaration, location);
    this.id = id;
    this.body = body;
    this.superClass = superClass || null;
  }

  toString(): string {
    const modifiers = this.modifiers.length > 0 ? `${this.modifiers.join(' ')} ` : '';
    const abstractPrefix = this.abstract ? 'abstract ' : '';
    const finalPrefix = this.final ? 'final ' : '';
    const extendsClause = this.superClass ? ` extends ${this.superClass.toString()}` : '';
    const implementsClause = this.implements.length > 0 
      ? ` implements ${this.implements.map(i => i.toString()).join(', ')}`
      : '';
    return `${modifiers}${abstractPrefix}${finalPrefix}class ${this.id.toString()}${extendsClause}${implementsClause} ${this.body.toString()}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      id: this.id.toJSON(),
      superClass: this.superClass?.toJSON(),
      body: this.body.toJSON(),
      abstract: this.abstract,
      final: this.final,
      typeParameters: this.typeParameters,
      superTypeParameters: this.superTypeParameters,
      implements: this.implements.map(i => i.toJSON()),
      modifiers: this.modifiers,
    };
  }
}

/**
 * Corps de classe
 */
export class ClassBody extends BaseNode {
  type: NodeType.ClassBody = NodeType.ClassBody;
  body: (MethodDefinition | PropertyDefinition | StaticBlock)[] = [];

  constructor(location?: SourceLocation) {
    super(NodeType.ClassBody, location);
  }

  toString(): string {
    const body = this.body.map(b => b.toString()).join('\n');
    return `{\n  ${body}\n}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      body: this.body.map(b => b.toJSON()),
    };
  }

  addBodyElement(element: MethodDefinition | PropertyDefinition | StaticBlock): void {
    this.body.push(element);
  }
}

/**
 * Définition de méthode
 */
export class MethodDefinition extends BaseNode {
  type: NodeType.MethodDefinition = NodeType.MethodDefinition;
  key: Expression;
  value: any; // FunctionExpression
  kind: 'constructor' | 'method' | 'get' | 'set' = 'method';
  computed: boolean = false;
  static: boolean = false;
  abstract: boolean = false;
  final: boolean = false;
  generator: boolean = false;
  async: boolean = false;
  modifiers: ('public' | 'private' | 'protected' | 'static' | 'abstract' | 'final')[] = [];

  constructor(
    key: Expression,
    value: any,
    kind: 'constructor' | 'method' | 'get' | 'set' = 'method',
    computed: boolean = false,
    location?: SourceLocation
  ) {
    super(NodeType.MethodDefinition, location);
    this.key = key;
    this.value = value;
    this.kind = kind;
    this.computed = computed;
  }

  toString(): string {
    const modifiers = this.modifiers.length > 0 ? `${this.modifiers.join(' ')} ` : '';
    const staticPrefix = this.static ? 'static ' : '';
    const abstractPrefix = this.abstract ? 'abstract ' : '';
    const finalPrefix = this.final ? 'final ' : '';
    const asyncPrefix = this.async ? 'async ' : '';
    const generatorSuffix = this.generator ? '*' : '';
    const kindPrefix = this.kind === 'get' ? 'get ' : this.kind === 'set' ? 'set ' : '';
    const key = this.computed ? `[${this.key.toString()}]` : this.key.toString();
    const params = (this.value && this.value.params) ? this.value.params.map((p: any) => p.toString()).join(', ') : '';
    const body = (this.value && this.value.body) ? this.value.body.toString() : '';
    return `${modifiers}${staticPrefix}${abstractPrefix}${finalPrefix}${asyncPrefix}${kindPrefix}${key}(${params})${generatorSuffix} ${body}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      key: this.key.toJSON(),
      value: this.value.toJSON?.(),
      kind: this.kind,
      computed: this.computed,
      static: this.static,
      abstract: this.abstract,
      final: this.final,
      generator: this.generator,
      async: this.async,
      modifiers: this.modifiers,
    };
  }
}

/**
 * Définition de propriété
 */
export class PropertyDefinition extends BaseNode {
  type: NodeType.PropertyDefinition = NodeType.PropertyDefinition;
  key: Expression;
  value?: Expression | null;
  computed: boolean = false;
  static: boolean = false;
  abstract: boolean = false;
  final: boolean = false;
  modifiers: ('public' | 'private' | 'protected' | 'static' | 'abstract' | 'final')[] = [];
  typeAnnotation?: any;

  constructor(
    key: Expression,
    value?: Expression | null,
    computed: boolean = false,
    location?: SourceLocation
  ) {
    super(NodeType.PropertyDefinition, location);
    this.key = key;
    this.value = value || null;
    this.computed = computed;
  }

  toString(): string {
    const modifiers = this.modifiers.length > 0 ? `${this.modifiers.join(' ')} ` : '';
    const staticPrefix = this.static ? 'static ' : '';
    const abstractPrefix = this.abstract ? 'abstract ' : '';
    const finalPrefix = this.final ? 'final ' : '';
    const key = this.computed ? `[${this.key.toString()}]` : this.key.toString();
    const value = this.value ? ` = ${this.value.toString()}` : '';
    return `${modifiers}${staticPrefix}${abstractPrefix}${finalPrefix}${key}${value};`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      key: this.key.toJSON(),
      value: this.value?.toJSON(),
      computed: this.computed,
      static: this.static,
      abstract: this.abstract,
      final: this.final,
      modifiers: this.modifiers,
      typeAnnotation: this.typeAnnotation,
    };
  }
}

/**
 * Bloc statique
 */
export class StaticBlock extends BaseNode {
  type: NodeType.StaticBlock = NodeType.StaticBlock;
  body: Statement[] = [];

  constructor(location?: SourceLocation) {
    super(NodeType.StaticBlock, location);
  }

  toString(): string {
    const body = this.body.map(b => b.toString()).join('\n');
    return `static {\n  ${body}\n}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      body: this.body.map(b => b.toJSON()),
    };
  }

  addStatement(statement: Statement): void {
    this.body.push(statement);
  }
}

/**
 * Déclaration d'interface
 */
export class InterfaceDeclaration extends BaseNode implements Statement {
  type: NodeType.InterfaceDeclaration = NodeType.InterfaceDeclaration;
  id: Identifier;
  body: InterfaceBody;
  typeParameters?: any;
  extends?: Expression[] = [];
  implements?: Expression[] = [];
  modifiers: ('public' | 'private' | 'protected')[] = [];

  constructor(
    id: Identifier,
    body: InterfaceBody,
    location?: SourceLocation
  ) {
    super(NodeType.InterfaceDeclaration, location);
    this.id = id;
    this.body = body;
  }

  toString(): string {
    const modifiers = this.modifiers.length > 0 ? `${this.modifiers.join(' ')} ` : '';
    const extendsClause = this.extends.length > 0 
      ? ` extends ${this.extends.map(e => e.toString()).join(', ')}`
      : '';
    return `${modifiers}interface ${this.id.toString()}${extendsClause} ${this.body.toString()}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      id: this.id.toJSON(),
      body: this.body.toJSON(),
      typeParameters: this.typeParameters,
      extends: this.extends.map(e => e.toJSON()),
      implements: this.implements.map(i => i.toJSON()),
      modifiers: this.modifiers,
    };
  }
}

/**
 * Corps d'interface
 */
export class InterfaceBody extends BaseNode {
  type: NodeType.InterfaceBody = NodeType.InterfaceBody;
  body: (MethodDefinition | PropertyDefinition)[] = [];

  constructor(location?: SourceLocation) {
    super(NodeType.InterfaceBody, location);
  }

  toString(): string {
    const body = this.body.map(b => b.toString()).join('\n');
    return `{\n  ${body}\n}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      body: this.body.map(b => b.toJSON()),
    };
  }

  addBodyElement(element: MethodDefinition | PropertyDefinition): void {
    this.body.push(element);
  }
}

/**
 * Déclaration d'enum
 */
export class EnumDeclaration extends BaseNode implements Statement {
  type: NodeType.EnumDeclaration = NodeType.EnumDeclaration;
  id: Identifier;
  members: EnumMember[] = [];
  modifiers: ('const' | 'public' | 'private' | 'protected')[] = [];

  constructor(id: Identifier, location?: SourceLocation) {
    super(NodeType.EnumDeclaration, location);
    this.id = id;
  }

  toString(): string {
    const modifiers = this.modifiers.length > 0 ? `${this.modifiers.join(' ')} ` : '';
    const members = this.members.map(m => m.toString()).join(', ');
    return `${modifiers}enum ${this.id.toString()} {\n  ${members}\n}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      id: this.id.toJSON(),
      members: this.members.map(m => m.toJSON()),
      modifiers: this.modifiers,
    };
  }

  addMember(member: EnumMember): void {
    this.members.push(member);
  }
}

/**
 * Membre d'enum
 */
export class EnumMember extends BaseNode {
  type: NodeType.EnumMember = NodeType.EnumMember;
  id: Identifier;
  init?: Expression | null;

  constructor(id: Identifier, init?: Expression | null, location?: SourceLocation) {
    super(NodeType.EnumMember, location);
    this.id = id;
    this.init = init || null;
  }

  toString(): string {
    const init = this.init ? ` = ${this.init.toString()}` : '';
    return `${this.id.toString()}${init}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      id: this.id.toJSON(),
      init: this.init?.toJSON(),
    };
  }
}

/**
 * Déclaration d'alias de type
 */
export class TypeAliasDeclaration extends BaseNode implements Statement {
  type: NodeType.TypeAliasDeclaration = NodeType.TypeAliasDeclaration;
  id: Identifier;
  typeAnnotation: any;
  typeParameters?: any;
  modifiers: ('public' | 'private' | 'protected')[] = [];

  constructor(
    id: Identifier,
    typeAnnotation: any,
    location?: SourceLocation
  ) {
    super(NodeType.TypeAliasDeclaration, location);
    this.id = id;
    this.typeAnnotation = typeAnnotation;
  }

  toString(): string {
    const modifiers = this.modifiers.length > 0 ? `${this.modifiers.join(' ')} ` : '';
    return `${modifiers}type ${this.id.toString()} = ${this.typeAnnotation}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      id: this.id.toJSON(),
      typeAnnotation: this.typeAnnotation,
      typeParameters: this.typeParameters,
      modifiers: this.modifiers,
    };
  }
}

/**
 * StringLiteral pour les imports (éviter la dépendance circulaire)
 */
export class StringLiteralForImport extends BaseNode implements Expression {
  type: NodeType.StringLiteral = NodeType.StringLiteral;
  value: string;
  raw?: string;

  constructor(value: string, raw?: string, location?: SourceLocation) {
    super(NodeType.StringLiteral, location);
    this.value = value;
    this.raw = raw;
  }

  toString(): string {
    return this.raw || `"${this.value}"`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      value: this.value,
      raw: this.raw,
    };
  }
}

/**
 * Déclaration d'import
 */
export class ImportDeclaration extends BaseNode implements Statement {
  type: NodeType.ImportDeclaration = NodeType.ImportDeclaration;
  specifiers: (ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier)[] = [];
  source: StringLiteralForImport;
  importKind?: 'value' | 'type' | 'typeof' = 'value';

  constructor(source: StringLiteralForImport, location?: SourceLocation) {
    super(NodeType.ImportDeclaration, location);
    this.source = source;
  }

  toString(): string {
    const specifiers = this.specifiers.map(s => s.toString()).join(', ');
    const importKind = this.importKind === 'value' ? '' : this.importKind === 'type' ? 'type ' : 'typeof ';
    return `${importKind}import ${specifiers} from ${this.source.toString()};`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      specifiers: this.specifiers.map(s => s.toJSON()),
      source: this.source.toJSON(),
      importKind: this.importKind,
    };
  }

  addSpecifier(specifier: ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier): void {
    this.specifiers.push(specifier);
  }
}

/**
 * Spécificateur d'import
 */
export class ImportSpecifier extends BaseNode {
  type: NodeType.ImportSpecifier = NodeType.ImportSpecifier;
  imported: Identifier;
  local?: Identifier;
  importKind?: 'value' | 'type' | 'typeof' = 'value';

  constructor(imported: Identifier, local?: Identifier, location?: SourceLocation) {
    super(NodeType.ImportSpecifier, location);
    this.imported = imported;
    this.local = local || imported;
  }

  toString(): string {
    const local = this.local?.toString() !== this.imported.toString() 
      ? ` as ${this.local?.toString()}`
      : '';
    return `{${this.imported.toString()}${local}}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      imported: this.imported.toJSON(),
      local: this.local?.toJSON(),
      importKind: this.importKind,
    };
  }
}

/**
 * Spécificateur d'import par défaut
 */
export class ImportDefaultSpecifier extends BaseNode {
  type: NodeType.ImportDefaultSpecifier = NodeType.ImportDefaultSpecifier;
  local: Identifier;

  constructor(local: Identifier, location?: SourceLocation) {
    super(NodeType.ImportDefaultSpecifier, location);
    this.local = local;
  }

  toString(): string {
    return this.local.toString();
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      local: this.local.toJSON(),
    };
  }
}

/**
 * Spécificateur d'import de namespace
 */
export class ImportNamespaceSpecifier extends BaseNode {
  type: NodeType.ImportNamespaceSpecifier = NodeType.ImportNamespaceSpecifier;
  local: Identifier;

  constructor(local: Identifier, location?: SourceLocation) {
    super(NodeType.ImportNamespaceSpecifier, location);
    this.local = local;
  }

  toString(): string {
    return `* as ${this.local.toString()}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      local: this.local.toJSON(),
    };
  }
}

/**
 * Déclaration d'export
 */
export class ExportDeclaration extends BaseNode implements Statement {
  type: NodeType.ExportDeclaration = NodeType.ExportDeclaration;
  declaration: Statement;
  exportKind?: 'value' | 'type' = 'value';

  constructor(declaration: Statement, location?: SourceLocation) {
    super(NodeType.ExportDeclaration, location);
    this.declaration = declaration;
  }

  toString(): string {
    const exportKind = this.exportKind === 'value' ? '' : 'type ';
    return `${exportKind}export ${this.declaration.toString()}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      declaration: this.declaration.toJSON(),
      exportKind: this.exportKind,
    };
  }
}

/**
 * Export par défaut
 */
export class ExportDefaultDeclaration extends BaseNode implements Statement {
  type: NodeType.ExportDefaultDeclaration = NodeType.ExportDefaultDeclaration;
  declaration: Statement | Expression;
  exportKind?: 'value' | 'type' = 'value';

  constructor(declaration: Statement | Expression, location?: SourceLocation) {
    super(NodeType.ExportDefaultDeclaration, location);
    this.declaration = declaration;
  }

  toString(): string {
    return `export default ${this.declaration.toString()};`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      declaration: this.declaration.toJSON?.(),
      exportKind: this.exportKind,
    };
  }
}

/**
 * Export nommé
 */
export class ExportNamedDeclaration extends BaseNode implements Statement {
  type: NodeType.ExportNamedDeclaration = NodeType.ExportNamedDeclaration;
  declaration?: Statement;
  specifiers: ExportSpecifier[] = [];
  source?: StringLiteralForImport | null;
  exportKind?: 'value' | 'type' = 'value';

  constructor(
    declaration?: Statement,
    specifiers: ExportSpecifier[] = [],
    source?: StringLiteralForImport | null,
    location?: SourceLocation
  ) {
    super(NodeType.ExportNamedDeclaration, location);
    this.declaration = declaration;
    this.specifiers = specifiers;
    this.source = source || null;
  }

  toString(): string {
    const exportKind = this.exportKind === 'value' ? '' : 'type ';
    const declaration = this.declaration ? this.declaration.toString() : '';
    const specifiers = this.specifiers.map(s => s.toString()).join(', ');
    const from = this.source ? ` from ${this.source.toString()}` : '';
    return `${exportKind}export ${declaration}${declaration && specifiers ? ', ' : ''}${specifiers}${from};`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      declaration: this.declaration?.toJSON(),
      specifiers: this.specifiers.map(s => s.toJSON()),
      source: this.source?.toJSON(),
      exportKind: this.exportKind,
    };
  }

  addSpecifier(specifier: ExportSpecifier): void {
    this.specifiers.push(specifier);
  }
}

/**
 * Export de tout
 */
export class ExportAllDeclaration extends BaseNode implements Statement {
  type: NodeType.ExportAllDeclaration = NodeType.ExportAllDeclaration;
  source: StringLiteralForImport;
  exportKind?: 'value' | 'type' = 'value';

  constructor(source: StringLiteralForImport, location?: SourceLocation) {
    super(NodeType.ExportAllDeclaration, location);
    this.source = source;
  }

  toString(): string {
    const exportKind = this.exportKind === 'value' ? '' : 'type ';
    return `${exportKind}export * from ${this.source.toString()};`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      source: this.source.toJSON(),
      exportKind: this.exportKind,
    };
  }
}

/**
 * Spécificateur d'export
 */
export class ExportSpecifier extends BaseNode {
  type: NodeType.ExportSpecifier = NodeType.ExportSpecifier;
  exported: Identifier;
  local?: Identifier;
  exportKind?: 'value' | 'type' = 'value';

  constructor(exported: Identifier, local?: Identifier, location?: SourceLocation) {
    super(NodeType.ExportSpecifier, location);
    this.exported = exported;
    this.local = local || exported;
  }

  toString(): string {
    const local = this.local?.toString() !== this.exported.toString() 
      ? ` as ${this.local?.toString()}`
      : '';
    return `${this.exported.toString()}${local}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      exported: this.exported.toJSON(),
      local: this.local?.toJSON(),
      exportKind: this.exportKind,
    };
  }
}
