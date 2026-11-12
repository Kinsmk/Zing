/**
 * Nodes Expressions - Définitions des nœuds d'expressions AST pour Zinga
 * 
 * Ce module définit tous les types de nœuds d'expressions de l'AST.
 */

import { SourceLocation } from '../lexer/positions';
import { BaseNode, NodeType, Expression } from './nodes-base';

/**
 * Identifiant
 */
export class Identifier extends BaseNode implements Expression {
  type: NodeType.Identifier = NodeType.Identifier;
  name: string;
  // Pour les identifiants privés (#)
  isPrivate?: boolean = false;

  constructor(name: string, location?: SourceLocation) {
    super(NodeType.Identifier, location);
    this.name = name;
  }

  toString(): string {
    return this.name;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      name: this.name,
      isPrivate: this.isPrivate,
    };
  }
}

/**
 * Littéral de base
 */
export abstract class BaseLiteral<T> extends BaseNode implements Expression {
  type: NodeType.Literal = NodeType.Literal;
  value: T;
  raw?: string;

  constructor(type: NodeType, value: T, raw?: string, location?: SourceLocation) {
    super(type, location);
    this.value = value;
    this.raw = raw;
  }

  toString(): string {
    return this.raw || String(this.value);
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
 * Littéral string
 */
export class StringLiteral extends BaseLiteral<string> implements Expression {
  type: NodeType.StringLiteral = NodeType.StringLiteral;

  constructor(value: string, raw?: string, location?: SourceLocation) {
    super(NodeType.StringLiteral, value, raw, location);
  }
}

/**
 * Littéral numérique
 */
export class NumericLiteral extends BaseLiteral<number> implements Expression {
  type: NodeType.NumericLiteral = NodeType.NumericLiteral;

  constructor(value: number, raw?: string, location?: SourceLocation) {
    super(NodeType.NumericLiteral, value, raw, location);
  }
}

/**
 * Littéral booléen
 */
export class BooleanLiteral extends BaseLiteral<boolean> implements Expression {
  type: NodeType.BooleanLiteral = NodeType.BooleanLiteral;

  constructor(value: boolean, raw?: string, location?: SourceLocation) {
    super(NodeType.BooleanLiteral, value, raw, location);
  }
}

/**
 * Littéral null
 */
export class NullLiteral extends BaseNode implements Expression {
  type: NodeType.NullLiteral = NodeType.NullLiteral;

  constructor(location?: SourceLocation) {
    super(NodeType.NullLiteral, location);
  }

  toString(): string {
    return 'null';
  }
}

/**
 * Littéral undefined
 */
export class UndefinedLiteral extends BaseNode implements Expression {
  type: NodeType.UndefinedLiteral = NodeType.UndefinedLiteral;

  constructor(location?: SourceLocation) {
    super(NodeType.UndefinedLiteral, location);
  }

  toString(): string {
    return 'undefined';
  }
}

/**
 * Littéral BigInt
 */
export class BigIntLiteral extends BaseLiteral<string> implements Expression {
  type: NodeType.BigIntLiteral = NodeType.BigIntLiteral;

  constructor(value: string, raw?: string, location?: SourceLocation) {
    super(NodeType.BigIntLiteral, value, raw, location);
  }
}

/**
 * Littéral RegExp
 */
export class RegExpLiteral extends BaseNode implements Expression {
  type: NodeType.RegExpLiteral = NodeType.RegExpLiteral;
  pattern: string;
  flags?: string;
  regex?: RegExp;

  constructor(pattern: string, flags?: string, location?: SourceLocation) {
    super(NodeType.RegExpLiteral, location);
    this.pattern = pattern;
    this.flags = flags;
    try {
      this.regex = new RegExp(pattern, flags);
    } catch {
      // Ignorer les erreurs de regex invalide
    }
  }

  toString(): string {
    return `/${this.pattern}/${this.flags || ''}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      pattern: this.pattern,
      flags: this.flags,
    };
  }
}

/**
 * Littéral générique (pour les littéraux non typés)
 */
export class Literal extends BaseNode implements Expression {
  type: NodeType.Literal = NodeType.Literal;
  value: any;
  raw?: string;

  constructor(value: any, raw?: string, location?: SourceLocation) {
    super(NodeType.Literal, location);
    this.value = value;
    this.raw = raw;
  }

  toString(): string {
    return this.raw || String(this.value);
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
 * Expression binaire
 */
export class BinaryExpression extends BaseNode implements Expression {
  type: NodeType.BinaryExpression = NodeType.BinaryExpression;
  operator: string;
  left: Expression;
  right: Expression;

  constructor(operator: string, left: Expression, right: Expression, location?: SourceLocation) {
    super(NodeType.BinaryExpression, location);
    this.operator = operator;
    this.left = left;
    this.right = right;
  }

  toString(): string {
    return `(${this.left.toString()} ${this.operator} ${this.right.toString()})`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      operator: this.operator,
      left: this.left.toJSON(),
      right: this.right.toJSON(),
    };
  }
}

/**
 * Expression unaire
 */
export class UnaryExpression extends BaseNode implements Expression {
  type: NodeType.UnaryExpression = NodeType.UnaryExpression;
  operator: string;
  argument: Expression;
  prefix: boolean = true;

  constructor(operator: string, argument: Expression, prefix: boolean = true, location?: SourceLocation) {
    super(NodeType.UnaryExpression, location);
    this.operator = operator;
    this.argument = argument;
    this.prefix = prefix;
  }

  toString(): string {
    return this.prefix 
      ? `${this.operator}${this.argument.toString()}`
      : `${this.argument.toString()}${this.operator}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      operator: this.operator,
      argument: this.argument.toJSON(),
      prefix: this.prefix,
    };
  }
}

/**
 * Expression conditionnelle (ternary)
 */
export class ConditionalExpression extends BaseNode implements Expression {
  type: NodeType.ConditionalExpression = NodeType.ConditionalExpression;
  test: Expression;
  consequent: Expression;
  alternate: Expression;

