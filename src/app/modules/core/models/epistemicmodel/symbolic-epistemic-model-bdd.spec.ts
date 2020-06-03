import { WorldValuation } from './world-valuation';
import { Obs, SymbolicRelation } from './symbolic-relation';
import { AtomicFormula } from '../formula/formula';
import { Valuation } from './valuation';
import { SymbolicEpistemicModelBDD } from './symbolic-epistemic-model-bdd';

describe('SymbolicEpistemicModelBDD', () => {
    it('should create an instance of SymbolicEpistemicModelBDD', () => {
        let relationsSymboliques: Map<string, SymbolicRelation> = new Map();
        relationsSymboliques['a'] = new Obs(['var1']);

        const descr = {
            getAtomicPropositions: () => ['a', 'b'],

            getAgents: () => ['a', 'b'],

            getSetWorldsFormulaDescription: () => new AtomicFormula('var1'),

            getRelationDescription: (agent: string) => relationsSymboliques[agent],

            getPointedValuation: () => new Valuation(['var1'])
        };

        let sem = new SymbolicEpistemicModelBDD((val) => new WorldValuation(val), descr);

        expect(sem).toBeTruthy();
        expect(sem.getAgents() == ['a']);
    });
});
