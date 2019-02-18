import { ExampleDescription } from './examples/exampledescription';
import { EpistemicModel } from './epistemicmodel/epistemic-model';

export class Environment {
    private _epistemicModel;
    private _exampleDescription;

    constructor(exampleDescription: ExampleDescription) {
        this._exampleDescription = exampleDescription;
        this.reset();
    }

    getEpistemicModel() {
        return this._epistemicModel;
    }

    reset() {
        this._epistemicModel = this._exampleDescription.getInitialEpistemicModel();
    }
}
