import { Scheme } from './scheme';

export interface Formula {
    readonly type: string;

    isBoolean(): boolean;

    renameAtoms(f: (s: string) => string): Formula;

    prettyPrint(): string;
}

export class TrueFormula implements Formula {
    readonly type = 'true';

    isBoolean() {
        return true;
    }

    renameAtoms(f: (s: string) => string): Formula {
        return this;
    }

    prettyPrint(): string {
        return 'true';
    }
}

export class FalseFormula implements Formula {
    readonly type = 'false';

    isBoolean() {
        return true;
    }

    renameAtoms(f: (s: string) => string): Formula {
        return this;
    }

    prettyPrint(): string {
        return 'false';
    }
}

export class AtomicFormula implements Formula {
    constructor(name: string) {
        this._atomicstring = name;
    }

    readonly type = 'atomic';
    private _atomicstring: string;

    isBoolean() {
        return true;
    }

    renameAtoms(f: (s: string) => string): Formula {
        return new AtomicFormula(f(this._atomicstring));
    }

    prettyPrint(): string {
        return this._atomicstring;
    }

    getAtomicString(): string {
        return this._atomicstring;
    }
}

export class OrFormula implements Formula {
    constructor(f: Array<Formula>) {
        this._formulas = f;
    }

    get formulas() {
        return this._formulas;
    }

    readonly type = 'or';
    private _formulas: Array<Formula>;

    isBoolean(): boolean {
        return this._formulas.every((x) => x.isBoolean());
    }

    renameAtoms(f: (s: string) => string): Formula {
        return new OrFormula(this._formulas.map((formula) => formula.renameAtoms(f)));
    }

    prettyPrint(): string {
        if (this._formulas.length == 0) {
            return 'false';
        }

        let s: string = '(' + this._formulas[0].prettyPrint();
        for (let i = 1; i < this._formulas.length; i += 1) {
            s += ' or ' + this._formulas[i].prettyPrint();
        }
        s += ')';
        return s;
    }
}

export class AndFormula implements Formula {
    constructor(f: Array<Formula>) {
        this._formulas = f;
    }

    get formulas() {
        return this._formulas;
    }

    readonly type = 'and';
    private _formulas: Array<Formula>;

    isBoolean() {
        return this._formulas.every((x) => x.isBoolean());
    }

    renameAtoms(f: (s: string) => string): Formula {
        return new AndFormula(this._formulas.map((formula) => formula.renameAtoms(f)));
    }

    prettyPrint(): string {
        if (this._formulas.length == 0) {
            return 'true';
        }

        let s: string = '(' + this._formulas[0].prettyPrint();
        for (let i = 1; i < this._formulas.length; i += 1) {
            s += ' and ' + this._formulas[i].prettyPrint();
        }
        s += ')';
        return s;
    }
}

abstract class ModalOperatorFormula implements Formula {
    constructor(a: string, f: Formula) {
        this._agent = a;
        this._formula = f;
    }

    get agent() {
        return this._agent;
    }

    get formula() {
        return this._formula;
    }

    readonly type;
    private _agent: string;
    private _formula: Formula;

    isBoolean() {
        return false;
    }

    abstract clone(): ModalOperatorFormula;

    abstract opString(): string;

    renameAtoms(f: (s: string) => string): Formula {
        const clone: ModalOperatorFormula = this.clone();
        clone._formula = this._formula.renameAtoms(f);
        return clone;
    }

    prettyPrint(): string {
        return '(' + this.opString() + ' ' + this._agent + ' ' + this._formula.prettyPrint() + ')';
    }
}

export class KFormula extends ModalOperatorFormula {
    readonly type = 'K';

    isBoolean() {
        return false;
    }

    clone(): ModalOperatorFormula {
        return new KFormula(this.agent, this.formula);
    }

    opString(): string {
        return 'K';
    }
}

export class KposFormula extends ModalOperatorFormula {
    readonly type = 'Kpos';

    isBoolean() {
        return false;
    }

    clone(): ModalOperatorFormula {
        return new KposFormula(this.agent, this.formula);
    }

    opString(): string {
        return 'Kpos';
    }
}

export class KwFormula extends ModalOperatorFormula {
    readonly type = 'Kw';

    isBoolean() {
        return false;
    }

    clone(): ModalOperatorFormula {
        return new KwFormula(this.agent, this.formula);
    }

