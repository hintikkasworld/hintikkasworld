import { EpistemicModel } from './../epistemicmodel/epistemic-model';

export interface EventModel<EpistemicModelType extends EpistemicModel> {
    apply(M: EpistemicModelType): EpistemicModelType;
    isApplicableIn(M: EpistemicModelType): Promise<boolean>;
}
