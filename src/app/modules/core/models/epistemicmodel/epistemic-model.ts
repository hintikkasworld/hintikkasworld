import { Formula } from './../formula/formula';
import { World } from './world';

/**
 * An EpistemicModel is an interface used by the GUI. The implementation may be an explicit graph or
 * a symbolic representation, or... something else.
 */
export interface EpistemicModel {
    /**
     * @returns the pointed world (the current world)
     */
    getPointedWorld(): World;

    /**
     * the list of agents involved in the epistemic model
     */
    getAgents(): string[];

    /**
     * 
     * @param w 
     * @param a 
     * @returns a list of possible worlds for agent a in world w. The list may be exhaustive, that 
     * list the set of all possible worlds for agent a in world w (typically, we would require that
     * for an explicit representation). Otherwise, for a symbolic representation, and if there
     * are many successors, we expect this method to return *some* possible worlds.
     */
    getSuccessors(w: World, a: string);
    
    /**
     * 
     * @param formula 
     * @returns true if the formula is true in the pointed world
     */
    check(formula: Formula);

}
