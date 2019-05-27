import { ExplicitEventModel } from './../eventmodel/explicit-event-model';
import { EventModelAction } from './../environment/event-model-action';
import { EventModel } from './../eventmodel/event-model';
import { WorldValuation } from '../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';
import { Formula, FormulaFactory } from '../formula/formula';
import { Valuation } from '../epistemicmodel/valuation';
import { isoStringToDate } from '@angular/common/src/i18n/format_date';


/**
 * @param truePropositions an array of true propositions. Proposition "ma" stands for "a is muddy" and "mb" stands for "b is muddy".
 * @returns a state corresponding to the muddy children puzzle
 * @example new MuddyChildrenWorld(["ma", "mb"])
 * */
class MuddyChildrenWorld extends WorldValuation {
    static mud = MuddyChildrenWorld.getImage('mud.png');
    readonly nbChildren;
    readonly size;

    constructor(valuation: Valuation, nbChildren:number) {
        super(valuation);
        this.nbChildren = nbChildren;
        this.size = 64/this.nbChildren;
        for (let i = 0; i < this.nbChildren; i++) {
            this.agentPos[String.fromCharCode(97+i)] = { x: this.size*(2*i+1), y: this.size, r: this.size }; 
        }
        // The constructor should work for any number of agents, but now is supported only for 4 agents.
      
    }

    draw(context: CanvasRenderingContext2D) {
        this.drawAgents(context);
        for (let i = 0; i < this.nbChildren; i++) {
            if (this.modelCheck("m"+String.fromCharCode(97+i))) {
                context.drawImage(MuddyChildrenWorld.mud, this.agentPos[String.fromCharCode(97+i)].x - (this.size/2), 0, this.size, this.size/2);
            }
            
        }
    }

}


export class MuddyChildren extends ExampleDescription {
    readonly nbChildren;

    constructor(nbChildren: number) {
        super();
        this.nbChildren = nbChildren;
    }
    getDescription(): string[] {
        return [this.nbChildren + " children play in the garden and some of them become muddy. Their father comes and say 'At least one of you has mud on her forehead'. He then asks several times 'Does any one of you know whether she has mud on her forehead?'"]
    }
    getAtomicPropositions(): string[] {
        let A = [];
        for (let i = 1; i <= this.nbChildren; i++) {
            A.push("m"+String.fromCharCode(96+i));
        }
        return A;
    }
    getName() {return (this.nbChildren.toString()) + " Muddy Children"};

    generateallstrings(n:number) : string[] {
        if (n <= 0) {
            return [];
        }
        else if (n == 1) {
            return ["0","1"]
        }
        else {
            let A = this.generateallstrings(n-1);
            let B = [];
            for (let i = 0; i < A.length; i++) {
                B.push(A[i]+"0");
                B.push(A[i]+"1");
            }
            return B;
        }
    }
    getInitialEpistemicModel() {
        let M = new ExplicitEpistemicModel();

        let A = this.generateallstrings(this.nbChildren);
        console.log(A);
        for (let i = 0; i < A.length; i++) {
            let v : Map<string, boolean> = new Map();
            for (let k = 0; k <= A[i].length; k++) {
                v.set("m"+String.fromCharCode(97+k), (A[i].charAt(k) == '1'))
            }
            M.addWorld("w"+A[i], new MuddyChildrenWorld(Valuation.buildFromMap(v), this.nbChildren));
        }
        console.log(M.getNodes);
       /* M.addWorld("w", new MuddyChildrenWorld(new Valuation({ "ma": true, "mb": true }), this.nbChildren));
        M.addWorld("u", new MuddyChildrenWorld(new Valuation({ "ma": false, "mb": true }), this.nbChildren));
        M.addWorld("t", new MuddyChildrenWorld(new Valuation({ "ma": false, "mb": false }), this.nbChildren));
        M.addWorld("s", new MuddyChildrenWorld(new Valuation({ "ma": true, "mb": false }), this.nbChildren));


        M.setPointedWorld("w");

        M.addEdgesCluster("a", ["w", "u"]);
        M.addEdgesCluster("a", ["s", "t"]);
        M.addEdgesCluster("b", ["w", "s"]);
        M.addEdgesCluster("b", ["t", "u"]); */

        for (let i = 0; i < this.nbChildren; i++) {
            let Av = this.generateallstrings(i);
            let Ap = this.generateallstrings(this.nbChildren-(i+1))
            if (Av.length == 0) {
                Av.push("")
            }
            if (Ap.length == 0) {
                Ap.push("")
            }
            console.log(Av)
            console.log(Ap)
            console.log("(-------------------)")
            for (let iav = 0; iav < Av.length; iav++) {
                for (let iap = 0; iap < Ap.length; iap++) {
                    console.log((String.fromCharCode(97+i), ["w"+Av[iav]+"0"+Ap[iap], "w"+Av[iav]+"1"+Ap[iap]]))
                    M.addEdgesCluster(String.fromCharCode(97+i), ["w"+Av[iav]+"0"+Ap[iap], "w"+Av[iav]+"1"+Ap[iap]])
                } 
            }
        }
        let winitial = "w"
        for (let i = 0; i < this.nbChildren; i++) {
            winitial += "1"
        }
        M.setPointedWorld(winitial);
        return M;
    }

