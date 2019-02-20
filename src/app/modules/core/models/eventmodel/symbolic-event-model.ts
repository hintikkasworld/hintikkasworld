import { EventModel } from "./event-model";
import { EpistemicModel } from "../epistemicmodel/epistemic-model";

export class SymbolicEventModel implements EventModel {

    apply(M: EpistemicModel): EpistemicModel{
        return null;
    };
}
