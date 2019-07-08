private async loadDescriptor(descr: SEModelDescriptor | SEModelInternalDescriptor) {
    function wait() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve('resolved');
            }, 200000);
        });
    }

    function syncWait() {
        let A = [1, 2, 3];
        for (let i = 0; i < 1000000000; i++)
            A.sort();
    }

    syncWait();
    console.log("   loadDescriptor: begin")
    await wait();
    this.propositionalAtoms = descr.getAtomicPropositions();
    await wait();
    this.propositionalPrimes = SymbolicEpistemicModel.getPrimedAtomicPropositions(this.propositionalAtoms);
    await wait();
    // console.log("Agents of SymbolicEpistemicModel", agents);
    if ((<any>descr).getSetWorldsFormulaDescription != undefined) { //we intend  "instanceof SEModelDescriptor"
        let descriptor = <SEModelDescriptor>descr;

        //from now on, it should done asynchronously
        this.bddSetWorlds = SymbolicEpistemicModel.getRulesAndRulesPrime(descriptor.getSetWorldsFormulaDescription());
        await wait();

        for (let agent of this.agents) {
            let bddRelation = descriptor.getRelationDescription(agent).toBDD();
            await wait();
            this.symbolicRelations.set(agent, BDD.bddService.applyAnd([BDD.bddService.createCopy(this.bddSetWorlds), bddRelation]));
            await wait();
        }
    }
    else { //we intend  "instanceof SEModelInternalDescriptor"
        let descriptor = <SEModelInternalDescriptor>descr;
        await wait();
        this.bddSetWorlds = descriptor.getSetWorldsBDDDescription();
        await wait();
        for (let agent of this.agents) {
            let bddRelation = descriptor.getRelationBDD(agent);
            await wait();
            this.symbolicRelations.set(agent, BDD.bddService.applyAnd([BDD.bddService.createCopy(this.bddSetWorlds), bddRelation]));
            await wait();
        }
    }
    console.log("   loadDescriptor: end")
}