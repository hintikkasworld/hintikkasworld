import { AndFormula, AtomicFormula, Formula, NotFormula } from '../formula/formula';
import * as types from '../formula/formula';

export class Valuation {
    public readonly propositions: { [id: string]: boolean } = {};

    constructor(truePropositions: { [id: string]: boolean } | string[]) {
        if (truePropositions instanceof Array) {
            const props = {};
            for (const proposition of truePropositions) {
                props[proposition] = true;
            }
            this.propositions = props;
        } else {
            this.propositions = truePropositions;
        }
    }

    checkBooleanFormula(phi: Formula): boolean {
        if (phi instanceof types.TrueFormula) {
            return true;
        }
        if (phi instanceof types.FalseFormula) {
            return false;
        }
        if (phi instanceof types.AtomicFormula) {
            return this.isPropositionTrue((phi as types.AtomicFormula).getAtomicString());
        }
        if (phi instanceof types.AndFormula) {
            return (phi as types.AndFormula).formulas.every((f) => this.checkBooleanFormula(f));
        }
        if (phi instanceof types.OrFormula) {
            return (phi as types.OrFormula).formulas.some((f) => this.checkBooleanFormula(f));
        }
        if (phi instanceof types.NotFormula) {
            return !this.checkBooleanFormula((phi as types.NotFormula).formula);
        }

        throw new Error('Not boolean formula phi:' + JSON.stringify(phi));
    }

    isPropositionTrue(p: string): boolean {
        return this.propositions[p];
    }

    /**
     * @returns a Boolean formula, actually a conjunction of litterals that
     * describes that valuation.
     */
    toFormula(): Formula {
        let literals = [];
        for (let proposition in this.propositions) {
            if (this.propositions[proposition]) {
                literals.push(new AtomicFormula(proposition));
            } else {
                literals.push(new NotFormula(new AtomicFormula(proposition)));
            }
        }
        return new AndFormula(literals);
    }


    toString() {
        const truePropositions = [];
        for (const proposition in this.propositions) {
            if (this.propositions[proposition] == true) {
                truePropositions.push(proposition);
            }
        }
        truePropositions.sort();
        return truePropositions.join();
    }
}
