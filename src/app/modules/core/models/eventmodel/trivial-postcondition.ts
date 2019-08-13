import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { Postcondition } from './postcondition';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';

export class TrivialPostcondition implements Postcondition {
    perform(M: ExplicitEpistemicModel, w) {
        return Postcondition.cloneWorld( M.getNode(w) );
    }

    toString() {
        return "idle";
    }

    getValuation() {
        return {};
    }
}
