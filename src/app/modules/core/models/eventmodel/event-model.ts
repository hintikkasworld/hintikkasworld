import { EpistemicModel } from './../epistemicmodel/epistemic-model';

export interface EventModel {
    apply(M: EpistemicModel): EpistemicModel;
}