    opString(): string {
        return 'Kw';
    }
}

export class NotFormula implements Formula {
    constructor(f: Formula) {
        this._formula = f;
    }

    get formula() {
        return this._formula;
    }

    readonly type = 'not';
    private _formula: Formula;

    isBoolean() {
        return this._formula.isBoolean();
    }

    renameAtoms(f: (s: string) => string): Formula {
        return new NotFormula(this._formula.renameAtoms(f));
    }

    prettyPrint(): string {
        return '(not ' + this._formula.prettyPrint() + ')';
    }
}

export class XorFormula implements Formula {
    constructor(f: Array<Formula>) {
        this._formulas = f;
    }

    get formulas() {
        return this._formulas;
    }

    readonly type = 'xor';
    private _formulas: Array<Formula>;

    isBoolean() {
        return this._formulas.every((x) => x.isBoolean());
    }

    renameAtoms(f: (s: string) => string): Formula {
        return new XorFormula(this._formulas.map((formula) => formula.renameAtoms(f)));
    }

    prettyPrint(): string {
        let s: string = '(' + this._formulas[0].prettyPrint();
        for (let i = 1; i < this._formulas.length; i += 1) {
            s += ' xor ' + this._formulas[i].prettyPrint();
        }
        s += ')';
        return s;
    }
}

export class ImplyFormula implements Formula {
    constructor(f1: Formula, f2: Formula) {
        this._formula1 = f1;
        this._formula2 = f2;
    }

    get formula1() {
        return this._formula1;
    }

    get formula2() {
        return this._formula2;
    }

    readonly type = 'imply';
    private _formula1: Formula;
    private _formula2: Formula;

    isBoolean() {
        return this._formula1.isBoolean() && this._formula2.isBoolean();
    }

    renameAtoms(f: (s: string) => string): Formula {
        return new ImplyFormula(this._formula1.renameAtoms(f), this._formula2.renameAtoms(f));
    }

    prettyPrint(): string {
        return '(' + this._formula1.prettyPrint() + ' => ' + this._formula2.prettyPrint() + ')';
    }
}

export class EquivFormula implements Formula {
    constructor(f1: Formula, f2: Formula) {
        this._formula1 = f1;
        this._formula2 = f2;
    }

    get formula1() {
        return this._formula1;
    }

    get formula2() {
        return this._formula2;
    }

    readonly type = 'equiv';
    private _formula1: Formula;
    private _formula2: Formula;

    isBoolean() {
        return this._formula1.isBoolean() && this._formula2.isBoolean();
    }

    renameAtoms(f: (s: string) => string): Formula {
        return new EquivFormula(this._formula1.renameAtoms(f), this._formula2.renameAtoms(f));
    }

    prettyPrint(): string {
        return '(' + this._formula1.prettyPrint() + ' <=> ' + this._formula2.prettyPrint() + ')';
    }
}

/**
 * ExactlyFormula implements a formula that says that exactly c propositions in v are true
 * @example new ExactlyFormula(3, ["p", "q", "r", "s", "t"])
 */
export class ExactlyFormula implements Formula {
    constructor(c: number, v: Array<string>) {
        this._count = c;
        this._variables = v;
    }

    get count() {
        return this._count;
    }

    get variables() {
        return this._variables;
    }

    readonly type = 'exactly';
    private _count: number;
    private _variables: Array<string>;

    isBoolean() {
        return true;
    }

    renameAtoms(f: (s: string) => string): Formula {
        return new ExactlyFormula(this._count, this._variables.map(f));
    }

    prettyPrint(): string {
        let s = '(exactly ' + this._count.toString();
        for (let i = 0; i < this._variables.length; i += 1) {
            s += ' ' + this._variables[i];
        }
        s += ')';
        return s;
    }

    convertToNormalFormula(): Formula {
        const cache = new Map<string, Formula>();
        const rec = (n, k) => {
            const key = [n, k].join(';');
            if (cache.has(key)) {
                return cache.get(key);
            }
            if (n == 0) {
                return new AndFormula(this.variables.slice(0, k).map((v) => new NotFormula(new AtomicFormula(v))));
            }
            if (k == 0) {
                return new FalseFormula();
            }
            const x = this.variables[k - 1];
            const subform_if_x = rec(n - 1, k - 1);
            const subform_if_not_x = rec(n, k - 1);
            const res = new OrFormula([
                new AndFormula([new AtomicFormula(x), subform_if_x]),
                new AndFormula([new NotFormula(new AtomicFormula(x)), subform_if_not_x])
            ]);
            cache.set(key, res);
            return res;
        };
        return rec(this.count, this.variables.length);
    }
}

