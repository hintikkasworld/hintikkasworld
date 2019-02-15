export class Valuation {
    propositions: { [id: string]: boolean } = {};

    constructor(truePropositions) {
        if (truePropositions != undefined)
            for (var i in truePropositions)
                this.propositions[truePropositions[i]] = true;
    }





    modelCheck(p) {
        return (this.propositions[p] == true)
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
