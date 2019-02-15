import { WorldValuation } from '../epistemicmodel/world-valuation';
import { ExampleDescription } from './exampledescription';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';


/**
 * @param truePropositions an array of true propositions. Proposition "ma" stands for "a is muddy" and "mb" stands for "b is muddy".
 * @returns a state corresponding to the muddy children puzzle
 * @example new MuddyChildrenWorld(["ma", "mb"])
 * */
class MuddyChildrenWorld extends WorldValuation {
    static mud = MuddyChildrenWorld.getMudImage();

    static getMudImage() {
        let mud = new Image();
        mud.src = "img/mud.png";
        return mud;
    }

    constructor(propositions) {
        super(propositions);
        this.agentPos["a"] = { x: 32, y: 32, r: 32 };
        this.agentPos["b"] = { x: 64 + 32, y: 32, r: 32 };
        this.agentPos["c"] = undefined;
    }

    draw(context) {
        this.drawAgents(context);

        if (this.modelCheck("ma"))
            context.drawImage(MuddyChildrenWorld.mud, 16, 0, 32, 16);

        if (this.modelCheck("mb"))
            context.drawImage(MuddyChildrenWorld.mud, this.agentPos["b"].x - 16, 0, 32, 16);
    }

}


export class MuddyChildren implements ExampleDescription {

    getInitialEpistemicModel() {
        let M = new ExplicitEpistemicModel();

        M.addWorld("w", new MuddyChildrenWorld({ "ma": true, "mb": true }));
        M.addWorld("u", new MuddyChildrenWorld({ "ma": false, "mb": true }));
        M.addWorld("t", new MuddyChildrenWorld({ "ma": false, "mb": false }));
        M.addWorld("s", new MuddyChildrenWorld({ "ma": true, "mb": false }));


        M.setPointedWorld("w");

        M.addEdgesCluster("a", ["w", "u"]);
        M.addEdgesCluster("a", ["s", "t"]);
        M.addEdgesCluster("b", ["w", "s"]);
        M.addEdgesCluster("b", ["t", "u"]);

        return M;
    }

    getActions() {
        return [];
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