/*
// Todo: use formula types instead of strings
export enum FormulaType {
    Atomic, Or, And, K, Kpos, Kw, Not, Xor, Imply, Equiv, True, False
} */

export class FormulaFactory {
    static createNegationOf(formula: Formula): Formula {
        return new NotFormula(formula);
    }

    static createTrue() {
        return new TrueFormula();
    }

    static createFalse() {
        return new FalseFormula();
    }

    static createFormula(schemeExpression: string | Array<any>) {
        let ast;
        if (typeof schemeExpression == 'string') {
            ast = Scheme.parser(schemeExpression as string);
        } else {
            ast = schemeExpression;
        }

        return this.installFormula(ast);
    }

    private static installFormula(ast: string | Array<any>) {
        if (ast instanceof Array) {
            if (ast[0] == 'K' || ast[0] == 'know' || ast[0] == 'box' || ast[0] == '[]') {
                if (ast.length != 3) {
                    throw new Error('Parsing error: (K a phi)');
                }
                return new KFormula(ast[1], this.installFormula(ast[2]));
            } else if (ast[0] == 'Kpos' || ast[0] == 'knowpos' || ast[0] == 'diamond' || ast[0] == '<>') {
                if (ast.length != 3) {
                    throw new Error('Parsing error: (Kpos a phi)');
                }
                return new KposFormula(ast[1], this.installFormula(ast[2]));
            } else if (ast[0] == 'Kw' || ast[0] == 'knowwhether') {
                if (ast.length != 3) {
                    throw new Error('Parsing error: (Kw a phi)');
                }
                return new KwFormula(ast[1], this.installFormula(ast[2]));
            } else if (ast[0] == 'not') {
                if (ast.length != 2) {
                    throw new Error('Parsing error: (not phi)');
                }
                return new NotFormula(this.installFormula(ast[1]));
            } else if (ast[0] == 'and') {
                // Cas (and p q r s ...)
                return new AndFormula(ast.slice(1).map(this.installFormula));
            } else if (ast[1] == 'and') {
                // Cas (p and q and r and s ...)
                let formulas: Array<Formula> = [];
                for (let i = 0; i < ast.length; i += 2) {
                    formulas.push(this.installFormula(ast[i]));
                }
                return new AndFormula(formulas);
            } else if (ast[0] == 'or') {
                // Cas (and p q r s ...)
                return new OrFormula(ast.slice(1).map(this.installFormula));
            } else if (ast[1] == 'or') {
                let formulas: Array<Formula> = [];
                for (let i = 0; i < ast.length; i += 2) {
                    formulas.push(this.installFormula(ast[i]));
                }
                return new OrFormula(formulas);
            } else if (ast[0] == 'xor') {
                // Cas (and p q r s ...)
                return new XorFormula(ast.slice(1).map(this.installFormula));
            } else if (ast[1] == 'xor') {
                let formulas: Array<Formula> = [];
                for (let i = 0; i < ast.length; i += 2) {
                    formulas.push(this.installFormula(ast[i]));
                }
                return new XorFormula(formulas);
            } else if (ast[1] == '=>' || ast[1] == 'imply') {
                return new ImplyFormula(this.installFormula(ast[0]), this.installFormula(ast[2]));
            } else if (ast[1] == '<=>' || ast[1] == 'equiv') {
                return new EquivFormula(this.installFormula(ast[0]), this.installFormula(ast[2]));
            } else if (ast[0] == 'exactly' && !+ast[1].isNaN) {
                // The operator +ast[1] converts the string ast[1] into an int.
                return new ExactlyFormula(
                    +ast[1],
                    ast.slice(2).map((s) => s)
                );
            } else {
                throw new Error('Error while parsing the formula');
            }
        } else if (ast == 'top' || ast == 'true' || ast == '1') {
            return new TrueFormula();
        } else if (ast == 'bottom' || ast == 'false' || ast == '0') {
            return new FalseFormula();
        } else {
            return new AtomicFormula(ast);
        }
    }
}
