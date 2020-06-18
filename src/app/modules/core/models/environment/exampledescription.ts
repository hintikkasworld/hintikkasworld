import { Environment } from './environment';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';
import { World } from '../epistemicmodel/world';
import { Action } from './action';

class Point {
    x: number;
    y: number;
}

export abstract class ExampleDescription {
    abstract getAtomicPropositions(): string[];
    abstract getName();
    abstract getInitialEpistemicModel(): EpistemicModel;
    abstract getDescription(): string[];
    abstract getActions(): Action[];

    getWorldExample(): World {
        let M = this.getInitialEpistemicModel();
        return M.getPointedWorld();
    }

    public onRealWorldClick(env: Environment, point: Point): void {
        return;
    }
    public onRealWorldClickRightButton(env: Environment, point: Point): void {
        return;
    }
}
