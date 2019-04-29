import { Formula, ExactlyFormula, AndFormula, AtomicFormula, NotFormula } from '../formula/formula';
import { BDD } from './../formula/bdd';

/**
 * Class to test BDD on with ng serve because ng test doesn"t load cudd.
 */
export class MyTestForBDD {

    private static n: number = 0;

    /**
     * Run tests with MyTestForBDD.run()
     */
    static run(): void{
        console.log(" === Run tests ===")
        MyTestForBDD.testInitialisation();
        MyTestForBDD.simpleFormula();
        MyTestForBDD.someBDDMethod();
        MyTestForBDD.testPick();
        MyTestForBDD.testPickRandom();
        MyTestForBDD.testCount();
        console.log(" ==> " + MyTestForBDD.n + " success.")
        console.log(" === End tests ===")
    }

    /**
     * Assertion method
     * @param condition conditon as boolean
     * @param message message as string
     */
    private static assert(condition: boolean, message: string){
        MyTestForBDD.n = MyTestForBDD.n + 1;
        if(!condition){
            message = message || "Assertion failed";

            if (typeof Error !== "undefined"){
                throw new Error(message);
            }
            throw message; //fallback
        }else{
            console.log("OK : '" + message + "'")
        }
    }

    /**
     * console.log variable and successors in BDDNode
     * @param variable 
     */
    private static printThenElse(variable: number): void{
        let service = BDD.bddService;
        console.log(service.getAtomOf(variable), ":", variable, "|", "Then", service.getThenOf(variable), "Else", service.getElseOf(variable), "True :", service.createTrue(), "False:", service.createFalse());
    }

    /**
     * Basic tests
     */
    private static testInitialisation(){

        let service = BDD.bddService;
        MyTestForBDD.assert(service != null, "BDD.bddService is not null.");

        let bTrue = service.createTrue();
        MyTestForBDD.assert(service.isTrue(bTrue), "True is true.");

        let bFalse = service.createFalse();
        MyTestForBDD.assert(service.isFalse(bFalse), "False is false.");
    }

    /**
     * Tests on simple formula : And, Or, getAtomOf, isInternal, isFalse, isTrue, Not, Implies, Equiv, getThen, getElse, 
     */
    private static simpleFormula(){

        let service = BDD.bddService;
        let bAtomP = service.createLiteral("p");
        let bTrue = service.createTrue();
        let bFalse = service.createFalse();

        MyTestForBDD.assert(service.getAtomOf(bAtomP) == "p", "p is p.");
        
        MyTestForBDD.assert(typeof service.applyIte(service.createCopy(bAtomP), service.createCopy(bTrue), service.createCopy(bFalse)) === "number", "applyIte(p, top, bot) is a number.");
    
        MyTestForBDD.assert(!service.isInternalNode(bTrue), "True is not an InternalNode");
        MyTestForBDD.assert(service.isInternalNode(bAtomP), "p is an InternalNode");

        MyTestForBDD.assert(service.getAtomOf(service.applyAnd([service.createCopy(bAtomP), service.createCopy(bTrue)])) == "p", "service.getAtomOf(service.applyAnd([bAtomP, bTrue]) == p")
        
        MyTestForBDD.assert(service.isFalse(service.applyAnd([service.createCopy(bAtomP), service.createCopy(bFalse)])), "(p and false) is false");
        MyTestForBDD.assert(service.isTrue(service.applyOr([service.createCopy(bAtomP), service.createCopy(bTrue)])), "(p or true) is true");

        let notP = service.applyNot(service.createCopy(bAtomP));

        MyTestForBDD.assert(service.isFalse(service.applyAnd([service.createCopy(bAtomP), service.createCopy(notP)])), "(p and not p) is false");
        MyTestForBDD.assert(service.isTrue(service.applyOr([service.createCopy(bAtomP), service.createCopy(notP)])), "(p or not p) is true");

        MyTestForBDD.assert(service.isFalse(service.applyNot(service.createTrue())), "not true is false");
        MyTestForBDD.assert(service.isTrue(service.applyNot(service.createFalse())), "not false is true");

        let bAtomQ = service.createLiteral("q");

        let or1 = service.applyAnd([service.createLiteral("q"), service.createLiteral("p")]);

        let or2 = service.applyOr([service.createCopy(bAtomQ), service.createCopy(bAtomP)]);

        //console.log("PICK", service.pickSolutions(or2));

        let notQ = service.applyNot(service.createCopy(bAtomQ));
        let implies1 = service.applyImplies(service.createCopy(bAtomP), service.createCopy(bAtomQ));
        let implies2 = service.applyImplies(service.createCopy(bAtomQ), service.createCopy(bAtomP));
        let nporq = service.applyOr([service.createCopy(notP), service.createCopy(bAtomQ)]);
        let nqorp = service.applyOr([service.createCopy(bAtomP), service.createCopy(notQ)]);
        MyTestForBDD.assert(implies1 == nporq, "p -> q == not p or q");
        MyTestForBDD.assert(implies2 == nqorp, "q -> p == not q or p");

        MyTestForBDD.assert(
            service.applyEquiv(service.createCopy(bAtomP), service.createCopy(bAtomQ)) 
            == 
            service.applyAnd([service.createCopy(implies1), service.createCopy(implies2)]),
            "p <-> q == (p->q) and (q->p).");

        MyTestForBDD.printThenElse(bAtomP);
        MyTestForBDD.printThenElse(notP);

        MyTestForBDD.assert(service.isTrue(service.getThenOf(bAtomP)), "IF of p is true");
        MyTestForBDD.assert(service.isFalse(service.getElseOf(bAtomP)), "ELSE of p is false");
        MyTestForBDD.assert(service.isFalse(service.getThenOf(notP)), "IF of not p is false");
        MyTestForBDD.assert(service.isTrue(service.getElseOf(notP)), "ELSE of not p is true");

        MyTestForBDD.assert(service.isTrue(service.applyExistentialForget(service.createCopy(bAtomP), ["p"])), "EForget(p, ['p']) == True")
        
        MyTestForBDD.assert(BDD.buildFromFormula(new AtomicFormula("p")) == bAtomP, "buildFromFormula(p) == p"); 
    }

