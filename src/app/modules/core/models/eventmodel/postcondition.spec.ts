import { WorldValuation } from './../epistemicmodel/world-valuation';
import { Valuation } from '../epistemicmodel/valuation';
import { Postcondition } from './postcondition';

describe('Postcondition', () => {
    it('cloneWorld: should clone', () => {
        let world = new WorldValuation(new Valuation([]));
        let world2 = Postcondition.cloneWorld(world);
        expect(world != world2).toBeTruthy();
    });

    it('cloneWorld: should have different valuations', () => {
        let world = new WorldValuation(new Valuation([]));
        let world2 = Postcondition.cloneWorld(world);
        expect(world.valuation != world2.valuation).toBeTruthy();
    });

    it('cloneWorld: should have different valuations and different propositions set', () => {
        let world = new WorldValuation(new Valuation([]));
        let world2 = Postcondition.cloneWorld(world);
        expect(world.valuation.propositions != world2.valuation.propositions).toBeTruthy();
    });

    it('cloneWorld: should have the same value', () => {
        let world = new WorldValuation(new Valuation([]));
        let world2 = Postcondition.cloneWorld(world);
        expect(world.modelCheck('p') == world2.modelCheck('p')).toBeTruthy();
    });
});
