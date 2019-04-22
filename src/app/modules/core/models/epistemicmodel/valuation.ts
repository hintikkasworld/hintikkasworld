export class Valuation {
  public readonly propositions: { [id: string]: boolean } = {};

  constructor(truePropositions: { [id: string]: boolean } | string[]) {
    if (truePropositions instanceof Array) {
      const props = {};
      for (const proposition of truePropositions)
        props[proposition] = true;
      this.propositions = props;
    }
    else
      this.propositions = truePropositions;
  }

  isPropositionTrue(p: string) { return (this.propositions[p] == true); }

  toAssignment(props: string[]): Map<string, boolean> {
    /* check support */
    for (const p of Object.keys(this.propositions)) {
      if (!props.includes(p)) {
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
    const truePropositions = new Array();
    for (const proposition in this.propositions)
      if (this.propositions[proposition] == true)
        truePropositions.push(proposition);
    truePropositions.sort();
    return truePropositions.join();
  }
}
