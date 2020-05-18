import { Action } from './action';
import { ExampleDescription } from './exampledescription';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';
import { Observable, of } from 'rxjs';

export class Environment {
    private _epistemicModel: EpistemicModel;
    private readonly _exampleDescription: ExampleDescription;
    private _agentPerspective: string;

    /*memoization : we store the set of executable actions. When it has the value undefined, it means
    that it has to be recomputed*/
    private executableActions: Action[] = undefined;

    constructor(exampleDescription: ExampleDescription) {
        this._exampleDescription = exampleDescription;
        this.reset();
    }

    getEpistemicModel(): EpistemicModel {
        return this._epistemicModel;
    }

    setEpistemicModel(M: EpistemicModel) {
        this._epistemicModel = M;
        this.computeExecutableActions();
    }

    getExampleDescription(): ExampleDescription {
        return this._exampleDescription;
    }

    getActions(): Action[] {
        return this._exampleDescription.getActions();
    }

    getExecutableActions(): Action[] {
        return this.executableActions;
    }

    async computeExecutableActions(): Promise<Action[]> {
        // console.log("memoized executable actions : ", this.executableActions);
        // this.executableActions = []; //set to be true in case sbody else would like to compute it
        // Alex: I removed this, this should be useless, the actual reason was not this
        console.log('we compute the set of executable actions');
        this.executableActions = [];
        let M = this._epistemicModel;
        const actions = this.getActions();
        // console.log("computed: ", actions);

        for (let a of actions) {
            if (await a.isApplicableIn(M)) {
                this.executableActions.push(a);
            }
        }
        return this.executableActions;
    }

    set agentPerspective(a: string) {
        this._agentPerspective = a;
    }

    get agentPerspective() {
        return this._agentPerspective;
    }

    perform(action: Action) {
        this._epistemicModel = action.perform(this._epistemicModel);
        this.computeExecutableActions();
    }

    reset() {
        this._epistemicModel = this._exampleDescription.getInitialEpistemicModel();
        this.computeExecutableActions();
    }
}
