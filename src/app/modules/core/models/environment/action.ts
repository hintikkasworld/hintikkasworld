import { Formula } from './../formula/formula';
import { EpistemicModel } from './../epistemicmodel/epistemic-model';

export interface Action {
    getName(): string;
    getPrecondition(M: EpistemicModel): Formula;
    perform(M: EpistemicModel): EpistemicModel;
}
