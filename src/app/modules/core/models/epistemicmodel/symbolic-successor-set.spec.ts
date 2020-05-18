import { SymbolicSuccessorSet } from './symbolic-successor-set';
import { SymbolicEpistemicModel } from './symbolic-epistemic-model';
import { WorldValuation } from './world-valuation';

describe('SymbolicSuccessorSet', () => {
    it('should create an instance', () => {
        const descr = {
            getAtomicPropositions: () => [],
            getAgents: () => [],
            getSetWorldsFormulaDescription: () => undefined,
            getRelationDescription: (_) => undefined,
            getPointedValuation: () => undefined
        };

        let sem = new SymbolicEpistemicModel(WorldValuation, descr);

        expect(new SymbolicSuccessorSet(sem, undefined, 'a')).toBeTruthy();
    });
});
