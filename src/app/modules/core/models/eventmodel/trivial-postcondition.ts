import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { Postcondition } from './postcondition';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';

export class TrivialPostcondition implements Postcondition {
    perform(M: ExplicitEpistemicModel, w) {
        return M.getNode(w);
    }

    toString() {
        return "idle";
    }
}
