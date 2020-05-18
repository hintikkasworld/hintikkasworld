import { EpistemicModel } from '../epistemicmodel/epistemic-model';
import { Action } from './action';
import { EventModel } from '../eventmodel/event-model';

export class EventModelAction implements Action {
    _E: EventModel<any>;
    _name: string;

    constructor(description: { name: string; eventModel: EventModel<any> }) {
        this._name = description.name;
        this._E = description.eventModel;
    }

    async isApplicableIn(M: EpistemicModel): Promise<boolean> {
        return this._E.isApplicableIn(M);
    }

    getName() {
        return this._name;
    }

    perform(M: EpistemicModel): EpistemicModel {
        return this._E.apply(M);
    }
}