  constructor(test: Expression, consequent: Expression, alternate: Expression, location?: SourceLocation) {
    super(NodeType.ConditionalExpression, location);
    this.test = test;
    this.consequent = consequent;
    this.alternate = alternate;
  }

  toString(): string {
    return `${this.test.toString()} ? ${this.consequent.toString()} : ${this.alternate.toString()}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      test: this.test.toJSON(),
      consequent: this.consequent.toJSON(),
      alternate: this.alternate.toJSON(),
    };
  }
}

/**
 * Expression d'appel de fonction
 */
export class CallExpression extends BaseNode implements Expression {
  type: NodeType.CallExpression = NodeType.CallExpression;
  callee: Expression;
  arguments: (Expression | SpreadElement)[] = [];
  optional?: boolean = false;

  constructor(callee: Expression, location?: SourceLocation) {
    super(NodeType.CallExpression, location);
    this.callee = callee;
  }

  toString(): string {
    const args = this.arguments.map(a => a.toString()).join(', ');
    return `${this.callee.toString()}(${args})`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      callee: this.callee.toJSON(),
      arguments: this.arguments.map(a => a.toJSON()),
      optional: this.optional,
    };
  }

  addArgument(arg: Expression | SpreadElement): void {
    this.arguments.push(arg);
  }
}

/**
 * Expression d'accès à un membre
 */
export class MemberExpression extends BaseNode implements Expression {
  type: NodeType.MemberExpression = NodeType.MemberExpression;
  object: Expression;
  property: Expression | Identifier;
  computed: boolean = false;
  optional?: boolean = false;

  constructor(object: Expression, property: Expression | Identifier, computed: boolean = false, location?: SourceLocation) {
    super(NodeType.MemberExpression, location);
    this.object = object;
    this.property = property;
    this.computed = computed;
  }

  toString(): string {
    const prop = this.computed 
      ? `[${this.property.toString()}]`
      : `.${this.property.toString()}`;
    const optional = this.optional ? '?' : '';
    return `${this.object.toString()}${optional}${prop}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      object: this.object.toJSON(),
      property: this.property.toJSON(),
      computed: this.computed,
      optional: this.optional,
    };
  }
}

/**
 * Expression new
 */
