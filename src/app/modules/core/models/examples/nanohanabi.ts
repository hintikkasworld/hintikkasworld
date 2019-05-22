import { ExplicitEventModel } from './../eventmodel/explicit-event-model';
import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { environment } from 'src/environments/environment';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
import { World } from '../epistemicmodel/world';
/**
 * @param valuation a valuation
 * */
class NanoHanabiWorld extends WorldValuation {

    static readonly cardSuits = ["green", "blue", "orange", "red"];
    static readonly cardValues = ["1", "2", "3", "4", "5"];
    static readonly cardWidth = 9;
    static readonly cardHeight = 8;
    static readonly cardNumber = 5;

    constructor(valuation: Valuation) {
        super(valuation);
        this.agentPos["a"] = { x: 32, y: 32, r: 16 };
        this.agentPos["b"] = { x: 68 + 32 + 10, y: 32, r: 16 };
        this.agentPos["c"] = { x: 68 + 5, y: 32, r: 1 };;



    }



    draw(context: CanvasRenderingContext2D) {
        this.drawAgents(context);
        context.font = "12px Verdana";
        context.strokeStyle = "#000000";
        for (var a of ["a", "b"])
            for (var pos of ["l", "", "r"])
                for (var i = 1; i <= 4; i++) {
                    let xshift;

                    if (pos == "l")
                        xshift = -16;
                    else if (pos == "")
                        xshift = -9;
                    else
                        xshift = -2;

                    if (this.modelCheck(a + pos + i))
                        WorldValuation.drawCard(context, { x: this.agentPos[a].x + xshift, y: 12, w: 16, text: i });
                }
        for (var i = 0; i <= 4; i++) {
            if (this.modelCheck("c" + i))
                WorldValuation.drawCard(context, { x: this.agentPos["c"].x - 4, y: 12, w: 16, text: i });
        }

        if (this.modelCheck("c4")) {
            context.strokeStyle = "#00000";
            context.strokeText("WINNER!", this.agentPos["c"].x - 30, 12);
        }
    }

}















export class NanoHanabi extends ExampleDescription {
    getDescription(): string[] {
        return ["Each and has two number between 0 and 4. They only see the numbers of the other agent."]
    }

    al;
    ar;
    bl;
    br;
    getAtomicPropositions() {
        let A = [];
        for (let x = 0; x <= 4; x++) {
            ["ar","al","bl","br","c"].forEach( (prop) => A.push(prop+x.toString()));
        }
        return A;
    }
    getName() { return "Nano Hanabi"; }

    getInitialEpistemicModel() {
        const permutator = (inputArr) => {
            let result = [];

            const permute = (arr, m = []) => {
                if (arr.length === 0) {
                    result.push(m)
                } else {
                    for (let i = 0; i < arr.length; i++) {
                        let curr = arr.slice();
                        let next = curr.splice(i, 1);
                        permute(curr.slice(), m.concat(next))
                    }
                }
            }

            permute(inputArr);
            return result;
        }
        let M = new ExplicitEpistemicModel();
        let permutations = permutator([1, 2, 3, 4]);
        //console.log(permutations);
        for (let permutation of permutations) {
            M.addWorld("w" + permutation[0] + permutation[1] + permutation[2] + permutation[3], new NanoHanabiWorld(new Valuation(["al" + permutation[0], "ar" + permutation[1], "bl" + permutation[2], "br" + permutation[3], "c0"])));
        }

        let ab = ["a", "b"];
        var b;
        ab.forEach(a =>
            //var a="a";
            M.addEdgeIf(a, function (w1, w2) {
                if (a == "a") {
                    b = "b";
                } else {
                    b = "a";
                }
                if (w1.modelCheck("c0") && w2.modelCheck("c0")) {
                    for (var i = 1; i <= 4; i++) {
                        if (w1.modelCheck(b + "l" + i) !== w2.modelCheck(b + "l" + i))
                            return false;
                        if (w1.modelCheck(b + "r" + i) !== w2.modelCheck(b + "r" + i))
                            return false;
                    }
                } else return false;
                return true;
            }));



        var selected = Math.floor(Math.random() * 24);
        var pointed = permutations[selected];

        M.setPointedWorld("w" + pointed[0] + pointed[1] + pointed[2] + pointed[3]);
        this.al = pointed[0];
        this.ar = pointed[1];
        this.bl = pointed[2];
        this.br = pointed[3];

        M.removeUnReachablePartFrom("w" + pointed[0] + pointed[1] + pointed[2] + pointed[3]);
        return M;
    }


    getActions() {



/*
TODO

        function playAleft() {

            var E = new ExplicitEventModel();
            if (M.getNode(M.getPointedWorld()).modelCheck("c" + (al - 1))) {
                var id = "al" + al;
                var id1 = "c" + (al - 1);
                var id2 = "c" + al;
                let post = {};
                post[id] = "bottom";
                post[id1] = "bottom";
                post[id2] = "top";
                E.addAction("e", "( K a ( al" + al + "))", post);
                E.setPointedAction("e");
            } else {
                E.addAction("f", "top");
                E.setPointedAction("f");
            }
            E.makeReflexiveRelation("a");
            E.makeReflexiveRelation("b");

            return E;
        }

        function playAright() {
            var E = new ExplicitEventModel();
            if (M.getNode(M.getPointedWorld()).modelCheck("c" + (ar - 1))) {
                console.log(ar);
                var id = "ar" + ar;
                var id1 = "c" + (ar - 1);
                var id2 = "c" + ar;
                let post = {};
                post[id] = "bottom";
                post[id1] = "bottom";
                post[id2] = "top";
                E.addAction("e", "( K a ( ar" + ar + "))", post);
                E.setPointedAction("e");
            } else {
                E.addAction("f", "top");
                E.setPointedAction("f");
            }
            E.makeReflexiveRelation("a");
            E.makeReflexiveRelation("b");

            return E;
        }

        function playBleft() {

            var E = new ExplicitEventModel();
            if (M.getNode(M.getPointedWorld()).modelCheck("c" + (bl - 1))) {
                var id = "bl" + bl;
                var id1 = "c" + (bl - 1);
                var id2 = "c" + bl;
                let post = {};
                post[id] = "bottom";
                post[id1] = "bottom";
                post[id2] = "top";
                E.addAction("e", "( K b ( bl" + bl + "))", post);
                E.setPointedAction("e");
            } else {
                E.addAction("f", "top");
                E.setPointedAction("f");
            }
            E.makeReflexiveRelation("a");
            E.makeReflexiveRelation("b");

            return E;
        }

        function playBright() {
            var E = new ExplicitEventModel();
            if (M.getNode(M.getPointedWorld()).modelCheck("c" + (br - 1))) {
                let post = {};
                post["br" + br] = "bottom";
                post["c" + (br - 1)] = "bottom";
                post["c" + br] = "top";
                E.addAction("e", "( K b ( br" + br + "))", post);
                E.setPointedAction("e");
            } else {
                E.addAction("f", "top");
                E.setPointedAction("f");
            }
            E.makeReflexiveRelation("a");
            E.makeReflexiveRelation("b");

            return E;
        }



*/

        return [];
    }


}