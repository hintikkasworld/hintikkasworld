import { World } from './world';

export interface EpistemicModel {
    getPointedWorld();
    getSuccessors(w: World, a: string);
    

}
