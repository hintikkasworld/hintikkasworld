import { environment } from 'src/environments/environment';

import { Component, Input, OnInit } from '@angular/core';
import { Edge } from '../../../services/models/edge';

@Component({
    selector: '[app-edge]',
    templateUrl: './edge.component.html',
    styleUrls: ['./edge.component.css'],
})
export class EdgeComponent implements OnInit {
    @Input('app-edge') edge: Edge;
    environment = environment; // so that the environment (especially the colors of agents) are accessible from the HTML file

    /**
     * returns the path code to be put in the d attribute of the <path></path> that is the line of the edge
     */
    getPathAttributeD() {
        let factorCurve = { a: 1, b: 1.8, c: 2.6, d: 3 };
        let x1 = this.edge.source.x;
        let y1 = this.edge.source.y;
        let x2 = this.edge.target.x;
        let y2 = this.edge.target.y;

        let dx = this.edge.target.x - this.edge.source.x,
            dy = this.edge.target.y - this.edge.source.y,
            dr = Math.sqrt(dx * dx + dy * dy) * factorCurve[this.edge.agent];

        if (dx == 0 && dy == 0) {
            let factorCurve = { a: 1, b: 1, c: 1.3, d: 1.5 };
            let xRotation = 0;

            // Needs to be 1.
            let largeArc = 1;
            let sweep;

            // Change sweep to change orientation of loop.
            if (this.edge.agent == 'a') {
                sweep = 0;
            } else {
                sweep = 1;
            }

            // Make drx and dry different to get an ellipse
            // instead of a circle.
            let drx = 8 * factorCurve[this.edge.agent];
            let dry = 8 * factorCurve[this.edge.agent];

            // For whatever reason the arc collapses to a point if the beginning
            // and ending points of the arc are the same, so kludge it.
            x2 = x2 + 1;
            y2 = y2 + 1;

            return 'M' + x1 + ',' + y1 + 'A' + drx + ',' + dry + ' ' + xRotation + ',' + largeArc + ',' + sweep + ' ' + x2 + ',' + y2;
        }
        return (
            'M' +
            this.edge.source.x +
            ',' +
            this.edge.source.y +
            'A' +
            dr +
            ',' +
            dr +
            ' 0 0,1 ' +
            this.edge.target.x +
            ',' +
            this.edge.target.y
        );
    }

    /**
     * path for the arrow
     */
    getPathArrowAttributeD() {
        const factorAngle = { a: 0.45, b: 0.2, c: 0.15, d: 0.1 };
        const x1 = this.edge.source.x;
        const y1 = this.edge.source.y;
        const x2 = this.edge.target.x;
        const y2 = this.edge.target.y;

        const dx = this.edge.target.x - this.edge.source.x,
            dy = this.edge.target.y - this.edge.source.y;

        if (dx == 0 && dy == 0) {
            return '';
        }
        const arrowLength = 16;
        const arrowAngle = 0.25;
        const angle = Math.atan2(y2 - y1, x2 - x1) + factorAngle[this.edge.agent];
        const x2a = x2 - arrowLength * Math.cos(angle - arrowAngle);
        const y2a = y2 - arrowLength * Math.sin(angle - arrowAngle);
        const x2b = x2 - arrowLength * Math.cos(angle + arrowAngle);
        const y2b = y2 - arrowLength * Math.sin(angle + arrowAngle);
        return 'M' + x2a + ',' + y2a + 'L' + x2 + ', ' + y2 + 'L' + x2b + ',' + y2b;
    }

    constructor() {}

    ngOnInit() {}
}
