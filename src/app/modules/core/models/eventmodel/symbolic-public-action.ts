import { EventModel } from './event-model';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';
import { Formula } from '../formula/formula';

/* 
Nouvelles formules : 
post(AP) = bigand_{a in AP} (p <-> Old(post(p)))
chi = Forget(Old(pre and chi) and post(AP))
Ra = Forget(Old(Ra) and post(AP) and post(AP'))
*/

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
