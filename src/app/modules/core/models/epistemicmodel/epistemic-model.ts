import { Formula } from './../formula/formula';
import { World } from './world';

export interface EpistemicModel {
    getPointedWorld(): World;
    getAgents(): string[];
    getSuccessors(w: World, a: string);
    
    check(formula: Formula);

}
