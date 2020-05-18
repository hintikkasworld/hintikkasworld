import { ExampleDescription } from './../../../core/models/environment/exampledescription';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

@Component({
    selector: 'app-example',
    templateUrl: './example.component.html',
    styleUrls: ['./example.component.css'],
})
export class ExampleComponent implements OnInit {
    @Input() exampleDescription: ExampleDescription;
    @ViewChild('canvas', { read: ElementRef, static: true }) canvas: ElementRef;

    constructor() {}

    ngOnInit() {}

    ngAfterViewInit() {
        let canvas = this.canvas.nativeElement as HTMLCanvasElement;
        canvas.width = 128;
        canvas.height = 64;
        let ctx = canvas.getContext('2d');
        let world = this.exampleDescription.getWorldExample();
        setTimeout(() => world.draw(ctx), 500);
    }
}
