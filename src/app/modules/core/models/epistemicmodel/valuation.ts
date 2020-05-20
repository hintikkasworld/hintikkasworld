export class Valuation {
    public readonly propositions: { [id: string]: boolean } = {};

    constructor(truePropositions: { [id: string]: boolean } | string[]) {
        if (truePropositions instanceof Array) {
            const props = {};
            for (const proposition of truePropositions) {
                props[proposition] = true;
            }
            this.propositions = props;
        } else {
            this.propositions = truePropositions;
        }
    }

    isPropositionTrue(p: string): boolean {
        return this.propositions[p];
    }

    toString() {
        const truePropositions = [];
        for (const proposition in this.propositions) {
            if (this.propositions[proposition] == true) {
                truePropositions.push(proposition);
            }
        }
        truePropositions.sort();
        return truePropositions.join();
    }
}
