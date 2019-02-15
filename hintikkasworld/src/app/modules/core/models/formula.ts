import { Scheme } from './scheme';

export enum FormulaType {
    Atomic, Or, And, K, Kpos, Kw, Not, Xor, Imply, Equiv, True, False
}


export class Formula {
    private _type: FormulaType;
    private _atomicString;
    private _agent;
    private formulas: Array<Formula>;


    getType() {
        return this._type;
    }


    getAtomicString() {
        return this._atomicString;
    }

    constructor(schemeExpression: any) {
        let ast;
        if (schemeExpression instanceof String)
            ast = Scheme.parser(schemeExpression);
        else
            ast = schemeExpression;

        this.installFormula(ast);
    }


    private installFormula(ast) {
        if (ast instanceof Array) {
            if ((ast[0] == "K") || (ast[0] == "know") || (ast[0] == "box") || (ast[0] == "[]")) {
                this._type = FormulaType.K;
                this._agent = ast[1];
                this.formulas.push(new Formula(ast[2]));
            } else if ((ast[0] == "Kpos") || (ast[0] == "knowpos") || (ast[0] == "diamond") || (ast[0] == "<>")) {
                this._type = FormulaType.Kpos;
                this._agent = ast[1];
                this.formulas.push(new Formula(ast[2]));
            } else if ((ast[0] == "Kw") || (ast[0] == "knowwhether")) {
                this._type = FormulaType.Kw;
                this._agent = ast[1];
                this.formulas.push(new Formula(ast[2]));
            } else if (ast[0] == "not") {
                this._type = FormulaType.Not;
                this.formulas.push(new Formula(ast[1]));
            }
            else if (ast[1] == "and") {
                this._type = FormulaType.And;
                for (let i = 0; i < ast.length; i += 2) {
                    this.formulas.push(new Formula(ast[i]));
                }
            }
            else if (ast[1] == "or") {
                this._type = FormulaType.Or;
                for (let i = 0; i < ast.length; i += 2) {
                    this.formulas.push(new Formula(ast[i]));
                }
            }
            else if (ast[1] == "xor") {
                this._type = FormulaType.Xor;
                for (let i = 0; i < ast.length; i += 2) {
                    this.formulas.push(new Formula(ast[i]));
                }
            }
            else if ((ast[1] == "->" || ast[1] == "imply")) {
                this._type = FormulaType.Imply;
                for (let i = 0; i < ast.length; i += 2) {
                    this.formulas.push(new Formula(ast[i]));
                }
            }
            else if ((ast[1] == "<->" || ast[1] == "equiv")) {
                this._type = FormulaType.Equiv;
                for (let i = 0; i < ast.length; i += 2) {
                    this.formulas.push(new Formula(ast[i]));
                }
            }

            else {
                this._type = FormulaType.Atomic;
                this._atomicString = ast;
            }

        }
        else if (ast == "top" || ast == "true" || ast == 1) {
            this._type = FormulaType.True;
        }
        else if (ast == "bottom" || ast == "false" || ast == 0) {
            this._type = FormulaType.False;
        }
        else {
            this._type = FormulaType.Atomic;
            this._atomicString = ast;
        }
    }



    getAgent() {
        return this._agent;
    }


    getFormulaSubFormula() {
        return this.formulas[0];
    }

    getSubFormulaFirst() {
        return this.formulas[0];
    }

    getSubFormulaSecond() {
        return this.formulas[1];
    }

    getFormulaSubFormulas() {
        return this.formulas;
    }

    isAtomic() {
        return !(ast instanceof Array);
    }

}
