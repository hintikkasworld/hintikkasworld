import { Birthday } from './birthday';

export class Cherylsbirthday extends Birthday {
    constructor() {
        super("Cheryl", [{day: 15, month: "m"},
        {day: 16, month: "m"},
        {day: 19, month: "m"},
        {day: 17, month: "j"},
        {day: 18, month: "j"},
        {day: 14, month: "jl"},
        {day: 16, month: "jl"},
        {day: 14, month: "a"},
        {day: 15, month: "a"},
        {day: 17, month: "a"}], {day: 16, month: "jl"});
    }
}