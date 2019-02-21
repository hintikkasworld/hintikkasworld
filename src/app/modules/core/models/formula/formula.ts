
import { Scheme } from './scheme';

export interface Formula {
    prettyPrint(): String;
}

export class TrueFormula implements Formula {
    prettyPrint(): String {
        return "true";
    }

}
export class FalseFormula implements Formula {
    prettyPrint(): String {
        return "false"
    }

}
export class AtomicFormula implements Formula {
    prettyPrint(): String {
        return this._atomicString;
    }
    private _atomicString: string;
    constructor(name: string) {
        this._atomicString = name;
    }

    getAtomicString(): string {
        return this._atomicString;
    }
}

export class OrFormula implements Formula {
    prettyPrint(): String {
        var s: String = "("+this._formulas[0].prettyPrint();
        for (var i = 1; i < this._formulas.length; i += 1) {
            s += " or "+this._formulas[i].prettyPrint();
        }
        s += ")"
        return s;
    }
    private _formulas: Array<Formula>;
    constructor(f: Array<Formula>) {
        this._formulas = f;
    }
    get formulas() {
        return this._formulas;
    }
}

export class AndFormula implements Formula {
    prettyPrint(): String {
        var s: String = "("+this._formulas[0].prettyPrint();
        for (var i = 1; i < this._formulas.length; i += 1) {
            s += " and "+this._formulas[i].prettyPrint();
        }
        s += ")"
        return s;
    }
    private _formulas: Array<Formula>;
    constructor(f: Array<Formula>) {
        this._formulas = f;
    }
    get formulas() {
        return this._formulas;
    }
}

export class KFormula implements Formula {
    prettyPrint(): String {
        return "(K "+this._agent+" "+this._formula.prettyPrint()+")"
    }
    private _agent: string;
    private _formula: Formula;
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
}

export class KposFormula implements Formula {
    prettyPrint(): String {
        return "(Kpos "+this._agent+" "+this._formula.prettyPrint()+")"
    }
    private _agent: string;
    private _formula: Formula;
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
}

export class KwFormula implements Formula {
    prettyPrint(): String {
        return "(Kw "+this._agent+" "+this._formula.prettyPrint()+")"
    }
    private _agent: string;
    private _formula: Formula;
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
}


export class NotFormula implements Formula {
    prettyPrint(): String {
        return "(not "+ this._formula.prettyPrint()+")"
    }
    private _formula: Formula;
    constructor(f: Formula) {
        this._formula = f;
    }
    get formula() {
        return this._formula;
    }
}


export class XorFormula implements Formula {
    prettyPrint(): String {
        var s: String = "("+this._formulas[0].prettyPrint();
        for (var i = 1; i < this._formulas.length; i += 1) {
            s += " xor "+this._formulas[i].prettyPrint();
        }
        s += ")"
        return s;
    }
    private _formulas: Array<Formula>;
    constructor(f: Array<Formula>) {
        this._formulas = f;
    }
    get formulas() {
        return this._formulas;
    }
}


export class ImplyFormula implements Formula {
    prettyPrint(): String {
        return "("+this._formula1.prettyPrint() +" -> "+this._formula2.prettyPrint()+")"
    }
    private _formula1: Formula;
    private _formula2: Formula;
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
}


export class EquivFormula implements Formula {
    prettyPrint(): String {
        return "("+this._formula1.prettyPrint() +" <-> "+this._formula2.prettyPrint()+")"
    }
    private _formula1: Formula;
    private _formula2: Formula;
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
}

export class ExactlyFormula implements Formula {
    prettyPrint(): String {
        var s = "(exactly "+(this._count.toString());
        for (var i = 0; i < this._variables.length; i += 1) {
            s += " "+this._variables[i];
        }        
        s += ")"
        return s;
    }
    private _count: number;
    private _variables: Array<string>;
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

}
/* export enum FormulaType {
    Atomic, Or, And, K, Kpos, Kw, Not, Xor, Imply, Equiv, True, False
} */


export class FormulaFactory{
    static createFormula(schemeExpression: string | Array<any>) {
        let ast;
        if (typeof schemeExpression == "string")
            ast = Scheme.parser(<string> schemeExpression);
        else
            ast = schemeExpression;

        return this.installFormula(ast);
    }


    private static installFormula(ast: string | Array<any>){
        if (ast instanceof Array) {
           if ((ast[0] == "K") || (ast[0] == "know") || (ast[0] == "box") || (ast[0] == "[]")) {
                if(ast.length != 3) throw "Parsing error: (K a phi)";
                return new KFormula(ast[1], this.installFormula(ast[2]))
            } else if ((ast[0] == "Kpos") || (ast[0] == "knowpos") || (ast[0] == "diamond") || (ast[0] == "<>")) {
                if(ast.length != 3) throw "Parsing error: (Kpos a phi)";
                return new KposFormula(ast[1], this.installFormula(ast[2]))
            } else if ((ast[0] == "Kw") || (ast[0] == "knowwhether")) {
                if(ast.length != 3) throw "Parsing error: (Kw a phi)";
                return new KwFormula(ast[1], this.installFormula(ast[2]))
            } else if (ast[0] == "not") {
                if(ast.length != 2) throw "Parsing error: (not phi)";
                return new NotFormula(this.installFormula(ast[1]))
            }
            else if (ast[0] == "and") {
                // Cas (and p q r s ...)
                return new AndFormula(ast.slice(1).map(this.installFormula))
            }
            else if (ast[1] == "and") {
                // Cas (p and q and r and s ...)
                var formulas:Array<Formula> = new Array();
                for (var i = 0; i < ast.length; i += 2) {
                    formulas.push(this.installFormula(ast[i]));
                }
                return new AndFormula(formulas)
            }
            else if (ast[0] == "or") {
                // Cas (and p q r s ...)
                return new OrFormula(ast.slice(1).map(this.installFormula))
            }            
            else if (ast[1] == "or") {
                var formulas:Array<Formula> = new Array();
                for (var i = 0; i < ast.length; i += 2) {
                    formulas.push(this.installFormula(ast[i]));
                }
                return new OrFormula(formulas)
            }
            else if (ast[0] == "xor") {
                // Cas (and p q r s ...)
                return new XorFormula(ast.slice(1).map(this.installFormula))
            }            
            else if (ast[1] == "xor") {
                var formulas:Array<Formula> = new Array();
                for (var i = 0; i < ast.length; i += 2) {
                    formulas.push(this.installFormula(ast[i]));
                }
                return new XorFormula(formulas)
            }
            else if ((ast[1] == "->" || ast[1] == "imply")) {
                return new ImplyFormula(this.installFormula(ast[0]),this.installFormula(ast[2]))
            }
            else if ((ast[1] == "<->" || ast[1] == "equiv")) {
                return new EquivFormula(this.installFormula(ast[0]),this.installFormula(ast[2]))
            } 
            else if ((ast[0] == "exactly") && !(+(ast[1]).isNaN)) {
                // The operator +ast[1] converts the string ast[1] into an int.
                return new ExactlyFormula((+ast[1]),ast.slice(2).map(s => s))
            }
            else {
                throw "Error while parsing the formula";
            }

        }
        else if (ast == "top" || ast == "true" || ast == "1") {
            return new TrueFormula
        }
        else if (ast == "bottom" || ast == "false" || ast == "0") {
            return new FalseFormula
        }
        else {
            return new AtomicFormula(ast)
        }
    }



}