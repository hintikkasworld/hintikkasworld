import { EventModel } from './event-model';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';
import { Formula } from '../formula/formula';

export class SymbolicPublicAction implements EventModel {
    private precondition:Formula;
    private postcondition:Map<string,Formula>;
    constructor(pre:Formula, post:Map<string,Formula>) {
        this.precondition = pre;
        this.postcondition = post;
    }
    apply(M:EpistemicModel): EpistemicModel {
        throw new Error("Method not implemented.");
    }
  
}
