import { Scheme } from './scheme';

export enum FormulaType {
    Atomic, Or, And, K, Kpos, Kw, Not, Xor, Imply, Equiv, True, False
}


export class Formula {
    private _type: FormulaType;
    private _atomicString: string;
    private _agent: string;
    private formulas: Array<Formula> = [];


    getType(): FormulaType {
        return this._type;
    }


    getAtomicString(): string {
        return this._atomicString;
    }

    constructor(schemeExpression: string | Array<any>) {
        let ast;
        if (typeof schemeExpression == "string")
            ast = Scheme.parser(<string> schemeExpression);
        else
            ast = schemeExpression;

        this.installFormula(ast);
    }


    private installFormula(ast: string | Array<any>) {
        if (ast instanceof Array) {
            if ((ast[0] == "K") || (ast[0] == "know") || (ast[0] == "box") || (ast[0] == "[]")) {
                if(ast.length != 3) throw "Parsing error: (K a phi)";
                this._type = FormulaType.K;
                this._agent = ast[1];
                this.formulas.push(new Formula(ast[2]));
            } else if ((ast[0] == "Kpos") || (ast[0] == "knowpos") || (ast[0] == "diamond") || (ast[0] == "<>")) {
                if(ast.length != 3) throw "Parsing error: (Kpos a phi)";
                this._type = FormulaType.Kpos;
                this._agent = ast[1];
                this.formulas.push(new Formula(ast[2]));
            } else if ((ast[0] == "Kw") || (ast[0] == "knowwhether")) {
                if(ast.length != 3) throw "Parsing error: (Kw a phi)";
                this._type = FormulaType.Kw;
                this._agent = ast[1];
                this.formulas.push(new Formula(ast[2]));
            } else if (ast[0] == "not") {
                if(ast.length != 2) throw "Parsing error: (not phi)";
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
                throw "Error while parsing the formula";
            }

        }
        else if (ast == "top" || ast == "true" || ast == "1") {
            this._type = FormulaType.True;
        }
        else if (ast == "bottom" || ast == "false" || ast == "0") {
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


    getSubFormula() {
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



    prettyPrint(): string {
        function prettyPrintInfixOperator(op: string) {
            let s = "";
            for(let f of this.formulas) {
                if(s == "")
                    s = "(" + f.prettyPrint();
                else 
                    s += " " + op + " " + f.prettyPrint();
            }
            s += ")";
            return s;
        }


        switch(this._type) {
            case FormulaType.Atomic: return this._atomicString;
            case FormulaType.False: return "false";
            case FormulaType.True: return "true";
            case FormulaType.Imply: return prettyPrintInfixOperator("->");
            case FormulaType.Equiv: return prettyPrintInfixOperator("<->");
            case FormulaType.And: return prettyPrintInfixOperator("and");
            case FormulaType.Or: return prettyPrintInfixOperator("or");
            case FormulaType.Xor: return prettyPrintInfixOperator("xor");
            case FormulaType.Not: return "(not " + this.getSubFormula() + ")";
            case FormulaType.K: return "(K " + this.getAgent() + " " + this.getSubFormula() + ")";
            case FormulaType.Kpos: return "(Kpos " + this.getAgent() + " " + this.getSubFormula() + ")";
        }
    }
}
