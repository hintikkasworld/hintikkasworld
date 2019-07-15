import { Action } from './action';
import { ExampleDescription } from './exampledescription';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';

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
        this.executableActions = undefined;
    }

    getExampleDescription(): ExampleDescription {
        return this._exampleDescription;
    }

    getActions(): Action[] {
        return this._exampleDescription.getActions();
    }

    getExecutableActions(): Action[] {
        //TO BE ASYNCHORNOUS
        return [];
        if (this.executableActions == undefined) {
            // console.log("memoized executable actions : ", this.executableActions);
            // this.executableActions = []; //set to be true in case sbody else would like to compute it
                                            // Alex: I removed this, this should be useless, the actual reason was not this
            console.log("we compute the set of executable actions");
            let M = this._epistemicModel;
            const actions = this.getActions();
            // console.log("computed: ", actions);                
            this.executableActions = actions.filter(a => a.isApplicableIn(M));
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
        this.executableActions = undefined;
    }

    reset() {
        this._epistemicModel = this._exampleDescription.getInitialEpistemicModel();
        this.executableActions = undefined;

    }
}