export class NewExpression extends BaseNode implements Expression {
  type: NodeType.NewExpression = NodeType.NewExpression;
  callee: Expression;
  arguments: (Expression | SpreadElement)[] = [];
  optional?: boolean = false;

  constructor(callee: Expression, location?: SourceLocation) {
    super(NodeType.NewExpression, location);
    this.callee = callee;
  }

  toString(): string {
    const args = this.arguments.map(a => a.toString()).join(', ');
    return `new ${this.callee.toString()}(${args})`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      callee: this.callee.toJSON(),
      arguments: this.arguments.map(a => a.toJSON()),
      optional: this.optional,
    };
  }

  addArgument(arg: Expression | SpreadElement): void {
    this.arguments.push(arg);
  }
}

/**
 * Expression this
 */
export class ThisExpression extends BaseNode implements Expression {
  type: NodeType.ThisExpression = NodeType.ThisExpression;

  constructor(location?: SourceLocation) {
    super(NodeType.ThisExpression, location);
  }

  toString(): string {
    return 'this';
  }
}

/**
 * Expression super
 */
export class SuperExpression extends BaseNode implements Expression {
  type: NodeType.SuperExpression = NodeType.SuperExpression;

  constructor(location?: SourceLocation) {
    super(NodeType.SuperExpression, location);
  }

  toString(): string {
    return 'super';
  }
}

/**
 * Expression de tableau
 */
export class ArrayExpression extends BaseNode implements Expression {
  type: NodeType.ArrayExpression = NodeType.ArrayExpression;
  elements: (Expression | SpreadElement | null)[] = [];

  constructor(location?: SourceLocation) {
    super(NodeType.ArrayExpression, location);
  }

  toString(): string {
    const elements = this.elements.map(e => e?.toString() || '').join(', ');
    return `[${elements}]`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      elements: this.elements.map(e => e?.toJSON()),
    };
  }

  addElement(element: Expression | SpreadElement | null): void {
    this.elements.push(element);
  }
}

/**
 * Expression d'objet
 */
export class ObjectExpression extends BaseNode implements Expression {
  type: NodeType.ObjectExpression = NodeType.ObjectExpression;
  properties: (ObjectProperty | ObjectMethod | SpreadElement)[] = [];

  constructor(location?: SourceLocation) {
    super(NodeType.ObjectExpression, location);
  }

  toString(): string {
    const properties = this.properties.map(p => p.toString()).join(', ');
    return `{${properties}}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      properties: this.properties.map(p => p.toJSON()),
    };
  }

  addProperty(property: ObjectProperty | ObjectMethod | SpreadElement): void {
    this.properties.push(property);
  }
}

/**
 * Propriété d'objet
 */
export class ObjectProperty extends BaseNode implements Expression {
  type: NodeType.ObjectProperty = NodeType.ObjectProperty;
  key: Expression;
  value: Expression;
  kind: 'init' | 'get' | 'set' = 'init';
  computed: boolean = false;
  shorthand: boolean = false;

  constructor(key: Expression, value: Expression, kind: 'init' | 'get' | 'set' = 'init', computed: boolean = false, location?: SourceLocation) {
    super(NodeType.ObjectProperty, location);
    this.key = key;
    this.value = value;
    this.kind = kind;
    this.computed = computed;
    this.shorthand = key instanceof Identifier && 
                     value instanceof Identifier &&
                     key.name === value.name;
  }

  toString(): string {
    const key = this.computed ? `[${this.key.toString()}]` : this.key.toString();
    const prefix = this.kind === 'get' ? 'get ' : this.kind === 'set' ? 'set ' : '';
    const shorthand = this.shorthand ? key : `${key}: ${this.value.toString()}`;
    return `${prefix}${shorthand}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      key: this.key.toJSON(),
      value: this.value.toJSON(),
      kind: this.kind,
      computed: this.computed,
      shorthand: this.shorthand,
    };
  }
}

/**
 * Méthode d'objet
 */
