import * as d3 from 'd3';

export class Node implements d3.SimulationNodeDatum {
    index: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
    
    id: string;
    text: string;

    constructor(id, text) {
        this.id = id;
        this.text= text;
    }
}
