import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { Postcondition } from './postcondition';

export class TrivialPostcondition implements Postcondition {
    perform(M: ExplicitEpistemicModel, w) {
        return Postcondition.cloneWorld(M.getNode(w));
    }

    toString() {
        return 'idle';
    }
}