    /**
     * Tests on buildFromFormula, cube
     */
    private static someBDDMethod(){

        let service = BDD.bddService;

        let bAtomP = service.createLiteral("p");
        let bAtomQ = service.createLiteral("q");
        let notQ = service.applyNot(service.createCopy(bAtomQ));
        let notP = service.applyNot(service.createCopy(bAtomP));

        // (p&q)|(np&nq)
        let phi = service.applyOr([
            service.applyAnd([service.createCopy(bAtomP), service.createCopy(bAtomQ)]), 
            service.applyAnd([service.createCopy(notP), service.createCopy(notQ)])]
        )

        MyTestForBDD.assert(service.isTrue(service.applyExistentialForget(service.createCopy(phi), ["p"])), "EForget( (p&q)|(np&nq) , ['p']) == True")
        MyTestForBDD.assert(service.isFalse(service.applyUniversalForget(service.createCopy(phi), ["p"])), "UForget( (p&q)|(np&nq) , ['p']) == False")

        let map = new Map();
        for(const [i, vari] of Array.from(["a", "b", "c"].entries())){
            map.set(vari, i % 2 == 0);
        }

        console.log(map);

        let anbc = service.applyAnd([service.createLiteral("a"), service.applyNot(service.createLiteral("b")), service.createLiteral("c")]);
        let anbc2 = BDD.buildFromFormula(new AndFormula([new AtomicFormula("a"), new NotFormula(new AtomicFormula("b")), new AtomicFormula("c") ]))
        let cube = service.createCube(map);
        MyTestForBDD.assert(cube == anbc && anbc == anbc2 && cube == anbc2 , "cube([a:t, b:f, c:t]) == a & not b & c == buildFromFormula");      
        
        let cube2 = BDD.bddService.createCube(new Map([["a", true], ["b", true], ["c", true], ["d", false]]));
        let formu = BDD.bddService.applyAnd([
            BDD.bddService.createLiteral("a"), BDD.bddService.createLiteral("b"), 
            BDD.bddService.createLiteral("c"), BDD.bddService.applyNot(BDD.bddService.createLiteral("d"))
        ]);

        MyTestForBDD.assert(cube2 == formu, "bdd.cube(abcnd) == bdd.and(abcnd)")

        let a1 = BDD.bddService.createCube(new Map([["a", true], ["b", true], ["c", false]]));
        console.log("a1", BDD.bddService.nodeToString(a1, true), BDD.bddService.pickAllSolutions(a1));
        let a2 = BDD.bddService.createCube(new Map([["a", true], ["b", false], ["c", true]]));
        console.log("a2", BDD.bddService.nodeToString(a2, true),  BDD.bddService.pickAllSolutions(a2));
        let a3 = BDD.bddService.createCube(new Map([["a", false], ["b", true], ["c", true]]));
        console.log("a3", BDD.bddService.nodeToString(a3), true,  BDD.bddService.pickAllSolutions(a3));
        let or = BDD.bddService.applyOr([a1, a2, a3]);
        console.log("or", BDD.bddService.pickAllSolutions(or));

        console.log("1er OR OK")
        let exact = BDD.buildFromFormula(new ExactlyFormula(2, ["a", "b", "c"]));
        console.log("exact", BDD.bddService.pickAllSolutions(exact));
        console.log("2eme OR (Exactly) OK")
        console.log(BDD.bddService.support(or), BDD.bddService.support(exact))
        MyTestForBDD.assert(exact == or, "Test exactly");

    }

