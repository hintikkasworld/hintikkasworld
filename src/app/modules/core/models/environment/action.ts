import { Formula } from './../formula/formula';
import { EpistemicModel } from './../epistemicmodel/epistemic-model';

export interface Action {
    getName(): string;

    isApplicableIn(M: EpistemicModel): Promise<boolean>;

    perform(M: EpistemicModel): EpistemicModel;
}
