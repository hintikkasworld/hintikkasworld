import { WorldValuation } from './world-valuation';
import { SymbolicEpistemicModel } from './symbolic-epistemic-model';
import { Obs, SymbolicRelation } from './symbolic-relation';
import { AtomicFormula } from '../formula/formula';
import { Valuation } from './valuation';

describe('SymbolicEpistemicModel', () => {
    it('should create an instance of SymbolicEpistemicModel', () => {
        let relationsSymboliques: Map<string, SymbolicRelation> = new Map();
        relationsSymboliques['a'] = new Obs(['var1']);

        const descr = {
            getAtomicPropositions: () => ['a', 'b'],

            getAgents: () => ['a', 'b'],

            getSetWorldsFormulaDescription: () => new AtomicFormula('var1'),

            getRelationDescription: (agent: string) => relationsSymboliques[agent],

            getPointedValuation: () => new Valuation(['var1']),
        };

        let sem = new SymbolicEpistemicModel(WorldValuation, descr);

        expect(sem).toBeTruthy();
        expect(sem.getAgents() == ['a']);
    });
});