    getActions() {
        let fatherann = "ma"
        let donotknowann = "(not (K a ma))"
        for (let i = 1; i < this.nbChildren; i++) {
            fatherann += " or m" + String.fromCharCode(97+i)
            donotknowann += " and (not (K "+String.fromCharCode(97+i) + " m"+String.fromCharCode(97+i)+"))"
        }
        fatherann = "("+fatherann+")" 
        donotknowann = "("+donotknowann+")"
        console.log(fatherann)
        console.log(donotknowann)
        return [new EventModelAction({name: "Father says at least one child is muddy.", 
                eventModel: ExplicitEventModel.getEventModelPublicAnnouncement(FormulaFactory.createFormula(fatherann))}),
                
                new EventModelAction({name: "Publicly a is muddy!", 
                eventModel: ExplicitEventModel.getEventModelPublicAnnouncement(FormulaFactory.createFormula("ma"))}),

                new EventModelAction({name: "Children say they do not know.", 
                eventModel: ExplicitEventModel.getEventModelPublicAnnouncement(FormulaFactory.createFormula(donotknowann))})


               
                ];
    }

/*
function setExampleMuddyChildren() {
    M = getMuddyChildrenInitialEpistemicModel();

    $('#panelExampleFormulas').html('Example of formulas: '
        + "<ul><li>(ma or mb)</li>" +
        "<li>((not (K a ma)) and (not (K b mb)))</li>" +
        "</ul>");

    addExplanation("Two children (agents a and b) are playing in the grass. They see each other but they do not know whether they are muddy or not. This situation is common knowledge.",
        "(not (K a (K b (ma or mb))))");


    addAction({
        label: "Father says at least one child is muddy.",
        precondition: "((ma or mb) and (not (K a (K b (ma or mb)))))",
        actionModel: actionMuddyChildrenFather(),
        message: "at least one of you is muddy",
        saidby: "c"
    });


    addExplanation("Now, both children learned that they are muddy. Could you figure it out?",
        "((K a ma) and (K b mb))");

    addAction({
        label: "Children say they do not know.",
        precondition: "((not (K a ma)) and (not (K b mb)))",
        actionModel: actionMuddyChildrenDoNotKnow(),
        message: "I do not know whether I am muddy or not",
        saidby: "ab"
    });

    addAction({
        label: "Children say they know.",
        precondition: "((K a ma) and (K b mb))",
        actionModel: actionMuddyChildrenKnow(),
        message: "I know that I am muddy",
        saidby: "ab"
    });


    addAction({
        label: "We secretly inform child a that she is muddy.",
        precondition: "(ma and (not (K a ma)))",
        actionModel: getActionModelPrivateAnnouncement("ma", "a", ["a", "b"])
    });

    for (let a of ["a", "b"]) {
        addAction({
            label: "Child " + a + " cleans himself",
            precondition: "m" + a,
            actionModel: actionMuddyChildrenClean(a)
        });
    }


    for (let a of ["a", "b"]) {
        addAction({
            label: "Child " + a + " makes unconsciensly himself muddy",
            precondition: "top",
            actionModel: actionMuddyChildrenDirty(a)
        });
    }







    compute();
    computeButtonsVisibleOrNot();

}

let actionMuddyChildrenFather = () => getActionModelPublicAnnouncement("(ma or mb)", ["a", "b"]);
let actionMuddyChildrenDoNotKnow = () => getActionModelPublicAnnouncement("((not (K a ma)) and (not (K b mb)))", ["a", "b"]);
let actionMuddyChildrenKnow = () => getActionModelPublicAnnouncement("((K a ma) and (K b mb))", ["a", "b"]);

function actionMuddyChildrenClean(a) {
    let A = new ActionModel();
    let post = {};
    post["m" + a] = false;
    A.addAction("e", "top", post);
    A.makeReflexiveRelation("a");
    A.makeReflexiveRelation("b");
    A.setPointedAction("e");
    return A;
}


function actionMuddyChildrenDirty(a) {
    let b = (a == "a") ? "b" : "a";
    let A = new ActionModel();
    let post = {};
    post["m" + a] = true;
    A.addAction("e", "top", post);
    A.addAction("e'", "top");
    A.makeReflexiveRelation("a");
    A.makeReflexiveRelation("b");
    A.addEdge(a, "e", "e'");
    A.setPointedAction("e");
    return A;
}

*/
}
