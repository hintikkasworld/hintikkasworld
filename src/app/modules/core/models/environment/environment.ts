import { Action } from './action';
import { ExampleDescription } from './exampledescription';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';

export class Environment {
    private _epistemicModel: EpistemicModel;
    public readonly exampleDescription: ExampleDescription;
    private _executableActions: Action[];
    public agentPerspective: string;

    constructor(exampleDescription: ExampleDescription) {
        this.exampleDescription = exampleDescription;
        this.reset();
    }

    get epistemicModel(): EpistemicModel {
        return this._epistemicModel;
    }

    get executableActions(): Action[] {
        return this._executableActions;
    }

    private async computeExecutableActions() {
        this._executableActions = [];
        const actions = this.exampleDescription.getActions();

        for (let a of actions) {
            if (await a.isApplicableIn(this._epistemicModel)) {
                this._executableActions.push(a);
            }
        }
    }

    setEpistemicModel(M: EpistemicModel) {
        this._epistemicModel = M;
        this.computeExecutableActions();
    }

    perform(action: Action) {
        this._epistemicModel = action.perform(this._epistemicModel);
        this.computeExecutableActions();
    }

    reset() {
        this._epistemicModel = this.exampleDescription.getInitialEpistemicModel();
        this.computeExecutableActions();
    }
}