    private static testPick(){
        let service = BDD.bddService;
        let bAtomP = service.createLiteral("p");
        let notP = service.applyNot(service.createCopy(bAtomP));

        MyTestForBDD.assert(service.pickAllSolutions(bAtomP).length == 1, "len(pickAllSolutions(p))==1");



    }
    private static testCount(){
        const service = BDD.bddService;
        function test(node, scope, exp) {
          const nbsols = service.countSolutions_JS(node, scope);
          const nbsolsCudd = service.countSolutions(node, scope);
          const scopestring = scope !== undefined ? scope.join(";") : "undefined";
          MyTestForBDD.assert(nbsols == exp, `correct nb of solutions for ${service.nodeToString(node)} with scope ${scopestring}`);
          MyTestForBDD.assert(nbsolsCudd == exp, `correct nb of solutions from CUDD for ${service.nodeToString(node)} with scope ${scopestring}`);
        }
        console.group("TEST COUNT SOLS");
        test(service.createTrue(), [], 1);
        test(service.createTrue(), undefined, 1);
        test(service.createTrue(), ["p"], 2);
        test(service.createTrue(), ["p", "q"], 4);
        test(service.createLiteral("p"), ["p"], 1);
        test(service.createLiteral("p"), undefined, 1);
        test(service.createLiteral("p"), ["p", "q"], 2);
        test(service.applyNot(service.createLiteral("p")), ["p"], 1);
        test(service.applyNot(service.createLiteral("p")), undefined, 1);
        test(service.applyNot(service.createLiteral("p")), ["p", "q"], 2);
        {
            const scope = ["p", "q", "r", "s"];
            const bdd = BDD.buildFromFormula(new ExactlyFormula(3, scope));
            test(bdd, undefined, 4);
            test(bdd, scope, 4);
            test(bdd, scope.concat(["t"]), 8);
            test(bdd, scope.concat(["t", "u"]), 16);
        }
        console.groupEnd();
    }

    private static testPickRandom(){
        const service = BDD.bddService;
        const nbRunsPerSol = 1000;
        function testPickRandomOnBdd(node, scope: string[]) {
            const counts = new Map<string, number>();
            const increm = (sol: string) => {
                const cur_count = counts.has(sol) ? counts.get(sol) : 0;
                counts.set(sol, cur_count + 1);
            }
            console.group("test pick random on " + service.nodeToString(node) + " with scope " + scope.join(";"));
            const nbSols = service.countSolutions(node, scope);
            console.log("nb sols: ", nbSols);
            const nbRuns = nbRunsPerSol*nbSols;
            for (let i = 0; i < nbRuns; i++) {
                increm(service.pickRandomSolution(node, scope).toString());
            }
            console.log(counts);
            MyTestForBDD.assert(counts.size == nbSols, "all solutions where found");
            const averageDev = Array.from(counts.values()).reduce((acc, v) => acc + Math.abs(v-nbRunsPerSol), 0) / nbRuns;
            console.log("avg: ", averageDev);
            MyTestForBDD.assert(averageDev < 0.2, "solutions are “reasonably” distributed");
            console.groupEnd();
        }
        console.group("TEST PICK RANDOM");
        testPickRandomOnBdd(service.createTrue(), []);
        testPickRandomOnBdd(service.createTrue(), ["p"]);
        testPickRandomOnBdd(service.createTrue(), ["p", "q"]);
        testPickRandomOnBdd(service.createLiteral("p"), ["p"]);
        testPickRandomOnBdd(service.createLiteral("p"), ["p", "q"]);
        testPickRandomOnBdd(service.applyNot(service.createLiteral("p")), ["p"]);
        testPickRandomOnBdd(service.applyNot(service.createLiteral("p")), ["p", "q"]);
        {
            const scope = ["p", "q", "r", "s"];
            const bdd = BDD.buildFromFormula(new ExactlyFormula(3, scope));
            testPickRandomOnBdd(bdd, scope);
            testPickRandomOnBdd(bdd, scope.concat(["t"]));
            testPickRandomOnBdd(bdd, scope.concat(["t", "u"]));
        }
        console.groupEnd();
    }

}
