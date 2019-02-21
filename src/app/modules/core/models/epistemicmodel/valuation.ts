export class Valuation {
    propositions: { [id: string]: boolean } = {};

    constructor(truePropositions:  { [id: string]: boolean } | [string] ) {
        if(truePropositions instanceof Array) {
            this.propositions = {};
            for(let proposition of truePropositions) 
                this.propositions[proposition] = true;
        }
        else
            this.propositions = truePropositions;
    }

    
    isPropositionTrue(p: string) {
        return (this.propositions[p] == true);
    }


    toString() {
        let truePropositions = new Array();

        for (let i in this.propositions)
            if (this.propositions[i] == true)
                truePropositions.push(i);

        truePropositions.sort();

        return truePropositions.join();

    }
}
