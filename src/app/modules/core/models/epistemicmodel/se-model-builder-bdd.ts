import { SEModelBuilder } from './se-model-builder';
import { SymbolicEpistemicModel } from './symbolic-epistemic-model';

export class SEModelBuilderBDD implements SEModelBuilder {

    private se_model: SymbolicEpistemicModel;

    constructor() {
        this.reset();
    }

    reset(): void {
        this.se_model = new SymbolicEpistemicModel();
    }

    setPointedValuation(): void;
    initializePropositionalAtoms(): void;
    initializePropositionalPrimes(): void;
    setFormulaSetWorlds(): void;
    setRelations(): void;
    setAgents(): void;
    setRelations(): void;
    setWorldClass(): void;
    getModel(): SymbolicEpistemicModel {
        const result = this.se_model;
        this.reset();
        return result;
    };

}