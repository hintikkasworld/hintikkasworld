import { ExampleDescription } from './exampledescription';

export class Environment {
    private _epistemicModel;

    constructor(exampleDescription: ExampleDescription) {
        this._epistemicModel = exampleDescription.getInitialEpistemicModel();
    }

    getEpistemicModel() {
        return this._epistemicModel;
    }
}
