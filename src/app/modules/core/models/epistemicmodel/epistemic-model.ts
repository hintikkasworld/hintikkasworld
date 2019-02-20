import { World } from './world';

export interface EpistemicModel {
    getPointedWorld();
    getAgents(): string[];
    getSuccessors(w: World, a: string);
    

}
