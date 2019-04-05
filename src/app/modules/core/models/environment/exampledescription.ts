import { Environment } from './environment';
import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { EpistemicModel } from './../epistemicmodel/epistemic-model';
import { World } from '../epistemicmodel/world';

export abstract class ExampleDescription {
    abstract getName();
    abstract getInitialEpistemicModel(): EpistemicModel;
    abstract getActions();

    getWorldExample(): World {
        let M = this.getInitialEpistemicModel(); 
        return <World> (<ExplicitEpistemicModel> M).getPointedWorld();
    }

    
    onRealWorldClick(env: Environment, point) {};
}