export class ObjectMethod extends BaseNode implements Expression {
  type: NodeType.ObjectMethod = NodeType.ObjectMethod;
  key: Expression;
  params: (Identifier | RestElement)[] = [];
  body: any; // BlockStatement sera importé plus tard
  kind: 'method' | 'get' | 'set' = 'method';
  computed: boolean = false;
  generator: boolean = false;
  async: boolean = false;

  constructor(
    key: Expression,
    params: (Identifier | RestElement)[] = [],
    body: any,
    kind: 'method' | 'get' | 'set' = 'method',
    computed: boolean = false,
    location?: SourceLocation
  ) {
    super(NodeType.ObjectMethod, location);
    this.key = key;
    this.params = params;
    this.body = body;
    this.kind = kind;
    this.computed = computed;
  }

  toString(): string {
    const key = this.computed ? `[${this.key.toString()}]` : this.key.toString();
    const prefix = this.kind === 'get' ? 'get ' : this.kind === 'set' ? 'set ' : '';
    const asyncPrefix = this.async ? 'async ' : '';
    const generatorSuffix = this.generator ? '*' : '';
    const params = this.params.map(p => p.toString()).join(', ');
    return `${prefix}${asyncPrefix}${key}(${params})${generatorSuffix} ${this.body.toString()}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      key: this.key.toJSON(),
      params: this.params.map(p => p.toJSON()),
      body: this.body.toJSON?.(),
      kind: this.kind,
      computed: this.computed,
      generator: this.generator,
      async: this.async,
    };
  }
}

/**
 * Expression de fonction
 */
export class FunctionExpression extends BaseNode implements Expression {
  type: NodeType.FunctionExpression = NodeType.FunctionExpression;
  id?: Identifier | null;
  params: (Identifier | RestElement)[] = [];
  body: any; // BlockStatement
  generator: boolean = false;
  async: boolean = false;
  typeParameters?: any;

  constructor(
    id: Identifier | null | undefined,
    params: (Identifier | RestElement)[] = [],
    body: any,
    location?: SourceLocation
  ) {
    super(NodeType.FunctionExpression, location);
    this.id = id || null;
    this.params = params;
    this.body = body;
  }

  toString(): string {
    const asyncPrefix = this.async ? 'async ' : '';
    const generatorSuffix = this.generator ? '*' : '';
    const id = this.id ? `${this.id.toString()} ` : '';
    const params = this.params.map(p => p.toString()).join(', ');
    return `${asyncPrefix}function${generatorSuffix} ${id}(${params}) ${this.body.toString()}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      id: this.id?.toJSON(),
      params: this.params.map(p => p.toJSON()),
      body: this.body.toJSON?.(),
      generator: this.generator,
      async: this.async,
      typeParameters: this.typeParameters,
    };
  }
}

/**
 * Expression de fonction fléchée
 */
export class ArrowFunctionExpression extends BaseNode implements Expression {
  type: NodeType.ArrowFunctionExpression = NodeType.ArrowFunctionExpression;
  params: (Identifier | RestElement)[] = [];
  body: any; // BlockStatement | Expression
  async: boolean = false;
  generator: boolean = false;
  expression: boolean = false;
  returnType?: any;
  typeParameters?: any;

  constructor(
    params: (Identifier | RestElement)[] = [],
    body: any,
    location?: SourceLocation
  ) {
    super(NodeType.ArrowFunctionExpression, location);
    this.params = params;
    this.body = body;
    this.expression = !(body && body.type === NodeType.BlockStatement);
  }

