export class Valuation {
    propositions: { [id: string]: boolean } = {};

    constructor(truePropositions:  { [id: string]: boolean } | string[] ) {
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

    toAssignment(props: string[]): Map<string, boolean> {
      /* check support */
      for (const p of Object.keys(this.propositions)) {
        if ( ! props.includes(p)) {
          throw new Error("Valuation contains proposition " + p + " that is not in the support given");
        }
      }
      const assignment = new Map();
      for (const p of props) {
        if (this.isPropositionTrue(p)) assignment.set(p, true);
        else assignment.set(p, false);
      }
      return assignment;
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
