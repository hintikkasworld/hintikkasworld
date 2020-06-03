import { WorldValuation } from './world-valuation';
import { Obs, SymbolicRelation } from './symbolic-relation';
import { AtomicFormula } from '../formula/formula';
import { Valuation } from './valuation';
import { SymbolicEpistemicModelTouist } from './symbolic-epistemic-model-touist';

describe('SymbolicEpistemicModelBDD', () => {
    it('should create an instance of SymbolicEpistemicModelBDD', () => {
        let relationsSymboliques: Map<string, SymbolicRelation> = new Map();
        relationsSymboliques['a'] = new Obs(['var1']);
        relationsSymboliques['b'] = new Obs(['var2']);

        const descr = {
            getAtomicPropositions: () => ['a', 'b'],

            getAgents: () => ['a', 'b'],

            getSetWorldsFormulaDescription: () => new AtomicFormula('var1'),

            getRelationDescription: (agent: string) => relationsSymboliques[agent],

            getPointedValuation: () => new Valuation(['var1'])
        };

        let sem = new SymbolicEpistemicModelTouist((val) => new WorldValuation(val), descr);

        expect(sem).toBeTruthy();
        expect(sem.getAgents() == ['a']);
    });
});
