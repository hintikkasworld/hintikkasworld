import { Formula } from './../formula/formula';
import { EpistemicModel } from './../epistemicmodel/epistemic-model';

export interface Action {
    getName(): string;
    getPrecondition(): Formula;
    perform(M: EpistemicModel): EpistemicModel;
}
