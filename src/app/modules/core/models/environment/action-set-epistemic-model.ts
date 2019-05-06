import { EpistemicModel } from './../epistemicmodel/epistemic-model';
import { Action } from './action';

export class ActionSetEpistemicModel implements Action {
    name: string;
    epistemicModel: EpistemicModel;

    constructor(option: { name: string, epistemicModel: EpistemicModel }) {
        this.name = option.name;
        this.epistemicModel = option.epistemicModel;
    }

    getName(): string {
        return this.name;
    }

    isApplicableIn(M: EpistemicModel): boolean {
        return true;
    }
    perform(M: EpistemicModel): EpistemicModel {
        return this.epistemicModel;
    }

}
