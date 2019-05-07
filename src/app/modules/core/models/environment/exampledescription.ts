import { Environment } from './environment';
import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { EpistemicModel } from './../epistemicmodel/epistemic-model';
import { World } from '../epistemicmodel/world';


class Point {
    x: number;
    y: number;
}

export abstract class ExampleDescription {
  
    abstract getName();
    abstract getInitialEpistemicModel(): EpistemicModel;
    abstract getActions();

    getWorldExample(): World {
        let M = this.getInitialEpistemicModel(); 
        return M.getPointedWorld();
    }

    
    public onRealWorldClick(env: Environment, point: Point): void {return};
    public onRealWorldClickRightButton(env: Environment, point: Point): void {return};
}