  toString(): string {
    const asyncPrefix = this.async ? 'async ' : '';
    const params = this.params.map(p => p.toString()).join(', ');
    const body = this.expression 
      ? ` => ${this.body.toString()}`
      : ` => ${this.body.toString()}`;
    return `${asyncPrefix}(${params})${body}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      params: this.params.map(p => p.toJSON()),
      body: this.body.toJSON?.(),
      async: this.async,
      generator: this.generator,
      expression: this.expression,
      returnType: this.returnType,
      typeParameters: this.typeParameters,
    };
  }
}

/**
 * Littéral de template
 */
export class TemplateLiteral extends BaseNode implements Expression {
  type: NodeType.TemplateLiteral = NodeType.TemplateLiteral;
  quasis: TemplateElement[] = [];
  expressions: Expression[] = [];

  constructor(location?: SourceLocation) {
    super(NodeType.TemplateLiteral, location);
  }

  toString(): string {
    let result = '`';
    for (let i = 0; i < this.quasis.length; i++) {
      result += this.quasis[i].value.raw || this.quasis[i].value.cooked || '';
      if (i < this.expressions.length) {
        result += `${this.expressions[i].toString()}`;
      }
    }
    result += '`';
    return result;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      quasis: this.quasis.map(q => q.toJSON()),
      expressions: this.expressions.map(e => e.toJSON()),
    };
  }

  addQuasi(quasi: TemplateElement): void {
    this.quasis.push(quasi);
  }

  addExpression(expression: Expression): void {
    this.expressions.push(expression);
  }
}

/**
 * Élément de template
 */
export class TemplateElement extends BaseNode {
  type: NodeType = NodeType.TemplateElement;
  value: { cooked?: string; raw?: string };
  tail: boolean = false;

  constructor(value: { cooked?: string; raw?: string }, tail: boolean = false, location?: SourceLocation) {
    super(NodeType.TemplateElement, location);
    this.value = value;
    this.tail = tail;
  }

  toString(): string {
    return this.value.raw || this.value.cooked || '';
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      value: this.value,
      tail: this.tail,
    };
  }
}

/**
 * Expression de template taggé
 */
export class TaggedTemplateExpression extends BaseNode implements Expression {
  type: NodeType.TaggedTemplateExpression = NodeType.TaggedTemplateExpression;
  tag: Expression;
  quasi: TemplateLiteral;

  constructor(tag: Expression, quasi: TemplateLiteral, location?: SourceLocation) {
    super(NodeType.TaggedTemplateExpression, location);
    this.tag = tag;
    this.quasi = quasi;
  }

  toString(): string {
    return `${this.tag.toString()}${this.quasi.toString()}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      tag: this.tag.toJSON(),
      quasi: this.quasi.toJSON(),
    };
  }
}

/**
 * Élément de spread
 */
export class SpreadElement extends BaseNode implements Expression {
  type: NodeType.SpreadElement = NodeType.SpreadElement;
  argument: Expression;

  constructor(argument: Expression, location?: SourceLocation) {
    super(NodeType.SpreadElement, location);
    this.argument = argument;
  }

  toString(): string {
    return `...${this.argument.toString()}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      argument: this.argument.toJSON(),
    };
  }
}

/**
 * Élément de rest
 */
export class RestElement extends BaseNode {
  type: NodeType.RestElement = NodeType.RestElement;
  argument: Expression;

  constructor(argument: Expression, location?: SourceLocation) {
    super(NodeType.RestElement, location);
    this.argument = argument;
  }

  toString(): string {
    return `...${this.argument.toString()}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      argument: this.argument.toJSON(),
    };
  }
}

/**
 * Expression await
 */
export class AwaitExpression extends BaseNode implements Expression {
  type: NodeType.AwaitExpression = NodeType.AwaitExpression;
  argument: Expression;

  constructor(argument: Expression, location?: SourceLocation) {
    super(NodeType.AwaitExpression, location);
    this.argument = argument;
  }

  toString(): string {
    return `await ${this.argument.toString()}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      argument: this.argument.toJSON(),
    };
  }
}

/**
 * Expression yield
 */
export class YieldExpression extends BaseNode implements Expression {
  type: NodeType.YieldExpression = NodeType.YieldExpression;
  argument?: Expression | null;
  delegate: boolean = false;

  constructor(argument: Expression | null | undefined, delegate: boolean = false, location?: SourceLocation) {
    super(NodeType.YieldExpression, location);
    this.argument = argument || null;
    this.delegate = delegate;
  }

  toString(): string {
    const delegate = this.delegate ? '* ' : '';
    const arg = this.argument ? ` ${this.argument.toString()}` : '';
    return `yield${delegate}${arg}`;
  }

  toJSON(): any {
    return {
      ...super.toJSON(),
      argument: this.argument?.toJSON(),
      delegate: this.delegate,
    };
  }
}
