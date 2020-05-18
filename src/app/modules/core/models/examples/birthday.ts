import { FormulaFactory } from './../formula/formula';
import { ExplicitEventModel } from './../eventmodel/explicit-event-model';
import { EventModelAction } from './../environment/event-model-action';
import { Environment } from './../environment/environment';
import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { EpistemicModel } from './../epistemicmodel/epistemic-model';
import { WorldValuation } from '../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';

class Date {
    day: number;
    month: string;
}

class BirthdayWorld extends WorldValuation {
    date: Date;

    static dateToProposition(date: Date): string {
        return date.day + date.month;
    }

    static getFullMonth(date) {
        if (date.month == 'm') {
            return 'May';
        }
        if (date.month == 'j') {
            return 'June';
        }
        if (date.month == 'jl') {
            return 'July';
        }
        if (date.month == 'a') {
            return 'August';
        }
    }

    constructor(date: Date) {
        super(new Valuation([BirthdayWorld.dateToProposition(date), date.month, date.day + '']));
        this.agentPos['a'] = { x: 24, y: 32, r: 24 };
        this.agentPos['b'] = { x: 128 - 24, y: 32, r: 24 };
        this.agentPos['c'] = undefined;
        this.date = date;
    }

    drawDate(context: CanvasRenderingContext2D, x: number, y: number, date: Date) {
        let w2 = 28;
        let h2 = 32;
        context.lineWidth = 1;
        context.fillStyle = '#FFFFFF';
        context.strokeStyle = '#000000';
        BirthdayWorld.roundRect(context, x - w2, y - h2, 2 * w2, 2 * h2, 5, true, true);

        context.fillStyle = '#FF0000';
        context.strokeStyle = '#000000';
        BirthdayWorld.roundRect(context, x - w2, y - h2, 2 * w2, 20, 5, true, true);

        context.font = '14px Verdana';
        context.fillStyle = '#FFFFFF';
        context.fillText(
            BirthdayWorld.getFullMonth(date),
            x - context.measureText(BirthdayWorld.getFullMonth(date)).width / 2,
            y - h2 + 14
        );

        context.font = '24px Verdana';
        context.fillStyle = '#000000';
        context.fillText(date.day + '', x - context.measureText(date.day + '').width / 2, y + 16);
    }

    draw(context) {
        this.drawDate(context, 64, 32, this.date);

        this.drawAgents(context);
    }
}

export class Birthday extends ExampleDescription {
    constructor(personName: string, dates: Date[], date: Date) {
        super();
        this.dates = dates;
        this.date = date;
        this.personName = personName;
    }

    private readonly dates: Date[];
    private readonly date: Date;
    private readonly personName: string;

    getAtomicPropositions(): string[] {
        return this.dates.map(BirthdayWorld.dateToProposition);
    }

    getDescription(): string[] {
        return [
            "Both agents want to know Cheryl's birthday, but have a partial knowledge about the date:",
            '- They know that the possibilities are May 15, May 16, May 19, June 17, June 18, July 14, July 16, August 14, August 15 or August 17.',
            '- Agent a knows the month.',
            '- Agent b knows the day.',
            'Agent a announces that she does not know the date but she knows that Agent b does not know either. Then Agent b announces that he now knows the date. What is this date?',
        ];
    }

    getName() {
        return this.personName + "'s birthday";
    }

    getInitialEpistemicModel(): EpistemicModel {
        let M = new ExplicitEpistemicModel();

        for (let date of this.dates) {
            M.addWorld('w' + BirthdayWorld.dateToProposition(date), new BirthdayWorld(date));
        }

        M.addEdgeIf('a', function (n1: BirthdayWorld, n2: BirthdayWorld) {
            return n1.date.month == n2.date.month;
        });
        M.addEdgeIf('b', function (n1: BirthdayWorld, n2: BirthdayWorld) {
            return n1.date.day == n2.date.day;
        });

        M.setPointedWorld('w' + BirthdayWorld.dateToProposition(this.date));
        return M;
    }

    getActions() {
        let phi =
            '((not( (K a 15m) or (K a 16m) or (K a 19m) or (K a 17j) or (K a 18j) or (K a 14jl) or (K a 16jl) or (K a 14a) or (K a 15a) or (K a 17a) )) and (K a 		( not( (K b 15m) or (K b 16m) or (K b 19m) or (K b 17j) or (K b 18j) or (K b 14jl) or (K b 16jl) or (K b 14a) or (K b 15a) or (K b 17a)  ))))';
        let bKnowsDate =
            '((K b 15m) or (K b 16m) or (K b 19m) or (K b 17j) or (K b 18j) or (K b 14jl) or (K b 16jl) or (K b 14a) or (K b 15a) or (K b 17a))';
        let aKnowsDate = '( (K a 16jl) or (K a 15a) or (K a 17a) )';

        return [
            new EventModelAction({
                name: "Agent a says he doesn't know the birthday and he knows Bernard doesn’t know either.",
                eventModel: ExplicitEventModel.getEventModelPublicAnnouncement(FormulaFactory.createFormula(phi)),
            }),

            new EventModelAction({
                name: 'Agent b says he knows the birthday.',
                eventModel: ExplicitEventModel.getEventModelPublicAnnouncement(FormulaFactory.createFormula(phi)),
            }),

            new EventModelAction({
                name: 'Agent a says he knows the birthday.',
                eventModel: ExplicitEventModel.getEventModelPublicAnnouncement(FormulaFactory.createFormula(aKnowsDate)),
            }),
        ];
    }

    getWorldExample(): WorldValuation {
        return new BirthdayWorld(this.date);
    }

    onRealWorldClick(env: Environment, point: any): void {}
}
