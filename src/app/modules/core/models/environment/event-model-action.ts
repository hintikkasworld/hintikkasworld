import { EpistemicModel } from './../epistemicmodel/epistemic-model';
import { Formula } from './../formula/formula';
import { ExplicitEventModel } from './../eventmodel/explicit-event-model';
import { Action } from './action';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';
import { EventModel } from '../eventmodel/event-model';
import { __exportStar } from 'tslib';

export class EventModelAction implements Action {
    _E: EventModel;
    _name: string;

    constructor(description: { name: string, eventModel: EventModel }) {
        this._name = description.name;
        this._E = description.eventModel;

    }

    getPrecondition(M: EpistemicModel): Formula {
        if (this._E instanceof ExplicitEventModel)
            return (<any>this._E.getNode(this._E.getPointedAction())).pre;
        else
            throw "Unimplemented";
    }
    getName() {
        return this._name;
    }

    perform(M: EpistemicModel): EpistemicModel {
        return this._E.apply(M);
    }
}
