import { EventModel } from './event-model';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { Formula } from '../formula/formula';
   
/* 
Nouvelles formules : 
post(AP) = bigand_{a in AP} (p <-> Old(post(p)))
chi = Forget(Old(pre and chi) and post(AP))
Ra = Forget(Old(Ra) and post(AP) and post(AP'))
*/

export class SymbolicPublicAction implements EventModel<SymbolicEpistemicModel> {
    private precondition:Formula;
    private postcondition:Map<string,Formula>;
    constructor(pre:Formula, post:Map<string,Formula>) {
        this.precondition = pre;
        this.postcondition = post;
    }
    apply(M:SymbolicEpistemicModel): SymbolicEpistemicModel {
        throw new Error("Method not implemented.");
    }
    
    async isApplicableIn(M: SymbolicEpistemicModel): Promise<boolean> {
        return await M.check(this.precondition);
    }
  
}
