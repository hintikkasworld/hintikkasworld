import { EpistemicModel } from './../epistemicmodel/epistemic-model';

export interface Postcondition {
    perform(M: EpistemicModel, w);
    toString(): string;
}
