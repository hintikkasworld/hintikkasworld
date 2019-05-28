import { SymbolicEpistemicModel } from './symbolic-epistemic-model';

/**
 * This SEModelBuilder interface specifies methods for building 
 * symbolic epistemic model. It was built in the need of refactoring
 * the code of the class SymbolicEpistemicModel. This class used to 
 * have a complex interface and two responsibilities: representation of 
 * a symbolic epistemic model and build itself. This interface 
 * was created in order to seperate the model and the building process
 * which also has to be asynchronous. We strictly respect the SRP principle
 * of SOLID by "Uncle Bob".
 */
export interface SEModelBuilder {

    setPointedValuation(): void;
    initializePropositionalAtoms(): void;
    initializePropositionalPrimes(): void;
    setFormulaSetWorlds(): void;
    setRelations(): void;
    setAgents(): void;
    setRelations(): void;
    setWorldClass(): void;
    getModel(): SymbolicEpistemicModel;

}