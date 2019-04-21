import { EpistemicModel } from './../epistemicmodel/epistemic-model';

export interface EventModel<E extends EpistemicModel> {
    apply(M: E): E;
    isApplicableIn(M: E): boolean;
}
