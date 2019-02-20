import { Action } from './action';
import { ExampleDescription } from './exampledescription';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';

export class Environment {
    private _epistemicModel: EpistemicModel;
    private _exampleDescription: ExampleDescription;
    private _agentPerspective: string;

    constructor(exampleDescription: ExampleDescription) {
        this._exampleDescription = exampleDescription;
        this.reset();
    }

    getEpistemicModel(): EpistemicModel {
        return this._epistemicModel;
    }

    setEpistemicModel(M: EpistemicModel) {
        this._epistemicModel = M;
    }

    getExampleDescription(): ExampleDescription {
        return this._exampleDescription;
    }
    getActions() {
        return this._exampleDescription.getActions();
    }

    set agentPerspective(a: string) {
        this._agentPerspective = a;
    }

    get agentPerspective() {
        return this._agentPerspective;
    }


    perform(action: Action) {
        this._epistemicModel = action.perform(this._epistemicModel);
    }

    reset() {
        this._epistemicModel = this._exampleDescription.getInitialEpistemicModel();
    }
}
